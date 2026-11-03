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
      new THREE.Vector3(220, 0, -340), // Harbor Freight Terminal (Station 2)
      new THREE.Vector3(175, 0, -220),
      new THREE.Vector3(120, 0, -110),
      new THREE.Vector3(85, 0, -25),   // Industrial Park Siding
      new THREE.Vector3(85, 0, 60),    // Level Crossing with East Highway 2
      new THREE.Vector3(65, 0, 150),   // Scenic Valley Green Corridor
      new THREE.Vector3(35, 0, 220),   // Agri-Valley Farm Station (Station 3)
      new THREE.Vector3(105, 0, 230),  // River Trestle Crossing
      new THREE.Vector3(195, 0, 205),
      new THREE.Vector3(270, 0, 165),
      new THREE.Vector3(316, 0, 85),   // Sunfire City Bypass Station (Station 1)
      new THREE.Vector3(350, 0, -15),  // City North Bypass (Never intersects buildings)
      new THREE.Vector3(395, 0, -130), // Scenic Eastern Coastal Plain
      new THREE.Vector3(330, 0, -260)
    ], true);
  }, []);

  const totalLength = useMemo(() => railCurve.getLength(), [railCurve]);

  // Pre-calculate exact curve parameters (u in [0, 1]) for all 3 railway stations
  const STATIONS = useMemo(() => {
    const stationTargets = [
      { id: 'harbor', name: 'LİMAN YÜK TERMİNALİ', pos: new THREE.Vector3(220, 0, -340) },
      { id: 'agri', name: 'AGRI-VALLEY İSTASYONU', pos: new THREE.Vector3(35, 0, 220) },
      { id: 'sunfire', name: 'SUNFIRE ŞEHİR İSTASYONU', pos: new THREE.Vector3(316, 0, 85) }
    ];

    const findClosestU = (targetPos) => {
      let bestU = 0;
      let minDistSq = Infinity;
      const samples = 600;
      for (let s = 0; s <= samples; s++) {
        const u = s / samples;
        const pt = railCurve.getPointAt(u);
        const dx = pt.x - targetPos.x;
        const dz = pt.z - targetPos.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          bestU = u;
        }
      }
      return bestU;
    };

    return stationTargets
      .map((st) => ({
        ...st,
        u: findClosestU(st.pos)
      }))
      .sort((a, b) => a.u - b.u);
  }, [railCurve]);

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
      signWhite: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 }),
      barrierRed: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.5 }),
      headlightBeam: new THREE.MeshBasicMaterial({
        color: '#fef08a',
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    };
  }, []);

  // Train Simulation State: Station dwelling, realistic deceleration and smooth cruise
  const trainSimRef = useRef({
    progress: 0.05,
    speed: 0.0,
    maxSpeed: 22.0, // meters per second (~79 km/h)
    state: 'cruising',
    targetStationIdx: 1,
    dwellTimer: 0.0,
    isDwelling: false
  });

  // Track station dwell status for dynamic station signals
  const [activeDwellStation, setActiveDwellStation] = React.useState(null);

  // Animate Train Motion along the closed loop spline with station stops
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const sim = trainSimRef.current;
    const targetStation = STATIONS[sim.targetStationIdx];
    const targetU = targetStation.u;

    // Forward distance to target station along closed loop
    let distU = targetU - sim.progress;
    if (distU < 0) distU += 1.0;
    const distMeters = distU * totalLength;

    if (sim.isDwelling) {
      sim.speed = 0;
      sim.dwellTimer -= dt;
      if (sim.dwellTimer <= 0) {
        // Depart station!
        sim.isDwelling = false;
        setActiveDwellStation(null);
        sim.targetStationIdx = (sim.targetStationIdx + 1) % STATIONS.length;
      }
    } else {
      const BRAKE_DIST = 42.0; // Start braking 42 meters before station platform

      if (distMeters < 0.75) {
        // Train arrived and stopped at station platform!
        sim.progress = targetU;
        sim.speed = 0;
        sim.isDwelling = true;
        sim.dwellTimer = 8.5; // Waits for 8.5 seconds at each station
        setActiveDwellStation(targetStation.id);
      } else if (distMeters < BRAKE_DIST) {
        // Smooth deceleration into station
        const brakeFactor = Math.max(0.12, distMeters / BRAKE_DIST);
        const targetSpeed = Math.max(2.8, sim.maxSpeed * Math.sqrt(brakeFactor));
        sim.speed = Math.max(targetSpeed, sim.speed - dt * 14.0);
      } else {
        // Smooth acceleration up to cruising speed
        sim.speed = Math.min(sim.maxSpeed, sim.speed + dt * 8.5);
      }

      // Move progress forward along curve
      const deltaU = (sim.speed * dt) / totalLength;
      sim.progress = (sim.progress + deltaU) % 1.0;
    }

    const stepOffset = 7.5 / totalLength;

    const updateCarriage = (ref, carriageIdx) => {
      if (!ref.current) return;
      const carriageProgress = ((sim.progress - carriageIdx * stepOffset) % 1.0 + 1.0) % 1.0;

      const p = railCurve.getPointAt(carriageProgress);
      const groundY = getTerrainHeight(p.x, p.z);
      const nextProgress = (carriageProgress + 0.003) % 1.0;
      const pNext = railCurve.getPointAt(nextProgress);
      const nextGroundY = getTerrainHeight(pNext.x, pNext.z);

      ref.current.position.set(p.x, groundY + 0.54, p.z);
      ref.current.lookAt(pNext.x, nextGroundY + 0.54, pNext.z);
    };

    // 1. Locomotive (Front)
    updateCarriage(locomotiveRef, 0);

    // 2. Freight Container Wagon 1
    updateCarriage(wagon1Ref, 1);

    // 3. Freight Container Wagon 2
    updateCarriage(wagon2Ref, 2);

    // 4. Cylindrical Oil / Chemical Tanker Wagon
    updateCarriage(tankerRef, 3);

    // 5. Red Caboose (Rear)
    updateCarriage(cabooseRef, 4);

    // 6. Dynamic Locomotive Exhaust Smoke Puffs
    if (smokeRef.current && locomotiveRef.current) {
      const chimneyWorld = new THREE.Vector3(0, 3.2, 1.8);
      locomotiveRef.current.localToWorld(chimneyWorld);

      const dummy = new THREE.Object3D();
      const smokeSpeed = sim.isDwelling ? 0.75 : 1.95;

      smokeParticles.current.forEach((sp, i) => {
        sp.age += dt;
        if (sp.age >= sp.maxAge) {
          sp.age = 0;
          sp.pos.copy(chimneyWorld);
          sp.driftX = (Math.random() - 0.5) * 0.45;
          sp.driftZ = (Math.random() - 0.5) * 0.45;
        } else {
          sp.pos.y += dt * smokeSpeed;
          sp.pos.x += dt * sp.driftX;
          sp.pos.z += dt * sp.driftZ;
        }

        const tNorm = sp.age / sp.maxAge;
        const scale = 0.38 + tNorm * (sim.isDwelling ? 1.4 : 1.95);
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
      {/* 5. 3 SCENIC TRAIN STATIONS (WITH DWELL & ACTIVE SIGNALS)  */}
      {/* ========================================================= */}

      {/* STATION 1: Sunfire City Bypass Passenger Station (at [316, 0, 85]) */}
      <group position={[316, getTerrainHeight(316, 85), 85]}>
        {/* Passenger Platform (On the city side at x = +6.5) */}
        <mesh position={[6.5, 0.45, 0]} receiveShadow material={mats.stationPlat}>
          <boxGeometry args={[7.5, 0.9, 38]} />
        </mesh>
        {/* Pedestrian Promenade Ramp connecting directly into City Sidewalk at x = 334 */}
        <mesh position={[12.5, 0.45, 0]} receiveShadow material={mats.stationPlat}>
          <boxGeometry args={[4.5, 0.85, 16]} />
        </mesh>
        {/* Yellow Safety Tactile Edge */}
        <mesh position={[2.85, 0.91, 0]} material={mats.tactileYellow}>
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
            <boxGeometry args={[0.2, 0.9, 13]} />
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
            SUNFIRE ŞEHİR İSTASYONU
          </Text>
        </group>
        {/* Trackside Signal Lamp (Turns RED when train dwells, GREEN when departing) */}
        <group position={[2.5, 0, -20]}>
          <mesh position={[0, 2.5, 0]} material={mats.metalChassis}>
            <cylinderGeometry args={[0.1, 0.1, 5.0, 6]} />
          </mesh>
          <mesh position={[0, 4.8, 0]} material={mats.metalChassis}>
            <boxGeometry args={[0.4, 0.8, 0.4]} />
          </mesh>
          <mesh position={[0, 5.0, 0.22]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color={activeDwellStation === 'sunfire' ? '#1e293b' : '#10b981'} />
          </mesh>
          <mesh position={[0, 4.6, 0.22]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color={activeDwellStation === 'sunfire' ? '#ef4444' : '#1e293b'} />
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
        {/* Trackside Signal Lamp */}
        <group position={[2.5, 0, -22]}>
          <mesh position={[0, 2.5, 0]} material={mats.metalChassis}>
            <cylinderGeometry args={[0.1, 0.1, 5.0, 6]} />
          </mesh>
          <mesh position={[0, 4.8, 0]} material={mats.metalChassis}>
            <boxGeometry args={[0.4, 0.8, 0.4]} />
          </mesh>
          <mesh position={[0, 5.0, 0.22]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color={activeDwellStation === 'harbor' ? '#1e293b' : '#10b981'} />
          </mesh>
          <mesh position={[0, 4.6, 0.22]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color={activeDwellStation === 'harbor' ? '#ef4444' : '#1e293b'} />
          </mesh>
        </group>
      </group>

      {/* STATION 3: Agri-Valley Farm & Rural Station (at [35, 0, 220] near Agri Farm) */}
      <group position={[35, getTerrainHeight(35, 220), 220]} rotation={[0, 0.95, 0]}>
        {/* Rustic Stone & Timber Platform */}
        <mesh position={[6.0, 0.45, 0]} receiveShadow material={mats.stationPlat}>
          <boxGeometry args={[7.0, 0.9, 32]} />
        </mesh>
        {/* Yellow Safety Line */}
        <mesh position={[2.6, 0.91, 0]} material={mats.tactileYellow}>
          <boxGeometry args={[0.3, 0.05, 32]} />
        </mesh>
        {/* Rustic Timber Passenger Shelter */}
        <group position={[6.8, 0.9, 0]}>
          {/* Wooden Back & Side Walls */}
          <mesh position={[1.5, 1.4, 0]} material={mats.woodenTie}>
            <boxGeometry args={[0.2, 2.8, 12]} />
          </mesh>
          <mesh position={[0, 1.4, -6.0]} material={mats.woodenTie}>
            <boxGeometry args={[3.2, 2.8, 0.2]} />
          </mesh>
          <mesh position={[0, 1.4, 6.0]} material={mats.woodenTie}>
            <boxGeometry args={[3.2, 2.8, 0.2]} />
          </mesh>
          {/* Shingle Pitch Roof */}
          <mesh position={[0, 3.0, 0]} rotation={[0, 0, 0.15]} material={mats.stationRoof} castShadow>
            <boxGeometry args={[4.2, 0.2, 13.5]} />
          </mesh>
          {/* Waiting Benches */}
          <mesh position={[0.6, 0.45, 0]} material={mats.woodenTie}>
            <boxGeometry args={[0.9, 0.4, 6.0]} />
          </mesh>
        </group>
        {/* Milk Cans & Sacks on Platform */}
        {[-8, -6, 8].map((mz, mi) => (
          <mesh key={`milk_${mi}`} position={[6.5, 1.3, mz]}>
            <cylinderGeometry args={[0.35, 0.35, 0.8, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
        ))}
        {/* Station Name Board */}
        <group position={[6.0, 4.4, 0]}>
          <mesh material={mats.woodenTie}>
            <boxGeometry args={[0.2, 0.9, 12]} />
          </mesh>
          <Text
            position={[-0.15, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            fontSize={0.52}
            color="#facc15"
            outlineWidth={0.06}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            AGRI-VALLEY İSTASYONU
          </Text>
        </group>
        {/* Trackside Signal Lamp */}
        <group position={[2.5, 0, -18]}>
          <mesh position={[0, 2.5, 0]} material={mats.metalChassis}>
            <cylinderGeometry args={[0.1, 0.1, 5.0, 6]} />
          </mesh>
          <mesh position={[0, 4.8, 0]} material={mats.metalChassis}>
            <boxGeometry args={[0.4, 0.8, 0.4]} />
          </mesh>
          <mesh position={[0, 5.0, 0.22]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color={activeDwellStation === 'agri' ? '#1e293b' : '#10b981'} />
          </mesh>
          <mesh position={[0, 4.6, 0.22]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color={activeDwellStation === 'agri' ? '#ef4444' : '#1e293b'} />
          </mesh>
        </group>
      </group>

      {/* ========================================================= */}
      {/* RAILROAD HIGHWAY LEVEL CROSSING (HEMZEMİN GEÇİT)          */}
      {/* Highway 2 Crossing with East Railway Corridor at [85, 60] */}
      {/* ========================================================= */}
      <group position={[85, getTerrainHeight(85, 60), 60]} rotation={[0, -0.65, 0]}>
        {/* Rubber & Asphalt Flangeway Crossing Deck */}
        <mesh position={[0, 0.44, 0]} receiveShadow>
          <boxGeometry args={[6.2, 0.22, 11]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        {/* Yellow Warning Edge Curbs */}
        {[-3.0, 3.0].map((cx, ci) => (
          <mesh key={`cross_curb_${ci}`} position={[cx, 0.52, 0]}>
            <boxGeometry args={[0.25, 0.18, 11]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
        ))}

        {/* 2 Cantilever Level Crossing Warning Masts (Both Approaches) */}
        {[-4.6, 4.6].map((sx, si) => (
          <group
            key={`cross_mast_${si}`}
            position={[sx, 0, si === 0 ? 5.2 : -5.2]}
            rotation={[0, si === 0 ? 0 : Math.PI, 0]}
          >
            {/* Concrete Pedestal */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.9, 0.7, 0.9]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.9} />
            </mesh>
            {/* Steel Mast */}
            <mesh position={[0, 2.8, 0]} material={mats.metalChassis}>
              <cylinderGeometry args={[0.1, 0.1, 5.0, 8]} />
            </mesh>
            {/* St. Andrew Cross ("X") */}
            <group position={[0, 4.6, 0.12]}>
              <mesh rotation={[0, 0, Math.PI / 4]} material={mats.signWhite}>
                <boxGeometry args={[1.6, 0.25, 0.04]} />
              </mesh>
              <mesh rotation={[0, 0, -Math.PI / 4]} material={mats.signWhite}>
                <boxGeometry args={[1.6, 0.25, 0.04]} />
              </mesh>
            </group>
            {/* Alternating Red Hazard Warning Signals */}
            <mesh position={[-0.45, 4.0, 0.22]}>
              <sphereGeometry args={[0.18, 10, 10]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0.45, 4.0, 0.22]}>
              <sphereGeometry args={[0.18, 10, 10]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0, 4.0, 0.12]} material={mats.metalChassis}>
              <boxGeometry args={[1.2, 0.16, 0.1]} />
            </mesh>
            {/* Striped Barrier Boom Gate */}
            <mesh position={[0.2, 1.3, 0.2]} rotation={[0, 0, 0.35]} material={mats.barrierRed}>
              <boxGeometry args={[4.6, 0.14, 0.08]} />
            </mesh>
          </group>
        ))}
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
              <primitive attach="material" object={mats.trainWheel} />
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
              <primitive attach="material" object={mats.trainWheel} />
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
              <primitive attach="material" object={mats.trainWheel} />
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
              <primitive attach="material" object={mats.trainWheel} />
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
              <primitive attach="material" object={mats.trainWheel} />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}
