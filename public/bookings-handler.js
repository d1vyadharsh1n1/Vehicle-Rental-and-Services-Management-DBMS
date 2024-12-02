// First, let's modify the HTML structure
document.addEventListener('DOMContentLoaded', function() {
    // Add loading indicators
    document.getElementById('current-bookings').innerHTML = '<p>Loading current bookings...</p>';
    document.getElementById('completed-bookings').innerHTML = '<p>Loading completed bookings...</p>';

    // Function to fetch and display bookings
    async function fetchAndDisplayBookings() {
        try {
            const response = await fetch('/api/bookings');
            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }
            const bookings = await response.json();
            displayBookings(bookings);
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('current-bookings').innerHTML = '<p>Error loading current bookings</p>';
            document.getElementById('completed-bookings').innerHTML = '<p>Error loading completed bookings</p>';
        }
    }

    // Function to format date
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Function to display bookings
    function displayBookings(bookings) {
        const currentBookingsContainer = document.getElementById('current-bookings');
        const completedBookingsContainer = document.getElementById('completed-bookings');
        
        // Clear loading messages
        currentBookingsContainer.innerHTML = '';
        completedBookingsContainer.innerHTML = '';

        // Group bookings by status
        const currentBookings = bookings.filter(b => b.StatusofRental !== 'completed');
        const completedBookings = bookings.filter(b => b.StatusofRental === 'completed');

        // Display current bookings
        if (currentBookings.length === 0) {
            currentBookingsContainer.innerHTML = '<p>No current bookings</p>';
        } else {
            currentBookings.forEach(booking => {
                const card = createBookingCard(booking);
                currentBookingsContainer.appendChild(card);
            });
        }

        // Display completed bookings
        if (completedBookings.length === 0) {
            completedBookingsContainer.innerHTML = '<p>  </p>';
        } else {
            completedBookings.forEach(booking => {
                const card = createBookingCard(booking);
                completedBookingsContainer.appendChild(card);
            });
        }
    }

    // Function to create booking card
    function createBookingCard(booking) {
        const card = document.createElement('div');
        card.className = 'booking-card p-4 mb-4 border rounded shadow-sm';
        
        const statusClass = booking.StatusofRental === 'accepted' ? 'text-green-600' :
                          booking.StatusofRental === 'pending' ? 'text-yellow-600' :
                          booking.StatusofRental === 'completed' ? 'text-blue-600' : 'text-gray-600';

        card.innerHTML = `
            <h3 class="text-xl font-bold mb-2">${booking.Vehicle.Variant}</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p><strong>Start Date:</strong> ${formatDate(booking.Start_date)}</p>
                    <p><strong>End Date:</strong> ${formatDate(booking.End_date)}</p>
                    <p><strong>Amount:</strong> ₹${booking.Rental_Amount}</p>
                </div>
                <div>
                    <p><strong>Status:</strong> <span class="${statusClass}">${booking.StatusofRental}</span></p>
                    <p><strong>Fuel Type:</strong> ${booking.Vehicle.Fuel}</p>
                    <p><strong>Seating:</strong> ${booking.Vehicle.Seater} seats</p>
                </div>
            </div>
        `;

        // Add payment button for accepted bookings
        if (booking.StatusofRental === 'accepted') {
            const paymentButton = document.createElement('button');
            paymentButton.className = 'mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600';
            paymentButton.textContent = 'Make Payment';
            paymentButton.onclick = () => openPaymentModal(booking);
            card.appendChild(paymentButton);
        }

        return card;
    }

    // Function to open payment modal
    function openPaymentModal(booking) {
        const modal = document.getElementById('paymentModal');
        
        // Set modal data
        modal.dataset.bookingId = booking.Rental_ID;
        modal.dataset.ownerId = booking.Owner_ID;
        modal.dataset.renterId = booking.Renter_ID;
        
        // Set amount in the form
        const amountInput = modal.querySelector('input[name="amount"]');
        if (amountInput) {
            amountInput.value = booking.Rental_Amount;
        }
        
        modal.style.display = 'block';
    }

    // Initialize page
    fetchAndDisplayBookings();

    // Set up modal close button
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.onclick = function() {
            const modal = document.getElementById('paymentModal');
            modal.style.display = 'none';
            // Reset the payment form and hide invoice
            const paymentForm = modal.querySelector('form');
            const invoice = document.getElementById('invoice');
            if (paymentForm) paymentForm.style.display = 'block';
            if (invoice) invoice.style.display = 'none';
        };
    }
});