# Smart Camera Pose Coach

A browser-based AI application that provides real-time feedback on your body posture using computer vision and machine learning.

## Features

- **Fitness Mode**: Get real-time feedback on your workout form
  - Squat form analysis
  - Back posture tracking
  - Knee alignment detection
  - Balance assessment

- **Photography Mode**: Perfect your poses for photos
  - Head tilt optimization
  - Shoulder alignment
  - Posture symmetry
  - Body positioning

- **Privacy-Focused**: 100% frontend-only, no data sharing
  - All processing happens in your browser
  - No images or data are sent to any server

- **Live Camera Overlay**: See your pose with wireframe keypoints
- **Snapshot + Download**: Capture and save your perfect poses

## Technology Stack

- React with TypeScript
- TensorFlow.js for machine learning
- MediaPipe for pose detection
- Tailwind CSS for styling
- Framer Motion for animations

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/smart-camera-pose-coach.git
cd smart-camera-pose-coach
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Allow camera access when prompted
2. Choose between Fitness Mode or Photography Mode
3. Position yourself in the camera view
4. Follow the real-time feedback to improve your form
5. Take a snapshot to save your perfect pose

## Deployment

To build the app for production:

```
npm run build
```

The build artifacts will be stored in the `build/` directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- TensorFlow.js team for the machine learning framework
- MediaPipe team for the pose detection models
