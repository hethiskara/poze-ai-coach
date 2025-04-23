import { Pose, Keypoint } from '@tensorflow-models/pose-detection';
import { PoseTemplate } from '../components/PoseSelector';

export interface PoseScoreResult {
  score: number;
  matchedKeypoints: number;
  totalKeypoints: number;
  missingKeypoints: string[];
}

/**
 * Calculates the score of a detected pose against a predefined template
 * @param pose The detected pose from TensorFlow.js
 * @param template The template pose to compare against
 * @param imageWidth Width of the image/video
 * @param imageHeight Height of the image/video
 * @returns Score result with percentage and feedback
 */
export const scorePose = (
  pose: Pose,
  template: PoseTemplate,
  imageWidth: number,
  imageHeight: number
): PoseScoreResult => {
  if (!pose.keypoints || pose.keypoints.length === 0) {
    return {
      score: 0,
      matchedKeypoints: 0,
      totalKeypoints: Object.keys(template.keypoints).length,
      missingKeypoints: Object.keys(template.keypoints)
    };
  }

  // Create a map of keypoints for easier access
  const keypointMap = new Map<string, Keypoint>();
  pose.keypoints.forEach(keypoint => {
    if (keypoint.name && keypoint.score && keypoint.score > 0.3) {
      keypointMap.set(keypoint.name, keypoint);
    }
  });

  const templateKeypointNames = Object.keys(template.keypoints);
  const matchedKeypoints: string[] = [];
  const missingKeypoints: string[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Define keypoint weights - upper body is more important
  const keypointWeights: {[key: string]: number} = {
    // Upper body (higher weights)
    'nose': 1.0,
    'left_eye': 0.8,
    'right_eye': 0.8,
    'left_ear': 0.7,
    'right_ear': 0.7,
    'left_shoulder': 1.5,
    'right_shoulder': 1.5,
    'left_elbow': 1.5,
    'right_elbow': 1.5,
    'left_wrist': 1.5,
    'right_wrist': 1.5,
    
    // Lower body (lower weights)
    'left_hip': 0.8,
    'right_hip': 0.8,
    'left_knee': 0.6,
    'right_knee': 0.6,
    'left_ankle': 0.4,
    'right_ankle': 0.4
  };

  // Check each template keypoint
  templateKeypointNames.forEach(keypointName => {
    const detectedKeypoint = keypointMap.get(keypointName);
    const weight = keypointWeights[keypointName] || 1.0;
    totalWeight += weight;
    
    if (detectedKeypoint) {
      // Keypoint exists, calculate position similarity
      const templateX = template.keypoints[keypointName].x * imageWidth;
      const templateY = template.keypoints[keypointName].y * imageHeight;
      
      const detectedX = detectedKeypoint.x;
      const detectedY = detectedKeypoint.y;
      
      // Calculate distance (normalized by image dimensions)
      const distance = Math.sqrt(
        Math.pow((templateX - detectedX) / imageWidth, 2) +
        Math.pow((templateY - detectedY) / imageHeight, 2)
      );
      
      // Convert distance to a score (closer = higher score)
      // A distance of 0 means perfect match (score 1)
      // A distance of 0.2 or more (20% of image) means poor match (score 0)
      const keypointScore = Math.max(0, 1 - distance * 5);
      
      totalScore += keypointScore * weight;
      matchedKeypoints.push(keypointName);
    } else {
      // Keypoint not detected
      missingKeypoints.push(keypointName);
    }
  });

  // Calculate final score as percentage
  const finalScore = totalWeight > 0
    ? (totalScore / totalWeight) * 100
    : 0;

  return {
    score: Math.round(finalScore),
    matchedKeypoints: matchedKeypoints.length,
    totalKeypoints: templateKeypointNames.length,
    missingKeypoints
  };
};

/**
 * Calculates the angle between three keypoints
 * @param a First keypoint
 * @param b Middle keypoint (vertex)
 * @param c Third keypoint
 * @returns Angle in degrees
 */
export const calculateAngle = (
  a: { x: number, y: number },
  b: { x: number, y: number },
  c: { x: number, y: number }
): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  // Ensure angle is between 0 and 180
  if (angle > 180) {
    angle = 360 - angle;
  }
  
  return angle;
};

/**
 * Generates feedback based on pose comparison
 * @param scoreResult The score result from comparing poses
 * @param template The template pose
 * @returns Array of feedback messages
 */
