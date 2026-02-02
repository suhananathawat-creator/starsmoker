import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Image, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';
import { HandGestureState, ImageItem } from '../types';

interface SpatialSceneProps {
  images: ImageItem[];
  gestureRef: React.MutableRefObject<HandGestureState>;
}

// Helper to distribute points on a sphere (Fibonacci Sphere)
const getFibonacciSpherePoints = (samples: number, radius: number) => {
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
  }
  return points;
};

const ImagePlane = ({ url, position, rotation }: { url: string; position: THREE.Vector3; rotation: THREE.Euler }) => {
  const [hovered, setHover] = useState(false);
  
  // Animate scale on hover
  const scale = hovered ? 1.2 : 1;

  return (
    <group position={position} rotation={rotation}>
      <Image
        url={url}
        scale={[1.5 * scale, 1 * scale]} // Aspect ratio roughly 3:2
        transparent
        opacity={0.9}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        side={THREE.DoubleSide}
      />
    </group>
  );
};

const ContentSphere = ({ images, gestureRef }: SpatialSceneProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Generate points once
  const points = useMemo(() => getFibonacciSpherePoints(images.length, 6), [images]);

  // Smoothed gesture values for physics-like feel
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const targetZoom = useRef(10); // Initial Z position
  const currentZoom = useRef(10);
  
  // Previous pinch position to calculate deltas
  const prevPinchY = useRef<number | null>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const gesture = gestureRef.current;
    
    // Smooth factor (LERP)
    const smoothTime = 3 * delta; 

    if (gesture.isDetected) {
      if (gesture.isPinching) {
        // ZOOM MODE
        // If this is the first frame of pinching, set the reference point
        if (prevPinchY.current === null) {
          prevPinchY.current = gesture.y;
        } else {
          // Calculate movement delta
          const dy = prevPinchY.current - gesture.y;
          // Sensitivity factor for zoom
          const zoomSensitivity = 15;
          
          // Apply zoom (clamp between 2 and 20)
          // Moving hand UP (dy positive) -> Zoom IN (decrease Z)
          // Moving hand DOWN (dy negative) -> Zoom OUT (increase Z)
          targetZoom.current = THREE.MathUtils.clamp(targetZoom.current - (dy * zoomSensitivity), 2, 20);
          
          // Update reference for continuous movement
          prevPinchY.current = gesture.y;
        }
      } else {
        // ROTATE MODE
        // Reset pinch reference
        prevPinchY.current = null;

        // Map gesture X/Y (0..1) to Rotation angles
        // Center (0.5, 0.5) is neutral. 
        // Move left -> Rotate Left. Move Up -> Rotate Up.
        
        // Calculate velocity/torque based on distance from center
        const torqueX = (gesture.y - 0.5) * 2; // -1 to 1
        const torqueY = (gesture.x - 0.5) * 2; // -1 to 1

        // Integrate to rotation (trackball style)
        targetRotation.current.x += torqueX * delta * 1.5; 
        targetRotation.current.y += torqueY * delta * 1.5;
      }
    } else {
        // Auto rotate slowly if no hand detected
        targetRotation.current.y += 0.1 * delta;
        prevPinchY.current = null;
    }

    // Apply Smoothing LERP to Rotation
    currentRotation.current.x = THREE.MathUtils.lerp(currentRotation.current.x, targetRotation.current.x, smoothTime);
    currentRotation.current.y = THREE.MathUtils.lerp(currentRotation.current.y, targetRotation.current.y, smoothTime);

    groupRef.current.rotation.x = currentRotation.current.x;
    groupRef.current.rotation.y = currentRotation.current.y;

    // Apply Smoothing LERP to Camera Zoom (Z position)
    currentZoom.current = THREE.MathUtils.lerp(currentZoom.current, targetZoom.current, smoothTime);
    camera.position.z = currentZoom.current;
  });

  return (
    <group ref={groupRef}>
      {images.map((img, i) => {
        const position = points[i];
        // Calculate rotation to face center
        const rotation = new THREE.Euler();
        const matrix = new THREE.Matrix4().lookAt(position, new THREE.Vector3(0,0,0), new THREE.Vector3(0,1,0));
        rotation.setFromRotationMatrix(matrix);

        return (
          <ImagePlane 
            key={img.id} 
            url={img.url} 
            position={position} 
            rotation={rotation} 
          />
        );
      })}
    </group>
  );
};

export const SpatialScene: React.FC<SpatialSceneProps> = ({ images, gestureRef }) => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 60 }} className="bg-white">
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Environment preset="studio" />
      <ContentSphere images={images} gestureRef={gestureRef} />
    </Canvas>
  );
};
