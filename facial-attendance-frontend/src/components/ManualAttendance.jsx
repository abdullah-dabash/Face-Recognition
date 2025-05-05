// src/components/ManualAttendance.jsx
import { useState } from 'react';
import axios from 'axios';

const ManualAttendance = ({ lectureId, selectedStudent, onClose }) => {
  const [status, setStatus] = useState('present'); // Default to present
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axios.post('http://localhost:5000/api/attendance/manual', {
        studentId: selectedStudent,
        lectureId,
        status,
      }, {
        withCredentials: true // Added this line to fix 401 error
      });

      setMessage('Attendance marked successfully');
      
      // Close after a short delay to show success message
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96 max-w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Mark Attendance</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="font-medium text-gray-700">Attendance Status:</p>
            
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="present"
                  checked={status === 'present'}
                  onChange={() => setStatus('present')}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Present</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="absent"
                  checked={status === 'absent'}
                  onChange={() => setStatus('absent')}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Absent</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2 px-4 rounded-xl text-white ${
                loading 
                  ? 'bg-green-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Marking...' : 'Mark Attendance'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-xl text-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualAttendance;