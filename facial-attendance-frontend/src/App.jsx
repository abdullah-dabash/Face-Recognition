import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import DoctorDashboard from './pages/DoctorDashboard';
import LectureDetails from './pages/LectureDetails';
import AddStudentForm from './pages/AddStudentForm';
import AdminDashboard from './components/AdminDashboard';
import ManualAttendance from './components/ManualAttendance';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import StudentAttendanceHistory from './components/StudentAttendanceHistory';
import './index.css'; // Make sure you have your tailwind styles imported

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navigation />
        <main className="flex-grow">
          <Routes>
            <Route 
            path="/students/:studentId/attendance" 
            element={
               <ProtectedRoute>
               <StudentAttendanceHistory />
               </ProtectedRoute>
                } 
                />
            {/* Public Routes */}
            <Route path="/" element={<Login />} />

            {/* Protected Routes */}
            <Route  
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lectures/:lectureId" 
              element={
                <ProtectedRoute>
                  <LectureDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lectures/:lectureId/add-student" 
              element={
                <ProtectedRoute>
                  <AddStudentForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lectures/:lectureId/mark-manual-attendance" 
              element={
                <ProtectedRoute>
                  <ManualAttendance />
                </ProtectedRoute>
              } 
            />

            {/* Admin Route */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <footer className="bg-white py-4 border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-neutral-500">
              © {new Date().getFullYear()} Face Attendance System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;