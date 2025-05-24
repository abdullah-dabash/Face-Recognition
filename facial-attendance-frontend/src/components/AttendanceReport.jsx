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
  BarController,
  PointElement,
  LineElement,
  DoughnutController
} from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
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
  BarController,
  PointElement,
  LineElement,
  DoughnutController
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

  // Colors using purple for present and red for absent
  const chartColors = {
    present: 'rgba(109, 40, 217, 0.7)',  // Purple-700
    absent: 'rgba(239, 68, 68, 0.7)',    // Red-500
    face: 'rgba(124, 58, 237, 0.7)',     // Purple-600
    manual: 'rgba(167, 139, 250, 0.7)',  // Purple-400
    border: {
      present: 'rgba(109, 40, 217, 1)',  // Purple-700
      absent: 'rgba(239, 68, 68, 1)',    // Red-500
      face: 'rgba(124, 58, 237, 1)',     // Purple-600
      manual: 'rgba(167, 139, 250, 1)'   // Purple-400
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
          const attendancePercentage = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;
          
          setAttendanceSummary({
            present: presentStudents,
            absent: absentStudents,
            total: totalStudents,
            percentage: attendancePercentage
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

  // Chart data for Pie chart with whole numbers
  const pieChartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [attendanceSummary.present, attendanceSummary.absent],
        backgroundColor: [chartColors.present, chartColors.absent],
        borderColor: [chartColors.border.present, chartColors.border.absent],
        borderWidth: 2,
        hoverOffset: 15
      },
    ],
  };

  // Chart options for pie chart with animation
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart'
    }
  };

  // Chart data for attendance methods bar chart
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
          label: 'Attendance Method',
          data: [methods.face || 0, methods.manual || 0],
          backgroundColor: [chartColors.face, chartColors.manual],
          borderColor: [chartColors.border.face, chartColors.border.manual],
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    };
  };

  // Chart options for methods bar chart
  const methodsBarOptions = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} students`;
          }
        }
      },
      title: {
        display: true,
        text: 'Attendance by Method',
        font: {
          size: 14,
          weight: 'bold'
        },
        color: '#6D28D9' // Purple-700
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0 // Only show whole numbers
        },
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    },
    animation: {
      delay: (context) => context.dataIndex * 300,
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  // Get gender distribution data (example of a non-date based third chart)
  const getAttendanceProgressData = () => {
    // Calculate percentages
    const totalStudents = attendanceSummary.total;
    const presentPercent = Math.round((attendanceSummary.present / totalStudents) * 100) || 0;
    const targetPercent = 75; // Example target attendance rate
    const remainingPercent = 100 - presentPercent;
    
    return {
      labels: ['Current Attendance', 'Target (75%)', 'Remaining'],
      datasets: [
        {
          data: [presentPercent, targetPercent, remainingPercent],
          backgroundColor: [
            chartColors.present,
            'rgba(167, 139, 250, 0.5)', // Light purple for target
            'rgba(243, 244, 246, 0.7)'  // Gray for remaining
          ],
          borderColor: [
            chartColors.border.present,
            'rgba(167, 139, 250, 0.9)',
            'rgba(243, 244, 246, 0.9)'
          ],
          borderWidth: 1,
          circumference: 270, // Create semi-circle
          rotation: 225,     // Rotate to look like a gauge
        }
      ]
    };
  };

  // Chart options for the doughnut chart
  const doughnutOptions = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          }
        }
      },
      title: {
        display: true,
        text: 'Attendance Progress',
        font: {
          size: 14,
          weight: 'bold'
        },
        color: '#6D28D9' // Purple-700
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000
    }
  };

  // Animated percentage display component
  const AnimatedPercentage = ({ value, color, size = 'text-5xl' }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      let start = 0;
      const end = parseInt(value);
      
      // No animation if value is 0
      if (start === end) return;
      
      // Speed of count animation (lower = faster)
      let duration = 2000 / end;
      
      // Counter animation
      let timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) clearInterval(timer);
      }, duration);
      
      // Clean up timer
      return () => {
        clearInterval(timer);
      };
    }, [value]);
    
    return (
      <div className="text-center">
        <span className={`${size} font-bold ${color}`}>{count}%</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-purple-800">Attendance Report</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border-l-4 border-red-500">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Attendance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="font-semibold text-purple-700 mb-1">Total Students</h3>
              <p className="text-2xl font-bold text-purple-900">{attendanceSummary.total}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-700 mb-1">Present</h3>
              <p className="text-2xl font-bold text-purple-900">{attendanceSummary.present}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <h3 className="font-semibold text-red-700 mb-1">Absent</h3>
              <p className="text-2xl font-bold text-red-900">{attendanceSummary.absent}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="font-semibold text-purple-700 mb-1">Attendance Rate</h3>
              <p className="text-2xl font-bold text-purple-900">{attendanceSummary.percentage}%</p>
            </div>
          </div>
          
          {/* Report Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={generateReport}
              className="bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Generate Report
            </button>
            
            <button
              onClick={generateExcelReport}
              className="bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Download Excel
            </button>
          </div>
          
          {/* Charts Section */}
          {reportGenerated && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-6 text-purple-800 border-b pb-2">Attendance Visualization</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Pie Chart */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                  <h4 className="text-center font-medium mb-4 text-purple-700">Present vs. Absent</h4>
                  <div className="h-64 flex items-center justify-center">
                    <Pie data={pieChartData} options={pieOptions} />
                  </div>
                </div>
                
                {/* Methods Bar Chart */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                  <h4 className="text-center font-medium mb-4 text-purple-700">Attendance Methods</h4>
                  <div className="h-64 flex items-center justify-center">
                    <Bar data={getMethodsData()} options={methodsBarOptions} />
                  </div>
                </div>
                
                {/* Attendance Progress Chart (Gauge) */}
                <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                  <h4 className="text-center font-medium mb-4 text-purple-700">Attendance Progress</h4>
                  <div className="h-64 flex flex-col items-center justify-center">
                    <div className="relative w-full h-48 flex items-center justify-center">
                      <Doughnut data={getAttendanceProgressData()} options={doughnutOptions} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <AnimatedPercentage value={attendanceSummary.percentage} color="text-purple-700" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Detailed Attendance Table */}
          {reportGenerated && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-purple-800 border-b pb-2">Detailed Attendance</h3>
              <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-purple-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">
                        Method
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map(student => {
                      const attendanceRecord = attendanceData.find(record => 
                        record.student._id === student._id
                      );
                      
                      return (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                            {student._id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              attendanceRecord && attendanceRecord.status === 'present' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {attendanceRecord && attendanceRecord.status === 'present' ? 'Present' : 'Absent'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {attendanceRecord ? (
                              attendanceRecord.method === 'face' ? 'Face Recognition' : 'Manual'
                            ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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