export const getPoseFeedback = (
  scoreResult: PoseScoreResult,
  template: PoseTemplate
): string[] => {
  const feedback: string[] = [];
  
  // Overall score feedback
  if (scoreResult.score >= 95) {
    feedback.push("Perfect! You've mastered this pose.");
  } else if (scoreResult.score >= 80) {
    feedback.push("Great job! Your pose is very close to perfect.");
  } else if (scoreResult.score >= 60) {
    feedback.push("Good effort! Keep adjusting to improve your score.");
  } else if (scoreResult.score >= 40) {
    feedback.push("You're on the right track. Try to align your body more closely with the template.");
  } else {
    feedback.push("Keep practicing! Try to match the pose template more closely.");
  }
  
  // Missing keypoints feedback - only mention upper body for fitness poses
  if (scoreResult.missingKeypoints.length > 0) {
    // Filter to only include upper body keypoints for feedback
    const upperBodyKeypoints = ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'];
    const missingUpperBodyKeypoints = scoreResult.missingKeypoints.filter(kp => upperBodyKeypoints.includes(kp));
    
    if (missingUpperBodyKeypoints.length > 0) {
      const readableKeypoints = missingUpperBodyKeypoints.map(kp => 
        kp.replace('_', ' ')
      );
      
      if (readableKeypoints.length <= 3) {
        feedback.push(`Make sure your ${readableKeypoints.join(', ')} are visible to the camera.`);
      } else {
        feedback.push(`Several key upper body parts aren't visible. Try adjusting your position.`);
      }
    }
    
    // If lower body is required for this specific pose, mention it
    if (template.id === 'front-double-biceps' || template.id === 'front-lat-spread') {
      const lowerBodyKeypoints = ['left_hip', 'right_hip', 'left_knee', 'right_knee'];
      const missingLowerBodyKeypoints = scoreResult.missingKeypoints.filter(kp => lowerBodyKeypoints.includes(kp));
      
      if (missingLowerBodyKeypoints.length > 0 && scoreResult.score < 70) {
        feedback.push("For a complete pose, try to include your lower body in the frame if possible.");
      }
    }
  }
  
  // Pose-specific feedback
  switch (template.id) {
    case 'front-double-biceps':
      if (scoreResult.score < 70) {
        feedback.push("Remember to keep your arms bent and biceps flexed. Face directly toward the camera.");
      }
      break;
    case 'side-chest':
      if (scoreResult.score < 70) {
        feedback.push("Turn to the side more and bring your arm across your chest to emphasize your pectoral muscles.");
      }
      break;
    case 'rear-lat-spread':
      if (scoreResult.score < 70) {
        feedback.push("Face away from the camera and spread your arms wider to showcase your back width.");
      }
      break;
    case 'front-lat-spread':
      if (scoreResult.score < 70) {
        feedback.push("Spread your arms wider and push your lats out to create the illusion of a wider upper body.");
      }
      break;
    case 'most-muscular':
      if (scoreResult.score < 70) {
        feedback.push("Bring your shoulders forward and flex all muscle groups simultaneously for maximum definition.");
      }
      break;
  }
  
  return feedback;
};

/**
 * Analyzes a pose and provides general feedback
 * @param pose The detected pose
 * @returns Array of feedback messages with severity
 */
export const analyzePoseForFeedback = (pose: Pose): { part: string; message: string; severity: 'info' | 'warning' | 'error' | 'success' }[] => {
  const feedback: { part: string; message: string; severity: 'info' | 'warning' | 'error' | 'success' }[] = [];
  
  if (!pose.keypoints || pose.keypoints.length === 0) {
    return feedback;
  }
  
  // Create a map of keypoints for easier access
  const keypointMap = new Map<string, Keypoint>();
  pose.keypoints.forEach(keypoint => {
    if (keypoint.name && keypoint.score && keypoint.score > 0.3) {
      keypointMap.set(keypoint.name, keypoint);
    }
  });
  
  // Check if essential upper body keypoints are visible
  const essentialKeypoints = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow'
  ];
  
  const missingEssentialKeypoints = essentialKeypoints.filter(kp => !keypointMap.has(kp));
  
  if (missingEssentialKeypoints.length > 0) {
    const readableKeypoints = missingEssentialKeypoints.map(kp => kp.replace('_', ' '));
    feedback.push({
      part: missingEssentialKeypoints[0],
      message: `Some key upper body parts aren't visible: ${readableKeypoints.join(', ')}`,
      severity: 'warning'
    });
  }
  
  // Check shoulder alignment
  const leftShoulder = keypointMap.get('left_shoulder');
  const rightShoulder = keypointMap.get('right_shoulder');
  
  if (leftShoulder && rightShoulder) {
    const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
    if (shoulderDiff > 30) {
      feedback.push({
        part: 'left_shoulder',
        message: 'Try to keep your shoulders level',
        severity: 'warning'
      });
    } else if (shoulderDiff < 10) {
      feedback.push({
        part: 'left_shoulder',
        message: 'Great shoulder alignment!',
        severity: 'success'
      });
    }
  }
  
  // Check posture (if face is visible)
  const nose = keypointMap.get('nose');
  const leftShoulder2 = keypointMap.get('left_shoulder');
  const rightShoulder2 = keypointMap.get('right_shoulder');
  
  if (nose && leftShoulder2 && rightShoulder2) {
    const shoulderMidX = (leftShoulder2.x + rightShoulder2.x) / 2;
    
    // Check if head is aligned with shoulders (for general posture)
    const horizontalDiff = Math.abs(nose.x - shoulderMidX);
    
    if (horizontalDiff > 30) {
      feedback.push({
        part: 'nose',
        message: 'Try to align your head with your shoulders for better posture',
        severity: 'info'
      });
    }
  }
  
  return feedback;
};

export default {
  scorePose,
  calculateAngle,
  getPoseFeedback,
  analyzePoseForFeedback
};
