import React from 'react';
import { motion } from 'framer-motion';
import { PoseMode } from '../hooks/usePoseDetection';

interface ModeSelectorProps {
  currentMode: PoseMode;
  onModeChange: (mode: PoseMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="flex justify-center mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-full shadow-md p-1 flex">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onModeChange('fitness')}
          className={`px-6 py-3 rounded-full transition-colors ${
            currentMode === 'fitness'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Fitness Mode
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onModeChange('photography')}
          className={`px-6 py-3 rounded-full transition-colors ${
            currentMode === 'photography'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Photography Mode
        </motion.button>
      </div>
    </div>
  );
};

export default ModeSelector;
