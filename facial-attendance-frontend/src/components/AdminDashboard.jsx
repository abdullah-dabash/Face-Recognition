import { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/doctors', { withCredentials: true });
      setDoctors(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load doctors. Please try again.');
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    
    try {
      await axios.post('http://localhost:5000/api/admin/doctors', { username, password }, { withCredentials: true });
      setUsername('');
      setPassword('');
      fetchDoctors();
      setSuccess('Doctor added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add doctor. Please try again.');
      console.error('Error creating doctor:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/doctors/${id}`, { withCredentials: true });
      fetchDoctors();
      setSuccess('Doctor removed successfully!');
      setConfirmDelete(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to delete doctor. Please try again.');
      console.error('Error deleting doctor:', err);
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage doctors and system settings</p>
      </div>
      
      {/* Notifications */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Doctor Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleCreate} className="bg-white shadow-md rounded-xl overflow-hidden">
            <div className="bg-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Add New Doctor</h2>
              <p className="text-purple-200 text-sm">Create account for a new doctor</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Enter password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Add Doctor
              </button>
            </div>
          </form>
          
          {/* System Stats Card - Can be expanded later */}
          <div className="bg-white shadow-md rounded-xl mt-6 p-6">
            <h2 className="text-xl font-semibold text-purple-800 mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Doctors:</span>
                <span className="font-semibold">{doctors.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Active Doctors:</span>
                <span className="font-semibold">{doctors.filter(d => d.status !== 'inactive').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">System Status:</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Online</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Doctors List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <div className="bg-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Manage Doctors</h2>
              <p className="text-purple-200 text-sm">View and manage doctor accounts</p>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="mt-2 text-sm font-medium">No doctors found</p>
                  <p className="text-xs">Add a new doctor to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {doctors.map((doc) => (
                    <div key={doc._id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <div className="bg-purple-100 rounded-full p-2 mr-3">
                              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{doc.username}</p>
                              {/* Removed creation date */}
                            </div>
                          </div>
                        </div>
                        <div>
                          {confirmDelete === doc._id ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleDelete(doc._id)}
                                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(doc._id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;