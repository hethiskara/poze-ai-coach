import { useEffect, useState, useCallback, useRef } from 'react';
// Import TensorFlow.js in the correct order
import * as tf from '@tensorflow/tfjs';
// Import pose detection after TensorFlow is imported
import * as poseDetection from '@tensorflow-models/pose-detection';
import { scorePose, getPoseFeedback, analyzePoseForFeedback, PoseScoreResult } from '../utils/poseScoring';
import { PoseTemplate } from '../components/PoseSelector';

export type PoseMode = 'fitness' | 'photography';

export interface PoseFeedback {
  part: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

const usePoseDetection = (mode: PoseMode) => {
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [poses, setPoses] = useState<poseDetection.Pose[]>([]);
  const [feedback, setFeedback] = useState<PoseFeedback[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [poseScore, setPoseScore] = useState<PoseScoreResult | null>(null);
  const [scoreFeedback, setScoreFeedback] = useState<string[]>([]);
  const [backendReady, setBackendReady] = useState<boolean>(false);
  
  // Use refs to keep track of the latest values without triggering re-renders
  const posesRef = useRef<poseDetection.Pose[]>([]);
  const feedbackRef = useRef<PoseFeedback[]>([]);
  const poseScoreRef = useRef<PoseScoreResult | null>(null);
  const scoreFeedbackRef = useRef<string[]>([]);

  // Initialize TensorFlow and pose detector
  useEffect(() => {
    const initializeDetector = async () => {
      try {
        setLoading(true);
        console.log("Initializing TensorFlow.js...");
        
        // Make sure TensorFlow is ready
        await tf.ready();
        console.log("TensorFlow backend:", tf.getBackend());
        setBackendReady(true);
        
        console.log("Initializing pose detector...");
        // Use MoveNet for better performance and compatibility
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
        };
        
        const poseDetector = await poseDetection.createDetector(model, detectorConfig);
        setDetector(poseDetector);
        console.log("Pose detector initialized successfully");
      } catch (error) {
        console.error("Error initializing:", error);
        setBackendReady(false);
      } finally {
        setLoading(false);
      }
    };

    initializeDetector();

    // Cleanup
    return () => {
      if (detector) {
        detector.dispose();
      }
    };
  }, []);

  // Score pose against a template
  const scorePoseAgainstTemplate = useCallback(async (
    video: HTMLVideoElement,
    template: PoseTemplate
  ) => {
    if (!detector || !video || video.readyState < 2) {
      return;
    }
    
    try {
      setIsDetecting(true);
      
      // Estimate poses
      const poses = await detector.estimatePoses(video);
      
      if (poses.length > 0) {
        setPoses(poses);
        posesRef.current = poses;
        
        // Score the pose against the template
        const scoreResult = scorePose(
          poses[0],
          template,
          video.videoWidth,
          video.videoHeight
        );
        
        setPoseScore(scoreResult);
        poseScoreRef.current = scoreResult;
        
        // Generate feedback based on score
        const feedback = getPoseFeedback(scoreResult, template);
        setScoreFeedback(feedback);
        scoreFeedbackRef.current = feedback;
      } else {
        // No pose detected, set a default score of 0
        const defaultScore: PoseScoreResult = {
          score: 0,
          matchedKeypoints: 0,
          totalKeypoints: Object.keys(template.keypoints).length,
          missingKeypoints: Object.keys(template.keypoints)
        };
        
        setPoses([]);
        posesRef.current = [];
        setPoseScore(defaultScore);
        poseScoreRef.current = defaultScore;
        
        // Set default feedback
        const defaultFeedback = ["No pose detected. Please make sure you're visible in the camera frame."];
        setScoreFeedback(defaultFeedback);
        scoreFeedbackRef.current = defaultFeedback;
      }
    } catch (error) {
      console.error("Error scoring pose:", error);
    } finally {
      setIsDetecting(false);
    }
  }, [detector]);

  // Detect pose from video element
  const detectPose = useCallback(async (video: HTMLVideoElement) => {
    if (!detector || !video || video.readyState < 2) return;
    
    try {
      setIsDetecting(true);
      
      // Estimate poses
      const poses = await detector.estimatePoses(video);
      
      if (poses.length > 0) {
        setPoses(poses);
        posesRef.current = poses;
        
        // Generate feedback based on mode
        if (mode === 'photography') {
          const poseFeedback = analyzePoseForFeedback(poses[0]);
          setFeedback(poseFeedback);
          feedbackRef.current = poseFeedback;
        }
      } else {
        // No pose detected
        setPoses([]);
        posesRef.current = [];
      }
    } catch (error) {
      console.error("Error detecting pose:", error);
    } finally {
      setIsDetecting(false);
    }
  }, [detector, mode]);

  // Capture snapshot with pose overlay
  const captureSnapshot = useCallback((video: HTMLVideoElement): string | null => {
    if (!video) return null;
    
    try {
      // Create canvas to draw video frame and pose keypoints
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Draw pose keypoints if available
      if (posesRef.current.length > 0) {
        const pose = posesRef.current[0];
        
        // Draw keypoints
        pose.keypoints.forEach(keypoint => {
          if (keypoint.score && keypoint.score > 0.3) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = '#00BFFF';
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
        ctx.strokeStyle = '#00BFFF';
        
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
      }
      
      // Convert canvas to data URL
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Error capturing snapshot:", error);
      return null;
    }
  }, []);

  return {
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
  };
};

export default usePoseDetection;
