import React, { useRef, useEffect } from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import { HandGestureState } from '../types';
import { Camera, Hand, Minimize2 } from 'lucide-react';

interface WebcamBubbleProps {
  onGestureUpdate: (state: HandGestureState) => void;
  gestureStateRef: React.MutableRefObject<HandGestureState>;
}

export const WebcamBubble: React.FC<WebcamBubbleProps> = ({ onGestureUpdate, gestureStateRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { isLoaded, startTracking } = useHandTracking({
    videoRef,
    canvasRef,
    onGestureUpdate: (state) => {
        // Update the ref directly for high-frequency polling in R3F
        gestureStateRef.current = state;
        // Also call the prop if needed for React state updates (though we avoid this for performance usually)
        onGestureUpdate(state);
    }
  });

  useEffect(() => {
    const enableCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: 640,
              height: 480,
              facingMode: 'user'
            } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', () => {
                startTracking();
            });
          }
        } catch (err) {
          console.error("Error accessing webcam:", err);
        }
      }
    };

    if (isLoaded) {
        enableCamera();
    }
  }, [isLoaded, startTracking]);

  // Determine feedback icon based on current state
  const isPinching = gestureStateRef.current.isPinching;
  const isDetected = gestureStateRef.current.isDetected;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
        {/* Status Indicator Pill */}
        <div className={`
            px-4 py-2 rounded-full backdrop-blur-md text-xs font-semibold tracking-wider flex items-center gap-2 transition-all duration-300
            ${isDetected 
                ? (isPinching ? 'bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/20' : 'bg-black/80 text-white') 
                : 'bg-red-500/80 text-white'}
        `}>
            {isDetected ? (
                isPinching ? (
                    <><Minimize2 size={14} /> PINCHING (ZOOM)</>
                ) : (
                    <><Hand size={14} /> MOVING (ROTATE)</>
                )
            ) : (
                <><Camera size={14} /> NO HAND DETECTED</>
            )}
        </div>

        {/* Webcam Bubble */}
        <div className="relative w-64 h-48 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/50 backdrop-blur-sm transition-transform hover:scale-105">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
            />
            <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full transform -scale-x-100 opacity-60 pointer-events-none"
            />
            
            {/* Overlay Gradient for nicer look */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        </div>
    </div>
  );
};
