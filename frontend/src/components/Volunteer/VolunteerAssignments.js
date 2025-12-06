import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Loading from '../Common/Loading';

const VolunteerAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    notes: '',
    distributionDetails: {
      recipientCount: '',
      distributionLocation: '',
      distributionNotes: ''
    }
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/food/volunteer/assignments');
      setAssignments(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch assignments');
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAssignment = async (assignmentId) => {
    setActionLoading(prev => ({ ...prev, [assignmentId]: true }));
    try {
      await api.put(`/food/volunteer/assignments/${assignmentId}/accept`);
      toast.success('Assignment accepted successfully');
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept assignment');
    } finally {
      setActionLoading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleRejectAssignment = async (assignmentId) => {
    const reason = prompt('Please provide a reason for rejecting this assignment:');
    if (!reason || !reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    setActionLoading(prev => ({ ...prev, [assignmentId]: true }));
    try {
      await api.put(`/food/volunteer/assignments/${assignmentId}/reject`, { reason: reason.trim() });
      toast.success('Assignment rejected successfully');
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject assignment');
    } finally {
      setActionLoading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const openStatusModal = (assignment, status) => {
    setSelectedAssignment(assignment);
    setStatusUpdate({
      status,
      notes: '',
      distributionDetails: {
        recipientCount: '',
        distributionLocation: '',
        distributionNotes: ''
      }
    });
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedAssignment(null);
    setStatusUpdate({
      status: '',
      notes: '',
      distributionDetails: {
        recipientCount: '',
        distributionLocation: '',
        distributionNotes: ''
      }
    });
  };

  const handleStatusUpdate = async () => {
    if (!selectedAssignment) return;

    setActionLoading(prev => ({ ...prev, [selectedAssignment._id]: true }));
    try {
      const updateData = {
        status: statusUpdate.status,
        notes: statusUpdate.notes
      };

      if (statusUpdate.status === 'distributed') {
        updateData.distributionDetails = statusUpdate.distributionDetails;
      }

      await api.put(`/food/${selectedAssignment.foodPost._id}/collection-status`, updateData);
      toast.success(`Status updated to ${statusUpdate.status}`);
      fetchAssignments();
      closeStatusModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedAssignment._id]: false }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      collected: 'bg-orange-100 text-orange-800',
      distributed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextActions = (assignment) => {
    const actions = [];
    switch (assignment.status) {
      case 'assigned':
        actions.push({ label: 'Accept', action: () => handleAcceptAssignment(assignment._id), color: 'bg-blue-600 hover:bg-blue-700' });
        actions.push({ label: 'Reject', action: () => handleRejectAssignment(assignment._id), color: 'bg-red-600 hover:bg-red-700' });
        break;
      case 'accepted':
        actions.push({ label: 'Mark as Collected', action: () => openStatusModal(assignment, 'collected'), color: 'bg-orange-600 hover:bg-orange-700' });
        break;
      case 'collected':
        actions.push({ label: 'Mark as Distributed', action: () => openStatusModal(assignment, 'distributed'), color: 'bg-green-600 hover:bg-green-700' });
        break;
      default:
        break;
    }
    return actions;
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-gray-600 mt-2">Manage your food collection and distribution assignments</p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No assignments yet</h3>
          <p className="text-gray-500">You'll see your volunteer assignments here when they're available.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {assignment.foodPost?.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{assignment.foodPost?.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Donor:</span>
                        <span className="ml-2 text-gray-600">{assignment.foodPost?.donor?.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Contact:</span>
                        <span className="ml-2 text-gray-600">{assignment.foodPost?.donor?.email}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Pickup Address:</span>
                        <span className="ml-2 text-gray-600">{assignment.foodPost?.location?.address}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <span className="ml-2 text-gray-600">{assignment.foodPost?.quantity}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Assigned:</span>
                        <span className="ml-2 text-gray-600">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {assignment.acceptedAt && (
                        <div>
                          <span className="font-medium text-gray-700">Accepted:</span>
                          <span className="ml-2 text-gray-600">
                            {new Date(assignment.acceptedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {assignment.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">Notes:</span>
                        <p className="text-gray-600 mt-1">{assignment.notes}</p>
                      </div>
                    )}

                    {assignment.distributionDetails && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-gray-700">Distribution Details:</span>
                        <div className="mt-2 text-sm">
                          {assignment.distributionDetails.recipientCount && (
                            <p><strong>Recipients:</strong> {assignment.distributionDetails.recipientCount}</p>
                          )}
                          {assignment.distributionDetails.distributionLocation && (
                            <p><strong>Location:</strong> {assignment.distributionDetails.distributionLocation}</p>
                          )}
                          {assignment.distributionDetails.distributionNotes && (
                            <p><strong>Notes:</strong> {assignment.distributionDetails.distributionNotes}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {assignment.foodPost?.images && assignment.foodPost.images.length > 0 && (
                    <div className="ml-6 flex-shrink-0">
                      <img
                        src={assignment.foodPost.images[0]}
                        alt={assignment.foodPost.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  {getNextActions(assignment).map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      disabled={actionLoading[assignment._id]}
                      className={`px-4 py-2 text-white rounded-lg ${action.color} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                    >
                      {actionLoading[assignment._id] ? 'Processing...' : action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Status to {statusUpdate.status.charAt(0).toUpperCase() + statusUpdate.status.slice(1)}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this update..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                />
              </div>

              {statusUpdate.status === 'distributed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Recipients
                    </label>
                    <input
                      type="number"
                      value={statusUpdate.distributionDetails.recipientCount}
                      onChange={(e) => setStatusUpdate(prev => ({
                        ...prev,
                        distributionDetails: {
                          ...prev.distributionDetails,
                          recipientCount: e.target.value
                        }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distribution Location
                    </label>
                    <input
                      type="text"
                      value={statusUpdate.distributionDetails.distributionLocation}
                      onChange={(e) => setStatusUpdate(prev => ({
                        ...prev,
                        distributionDetails: {
                          ...prev.distributionDetails,
                          distributionLocation: e.target.value
                        }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Community Center, Shelter"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distribution Notes
                    </label>
                    <textarea
                      value={statusUpdate.distributionDetails.distributionNotes}
                      onChange={(e) => setStatusUpdate(prev => ({
                        ...prev,
                        distributionDetails: {
                          ...prev.distributionDetails,
                          distributionNotes: e.target.value
                        }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="2"
                      placeholder="Additional details about the distribution..."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeStatusModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={actionLoading[selectedAssignment?._id]}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading[selectedAssignment?._id] ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerAssignments;