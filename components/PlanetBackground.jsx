'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef } from 'react';

export default function PlanetBackground() {
  const { scene } = useGLTF('/planet/scene.gltf');
  const canvasRef = useRef();

  return (
    <div className="fixed top-0 left-0 w-full h-full z-0">
      <Canvas ref={canvasRef} camera={{ position: [0, 0, 10], fov: 35 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        <primitive object={scene} scale={2} />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
