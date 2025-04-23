import React, { useEffect, useRef } from 'react';
import { PoseTemplate } from './PoseSelector';

interface PoseOverlayProps {
  template: PoseTemplate;
  canvasWidth: number;
  canvasHeight: number;
}

const PoseOverlay: React.FC<PoseOverlayProps> = ({ template, canvasWidth, canvasHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw the template keypoints on the canvas
  useEffect(() => {
    if (!canvasRef.current || !template) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match the video
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw keypoints
    const keypoints = template.keypoints;
    const keypointEntries = Object.entries(keypoints);

    // Draw keypoints
    keypointEntries.forEach(([name, point]) => {
      // Convert normalized coordinates to actual canvas coordinates
      const x = point.x * canvas.width;
      const y = point.y * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fill();
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.stroke();
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
      ['right_hip', 'right_knee']
    ];

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
    ctx.lineWidth = 3;
    
    connections.forEach(([startName, endName]) => {
      if (keypoints[startName] && keypoints[endName]) {
        const startX = keypoints[startName].x * canvas.width;
        const startY = keypoints[startName].y * canvas.height;
        const endX = keypoints[endName].x * canvas.width;
        const endY = keypoints[endName].y * canvas.height;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    });

    // Draw pose name
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(template.name, canvas.width / 2, 40);

  }, [template, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
};

export default PoseOverlay;
