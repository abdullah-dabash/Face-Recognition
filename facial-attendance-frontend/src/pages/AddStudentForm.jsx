// src/components/AddStudentForm.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';

const AddStudentForm = ({ lectureId, onClose }) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [extractedDescriptor, setExtractedDescriptor] = useState(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Load face-api models when component mounts
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingMessage('Loading face detection models...');
        // Use CDN for models
        const modelUrl = 'https://justadudewhohacks.github.io/face-api.js/models';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
        setModelsLoaded(true);
        setLoadingMessage('Face detection models loaded successfully');
        console.log('Face detection models loaded successfully');
      } catch (error) {
        console.error('Error loading face detection models:', error);
        setError('Failed to load face detection models: ' + error.message);
      }
    };
    
    loadModels();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setFaceDetected(false);
      setExtractedDescriptor(null);
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        // Detect face in the image once it's loaded
        if (modelsLoaded) {
          setTimeout(() => detectFace(reader.result), 100);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Detect face in the uploaded image
  const detectFace = async (imageUrl) => {
    try {
      setLoadingMessage('Detecting face in image...');
      
      // Create a temporary image element
      const img = new Image();
      img.src = imageUrl;
      
      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Set up canvas for visualization
      if (canvasRef.current) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        
        // Detect face and compute descriptor
        const detections = await faceapi.detectAllFaces(img)
          .withFaceLandmarks()
          .withFaceDescriptors();
        
        if (detections.length === 0) {
          setFaceDetected(false);
          setError('No face detected in the image. Please upload a clearer photo.');
          setLoadingMessage('');
          return;
        }
        
        if (detections.length > 1) {
          setFaceDetected(false);
          setError('Multiple faces detected. Please upload an image with only one face.');
          setLoadingMessage('');
          return;
        }
        
        // Draw face detection results on canvas
        const ctx = canvasRef.current.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        // Draw detection
        const detection = detections[0];
        const box = detection.detection.box;
        
        // Draw rectangle around face
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Store the descriptor
        const descriptor = Array.from(detection.descriptor);
        setExtractedDescriptor(descriptor);
        setFaceDetected(true);
        setLoadingMessage('Face detected successfully!');
        setError('');
      }
    } catch (error) {
      console.error('Error detecting face:', error);
      setFaceDetected(false);
      setError('Error processing face: ' + error.message);
      setLoadingMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Student name is required');
      return;
    }

    if (!image) {
      setError('Please upload a face image');
      return;
    }

    if (!faceDetected || !extractedDescriptor) {
      setError('No valid face detected in the image. Please upload a clearer photo.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Create form data with name, image, and descriptor
      const formData = new FormData();
      formData.append('name', name);
      formData.append('lectureId', lectureId);
      formData.append('faceImage', image);
      
      // Add the face descriptor as a string
      formData.append('faceDescriptor', JSON.stringify(extractedDescriptor));

      // Log the data being sent
      console.log('Sending student data:', {
        name,
        lectureId,
        hasImage: !!image,
        descriptorLength: extractedDescriptor.length
      });

      // Submit to backend
      const response = await axios.post('http://localhost:5000/api/students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      console.log('Student added successfully:', response.data);
      setLoading(false);
      onClose(); // Close the modal after successful submission
    } catch (err) {
      setLoading(false);
      setError('Error adding student: ' + (err.response?.data?.message || err.message));
      console.error('Error:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Add Student</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {loadingMessage && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg">
            {loadingMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Student Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="faceImage" className="block text-sm font-medium text-gray-700">
              Upload Face Image
            </label>
            <input
              id="faceImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
            
            {/* Preview the selected image */}
            {previewUrl && (
              <div className="mt-3">
                <p className="text-sm text-gray-500 mb-1">
                  {faceDetected ? '✅ Face detected' : 'Image Preview:'}
                </p>
                <div className="relative">
                  <img 
                    ref={imageRef}
                    src={previewUrl} 
                    alt="Preview" 
                    className={`w-full object-contain rounded-md border ${
                      faceDetected ? 'border-green-500' : 'border-gray-300'
                    }`}
                    style={{ maxHeight: '200px' }}
                  />
                  {/* Canvas for face detection visualization */}
                  <canvas 
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ display: 'none' }} // Hidden canvas for processing
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading || !modelsLoaded || !faceDetected}
              className={`px-4 py-2 rounded-lg text-white font-medium ${
                loading || !modelsLoaded || !faceDetected
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Adding...' : 'Add Student'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-black px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          {!modelsLoaded && (
            <p className="mt-3 text-sm text-gray-500">
              Please wait for face detection models to load...
            </p>
          )}
          
          {modelsLoaded && !faceDetected && previewUrl && (
            <p className="mt-3 text-sm text-yellow-600">
              No face detected in the image. Please upload a clearer photo.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddStudentForm;