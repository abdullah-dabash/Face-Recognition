import { useEffect, useState } from 'react';
import axios from 'axios';

const StudentAttendanceHistory = ({ student, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/attendance/student/${student._id}`,
          { withCredentials: true }
        );
        setAttendanceHistory(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching attendance history:', err);
        setError('Failed to load attendance history');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceHistory();
  }, [student._id]);

  // Group records by date for better display
  const groupedByDate = attendanceHistory.reduce((groups, record) => {
    const date = new Date(record.date);
    const dateKey = date.toLocaleDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(record);
    return groups;
  }, {});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-purple-800">
              Attendance History: {student.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : attendanceHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for this student.
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateStr) => (
                <div key={dateStr} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2">
                    {dateStr}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left text-sm text-gray-600 font-semibold">Time</th>
                          <th className="px-4 py-2 text-left text-sm text-gray-600 font-semibold">Lecture</th>
                          <th className="px-4 py-2 text-left text-sm text-gray-600 font-semibold">Status</th>
                          <th className="px-4 py-2 text-left text-sm text-gray-600 font-semibold">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedByDate[dateStr]
                          .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort times in descending order
                          .map((record) => (
                            <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm">
                                {new Date(record.date).toLocaleTimeString()}
                              </td>
                              <td className="px-4 py-2 text-sm">{record.lectureName || 'Unknown'}</td>
                              <td className="px-4 py-2 text-sm">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    record.status === 'present'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {record.status === 'present' ? 'Present' : 'Absent'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                  record.method === 'face' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {record.method === 'face' ? 'Face Recognition' : 'Manual'}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceHistory;