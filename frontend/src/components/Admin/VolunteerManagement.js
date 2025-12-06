import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI, communicationAPI } from '../../services/api';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import { toast } from 'react-toastify';

const VolunteerManagement = () => {
  const [activeTab, setActiveTab] = useState('assignments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Assignment management
  const [unassignedFoods, setUnassignedFoods] = useState([]);
  const [availableVolunteers, setAvailableVolunteers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  
  // Service area analytics
  const [serviceAreaData, setServiceAreaData] = useState({
    serviceAreas: [],
    foodDistribution: []
  });
  
  // Auto-assignment
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, fetchData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'assignments') {
        // Fetch unassigned approved food posts
        const foodResponse = await adminAPI.getAllFoods({ 
          approvalStatus: 'approved', 
          collectionStatus: 'not_assigned',
          limit: 50 
        });
        setUnassignedFoods(foodResponse.data);
        
        // Fetch available volunteers
        const volunteerResponse = await adminAPI.getAvailableVolunteers();
        setAvailableVolunteers(volunteerResponse.data);
      } else if (activeTab === 'analytics') {
        const analyticsResponse = await communicationAPI.getVolunteerServiceAreas();
        setServiceAreaData(analyticsResponse.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const handleAutoAssign = async () => {
    try {
      setAutoAssignLoading(true);
      const response = await adminAPI.autoAssignVolunteers();
      toast.success(response.message);
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(err.error || 'Auto-assignment failed');
    } finally {
      setAutoAssignLoading(false);
    }
  };

  const handleManualAssign = async () => {
    if (!selectedVolunteer) {
      toast.error('Please select a volunteer');
      return;
    }

    try {
      await adminAPI.assignVolunteer(selectedFood._id, selectedVolunteer);
      toast.success('Volunteer assigned successfully!');
      setShowAssignModal(false);
      setSelectedFood(null);
      setSelectedVolunteer('');
      fetchData();
    } catch (err) {
      toast.error(err.error || 'Failed to assign volunteer');
    }
  };

  const openAssignModal = (food) => {
    setSelectedFood(food);
    setShowAssignModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 sm:p-8 rounded-2xl mb-6 sm:mb-8 shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">🎯 Volunteer Management</h1>
        <p className="text-indigo-50 text-sm sm:text-base">Manage volunteer assignments and monitor service areas</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-8 bg-white p-2 rounded-xl shadow-md">
        <button 
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base ${
            activeTab === 'assignments' ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`} 
          onClick={() => setActiveTab('assignments')}
        >
          🎯 Assignment Management
        </button>
        <button 
          className={`flex-1 px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base ${
            activeTab === 'analytics' ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`} 
          onClick={() => setActiveTab('analytics')}
        >
          📊 Service Area Analytics
        </button>
      </div>

      {/* Assignment Management Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Auto-Assignment Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🤖 Auto-Assignment</h2>
                <p className="text-gray-600">Automatically assign volunteers to food posts based on location and availability</p>
              </div>
              <button
                onClick={handleAutoAssign}
                disabled={autoAssignLoading || unassignedFoods.length === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  autoAssignLoading || unassignedFoods.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700'
                }`}
              >
                {autoAssignLoading ? '🔄 Processing...' : '🚀 Run Auto-Assignment'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-2xl font-bold text-orange-800">{unassignedFoods.length}</div>
                <div className="text-orange-600 text-sm">Unassigned Posts</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-2xl font-bold text-blue-800">{availableVolunteers.length}</div>
                <div className="text-blue-600 text-sm">Available Volunteers</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-2xl font-bold text-green-800">
                  {Math.min(unassignedFoods.length, availableVolunteers.length)}
                </div>
                <div className="text-green-600 text-sm">Potential Matches</div>
              </div>
            </div>
          </div>

          {/* Manual Assignment Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 Manual Assignment</h2>
            
            {unassignedFoods.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-lg">All approved food posts have been assigned!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unassignedFoods.map((food) => (
                  <div key={food._id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{food.title}</h3>
                        <p className="text-gray-600 mb-3">{food.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Donor:</h4>
                            <p className="text-gray-600">{food.donor?.name}</p>
                            <p className="text-gray-500 text-sm">{food.donor?.email}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Location:</h4>
                            <p className="text-gray-600">{food.location?.address}</p>
                            <p className="text-gray-500 text-sm">{food.location?.city}, {food.location?.state}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Pickup Window:</h4>
                            <p className="text-gray-600 text-sm">
                              {formatDate(food.pickupTiming?.startTime)} - {formatDate(food.pickupTiming?.endTime)}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-1">Expiry:</h4>
                            <p className="text-gray-600 text-sm">{formatDate(food.expiryDate)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="lg:w-48">
                        <button
                          onClick={() => openAssignModal(food)}
                          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all duration-300"
                        >
                          👤 Assign Volunteer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Service Area Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Volunteer Service Areas */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🗺️ Volunteer Service Areas</h2>
              
              {serviceAreaData.serviceAreas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No service area data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceAreaData.serviceAreas.map((area, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-blue-900">{area._id}</h3>
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
                          {area.volunteerCount} volunteers
                        </span>
                      </div>
                      <div className="text-sm text-blue-700">
                        {area.volunteers.slice(0, 3).map(v => v.name).join(', ')}
                        {area.volunteers.length > 3 && ` +${area.volunteers.length - 3} more`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Food Distribution by City */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🍽️ Food Distribution by City</h2>
              
              {serviceAreaData.foodDistribution.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No food distribution data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceAreaData.foodDistribution.map((city, index) => (
                    <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-green-900">{city._id}</h3>
                        <div className="flex gap-2">
                          <span className="bg-green-600 text-white px-2 py-1 rounded-full text-sm">
                            {city.foodPostCount} total
                          </span>
                          <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-sm">
                            {city.availableCount} available
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${((city.foodPostCount - city.availableCount) / city.foodPostCount) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-sm text-green-700 mt-1">
                        {Math.round(((city.foodPostCount - city.availableCount) / city.foodPostCount) * 100)}% distributed
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Assignment Modal */}
      {showAssignModal && selectedFood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">👤 Assign Volunteer</h3>
            <p className="text-gray-600 mb-4">Select a volunteer for: <strong>{selectedFood.title}</strong></p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Volunteers</label>
              <select
                value={selectedVolunteer}
                onChange={(e) => setSelectedVolunteer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a volunteer...</option>
                {availableVolunteers
                  .filter(volunteer => {
                    // Filter volunteers by service area if possible
                    if (selectedFood.location?.city && volunteer.volunteerApplication?.serviceArea) {
                      const volunteerArea = volunteer.volunteerApplication.serviceArea.toLowerCase();
                      const foodCity = selectedFood.location.city.toLowerCase();
                      return volunteerArea.includes(foodCity) || foodCity.includes(volunteerArea);
                    }
                    return true;
                  })
                  .map((volunteer) => (
                    <option key={volunteer._id} value={volunteer._id}>
                      {volunteer.name} - {volunteer.volunteerApplication?.serviceArea || 'No area specified'} 
                      ({volunteer.activeAssignments} active)
                    </option>
                  ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedFood(null);
                  setSelectedVolunteer('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAssign}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all duration-300"
              >
                Assign Volunteer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerManagement;