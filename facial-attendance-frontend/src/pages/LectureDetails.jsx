import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddStudentForm from '../pages/AddStudentForm';
import FaceRecognition from '../components/FaceRecognition';
import ManualAttendance from '../components/ManualAttendance';
import AttendanceReport from '../components/AttendanceReport';
import StudentAttendanceHistory from '../components/StudentAttendanceHistory';

const LectureDetails = () => {
  const { lectureId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState([]);
  const [showFaceRecognition, setShowFaceRecognition] = useState(false);
  const [showAttendanceReport, setShowAttendanceReport] = useState(false);
  const [viewingStudentAttendance, setViewingStudentAttendance] = useState(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch lecture details
      const lectureRes = await axios.get(`http://localhost:5000/api/lectures/${lectureId}`, {
        withCredentials: true,
      });

      // Fetch students for this lecture
      const studentsRes = await axios.get(`http://localhost:5000/api/students/${lectureId}`, {
        withCredentials: true,
      });

      // Fetch existing attendance for this lecture to mark those already present
      const attendanceRes = await axios.get(`http://localhost:5000/api/attendance/${lectureId}`, {
        withCredentials: true,
      });

      setLecture(lectureRes.data);
      
      // Process student data to ensure face descriptors are properly formatted
      const studentsWithDescriptors = studentsRes.data.map(student => {
        // Convert descriptor from array/string to Float32Array if it exists
        if (student.faceDescriptor) {
          let descriptor;
          
          // Handle different descriptor formats (string, array, etc.)
          if (typeof student.faceDescriptor === 'string') {
            try {
              descriptor = new Float32Array(JSON.parse(student.faceDescriptor));
            } catch (e) {
              console.error('Error parsing face descriptor for student:', student.name);
              descriptor = null;
            }
          } else if (Array.isArray(student.faceDescriptor)) {
            descriptor = new Float32Array(student.faceDescriptor);
          } else {
            descriptor = student.faceDescriptor;
          }
          
          return {
            ...student,
            descriptor: descriptor
          };
        }
        
        return student;
      });
      
      setStudents(studentsWithDescriptors);
      
      // Set already marked attendance from API response
      if (attendanceRes.data && Array.isArray(attendanceRes.data)) {
        const markedStudentIds = attendanceRes.data
          .filter(record => record.status === 'present')
          .map(record => record.student);
          
        setAttendanceMarked(markedStudentIds);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching lecture data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lectureId]);

  // Check for studentHistory in URL when students load
  useEffect(() => {
    const studentHistoryId = searchParams.get('studentHistory');
    if (studentHistoryId && students.length > 0) {
      // Find the student in the students array
      const student = students.find(s => s._id === studentHistoryId);
      if (student) {
        setViewingStudentAttendance(student);
      }
    }
  }, [searchParams, students]);

  // Handle marking attendance manually
  const handleMarkAttendance = async (studentId) => {
    // Skip if already marked
    if (attendanceMarked.includes(studentId)) return;
    
    try {
      await axios.post('http://localhost:5000/api/attendance/manual', {
        studentId: studentId,
        lectureId,
        status: 'present'
      }, {
        withCredentials: true
      });
      
      // Add to marked attendance in state
      setAttendanceMarked(prev => [...prev, studentId]);
      
      // Show success message
      setSuccess('Attendance marked successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError('Failed to mark attendance. Please try again.');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  // Toggle face recognition mode
  const toggleFaceRecognition = () => {
    setShowFaceRecognition(prev => !prev);
    if (showAttendanceReport) setShowAttendanceReport(false);
  };

  // Toggle attendance report
  const toggleAttendanceReport = () => {
    setShowAttendanceReport(prev => !prev);
    if (showFaceRecognition) setShowFaceRecognition(false);
  };

  // Functions for handling student attendance history
  const openAttendanceHistory = (student) => {
    setViewingStudentAttendance(student);
    setSearchParams({ studentHistory: student._id });
  };
  
  const closeAttendanceHistory = () => {
    setViewingStudentAttendance(null);
    // Remove the query parameter but keep the lectureId in the URL
    navigate(`/lectures/${lectureId}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-800 mb-2">
          {lecture?.title || 'Lecture'}
        </h1>
        {lecture && (
          <div className="flex flex-wrap gap-2 items-center text-gray-600">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{lecture.time}</span>
            </div>
            {lecture.days && (
              <div className="flex flex-wrap gap-1">
                {lecture.days.map(day => (
                  <span key={day} className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                    {day.substring(0, 3)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
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
      
      {/* Action Buttons */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center">
            <div className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {students.length} Students
            </div>
            <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full ml-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {attendanceMarked.length} Present
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              onClick={() => setShowAddStudentForm(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Add Student
            </button>
            
            <button
              className={`${
                showFaceRecognition 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              } text-white py-2 px-4 rounded-lg flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
              onClick={toggleFaceRecognition}
            >
              {showFaceRecognition ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Stop Recognition
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Start Recognition
                </>
              )}
            </button>
            
            <button
              className={`${
                showAttendanceReport 
                  ? 'bg-indigo-700 hover:bg-indigo-800' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white py-2 px-4 rounded-lg flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              onClick={toggleAttendanceReport}
            >
              {showAttendanceReport ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Hide Report
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Report Section */}
      {showAttendanceReport && (
        <div className="mb-8">
          <AttendanceReport 
            lectureId={lectureId} 
            lectureName={lecture?.title}
          />
        </div>
      )}

      {/* Face Recognition Section */}
      {showFaceRecognition && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
          <FaceRecognition 
            students={students} 
            lectureId={lectureId}
            onAttendanceMarked={(studentId) => {
              setAttendanceMarked(prev => 
                prev.includes(studentId) ? prev : [...prev, studentId]
              );
              
              // Show success message
              setSuccess('Student marked present via face recognition!');
              
              // Clear success message after 3 seconds
              setTimeout(() => {
                setSuccess('');
              }, 3000);
            }} 
          />
        </div>
      )}

      {/* Students Grid */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-purple-800">Students</h2>
          {!loading && students.length > 0 && (
            <div className="text-sm text-gray-500">
              {attendanceMarked.length} of {students.length} present
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
            <p className="text-gray-500 mb-6">Add your first student to start taking attendance</p>
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg inline-flex items-center transition-colors"
              onClick={() => setShowAddStudentForm(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Your First Student
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student._id}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg`}
              >
                <div className={`h-2 ${
                  attendanceMarked.includes(student._id) 
                    ? 'bg-green-500' 
                    : 'bg-purple-600'
                }`}></div>
                <div className="p-4">
                  <div className="relative mb-3">
                    {student.faceImage ? (
                      <img
                        src={`http://localhost:5000/${student.faceImage}`}
                        alt={student.name}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Present badge */}
                    {attendanceMarked.includes(student._id) && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Present
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{student.name}</h3>
                  
                  {/* Attendance button */}
                  <button
                    onClick={() => handleMarkAttendance(student._id)}
                    className={`w-full py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center ${
                      attendanceMarked.includes(student._id)
                        ? 'bg-green-100 text-green-800 cursor-default'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                    disabled={attendanceMarked.includes(student._id)}
                  >
                    {attendanceMarked.includes(student._id) ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Marked Present
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Mark as Present
                      </>
                    )}
                  </button>
                  
                  {/* Attendance History button - UPDATED */}
                  <button 
                    onClick={() => openAttendanceHistory(student)} 
                    className="w-full mt-2 py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center 
                      bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Attendance History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conditionally render the AddStudentForm */}
      {showAddStudentForm && (
        <AddStudentForm
          lectureId={lectureId}
          onClose={() => {
            setShowAddStudentForm(false);
            fetchData(); // Refresh data after adding student
          }}
        />
      )}

      {/* Conditionally render the ManualAttendance (advanced options) */}
      {selectedStudent && (
        <ManualAttendance
          lectureId={lectureId}
          selectedStudent={selectedStudent}
          onClose={() => {
            setSelectedStudent(null);
            fetchData(); // Refresh data after marking attendance
          }}
        />
      )}
      
      {/* Student Attendance History Modal - UPDATED */}
      {viewingStudentAttendance && (
        <StudentAttendanceHistory
          student={viewingStudentAttendance}
          onClose={closeAttendanceHistory}
        />
      )}
    </div>
  );
};

export default LectureDetails;