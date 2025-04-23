import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import usePoseDetection, { PoseMode, PoseFeedback } from '../hooks/usePoseDetection';
import PoseSelector, { PoseTemplate, olympiaPoses } from '../components/PoseSelector';
import PoseOverlay from '../components/PoseOverlay';
import PoseScore from '../components/PoseScore';

interface CameraProps {
  mode: PoseMode;
}

const Camera: React.FC<CameraProps> = ({ mode }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<{ withKeypoints: string; withoutKeypoints: string } | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [selectedPose, setSelectedPose] = useState<PoseTemplate | null>(null);

  const { 
    poses, 
    loading, 
    feedback, 
    isDetecting, 
    detectPose, 
    captureSnapshot,
    scorePoseAgainstTemplate,
    poseScore,
    scoreFeedback,
    backendReady
  } = usePoseDetection(mode);

  // Start pose detection when camera is ready
  useEffect(() => {
    if (isCameraReady && !loading) {
      console.log("Starting pose detection");

      // Ensure we have a reasonable delay before starting detection
      const startDetection = setTimeout(() => {
        const interval = setInterval(() => {
          if (webcamRef.current?.video && webcamRef.current.video.readyState === 4) {
            // Log video dimensions periodically
            if (webcamRef.current.video.videoWidth > 0) {
              console.log(`Video dimensions: ${webcamRef.current.video.videoWidth}x${webcamRef.current.video.videoHeight}`);
            }

            // If a pose is selected, score against template, otherwise just detect
            if (selectedPose && mode === 'fitness') {
              scorePoseAgainstTemplate(webcamRef.current.video, selectedPose);
            } else {
              detectPose(webcamRef.current.video);
            }
          }
        }, 100); // Detect pose every 100ms for better responsiveness (was 1000ms)

        return () => clearInterval(interval);
      }, 2000); // Wait 2 seconds after camera is ready before starting detection

      return () => clearTimeout(startDetection);
    }
  }, [isCameraReady, loading, detectPose, scorePoseAgainstTemplate, selectedPose, mode]);

  // Draw pose on canvas
  useEffect(() => {
    if (poses.length > 0 && canvasRef.current && webcamRef.current?.video) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw keypoints and connections
        const pose = poses[0];
        if (pose.keypoints) {
          // Draw keypoints
          pose.keypoints.forEach((keypoint) => {
            if (keypoint.score && keypoint.score > 0.3) {
              // Check if this keypoint has feedback
              const keypointFeedback = feedback.find((f) => f.part === keypoint.name);

              ctx.beginPath();
              ctx.arc(keypoint.x, keypoint.y, 8, 0, 2 * Math.PI);

              // Color based on feedback
              if (keypointFeedback) {
                ctx.fillStyle = keypointFeedback.severity === 'warning' ? '#FF6B6B' : 
                                keypointFeedback.severity === 'error' ? '#FF0000' : 
                                keypointFeedback.severity === 'success' ? '#4CAF50' : '#00BFFF';
              } else {
                ctx.fillStyle = '#00BFFF';
              }

              ctx.fill();
            }
          });

          // Draw connections between keypoints
          const connections = [
            ['left_shoulder', 'right_shoulder'],
            ['left_shoulder', 'left_elbow'],
            ['right_shoulder', 'right_elbow'],
            ['left_elbow', 'left_wrist'],
            ['right_elbow', 'right_wrist'],
            ['left_shoulder', 'left_hip'],
            ['right_shoulder', 'right_hip'],
            ['left_hip', 'right_hip'],
            ['left_hip', 'left_knee'],
            ['right_hip', 'right_knee'],
            ['left_knee', 'left_ankle'],
            ['right_knee', 'right_ankle']
          ];

          const keypointMap = new Map(
            pose.keypoints.map(keypoint => [keypoint.name, keypoint])
          );

          ctx.lineWidth = 3;

          connections.forEach(([startName, endName]) => {
            const startPoint = keypointMap.get(startName);
            const endPoint = keypointMap.get(endName);

            if (startPoint && endPoint && 
                startPoint.score && endPoint.score && 
                startPoint.score > 0.3 && endPoint.score > 0.3) {

              // Check if either point has feedback
              const startFeedback = feedback.find((f) => f.part === startName);
              const endFeedback = feedback.find((f) => f.part === endName);

              if (startFeedback || endFeedback) {
                const severity = startFeedback?.severity || endFeedback?.severity;
                ctx.strokeStyle = severity === 'warning' ? '#FF6B6B' : 
                                  severity === 'error' ? '#FF0000' : 
                                  severity === 'success' ? '#4CAF50' : '#00BFFF';
              } else {
                ctx.strokeStyle = '#00BFFF';
              }

              ctx.beginPath();
              ctx.moveTo(startPoint.x, startPoint.y);
              ctx.lineTo(endPoint.x, endPoint.y);
              ctx.stroke();
            }
          });
        }
      }
    }
  }, [poses, feedback]);

  // Handle camera ready state
  const handleVideoReady = () => {
    console.log("Camera is ready");
    setIsCameraReady(true);
  };

  // Capture snapshot
  const handleCapture = useCallback(() => {
    if (webcamRef.current?.video) {
      setIsCapturing(true);

      // Capture with keypoints
      const snapshotWithKeypoints = captureSnapshot(webcamRef.current.video);

      // Capture without keypoints (pure video frame)
      const canvas = document.createElement('canvas');
      const video = webcamRef.current.video;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx && snapshotWithKeypoints) {
        // Draw only the video frame without keypoints
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const snapshotWithoutKeypoints = canvas.toDataURL('image/png');

        setCapturedImage({
          withKeypoints: snapshotWithKeypoints,
          withoutKeypoints: snapshotWithoutKeypoints
        });
      }

      setIsCapturing(false);
    }
  }, [captureSnapshot]);

  // Download captured image
  const handleDownload = useCallback((withKeypoints: boolean) => {
    if (!capturedImage) return;

    const imageUrl = withKeypoints ? 
      capturedImage.withKeypoints : 
      capturedImage.withoutKeypoints;

    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      const suffix = withKeypoints ? '-with-keypoints' : '';
      link.download = `pose-coach${suffix}-${new Date().toISOString()}.png`;
      link.click();
    }
  }, [capturedImage]);

  // Reset captured image
  const handleReset = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Toggle camera between front and back
  const toggleCamera = useCallback(() => {
    setFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
    // Reset camera ready state to trigger re-initialization
    setIsCameraReady(false);
    // Small delay to ensure camera switches properly
    setTimeout(() => {
      setIsCameraReady(true);
    }, 300);
  }, []);

  // Handle pose selection
  const handleSelectPose = useCallback((pose: PoseTemplate) => {
    setSelectedPose(prevPose => prevPose?.id === pose.id ? null : pose);
  }, []);

  // Render feedback messages
  const renderFeedback = (feedbackItems: PoseFeedback[]) => {
    return (
      <div className="mt-4 space-y-2">
        {feedbackItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg ${
              item.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
              item.severity === 'error' ? 'bg-red-100 text-red-800' :
              item.severity === 'success' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {item.message}
          </motion.div>
        ))}
      </div>
    );
  };

  // Add debug info to the UI
  const renderDebugInfo = () => {
    return (
      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
        <p>Camera Ready: {isCameraReady ? 'Yes' : 'No'}</p>
        <p>TensorFlow Ready: {backendReady ? 'Yes' : 'No'}</p>
        <p>Model Loaded: {!loading ? 'Yes' : 'No'}</p>
        <p>Detecting: {isDetecting ? 'Yes' : 'No'}</p>
        <p>Poses Detected: {poses.length}</p>
        <p>Video Size: {webcamRef.current?.video?.videoWidth || 0}x{webcamRef.current?.video?.videoHeight || 0}</p>
        <p>Feedback Count: {feedback.length}</p>
        {selectedPose && <p>Selected Pose: {selectedPose.name}</p>}
        {poseScore !== null && <p>Pose Score: {poseScore.score}%</p>}
      </div>
    );
  };

  return (
    <div className="relative">
      {loading ? (
        <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading pose detection model...</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {!capturedImage ? (
            <>
              {/* Show pose selector only in fitness mode */}
              {mode === 'fitness' && (
                <PoseSelector 
                  selectedPose={selectedPose} 
                  onSelectPose={handleSelectPose} 
                />
              )}

              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/png"
                  videoConstraints={{
                    facingMode: facingMode,
                    width: { min: 640, ideal: 1280 },
                    height: { min: 480, ideal: 720 }
                  }}
                  onUserMedia={handleVideoReady}
                  className="w-full h-auto"
                  mirrored={facingMode === "user"}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />

                {/* Pose template overlay */}
                {selectedPose && webcamRef.current?.video && (
                  <PoseOverlay 
                    template={selectedPose}
                    canvasWidth={webcamRef.current.video.videoWidth}
                    canvasHeight={webcamRef.current.video.videoHeight}
                  />
                )}

                {/* Camera toggle button - positioned in top-right corner */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleCamera}
                  className="absolute top-3 right-3 p-2 bg-black bg-opacity-50 text-white rounded-full shadow-md hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors z-10"
                  aria-label="Switch Camera"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 7.5l-5 5" />
                  </svg>
                </motion.button>
              </div>

              <div className="mt-4 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCapture}
                  disabled={isCapturing || !isCameraReady}
                  className="px-6 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors flex items-center"
                >
                  {isCapturing ? 'Capturing...' : 'Take Snapshot'}
                </motion.button>
              </div>

              <div className="mt-4">
                {/* Show pose score if a pose is selected and we have a score */}
                {selectedPose && poseScore ? (
                  <PoseScore scoreResult={poseScore} feedback={scoreFeedback} />
                ) : (
                  feedback.length > 0 ? (
                    renderFeedback(feedback)
                  ) : (
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20 text-blue-800 dark:text-blue-200">
                      <p>{selectedPose ? 'Strike the pose to see your score!' : 'Stand in front of the camera to get pose feedback'}</p>
                      <p className="text-xs mt-1">Debug: Poses detected: {poses.length}, Detection active: {isDetecting ? 'Yes' : 'No'}</p>
                    </div>
                  )
                )}
                {renderDebugInfo()}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-dark dark:text-white">Captured Image</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
                >
                  Take Another
                </motion.button>
              </div>

              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={capturedImage.withKeypoints} 
                  alt="Captured pose with keypoints" 
                  className="w-full h-auto"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h4 className="text-lg font-semibold text-dark dark:text-white">With Analysis Overlay</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Download with pose keypoints and connections visible. Great for analyzing your form.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(true)}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                  >
                    Download with Keypoints
                  </motion.button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className="text-lg font-semibold text-dark dark:text-white">Clean Image</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Download without any overlays. Perfect for sharing your pose on social media.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(false)}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors"
                  >
                    Download Clean Image
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Camera;
