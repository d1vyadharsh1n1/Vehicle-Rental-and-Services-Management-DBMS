const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session"); // Import express-session
const { v4: uuidv4 } = require("uuid"); // Import UUID
const { exec } = require("child_process"); 

const app = express();

dotenv.config({ path: "./.env" });
console.log("DB_HOST:", process.env.DATABASE_HOST);
console.log("DB_USER:", process.env.DATABASE_ROOT);
console.log("DB_PASS:", process.env.DATABASE_PASSWORD);
console.log("DB_NAME:", process.env.DATABASE);

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_ROOT,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("MySQL connected!");
  }
});

// Initialize session middleware
app.use(
  session({
    secret: "your_secret_key", // Replace with a random secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // For production, use true with HTTPS
  })
);

const publicDir = path.join(__dirname, "./public");
app.use(express.static(publicDir)); // Serving static HTML files

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve index.html with session check for username
app.get("/", (req, res) => {
  if (req.session.username) {
    res.send(
      `<h1>Hi, ${req.session.username}</h1>
      <a href="/logout">Logout</a>`
    );
  } else {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

// Serve register.html
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Serve the login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/add-vehicle", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add-vehicle.html"));
});

// Serve the view bookings page
app.get("/make-bookings", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "make-bookings.html"));
});

app.get("/view-bookings", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "view-bookings.html"));
});

app.get("/view-requests", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "view-requests.html"));
});

// Handle user registration
app.post("/auth/register", async (req, res) => {
  const {
    User_Name,
    Email,
    Pass_word,
    DOB,
    Address,
    Mobile_Number,
    role,
    DriverLicense,
  } = req.body;
  const User_ID = uuidv4(); // Generate a unique User_ID
  const Renter_ID = uuidv4();
  const Owner_ID = uuidv4();

  db.query(
    "SELECT Email FROM User WHERE Email = ?",
    [Email],
    (error, result) => {
      if (error) {
        console.log(error);
        return res.redirect("/register?message=An%20error%20occurred");
      }

      if (result.length > 0) {
        return res.redirect(
          "/register?message=This%20email%20is%20already%20in%20use"
        );
      }

      db.query(
        "INSERT INTO User SET ?",
        { User_ID, User_Name, Email, DOB, Pass_word, Address },
        (err, result) => {
          if (err) {
            console.log(err);
            return res.redirect("/register?message=An%20error%20occurred");
          }

          const mobileNumbers = Array.isArray(Mobile_Number)
            ? Mobile_Number
            : [Mobile_Number];
          mobileNumbers.forEach((number) => {
            if (number) {
              db.query(
                "INSERT INTO User_MobileNumber SET ?",
                { Mobile_Number: number, User_ID },
                (err, result) => {
                  if (err) {
                    console.log(err);
                  }
                }
              );
            }
          });
          console.log("Role:", role);
          console.log("DriverLicense:", DriverLicense);
          // Check the role of the user
          if (role === "owner") {
            const Owner_ID = uuidv4(); // Generate Owner ID
            db.query(
              "INSERT INTO Owners SET ?",
              { Owner_ID, User_ID },
              (err, result) => {
                if (err) {
                  console.log(err);
                }
              }
            );
          } else if (role === "renter") {
            const Renter_ID = uuidv4(); // Generate Renter ID
            db.query(
              "INSERT INTO Renter SET ?",
              { Renter_ID, User_ID, DriverLicense },
              (err, result) => {
                if (err) {
                  console.log(err);
                }
              }
            );
          }

          // Set session with username after registration
          req.session.username = User_Name;
          req.session.role = role;

          // Redirect to the index page
          return res.redirect("/");
        }
      );
    }
  );
});

