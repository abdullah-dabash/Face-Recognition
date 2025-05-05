// src/components/FaceRecognition.jsx
import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import axios from 'axios';

const FaceRecognition = ({ students, lectureId, onAttendanceMarked }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [captureMode, setCaptureMode] = useState('single'); // 'single' or 'continuous'
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureComplete, setCaptureComplete] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading face recognition models...');
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  // Load face-api models
  const loadModels = async () => {
    try {
      // Use a CDN for models
      const modelUrl = 'https://justadudewhohacks.github.io/face-api.js/models';
      
      setLoadingMessage('Loading SSD MobileNet model...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
      
      setLoadingMessage('Loading face landmark model...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
      
      setLoadingMessage('Loading face recognition model...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
      
      setIsModelLoaded(true);
      setLoadingMessage('Models loaded successfully. Starting camera...');
      
      // Log success
      setDebugInfo(prev => ({
        ...prev,
        modelsLoaded: true,
        modelLoadTime: new Date().toISOString()
      }));

      // Start camera immediately after models load
      startCamera();
    } catch (error) {
      console.error('Error loading models:', error);
      setLoadingMessage(`Error loading face models: ${error.message}`);
      setDebugInfo(prev => ({
        ...prev,
        modelsLoaded: false,
        modelLoadError: error.message
      }));
    }
  };

  // Initialize face matcher with student descriptors
  const initializeFaceMatcher = () => {
    if (!students || students.length === 0 || !isModelLoaded) {
      setDebugInfo(prev => ({
        ...prev,
        matcherInitialized: false,
        matcherInitReason: !students ? "No students" : 
                        students.length === 0 ? "Empty students array" : 
                        !isModelLoaded ? "Models not loaded" : "Unknown reason"
      }));
      return;
    }

    try {
      // Debug student data
      const studentDebugInfo = students.map(student => ({
        id: student._id,
        name: student.name,
        hasFaceImage: !!student.faceImage,
        hasFaceDescriptor: !!student.faceDescriptor,
        descriptorType: student.faceDescriptor ? typeof student.faceDescriptor : 'none',
        descriptorLength: student.faceDescriptor ? 
          (typeof student.faceDescriptor === 'string' ? 
            JSON.parse(student.faceDescriptor).length : 
            Array.isArray(student.faceDescriptor) ? 
              student.faceDescriptor.length : 'unknown') : 'none'
      }));
      
      setDebugInfo(prev => ({
        ...prev,
        studentData: studentDebugInfo
      }));

      // Filter students that have descriptors
      const studentsWithDescriptors = students.filter(student => {
        if (!student.faceDescriptor) return false;
        
        let descriptor;
        try {
          // Parse descriptor if it's a string
          if (typeof student.faceDescriptor === 'string') {
            descriptor = JSON.parse(student.faceDescriptor);
          } else if (Array.isArray(student.faceDescriptor)) {
            descriptor = student.faceDescriptor;
          } else {
            return false;
          }
          
          // Ensure it has the right length
          return Array.isArray(descriptor) && descriptor.length === 128;
        } catch (e) {
          console.error('Error parsing descriptor for student:', student.name, e);
          return false;
        }
      });

      console.log('Students with valid descriptors:', studentsWithDescriptors.length);
      setDebugInfo(prev => ({
        ...prev,
        validDescriptorsCount: studentsWithDescriptors.length
      }));
      
      if (studentsWithDescriptors.length === 0) {
        console.warn('No valid face descriptors found in students data');
        setLoadingMessage('No student face data available. Please add students with clear face images.');
        
        // Start camera anyway even if no descriptors
        startCamera();
        return;
      }

      // Create labeled descriptors for face matcher
      const labeledDescriptors = studentsWithDescriptors.map(student => {
        let descriptorArray;
        
        if (typeof student.faceDescriptor === 'string') {
          descriptorArray = JSON.parse(student.faceDescriptor);
        } else {
          descriptorArray = student.faceDescriptor;
        }
        
        return new faceapi.LabeledFaceDescriptors(
          student._id, // Use student ID as label
          [new Float32Array(descriptorArray)] // Ensure descriptor is Float32Array
        );
      });

      // Create face matcher with labeled descriptors
      const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
      setFaceMatcher(matcher);
      setLoadingMessage('Face recognition ready! Click "Capture Attendance" to begin.');
      setDebugInfo(prev => ({
        ...prev,
        matcherInitialized: true,
        matcherCreatedAt: new Date().toISOString()
      }));
      
      // Ensure camera is started
      if (!isCameraActive) {
        startCamera();
      }
    } catch (error) {
      console.error('Error initializing face matcher:', error);
      setLoadingMessage('Error setting up face recognition. Check console for details.');
      setDebugInfo(prev => ({
        ...prev,
        matcherInitialized: false,
        matcherInitError: error.message
      }));
      
      // Start camera anyway even if matcher fails
      startCamera();
    }
  };

  useEffect(() => {
    loadModels();
    
    // Cleanup function to stop camera
    return () => {
      stopCamera();
    };
  }, []);

  // Set up face matcher when models are loaded and students data is available
  useEffect(() => {
    if (isModelLoaded && students && students.length > 0) {
      initializeFaceMatcher();
    }
  }, [isModelLoaded, students]);

  // Start the camera
  const startCamera = async () => {
    // Skip if camera is already active
    if (isCameraActive) return;
    
    try {
      setLoadingMessage('Accessing camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          // Set up canvas dimensions once video is loaded
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.clientWidth;
            canvasRef.current.height = videoRef.current.clientHeight;
          }
          setIsCameraActive(true);
          setLoadingMessage('Camera active. ' + (faceMatcher ? 'Click "Capture Attendance" to begin.' : 'No student data available.'));
          
          setDebugInfo(prev => ({
            ...prev,
            cameraActive: true,
            cameraStartedAt: new Date().toISOString()
          }));
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setLoadingMessage('Error accessing camera. Please check permissions: ' + error.message);
      setDebugInfo(prev => ({
        ...prev,
        cameraActive: false,
        cameraError: error.message
      }));
    }
  };

  // Stop the camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
      
      setDebugInfo(prev => ({
        ...prev,
        cameraActive: false,
        cameraStopped: true,
        cameraStoppedAt: new Date().toISOString()
      }));
    }
  };

  // Mark attendance for a recognized student
  const markAttendance = async (studentId) => {
    // Check if this student has already been recognized in this session
    if (recognizedStudents.includes(studentId)) return;
    
    try {
      // Call API to mark attendance
      await axios.post('http://localhost:5000/api/attendance/auto', {
        studentId: studentId,
        lectureId: lectureId,
      }, {
        withCredentials: true
      });
      
      // Update local state
      setRecognizedStudents(prev => [...prev, studentId]);
      
      // Notify parent component
      onAttendanceMarked(studentId);
      
      // Find student name for the notification
      const student = students.find(s => s._id === studentId);
      const studentName = student ? student.name : `Student #${studentId}`;
      
      // Show success message
      setLoadingMessage(`✅ Recognized and marked ${studentName} as present!`);
      
      // Reset message after 3 seconds
      setTimeout(() => {
        setLoadingMessage('Face recognition active. Looking for students...');
      }, 3000);
      
      console.log(`Attendance marked for student ${studentId}`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      setLoadingMessage('Error marking attendance. Please try again.');
      
      // Reset message after 3 seconds
      setTimeout(() => {
        setLoadingMessage('Face recognition active. Looking for students...');
      }, 3000);
    }
  };

  // Capture a single attendance frame
  const captureAttendance = async () => {
    if (!videoRef.current || !canvasRef.current || !faceMatcher) {
      setLoadingMessage('Cannot capture attendance. Make sure camera is active and students are enrolled.');
      return;
    }
    
    setIsCapturing(true);
    setLoadingMessage('Capturing attendance... Please look at the camera.');
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.clientWidth, height: video.clientHeight };
      
      // Match display size
      faceapi.matchDimensions(canvas, displaySize);
      
      // Detect all faces with landmarks and descriptors
      const detections = await faceapi.detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Resize detections to match display size
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      // Clear previous drawings
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Store matched students in this capture
      const matchedStudents = [];

      // For each detected face, find best match and draw results
      if (resizedDetections.length > 0) {
        for (const detection of resizedDetections) {
          const descriptor = detection.descriptor;
          const match = faceMatcher.findBestMatch(descriptor);
          
          const box = detection.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, { 
            label: match.toString(),
            boxColor: match.distance < 0.6 ? 'green' : 'red'
          });
          drawBox.draw(canvas);
          
          // If match is good enough and not an unknown person, mark attendance
          if (match.distance < 0.6 && match.label !== 'unknown') {
            matchedStudents.push(match.label);
          }
        }
        
        // Process matched students (mark attendance for each)
        for (const studentId of matchedStudents) {
          await markAttendance(studentId);
        }
        
        if (matchedStudents.length > 0) {
          setLoadingMessage(`✅ Recognized ${matchedStudents.length} student(s)!`);
        } else {
          setLoadingMessage('No students recognized in this capture. Try again.');
        }
      } else {
        setLoadingMessage('No faces detected. Please make sure you are visible to the camera.');
      }
      
      // Indicate capture is complete
      setCaptureComplete(true);
      
      // Keep the detection result visible for a moment
      setTimeout(() => {
        // Clear canvas after a delay
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }, 3000);
    } catch (error) {
      console.error('Error in face detection:', error);
      setLoadingMessage(`Error during capture: ${error.message}`);
    } finally {
      setIsCapturing(false);
    }
  };

  // Detect faces continuously (for continuous mode)
  const detectFacesContinuously = async () => {
    if (!videoRef.current || !canvasRef.current || !faceMatcher || !isCameraActive) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.clientWidth, height: video.clientHeight };
    
    // Match display size
    faceapi.matchDimensions(canvas, displaySize);

    try {
      // Detect all faces with landmarks and descriptors
      const detections = await faceapi.detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Resize detections to match display size
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      // Clear previous drawings
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // For each detected face, find best match and draw results
      if (resizedDetections.length > 0) {
        resizedDetections.forEach(detection => {
          const box = detection.detection.box;
          
          // If we have a face matcher, try to match the face
          if (faceMatcher) {
            const descriptor = detection.descriptor;
            const match = faceMatcher.findBestMatch(descriptor);
            
            const drawBox = new faceapi.draw.DrawBox(box, { 
              label: match.toString(),
              boxColor: match.distance < 0.6 ? 'green' : 'red'
            });
            drawBox.draw(canvas);
            
            // If match is good enough and not an unknown person, mark attendance
            if (match.distance < 0.6 && match.label !== 'unknown') {
              markAttendance(match.label);
            }
          } else {
            // Just draw a box around the face if no matcher
            const drawBox = new faceapi.draw.DrawBox(box, { 
              label: 'Face Detected',
              boxColor: 'blue'
            });
            drawBox.draw(canvas);
          }
        });
      }

      // Continue detection loop if in continuous mode
      if (captureMode === 'continuous' && isCapturing) {
        requestAnimationFrame(detectFacesContinuously);
      }
    } catch (error) {
      console.error('Error in face detection:', error);
      setTimeout(() => {
        if (captureMode === 'continuous' && isCapturing) {
          detectFacesContinuously();
        }
      }, 1000); // Retry after delay
    }
  };

  // Toggle capture mode between single and continuous
  const toggleCaptureMode = () => {
    const newMode = captureMode === 'single' ? 'continuous' : 'single';
    setCaptureMode(newMode);
    setLoadingMessage(`Switched to ${newMode} capture mode`);
    
    // If switching to continuous mode, start capturing
    if (newMode === 'continuous') {
      setIsCapturing(true);
      detectFacesContinuously();
    } else {
      setIsCapturing(false);
    }
  };

  // Start/stop continuous capture
  const toggleContinuousCapture = () => {
    if (captureMode !== 'continuous') return;
    
    if (isCapturing) {
      setIsCapturing(false);
      setLoadingMessage('Continuous capture stopped');
    } else {
      setIsCapturing(true);
      setLoadingMessage('Continuous capture started');
      detectFacesContinuously();
    }
  };

  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Face Recognition Attendance</h2>
        <button 
          onClick={toggleDebugMode}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          {debugMode ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>
      
      {/* Debug Information */}
      {debugMode && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs font-mono overflow-x-auto">
          <h3 className="font-bold mb-1">Debug Info:</h3>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
      
      {/* Loading / Status Message */}
      <div className="bg-blue-100 p-4 rounded-lg mb-4">
        <p className="text-blue-700">{loadingMessage}</p>
      </div>
      
      {/* Capture Controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={isCameraActive ? stopCamera : startCamera}
          className={`px-4 py-2 rounded-lg text-white font-medium ${
            isCameraActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isCameraActive ? 'Stop Camera' : 'Start Camera'}
        </button>
        
        {isCameraActive && faceMatcher && (
          <>
            {captureMode === 'single' ? (
              <button
                onClick={captureAttendance}
                disabled={isCapturing}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  isCapturing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isCapturing ? 'Capturing...' : 'Capture Attendance'}
              </button>
            ) : (
              <button
                onClick={toggleContinuousCapture}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  isCapturing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isCapturing ? 'Stop Capturing' : 'Start Continuous Capture'}
              </button>
            )}
            
            <button
              onClick={toggleCaptureMode}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
            >
              {captureMode === 'single' ? 'Switch to Continuous Mode' : 'Switch to Single Capture Mode'}
            </button>
          </>
        )}
      </div>
      
      {/* Camera View */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden relative">
        {isCameraActive && (
          <div className="bg-blue-500 text-white px-3 py-1 text-sm absolute top-2 left-2 z-10 rounded-full">
            Camera Active
          </div>
        )}
        
        <video 
          ref={videoRef} 
          className="w-full" 
          autoPlay 
          muted 
          playsInline
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full"
        />
        
        {recognizedStudents.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg">
            {recognizedStudents.length} student{recognizedStudents.length !== 1 ? 's' : ''} recognized
          </div>
        )}
      </div>
      
      {/* Recognized Students List */}
      {recognizedStudents.length > 0 && (
        <div className="mt-4 p-4 bg-green-100 rounded-lg">
          <h3 className="font-semibold text-green-800">Recognized Students:</h3>
          <ul className="mt-2">
            {recognizedStudents.map(id => {
              const student = students.find(s => s._id === id);
              return (
                <li key={id} className="text-green-700">
                  ✅ {student ? student.name : `Student #${id}`}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FaceRecognition;