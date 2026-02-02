import React, { useState, useRef, useEffect } from 'react';
import { SpatialScene } from './components/SpatialScene';
import { WebcamBubble } from './components/WebcamBubble';
import { Overlay } from './components/Overlay';
import { HandGestureState, ImageItem } from './types';
import { DEFAULT_IMAGES, TOTAL_POINTS } from './constants';

const App: React.FC = () => {
  // Generate default images if constants don't cover enough points
  const [images, setImages] = useState<ImageItem[]>(() => {
    // Fill up to TOTAL_POINTS, cycling through defaults
    return Array.from({ length: TOTAL_POINTS }).map((_, i) => ({
      id: `img-${i}`,
      url: DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]
    }));
  });

  // Shared Mutable Ref for gesture state (High performance bridge between DOM and Canvas)
  const gestureRef = useRef<HandGestureState>({
    x: 0.5,
    y: 0.5,
    isPinching: false,
    isDetected: false
  });

  // Force re-render for UI updates (like the pill color) roughly every frame 
  // or just rely on the internal state of WebcamBubble.
  // We pass a dummy state update to WebcamBubble to trigger its own re-renders if needed,
  // but for App level, we might not need to re-render constantly.
  // Actually, WebcamBubble uses its own tracking loop.

  const handleUpload = (newImages: ImageItem[]) => {
    // Replace or append? Let's replace for a "New Gallery" feel
    // If not enough images, repeat them to fill the sphere
    let fullSet = [...newImages];
    while (fullSet.length < TOTAL_POINTS) {
      fullSet = [...fullSet, ...newImages];
    }
    setImages(fullSet.slice(0, TOTAL_POINTS));
  };

  // We need a state just to force a re-render of the WebcamBubble 
  // to update the UI pill, although R3F uses the Ref directly.
  const [, setTick] = useState(0);

  const handleGestureUpdate = (state: HandGestureState) => {
    // This function is called every frame from the hook.
    // We can use it to trigger React updates if strictly necessary for UI,
    // but we throttle it or avoid it for performance if possible.
    // For the UI pill (Pinching/Moving status), we do want reactive updates.
    // Let's use a ref for the bubble component internally or just force update occasionally.
    
    // For now, let's just trigger a re-render of the status pill
    // But doing this every frame (60fps) in React might be heavy.
    // Let's rely on the WebcamBubble component managing its own display state
    // by passing the ref down.
  };

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden font-sans select-none">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <SpatialScene images={images} gestureRef={gestureRef} />
      </div>

      {/* UI Overlay Layer */}
      <Overlay onUpload={handleUpload} />

      {/* Webcam Control Layer */}
      <WebcamBubble 
        onGestureUpdate={handleGestureUpdate} 
        gestureStateRef={gestureRef}
      />
    </div>
  );
};

export default App;
