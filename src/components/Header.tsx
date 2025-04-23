import React from 'react';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  return (
    <header className="py-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-center text-dark dark:text-white">
          Poze <span className="text-primary">AI Coach</span>
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
          Real-time AI feedback for perfect form
        </p>
      </motion.div>
    </header>
  );
};

export default Header;
