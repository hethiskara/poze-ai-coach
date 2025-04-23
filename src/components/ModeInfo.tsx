import React from 'react';
import { motion } from 'framer-motion';
import { PoseMode } from '../hooks/usePoseDetection';

interface ModeInfoProps {
  mode: PoseMode;
}

const ModeInfo: React.FC<ModeInfoProps> = ({ mode }) => {
  const fitnessInfo = {
    title: 'Fitness Mode',
    description: 'Get real-time feedback on your workout form and posture.',
    features: [
      'Squat form analysis',
      'Back posture tracking',
      'Knee alignment detection',
      'Balance assessment'
    ]
  };

  const photographyInfo = {
    title: 'Photography Mode',
    description: 'Perfect your poses for photos with AI-powered suggestions.',
    features: [
      'Head tilt optimization',
      'Shoulder alignment',
      'Posture symmetry',
      'Body positioning'
    ]
  };

  const info = mode === 'fitness' ? fitnessInfo : photographyInfo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8"
    >
      <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">{info.title}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{info.description}</p>
      
      <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">Features:</h3>
      <ul className="grid grid-cols-2 gap-2">
        {info.features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <span className="text-primary mr-2">✓</span>
            <span className="dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default ModeInfo;
