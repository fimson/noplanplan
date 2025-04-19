import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function BookingsPage() {
  const { planId } = useParams();
  
  // Initialize with sample data based on the plan
  const getInitialBookings = () => {
    if (planId === 'japan-2025') {
      return [
        {
          id: 1,
          name: 'Flight to Tokyo',
          date: '2025-06-26',
          link: 'https://www.example.com/flights',
          notes: 'Japan Airlines, JL123'
        },
        {
          id: 2,
          name: 'Hotel in Tokyo',
          date: '2025-06-26',
          link: 'https://www.example.com/hotels',
          notes: 'Check-in: 3PM'
        },
        {
          id: 3,
          name: 'Train to Kyoto',
          date: '2025-07-02',
          link: 'https://www.japan-guide.com/e/e2361.html',
          notes: 'Shinkansen, reserved seats'
        }
      ];
    } else if (planId === 'iceland-2026') {
      return [
        {
          id: 1,
          name: 'Flight to Reykjavik',
          date: '2026-07-15',
          link: 'https://www.example.com/flights',
          notes: 'Icelandair, FI614'
        },
        {
          id: 2,
          name: 'Rental Car',
          date: '2026-07-15',
          link: 'https://www.example.com/cars',
          notes: '4x4 SUV for the entire trip'
        }
      ];
    }
    return [];
  };

  // Load bookings from localStorage or use default
  const getStoredBookings = () => {
    try {
      const storageKey = `bookings-${planId}`;
      const storedBookings = localStorage.getItem(storageKey);
      return storedBookings ? JSON.parse(storedBookings) : getInitialBookings();
    } catch (error) {
      console.error("Error loading bookings from localStorage:", error);
      return getInitialBookings();
    }
  };

  const [bookings, setBookings] = useState(getStoredBookings);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newBooking, setNewBooking] = useState({
    name: '',
    date: '',
    link: '',
    notes: ''
  });

  // Save bookings to localStorage when they change
  useEffect(() => {
    try {
      const storageKey = `bookings-${planId}`;
      localStorage.setItem(storageKey, JSON.stringify(bookings));
    } catch (error) {
      console.error("Error saving bookings to localStorage:", error);
    }
  }, [bookings, planId]);

  // Get icon for booking type
  const getBookingIcon = (bookingName) => {
    const lowerName = bookingName.toLowerCase();
    
    if (lowerName.includes('flight') || lowerName.includes('plane') || lowerName.includes('air')) {
      return '✈️';
    } else if (lowerName.includes('train') || lowerName.includes('rail') || lowerName.includes('shinkansen')) {
      return '🚄';
    } else if (lowerName.includes('hotel') || lowerName.includes('stay') || lowerName.includes('accommodation')) {
      return '🏨';
    } else if (lowerName.includes('tour') || lowerName.includes('guide') || lowerName.includes('excursion')) {
      return '🗺️';
    } else if (lowerName.includes('dinner') || lowerName.includes('lunch') || lowerName.includes('restaurant') || lowerName.includes('food')) {
      return '🍣';
    } else if (lowerName.includes('car') || lowerName.includes('rental') || lowerName.includes('drive')) {
      return '🚗';
    } else if (lowerName.includes('museum') || lowerName.includes('exhibition') || lowerName.includes('gallery')) {
      return '🏛️';
    } else if (lowerName.includes('show') || lowerName.includes('concert') || lowerName.includes('performance')) {
      return '🎭';
    } else if (lowerName.includes('ferry') || lowerName.includes('boat') || lowerName.includes('cruise')) {
      return '⛴️';
    } else {
      return '🎫';
    }
  };

  const handleSaveBooking = () => {
    if (!newBooking.name.trim() || !newBooking.date) return;

    if (editingId) {
      setBookings(bookings.map(booking => 
        booking.id === editingId ? { ...newBooking, id: editingId } : booking
      ));
      setEditingId(null);
    } else {
      const id = Date.now();
      setBookings([...bookings, { ...newBooking, id }]);
    }

    setNewBooking({
      name: '',
      date: '',
      link: '',
      notes: ''
    });
    setShowForm(false);
  };

  const handleEditBooking = (booking) => {
    setNewBooking({
      name: booking.name,
      date: booking.date,
      link: booking.link,
      notes: booking.notes || ''
    });
    setEditingId(booking.id);
    setShowForm(true);
  };

  const handleDeleteBooking = (id) => {
    setBookings(bookings.filter(booking => booking.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setShowForm(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bookings-page text-center">
      <div className="d-flex justify-content-center align-items-center mb-4 flex-column">
        <h2 className="fw-bold main-title mb-3">Travel Bookings</h2>
        <div className="d-flex gap-3 mb-4">
          <Link to={`/plan/${planId}`} className="btn btn-sm btn-outline-secondary">
            Overview
          </Link>
          <Link to={`/plan/${planId}/planning`} className="btn btn-sm btn-outline-secondary">
            Planning
          </Link>
          <Link to={`/plan/${planId}/wishlist`} className="btn btn-sm btn-outline-secondary">
            Wishlist
          </Link>
        </div>
      </div>

      {showForm && (
        <div className="card bg-dark mb-4 mx-auto" style={{ maxWidth: '700px' }}>
          <div className="card-body">
            <h5 className="card-title mb-3">{editingId ? 'Edit Booking' : 'Add New Booking'}</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="name" className="form-label">Booking Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  value={newBooking.name}
                  onChange={(e) => setNewBooking({...newBooking, name: e.target.value})}
                  placeholder="Flight, Hotel, etc."
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="date" className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  id="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking({...newBooking, date: e.target.value})}
                  required
                />
              </div>
              <div className="col-12">
                <label htmlFor="link" className="form-label">Link (optional)</label>
                <input
                  type="url"
                  className="form-control"
                  id="link"
                  value={newBooking.link}
                  onChange={(e) => setNewBooking({...newBooking, link: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>
              <div className="col-12">
                <label htmlFor="notes" className="form-label">Notes (optional)</label>
                <textarea
                  className="form-control"
                  id="notes"
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                  rows="2"
                  placeholder="Confirmation number, details, etc."
                />
              </div>
            </div>
            
            <div className="d-flex justify-content-center mt-3 gap-2">
              <button 
                onClick={() => setShowForm(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBooking} 
                className="btn btn-primary"
                disabled={!newBooking.name.trim() || !newBooking.date}
              >
                {editingId ? 'Update' : 'Save'} Booking
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card mx-auto" style={{ maxWidth: '900px' }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="card-title mb-0">Your Bookings</h5>
            <button 
              className="btn btn-sm btn-primary" 
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) setEditingId(null);
              }}
            >
              {showForm ? 'Cancel' : '+ Add Booking'}
            </button>
          </div>

          {bookings.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Notes</th>
                    <th>Link</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td>
                        <span className="booking-icon me-2">{getBookingIcon(booking.name)}</span>
                        {booking.name}
                      </td>
                      <td>{formatDate(booking.date)}</td>
                      <td className="text-truncate" style={{ maxWidth: '200px' }}>{booking.notes}</td>
                      <td>
                        {booking.link && (
                          <a href={booking.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">
                            View
                          </a>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <button 
                            onClick={() => handleEditBooking(booking)} 
                            className="btn btn-sm btn-outline-secondary"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteBooking(booking.id)} 
                            className="btn btn-sm btn-outline-danger"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-info text-center">
              No bookings yet. Add your first booking to keep track of your travel arrangements.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .main-title {
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.03em;
          font-weight: 700;
        }
        
        .table th {
          font-weight: 600;
          font-family: 'Inter', sans-serif;
        }
        
        .table td {
          vertical-align: middle;
        }
        
        .booking-icon {
          font-size: 1.2rem;
        }
      `}</style>
    </div>
  );
}

export default BookingsPage; 