app.post("/auth/login", (req, res) => {
  const { Email, Pass_word } = req.body;
  console.log("Login attempt with email:", Email);

  db.query(
    "SELECT * FROM User WHERE Email = ? AND Pass_word = ?",
    [Email, Pass_word],
    (error, result) => {
      if (error) {
        console.log("Error in first query:", error);
        return res.redirect("/login?message=An%20error%20occurred");
      }

      if (result.length > 0) {
        const User_ID = result[0].User_ID;
        const User_Name = result[0].User_Name;
        console.log("User found:", User_Name);

        // Check if user is in Owners table
        db.query(
          "SELECT * FROM Owners WHERE User_ID = ?",
          [User_ID],
          (err, ownerResult) => {
            if (err) {
              console.log("Error in Owners query:", err);
              return res.redirect("/login?message=An%20error%20occurred");
            }

            console.log("Owner query result:", ownerResult); // Debugging line

            if (ownerResult.length > 0) {
              req.session.role = "owner";
              req.session.username = User_Name;
              req.session.ownerId = ownerResult[0].Owner_ID; // Ensure this is set
              console.log("User is an owner, redirecting...");
              return res.redirect("/"); // Redirect after setting the session
            } else {
              // Check if user is in Renter table
              db.query(
                "SELECT * FROM Renter WHERE User_ID = ?",
                [User_ID],
                (err, renterResult) => {
                  if (err) {
                    console.log("Error in Renter query:", err);
                    return res.redirect("/login?message=An%20error%20occurred");
                  }

                  console.log("Renter query result:", renterResult); // Debugging line

                  if (renterResult.length > 0) {
                    req.session.role = "renter";
                    req.session.username = User_Name; // Ensure this is set
                    req.session.renterId = renterResult[0].Renter_ID;
                    console.log("User is a renter, redirecting...");
                    return res.redirect("/"); // Redirect after setting the session
                  } else {
                    req.session.role = "guest"; // Fallback role
                    console.log(
                      "No specific role found for user, redirecting as guest"
                    );
                    req.session.username = User_Name; // Set username
                    return res.redirect("/"); // Redirect for guest
                  }
                }
              );
            }
          }
        );
      } else {
        // If login fails, redirect to login page with an error message
        console.log("Invalid login credentials");
        return res.redirect("/login?message=Invalid%20credentials");
      }
    }
  );
});

app.post("/add-vehicle", (req, res) => {
  const { Seater, AC_Type, Fuel, Fastag, Distance, Yr, Variant, rand } =
    req.body;
  const Vehicle_ID = uuidv4(); // Generate unique vehicle ID
  const Owner_ID = req.session.ownerId; // Get Owner_ID from session

  db.query(
    "INSERT INTO Vehicle SET ?",
    {
      Vehicle_ID,
      Owner_ID, // Use Owner_ID instead of User_ID
      Seater,
      AC_Type,
      Fuel,
      Fastag,
      Distance,
      Yr,
      Variant,
      rand,
    },
    
    (error, result) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to add vehicle." });
      }
      console.log("Vehicle added successfully. Now predicting rental...");
      const { spawn } = require('child_process');
      //this should be the addess of the python train file.
      const pythonProcess = spawn('python', ['C:\\Users\\eniya\\Vehicle-Rental-and-Services-Management-DBMS-1\\Vehicle-Rental-and-Services-Management-DBMS\\dbms\\traindata.py', Vehicle_ID]);
      
      pythonProcess.stdout.on('data', (data) => {
        console.log("Received data from Python:", data.toString());
        const output = data.toString().trim();
        const predictedRental = parseFloat(output);
        console.log("Predicted Rate:", predictedRental);
        // Update the vehicle record with the predicted rental amount
        db.query(
          "UPDATE Vehicle SET Rate = ? WHERE Vehicle_ID = ?",
          [predictedRental, Vehicle_ID],
          (err, updateResult) => {
            if (err) {
              console.log(err);
              return res.status(500).json({ message: "Failed to update rental amount." });
            }
            return res.status(200).json({ message: "Vehicle added successfully and rental amount updated." });
          }
        );
        
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        return res.status(500).json({ message: "Error predicting rental amount." });
      });
    }
  );
});

// Route to get all vehicles
app.get("/api/vehicles", (req, res) => {
  db.query("SELECT * FROM Vehicle", (error, results) => {
    if (error) {
      console.error("Error fetching vehicles:", error);
      return res.status(500).json({ message: "Failed to fetch vehicles." });
    }
    res.json(results);
  });
});

//for getting rate
  app.get('/api/vehicle-Rate/:vehicleId', (req, res) => {
    const { vehicleId } = req.params;
  
    // Callback style query
    db.query('SELECT Rate FROM vehicle WHERE Vehicle_ID = ?', [vehicleId], (error, results) => {
      if (error) {
        console.error('Error fetching rental amount:', error);
        return res.status(500).json({ message: 'Failed to fetch rental amount' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
  
      // Assuming the first row contains the rate
      const vehicle = results[0];
      console.log("Rental Amount in backend:", vehicle.Rate);
  
      // Sending back the rate in JSON format
      res.json({ rentalAmount: vehicle.Rate });
    });
  });
  


app.get("/api/rental-requests", (req, res) => {
  db.query(
    "SELECT * FROM Rental WHERE StatusofRental = 'pending'",
    (error, results) => {
      if (error) {
        console.error("Error fetching vehicles:", error);
        return res.status(500).json({ message: "Failed to fetch vehicles." });
      }
      res.json(results);
    }
  );
});

app.get("/api/bookings", (req, res) => {
  const query = `
    SELECT 
      v.*,
      r.*,
      o.Owner_ID
    FROM Vehicle v
    INNER JOIN Rental r ON v.Vehicle_ID = r.Vehicle_ID
    INNER JOIN Owners o ON v.Owner_ID = o.Owner_ID
  `;
  
  db.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching bookings:", error);
      return res.status(500).json({ message: "Failed to fetch bookings." });
    }
    
    const bookings = results.map(result => ({
      Start_date: result.Start_date,
      End_date: result.End_date,
      Rental_Amount: result.Rental_Amount,
      StatusofRental: result.StatusofRental,
      Owner_ID: result.Owner_ID,
      Renter_ID: result.Renter_ID,
      Vehicle: {
        Variant: result.Variant,
        rand: result.rand,
        Fuel: result.Fuel,
        Seater: result.Seater,
        AC_Type: result.AC_Type,
        Distance: result.Distance
      }
    }));
    
    res.json(bookings);
  });
});

// Handle booking creation
// app.post("/book-vehicle", (req, res) => {
//   const { Vehicle_ID, Start_date, End_date, Rental_Amount } = req.body;
//   const Renter_ID = req.session.renterId;
//   //console.log("Booking request body:", req.body);

//   if (!Renter_ID) {
//     return res.status(401).json({
//       message: "You must be logged in as a renter to book a vehicle.",
//     });
//   }

//   const availabilityCheckSql = `
//     SELECT COUNT(*) AS count
//     FROM Rental
//     WHERE Vehicle_ID = ? 
//       AND StatusofRental = 'accepted'
//       AND (
//         (Start_date <= ? AND End_date >= ?) OR 
//         (Start_date <= ? AND End_date >= ?) OR
//         (Start_date >= ? AND End_date <= ?)
//       )
//   `;

//   db.query(
//     availabilityCheckSql,
//     [
//       Vehicle_ID,
//       Start_date,
//       End_date,
//       Start_date,
//       End_date,
//       Start_date,
//       End_date,
//     ],
//     (error, results) => {
//       if (error) {
//         console.log("Error checking availability:", error);
//         return res
//           .status(500)
//           .json({ message: "Error checking vehicle availability." });
//       }

//       const { count } = results[0];
//       if (count > 0) {
//         // Vehicle is already booked
//         return res
//           .status(400)
//           .json({ message: "Vehicle not available during these dates." });
//       }
      
//       const Rental_ID = uuidv4(); // Generate unique rental ID

//       db.query(
//         "INSERT INTO Rental SET ?",
//         {
//           Rental_ID,
//           Renter_ID,
//           Vehicle_ID,
//           Rental_Amount,
//           Start_date,
//           End_date,
//         },
//         (error, result) => {
//           if (error) {
//             console.log("Error inserting data:", error);
//             return res.status(500).json({ message: "Failed to book vehicle." });
//           }
//           console.log("Data inserted successfully");
//           return res
//             .status(200)
//             .json({ message: "Waiting for Owner Approval." });
//         }
//       );
//     }
//   );
// });
app.post("/book-vehicle", (req, res) => {
  const { Vehicle_ID, Start_date, End_date } = req.body;
  const Renter_ID = req.session.renterId;

  if (!Renter_ID) {
    return res.status(401).json({
      message: "You must be logged in as a renter to book a vehicle.",
    });
  }

  const availabilityCheckSql = `
    SELECT COUNT(*) AS count
    FROM Rental
    WHERE Vehicle_ID = ? 
      AND StatusofRental = 'accepted'
      AND (
        (Start_date <= ? AND End_date >= ?) OR 
        (Start_date <= ? AND End_date >= ?) OR
        (Start_date >= ? AND End_date <= ?)
      )
  `;

  db.query(
    availabilityCheckSql,
    [
      Vehicle_ID,
      Start_date,
      End_date,
      Start_date,
      End_date,
      Start_date,
      End_date,
    ],
    (error, results) => {
      if (error) {
        console.log("Error checking availability:", error);
        return res
          .status(500)
          .json({ message: "Error checking vehicle availability." });
      }

      const { count } = results[0];
      if (count > 0) {
        // Vehicle is already booked
        return res
          .status(400)
          .json({ message: "Vehicle not available during these dates." });
      }

      // Fetch the Rate from the Vehicle table
      const rateQuery = `SELECT Rate FROM Vehicle WHERE Vehicle_ID = ?`;
      db.query(rateQuery, [Vehicle_ID], (error, rateResult) => {
        if (error) {
          console.log("Error fetching rate:", error);
          return res
            .status(500)
            .json({ message: "Failed to retrieve vehicle rate." });
        }

        const Rental_Amount = rateResult[0].Rate; // Use the rate as Rental_Amount
        const Rental_ID = uuidv4(); // Generate unique rental ID

        // Insert rental record with the fetched rate as Rental_Amount
        db.query(
          "INSERT INTO Rental SET ?",
          {
            Rental_ID,
            Renter_ID,
            Vehicle_ID,
            Rental_Amount,
            Start_date,
            End_date,
          },
          (error, result) => {
            if (error) {
              console.log("Error inserting data:", error);
              return res.status(500).json({ message: "Failed to book vehicle." });
            }
            console.log("Data inserted successfully");
            return res
              .status(200)
              .json({ message: "Waiting for Owner Approval." });
          }
        );
      });
    }
  );
});


