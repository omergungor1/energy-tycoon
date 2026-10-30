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
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

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

    // 4. Deer Grazing / Head Bobbing in Forest Meadow (Active Day & Night)
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
      {/* 4. GRAZING ALPINE DEER / WILDLIFE                         */}
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

