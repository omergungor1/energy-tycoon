'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight } from './WorldCanvas';

/**
 * Natural Wildlife & Living Sky Systems:
 * 1. Hot Air Balloons drifting across the valley
 * 2. Twin-Engine Commuter Airplane with flashing aviation navigation strobes
 * 3. Grazing Alpine Deer / Wildlife in peaceful forest meadows
 */
export default function WildlifeAndSky({ isNight = false }) {
  const balloon1Ref = useRef();
  const balloon2Ref = useRef();
  const airplaneRef = useRef();
  const propLRef = useRef();
  const propRRef = useRef();
  const deerGroupRef = useRef();

  // Materials
  const mats = useMemo(() => {
    return {
      balloonStripes1: new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.6 }),
      balloonStripes2: new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.6 }),
      wickerBasket: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 }),
      planeBody: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3, metalness: 0.4 }),
      planeTrim: new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.3 }),
      deerCoat: new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.8 }),
      deerAntler: new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.7 }),
      navRed: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
      navGreen: new THREE.MeshBasicMaterial({ color: '#22c55e' }),
      strobeWhite: new THREE.MeshBasicMaterial({ color: '#ffffff' })
    };
  }, []);

  // Sky Animation Loop
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. Hot Air Balloon 1: Drifting over Western Alpine Lake Valley
    if (balloon1Ref.current) {
      const bX = -120 + Math.cos(t * 0.04) * 85;
      const bZ = -45 + Math.sin(t * 0.04) * 75;
      const bY = 145 + Math.sin(t * 0.25) * 6.5;
      balloon1Ref.current.position.set(bX, bY, bZ);
      balloon1Ref.current.rotation.y = t * 0.03;
    }

    // Hot Air Balloon 2: Drifting over Central Solar Plains
    if (balloon2Ref.current) {
      const bX = 180 + Math.sin(t * 0.035 + 1.5) * 110;
      const bZ = 120 + Math.cos(t * 0.035 + 1.5) * 95;
      const bY = 165 + Math.cos(t * 0.2) * 8.0;
      balloon2Ref.current.position.set(bX, bY, bZ);
      balloon2Ref.current.rotation.y = -t * 0.025;
    }

    // 2. High-Altitude Twin-Engine Airplane Cruising Across the Island Sky
    if (airplaneRef.current) {
      const planeRadius = 1100;
      const planeSpeed = 0.07;
      const angle = t * planeSpeed;
      const pX = Math.cos(angle) * planeRadius;
      const pZ = Math.sin(angle) * planeRadius;
      const pY = 285 + Math.sin(t * 0.1) * 12;

      airplaneRef.current.position.set(pX, pY, pZ);
      // Tangent heading with slight banking turn
      airplaneRef.current.rotation.y = -angle + Math.PI / 2;
      airplaneRef.current.rotation.z = -0.18; // Inward bank
    }

    if (propLRef.current) propLRef.current.rotation.z = t * 45;
    if (propRRef.current) propRRef.current.rotation.z = t * 45;

    // 3. Deer Grazing / Head Bobbing in Forest Meadow
    if (deerGroupRef.current) {
      const headAngle = Math.sin(t * 0.8) * 0.25 + 0.35;
      deerGroupRef.current.children.forEach((deer, idx) => {
        const neck = deer.getObjectByName('deer_neck');
        if (neck) {
          neck.rotation.x = headAngle + Math.sin(t * 0.5 + idx) * 0.15;
        }
      });
    }
  });

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. HOT AIR BALLOONS                                       */}
      {/* ========================================================= */}

      {/* Balloon 1: Warm Sunset Orange & Gold */}
      <group ref={balloon1Ref} position={[-120, 145, -45]}>
        {/* Teardrop Envelope */}
        <mesh position={[0, 12, 0]} castShadow>
          <sphereGeometry args={[9.5, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.85]} />
          <primitive object={mats.balloonStripes1} />
        </mesh>
        <mesh position={[0, 4.5, 0]}>
          <coneGeometry args={[5.2, 7.5, 24, 1, true]} rotation={[Math.PI, 0, 0]} />
          <primitive object={mats.balloonStripes2} />
        </mesh>
        {/* Wicker Basket */}
        <mesh position={[0, -1.8, 0]} material={mats.wickerBasket} castShadow>
          <boxGeometry args={[2.4, 1.8, 2.4]} />
        </mesh>
        {/* Burner Flame Glow */}
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      </group>

      {/* Balloon 2: Vibrant Cyan & White */}
      <group ref={balloon2Ref} position={[180, 165, 120]}>
        <mesh position={[0, 11, 0]} castShadow>
          <sphereGeometry args={[8.5, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.85]} />
          <meshStandardMaterial color="#0284c7" roughness={0.6} />
        </mesh>
        <mesh position={[0, 4.2, 0]}>
          <coneGeometry args={[4.8, 6.8, 24, 1, true]} rotation={[Math.PI, 0, 0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <mesh position={[0, -1.6, 0]} material={mats.wickerBasket} castShadow>
          <boxGeometry args={[2.2, 1.6, 2.2]} />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 2. TWIN-ENGINE COMMUTER AIRPLANE                          */}
      {/* ========================================================= */}
      <group ref={airplaneRef} position={[0, 285, 1000]}>
        {/* Aerodynamic Fuselage */}
        <mesh position={[0, 0, 0]} material={mats.planeBody} castShadow>
          <cylinderGeometry args={[1.2, 0.6, 18, 16]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
        {/* Cockpit Canopy */}
        <mesh position={[0, 0.8, 5.2]} material={mats.planeTrim}>
          <boxGeometry args={[1.6, 0.9, 3.2]} />
        </mesh>
        {/* Main Wingspan */}
        <mesh position={[0, 0.2, 1.2]} material={mats.planeBody} castShadow>
          <boxGeometry args={[22, 0.25, 3.2]} />
        </mesh>
        {/* Tail Fin & Horizontal Stabilizer */}
        <mesh position={[0, 2.4, -7.5]} material={mats.planeTrim}>
          <boxGeometry args={[0.2, 3.8, 2.4]} />
        </mesh>
        <mesh position={[0, 0.8, -7.8]} material={mats.planeBody}>
          <boxGeometry args={[7.2, 0.2, 1.8]} />
        </mesh>
        {/* Left & Right Engine Pods */}
        <mesh position={[-4.2, -0.2, 2.4]} material={mats.planeTrim}>
          <cylinderGeometry args={[0.7, 0.7, 3.6, 12]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
        <mesh position={[4.2, -0.2, 2.4]} material={mats.planeTrim}>
          <cylinderGeometry args={[0.7, 0.7, 3.6, 12]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
        {/* Spinning Propellers */}
        <group ref={propLRef} position={[-4.2, -0.2, 4.3]}>
          <mesh material={mats.planeTrim}>
            <boxGeometry args={[3.2, 0.15, 0.05]} />
          </mesh>
        </group>
        <group ref={propRRef} position={[4.2, -0.2, 4.3]}>
          <mesh material={mats.planeTrim}>
            <boxGeometry args={[3.2, 0.15, 0.05]} />
          </mesh>
        </group>

        {/* Aviation Navigation Lights (Port Red, Starboard Green, Tail White) */}
        <mesh position={[-10.9, 0.2, 1.2]}>
          <sphereGeometry args={[0.2, 6, 6]} />
          <primitive object={mats.navRed} />
        </mesh>
        <mesh position={[10.9, 0.2, 1.2]}>
          <sphereGeometry args={[0.2, 6, 6]} />
          <primitive object={mats.navGreen} />
        </mesh>
        <mesh position={[0, 4.2, -7.5]}>
          <sphereGeometry args={[0.25, 6, 6]} />
          <primitive object={mats.strobeWhite} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 3. GRAZING ALPINE DEER / WILDLIFE                         */}
      {/* ========================================================= */}
      <group ref={deerGroupRef}>
        {[
          { x: -145, z: -115, rot: 1.2 },
          { x: -155, z: -108, rot: 2.1 },
          { x: -138, z: -125, rot: -0.8 }
        ].map((d, i) => {
          const dy = getTerrainHeight(d.x, d.z);
          return (
            <group key={`deer_${i}`} position={[d.x, dy, d.z]} rotation={[0, d.rot, 0]}>
              {/* Deer Body */}
              <mesh position={[0, 1.3, 0]} material={mats.deerCoat} castShadow>
                <boxGeometry args={[0.9, 0.85, 2.0]} />
              </mesh>
              {/* 4 Slender Legs */}
              {[-0.32, 0.32].map((lx) =>
                [-0.7, 0.7].map((lz, lzi) => (
                  <mesh key={`dleg_${lx}_${lzi}`} position={[lx, 0.65, lz]} material={mats.deerCoat}>
                    <cylinderGeometry args={[0.08, 0.06, 1.3, 6]} />
                  </mesh>
                ))
              )}
              {/* Articulated Neck & Head */}
              <group name="deer_neck" position={[0, 1.6, 0.9]}>
                <mesh position={[0, 0.35, 0.3]} rotation={[0.45, 0, 0]} material={mats.deerCoat}>
                  <cylinderGeometry args={[0.18, 0.28, 0.85, 8]} />
                </mesh>
                <mesh position={[0, 0.65, 0.6]} material={mats.deerCoat}>
                  <boxGeometry args={[0.42, 0.38, 0.75]} />
                </mesh>
                {/* Antlers for the Stag */}
                {i === 0 && (
                  <group position={[0, 0.9, 0.5]}>
                    <mesh position={[-0.25, 0.35, 0]} rotation={[0, 0, -0.35]} material={mats.deerAntler}>
                      <cylinderGeometry args={[0.04, 0.05, 0.75, 5]} />
                    </mesh>
                    <mesh position={[0.25, 0.35, 0]} rotation={[0, 0, 0.35]} material={mats.deerAntler}>
                      <cylinderGeometry args={[0.04, 0.05, 0.75, 5]} />
                    </mesh>
                  </group>
                )}
              </group>
            </group>
          );
        })}
      </group>
    </group>
  );
}

