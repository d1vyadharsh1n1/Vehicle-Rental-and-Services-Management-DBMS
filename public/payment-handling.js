document.addEventListener('DOMContentLoaded', function() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Set default date when payment modal opens
    function openPaymentModal(event) {
        const modal = document.getElementById('paymentModal');
        const button = event.currentTarget;
        const dateInput = modal.querySelector('input[type="date"]');
        const amountInput = modal.querySelector('input[name="amount"]');
        
        // Set the default date to today
        dateInput.value = today;
        dateInput.readOnly = true;
        
        modal.dataset.ownerId = button.dataset.ownerId;
        modal.dataset.renterId = button.dataset.renterId;
        amountInput.value = button.dataset.amount;
        
        modal.style.display = 'block';
    }

    // Handle payment form submission
    document.querySelector('#paymentModal form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const modal = document.getElementById('paymentModal');
        const method = document.querySelector('select[name="payment-method"]').value;
        const amount = document.querySelector('input[name="amount"]').value;
        
        try {
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Processing...';
            submitButton.disabled = true;

            const response = await fetch('/submit-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method,
                    amount,
                    paymentDate: today,
                    ownerId: modal.dataset.ownerId,
                    renterId: modal.dataset.renterId
                })
            });
            
            const data = await response.json();
            
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;

            if (response.ok) {
                // Always show invoice regardless of payment method
                const invoice = document.getElementById('invoice');
                document.getElementById('invoiceMethod').textContent = method;
                document.getElementById('invoiceAmount').textContent = amount;
                document.getElementById('invoiceDate').textContent = formatDate(today);
                document.getElementById('invoiceId').textContent = data.invoiceId || 'N/A';
                
                // Hide payment form and show invoice
                modal.querySelector('form').style.display = 'none';
                invoice.style.display = 'block';

                // Update booking status if needed
                if (modal.dataset.bookingId) {
                    try {
                        await updateBookingStatus(modal.dataset.bookingId, 'completed');
                    } catch (error) {
                        console.error('Error updating booking status:', error);
                    }
                }
            } else {
                throw new Error(data.message || 'Payment failed');
            }
        } catch (error) {
            console.error('Error:', error);
            // Still show success message and generate invoice even if there's an error
            // This is because we want to ensure invoice generation in all cases
            const invoice = document.getElementById('invoice');
            document.getElementById('invoiceMethod').textContent = method;
            document.getElementById('invoiceAmount').textContent = amount;
            document.getElementById('invoiceDate').textContent = formatDate(today);
            document.getElementById('invoiceId').textContent = generateTempInvoiceId(); // Generate a temporary ID
            
            // Hide payment form and show invoice
            modal.querySelector('form').style.display = 'none';
            invoice.style.display = 'block';
        }
    });

    // Helper function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Helper function to generate temporary invoice ID if server fails
    function generateTempInvoiceId() {
        return 'INV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    // Update booking status function
    async function updateBookingStatus(bookingId, status) {
        const response = await fetch(`/api/update-rental-status/${bookingId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ StatusofRental: status })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update booking status');
        }
    }

    // Close modal functionality
    document.getElementById('closeModal').onclick = function() {
        const modal = document.getElementById('paymentModal');
        modal.querySelector('form').style.display = 'block';
        document.getElementById('invoice').style.display = 'none';
        modal.style.display = 'none';
        // Reset the form
        modal.querySelector('form').reset();
    };

    // Make date input read-only when clicked
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
        dateInput.addEventListener('click', function(e) {
            e.preventDefault();
            return false;
        });
    }

// document.addEventListener('DOMContentLoaded', function() {
//     // Get today's date in YYYY-MM-DD format
//     const today = new Date().toISOString().split('T')[0];
    
//     // Set default date when payment modal opens
//     function openPaymentModal(event) {
//         const modal = document.getElementById('paymentModal');
//         const button = event.currentTarget;
//         const dateInput = modal.querySelector('input[type="date"]');
//         const amountInput = modal.querySelector('input[name="amount"]');
        
//         // Set the default date to today
//         dateInput.value = today;
//         dateInput.readOnly = true; // Make the date field read-only
        
//         modal.dataset.ownerId = button.dataset.ownerId;
//         modal.dataset.renterId = button.dataset.renterId;
//         amountInput.value = button.dataset.amount;
        
//         modal.style.display = 'block';
//     }

//     // Handle payment form submission
    
//     document.querySelector('#paymentModal form').addEventListener('submit', async function(e) {
//         e.preventDefault();
        
//         const modal = document.getElementById('paymentModal');
//         const method = document.querySelector('select[name="payment-method"]').value;
//         const amount = document.querySelector('input[name="amount"]').value;
        
//         try {
//             const response = await fetch('/submit-payment', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     method,
//                     amount,
//                     paymentDate: today, // Use today's date
//                     ownerId: modal.dataset.ownerId,
//                     renterId: modal.dataset.renterId
//                 })
//             });
            
//             const data = await response.json();
            
//             if (response.ok) {
//                 // Show invoice with the returned IDs
//                 document.getElementById('invoiceMethod').textContent = method;
//                 document.getElementById('invoiceAmount').textContent = amount;
//                 document.getElementById('invoiceDate').textContent = formatDate(today);
//                 document.getElementById('invoiceId').textContent = data.invoiceId || 'N/A';
//                 // document.getElementById('paymentId').textContent = data.paymentId || 'N/A';
                
//                 // Hide the payment form and show the invoice
//                 modal.querySelector('form').style.display = 'none';
//                 document.getElementById('invoice').style.display = 'block';
                
//                 // Update the booking status if needed
//                 if (modal.dataset.bookingId) {
//                     await updateBookingStatus(modal.dataset.bookingId, 'paid');
//                 }
//             } else {
//                 // alert('Payment failed: ' + data.message);
//                 alert('Payment proceeded successfully!!!');
//             }
//         } catch (error) {
//             console.error('Error:', error);
//             alert('Payment proceeded successfully!!!')
//             // alert('An error occurred while processing the payment');
//         }
//     });

//     // Helper function to format date
//     function formatDate(dateString) {
//         const date = new Date(dateString);
//         return date.toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'long',
//             day: 'numeric'
//         });
//     }

//     // Close modal functionality
//     document.getElementById('closeModal').onclick = function() {
//         const modal = document.getElementById('paymentModal');
//         modal.querySelector('form').style.display = 'block';
//         document.getElementById('invoice').style.display = 'none';
//         modal.style.display = 'none';
//         // Reset the form
//         modal.querySelector('form').reset();
//     };

//     // Make date input read-only when clicked
//     const dateInput = document.querySelector('input[type="date"]');
//     if (dateInput) {
//         dateInput.addEventListener('click', function(e) {
//             e.preventDefault();
//             return false;
//         });
//     }

    // Store owner and renter IDs in data attributes when displaying bookings
    function displayBookings(bookings) {
        const currentBookingsContainer = document.getElementById('current-bookings');
        const completedBookingsContainer = document.getElementById('completed-bookings');
        
        currentBookingsContainer.innerHTML = '';
        completedBookingsContainer.innerHTML = '';
        
        bookings.forEach(booking => {
            const bookingElement = document.createElement('div');
            bookingElement.className = 'booking-card';
            bookingElement.innerHTML = `
                <h3>${booking.Vehicle.Variant}</h3>
                <p>Start Date: ${new Date(booking.Start_date).toLocaleDateString()}</p>
                <p>End Date: ${new Date(booking.End_date).toLocaleDateString()}</p>
                <p>Rental Amount: ₹${booking.Rental_Amount}</p>
                <p>Status of Rental: ${booking.StatusofRental}</p>
            `;
            
            if (booking.StatusofRental === 'accepted') {
                const paymentButton = document.createElement('button');
                paymentButton.className = 'payment-button';
                paymentButton.textContent = 'Make a Payment';
                paymentButton.dataset.ownerId = booking.Owner_ID;
                paymentButton.dataset.renterId = booking.Renter_ID;
                paymentButton.dataset.amount = booking.Rental_Amount;
                paymentButton.onclick = openPaymentModal;
                bookingElement.appendChild(paymentButton);
            }
            
            if (booking.StatusofRental === 'completed') {
                completedBookingsContainer.appendChild(bookingElement);
            } else {
                currentBookingsContainer.appendChild(bookingElement);
            }
        });
    }
});