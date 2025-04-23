import React from 'react';
import { motion } from 'framer-motion';

export interface PoseTemplate {
  id: string;
  name: string;
  description: string;
  image: string;
  keypoints: {
    [key: string]: { x: number, y: number }
  };
}

interface PoseSelectorProps {
  selectedPose: PoseTemplate | null;
  onSelectPose: (pose: PoseTemplate) => void;
}

// Mr. Olympia pose templates
export const olympiaPoses: PoseTemplate[] = [
  {
    id: 'front-double-biceps',
    name: 'Front Double Biceps',
    description: 'Face the front with arms bent, fists clenched, and biceps flexed.',
    image: '/poses/front-double-biceps.png',
    keypoints: {
      // Normalized keypoints (0-1 range) for the ideal pose
      // These will need to be calibrated with actual values
      'left_shoulder': { x: 0.35, y: 0.25 },
      'right_shoulder': { x: 0.65, y: 0.25 },
      'left_elbow': { x: 0.25, y: 0.35 },
      'right_elbow': { x: 0.75, y: 0.35 },
      'left_wrist': { x: 0.3, y: 0.2 },
      'right_wrist': { x: 0.7, y: 0.2 },
      'left_hip': { x: 0.4, y: 0.55 },
      'right_hip': { x: 0.6, y: 0.55 },
      'left_knee': { x: 0.4, y: 0.8 },
      'right_knee': { x: 0.6, y: 0.8 },
    }
  },
  {
    id: 'side-chest',
    name: 'Side Chest',
    description: 'Stand sideways, flex the chest, and bring one arm across to emphasize chest development.',
    image: '/poses/side-chest.png',
    keypoints: {
      'left_shoulder': { x: 0.4, y: 0.25 },
      'right_shoulder': { x: 0.55, y: 0.25 },
      'left_elbow': { x: 0.3, y: 0.4 },
      'right_elbow': { x: 0.45, y: 0.4 },
      'left_wrist': { x: 0.45, y: 0.35 },
      'right_wrist': { x: 0.6, y: 0.35 },
      'left_hip': { x: 0.45, y: 0.55 },
      'right_hip': { x: 0.55, y: 0.55 },
      'left_knee': { x: 0.4, y: 0.8 },
      'right_knee': { x: 0.6, y: 0.8 },
    }
  },
  {
    id: 'rear-lat-spread',
    name: 'Rear Lat Spread',
    description: 'Face away, spread arms to emphasize back width, and flex the lats.',
    image: '/poses/rear-lat-spread.png',
    keypoints: {
      'left_shoulder': { x: 0.3, y: 0.25 },
      'right_shoulder': { x: 0.7, y: 0.25 },
      'left_elbow': { x: 0.2, y: 0.4 },
      'right_elbow': { x: 0.8, y: 0.4 },
      'left_wrist': { x: 0.25, y: 0.55 },
      'right_wrist': { x: 0.75, y: 0.55 },
      'left_hip': { x: 0.4, y: 0.55 },
      'right_hip': { x: 0.6, y: 0.55 },
      'left_knee': { x: 0.4, y: 0.8 },
      'right_knee': { x: 0.6, y: 0.8 },
    }
  },
  {
    id: 'front-lat-spread',
    name: 'Front Lat Spread',
    description: 'Face the front, spread arms to emphasize width, and flex the lats.',
    image: '/poses/front-lat-spread.png',
    keypoints: {
      'left_shoulder': { x: 0.3, y: 0.25 },
      'right_shoulder': { x: 0.7, y: 0.25 },
      'left_elbow': { x: 0.2, y: 0.4 },
      'right_elbow': { x: 0.8, y: 0.4 },
      'left_wrist': { x: 0.25, y: 0.55 },
      'right_wrist': { x: 0.75, y: 0.55 },
      'left_hip': { x: 0.4, y: 0.55 },
      'right_hip': { x: 0.6, y: 0.55 },
      'left_knee': { x: 0.4, y: 0.8 },
      'right_knee': { x: 0.6, y: 0.8 },
    }
  },
  {
    id: 'most-muscular',
    name: 'Most Muscular',
    description: 'Flex all muscles simultaneously with hands together or on hips to show maximum definition.',
    image: '/poses/most-muscular.png',
    keypoints: {
      'left_shoulder': { x: 0.4, y: 0.3 },
      'right_shoulder': { x: 0.6, y: 0.3 },
      'left_elbow': { x: 0.35, y: 0.45 },
      'right_elbow': { x: 0.65, y: 0.45 },
      'left_wrist': { x: 0.45, y: 0.5 },
      'right_wrist': { x: 0.55, y: 0.5 },
      'left_hip': { x: 0.4, y: 0.6 },
      'right_hip': { x: 0.6, y: 0.6 },
      'left_knee': { x: 0.4, y: 0.85 },
      'right_knee': { x: 0.6, y: 0.85 },
    }
  }
];

const PoseSelector: React.FC<PoseSelectorProps> = ({ selectedPose, onSelectPose }) => {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-dark dark:text-white mb-3">Select a Pose</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {olympiaPoses.map((pose) => (
          <motion.div
            key={pose.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectPose(pose)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedPose?.id === pose.id
                ? 'bg-primary bg-opacity-20 border-2 border-primary'
                : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-md mb-2 flex items-center justify-center overflow-hidden">
              <img 
                src={pose.image} 
                alt={pose.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = 'none';
                  const parent = target.parentNode as HTMLElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'text-4xl text-gray-400 dark:text-gray-500 flex items-center justify-center w-full h-full';
                    fallback.textContent = pose.name.charAt(0);
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <h4 className="font-medium text-dark dark:text-white text-sm text-center">{pose.name}</h4>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PoseSelector;
