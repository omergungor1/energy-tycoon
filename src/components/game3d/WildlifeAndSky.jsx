'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight } from './WorldCanvas';

/**
 * Natural Wildlife & Living Sky Systems:
 * 1. Hot Air Balloons drifting across the valley
 * 2. Twin-Engine Commuter Airplane flying across the sky periodically
 * 3. Energy Grid Patrol Helicopter surveying substations & mountain lake periodically
 * 4. Grazing Alpine Deer / Wildlife in peaceful forest meadows
 */
export default function WildlifeAndSky({ isNight = false }) {
  const balloon1Ref = useRef();
  const balloon2Ref = useRef();
  const airplaneRef = useRef();
  const propLRef = useRef();
  const propRRef = useRef();
  const helicopterRef = useRef();
  const mainRotorRef = useRef();
  const tailRotorRef = useRef();
  const deerGroupRef = useRef();

  // Dynamic simulation state for grazing & roaming alpine deer herds
  const deerSimState = useRef([
    // Herd 1: Forest Meadow clearing (from user screenshot)
    {
      id: 0,
      hasAntlers: true,
      scale: 1.05,
      coatColor: '#92400e',
      x: -145,
      z: -115,
      homeX: -145,
      homeZ: -115,
      wanderRadius: 24,
      targetX: -145,
      targetZ: -115,
      rot: 1.2,
      targetRot: 1.2,
      state: 'grazing',
      stateTimer: 6.0,
      walkSpeed: 1.1,
      walkPhase: 0
    },
    {
      id: 1,
      hasAntlers: false,
      scale: 0.95,
      coatColor: '#a14611',
      x: -155,
      z: -108,
      homeX: -150,
      homeZ: -110,
      wanderRadius: 22,
      targetX: -155,
      targetZ: -108,
      rot: 2.1,
      targetRot: 2.1,
      state: 'looking',
      stateTimer: 4.5,
      walkSpeed: 1.0,
      walkPhase: 1.5
    },
    {
      id: 2,
      hasAntlers: false,
      scale: 0.82,
      coatColor: '#b45309',
      x: -138,
      z: -125,
      homeX: -140,
      homeZ: -120,
      wanderRadius: 20,
      targetX: -138,
      targetZ: -125,
      rot: -0.8,
      targetRot: -0.8,
      state: 'grazing',
      stateTimer: 9.0,
      walkSpeed: 0.9,
      walkPhase: 3.0
    },
    // Herd 2: Lakeside Forest Clearing (near western alpine lake)
    {
      id: 3,
      hasAntlers: true,
      scale: 1.0,
      coatColor: '#92400e',
      x: -250,
      z: -75,
      homeX: -250,
      homeZ: -75,
      wanderRadius: 20,
      targetX: -250,
      targetZ: -75,
      rot: 0.5,
      targetRot: 0.5,
      state: 'grazing',
      stateTimer: 7.5,
      walkSpeed: 1.05,
      walkPhase: 2.0
    },
    {
      id: 4,
      hasAntlers: false,
      scale: 0.9,
      coatColor: '#a14611',
      x: -258,
      z: -82,
      homeX: -250,
      homeZ: -75,
      wanderRadius: 18,
      targetX: -258,
      targetZ: -82,
      rot: -1.4,
      targetRot: -1.4,
      state: 'walking',
      stateTimer: 5.0,
      walkSpeed: 1.0,
      walkPhase: 0.5
    }
  ]);

  // Route for Energy Patrol Helicopter across the island
  const heliRoute = useMemo(() => {
    const points = [
      new THREE.Vector3(-850, 75, 800),     // Enters from south-east sea / harbor
      new THREE.Vector3(-420, 88, 420),     // Passes across outskirts & wind farm
      new THREE.Vector3(-60, 102, 80),      // Surveys central substation / power lines
      new THREE.Vector3(140, 115, -240),    // Follows the winding river valley
      new THREE.Vector3(380, 128, -620),    // Inspects alpine hydro lake / dam
      new THREE.Vector3(950, 105, -1180)    // Exits over north-west mountain peaks into horizon
    ];
    return new THREE.CatmullRomCurve3(points);
  }, []);

  // Materials
  const mats = useMemo(() => {
    return {
      balloonStripes1: new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.6 }),
      balloonStripes2: new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.6 }),
      wickerBasket: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 }),
      planeBody: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3, metalness: 0.4 }),
      planeTrim: new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.3 }),
      planeWing: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.35, metalness: 0.15 }),
      planeGlass: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1, metalness: 0.85 }),
      planeChrome: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.2, metalness: 0.75 }),
      planeEngineCore: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.6 }),
      contrailMat: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.32, depthWrite: false }),
      heliBody: new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.35, metalness: 0.25 }),
      heliDark: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 }),
      heliGlass: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.15, metalness: 0.8 }),
      heliRotor: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6 }),
      heliSkid: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.3, metalness: 0.7 }),
      heliBeacon: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
      heliSearchlight: new THREE.MeshBasicMaterial({ color: '#fef08a' }),
      deerCoat: new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.8 }),
      deerAntler: new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.7 }),
      navRed: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
      navGreen: new THREE.MeshBasicMaterial({ color: '#22c55e' }),
      strobeWhite: new THREE.MeshBasicMaterial({ color: '#ffffff' })
    };
  }, []);

  // Sky Animation Loop
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // Synchronized Aviation Lighting Pulses (ICAO double-flash strobes & rotating beacons)
    const strobeCycle = t % 1.4;
    const isStrobe = strobeCycle < 0.07 || (strobeCycle > 0.16 && strobeCycle < 0.23);
    mats.strobeWhite.color.set(isStrobe ? '#ffffff' : '#334155');

    const isBeacon = (t % 1.2) < 0.12;
    mats.heliBeacon.color.set(isBeacon ? '#ef4444' : '#450a0a');

    // 1 & 2. Daytime Sky: Hot Air Balloons, Airplane & Helicopter (Grounded/Inactive at Night)
    if (!isNight) {
      // Hot Air Balloon 1: Drifting over Western Alpine Lake Valley
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

      // 2. Twin-Engine Airplane: Periodic Flight across the Island Sky
      // Cycle: 90 seconds total, active for 34s, then leaves airspace for 56s
      const PLANE_CYCLE = 90;
      const PLANE_ACTIVE_TIME = 34;
      const planeCycleTime = t % PLANE_CYCLE;

      if (airplaneRef.current) {
        if (planeCycleTime < PLANE_ACTIVE_TIME) {
          airplaneRef.current.visible = true;
          const progress = planeCycleTime / PLANE_ACTIVE_TIME;
          const pX = -1800 + progress * 3600;
          const pZ = -1200 + progress * 2400 + Math.sin(progress * Math.PI) * 160;
          const pY = 255 + Math.sin(progress * Math.PI) * 45;

          const nextProg = Math.min(1.0, progress + 0.008);
          const nextX = -1800 + nextProg * 3600;
          const nextZ = -1200 + nextProg * 2400 + Math.sin(nextProg * Math.PI) * 160;
          const dx = nextX - pX;
          const dz = nextZ - pZ;
          const heading = Math.atan2(dx, dz);

          airplaneRef.current.position.set(pX, pY, pZ);
          airplaneRef.current.rotation.y = heading;
          airplaneRef.current.rotation.x = -Math.cos(progress * Math.PI) * 0.04;
          airplaneRef.current.rotation.z = -Math.cos(progress * Math.PI) * 0.08;

          if (propLRef.current) propLRef.current.rotation.z = t * 45;
          if (propRRef.current) propRRef.current.rotation.z = t * 45;
        } else {
          airplaneRef.current.visible = false;
        }
      }

      // 3. Grid Patrol Helicopter: Periodic Inspection Flight across Island
      // Cycle: 100 seconds total, offset by 42s so it alternates with airplane, active for 45s
      const HELI_CYCLE = 100;
      const HELI_OFFSET = 42;
      const HELI_ACTIVE_TIME = 45;
      const heliCycleTime = (t + HELI_OFFSET) % HELI_CYCLE;

      if (helicopterRef.current) {
        if (heliCycleTime < HELI_ACTIVE_TIME) {
          helicopterRef.current.visible = true;
          const u = heliCycleTime / HELI_ACTIVE_TIME;
          const pos = heliRoute.getPoint(u);
          const tangent = heliRoute.getTangent(u);

          // Ensure safe clearance above local terrain
          const groundY = getTerrainHeight(pos.x, pos.z);
          pos.y = Math.max(pos.y, groundY + 34);

          helicopterRef.current.position.copy(pos);
          const yaw = Math.atan2(tangent.x, tangent.z);
          helicopterRef.current.rotation.y = yaw;
          // Forward pitch when flying at speed
          helicopterRef.current.rotation.x = 0.12;
          // Roll / bank into curves
          helicopterRef.current.rotation.z = -tangent.x * 0.22;

          if (mainRotorRef.current) mainRotorRef.current.rotation.y = t * 48;
          if (tailRotorRef.current) tailRotorRef.current.rotation.x = t * 64;
        } else {
          helicopterRef.current.visible = false;
        }
      }

      // Flashing Aviation Beacon Strobes
      const strobeFlash = Math.floor(t * 3.5) % 2 === 0;
      mats.strobeWhite.color.set(strobeFlash ? '#ffffff' : '#222222');
      mats.heliBeacon.color.set(strobeFlash ? '#ef4444' : '#330505');
    } else {
      if (airplaneRef.current) airplaneRef.current.visible = false;
      if (helicopterRef.current) helicopterRef.current.visible = false;
    }

    // 4. Natural Wildlife: Deer Wandering, Grazing & Alert Behavior (Active Day & Night)
    if (deerGroupRef.current) {
      const dt = Math.min(delta, 0.05);

      deerSimState.current.forEach((d, idx) => {
        const deerObj = deerGroupRef.current.children[idx];
        if (!deerObj) return;

        d.stateTimer -= dt;

        // State Machine transitions
        if (d.stateTimer <= 0) {
          if (d.state === 'grazing') {
            // After grazing, 60% chance to wander to a fresh grass patch, 40% to look around alertly
            if (Math.random() < 0.6) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 6.0 + Math.random() * (d.wanderRadius - 6.0);
              d.targetX = d.homeX + Math.cos(angle) * dist;
              d.targetZ = d.homeZ + Math.sin(angle) * dist;
              d.targetRot = Math.atan2(d.targetX - d.x, d.targetZ - d.z);
              d.state = 'walking';
              d.stateTimer = 18.0; // max walk timeout
            } else {
              d.state = 'looking';
              d.stateTimer = 4.0 + Math.random() * 4.0;
            }
          } else if (d.state === 'looking') {
            // After looking around, either pick up and walk or return to peaceful grazing
            if (Math.random() < 0.65) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 6.0 + Math.random() * (d.wanderRadius - 6.0);
              d.targetX = d.homeX + Math.cos(angle) * dist;
              d.targetZ = d.homeZ + Math.sin(angle) * dist;
              d.targetRot = Math.atan2(d.targetX - d.x, d.targetZ - d.z);
              d.state = 'walking';
              d.stateTimer = 18.0;
            } else {
              d.state = 'grazing';
              d.stateTimer = 8.0 + Math.random() * 8.0;
            }
          } else if (d.state === 'walking') {
            // Reached destination or timeout: start grazing
            d.state = 'grazing';
            d.stateTimer = 8.0 + Math.random() * 10.0;
          }
        }

        // Handle walking movement toward destination
        if (d.state === 'walking') {
          const dx = d.targetX - d.x;
          const dz = d.targetZ - d.z;
          const dist = Math.hypot(dx, dz);

          if (dist < 0.8) {
            d.state = 'grazing';
            d.stateTimer = 8.0 + Math.random() * 10.0;
          } else {
            d.targetRot = Math.atan2(dx, dz);
            let rotDiff = d.targetRot - d.rot;
            rotDiff = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
            d.rot += rotDiff * Math.min(dt * 3.2, 1.0);

            const stepDist = Math.min(d.walkSpeed * dt, dist);
            d.x += Math.sin(d.rot) * stepDist;
            d.z += Math.cos(d.rot) * stepDist;
            d.walkPhase += dt * 6.5;
          }
        }

        // Apply position & rotation to 3D object
        const groundY = getTerrainHeight(d.x, d.z);
        deerObj.position.set(d.x, groundY, d.z);
        deerObj.rotation.y = d.rot;

        // Articulated Leg Animation
        const legLF = deerObj.getObjectByName('leg_lf');
        const legRF = deerObj.getObjectByName('leg_rf');
        const legLB = deerObj.getObjectByName('leg_lb');
        const legRB = deerObj.getObjectByName('leg_rb');
        const body = deerObj.getObjectByName('deer_body');

        if (d.state === 'walking') {
          const swing = Math.sin(d.walkPhase) * 0.42;
          if (legLF) legLF.rotation.x = swing;
          if (legRB) legRB.rotation.x = swing;
          if (legRF) legRF.rotation.x = -swing;
          if (legLB) legLB.rotation.x = -swing;
          if (body) body.position.y = 1.3 + Math.abs(Math.sin(d.walkPhase)) * 0.05;
        } else {
          // Standing still, legs relax vertically
          if (legLF) legLF.rotation.x *= 0.85;
          if (legRF) legRF.rotation.x *= 0.85;
          if (legLB) legLB.rotation.x *= 0.85;
          if (legRB) legRB.rotation.x *= 0.85;
          if (body) body.position.y = 1.3;
        }

        // Articulated Head & Neck Animation
        const neck = deerObj.getObjectByName('deer_neck');
        if (neck) {
          let targetPitch = 0.35;
          let targetYaw = 0;

          if (d.state === 'grazing') {
            // Head down eating grass, gentle chewing bob
            targetPitch = 0.95 + Math.sin(t * 2.8 + idx) * 0.08;
            targetYaw = Math.sin(t * 0.6 + idx) * 0.1;
          } else if (d.state === 'looking') {
            // Head high alertly, looking around
            targetPitch = -0.15 + Math.sin(t * 0.6 + idx) * 0.06;
            targetYaw = Math.sin(t * 1.2 + idx) * 0.45;
          } else if (d.state === 'walking') {
            // Neutral forward angle with subtle stride bob
            targetPitch = 0.35 + Math.sin(d.walkPhase) * 0.08;
            targetYaw = 0;
          }

          neck.rotation.x += (targetPitch - neck.rotation.x) * Math.min(dt * 4.5, 1.0);
          neck.rotation.y += (targetYaw - neck.rotation.y) * Math.min(dt * 4.5, 1.0);
        }
      });
    }
  });

  return (
    <group>
      {/* Daytime Sky: Hot Air Balloons & Commuter Airplane (Hidden at Night) */}
      {!isNight && (
        <>
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
          {/* 2. REGIONAL TWIN-TURBOFAN AIRLINER (Aerodynamic Jet)      */}
          {/* ========================================================= */}
          <group ref={airplaneRef} position={[0, 285, 1000]}>
            {/* 1. AERODYNAMIC FUSELAGE */}
            {/* Rounded Aerodynamic Nose Radome */}
            <mesh position={[0, -0.05, 10.2]} rotation={[Math.PI / 2, 0, 0]} material={mats.planeBody} castShadow>
              <sphereGeometry args={[0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            </mesh>

            {/* Forward Fuselage / Nose Taper */}
            <mesh position={[0, 0, 8.4]} rotation={[Math.PI / 2, 0, 0]} material={mats.planeBody} castShadow>
              <cylinderGeometry args={[1.28, 0.55, 3.6, 24]} />
            </mesh>

            {/* Sleek Curved Cockpit Windshield (Wrap-around glass) */}
            <mesh position={[0, 0.52, 8.2]} rotation={[-0.24, 0, 0]} material={mats.planeGlass}>
              <cylinderGeometry args={[1.3, 1.25, 1.3, 16, 1, false, Math.PI * 0.65, Math.PI * 0.7]} />
            </mesh>

            {/* Main Cylindrical Passenger Cabin */}
            <mesh position={[0, 0, 1.8]} rotation={[Math.PI / 2, 0, 0]} material={mats.planeBody} castShadow>
              <cylinderGeometry args={[1.28, 1.28, 10.2, 24]} />
            </mesh>

            {/* Airline Teal Accent Stripe along the Beltline */}
            <mesh position={[0, 0.05, 1.8]} rotation={[Math.PI / 2, 0, 0]} material={mats.planeTrim}>
              <cylinderGeometry args={[1.29, 1.29, 9.8, 24, 1, false, -Math.PI * 0.12, Math.PI * 0.24]} />
            </mesh>

            {/* Port & Starboard Cabin Passenger Windows (Dark oval strip) */}
            <mesh position={[-1.27, 0.28, 1.8]} material={mats.planeGlass}>
              <boxGeometry args={[0.06, 0.32, 7.8]} />
            </mesh>
            <mesh position={[1.27, 0.28, 1.8]} material={mats.planeGlass}>
              <boxGeometry args={[0.06, 0.32, 7.8]} />
            </mesh>

            {/* Aft Fuselage Taper (Graceful upward sweep toward tail - Zero Square Cutoff) */}
            <mesh position={[0, 0.22, -8.2]} rotation={[Math.PI / 2 - 0.045, 0, 0]} material={mats.planeBody} castShadow>
              <cylinderGeometry args={[1.28, 0.42, 10.2, 24]} />
            </mesh>

            {/* APU (Auxiliary Power Unit) Exhaust Cone & Nozzle at Tail Tip */}
            <mesh position={[0, 0.44, -13.4]} rotation={[Math.PI / 2, 0, 0]} material={mats.planeEngineCore}>
              <cylinderGeometry args={[0.22, 0.3, 0.6, 16]} />
            </mesh>
            <mesh position={[0, 0.44, -13.72]} rotation={[Math.PI / 2, 0, 0]} material={mats.planeGlass}>
              <circleGeometry args={[0.18, 12]} />
            </mesh>

            {/* Wing Center Wingbox & Belly Fairing */}
            <mesh position={[0, -0.45, 1.6]} material={mats.planeBody} castShadow>
              <boxGeometry args={[3.4, 0.65, 5.2]} />
            </mesh>

            {/* 2. SWEPT-BACK WINGS WITH UPWARD DIHEDRAL & WINGLETS */}
            {/* PORT (LEFT) SWEPT WING */}
            <group position={[-1.3, -0.22, 2.2]} rotation={[0.04, -0.34, 0.07]}>
              {/* Main Wing Body */}
              <mesh position={[-5.2, 0, -0.3]} material={mats.planeWing} castShadow>
                <boxGeometry args={[9.8, 0.18, 2.4]} />
              </mesh>
              {/* Chrome Leading Edge De-icing Slat */}
              <mesh position={[-5.2, 0, 0.95]} material={mats.planeChrome}>
                <boxGeometry args={[9.85, 0.19, 0.14]} />
              </mesh>
              {/* Inner Flap Extension */}
              <mesh position={[-2.4, -0.02, -1.8]} material={mats.planeWing}>
                <boxGeometry args={[4.2, 0.14, 0.9]} />
              </mesh>
              {/* Under-Wing Flap Track Fairings (Canoes) */}
              <mesh position={[-3.6, -0.2, -1.2]} material={mats.planeBody}>
                <boxGeometry args={[0.24, 0.3, 1.6]} />
              </mesh>
              <mesh position={[-6.8, -0.18, -1.0]} material={mats.planeBody}>
                <boxGeometry args={[0.2, 0.26, 1.4]} />
              </mesh>
              {/* Upswept Port Winglet / Sharklet */}
              <group position={[-10.1, 0.45, -0.3]} rotation={[0, 0, 0.85]}>
                <mesh material={mats.planeTrim}>
                  <boxGeometry args={[1.2, 0.08, 0.95]} />
                </mesh>
                {/* Port Red Navigation Light */}
                <mesh position={[0.6, 0.06, 0.35]}>
                  <sphereGeometry args={[0.15, 8, 8]} />
                  <primitive object={mats.navRed} />
                </mesh>
                {/* High-Intensity Wingtip Strobe */}
                <mesh position={[0.6, 0.06, -0.35]}>
                  <sphereGeometry args={[0.16, 8, 8]} />
                  <primitive object={mats.strobeWhite} />
                </mesh>
              </group>
            </group>

            {/* STARBOARD (RIGHT) SWEPT WING */}
            <group position={[1.3, -0.22, 2.2]} rotation={[-0.04, 0.34, -0.07]}>
              {/* Main Wing Body */}
              <mesh position={[5.2, 0, -0.3]} material={mats.planeWing} castShadow>
                <boxGeometry args={[9.8, 0.18, 2.4]} />
              </mesh>
              {/* Chrome Leading Edge De-icing Slat */}
              <mesh position={[5.2, 0, 0.95]} material={mats.planeChrome}>
                <boxGeometry args={[9.85, 0.19, 0.14]} />
              </mesh>
              {/* Inner Flap Extension */}
              <mesh position={[2.4, -0.02, -1.8]} material={mats.planeWing}>
                <boxGeometry args={[4.2, 0.14, 0.9]} />
              </mesh>
              {/* Under-Wing Flap Track Fairings */}
              <mesh position={[3.6, -0.2, -1.2]} material={mats.planeBody}>
                <boxGeometry args={[0.24, 0.3, 1.6]} />
              </mesh>
              <mesh position={[6.8, -0.18, -1.0]} material={mats.planeBody}>
                <boxGeometry args={[0.2, 0.26, 1.4]} />
              </mesh>
              {/* Upswept Starboard Winglet / Sharklet */}
              <group position={[10.1, 0.45, -0.3]} rotation={[0, 0, -0.85]}>
                <mesh material={mats.planeTrim}>
                  <boxGeometry args={[1.2, 0.08, 0.95]} />
                </mesh>
                {/* Starboard Green Navigation Light */}
                <mesh position={[-0.6, 0.06, 0.35]}>
                  <sphereGeometry args={[0.15, 8, 8]} />
                  <primitive object={mats.navGreen} />
                </mesh>
                {/* High-Intensity Wingtip Strobe */}
                <mesh position={[-0.6, 0.06, -0.35]}>
                  <sphereGeometry args={[0.16, 8, 8]} />
                  <primitive object={mats.strobeWhite} />
                </mesh>
              </group>
            </group>

            {/* 3. UNDER-WING HIGH-BYPASS TURBOFAN ENGINES */}
            {/* PORT (LEFT) JET ENGINE */}
            <group position={[-4.0, -0.82, 1.5]}>
              {/* Aerodynamic Mounting Pylon */}
              <mesh position={[0, 0.42, -0.3]} material={mats.planeWing}>
                <boxGeometry args={[0.16, 0.65, 2.2]} />
              </mesh>
              {/* Streamlined Engine Nacelle Cowl */}
              <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.planeBody} castShadow>
                <cylinderGeometry args={[0.82, 0.74, 3.6, 20]} />
              </mesh>
              {/* Polished Chrome Intake Lip */}
              <mesh position={[0, 0, 1.8]} material={mats.planeChrome}>
                <torusGeometry args={[0.76, 0.08, 12, 24]} />
              </mesh>
              {/* Spinning Turbofan Fan Blades */}
              <group ref={propLRef} position={[0, 0, 1.3]}>
                <mesh material={mats.planeEngineCore}>
                  <coneGeometry args={[0.24, 0.55, 12]} rotation={[Math.PI / 2, 0, 0]} />
                </mesh>
                {[0, 1, 2, 3, 4, 5].map((bIdx) => (
                  <mesh key={`fanL_${bIdx}`} rotation={[0, 0, (bIdx * Math.PI) / 3]} material={mats.planeEngineCore}>
                    <boxGeometry args={[1.4, 0.08, 0.02]} />
                  </mesh>
                ))}
              </group>
              {/* Titanium Exhaust Duct & Core Cone */}
              <mesh position={[0, 0, -1.8]} rotation={[Math.PI / 2, 0, 0]} material={mats.planeEngineCore}>
                <cylinderGeometry args={[0.62, 0.68, 0.7, 16]} />
              </mesh>
              <mesh position={[0, 0, -2.15]} rotation={[-Math.PI / 2, 0, 0]} material={mats.planeEngineCore}>
                <coneGeometry args={[0.26, 0.65, 12]} />
              </mesh>
              {/* Dynamic Atmospheric Vapor Contrail */}
              <mesh position={[0, 0, -26.0]} rotation={[Math.PI / 2, 0, 0]} material={mats.contrailMat}>
                <cylinderGeometry args={[0.35, 2.4, 48, 12, 1, true]} />
              </mesh>
            </group>

            {/* STARBOARD (RIGHT) JET ENGINE */}
            <group position={[4.0, -0.82, 1.5]}>
              {/* Aerodynamic Mounting Pylon */}
              <mesh position={[0, 0.42, -0.3]} material={mats.planeWing}>
                <boxGeometry args={[0.16, 0.65, 2.2]} />
              </mesh>
              {/* Streamlined Engine Nacelle Cowl */}
              <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.planeBody} castShadow>
                <cylinderGeometry args={[0.82, 0.74, 3.6, 20]} />
              </mesh>
              {/* Polished Chrome Intake Lip */}
              <mesh position={[0, 0, 1.8]} material={mats.planeChrome}>
                <torusGeometry args={[0.76, 0.08, 12, 24]} />
              </mesh>
              {/* Spinning Turbofan Fan Blades */}
              <group ref={propRRef} position={[0, 0, 1.3]}>
                <mesh material={mats.planeEngineCore}>
                  <coneGeometry args={[0.24, 0.55, 12]} rotation={[Math.PI / 2, 0, 0]} />
                </mesh>
                {[0, 1, 2, 3, 4, 5].map((bIdx) => (
                  <mesh key={`fanR_${bIdx}`} rotation={[0, 0, (bIdx * Math.PI) / 3]} material={mats.planeEngineCore}>
                    <boxGeometry args={[1.4, 0.08, 0.02]} />
                  </mesh>
                ))}
              </group>
              {/* Titanium Exhaust Duct & Core Cone */}
              <mesh position={[0, 0, -1.8]} rotation={[Math.PI / 2, 0, 0]} material={mats.planeEngineCore}>
                <cylinderGeometry args={[0.62, 0.68, 0.7, 16]} />
              </mesh>
              <mesh position={[0, 0, -2.15]} rotation={[-Math.PI / 2, 0, 0]} material={mats.planeEngineCore}>
                <coneGeometry args={[0.26, 0.65, 12]} />
              </mesh>
              {/* Dynamic Atmospheric Vapor Contrail */}
              <mesh position={[0, 0, -26.0]} rotation={[Math.PI / 2, 0, 0]} material={mats.contrailMat}>
                <cylinderGeometry args={[0.35, 2.4, 48, 12, 1, true]} />
              </mesh>
            </group>

            {/* 4. SWEPT EMPENNAGE (TAIL ASSEMBLY) */}
            {/* Swept Vertical Stabilizer (Tail Fin) */}
            <group position={[0, 1.1, -8.2]}>
              {/* Dorsal Fillet (Fairing leading into the tail) */}
              <mesh position={[0, 0.35, 2.0]} rotation={[-0.42, 0, 0]} material={mats.planeTrim}>
                <boxGeometry args={[0.16, 0.5, 3.2]} />
              </mesh>
              {/* Main Swept Vertical Fin */}
              <group position={[0, 1.9, -1.2]} rotation={[0.48, 0, 0]}>
                <mesh material={mats.planeTrim} castShadow>
                  <boxGeometry args={[0.18, 4.4, 2.2]} />
                </mesh>
                {/* Chrome Leading Edge */}
                <mesh position={[0, 0, 1.15]} material={mats.planeChrome}>
                  <boxGeometry args={[0.19, 4.42, 0.12]} />
                </mesh>
                {/* Top Tail Cap / Fairing */}
                <mesh position={[0, 2.25, -0.1]} material={mats.planeTrim}>
                  <cylinderGeometry args={[0.16, 0.16, 2.4, 12]} rotation={[Math.PI / 2, 0, 0]} />
                </mesh>
                {/* Flashing Tail Beacon */}
                <mesh position={[0, 2.45, -0.6]}>
                  <sphereGeometry args={[0.18, 8, 8]} />
                  <primitive object={mats.strobeWhite} />
                </mesh>
              </group>
            </group>

            {/* Swept Horizontal Stabilizers */}
            <group position={[0, 0.85, -10.8]}>
              {/* Port (Left) Horizontal Stabilizer */}
              <group rotation={[0.04, -0.42, 0.08]}>
                <mesh position={[-2.4, 0, -0.3]} material={mats.planeWing}>
                  <boxGeometry args={[4.4, 0.12, 1.5]} />
                </mesh>
                <mesh position={[-2.4, 0, 0.5]} material={mats.planeChrome}>
                  <boxGeometry args={[4.42, 0.13, 0.1]} />
                </mesh>
              </group>
              {/* Starboard (Right) Horizontal Stabilizer */}
              <group rotation={[-0.04, 0.42, -0.08]}>
                <mesh position={[2.4, 0, -0.3]} material={mats.planeWing}>
                  <boxGeometry args={[4.4, 0.12, 1.5]} />
                </mesh>
                <mesh position={[2.4, 0, 0.5]} material={mats.planeChrome}>
                  <boxGeometry args={[4.42, 0.13, 0.1]} />
                </mesh>
              </group>
            </group>

            {/* 5. FUSELAGE ANTI-COLLISION RED BEACONS */}
            {/* Top Roof Beacon */}
            <mesh position={[0, 1.34, 2.4]}>
              <sphereGeometry args={[0.16, 8, 8]} />
              <primitive object={mats.heliBeacon} />
            </mesh>
            {/* Bottom Belly Beacon */}
            <mesh position={[0, -1.34, 2.4]}>
              <sphereGeometry args={[0.16, 8, 8]} />
              <primitive object={mats.heliBeacon} />
            </mesh>
          </group>

          {/* ========================================================= */}
          {/* 3. ENERGY PATROL & GRID INSPECTION HELICOPTER             */}
          {/* ========================================================= */}
          <group ref={helicopterRef} position={[0, 95, 0]}>
            {/* Aerodynamic Teardrop Fuselage */}
            <mesh position={[0, 0, 0.4]} material={mats.heliBody} castShadow>
              <sphereGeometry args={[2.0, 16, 12]} />
            </mesh>
            <mesh position={[0, 0, 1.2]} material={mats.heliBody} castShadow>
              <coneGeometry args={[1.9, 2.6, 16]} rotation={[-Math.PI / 2, 0, 0]} />
            </mesh>

            {/* Bubble Cockpit Canopy */}
            <mesh position={[0, 0.25, 1.8]} material={mats.heliGlass}>
              <sphereGeometry args={[1.65, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} rotation={[0.4, 0, 0]} />
            </mesh>

            {/* Turbine Housing & Engine Deck */}
            <mesh position={[0, 1.45, -0.2]} material={mats.heliDark}>
              <boxGeometry args={[1.8, 0.9, 3.4]} />
            </mesh>
            <mesh position={[0, 1.5, -1.8]} material={mats.heliDark}>
              <cylinderGeometry args={[0.4, 0.5, 0.8, 10]} rotation={[Math.PI / 2, 0, 0]} />
            </mesh>

            {/* Tail Boom */}
            <mesh position={[0, 0.6, -5.2]} material={mats.heliBody}>
              <cylinderGeometry args={[0.32, 0.65, 7.8, 10]} rotation={[Math.PI / 2, 0, 0]} />
            </mesh>
            {/* Vertical Tail Fin */}
            <mesh position={[0, 1.8, -9.0]} material={mats.heliDark}>
              <boxGeometry args={[0.18, 2.8, 1.4]} />
            </mesh>
            {/* Horizontal Stabilizer */}
            <mesh position={[0, 1.3, -8.6]} material={mats.heliBody}>
              <boxGeometry args={[3.2, 0.14, 0.8]} />
            </mesh>

            {/* Tail Rotor */}
            <group ref={tailRotorRef} position={[0.22, 2.5, -9.2]}>
              <mesh material={mats.heliRotor}>
                <boxGeometry args={[0.08, 2.2, 0.16]} />
              </mesh>
              <mesh material={mats.heliDark}>
                <cylinderGeometry args={[0.16, 0.16, 0.2, 8]} rotation={[0, 0, Math.PI / 2]} />
              </mesh>
            </group>

            {/* Main Rotor Mast & 4 Carbon-Fiber Blades */}
            <group position={[0, 1.9, 0]}>
              <mesh position={[0, 0.3, 0]} material={mats.heliDark}>
                <cylinderGeometry args={[0.18, 0.18, 0.7, 10]} />
              </mesh>
              <group ref={mainRotorRef} position={[0, 0.65, 0]}>
                <mesh material={mats.heliDark}>
                  <cylinderGeometry args={[0.55, 0.55, 0.2, 12]} />
                </mesh>
                <mesh position={[0, 0, 0]} material={mats.heliRotor}>
                  <boxGeometry args={[14.0, 0.08, 0.6]} />
                </mesh>
                <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.heliRotor}>
                  <boxGeometry args={[14.0, 0.08, 0.6]} />
                </mesh>
                {/* High-Vis Orange Blade Tips */}
                {[-6.6, 6.6].map((bx, bxi) => (
                  <mesh key={`tip_${bxi}`} position={[bx, 0.01, 0]} material={mats.heliBody}>
                    <boxGeometry args={[0.6, 0.09, 0.62]} />
                  </mesh>
                ))}
              </group>
            </group>

            {/* Twin Landing Skids & Angled Struts */}
            {/* Left Skid */}
            <group position={[-1.25, -1.2, 0]}>
              <mesh material={mats.heliSkid}>
                <cylinderGeometry args={[0.09, 0.09, 6.2, 8]} rotation={[Math.PI / 2, 0, 0]} />
              </mesh>
              <mesh position={[0, 0.2, 3.0]} rotation={[-0.45, 0, 0]} material={mats.heliSkid}>
                <cylinderGeometry args={[0.09, 0.09, 0.8, 8]} />
              </mesh>
              <mesh position={[0.55, 0.55, 1.1]} rotation={[0, 0, -0.75]} material={mats.heliSkid}>
                <cylinderGeometry args={[0.07, 0.07, 1.4, 6]} />
              </mesh>
              <mesh position={[0.55, 0.55, -1.2]} rotation={[0, 0, -0.75]} material={mats.heliSkid}>
                <cylinderGeometry args={[0.07, 0.07, 1.4, 6]} />
              </mesh>
            </group>
            {/* Right Skid */}
            <group position={[1.25, -1.2, 0]}>
              <mesh material={mats.heliSkid}>
                <cylinderGeometry args={[0.09, 0.09, 6.2, 8]} rotation={[Math.PI / 2, 0, 0]} />
              </mesh>
              <mesh position={[0, 0.2, 3.0]} rotation={[-0.45, 0, 0]} material={mats.heliSkid}>
                <cylinderGeometry args={[0.09, 0.09, 0.8, 8]} />
              </mesh>
              <mesh position={[-0.55, 0.55, 1.1]} rotation={[0, 0, 0.75]} material={mats.heliSkid}>
                <cylinderGeometry args={[0.07, 0.07, 1.4, 6]} />
              </mesh>
              <mesh position={[-0.55, 0.55, -1.2]} rotation={[0, 0, 0.75]} material={mats.heliSkid}>
                <cylinderGeometry args={[0.07, 0.07, 1.4, 6]} />
              </mesh>
            </group>

            {/* Forward Inspection Turret / Sensor Pod */}
            <mesh position={[0, -0.75, 2.3]} material={mats.heliDark}>
              <sphereGeometry args={[0.42, 10, 10]} />
            </mesh>
            <mesh position={[0, -0.75, 2.65]} material={mats.heliSearchlight}>
              <cylinderGeometry args={[0.18, 0.25, 0.25, 10]} rotation={[Math.PI / 2, 0, 0]} />
            </mesh>

            {/* Anti-Collision Red Beacon */}
            <mesh position={[0, 3.25, -9.1]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <primitive object={mats.heliBeacon} />
            </mesh>
          </group>
        </>
      )}

      {/* ========================================================= */}
      {/* 4. LIVING ALPINE DEER HERDS (GRAZING & ROAMING)          */}
      {/* ========================================================= */}
      <group ref={deerGroupRef}>
        {deerSimState.current.map((d, i) => {
          const dy = getTerrainHeight(d.x, d.z);
          return (
            <group
              key={`deer_${i}`}
              position={[d.x, dy, d.z]}
              rotation={[0, d.rot, 0]}
              scale={[d.scale, d.scale, d.scale]}
            >
              {/* Deer Body */}
              <mesh name="deer_body" position={[0, 1.3, 0]} material={mats.deerCoat} castShadow>
                <boxGeometry args={[0.9, 0.85, 2.0]} />
              </mesh>

              {/* 4 Articulated Swinging Legs (Pivoting from hip/shoulder joints) */}
              <group name="leg_lf" position={[-0.32, 1.3, 0.7]}>
                <mesh position={[0, -0.65, 0]} material={mats.deerCoat}>
                  <cylinderGeometry args={[0.07, 0.05, 1.3, 6]} />
                </mesh>
              </group>
              <group name="leg_rf" position={[0.32, 1.3, 0.7]}>
                <mesh position={[0, -0.65, 0]} material={mats.deerCoat}>
                  <cylinderGeometry args={[0.07, 0.05, 1.3, 6]} />
                </mesh>
              </group>
              <group name="leg_lb" position={[-0.32, 1.3, -0.7]}>
                <mesh position={[0, -0.65, 0]} material={mats.deerCoat}>
                  <cylinderGeometry args={[0.07, 0.05, 1.3, 6]} />
                </mesh>
              </group>
              <group name="leg_rb" position={[0.32, 1.3, -0.7]}>
                <mesh position={[0, -0.65, 0]} material={mats.deerCoat}>
                  <cylinderGeometry args={[0.07, 0.05, 1.3, 6]} />
                </mesh>
              </group>

              {/* Articulated Neck & Head */}
              <group name="deer_neck" position={[0, 1.6, 0.9]}>
                <mesh position={[0, 0.35, 0.3]} rotation={[0.45, 0, 0]} material={mats.deerCoat}>
                  <cylinderGeometry args={[0.18, 0.28, 0.85, 8]} />
                </mesh>
                <mesh position={[0, 0.65, 0.6]} material={mats.deerCoat}>
                  <boxGeometry args={[0.42, 0.38, 0.75]} />
                </mesh>
                {/* Antlers for the Stag */}
                {d.hasAntlers && (
                  <group position={[0, 0.9, 0.5]}>
                    <mesh position={[-0.25, 0.35, 0]} rotation={[0, 0, -0.35]} material={mats.deerAntler}>
                      <cylinderGeometry args={[0.04, 0.05, 0.75, 5]} />
                    </mesh>
                    <mesh position={[0.25, 0.35, 0]} rotation={[0, 0, 0.35]} material={mats.deerAntler}>
                      <cylinderGeometry args={[0.04, 0.05, 0.75, 5]} />
                    </mesh>
                    {/* Secondary Antler Tines */}
                    <mesh position={[-0.32, 0.55, 0.08]} rotation={[0.3, 0, -0.6]} material={mats.deerAntler}>
                      <cylinderGeometry args={[0.03, 0.03, 0.35, 4]} />
                    </mesh>
                    <mesh position={[0.32, 0.55, 0.08]} rotation={[0.3, 0, 0.6]} material={mats.deerAntler}>
                      <cylinderGeometry args={[0.03, 0.03, 0.35, 4]} />
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

