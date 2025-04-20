import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Wishlist from '../components/Wishlist';
import CustomModal from '../components/CustomModal';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase-config';

function PlanningPage() {
  const { tripId } = useParams();
  
  // Default dates for trips
  const getDefaultDates = () => {
    if (tripId === 'japan-2025') {
      return {
        startDate: '2025-06-26',
        endDate: '2025-07-11'
      };
    } else if (tripId === 'iceland-2026') {
      return {
        startDate: '2026-07-15',
        endDate: '2026-07-25'
      };
    }
    return {
      startDate: '',
      endDate: ''
    };
  };
  
  const defaultDates = getDefaultDates();
  
  const [planDetails, setPlanDetails] = useState({
    id: tripId,
    title: tripId === 'japan-2025' ? 'Japan Trip 2025' : 
           tripId === 'iceland-2026' ? 'Iceland 2026' : 'Travel Plan',
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    budget: '',
    notes: ''
  });

  const [activities, setActivities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newActivity, setNewActivity] = useState({
    day: 1,
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    wishlistItemId: null
  });
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDateConfig, setShowDateConfig] = useState(false);
  const [dateForm, setDateForm] = useState({
    startDate: planDetails.startDate || '',
    endDate: planDetails.endDate || ''
  });
  const [showAddFromWishlist, setShowAddFromWishlist] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  
  // Fetch plan details and activities from Firestore
  useEffect(() => {
    if (!tripId) return;
    
    const fetchPlanData = async () => {
      setIsLoading(true);
      try {
        // Fetch trip details
        const tripRef = doc(db, 'trips', tripId);
        const tripSnap = await getDoc(tripRef);
        
        if (tripSnap.exists()) {
          const tripData = tripSnap.data();
          setPlanDetails({
            id: tripId,
            title: tripData.title || planDetails.title,
            description: tripData.description || '',
            startDate: tripData.startDate || defaultDates.startDate,
            endDate: tripData.endDate || defaultDates.endDate,
            budget: tripData.budget || '',
            notes: tripData.notes || ''
          });
          
          setDateForm({
            startDate: tripData.startDate || defaultDates.startDate,
            endDate: tripData.endDate || defaultDates.endDate
          });
        } else {
          // If the trip doesn't exist in Firestore yet, create it with default values
          await setDoc(doc(db, 'trips', tripId), {
            title: planDetails.title,
            startDate: defaultDates.startDate,
            endDate: defaultDates.endDate,
            createdAt: new Date(),
            lastUpdated: new Date()
          });
        }
        
        // Fetch activities from Firestore
        const activitiesRef = collection(db, `trips/${tripId}/activities`);
        const activitiesSnapshot = await getDocs(activitiesRef);
        
        const fetchedActivities = [];
        activitiesSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedActivities.push({
            id: doc.id,
            day: data.day || 1,
            title: data.title,
            description: data.description || '',
            startTime: data.startTime || '',
            endTime: data.endTime || '',
            location: data.location || '',
            wishlistItemId: data.wishlistItemId || null
          });
        });
        
        // If no activities found, create a default one
        if (fetchedActivities.length === 0) {
          const defaultActivity = {
            id: `activity-${Date.now()}`,
            day: 1,
            title: 'Arrival',
            description: 'Airport transfer and check-in to hotel',
            startTime: '14:00',
            endTime: '16:00',
            location: '',
            wishlistItemId: null
          };
          
          // Save default activity to Firestore
          await setDoc(doc(db, `trips/${tripId}/activities`, defaultActivity.id), {
            day: defaultActivity.day,
            title: defaultActivity.title,
            description: defaultActivity.description,
            startTime: defaultActivity.startTime,
            endTime: defaultActivity.endTime,
            location: defaultActivity.location,
            wishlistItemId: defaultActivity.wishlistItemId,
            createdAt: new Date()
          });
          
          fetchedActivities.push(defaultActivity);
        }
        
        setActivities(fetchedActivities);
        
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
        
        // If no bookings found, create default bookings based on the trip
        if (fetchedBookings.length === 0) {
          const defaultBookings = getInitialBookings();
          
          // Save default bookings to Firestore
          for (const booking of defaultBookings) {
            await setDoc(doc(db, `trips/${tripId}/bookings`, booking.id.toString()), {
              name: booking.name,
              date: booking.date,
              link: booking.link || '',
              notes: booking.notes || '',
              createdAt: new Date()
            });
          }
          
          setBookings(defaultBookings);
        } else {
          setBookings(fetchedBookings);
        }
      } catch (error) {
        console.error("Error fetching plan data from Firestore:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Check for pending activity from wishlist (still handle this through localStorage)
    const checkPendingActivity = () => {
      const pendingActivity = localStorage.getItem('pending-activity');
      if (pendingActivity) {
        try {
          const activityData = JSON.parse(pendingActivity);
          // Add it to our activities
          addActivityFromWishlist(activityData);
          // Clear it from localStorage
          localStorage.removeItem('pending-activity');
        } catch (error) {
          console.error("Error processing pending activity:", error);
        }
      }
    };
    
    fetchPlanData().then(() => {
      checkPendingActivity();
    });
  }, [tripId]);

  // Initialize with sample booking data based on the plan
  const getInitialBookings = () => {
    if (tripId === 'japan-2025') {
      return [
        {
          id: 'booking-1',
          name: 'Flight to Tokyo',
          date: '2025-06-26',
          link: 'https://www.example.com/flights',
          notes: 'Japan Airlines, JL123'
        },
        {
          id: 'booking-2',
          name: 'Hotel in Tokyo',
          date: '2025-06-26',
          link: 'https://www.example.com/hotels',
          notes: 'Check-in: 3PM'
        },
        {
          id: 'booking-3',
          name: 'Train to Kyoto',
          date: '2025-07-02',
          link: 'https://www.japan-guide.com/e/e2361.html',
          notes: 'Shinkansen, reserved seats'
        }
      ];
    } else if (tripId === 'iceland-2026') {
      return [
        {
          id: 'booking-1',
          name: 'Flight to Reykjavik',
          date: '2026-07-15',
          link: 'https://www.example.com/flights',
          notes: 'Icelandair, FI614'
        },
        {
          id: 'booking-2',
          name: 'Rental Car',
          date: '2026-07-15',
          link: 'https://www.example.com/cars',
          notes: '4x4 SUV for the entire trip'
        }
      ];
    }
    return [];
  };
  
  // Save activities to localStorage whenever they change
  useEffect(() => {
    const storageKey = `activities-${tripId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(activities));
    } catch (error) {
      console.error("Error saving activities to localStorage:", error);
    }
  }, [activities, tripId]);
  
  // Calculate days array based on start and end dates
  const getDaysArray = () => {
    const { startDate, endDate } = planDetails;
    
    if (!startDate || !endDate) {
      // No dates set, just use the days mentioned in activities
      const days = Array.from(
        new Set(activities.map(act => act.day))
      ).sort((a, b) => a - b);
      
      return days.length > 0 ? days : [1];
    }
    
    // Calculate days between dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return [1];
    }
    
    // Calculate days between
    const daysBetween = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (daysBetween <= 0) {
      return [1]; // Fallback if end date is before start date
    }
    
    // Create array with day numbers
    return Array.from({ length: daysBetween }, (_, i) => i + 1);
  };
  
  // Get array of days with actual dates
  const getDaysWithDates = () => {
    const { startDate } = planDetails;
    if (!startDate) return getDaysArray().map(day => ({ day, date: null }));
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return getDaysArray().map(day => ({ day, date: null }));
    
    return getDaysArray().map(day => {
      const date = new Date(start);
      date.setDate(date.getDate() + day - 1);
      return { day, date };
    });
  };
  
  // Get calendar days with padding to start from Monday
  const getCalendarDays = () => {
    const daysData = getDaysWithDates();
    if (!daysData.length || !daysData[0].date) return daysData;

    const result = [];
    const firstDate = new Date(daysData[0].date);
    
    // Get the day of the week for the first date (0 = Sunday, 1 = Monday, etc.)
    // Convert to Monday-based index (0 = Monday, 6 = Sunday)
    const firstDayOfWeek = (firstDate.getDay() + 6) % 7;
    
    // Add empty placeholder days at the beginning to align with Monday
    for (let i = 0; i < firstDayOfWeek; i++) {
      const placeholderDate = new Date(firstDate);
      placeholderDate.setDate(placeholderDate.getDate() - (firstDayOfWeek - i));
      result.push({
        day: null,
        date: placeholderDate,
        isPlaceholder: true
      });
    }
    
    // Add the actual days
    result.push(...daysData);
    
    // Add empty placeholder days at the end to complete the week
    const lastDate = new Date(daysData[daysData.length - 1].date);
    const lastDayOfWeek = (lastDate.getDay() + 6) % 7;
    
    if (lastDayOfWeek < 6) {
      for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
        const placeholderDate = new Date(lastDate);
        placeholderDate.setDate(placeholderDate.getDate() + i);
        result.push({
          day: null,
          date: placeholderDate,
          isPlaceholder: true
        });
      }
    }
    
    return result;
  };
  
  // Format date in a readable way
  const formatDate = (date) => {
    if (!date) return '';
    
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  const handleSaveDates = async () => {
    // Validate end date is not before start date
    if (dateForm.startDate && dateForm.endDate && 
        new Date(dateForm.endDate) < new Date(dateForm.startDate)) {
      alert('End date cannot be before start date');
      return;
    }
    
    try {
      // Update trip dates in Firestore
      await updateDoc(doc(db, 'trips', tripId), {
        startDate: dateForm.startDate,
        endDate: dateForm.endDate,
        lastUpdated: new Date()
      });
      
      // Update local state
      setPlanDetails({
        ...planDetails,
        startDate: dateForm.startDate,
        endDate: dateForm.endDate
      });
      
      setShowDateConfig(false);
    } catch (error) {
      console.error("Error updating dates in Firestore:", error);
      alert("Failed to save dates. Please try again.");
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.title.trim() || !tripId) return;
    
    try {
      if (editingId) {
        // Update existing activity in Firestore
        await updateDoc(doc(db, `trips/${tripId}/activities`, editingId), {
          day: newActivity.day,
          title: newActivity.title,
          description: newActivity.description,
          startTime: newActivity.startTime,
          endTime: newActivity.endTime,
          location: newActivity.location,
          wishlistItemId: newActivity.wishlistItemId,
          lastUpdated: new Date()
        });
        
        // Update local state
        setActivities(activities.map(act => 
          act.id === editingId ? { ...newActivity, id: editingId } : act
        ));
        setEditingId(null);
      } else {
        // Create new activity ID
        const newId = `activity-${Date.now()}`;
        
        // Add new activity to Firestore
        await setDoc(doc(db, `trips/${tripId}/activities`, newId), {
          day: newActivity.day,
          title: newActivity.title,
          description: newActivity.description,
          startTime: newActivity.startTime,
          endTime: newActivity.endTime,
          location: newActivity.location,
          wishlistItemId: newActivity.wishlistItemId,
          createdAt: new Date()
        });
        
        // Add to local state
        setActivities([...activities, { ...newActivity, id: newId }]);
      }
      
      // Reset form
      setNewActivity({
        day: 1,
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        wishlistItemId: null
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error saving activity to Firestore:", error);
      alert("Failed to save activity. Please try again.");
    }
  };
  
  // Add activity from wishlist
  const addActivityFromWishlist = async (activityData) => {
    if (!tripId) return;
    
    try {
      const newId = `activity-${Date.now()}`;
      const newAct = {
        id: newId,
        day: activityData.day || 1,
        title: activityData.title,
        description: activityData.description || '',
        startTime: '',
        endTime: '',
        location: activityData.location || '',
        wishlistItemId: activityData.wishlistItemId
      };
      
      // Save to Firestore
      await setDoc(doc(db, `trips/${tripId}/activities`, newId), {
        day: newAct.day,
        title: newAct.title,
        description: newAct.description,
        startTime: newAct.startTime,
        endTime: newAct.endTime,
        location: newAct.location,
        wishlistItemId: newAct.wishlistItemId,
        createdAt: new Date()
      });
      
      // Update local state
      setActivities([...activities, newAct]);
      
      // Mark the wishlist item as planned in Firestore
      if (activityData.wishlistItemId) {
        // Update the wishlist item in Firestore
        await updateDoc(doc(db, `trips/${tripId}/wishlist`, activityData.wishlistItemId), {
          planned: true,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error("Error adding activity from wishlist to Firestore:", error);
      alert("Failed to add activity from wishlist. Please try again.");
    }
  };
  
  // Handle adding activity from wishlist to a specific day
  const handleAddFromWishlistToDay = (day) => {
    setSelectedDay(day);
    setShowAddFromWishlist(true);
  };
  
  // Open day details modal
  const openDayModal = (day) => {
    setSelectedDay(day);
    setShowDayModal(true);
  };

  const handleEditActivity = (activity) => {
    setNewActivity({ ...activity });
    setEditingId(activity.id);
    setShowForm(true);
    setShowDayModal(false);
  };

  const handleDeleteActivity = async (id) => {
    if (!tripId) return;
    
    try {
      // Get the activity to check if it's from wishlist
      const activity = activities.find(act => act.id === id);
      
      // Delete from Firestore
      await deleteDoc(doc(db, `trips/${tripId}/activities`, id));
      
      // Remove from local state
      setActivities(activities.filter(act => act.id !== id));
      
      // If it's from wishlist, update the wishlist item's planned status
      if (activity && activity.wishlistItemId) {
        // Check if there are any other activities using this wishlist item
        const stillPlanned = activities.some(
          act => act.id !== id && act.wishlistItemId === activity.wishlistItemId
        );
        
        // If not, mark it as not planned in Firestore
        if (!stillPlanned) {
          await updateDoc(doc(db, `trips/${tripId}/wishlist`, activity.wishlistItemId), {
            planned: false,
            lastUpdated: new Date()
          });
        }
      }
      
      // Reset editing state if needed
      if (editingId === id) {
        setEditingId(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error deleting activity from Firestore:", error);
      alert("Failed to delete activity. Please try again.");
    }
  };
  
  // Get activities for a specific day
  const getActivitiesForDay = (day) => {
    return activities.filter(act => act.day === day);
  };
  
  // Get sorted activities for a day (by start time)
  const getSortedActivitiesForDay = (day) => {
    return getActivitiesForDay(day).sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });
  };
  
  // Update date form when plan details change
  useEffect(() => {
    setDateForm({
      startDate: planDetails.startDate || '',
      endDate: planDetails.endDate || ''
    });
  }, [planDetails.startDate, planDetails.endDate]);
  
  // Calculate available days
  const daysWithDates = getDaysWithDates();
  
  // Get the current selected day data
  const getSelectedDayDate = () => {
    if (!selectedDay) return null;
    const dayData = daysWithDates.find(d => d.day === selectedDay);
    return dayData ? dayData.date : null;
  };
  
  // Get bookings for a specific day
  const getBookingsForDay = (date) => {
    if (!date) return [];
    const dateString = new Date(date).toISOString().split('T')[0];
    return bookings.filter(booking => booking.date === dateString);
  };

  // Convert booking to an activity-like object for display
  const renderBookingAsActivity = (booking) => {
    return {
      id: `booking-${booking.id}`,
      title: booking.name,
      isBooking: true,
      description: booking.notes || '',
      link: booking.link || '',
    };
  };
  
  // Get icon for booking or activity based on name
  const getActivityIcon = (name, isBooking = false) => {
    if (!name) return isBooking ? '🎫' : '📍';
    
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('flight') || lowerName.includes('plane') || lowerName.includes('air')) {
      return '✈️';
    } else if (lowerName.includes('train') || lowerName.includes('rail') || lowerName.includes('shinkansen')) {
      return '🚄';
    } else if (lowerName.includes('hotel') || lowerName.includes('stay') || lowerName.includes('accommodation') || lowerName.includes('check-in')) {
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
    } else if (lowerName.includes('temple') || lowerName.includes('shrine') || lowerName.includes('castle')) {
      return '🏯';
    } else if (lowerName.includes('park') || lowerName.includes('garden') || lowerName.includes('nature')) {
      return '🌳';
    } else if (lowerName.includes('shopping') || lowerName.includes('market') || lowerName.includes('store')) {
      return '🛍️';
    } else if (lowerName.includes('beach') || lowerName.includes('swim') || lowerName.includes('ocean')) {
      return '🏖️';
    } else if (lowerName.includes('arrival') || lowerName.includes('arrival')) {
      return '🛬';
    } else if (lowerName.includes('departure') || lowerName.includes('leaving')) {
      return '🛫';
    } else {
      return isBooking ? '🎫' : '📍';
    }
  };
  
  return (
    <div className="planning-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">{planDetails.title}</h2>
          <div className="mt-2">
            <Link to={`/trip/${tripId}`} className="btn btn-sm btn-outline-secondary me-2">
              Overview
            </Link>
            <Link to={`/trip/${tripId}/bookings`} className="btn btn-sm btn-outline-secondary me-2">
              Bookings
            </Link>
            <Link to={`/trip/${tripId}/wishlist`} className="btn btn-sm btn-outline-secondary">
              Wishlist
            </Link>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-info" 
            onClick={() => setShowDateConfig(!showDateConfig)}
          >
            {showDateConfig ? 'Cancel' : 'Configure Dates'}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) setEditingId(null);
            }}
          >
            {showForm ? 'Cancel' : 'Add Activity'}
          </button>
        </div>
      </div>
      
      {showDateConfig && (
        <div className="card bg-dark mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Trip Dates</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  id="startDate"
                  value={dateForm.startDate}
                  onChange={(e) => setDateForm({...dateForm, startDate: e.target.value})}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  id="endDate"
                  value={dateForm.endDate}
                  onChange={(e) => setDateForm({...dateForm, endDate: e.target.value})}
                />
              </div>
            </div>
            
            <div className="d-flex justify-content-end mt-3">
              <button 
                onClick={() => setShowDateConfig(false)} 
                className="btn btn-secondary me-2"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveDates} 
                className="btn btn-primary"
              >
                Save Dates
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Trip dates info */}
      {(planDetails.startDate || planDetails.endDate) && (
        <div className="alert alert-info mb-4 trip-dates-container">
          <div className="d-flex align-items-center">
            <span className="trip-dates-icon me-2">📅</span>
            <div>
              <strong className="trip-dates-label">Trip Dates: </strong>
              <span className="trip-dates-value"> 
                {planDetails.startDate ? new Date(planDetails.startDate).toLocaleDateString() : 'Not set'} 
                {planDetails.endDate ? ' to ' + new Date(planDetails.endDate).toLocaleDateString() : ''}
              </span>
              {planDetails.startDate && planDetails.endDate && (
                <span className="trip-duration-badge ms-2">
                  {getDaysArray().length} days
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showForm && (
        <div className="card bg-dark mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-2">
                <label htmlFor="day" className="form-label">Day</label>
                <select
                  className="form-select"
                  id="day"
                  value={newActivity.day}
                  onChange={(e) => setNewActivity({...newActivity, day: parseInt(e.target.value)})}
                >
                  {daysWithDates.map(({ day, date }) => (
                    <option key={day} value={day}>
                      Day {day} {date && `(${formatDate(date)})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-5">
                <label htmlFor="title" className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                  placeholder="Activity title"
                />
              </div>
              <div className="col-md-5">
                <label htmlFor="location" className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  id="location"
                  value={newActivity.location}
                  onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                  placeholder="Location (optional)"
                />
              </div>
              <div className="col-md-6">
                <div className="row">
                  <div className="col-6">
                    <label htmlFor="startTime" className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      id="startTime"
                      value={newActivity.startTime}
                      onChange={(e) => setNewActivity({...newActivity, startTime: e.target.value})}
                    />
                  </div>
                  <div className="col-6">
                    <label htmlFor="endTime" className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      id="endTime"
                      value={newActivity.endTime}
                      onChange={(e) => setNewActivity({...newActivity, endTime: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  placeholder="Optional details"
                  rows="2"
                />
              </div>
            </div>
            
            <div className="d-flex justify-content-end mt-3">
              <button 
                onClick={handleAddActivity} 
                className="btn btn-primary"
                disabled={!newActivity.title.trim()}
              >
                {editingId ? 'Update Activity' : 'Add Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {daysWithDates.length > 0 ? (
        <div>
          <h3 className="mb-4">Trip Days</h3>
          <div className="calendar-container">
            <div className="calendar-grid">
              {getCalendarDays().map((dayData, index) => {
                // Handle placeholder days - just render empty transparent div to maintain grid
                if (dayData.isPlaceholder) {
                  return <div key={`placeholder-${index}`} className="calendar-day placeholder"></div>;
                }
                
                const { day, date } = dayData;
                const dayActivities = getActivitiesForDay(day);
                const hasActivities = dayActivities.length > 0;
                const firstActivity = hasActivities ? dayActivities[0] : null;
                
                // Determine if it's a weekend (5=Saturday, 6=Sunday in our 0-based index starting from Monday)
                const isWeekend = index % 7 === 5 || index % 7 === 6;
                
                return (
                  <div key={`day-${day}`} className={`calendar-day ${isWeekend ? 'weekend' : ''}`}>
                    <div className="card h-100">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 day-title">Day {day}</h5>
                        {date && (
                          <div className="d-flex flex-column align-items-end">
                            <span className="day-name">{date ? new Date(date).toLocaleDateString(undefined, {weekday: 'short'}) : ''}</span>
                            <span className="date-badge">{formatDate(date)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="card-body d-flex flex-column">
                        {/* Show at least one section or empty state */}
                        {hasActivities || (date && getBookingsForDay(date).length > 0) ? (
                          <div className="day-content">
                            {/* Activities section */}
                            {hasActivities && (
                              <div className="activities-section mb-3">
                                <h6 className="section-label">
                                  <span className="activity-icon">📋</span> Activities
                                </h6>
                                
                                <div className="activity-item">
                                  <p className="card-text activity-title">
                                    <span className="activity-icon me-1">{getActivityIcon(firstActivity.title)}</span>
                                    <strong>{firstActivity.title}</strong>
                                    {firstActivity.startTime && (
                                      <span className="badge bg-secondary ms-2">
                                        {firstActivity.startTime}
                                      </span>
                                    )}
                                  </p>
                                  
                                  {firstActivity.location && (
                                    <p className="card-text text-info mb-1">
                                      <small>📍 {firstActivity.location}</small>
                                    </p>
                                  )}
                                  
                                  {dayActivities.length > 1 && (
                                    <p className="text-muted mt-1 mb-0">
                                      <small>+ {dayActivities.length - 1} more {dayActivities.length - 1 === 1 ? 'activity' : 'activities'}</small>
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Bookings section */}
                            {date && getBookingsForDay(date).length > 0 && (
                              <div className="bookings-section">
                                <h6 className="section-label">
                                  <span className="booking-icon">🎫</span> Bookings
                                </h6>
                                
                                <div className="booking-item">
                                  <p className="card-text booking-title">
                                    <span className="booking-icon me-1">{getActivityIcon(getBookingsForDay(date)[0].name, true)}</span>
                                    <strong>{getBookingsForDay(date)[0].name}</strong>
                                  </p>
                                  
                                  {getBookingsForDay(date).length > 1 && (
                                    <p className="text-muted mt-1 mb-0">
                                      <small>+ {getBookingsForDay(date).length - 1} more booking{getBookingsForDay(date).length - 1 !== 1 ? 's' : ''}</small>
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="empty-state text-center text-muted">
                            <p className="card-text mb-0">No activities planned</p>
                          </div>
                        )}
                        
                        {/* Spacer to push footer to bottom */}
                        <div className="flex-grow-1"></div>
                      </div>
                      
                      <div className="card-footer">
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-icon"
                            title="Add Activity"
                            onClick={() => {
                              setNewActivity({...newActivity, day});
                              setShowForm(true);
                            }}
                          >
                            <span className="icon">➕</span>
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-icon"
                            title="Add from Wishlist"
                            onClick={() => handleAddFromWishlistToDay(day)}
                          >
                            <span className="icon">⭐</span>
                          </button>
                          
                          <button 
                            className="btn btn-sm btn-icon"
                            title="View Details"
                            onClick={() => openDayModal(day)}
                          >
                            <span className="icon">🔍</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-info text-center">
          No activities planned yet. Add your first activity to start planning your trip!
        </div>
      )}
      
      {/* Day details modal */}
      {selectedDay && (
        <CustomModal 
          isOpen={showDayModal}
          onClose={() => setShowDayModal(false)}
          title={`Day ${selectedDay} - ${formatDate(getSelectedDayDate())}`}
          size="lg"
          footer={
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDayModal(false)}
              >
                Close
              </button>
              <div className="dropdown dropup d-inline-block">
                <button
                  className="btn btn-primary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Add Activity
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setNewActivity({...newActivity, day: selectedDay});
                        setShowForm(true);
                        setShowDayModal(false);
                      }}
                    >
                      Create New
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        handleAddFromWishlistToDay(selectedDay);
                        setShowDayModal(false);
                      }}
                    >
                      From Wishlist
                    </button>
                  </li>
                </ul>
              </div>
            </>
          }
        >
          {selectedDay && (
            <>
              {getSortedActivitiesForDay(selectedDay).length > 0 || 
               (getSelectedDayDate() && getBookingsForDay(getSelectedDayDate()).length > 0) ? (
                <div className="timeline">
                  {/* Display bookings first */}
                  {getSelectedDayDate() && getBookingsForDay(getSelectedDayDate()).length > 0 && (
                    <div className="booking-section mb-3">
                      <h6 className="section-title">
                        <span className="booking-icon">🎫</span> Bookings for this day
                      </h6>
                      {getBookingsForDay(getSelectedDayDate()).map((booking) => (
                        <div key={`booking-${booking.id}`} className="card mb-3 booking-card">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                              <h5 className="card-title mb-0">
                                <span className="booking-icon me-2">{getActivityIcon(booking.name, true)}</span>
                                {booking.name}
                              </h5>
                            </div>
                            
                            {booking.notes && (
                              <p className="card-text mt-2">
                                {booking.notes}
                              </p>
                            )}
                            
                            <div className="d-flex justify-content-end mt-2">
                              {booking.link && (
                                <a
                                  href={booking.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-info me-2"
                                >
                                  View Booking
                                </a>
                              )}
                              <Link 
                                to={`/trip/${tripId}/bookings`}
                                className="btn btn-sm btn-outline-secondary"
                              >
                                Manage Bookings
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Display activities */}
                  {getSortedActivitiesForDay(selectedDay).length > 0 && (
                    <div className="activities-section">
                      {getSortedActivitiesForDay(selectedDay).length > 0 && getBookingsForDay(getSelectedDayDate()).length > 0 && (
                        <h6 className="section-title">
                          <span className="activity-icon">📋</span> Activities
                        </h6>
                      )}
                      
                      {getSortedActivitiesForDay(selectedDay).map((activity) => (
                        <div key={activity.id} className="card mb-3">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                              <h5 className="card-title mb-0">
                                <span className="activity-icon me-2">{getActivityIcon(activity.title)}</span>
                                {activity.title}
                                {activity.wishlistItemId && (
                                  <span className="badge bg-info ms-2" title="From wishlist">
                                    <small>💭</small>
                                  </span>
                                )}
                              </h5>
                              <div>
                                {activity.startTime && (
                                  <span className="badge bg-secondary me-2">
                                    {activity.startTime} - {activity.endTime || '?'}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {activity.location && (
                              <p className="card-text text-info mt-2 mb-1">
                                <small>📍 {activity.location}</small>
                              </p>
                            )}
                            
                            {activity.description && (
                              <p className="card-text mt-2">{activity.description}</p>
                            )}
                            
                            <div className="d-flex justify-content-end mt-2">
                              <button 
                                onClick={() => handleEditActivity(activity)} 
                                className="btn btn-sm btn-outline-secondary me-2"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteActivity(activity.id)} 
                                className="btn btn-sm btn-outline-danger"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="alert alert-info text-center">
                  No activities or bookings for this day.
                </div>
              )}
            </>
          )}
        </CustomModal>
      )}
      
      {/* Wishlist Modal for Adding Activities */}
      {showAddFromWishlist && (
        <CustomModal
          isOpen={showAddFromWishlist}
          onClose={() => setShowAddFromWishlist(false)}
          title={`Add from Wishlist to Day ${selectedDay}`}
          size="xl"
          footer={
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowAddFromWishlist(false)}
            >
              Close
            </button>
          }
        >
          <Wishlist 
            planId={tripId} 
            onAddToPlanning={(activityData) => {
              // Set the correct day
              activityData.day = selectedDay;
              // Add to our activities
              addActivityFromWishlist(activityData);
              // Close the modal
              setShowAddFromWishlist(false);
            }} 
          />
        </CustomModal>
      )}

      <style jsx>{`
        .date-badge {
          font-size: 0.75rem;
          color: #adb5bd;
        }
        
        .day-name {
          font-size: 0.7rem;
          font-weight: 600;
          color: #adb5bd;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .day-title {
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .day-content {
          width: 100%;
        }
        
        .section-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #adb5bd;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.25rem;
        }
        
        .activity-item, .booking-item {
          padding-left: 0.5rem;
        }
        
        .activities-section {
          padding-bottom: 0.5rem;
        }
        
        .activity-count {
          font-size: 0.85rem;
          color: #adb5bd;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }
        
        .activity-title {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        
        .booking-title {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: #0dcaf0;
        }
        
        .booking-icon {
          font-size: 1rem;
          color: #0dcaf0;
        }
        
        .activity-icon {
          font-size: 1rem;
          color: #6ea8fe;
        }
        
        .section-title {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
          color: #adb5bd;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }
        
        .booking-card {
          border-left: 3px solid #0dcaf0;
        }
        
        .activity-summary {
          min-height: 80px;
        }
        
        /* Mobile-first calendar layout */
        .calendar-container {
          width: 100%;
          padding-bottom: 1rem;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          max-height: none;
          overflow-y: visible;
          overflow-x: hidden;
        }
        
        .calendar-container::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        
        .calendar-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .calendar-container::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        
        /* Mobile view - vertical scrolling */
        @media (max-width: 767.98px) {
          .calendar-grid {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 0.5rem 0.25rem;
          }
          
          .calendar-day {
            min-height: 220px;
            width: 100%;
            margin-bottom: 0.5rem;
          }
          
          .calendar-day.placeholder {
            display: none;
          }
        }
        
        /* Desktop view - grid layout */
        @media (min-width: 768px) {
          .calendar-container {
            overflow-x: visible;
            overflow-y: visible;
            max-height: none;
          }
          
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            min-width: auto;
            padding: 0;
          }
          
          .calendar-day {
            width: auto;
            min-height: 220px;
            margin-bottom: 0;
          }
          
          .calendar-day.placeholder {
            display: block;
            min-height: 0;
            visibility: hidden;
          }
        }
        
        @media (min-width: 992px) {
          .calendar-grid {
            grid-template-columns: repeat(7, 1fr);
          }
        }
        
        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .weekend .card {
          background-color: rgba(52, 58, 64, 0.5);
        }
        
        .weekend .card-header {
          background-color: rgba(73, 80, 87, 0.5);
          border-bottom-color: rgba(73, 80, 87, 0.3);
        }
        
        /* Icon button styling */
        .btn-icon {
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
        }
        
        .btn-icon:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        
        .btn-icon .icon {
          font-size: 1rem;
        }
        
        .card-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .empty-state {
          padding: 1rem 0;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

export default PlanningPage; 