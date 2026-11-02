'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { getTerrainHeight } from './WorldCanvas';

/**
 * High-Definition Island Railway Network:
 * 1. Prominent 3D Track: Elevated Ballast Bed, ~750 Creosote Wooden Ties (Sleepers) & Dual Polished Steel Rails
 * 2. Realistic Tightly-Coupled Freight Train with Coupler Knuckles & Bogies
 * 3. Locomotive Exhaust Smoke Puffs trailing dynamically behind
 * 4. 3 Scenic Railway Stations: Sunfire City Central, Harbor Cargo Terminal, Central Substation Depot
 */
export default function RailwaySystem({ isNight = false }) {
  const locomotiveRef = useRef();
  const wagon1Ref = useRef();
  const wagon2Ref = useRef();
  const tankerRef = useRef();
  const cabooseRef = useRef();
  const smokeRef = useRef();
  const tiesRef = useRef();

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

  const totalLength = useMemo(() => railCurve.getLength(), [railCurve]);

  // Generate 3D Railroad Track: Raised Gravel Ballast Bed & Dual Polished Steel Rails
  const trackGeometry = useMemo(() => {
    const sampleCount = 420;
    const points = railCurve.getPoints(sampleCount);

    const ballastVertices = [];
    const ballastIndices = [];
    const leftRailVertices = [];
    const leftRailIndices = [];
    const rightRailVertices = [];
    const rightRailIndices = [];

    const GAUGE_HALF = 0.85; // Track half-gauge width
    const RAIL_WIDTH_HALF = 0.08;
    const BALLAST_HALF = 2.4; // Wide distinct gravel ballast bed

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const u = i / points.length;
      const tangent = railCurve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const groundY = getTerrainHeight(p.x, p.z);
      const trackY = groundY + 0.46; // Prominently elevated above terrain

      // 1. Gravel Ballast Bed (Cross-section)
      const bL = p.clone().addScaledVector(normal, BALLAST_HALF);
      const bR = p.clone().addScaledVector(normal, -BALLAST_HALF);
      ballastVertices.push(bL.x, trackY - 0.18, bL.z);
      ballastVertices.push(bR.x, trackY - 0.18, bR.z);

      // 2. Left Steel Rail (Cross-section width 16cm)
      const rL_outer = p.clone().addScaledVector(normal, GAUGE_HALF + RAIL_WIDTH_HALF);
      const rL_inner = p.clone().addScaledVector(normal, GAUGE_HALF - RAIL_WIDTH_HALF);
      leftRailVertices.push(rL_outer.x, trackY + 0.22, rL_outer.z);
      leftRailVertices.push(rL_inner.x, trackY + 0.22, rL_inner.z);

      // 3. Right Steel Rail (Cross-section width 16cm)
      const rR_inner = p.clone().addScaledVector(normal, -(GAUGE_HALF - RAIL_WIDTH_HALF));
      const rR_outer = p.clone().addScaledVector(normal, -(GAUGE_HALF + RAIL_WIDTH_HALF));
      rightRailVertices.push(rR_inner.x, trackY + 0.22, rR_inner.z);
      rightRailVertices.push(rR_outer.x, trackY + 0.22, rR_outer.z);

      if (i < points.length - 1) {
        const bIdx = i * 2;
        // Counter-clockwise indices (Normals face UP towards sky)
        ballastIndices.push(bIdx, bIdx + 2, bIdx + 1);
        ballastIndices.push(bIdx + 1, bIdx + 2, bIdx + 3);

        leftRailIndices.push(bIdx, bIdx + 2, bIdx + 1);
        leftRailIndices.push(bIdx + 1, bIdx + 2, bIdx + 3);

        rightRailIndices.push(bIdx, bIdx + 2, bIdx + 1);
        rightRailIndices.push(bIdx + 1, bIdx + 2, bIdx + 3);
      }
    }

    const ballastGeo = new THREE.BufferGeometry();
    ballastGeo.setAttribute('position', new THREE.Float32BufferAttribute(ballastVertices, 3));
    ballastGeo.setIndex(ballastIndices);
    ballastGeo.computeVertexNormals();

    const railLGeo = new THREE.BufferGeometry();
    railLGeo.setAttribute('position', new THREE.Float32BufferAttribute(leftRailVertices, 3));
    railLGeo.setIndex(leftRailIndices);
    railLGeo.computeVertexNormals();

    const railRGeo = new THREE.BufferGeometry();
    railRGeo.setAttribute('position', new THREE.Float32BufferAttribute(rightRailVertices, 3));
    railRGeo.setIndex(rightRailIndices);
    railRGeo.computeVertexNormals();

    return { ballastGeo, railLGeo, railRGeo };
  }, [railCurve]);

  // Wooden Railroad Ties (Sleepers / Traversler) spaced every 2.0m along the entire line
  const tieCount = useMemo(() => Math.floor(totalLength / 2.0), [totalLength]);
  const tieGeo = useMemo(() => new THREE.BoxGeometry(2.7, 0.16, 0.44), []);

  useEffect(() => {
    if (!tiesRef.current) return;
    const dummy = new THREE.Object3D();
    const upVec = new THREE.Vector3(0, 1, 0);

    for (let k = 0; k < tieCount; k++) {
      const u = k / tieCount;
      const pt = railCurve.getPointAt(u);
      const tang = railCurve.getTangentAt(u).normalize();
      const norm = new THREE.Vector3(-tang.z, 0, tang.x).normalize();
      const groundY = getTerrainHeight(pt.x, pt.z);

      dummy.position.set(pt.x, groundY + 0.40, pt.z);
      // Align tie perpendicular to track tangent
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), norm);
      dummy.updateMatrix();
      tiesRef.current.setMatrixAt(k, dummy.matrix);
    }
    tiesRef.current.instanceMatrix.needsUpdate = true;
    tiesRef.current.frustumCulled = false;
  }, [railCurve, tieCount]);

  // Locomotive Exhaust Smoke Simulation State (20 expanding billowy puffs)
  const smokeParticles = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      pos: new THREE.Vector3(),
      age: (i / 20) * 2.4, // Staggered initial ages
      maxAge: 2.4,
      driftX: (Math.random() - 0.5) * 0.45,
      driftZ: (Math.random() - 0.5) * 0.45
    }))
  );

  // Train & Infrastructure Materials
  const mats = useMemo(() => {
    return {
      locoBody: new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.35, metalness: 0.5 }),
      locoNose: new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 }),
      metalChassis: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7, metalness: 0.8 }),
      couplerSteel: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5, metalness: 0.9 }),
      trainWheel: new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.6, metalness: 0.8 }),
      containerOrange: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.5 }),
      containerGreen: new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.5 }),
      tankerSilver: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.25, metalness: 0.85 }),
      cabooseRed: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.5 }),
      trackBallast: new THREE.MeshStandardMaterial({
        color: '#2d3748',
        roughness: 0.95,
        side: THREE.DoubleSide
      }),
      woodenTie: new THREE.MeshStandardMaterial({
        color: '#261b14',
        roughness: 0.92,
        side: THREE.DoubleSide
      }),
      steelRail: new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        roughness: 0.22,
        metalness: 0.88,
        side: THREE.DoubleSide
      }),
      stationPlat: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 }),
      stationRoof: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7, metalness: 0.3 }),
      tactileYellow: new THREE.MeshBasicMaterial({ color: '#fbbf24' }),
      headlightBeam: new THREE.MeshBasicMaterial({
        color: '#fef08a',
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    };
  }, []);

  // Animate Train Motion along the closed loop spline with realistic close coupler spacing
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);
    const trainSpeed = 0.009; // Realistic scenic cruising pace

    const updateCarriage = (ref, progressOffset) => {
      if (!ref.current) return;
      let progress = ((t * trainSpeed - progressOffset) % 1.0 + 1.0) % 1.0;

      const p = railCurve.getPointAt(progress);
      const groundY = getTerrainHeight(p.x, p.z);
      const nextProgress = (progress + 0.003) % 1.0;
      const pNext = railCurve.getPointAt(nextProgress);
      const nextGroundY = getTerrainHeight(pNext.x, pNext.z);

      ref.current.position.set(p.x, groundY + 0.54, p.z);
      ref.current.lookAt(pNext.x, nextGroundY + 0.54, pNext.z);
    };

    // Realistic close spacing: wagon length 6.8m + 0.7m gap = ~7.5m center-to-center
    const stepOffset = 7.5 / totalLength;

    // 1. Locomotive (Front)
    updateCarriage(locomotiveRef, 0.0);

    // 2. Freight Container Wagon 1
    updateCarriage(wagon1Ref, stepOffset);

    // 3. Freight Container Wagon 2
    updateCarriage(wagon2Ref, stepOffset * 2);

    // 4. Cylindrical Oil / Chemical Tanker Wagon
    updateCarriage(tankerRef, stepOffset * 3);

    // 5. Red Caboose (Rear)
    updateCarriage(cabooseRef, stepOffset * 4);

    // 6. Dynamic Locomotive Exhaust Smoke Puffs
    if (smokeRef.current && locomotiveRef.current) {
      // Chimney position at front of locomotive cab (local: [0, 3.2, 1.8])
      const chimneyWorld = new THREE.Vector3(0, 3.2, 1.8);
      locomotiveRef.current.localToWorld(chimneyWorld);

      const dummy = new THREE.Object3D();

      smokeParticles.current.forEach((sp, i) => {
        sp.age += dt;
        if (sp.age >= sp.maxAge) {
          sp.age = 0;
          sp.pos.copy(chimneyWorld);
          sp.driftX = (Math.random() - 0.5) * 0.45;
          sp.driftZ = (Math.random() - 0.5) * 0.45;
        } else {
          // Smoke billows upward and drifts softly in the mountain wind
          sp.pos.y += dt * 1.85;
          sp.pos.x += dt * sp.driftX;
          sp.pos.z += dt * sp.driftZ;
        }

        const tNorm = sp.age / sp.maxAge;
        // Scale grows from 0.4m up to 2.2m
        const scale = 0.38 + tNorm * 1.95;
        dummy.position.copy(sp.pos);
        dummy.scale.set(scale, scale * 1.08, scale);
        dummy.updateMatrix();
        smokeRef.current.setMatrixAt(i, dummy.matrix);
      });

      smokeRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Track Bed Ballast (Prominent, Counter-Clockwise, DoubleSide) */}
      <mesh
        geometry={trackGeometry.ballastGeo}
        receiveShadow
        material={mats.trackBallast}
      />

      {/* 2. Wooden Railroad Ties (Sleepers / Traversler - Instanced along entire track) */}
      <instancedMesh
        ref={tiesRef}
        args={[tieGeo, mats.woodenTie, tieCount]}
        receiveShadow
        frustumCulled={false}
      />

      {/* 3. Dual Polished Steel Rails */}
      <mesh geometry={trackGeometry.railLGeo} material={mats.steelRail} />
      <mesh geometry={trackGeometry.railRGeo} material={mats.steelRail} />

      {/* 4. Locomotive Exhaust Smoke Puffs */}
      <instancedMesh
        ref={smokeRef}
        args={[null, null, 20]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.75, 1]} />
        <meshStandardMaterial
          color={isNight ? '#64748b' : '#cbd5e1'}
          roughness={0.96}
          transparent
          opacity={0.46}
          depthWrite={false}
        />
      </instancedMesh>

      {/* ========================================================= */}
      {/* 5. SCENIC TRAIN STATIONS                                  */}
      {/* ========================================================= */}

      {/* STATION 1: Sunfire City Central Passenger Station (at [375, 0, 85]) */}
      <group position={[380, getTerrainHeight(380, 85), 85]}>
        {/* Passenger Platform */}
        <mesh position={[6.0, 0.45, 0]} receiveShadow material={mats.stationPlat}>
          <boxGeometry args={[7.5, 0.9, 38]} />
        </mesh>
        {/* Yellow Safety Tactile Edge */}
        <mesh position={[2.5, 0.91, 0]} material={mats.tactileYellow}>
          <boxGeometry args={[0.35, 0.05, 38]} />
        </mesh>
        {/* Modern Canopy Roof */}
        <mesh position={[6.5, 4.4, 0]} material={mats.stationRoof} castShadow>
          <boxGeometry args={[8.5, 0.25, 34]} />
        </mesh>
        {/* Canopy Support Columns */}
        {[-14, -7, 0, 7, 14].map((cz, ci) => (
          <mesh key={`sun_col_${ci}`} position={[8.5, 2.2, cz]} material={mats.metalChassis}>
            <cylinderGeometry args={[0.14, 0.14, 4.4, 8]} />
          </mesh>
        ))}
        {/* Station Name Board */}
        <group position={[6.5, 5.0, 0]}>
          <mesh material={mats.metalChassis}>
            <boxGeometry args={[0.2, 0.9, 12]} />
          </mesh>
          <Text
            position={[-0.15, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            fontSize={0.55}
            color="#38bdf8"
            outlineWidth={0.06}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            SUNFIRE MERKEZ İSTASYONU
          </Text>
        </group>
        {/* Trackside Signal Lamp */}
        <group position={[2.5, 0, -20]}>
          <mesh position={[0, 2.5, 0]} material={mats.metalChassis}>
            <cylinderGeometry args={[0.1, 0.1, 5.0, 6]} />
          </mesh>
          <mesh position={[0, 4.8, 0]} material={mats.metalChassis}>
            <boxGeometry args={[0.4, 0.8, 0.4]} />
          </mesh>
          <mesh position={[0, 5.0, 0.22]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh position={[0, 4.6, 0.22]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* STATION 2: Harbor Freight & Logistics Terminal (at [222, 0, -335]) */}
      <group position={[222, getTerrainHeight(222, -335), -335]} rotation={[0, -0.6, 0]}>
        {/* Heavy-Duty Cargo Loading Platform */}
        <mesh position={[6.5, 0.45, 0]} receiveShadow material={mats.stationPlat}>
          <boxGeometry args={[8.5, 0.9, 42]} />
        </mesh>
        {/* Heavy Industrial Gantry Overhead Crane */}
        <group position={[0, 0, 0]}>
          <mesh position={[-3.5, 3.8, 0]} material={mats.locoNose} castShadow>
            <boxGeometry args={[0.5, 7.6, 0.5]} />
          </mesh>
          <mesh position={[10.5, 3.8, 0]} material={mats.locoNose} castShadow>
            <boxGeometry args={[0.5, 7.6, 0.5]} />
          </mesh>
          {/* Horizontal Gantry Beam over track */}
          <mesh position={[3.5, 7.6, 0]} material={mats.locoNose} castShadow>
            <boxGeometry args={[14.5, 0.8, 1.2]} />
          </mesh>
        </group>
        {/* Cargo Shipping Crates on Platform */}
        <mesh position={[7.5, 1.6, -8]} material={mats.containerGreen} castShadow>
          <boxGeometry args={[2.8, 1.4, 3.6]} />
        </mesh>
        <mesh position={[7.5, 1.6, 8]} material={mats.containerOrange} castShadow>
          <boxGeometry args={[2.8, 1.4, 3.6]} />
        </mesh>
        {/* Terminal Signboard */}
        <group position={[6.5, 2.8, 0]}>
          <mesh material={mats.metalChassis}>
            <boxGeometry args={[0.2, 0.8, 11]} />
          </mesh>
          <Text
            position={[-0.15, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            fontSize={0.52}
            color="#f59e0b"
            outlineWidth={0.06}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            LİMAN YÜK TERMİNALİ
          </Text>
        </group>
      </group>

      {/* STATION 3: Central Substation & Junction Depot (at [25, 0, 48]) */}
      <group position={[25, getTerrainHeight(25, 48), 48]} rotation={[0, 0.8, 0]}>
        {/* Maintenance Platform */}
        <mesh position={[5.5, 0.45, 0]} receiveShadow material={mats.stationPlat}>
          <boxGeometry args={[6.5, 0.9, 30]} />
        </mesh>
        {/* Yellow Safety Line */}
        <mesh position={[2.5, 0.91, 0]} material={mats.tactileYellow}>
          <boxGeometry args={[0.3, 0.05, 30]} />
        </mesh>
        {/* Trackside Electrical Relay Tool Shed */}
        <mesh position={[6.5, 2.1, -6]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[3.4, 2.4, 4.6]} />
        </mesh>
        {/* Depot Signboard */}
        <group position={[5.5, 2.8, 6]}>
          <mesh material={mats.metalChassis}>
            <boxGeometry args={[0.2, 0.8, 10]} />
          </mesh>
          <Text
            position={[-0.15, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            fontSize={0.50}
            color="#10b981"
            outlineWidth={0.06}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            TRAFO DEPO İSTASYONU
          </Text>
        </group>
      </group>

      {/* ========================================================= */}
      {/* 6. TIGHTLY COUPLED FREIGHT TRAIN WITH WHEELS & COUPLERS   */}
      {/* ========================================================= */}

      {/* 1. LOCOMOTIVE */}
      <group ref={locomotiveRef}>
        {/* Steel Chassis */}
        <mesh position={[0, 0.45, 0]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[2.5, 0.7, 7.5]} />
        </mesh>
        {/* Rear Coupler Drawbar (Connects to Wagon 1) */}
        <mesh position={[0, 0.42, -3.75]} material={mats.couplerSteel}>
          <boxGeometry args={[0.35, 0.22, 0.8]} />
        </mesh>
        {/* Front Cowcatcher Guard */}
        <mesh position={[0, 0.35, 3.85]} material={mats.couplerSteel}>
          <boxGeometry args={[2.4, 0.4, 0.3]} />
        </mesh>
        {/* Locomotive Cab Body */}
        <mesh position={[0, 2.1, 0.6]} material={mats.locoBody} castShadow>
          <boxGeometry args={[2.3, 2.6, 5.8]} />
        </mesh>
        {/* High-visibility Warning Nose */}
        <mesh position={[0, 1.8, 3.4]} material={mats.locoNose} castShadow>
          <boxGeometry args={[2.1, 2.0, 0.8]} />
        </mesh>
        {/* Exhaust Smokestack / Chimney */}
        <mesh position={[0, 3.3, 2.0]} material={mats.couplerSteel}>
          <cylinderGeometry args={[0.24, 0.3, 0.6, 12]} />
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
            <cylinderGeometry args={[3.8, 0.2, 20, 16, 1, true]} />
          </mesh>
        )}
        {/* Steel Train Wheels / Bogies */}
        {[-1.0, 1.0].map((wx) =>
          [-2.6, -1.6, 1.6, 2.6].map((wz, wi) => (
            <mesh key={`loco_w_${wx}_${wz}_${wi}`} position={[wx, 0.28, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.38, 0.2, 12]} />
              <primitive object={mats.trainWheel} />
            </mesh>
          ))
        )}
      </group>

      {/* 2. WAGON 1: Orange ISO Container */}
      <group ref={wagon1Ref}>
        {/* Coupler Drawbars */}
        <mesh position={[0, 0.42, 3.4]} material={mats.couplerSteel}>
          <boxGeometry args={[0.35, 0.22, 0.8]} />
        </mesh>
        <mesh position={[0, 0.42, -3.4]} material={mats.couplerSteel}>
          <boxGeometry args={[0.35, 0.22, 0.8]} />
        </mesh>
        {/* Chassis */}
        <mesh position={[0, 0.4, 0]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[2.4, 0.6, 6.8]} />
        </mesh>
        {/* Orange Container */}
        <mesh position={[0, 1.9, 0]} material={mats.containerOrange} castShadow>
          <boxGeometry args={[2.3, 2.4, 6.2]} />
        </mesh>
        {/* Wheels */}
        {[-1.0, 1.0].map((wx) =>
          [-2.2, -1.2, 1.2, 2.2].map((wz, wi) => (
            <mesh key={`w1_w_${wx}_${wz}_${wi}`} position={[wx, 0.28, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.36, 0.36, 0.18, 12]} />
              <primitive object={mats.trainWheel} />
            </mesh>
          ))
        )}
      </group>

      {/* 3. WAGON 2: Green ISO Container */}
      <group ref={wagon2Ref}>
        {/* Coupler Drawbars */}
        <mesh position={[0, 0.42, 3.4]} material={mats.couplerSteel}>
          <boxGeometry args={[0.35, 0.22, 0.8]} />
        </mesh>
        <mesh position={[0, 0.42, -3.4]} material={mats.couplerSteel}>
          <boxGeometry args={[0.35, 0.22, 0.8]} />
        </mesh>
        {/* Chassis */}
        <mesh position={[0, 0.4, 0]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[2.4, 0.6, 6.8]} />
        </mesh>
        {/* Green Container */}
        <mesh position={[0, 1.9, 0]} material={mats.containerGreen} castShadow>
          <boxGeometry args={[2.3, 2.4, 6.2]} />
        </mesh>
        {/* Wheels */}
        {[-1.0, 1.0].map((wx) =>
          [-2.2, -1.2, 1.2, 2.2].map((wz, wi) => (
            <mesh key={`w2_w_${wx}_${wz}_${wi}`} position={[wx, 0.28, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.36, 0.36, 0.18, 12]} />
              <primitive object={mats.trainWheel} />
            </mesh>
          ))
        )}
      </group>

      {/* 4. WAGON 3: Chemical / Fuel Tanker Car */}
      <group ref={tankerRef}>
        {/* Coupler Drawbars */}
        <mesh position={[0, 0.42, 3.4]} material={mats.couplerSteel}>
          <boxGeometry args={[0.35, 0.22, 0.8]} />
        </mesh>
        <mesh position={[0, 0.42, -3.4]} material={mats.couplerSteel}>
          <boxGeometry args={[0.35, 0.22, 0.8]} />
        </mesh>
        {/* Chassis */}
        <mesh position={[0, 0.4, 0]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[2.4, 0.6, 6.8]} />
        </mesh>
        {/* Silver Tank Body */}
        <mesh position={[0, 1.9, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.tankerSilver} castShadow>
          <cylinderGeometry args={[1.2, 1.2, 6.2, 16]} />
        </mesh>
        {/* Wheels */}
        {[-1.0, 1.0].map((wx) =>
          [-2.2, -1.2, 1.2, 2.2].map((wz, wi) => (
            <mesh key={`w3_w_${wx}_${wz}_${wi}`} position={[wx, 0.28, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.36, 0.36, 0.18, 12]} />
              <primitive object={mats.trainWheel} />
            </mesh>
          ))
        )}
      </group>

      {/* 5. WAGON 4: Red Caboose */}
      <group ref={cabooseRef}>
        {/* Front Coupler Drawbar */}
        <mesh position={[0, 0.42, 3.1]} material={mats.couplerSteel}>
          <boxGeometry args={[0.35, 0.22, 0.8]} />
        </mesh>
        {/* Chassis */}
        <mesh position={[0, 0.4, 0]} material={mats.metalChassis} castShadow>
          <boxGeometry args={[2.4, 0.6, 6.2]} />
        </mesh>
        {/* Red Cabin */}
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
        {/* Wheels */}
        {[-1.0, 1.0].map((wx) =>
          [-2.0, -1.0, 1.0, 2.0].map((wz, wi) => (
            <mesh key={`w4_w_${wx}_${wz}_${wi}`} position={[wx, 0.28, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.36, 0.36, 0.18, 12]} />
              <primitive object={mats.trainWheel} />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}
