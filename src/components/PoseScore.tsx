import React from 'react';
import { motion } from 'framer-motion';

interface ScoreResult {
  score: number;
  matchedKeypoints: number;
  totalKeypoints: number;
  missingKeypoints: string[];
}

interface PoseScoreProps {
  scoreResult: ScoreResult;
  feedback: string[];
}

const PoseScore: React.FC<PoseScoreProps> = ({ scoreResult, feedback }) => {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Determine background color based on score
  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900 dark:bg-opacity-20';
    if (score >= 70) return 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20';
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-20';
    return 'bg-red-100 dark:bg-red-900 dark:bg-opacity-20';
  };

  // Get appropriate emoji based on score
  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🏆';
    if (score >= 70) return '👍';
    if (score >= 50) return '🔄';
    if (score > 0) return '💪';
    return '📷'; // Camera emoji for zero score
  };

  // Special case for zero score (no pose detected)
  if (scoreResult.score === 0) {
    return (
      <div className="mt-4 space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark dark:text-white">Pose Score</h3>
            <div className="flex items-center">
              <span className="text-2xl mr-2">📷</span>
              <span className="text-3xl font-bold text-gray-500 dark:text-gray-400">
                0%
              </span>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className="h-2.5 rounded-full bg-gray-400" style={{ width: '0%' }}></div>
            </div>
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20 text-blue-800 dark:text-blue-200">
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                <span className="text-blue-500">ℹ️</span>
              </div>
              <p>No pose detected. Please make sure you're visible in the camera frame.</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg ${getScoreBgColor(scoreResult.score)}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dark dark:text-white">Pose Score</h3>
          <div className="flex items-center">
            <span className="text-2xl mr-2">{getScoreEmoji(scoreResult.score)}</span>
            <span className={`text-3xl font-bold ${getScoreColor(scoreResult.score)}`}>
              {Math.round(scoreResult.score)}%
            </span>
          </div>
        </div>
        
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <motion.div 
              className={`h-2.5 rounded-full ${scoreResult.score >= 90 ? 'bg-green-500' : 
                scoreResult.score >= 70 ? 'bg-blue-500' : 
                scoreResult.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              initial={{ width: '0%' }}
              animate={{ width: `${scoreResult.score}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          <span>Matched {scoreResult.matchedKeypoints} of {scoreResult.totalKeypoints} keypoints</span>
          {scoreResult.missingKeypoints.length > 0 && (
            <div className="mt-1">
              <span className="text-gray-500 dark:text-gray-400">Missing: </span>
              <span>{scoreResult.missingKeypoints.length === scoreResult.totalKeypoints 
                ? "All keypoints" 
                : scoreResult.missingKeypoints.join(', ')}</span>
            </div>
          )}
        </div>
      </motion.div>
      
      {feedback.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-dark dark:text-white">Feedback</h4>
          {feedback.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start">
                <div className="mr-2 mt-0.5">
                  {item.includes('Perfect') || item.includes('Great') ? (
                    <span className="text-green-500">✓</span>
                  ) : item.includes('Try to') ? (
                    <span className="text-yellow-500">⚠️</span>
                  ) : (
                    <span className="text-blue-500">ℹ️</span>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{item}</p>
              </div>
            </motion.div>
          ))}
          
          {scoreResult.score >= 95 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg bg-green-100 dark:bg-green-900 dark:bg-opacity-20 border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-2">🎉</span>
                <h3 className="text-lg font-bold text-green-700 dark:text-green-300">PERFECT!</h3>
              </div>
              <p className="mt-1 text-green-600 dark:text-green-400">
                Outstanding form! You've mastered this pose.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default PoseScore;
