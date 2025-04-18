import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Wishlist from '../components/Wishlist';
import CustomModal from '../components/CustomModal';

function PlanningPage() {
  const { planId } = useParams();
  
  // Default dates for Japan trip: 26/06/2025 to 11/07/2025
  const getDefaultDates = () => {
    if (planId === 'japan-2025') {
      return {
        startDate: '2025-06-26',
        endDate: '2025-07-11'
      };
    } else if (planId === 'iceland-2026') {
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
    id: planId,
    title: planId === 'japan-2025' ? 'Japan Trip 2025' : 
           planId === 'iceland-2026' ? 'Iceland 2026' : 'Travel Plan',
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    budget: '',
    notes: ''
  });

  // Get initial activities from localStorage or use default
  const getInitialActivities = () => {
    try {
      const storageKey = `activities-${planId}`;
      const storedActivities = localStorage.getItem(storageKey);
      if (storedActivities) {
        return JSON.parse(storedActivities);
      }
    } catch (error) {
      console.error("Error loading initial activities from localStorage:", error);
    }
    
    // Default activity if nothing in localStorage
    return [{
      id: 1,
      day: 1,
      title: 'Arrival',
      description: 'Airport transfer and check-in to hotel',
      startTime: '14:00',
      endTime: '16:00',
      location: '',
      wishlistItemId: null
    }];
  };

  const [activities, setActivities] = useState(getInitialActivities());

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
  
  // Load activities from localStorage
  useEffect(() => {
    // Check for pending activity from wishlist
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
  }, [planId]);
  
  // Save activities to localStorage whenever they change
  useEffect(() => {
    const storageKey = `activities-${planId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(activities));
    } catch (error) {
      console.error("Error saving activities to localStorage:", error);
    }
  }, [activities, planId]);
  
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
  
  // Format date in a readable way
  const formatDate = (date) => {
    if (!date) return '';
    
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  const handleSaveDates = () => {
    // Validate end date is not before start date
    if (dateForm.startDate && dateForm.endDate && 
        new Date(dateForm.endDate) < new Date(dateForm.startDate)) {
      alert('End date cannot be before start date');
      return;
    }
    
    setPlanDetails({
      ...planDetails,
      startDate: dateForm.startDate,
      endDate: dateForm.endDate
    });
    
    setShowDateConfig(false);
  };

  const handleAddActivity = () => {
    if (!newActivity.title.trim()) return;
    
    if (editingId) {
      // Update existing activity
      setActivities(activities.map(act => 
        act.id === editingId ? { ...newActivity, id: editingId } : act
      ));
      setEditingId(null);
    } else {
      // Add new activity
      const id = Date.now();
      setActivities([...activities, { ...newActivity, id }]);
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
  };
  
  // Add activity from wishlist
  const addActivityFromWishlist = (activityData) => {
    const newAct = {
      id: Date.now(),
      day: activityData.day || 1,
      title: activityData.title,
      description: activityData.description || '',
      startTime: '',
      endTime: '',
      location: activityData.location || '',
      wishlistItemId: activityData.wishlistItemId
    };
    
    setActivities([...activities, newAct]);
    
    // Update the wishlist item to mark it as planned in localStorage
    if (activityData.wishlistItemId) {
      try {
        const storageKey = `wishlist-${planId}`;
        const storedItems = localStorage.getItem(storageKey);
        if (storedItems) {
          const items = JSON.parse(storedItems);
          const updatedItems = items.map(item => 
            item.id === activityData.wishlistItemId ? {...item, planned: true} : item
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedItems));
        }
      } catch (error) {
        console.error("Error updating wishlist item:", error);
      }
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

  const handleDeleteActivity = (id) => {
    // Get the activity to check if it's from wishlist
    const activity = activities.find(act => act.id === id);
    
    // Remove from activities
    setActivities(activities.filter(act => act.id !== id));
    
    // If it's from wishlist, update the wishlist item's planned status
    if (activity && activity.wishlistItemId) {
      // We need to update the wishlist item's planned status
      try {
        const storageKey = `wishlist-${planId}`;
        const storedItems = localStorage.getItem(storageKey);
        if (storedItems) {
          const items = JSON.parse(storedItems);
          // Find if there are any other activities using this wishlist item
          const stillPlanned = activities.some(
            act => act.id !== id && act.wishlistItemId === activity.wishlistItemId
          );
          
          // If not, mark it as not planned
          if (!stillPlanned) {
            const updatedItems = items.map(item => 
              item.id === activity.wishlistItemId ? {...item, planned: false} : item
            );
            localStorage.setItem(storageKey, JSON.stringify(updatedItems));
          }
        }
      } catch (error) {
        console.error("Error updating wishlist item:", error);
      }
    }
    
    if (editingId === id) {
      setEditingId(null);
      setShowForm(false);
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
  
  return (
    <div className="planning-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">{planDetails.title}</h2>
          <div className="mt-2">
            <Link to={`/plan/${planId}`} className="btn btn-sm btn-outline-secondary me-2">
              Overview
            </Link>
            <Link to={`/plan/${planId}/wishlist`} className="btn btn-sm btn-outline-secondary">
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
        <div className="alert alert-info mb-4">
          <strong>Trip Dates:</strong> {planDetails.startDate ? new Date(planDetails.startDate).toLocaleDateString() : 'Not set'} 
          to {planDetails.endDate ? new Date(planDetails.endDate).toLocaleDateString() : 'Not set'}
          {planDetails.startDate && planDetails.endDate && (
            <span className="ms-2">
              ({getDaysArray().length} days)
            </span>
          )}
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
          <div className="row g-4">
            {daysWithDates.map(({ day, date }) => {
              const dayActivities = getActivitiesForDay(day);
              const hasActivities = dayActivities.length > 0;
              const firstActivity = hasActivities ? dayActivities[0] : null;
              
              return (
                <div key={day} className="col-lg-3 col-md-6 col-12">
                  <div className="card h-100">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Day {day}</h5>
                      {date && <span className="date-badge">{formatDate(date)}</span>}
                    </div>
                    
                    <div className="card-body">
                      {hasActivities ? (
                        <>
                          <h6 className="card-subtitle text-truncate mb-2">
                            {dayActivities.length} {dayActivities.length === 1 ? 'Activity' : 'Activities'}
                          </h6>
                          
                          <div className="activity-summary">
                            <p className="card-text activity-title">
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
                              <p className="text-muted mt-2">
                                <small>+ {dayActivities.length - 1} more {dayActivities.length - 1 === 1 ? 'activity' : 'activities'}</small>
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="card-text text-center text-muted">
                          No activities planned
                        </p>
                      )}
                    </div>
                    
                    <div className="card-footer">
                      <div className="d-flex gap-2 justify-content-between">
                        <div className="dropdown dropup">
                          <button
                            className="btn btn-sm btn-outline-primary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            Add Activity
                          </button>
                          <ul className="dropdown-menu">
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  setNewActivity({...newActivity, day});
                                  setShowForm(true);
                                }}
                              >
                                Create New
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item"
                                onClick={() => handleAddFromWishlistToDay(day)}
                              >
                                From Wishlist
                              </button>
                            </li>
                          </ul>
                        </div>
                        
                        <button 
                          className="btn btn-sm btn-outline-info"
                          onClick={() => openDayModal(day)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
              {getSortedActivitiesForDay(selectedDay).length > 0 ? (
                <div className="timeline">
                  {getSortedActivitiesForDay(selectedDay).map((activity) => (
                    <div key={activity.id} className="card mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="card-title mb-0">
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
              ) : (
                <div className="alert alert-info text-center">
                  No activities planned for this day.
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
            planId={planId} 
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
          font-size: 0.8rem;
          color: #6c757d;
        }
        
        .activity-title {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .activity-summary {
          min-height: 80px;
        }
      `}</style>
    </div>
  );
}

export default PlanningPage; 