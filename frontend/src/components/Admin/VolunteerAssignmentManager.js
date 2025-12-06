import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Loading from '../Common/Loading';

const VolunteerAssignmentManager = () => {
  const [approvedFoods, setApprovedFoods] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedFood, setSelectedFood] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [foodsResponse, volunteersResponse] = await Promise.all([
        api.get('/food/admin/all?approvalStatus=approved&collectionStatus=not_assigned'),
        api.get('/food/volunteers/available')
      ]);
      
      setApprovedFoods(foodsResponse.data.data);
      setVolunteers(volunteersResponse.data.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    setActionLoading(prev => ({ ...prev, autoAssign: true }));
    try {
      const response = await api.post('/food/auto-assign');
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to auto-assign volunteers');
    } finally {
      setActionLoading(prev => ({ ...prev, autoAssign: false }));
    }
  };

  const openAssignModal = (food) => {
    setSelectedFood(food);
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedFood(null);
    setSelectedVolunteer('');
  };

  const handleManualAssign = async () => {
    if (!selectedVolunteer) {
      toast.error('Please select a volunteer');
      return;
    }

    setActionLoading(prev => ({ ...prev, [selectedFood._id]: true }));
    try {
      await api.put(`/food/${selectedFood._id}/assign-volunteer`, {
        volunteerId: selectedVolunteer
      });
      toast.success('Volunteer assigned successfully');
      fetchData();
      closeAssignModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign volunteer');
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedFood._id]: false }));
    }
  };

  const getVolunteersByLocation = (city) => {
    return volunteers.filter(volunteer => 
      volunteer.volunteerApplication?.serviceArea?.toLowerCase().includes(city?.toLowerCase() || '')
    );
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Volunteer Assignment</h1>
            <p className="text-gray-600 mt-2">Assign volunteers to approved food donations</p>
          </div>
          <button
            onClick={handleAutoAssign}
            disabled={actionLoading.autoAssign || approvedFoods.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading.autoAssign ? 'Auto-Assigning...' : 'Auto-Assign All'}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900">Unassigned Foods</h3>
          <p className="text-3xl font-bold text-orange-600">{approvedFoods.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900">Available Volunteers</h3>
          <p className="text-3xl font-bold text-green-600">{volunteers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900">Avg. Assignments</h3>
          <p className="text-3xl font-bold text-blue-600">
            {volunteers.length > 0 ? Math.round(volunteers.reduce((sum, v) => sum + v.activeAssignments, 0) / volunteers.length) : 0}
          </p>
        </div>
      </div>

      {approvedFoods.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">All foods assigned!</h3>
          <p className="text-gray-500">No approved food posts need volunteer assignment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {approvedFoods.map((food) => {
            const localVolunteers = getVolunteersByLocation(food.location?.city);
            
            return (
              <div key={food._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{food.title}</h3>
                      <p className="text-gray-600 mb-3">{food.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Donor:</span>
                          <span className="ml-2 text-gray-600">{food.donor?.name}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <span className="ml-2 text-gray-600">{food.location?.city}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Quantity:</span>
                          <span className="ml-2 text-gray-600">{food.quantity}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Expiry:</span>
                          <span className="ml-2 text-gray-600">
                            {new Date(food.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Approved:</span>
                          <span className="ml-2 text-gray-600">
                            {new Date(food.approvedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Local Volunteers:</span>
                          <span className="ml-2 text-gray-600">{localVolunteers.length}</span>
                        </div>
                      </div>

                      {localVolunteers.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-gray-700">Nearby Volunteers:</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {localVolunteers.slice(0, 3).map((volunteer) => (
                              <span
                                key={volunteer._id}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                              >
                                {volunteer.name} ({volunteer.activeAssignments} active)
                              </span>
                            ))}
                            {localVolunteers.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                +{localVolunteers.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {food.images && food.images.length > 0 && (
                      <div className="ml-6 flex-shrink-0">
                        <img
                          src={food.images[0]}
                          alt={food.title}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openAssignModal(food)}
                      disabled={actionLoading[food._id] || volunteers.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading[food._id] ? 'Assigning...' : 'Assign Volunteer'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Volunteer to "{selectedFood?.title}"
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Volunteer
              </label>
              <select
                value={selectedVolunteer}
                onChange={(e) => setSelectedVolunteer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a volunteer...</option>
                {volunteers.map((volunteer) => (
                  <option key={volunteer._id} value={volunteer._id}>
                    {volunteer.name} - {volunteer.volunteerApplication?.serviceArea || 'No area specified'} 
                    ({volunteer.activeAssignments} active assignments)
                  </option>
                ))}
              </select>
            </div>

            {selectedVolunteer && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Volunteer Details</h4>
                {(() => {
                  const volunteer = volunteers.find(v => v._id === selectedVolunteer);
                  return volunteer ? (
                    <div className="text-sm text-blue-800">
                      <p><strong>Email:</strong> {volunteer.email}</p>
                      <p><strong>Service Area:</strong> {volunteer.volunteerApplication?.serviceArea || 'Not specified'}</p>
                      <p><strong>Active Assignments:</strong> {volunteer.activeAssignments}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAssign}
                disabled={actionLoading[selectedFood?._id] || !selectedVolunteer}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading[selectedFood?._id] ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerAssignmentManager;