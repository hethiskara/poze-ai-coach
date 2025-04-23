import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 mt-12 border-t border-gray-200 dark:border-gray-700">
      <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>Poze AI Coach &copy; {new Date().getFullYear()}</p>
        <p className="mt-1">
          Powered by TensorFlow.js and MediaPipe | 100% Private - All processing happens in your browser
        </p>
        <p className="mt-1">
          Created by Hethiskarna
        </p>
      </div>
    </footer>
  );
};

export default Footer;
