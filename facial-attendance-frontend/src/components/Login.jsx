import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  // Animate eye icon periodically
  useEffect(() => {
    const animInterval = setInterval(() => {
      setScanning(true);
      setTimeout(() => {
        setScanning(false);
      }, 2000);
    }, 5000);
    
    return () => clearInterval(animInterval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setScanning(true);
    
    try {
      const res = await api.post('/auth/login', { username, password });
      const user = res.data;

      localStorage.setItem('user', JSON.stringify(user));

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid credentials');
      setIsLoading(false);
      setScanning(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-indigo-900 overflow-hidden">
        {/* Animated Grid Lines */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'moveGrid 15s linear infinite',
        }}>
        </div>
        
        {/* Animated Particles */}
        <div className="absolute top-0 left-0 w-3 h-3 bg-blue-400 rounded-full opacity-40"
          style={{ animation: 'floatParticle1 8s ease-in-out infinite' }}></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-purple-300 rounded-full opacity-30"
          style={{ animation: 'floatParticle2 12s ease-in-out infinite' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-indigo-400 rounded-full opacity-20"
          style={{ animation: 'floatParticle3 15s ease-in-out infinite' }}></div>
          
        {/* More animated elements */}
        <div className="absolute top-1/2 left-3/4 w-32 h-32 bg-purple-600 rounded-full opacity-10 blur-3xl"
          style={{ animation: 'pulseGlow 7s ease-in-out infinite' }}></div>
        <div className="absolute bottom-1/3 right-1/2 w-40 h-40 bg-indigo-500 rounded-full opacity-10 blur-3xl"
          style={{ animation: 'pulseGlow 9s ease-in-out infinite' }}></div>
      </div>

      {/* Content Container */}
      <div className="relative flex w-full items-center justify-center px-4 z-10">
        {/* Eye Icon Section - Left Side */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/3 pr-8">
          <div className="relative w-64 h-64">
            {/* Eye Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Outer Ring */}
              <div className="w-64 h-64 rounded-full border-4 border-blue-400 opacity-80"></div>
              
              {/* Middle Ring - Rotating */}
              <div className={`absolute w-48 h-48 rounded-full border-2 border-dashed border-purple-400 
                ${scanning ? 'animate-spin' : ''}`} 
                style={{ animationDuration: '3s' }}></div>
              
              {/* Inner Circle */}
              <div className="absolute w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full 
                flex items-center justify-center shadow-lg">
                {/* Pupil */}
                <div className={`w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center 
                  transition-all duration-500 ${scanning ? 'scale-125' : ''}`}>
                  {/* Center Dot */}
                  <div className="w-6 h-6 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Scan Line */}
              <div className={`absolute w-full h-1 bg-blue-400 opacity-0 transition-all duration-1000 
                ${scanning ? 'opacity-70' : ''}`} 
                style={{ 
                  transform: scanning ? 'translateY(0)' : 'translateY(-50px)',
                  animation: scanning ? 'scanMove 2s ease-in-out' : 'none'
                }}></div>
              
              {/* Circuitry Lines */}
              <svg className="absolute w-full h-full" viewBox="0 0 200 200">
                {/* Digital Circuit Lines */}
                <path d="M30,100 L10,100" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4" 
                  className={`${scanning ? 'animate-pulse' : ''}`} />
                <path d="M190,100 L170,100" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4" 
                  className={`${scanning ? 'animate-pulse' : ''}`} />
                <path d="M100,30 L100,10" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4" 
                  className={`${scanning ? 'animate-pulse' : ''}`} />
                <path d="M100,190 L100,170" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4" 
                  className={`${scanning ? 'animate-pulse' : ''}`} />
                
                {/* Connection Points */}
                <circle cx="10" cy="100" r="3" fill="#A78BFA" className={`${scanning ? 'animate-ping' : ''}`} />
                <circle cx="190" cy="100" r="3" fill="#A78BFA" className={`${scanning ? 'animate-ping' : ''}`} />
                <circle cx="100" cy="10" r="3" fill="#A78BFA" className={`${scanning ? 'animate-ping' : ''}`} />
                <circle cx="100" cy="190" r="3" fill="#A78BFA" className={`${scanning ? 'animate-ping' : ''}`} />
                
                {/* Diagonal Lines */}
                <path d="M40,40 L20,20" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4" 
                  className={`${scanning ? 'animate-pulse' : ''}`} />
                <path d="M160,40 L180,20" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4" 
                  className={`${scanning ? 'animate-pulse' : ''}`} />
                <path d="M40,160 L20,180" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4" 
                  className={`${scanning ? 'animate-pulse' : ''}`} />
                <path d="M160,160 L180,180" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4" 
                  className={`${scanning ? 'animate-pulse' : ''}`} />
                
                {/* Corner Connection Points */}
                <circle cx="20" cy="20" r="3" fill="#A78BFA" className={`${scanning ? 'animate-ping' : ''}`} />
                <circle cx="180" cy="20" r="3" fill="#A78BFA" className={`${scanning ? 'animate-ping' : ''}`} />
                <circle cx="20" cy="180" r="3" fill="#A78BFA" className={`${scanning ? 'animate-ping' : ''}`} />
                <circle cx="180" cy="180" r="3" fill="#A78BFA" className={`${scanning ? 'animate-ping' : ''}`} />
              </svg>
            </div>
          </div>
          
          {/* Text Below Eye */}
          <div className="mt-6 text-center">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">AI Vision</h2>
            <p className="text-purple-200 mt-2">Smart Recognition Technology</p>
          </div>
        </div>
        
        {/* Login Form - Right Side */}
        <div className="w-full md:w-2/3 lg:w-1/2 xl:w-1/3 px-4">
          {/* App Logo/Name */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white">AI Powered Attendance Tracker</h1>
            <p className="text-purple-200 mt-2">Student attendance made simple</p>
          </div>
          
          {/* Login Card */}
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-white border-opacity-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-6">
              <h2 className="text-xl font-semibold text-white">Welcome Back</h2>
              <p className="text-purple-200 text-sm">Please sign in to continue</p>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border-l-4 border-red-500 text-red-100 rounded">
                  <p className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-purple-100 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-10 border border-purple-300 border-opacity-30 
                    text-white placeholder-purple-200 placeholder-opacity-60 focus:outline-none focus:ring-2 
                    focus:ring-purple-500 focus:border-transparent transition-colors"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-purple-100">
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-10 border border-purple-300 border-opacity-30 
                    text-white placeholder-purple-200 placeholder-opacity-60 focus:outline-none focus:ring-2 
                    focus:ring-purple-500 focus:border-transparent transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-medium text-white ${
                  isLoading 
                    ? 'bg-purple-500 bg-opacity-50 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-900'
                } transition-all`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
          
          {/* Footer */}
          <div className="mt-6 text-center text-sm text-purple-300">
            <p>© {new Date().getFullYear()} Face Attendance System. All rights reserved.</p>
          </div>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes moveGrid {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        
        @keyframes floatParticle1 {
          0%, 100% { transform: translate(10vw, 10vh); }
          50% { transform: translate(15vw, 15vh); }
        }
        
        @keyframes floatParticle2 {
          0%, 100% { transform: translate(-5vw, -5vh); }
          50% { transform: translate(5vw, 5vh); }
        }
        
        @keyframes floatParticle3 {
          0%, 100% { transform: translate(7vw, -7vh); }
          50% { transform: translate(-7vw, 7vh); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.05; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.2); }
        }
        
        @keyframes scanMove {
          0% { transform: translateY(-50px); }
          50% { transform: translateY(50px); }
          100% { transform: translateY(-50px); }
        }
      `}</style>
    </div>
  );
}

export default Login;