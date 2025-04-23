import { useState, useEffect } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

// Ensure we have access to MoveNet types
import { movenet } from '@tensorflow-models/pose-detection';

export type PoseMode = 'fitness' | 'photography';

export interface PoseFeedback {
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  part?: string;
}

export const usePoseDetection = (mode: PoseMode) => {
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [poses, setPoses] = useState<poseDetection.Pose[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<PoseFeedback[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  
  // Initialize the detector
  useEffect(() => {
    const initializeDetector = async () => {
      try {
        console.log("Initializing TensorFlow.js and pose detector...");
        
        // Ensure TensorFlow.js is ready
        await tf.ready();
        console.log("TensorFlow.js ready, backend:", tf.getBackend());
        
        // Try to use WebGL backend for better performance
        if (tf.getBackend() !== 'webgl') {
          try {
            await tf.setBackend('webgl');
            console.log("Set backend to WebGL");
          } catch (e) {
            console.warn("Could not set WebGL backend:", e);
          }
        }
        
        // Use MoveNet model instead of BlazePose for better browser compatibility
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: 'SinglePose.Lightning',
          enableSmoothing: true,
          minPoseScore: 0.15
        };
        
        console.log("Creating pose detector with config:", detectorConfig);
        const detector = await poseDetection.createDetector(
          model, 
          detectorConfig
        );
        
        console.log("Pose detector created successfully");
        setDetector(detector);
        setLoading(false);
      } catch (error) {
        console.error("Error initializing pose detector:", error);
        setLoading(false);
        setFeedback([{ 
          message: `Error initializing pose detector: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          severity: 'error' 
        }]);
      }
    };
    
    initializeDetector();
    
    return () => {
      // Cleanup
      if (detector) {
        detector.dispose?.();
      }
    };
  }, []);
  
  // Function to detect poses from a video frame
  const detectPose = async (video: HTMLVideoElement) => {
    if (!detector || !video) {
      console.log("Missing detector or video element");
      return;
    }
    
    if (isDetecting) {
      console.log("Already detecting pose, skipping");
      return;
    }
    
    setIsDetecting(true);
    
    try {
      console.log("Detecting pose on video:", 
        video.videoWidth + "x" + video.videoHeight, 
        "Readystate:", video.readyState
      );
      
      const poses = await detector.estimatePoses(video, {
        flipHorizontal: false,
        maxPoses: 1,
        scoreThreshold: 0.15
      });
      
      console.log("Pose detection result:", poses);
      
      if (poses && poses.length > 0) {
        console.log("Pose detected with score:", poses[0].score);
        setPoses(poses);
        analyzePose(poses[0], mode);
      } else {
        console.log("No poses detected in the frame");
        setFeedback([{ message: 'No pose detected. Please stand in front of the camera.', severity: 'info' }]);
      }
    } catch (error) {
      console.error("Error detecting pose:", error);
      setFeedback([{ message: `Error detecting pose: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error' }]);
    } finally {
      setIsDetecting(false);
    }
  };
  
  // Analyze pose and provide feedback based on the selected mode
  const analyzePose = (pose: poseDetection.Pose, mode: PoseMode) => {
    const feedbackItems: PoseFeedback[] = [];
    
    if (!pose || !pose.keypoints) {
      setFeedback([{ message: 'No pose detected', severity: 'info' }]);
      return;
    }
    
    // Get keypoints with sufficient confidence
    const keypoints = pose.keypoints.filter(kp => kp.score && kp.score > 0.2);
    
    if (keypoints.length < 3) {
      setFeedback([{ message: 'Move closer to the camera or adjust lighting', severity: 'info' }]);
      return;
    }
    
    const keypointMap = new Map(
      keypoints.map(keypoint => [keypoint.name, keypoint])
    );
    
    // Helper to get a keypoint by name
    const getKeypoint = (name: string) => keypointMap.get(name);
    
    // Check which parts of the body are visible
    const hasUpperBody = getKeypoint('left_shoulder') && getKeypoint('right_shoulder');
    const hasLowerBody = getKeypoint('left_hip') && getKeypoint('right_hip');
    const hasFace = getKeypoint('nose') || (getKeypoint('left_eye') && getKeypoint('right_eye'));
    
    // Track if the pose is perfect
    let isPerfect = true;
    
    // Provide feedback based on visible body parts
    if (mode === 'fitness') {
      // Upper body feedback
      if (hasUpperBody) {
        const leftShoulder = getKeypoint('left_shoulder');
        const rightShoulder = getKeypoint('right_shoulder');
        
        if (leftShoulder && rightShoulder) {
          const shoulderSlope = Math.abs((rightShoulder.y - leftShoulder.y) / 
                                Math.max(0.1, rightShoulder.x - leftShoulder.x));
          
          if (shoulderSlope > 0.1) {
            feedbackItems.push({
              message: 'Try to level your shoulders',
              severity: 'info',
              part: 'shoulders'
            });
            isPerfect = false;
          }
        }
      }
      
      // Lower body feedback if visible
      if (hasLowerBody) {
        const leftHip = getKeypoint('left_hip');
        const rightHip = getKeypoint('right_hip');
        const leftKnee = getKeypoint('left_knee');
        const rightKnee = getKeypoint('right_knee');
        
        if (leftHip && rightHip) {
          const hipSlope = Math.abs((rightHip.y - leftHip.y) / 
                           Math.max(0.1, rightHip.x - leftHip.x));
          
          if (hipSlope > 0.1) {
            feedbackItems.push({
              message: 'Try to level your hips',
              severity: 'info',
              part: 'hips'
            });
            isPerfect = false;
          }
        }
        
        // Only check knees if they're visible
        if (leftKnee && rightKnee) {
          // Knee alignment check
          const kneeSlope = Math.abs((rightKnee.y - leftKnee.y) / 
                           Math.max(0.1, rightKnee.x - leftKnee.x));
          
          if (kneeSlope > 0.1) {
            feedbackItems.push({
              message: 'Try to level your knees',
              severity: 'info',
              part: 'knees'
            });
            isPerfect = false;
          }
        }
      }
      
      // Check back posture if both upper and lower body are visible
      if (hasUpperBody && hasLowerBody) {
        const leftShoulder = getKeypoint('left_shoulder');
        const rightShoulder = getKeypoint('right_shoulder');
        const leftHip = getKeypoint('left_hip');
        const rightHip = getKeypoint('right_hip');
        
        if (leftShoulder && rightShoulder && leftHip && rightHip) {
          const shoulderCenter = {
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2
          };
          
          const hipCenter = {
            x: (leftHip.x + rightHip.x) / 2,
            y: (leftHip.y + rightHip.y) / 2
          };
          
          const verticalAlignment = Math.abs(shoulderCenter.x - hipCenter.x);
          
          if (verticalAlignment > 0.1) {
            feedbackItems.push({
              message: 'Try to align your shoulders over your hips',
              severity: 'info',
              part: 'back'
            });
            isPerfect = false;
          }
        }
      }
    } else if (mode === 'photography') {
      // Face positioning feedback
      if (hasFace) {
        const nose = getKeypoint('nose');
        const leftEye = getKeypoint('left_eye');
        const rightEye = getKeypoint('right_eye');
        
        if (leftEye && rightEye) {
          const eyeSlope = Math.abs((rightEye.y - leftEye.y) / 
                           Math.max(0.1, rightEye.x - leftEye.x));
          
          if (eyeSlope > 0.1) {
            feedbackItems.push({
              message: 'Try to level your head for a better pose',
              severity: 'info',
              part: 'head'
            });
            isPerfect = false;
          }
        }
        
        // Check face position in frame
        if (nose) {
          const centerX = 0.5; // Center of frame
          const distanceFromCenter = Math.abs(nose.x - centerX);
          
          if (distanceFromCenter > 0.2) {
            feedbackItems.push({
              message: 'Try to center your face in the frame',
              severity: 'info',
              part: 'position'
            });
            isPerfect = false;
          }
        }
      }
      
      // Upper body feedback for photography
      if (hasUpperBody) {
        const leftShoulder = getKeypoint('left_shoulder');
        const rightShoulder = getKeypoint('right_shoulder');
        
        if (leftShoulder && rightShoulder) {
          const shoulderSlope = Math.abs((rightShoulder.y - leftShoulder.y) / 
                                Math.max(0.1, rightShoulder.x - leftShoulder.x));
          
          if (shoulderSlope > 0.1) {
            feedbackItems.push({
              message: 'Level your shoulders for a more balanced pose',
              severity: 'info',
              part: 'shoulders'
            });
            isPerfect = false;
          }
        }
      }
    }
    
    // If no issues found or no specific feedback could be given, provide positive feedback
    if (feedbackItems.length === 0 || isPerfect) {
      // Determine what parts are visible for appropriate feedback
      if (hasUpperBody && hasLowerBody) {
        feedbackItems.push({
          message: mode === 'fitness' 
            ? 'PERFECT! Your form is excellent!' 
            : 'PERFECT! Your pose looks amazing!',
          severity: 'success'
        });
      } else if (hasUpperBody) {
        feedbackItems.push({
          message: mode === 'fitness' 
            ? 'PERFECT! Upper body form is excellent!' 
            : 'PERFECT! Upper body pose looks amazing!',
          severity: 'success'
        });
      } else if (hasFace) {
        feedbackItems.push({
          message: 'PERFECT! Head position is excellent!',
          severity: 'success'
        });
      } else {
        feedbackItems.push({
          message: 'Some keypoints detected. Try to show more of your body for better feedback.',
          severity: 'info'
        });
      }
    }
    
    setFeedback(feedbackItems);
  };
  
  // Function to capture a snapshot of the current pose
  const captureSnapshot = (video: HTMLVideoElement) => {
    if (!video) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw the video frame to the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw pose keypoints if available
      if (poses.length > 0) {
        const pose = poses[0];
        drawPoseOnCanvas(ctx, pose, canvas.width, canvas.height);
      }
      
      return canvas.toDataURL('image/png');
    }
    
    return null;
  };
  
  // Helper function to draw pose on canvas
  const drawPoseOnCanvas = (
    ctx: CanvasRenderingContext2D, 
    pose: poseDetection.Pose, 
    width: number, 
    height: number
  ) => {
    if (!pose.keypoints) return;
    
    // Draw keypoints
    pose.keypoints.forEach(keypoint => {
      if (keypoint.score && keypoint.score > 0.3) {
        const x = keypoint.x;
        const y = keypoint.y;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#00FF00';
        ctx.fill();
      }
    });
    
    // Draw connections between keypoints
    // This is a simplified version, you can add more connections
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
    
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    
    connections.forEach(([startName, endName]) => {
      const startPoint = keypointMap.get(startName);
      const endPoint = keypointMap.get(endName);
      
      if (startPoint && endPoint && 
          startPoint.score && endPoint.score && 
          startPoint.score > 0.3 && endPoint.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }
    });
  };
  
  return {
    poses,
    loading,
    feedback,
    isDetecting,
    detectPose,
    captureSnapshot
  };
};
