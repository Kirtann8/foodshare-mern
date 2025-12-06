import React, { useState, useRef, useEffect } from 'react';
import { foodAPI } from '../../services/api';

const FoodQualityScanner = ({ onAssessmentComplete, className = "" }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError('');
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
  };

  const analyzeImage = async (imageData) => {
    setLoading(true);
    setError('');

    try {
      const response = await foodAPI.assessFoodQuality({ image: imageData });
      
      if (response.success) {
        // Add captured image to assessment data
        const assessmentWithImage = {
          ...response.data,
          captured_image: imageData
        };
        setAssessment(assessmentWithImage);
        onAssessmentComplete(assessmentWithImage);
      } else {
        throw new Error(response.error || 'Assessment failed');
      }
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Analysis failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      setCapturedImage(imageData);
      analyzeImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const resetScanner = () => {
    setAssessment(null);
    setCapturedImage(null);
    setIsScanning(false);
    setError('');
  };

  return (
    <div className={`bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">🤖</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">AI Food Quality Scanner</h3>
          <p className="text-sm text-gray-600">Advanced computer vision analysis</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!isScanning && !assessment && !capturedImage && (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📸</span>
          </div>
          <p className="text-gray-600 mb-4">Scan your food to get instant quality assessment</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setIsScanning(true);
                startCamera();
              }}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg"
            >
              📷 Use Camera
            </button>
            <label className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg cursor-pointer">
              📁 Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-h-80 object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {cameraActive && (
              <div className="absolute inset-0 border-4 border-green-400 rounded-lg pointer-events-none">
                <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={capturePhoto}
              disabled={!cameraActive}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
            >
              📸 Capture Photo
            </button>
            
            <button
              onClick={() => {
                setIsScanning(false);
                stopCamera();
              }}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {capturedImage && !assessment && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden">
            <img src={capturedImage} alt="Captured food" className="w-full max-h-80 object-cover" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => analyzeImage(capturedImage)}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </div>
              ) : (
                '🔍 Analyze Food Quality'
              )}
            </button>
            <button
              onClick={() => setCapturedImage(null)}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300"
            >
              Retake
            </button>
          </div>
        </div>
      )}

      {assessment && (
        <div className="space-y-4">
          {assessment.captured_image && (
            <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
              <h4 className="text-lg font-bold text-gray-800 mb-3">Scanned Image</h4>
              <img 
                src={assessment.captured_image} 
                alt="Scanned food" 
                className="w-full max-h-60 object-cover rounded-lg"
              />
            </div>
          )}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                assessment.quality_grade === 'Excellent' ? 'bg-green-100 text-green-600' :
                assessment.quality_grade === 'Good' ? 'bg-blue-100 text-blue-600' :
                assessment.quality_grade === 'Fair' ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                {assessment.quality_grade === 'Excellent' ? '🌟' :
                 assessment.quality_grade === 'Good' ? '✅' :
                 assessment.quality_grade === 'Fair' ? '⚠️' : '❌'}
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">Quality Assessment Complete</h4>
                <p className="text-sm text-gray-600">AI-powered analysis results</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Freshness Score</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        assessment.freshness_score >= 80 ? 'bg-green-500' :
                        assessment.freshness_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${assessment.freshness_score}%` }}
                    />
                  </div>
                  <span className="font-bold text-lg">{assessment.freshness_score}%</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Quality Grade</div>
                <div className={`font-bold text-lg ${
                  assessment.quality_grade === 'Excellent' ? 'text-green-600' :
                  assessment.quality_grade === 'Good' ? 'text-blue-600' :
                  assessment.quality_grade === 'Fair' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {assessment.quality_grade}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Estimated Shelf Life</div>
                <div className="font-bold text-lg text-gray-800">{assessment.shelf_life_days} days</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Estimated Servings</div>
                <div className="font-bold text-lg text-gray-800">{assessment.estimated_servings}</div>
              </div>
              
              {assessment.food_category && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Food Category</div>
                  <div className="font-bold text-lg text-gray-800 capitalize">{assessment.food_category}</div>
                </div>
              )}
              
              {assessment.ensemble_predictions && (
                <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                  <div className="text-sm text-gray-600 mb-1">AI Model Predictions</div>
                  <div className="text-xs text-gray-500">
                    {assessment.ensemble_predictions.join(' • ')}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700">AI Recommendations:</div>
              {assessment.recommendations.map((rec, index) => (
                <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  {rec}
                </div>
              ))}
            </div>

            <div className={`mt-4 p-3 rounded-lg ${
              assessment.donation_suitable 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="font-semibold">
                {assessment.donation_suitable ? '✅ Suitable for Donation' : '❌ Not Recommended for Donation'}
              </div>
              <div className="text-sm mt-1">
                Confidence: {assessment.confidence}%
              </div>
            </div>
          </div>

          <button
            onClick={resetScanner}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
          >
            Scan Another Item
          </button>
        </div>
      )}
    </div>
  );
};

export default FoodQualityScanner;