# Vehicle Rental Management System

## Overview  
The Vehicle Rental Management System simplifies the process of renting vehicles by connecting renters and owners. Renters can browse available vehicles and make bookings, while owners can list their vehicles for rent. The system is designed to ensure seamless interaction between the two user types.

## Documentation 
A detailed PDF explaining the project's workflow, along with photos and examples, is available in the repository. Refer to it for an in-depth understanding of the system.

## Features  

- **User Roles**:  
  - **Renter**:  
    - Search and browse available vehicles.  
    - Book vehicles for specified durations.  
    - View and manage their booking history.  
  - **Owner**:  
    - List vehicles for rent with details such as type, brand, price, and availability.  
    - Update or remove vehicle listings.  
    - View rental requests for their vehicles.  

- **Booking System**:  
  - Real-time availability check for vehicles.  
  - Instant booking confirmation and notification.  

- **Payment Processing**:  
  - Calculate rental costs based on duration and vehicle type using ml model.  


## Installation  

1. Clone the repository:  
   ```bash
   git clone https://github.com/H432a/vehicle-rental-management-system.git
   cd vehicle-rental-management-system
   ```

2. Install dependencies:  
   ```bash
   npm install   
   pip install -r requirements.txt  
   ```

3. Configure the database:  
   - Create a database and update the `config` file with your database credentials.  

4. Run the application:  
   ```bash
   npm start      
   python app.py  
   ```
   
5. Access the system at:  
   `http://localhost:5000`  


## Contributing  
Contributions are welcome!  
- Fork the repository.  
- Create a new branch for your feature/bug fix.  
- Submit a pull request.  

## License  
This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments  
Special thanks to all contributors and supporters of this project.
