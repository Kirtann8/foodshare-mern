import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const VolunteerApplication = () => {
  const { user, applyForVolunteer } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    motivation: '',
    serviceArea: '',
    availability: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await applyForVolunteer(formData);
    
    if (result.success) {
      toast.success(result.message);
      navigate('/profile');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  // Check application status
  const applicationStatus = user?.volunteerApplication?.status;

  if (user?.role === 'volunteer') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Already a Volunteer!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for being part of our volunteer community. You can now help moderate food posts and assist with food distribution.
          </p>
          <button
            onClick={() => navigate('/volunteer')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Go to Volunteer Panel
          </button>
        </div>
      </div>
    );
  }

  if (applicationStatus === 'pending') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h2>
          <p className="text-gray-600 mb-4">
            Your volunteer application is currently being reviewed by our admin team.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Application Details:</h3>
            <p><span className="font-medium">Applied on:</span> {new Date(user.volunteerApplication.appliedAt).toLocaleDateString()}</p>
            <p><span className="font-medium">Service Area:</span> {user.volunteerApplication.serviceArea}</p>
            <p><span className="font-medium">Status:</span> <span className="text-yellow-600 font-medium">Pending Review</span></p>
          </div>
        </div>
      </div>
    );
  }

  if (applicationStatus === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Approved</h2>
          <p className="text-gray-600 mb-6">
            Unfortunately, your volunteer application was not approved at this time. You can apply again in the future.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Apply Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Become a Volunteer</h2>
        <p className="text-gray-600">
          Join our community of volunteers to help moderate food posts and assist with food distribution in your area.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-2">
            Why do you want to become a volunteer? *
          </label>
          <textarea
            id="motivation"
            name="motivation"
            rows={4}
            required
            maxLength={500}
            value={formData.motivation}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about your motivation to help the community..."
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {formData.motivation.length}/500 characters
          </div>
        </div>

        <div>
          <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Service Area/City *
          </label>
          <input
            type="text"
            id="serviceArea"
            name="serviceArea"
            required
            value={formData.serviceArea}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Downtown Mumbai, Bangalore North, etc."
          />
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
            Availability (Optional)
          </label>
          <input
            type="text"
            id="availability"
            name="availability"
            value={formData.availability}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Weekends, Evenings after 6 PM, etc."
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Volunteer Responsibilities:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Review and approve/reject food donation posts</li>
            <li>• Ensure food safety and post quality</li>
            <li>• Help coordinate food collection and distribution</li>
            <li>• Assist community members with food sharing</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.motivation.trim() || !formData.serviceArea.trim()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VolunteerApplication;