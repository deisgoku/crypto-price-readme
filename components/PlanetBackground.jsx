// components/PlanetBackground.jsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Stars, Preload } from '@react-three/drei'
import { Suspense } from 'react'

function Planet() {
  const { scene } = useGLTF('/planet/scene.gltf')
  return <primitive object={scene} scale={0.5} position={[0, -1, 0]} />
}

export default function PlanetBackground() {
  return (
    <div className='absolute inset-0 z-[-1]'>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} />
        <Suspense fallback={null}>
          <Stars radius={100} depth={50} count={5000} factor={4} fade />
          <Planet />
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        <Preload all />
      </Canvas>
    </div>
  )
}
