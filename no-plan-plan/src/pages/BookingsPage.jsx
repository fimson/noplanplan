import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '../firebase-config';

function BookingsPage() {
  const { tripId } = useParams();
  
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newBooking, setNewBooking] = useState({
    name: '',
    date: '',
    link: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch bookings from Firestore
  useEffect(() => {
    const fetchBookings = async () => {
      if (!tripId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch bookings from Firestore
        const bookingsRef = collection(db, `trips/${tripId}/bookings`);
        const bookingsSnapshot = await getDocs(bookingsRef);
        
        const fetchedBookings = [];
        bookingsSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedBookings.push({
            id: doc.id,
            name: data.name,
            date: data.date || '',
            link: data.link || '',
            notes: data.notes || ''
          });
        });
        
        setBookings(fetchedBookings);
      } catch (err) {
        console.error("Error fetching bookings from Firestore:", err);
        setError("Failed to load bookings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, [tripId]);

  // Fetch documents from Firebase Storage
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!tripId) return;
      
      try {
        const docsListRef = ref(storage, `trips/${tripId}/documents`);
        const docsList = await listAll(docsListRef);
        
        const docsData = await Promise.all(docsList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          const bookingId = item.name.split('_')[0]; // Extract booking ID from filename
          const filename = item.name.split('_').slice(1).join('_'); // Extract original filename
          
          return {
            id: item.name,
            name: filename,
            url,
            bookingId,
            fullPath: item.fullPath
          };
        }));
        
        setDocuments(docsData);
      } catch (err) {
        // If the folder doesn't exist yet, this is normal
        if (!err.message.includes('storage/object-not-found')) {
          console.error("Error fetching documents:", err);
        }
      }
    };
    
    fetchDocuments();
  }, [tripId]);

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

  const handleSaveBooking = async () => {
    if (!newBooking.name.trim() || !newBooking.date) return;
    
    try {
      if (editingId) {
        // Update existing booking in Firestore
        const bookingRef = doc(db, `trips/${tripId}/bookings`, editingId);
        await updateDoc(bookingRef, {
          name: newBooking.name,
          date: newBooking.date,
          link: newBooking.link || '',
          notes: newBooking.notes || '',
          updatedAt: new Date()
        });
        
        // Update local state
        setBookings(bookings.map(booking => 
          booking.id === editingId ? { ...newBooking, id: editingId } : booking
        ));
        setEditingId(null);
      } else {
        // Create a new booking ID
        const id = `booking-${Date.now()}`;
        
        // Add new booking to Firestore
        const bookingRef = doc(db, `trips/${tripId}/bookings`, id);
        await setDoc(bookingRef, {
          name: newBooking.name,
          date: newBooking.date,
          link: newBooking.link || '',
          notes: newBooking.notes || '',
          createdAt: new Date()
        });
        
        // Update local state
        setBookings([...bookings, { ...newBooking, id }]);
      }
      
      // Reset form
      setNewBooking({
        name: '',
        date: '',
        link: '',
        notes: ''
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving booking to Firestore:", err);
      alert("Failed to save booking. Please try again.");
    }
  };

  const handleEditBooking = (booking) => {
    setNewBooking({
      name: booking.name,
      date: booking.date,
      link: booking.link || '',
      notes: booking.notes || ''
    });
    setEditingId(booking.id);
    setShowForm(true);
  };

  const handleDeleteBooking = async (id) => {
    try {
      // Delete from Firestore
      const bookingRef = doc(db, `trips/${tripId}/bookings`, id);
      await deleteDoc(bookingRef);
      
      // Update local state
      setBookings(bookings.filter(booking => booking.id !== id));
      
      if (editingId === id) {
        setEditingId(null);
        setShowForm(false);
      }
    } catch (err) {
      console.error("Error deleting booking from Firestore:", err);
      alert("Failed to delete booking. Please try again.");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle document upload for a specific booking
  const handleDocumentUpload = async (e, bookingId) => {
    const file = e.target.files[0];
    if (!file || !bookingId) return;
    
    setUploadingDoc(true);
    setUploadProgress(0);
    setSuccessMessage('');
    
    try {
      // Create a reference to the file in Firebase Storage
      const fileName = `${bookingId}_${file.name}`;
      const storageRef = ref(storage, `trips/${tripId}/documents/${fileName}`);
      
      // Create upload task
      const uploadTask = uploadBytes(storageRef, file);
      
      // Monitor upload progress - Note: uploadBytes doesn't support progress monitoring
      // To show some visual feedback, we'll use a simulated progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Wait for upload to complete
      await uploadTask;
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Add to local state
      const newDoc = {
        id: fileName,
        name: file.name,
        url: downloadURL,
        bookingId,
        fullPath: storageRef.fullPath
      };
      
      setDocuments(prev => [...prev, newDoc]);
      
      // Update booking to indicate it has documents
      const bookingRef = doc(db, `trips/${tripId}/bookings`, bookingId);
      await updateDoc(bookingRef, {
        hasDocuments: true,
        updatedAt: new Date()
      });
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, hasDocuments: true } : booking
      ));
      
      // Set success message
      setSuccessMessage(`Document "${file.name}" uploaded successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000); // Clear after 5 seconds
      
      setShowDocUpload(false);
      setSelectedBookingId(null);
    } catch (err) {
      console.error("Error uploading document:", err);
      alert(`Failed to upload document: ${err.message}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  // Delete a document
  const handleDeleteDocument = async (document) => {
    try {
      // Delete from Firebase Storage
      const docRef = ref(storage, document.fullPath);
      await deleteObject(docRef);
      
      // Update local state
      setDocuments(documents.filter(doc => doc.id !== document.id));
      
      // Check if this was the last document for this booking
      const remainingDocs = documents.filter(doc => 
        doc.bookingId === document.bookingId && doc.id !== document.id
      );
      
      if (remainingDocs.length === 0) {
        // Update booking to indicate it no longer has documents
        const bookingRef = doc(db, `trips/${tripId}/bookings`, document.bookingId);
        await updateDoc(bookingRef, {
          hasDocuments: false,
          updatedAt: new Date()
        });
        
        // Update local state
        setBookings(bookings.map(booking => 
          booking.id === document.bookingId ? { ...booking, hasDocuments: false } : booking
        ));
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Failed to delete document. Please try again.");
    }
  };

  // Get documents for a specific booking
  const getBookingDocuments = (bookingId) => {
    return documents.filter(doc => doc.bookingId === bookingId);
  };

  return (
    <div className="bookings-page text-center">
      <div className="d-flex justify-content-center align-items-center mb-4 flex-column">
        <h2 className="fw-bold main-title mb-3">Travel Bookings</h2>
        <div className="d-flex gap-3 mb-4">
          <Link to={`/trip/${tripId}`} className="btn btn-sm btn-outline-secondary">
            Overview
          </Link>
          <Link to={`/trip/${tripId}/planning`} className="btn btn-sm btn-outline-secondary">
            Planning
          </Link>
          <Link to={`/trip/${tripId}/wishlist`} className="btn btn-sm btn-outline-secondary">
            Wishlist
          </Link>
        </div>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {isLoading && <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}

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

      {!isLoading && (
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
                      <th>Documents</th>
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
                        <td className="text-truncate" style={{ maxWidth: '150px' }}>{booking.notes}</td>
                        <td>
                          {/* Documents section */}
                          <div className="d-flex flex-column">
                            {getBookingDocuments(booking.id).map(doc => (
                              <div key={doc.id} className="mb-1 d-flex align-items-center">
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-sm btn-outline-info me-1"
                                >
                                  📄 {doc.name.length > 15 ? doc.name.substring(0, 12) + '...' : doc.name}
                                </a>
                                <button 
                                  className="btn btn-sm btn-outline-danger btn-sm" 
                                  onClick={() => handleDeleteDocument(doc)}
                                  title="Delete document"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            
                            {/* Upload button */}
                            {(selectedBookingId !== booking.id || !showDocUpload) && (
                              <button 
                                className="btn btn-sm btn-outline-secondary" 
                                onClick={() => {
                                  setSelectedBookingId(booking.id);
                                  setShowDocUpload(true);
                                }}
                              >
                                + Upload
                              </button>
                            )}
                            
                            {/* File input appears when upload is clicked */}
                            {selectedBookingId === booking.id && showDocUpload && (
                              <div className="mt-2">
                                <input 
                                  type="file" 
                                  className="form-control form-control-sm" 
                                  onChange={(e) => handleDocumentUpload(e, booking.id)}
                                  disabled={uploadingDoc}
                                />
                                {uploadingDoc && (
                                  <div className="progress mt-1" style={{ height: '5px' }}>
                                    <div 
                                      className="progress-bar" 
                                      role="progressbar" 
                                      style={{ width: `${uploadProgress}%` }} 
                                      aria-valuenow={uploadProgress} 
                                      aria-valuemin="0" 
                                      aria-valuemax="100"
                                    ></div>
                                  </div>
                                )}
                                <button 
                                  className="btn btn-sm btn-outline-secondary mt-1" 
                                  onClick={() => {
                                    setShowDocUpload(false);
                                    setSelectedBookingId(null);
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
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
                              className="btn btn-sm btn-outline-primary" 
                              onClick={() => handleEditBooking(booking)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={() => handleDeleteBooking(booking.id)}
                            >
                              Delete
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
                No bookings found. Click "Add Booking" to create your first booking.
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        .booking-icon {
          font-size: 1.2rem;
        }
        
        .main-title {
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.03em;
        }
      `}</style>
    </div>
  );
}

export default BookingsPage; 