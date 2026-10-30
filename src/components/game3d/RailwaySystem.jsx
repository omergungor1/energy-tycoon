'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight } from './WorldCanvas';

/**
 * Procedural Island Railway Network with Track Ballast, Ties, Steel Rails & Moving Freight Train
 */
export default function RailwaySystem({ isNight = false }) {
  const locomotiveRef = useRef();
  const wagon1Ref = useRef();
  const wagon2Ref = useRef();
  const tankerRef = useRef();
  const cabooseRef = useRef();
  const trainHeadlightRef = useRef();

  // Closed-loop scenic railway route connecting Harbor, Industrial Park, Central Substation & Sunfire City
  const railCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(220, 0, -340), // Harbor Freight Terminal
      new THREE.Vector3(175, 0, -220),
      new THREE.Vector3(120, 0, -110),
      new THREE.Vector3(75, 0, -35),   // Industrial Park Siding
      new THREE.Vector3(15, 0, 45),    // Central Substation South
      new THREE.Vector3(85, 0, 140),   // River Trestle Crossing
      new THREE.Vector3(185, 0, 195),
      new THREE.Vector3(285, 0, 175),  // Sunfire City West Depot
      new THREE.Vector3(375, 0, 85),   // Sunfire City Central Station
      new THREE.Vector3(420, 0, -35),
      new THREE.Vector3(390, 0, -165), // Scenic Eastern Coastal Plain
      new THREE.Vector3(320, 0, -270)
    ], true);
  }, []);

  // Generate 3D Railroad Track Ballast, Ties & Dual Steel Rails
  const trackGeometry = useMemo(() => {
    const sampleCount = 360;
    const points = railCurve.getPoints(sampleCount);

    const ballastVertices = [];
    const ballastIndices = [];
    const leftRailVertices = [];
    const rightRailVertices = [];
    const railIndices = [];

    const GAUGE_HALF = 0.85; // Track half-gauge width
    const BALLAST_HALF = 2.2;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const u = i / points.length;
      const tangent = railCurve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const groundY = getTerrainHeight(p.x, p.z);
      const trackY = groundY + 0.42;

      // Ballast gravel embankment
      const bL = p.clone().addScaledVector(normal, BALLAST_HALF);
      const bR = p.clone().addScaledVector(normal, -BALLAST_HALF);
      ballastVertices.push(bL.x, trackY - 0.25, bL.z);
      ballastVertices.push(bR.x, trackY - 0.25, bR.z);

      // Left and Right Steel Rails
      const rL = p.clone().addScaledVector(normal, GAUGE_HALF);
      const rR = p.clone().addScaledVector(normal, -GAUGE_HALF);
      leftRailVertices.push(rL.x, trackY + 0.18, rL.z);
      leftRailVertices.push(rL.x, trackY + 0.05, rL.z);
      rightRailVertices.push(rR.x, trackY + 0.18, rR.z);
      rightRailVertices.push(rR.x, trackY + 0.05, rR.z);

      if (i < points.length - 1) {
        const bIdx = i * 2;
        ballastIndices.push(bIdx, bIdx + 1, bIdx + 2);
        ballastIndices.push(bIdx + 1, bIdx + 3, bIdx + 2);

        const rIdx = i * 2;
        railIndices.push(rIdx, rIdx + 1, rIdx + 2);
        railIndices.push(rIdx + 1, rIdx + 3, rIdx + 2);
      }
    }

    const ballastGeo = new THREE.BufferGeometry();
    ballastGeo.setAttribute('position', new THREE.Float32BufferAttribute(ballastVertices, 3));
    ballastGeo.setIndex(ballastIndices);
    ballastGeo.computeVertexNormals();

    const railLGeo = new THREE.BufferGeometry();
    railLGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftRailVertices, 3));
    railLGeo.setIndex(railIndices);
    railLGeo.computeVertexNormals();

    const railRGeo = new THREE.BufferGeometry();
    railRGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightRailVertices, 3));
    railRGeo.setIndex(railIndices);
    railRGeo.computeVertexNormals();

    return { ballastGeo, railLGeo, railRGeo };
  }, [railCurve]);

  // Train Materials
  const mats = useMemo(() => {
    return {
      locoBody: new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.35, metalness: 0.6 }),
      locoNose: new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 }),
      metalChassis: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7, metalness: 0.8 }),
      containerOrange: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.5 }),
      containerGreen: new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.5 }),
      tankerSilver: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.25, metalness: 0.85 }),
      cabooseRed: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.5 }),
      trackBallast: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.95 }),
      steelRail: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.2, metalness: 0.9 }),
      headlightBeam: new THREE.MeshBasicMaterial({ color: '#fef08a', transparent: true, opacity: 0.35 })
    };
  }, []);

  // Animate Train Motion along the closed loop spline
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const trainSpeed = 0.012; // Complete loop every ~83 seconds

    const updateCarriage = (ref, progressOffset, length = 7.0) => {
      if (!ref.current) return;
      let progress = ((t * trainSpeed - progressOffset) % 1.0 + 1.0) % 1.0;

      const p = railCurve.getPointAt(progress);
      const groundY = getTerrainHeight(p.x, p.z);
      const nextProgress = (progress + 0.003) % 1.0;
      const pNext = railCurve.getPointAt(nextProgress);
      const nextGroundY = getTerrainHeight(pNext.x, pNext.z);

      ref.current.position.set(p.x, groundY + 0.52, p.z);
      ref.current.lookAt(pNext.x, nextGroundY + 0.52, pNext.z);
    };

    // 1. Locomotive (Front)
    updateCarriage(locomotiveRef, 0.0, 7.5);

    // 2. Freight Container Wagon 1
    updateCarriage(wagon1Ref, 0.018, 7.0);

    // 3. Freight Container Wagon 2
    updateCarriage(wagon2Ref, 0.035, 7.0);

    // 4. Cylindrical Oil / Chemical Tanker Wagon
    updateCarriage(tankerRef, 0.052, 7.0);

    // 5. Red Caboose (Rear)
    updateCarriage(cabooseRef, 0.068, 6.0);
  });

  return (
    <group>
      {/* 1. Track Bed Ballast */}
      <mesh geometry={trackGeometry.ballastGeo} receiveShadow material={mats.trackBallast} />

      {/* 2. Dual Steel Rails */}
      <mesh geometry={trackGeometry.railLGeo} material={mats.steelRail} />
      <mesh geometry={trackGeometry.railRGeo} material={mats.steelRail} />

      {/* 3. Animated Heavy Freight Train Consist */}

      {/* LOCOMOTIVE */}
      <group ref={locomotiveRef}>
        {/* Heavy Steel Bogies & Chassis */}
        <mesh position={[0, 0.45, 0]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[2.5, 0.7, 7.5]} />
        </mesh>
        {/* Cab Body */}
        <mesh position={[0, 2.1, 0.6]} material={mats.locoBody} castShadow>
          <boxGeometry args={[2.3, 2.6, 5.8]} />
        </mesh>
        {/* High-visibility Warning Nose */}
        <mesh position={[0, 1.8, 3.4]} material={mats.locoNose} castShadow>
          <boxGeometry args={[2.1, 2.0, 0.8]} />
        </mesh>
        {/* Cab Windshield */}
        <mesh position={[0, 2.5, 3.42]} material={mats.metalChassis}>
          <boxGeometry args={[1.8, 0.8, 0.05]} />
        </mesh>
        {/* Active Locomotive Headlight */}
        <mesh position={[0, 2.0, 3.82]}>
          <cylinderGeometry args={[0.28, 0.28, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        {/* Night Headlight Cone */}
        {isNight && (
          <mesh position={[0, 1.8, 14]} rotation={[Math.PI / 2, 0, 0]} material={mats.headlightBeam}>
            <cylinderGeometry args={[0.2, 3.8, 20, 16, 1, true]} />
          </mesh>
        )}
      </group>

      {/* WAGON 1: Orange ISO Container */}
      <group ref={wagon1Ref}>
        <mesh position={[0, 0.4, 0]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[2.4, 0.6, 6.8]} />
        </mesh>
        <mesh position={[0, 1.9, 0]} material={mats.containerOrange} castShadow>
          <boxGeometry args={[2.3, 2.4, 6.2]} />
        </mesh>
      </group>

      {/* WAGON 2: Green ISO Container */}
      <group ref={wagon2Ref}>
        <mesh position={[0, 0.4, 0]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[2.4, 0.6, 6.8]} />
        </mesh>
        <mesh position={[0, 1.9, 0]} material={mats.containerGreen} castShadow>
          <boxGeometry args={[2.3, 2.4, 6.2]} />
        </mesh>
      </group>

      {/* WAGON 3: Chemical / Fuel Tanker Car */}
      <group ref={tankerRef}>
        <mesh position={[0, 0.4, 0]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[2.4, 0.6, 6.8]} />
        </mesh>
        <mesh position={[0, 1.9, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.tankerSilver} castShadow>
          <cylinderGeometry args={[1.2, 1.2, 6.2, 16]} />
        </mesh>
      </group>

      {/* WAGON 4: Red Caboose */}
      <group ref={cabooseRef}>
        <mesh position={[0, 0.4, 0]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[2.4, 0.6, 6.2]} />
        </mesh>
        <mesh position={[0, 1.8, 0]} material={mats.cabooseRed} castShadow>
          <boxGeometry args={[2.3, 2.2, 5.2]} />
        </mesh>
        {/* Cupola Observation Dome */}
        <mesh position={[0, 3.2, 0]} material={mats.cabooseRed} castShadow>
          <boxGeometry args={[1.8, 0.8, 2.2]} />
        </mesh>
        {/* Red Rear Marker Light */}
        <mesh position={[0, 1.8, -2.7]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color={isNight ? '#ef4444' : '#64748b'} />
        </mesh>
      </group>
    </group>
  );
}

