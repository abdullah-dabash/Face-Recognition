// src/components/AttendanceReport.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Pie, Bar, Radar } from 'react-chartjs-2';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

const AttendanceReport = ({ lectureId, lectureName }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0
  });

  // Colors for charts - using our purple theme
  const chartColors = {
    present: 'rgba(124, 58, 237, 0.6)', // primary-600 with opacity
    absent: 'rgba(239, 68, 68, 0.6)',    // red-500 with opacity
    method1: 'rgba(139, 92, 246, 0.6)',  // primary-500 with opacity
    method2: 'rgba(168, 85, 247, 0.6)',  // purple-500 with opacity
    border: {
      present: 'rgba(124, 58, 237, 1)',  // primary-600
      absent: 'rgba(239, 68, 68, 1)',    // red-500
      method1: 'rgba(139, 92, 246, 1)',  // primary-500
      method2: 'rgba(168, 85, 247, 1)',  // purple-500
    }
  };

  // Fetch attendance data and students on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all students for this lecture
        const studentsRes = await axios.get(`http://localhost:5000/api/students/${lectureId}`, {
          withCredentials: true,
        });
        
        // Fetch attendance records for this lecture
        const attendanceRes = await axios.get(`http://localhost:5000/api/attendance/${lectureId}`, {
          withCredentials: true,
        });
        
        setStudents(studentsRes.data);
        setAttendanceData(attendanceRes.data);
        
        // Calculate summary statistics
        if (studentsRes.data.length > 0) {
          const totalStudents = studentsRes.data.length;
          const presentStudents = attendanceRes.data.filter(record => record.status === 'present').length;
          const absentStudents = totalStudents - presentStudents;
          const attendancePercentage = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;
          
          setAttendanceSummary({
            present: presentStudents,
            absent: absentStudents,
            total: totalStudents,
            percentage: attendancePercentage.toFixed(2)
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [lectureId]);

  // Generate and download Excel report
  const generateExcelReport = () => {
    // Prepare data for Excel
    const workbook = XLSX.utils.book_new();
    
    // Create attendance summary sheet
    const summaryData = [
      ['Attendance Report Summary'],
      ['Lecture', lectureName || `Lecture ID: ${lectureId}`],
      ['Date', new Date().toLocaleDateString()],
      ['Total Students', attendanceSummary.total],
      ['Present', attendanceSummary.present],
      ['Absent', attendanceSummary.absent],
      ['Attendance Rate', `${attendanceSummary.percentage}%`]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    
    // Create detailed attendance sheet
    const detailedData = [
      ['Student ID', 'Student Name', 'Attendance Status', 'Method', 'Timestamp']
    ];
    
    // Combine student data with attendance records
    students.forEach(student => {
      const attendanceRecord = attendanceData.find(record => record.student._id === student._id);
      
      detailedData.push([
        student._id,
        student.name,
        attendanceRecord ? attendanceRecord.status : 'absent',
        attendanceRecord ? attendanceRecord.method : 'N/A',
        attendanceRecord ? new Date(attendanceRecord.createdAt).toLocaleString() : 'N/A'
      ]);
    });
    
    const detailSheet = XLSX.utils.aoa_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detailed Attendance');
    
    // Generate Excel file and download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    // Generate filename with lecture name and date
    const fileName = `Attendance_${lectureName ? lectureName.replace(/\s+/g, '_') : lectureId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    saveAs(data, fileName);
    setReportGenerated(true);
  };

  // Generate reports and show charts
  const generateReport = () => {
    if (!loading && attendanceData && students.length > 0) {
      setReportGenerated(true);
    }
  };

  // Chart data for Pie chart
  const pieChartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [attendanceSummary.present, attendanceSummary.absent],
        backgroundColor: [chartColors.present, chartColors.absent],
        borderColor: [chartColors.border.present, chartColors.border.absent],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for Bar chart
  const barChartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        label: 'Number of Students',
        data: [attendanceSummary.present, attendanceSummary.absent],
        backgroundColor: [chartColors.present, chartColors.absent],
        borderColor: [chartColors.border.present, chartColors.border.absent],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for Radar chart (attendance by method)
  const getMethodsData = () => {
    const methods = { face: 0, manual: 0 };
    
    attendanceData?.forEach(record => {
      if (record.status === 'present' && record.method) {
        methods[record.method] = (methods[record.method] || 0) + 1;
      }
    });
    
    return {
      labels: ['Face Recognition', 'Manual Entry'],
      datasets: [
        {
          label: 'Attendance by Method',
          data: [methods.face || 0, methods.manual || 0],
          backgroundColor: 'rgba(139, 92, 246, 0.2)', // primary-500 with opacity
          borderColor: 'rgba(139, 92, 246, 1)', // primary-500
          borderWidth: 1,
        },
      ],
    };
  };

  // Bar chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Attendance Distribution',
        color: 'rgba(124, 58, 237, 1)', // primary-600
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-primary-800">Attendance Report</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border-l-4 border-red-500">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Attendance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
              <h3 className="font-semibold text-primary-700 mb-1">Total Students</h3>
              <p className="text-2xl font-bold text-primary-900">{attendanceSummary.total}</p>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
              <h3 className="font-semibold text-primary-700 mb-1">Present</h3>
              <p className="text-2xl font-bold text-primary-900">{attendanceSummary.present}</p>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
              <h3 className="font-semibold text-primary-700 mb-1">Absent</h3>
              <p className="text-2xl font-bold text-primary-900">{attendanceSummary.absent}</p>
            </div>
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
              <h3 className="font-semibold text-primary-700 mb-1">Attendance Rate</h3>
              <p className="text-2xl font-bold text-primary-900">{attendanceSummary.percentage}%</p>
            </div>
          </div>
          
          {/* Report Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
          <button
  onClick={generateReport}
  className="bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-white py-2 px-4 rounded-lg transition-colors"
>
  Generate Report
</button>
            
            <button
              onClick={generateExcelReport}
              className="bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-white py-2 px-4 rounded-lg transition-colors"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Excel
              </span>
            </button>
          </div>
          
          {/* Charts Section */}
          {reportGenerated && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-6 text-primary-800">Attendance Visualization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Pie Chart */}
                <div className="bg-white p-4 rounded-xl shadow-soft border border-neutral-100">
                  <h4 className="text-center font-medium mb-4 text-primary-700">Attendance Distribution</h4>
                  <div className="h-64">
                    <Pie data={pieChartData} />
                  </div>
                </div>
                
                {/* Bar Chart */}
                <div className="bg-white p-4 rounded-xl shadow-soft border border-neutral-100">
                  <h4 className="text-center font-medium mb-4 text-primary-700">Attendance Comparison</h4>
                  <div className="h-64">
                    <Bar data={barChartData} options={barOptions} />
                  </div>
                </div>
                
                {/* Radar Chart */}
                <div className="bg-white p-4 rounded-xl shadow-soft border border-neutral-100">
                  <h4 className="text-center font-medium mb-4 text-primary-700">Attendance Methods</h4>
                  <div className="h-64">
                    <Radar data={getMethodsData()} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Detailed Attendance Table */}
          {reportGenerated && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-primary-800">Detailed Attendance</h3>
              <div className="overflow-x-auto bg-white rounded-xl shadow-soft border border-neutral-100">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-primary-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">
                        Method
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-800 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {students.map(student => {
                      const attendanceRecord = attendanceData.find(record => 
                        record.student._id === student._id
                      );
                      
                      return (
                        <tr key={student._id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              attendanceRecord && attendanceRecord.status === 'present' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attendanceRecord && attendanceRecord.status === 'present' ? 'Present' : 'Absent'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {attendanceRecord ? (
                              <span className="inline-flex items-center">
                                {attendanceRecord.method === 'face' ? (
                                  <>
                                    <svg className="w-4 h-4 mr-1 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Face Recognition
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-1 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Manual
                                  </>
                                )}
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {attendanceRecord ? new Date(attendanceRecord.createdAt).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceReport;