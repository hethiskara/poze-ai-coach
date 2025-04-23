import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Camera from './components/Camera';
import ModeSelector from './components/ModeSelector';
import ModeInfo from './components/ModeInfo';
import { PoseMode } from './hooks/usePoseDetection';
import { DarkModeProvider } from './contexts/DarkModeContext';
import DarkModeToggle from './components/DarkModeToggle';

function App() {
  const [mode, setMode] = useState<PoseMode>('fitness');

  const handleModeChange = (newMode: PoseMode) => {
    setMode(newMode);
  };

  return (
    <DarkModeProvider>
      <div className="min-h-screen bg-light dark:bg-gray-900 transition-colors duration-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <Header />
            <DarkModeToggle />
          </div>
          
          <ModeSelector currentMode={mode} onModeChange={handleModeChange} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <motion.div
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Camera mode={mode} />
              </motion.div>
            </div>
            
            <div className="md:col-span-1">
              <ModeInfo mode={mode} />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <h2 className="text-2xl font-bold text-dark dark:text-white mb-4">How It Works</h2>
                <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                    <span>Allow camera access when prompted</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                    <span>Position yourself in the camera view</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                    <span>Follow the real-time feedback to improve your form</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</span>
                    <span>Take a snapshot to save your perfect pose</span>
                  </li>
                </ol>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Privacy Note:</strong> All processing happens directly in your browser. 
                    No images or data are sent to any server.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
          
          <Footer />
        </div>
      </div>
    </DarkModeProvider>
  );
}

export default App;