app.post("/api/update-rental-status/:rentalId", (req, res) => {
  const { rentalId } = req.params; // Use rentalId from the route parameter
  const { StatusofRental } = req.body;

  console.log(`Updating rental ${rentalId} with status: ${StatusofRental}`); // Log for debugging

  // SQL Query to update status
  const query = `UPDATE Rental SET StatusofRental = ? WHERE Rental_ID = ?`;

  // Check if rentalId is valid and not undefined/null
  if (!rentalId) {
    return res.status(400).send("Rental ID is required");
  }

  // Execute the query
  db.query(query, [StatusofRental, rentalId], function (err, result) {
    if (err) {
      console.error("Error updating rental status:", err); // Log the error
      return res.status(500).send("Error updating rental status");
    }

    // Check if any rows were affected/updated
    if (result.affectedRows === 0) {
      return res.status(404).send("Rental ID not found");
    }

    res.status(200).send("Status updated successfully");
  });
});

// Check session status to display username
app.get("/session-status", (req, res) => {
  if (req.session.username) {
    res.json({
      loggedIn: true,
      username: req.session.username,
      role: req.session.role,
    });
  } else {
    res.json({ loggedIn: false });
  }
});
app.post("/submit-payment", (req, res) => {
  const { amount, renterId, ownerId, method } = req.body;
  const paymentId = uuidv4(); // Generate unique Payment ID
  const invoiceId = uuidv4(); // Generate unique Invoice ID
  const paymentDate = new Date(); // Current date for payment date

  // Validate payment method
  const validMethods = ['Credit Card', 'Debit Card', 'UPI', 'Cash'];
  if (!validMethods.includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" });
  }

  // Start a transaction to ensure both payment and invoice are created
  db.beginTransaction(function(err) {
      if (err) {
          return res.status(500).json({ message: "Transaction start failed" });
      }

      // Insert payment transaction
      db.query(
          "INSERT INTO Payment_Transactions SET ?",
          {
              Payment_ID: paymentId,
              Amount: amount,
              Payment_Date: paymentDate,
              Method: method,
              Renter_ID: renterId,
              Owner_ID: ownerId,
          },
          (error, result) => {
              if (error) {
                  return db.rollback(() => {
                      res.status(500).json({ message: "Payment insertion failed" });
                  });
              }

              // Insert invoice
              db.query(
                  "INSERT INTO Invoice SET ?",
                  {
                      Invoice_ID: invoiceId,
                      Payment_ID: paymentId,
                  },
                  (error, result) => {
                      if (error) {
                          return db.rollback(() => {
                              res.status(500).json({ message: "Invoice creation failed" });
                          });
                      }

                      // Commit the transaction
                      db.commit((err) => {
                          if (err) {
                              return db.rollback(() => {
                                  res.status(500).json({ message: "Transaction commit failed" });
                              });
                          }
                          res.status(200).json({
                              message: "Payment processed successfully",
                              invoiceId,
                              paymentId
                          });
                      });
                  }
              );
          }
      );
  });
});
// Handle user logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.redirect("/?message=Logout%20failed");
    }
    res.redirect("/login?message=Logged%20out%20successfully");
  });
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
