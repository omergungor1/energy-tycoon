'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight } from './WorldCanvas';
import MaritimeFleet from './MaritimeFleet';

// =============================================================================
// REUSABLE LOW-POLY PARKED VEHICLE COMPONENT
// =============================================================================
function LowPolyParkedCar({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  type = 'sedan',
  color = '#1e3a8a'
}) {
  const isPickup = type === 'pickup';
  const isSUV = type === 'suv';
  const isHatch = type === 'hatchback';
  const isWagon = type === 'wagon';

  const bodyW = isSUV ? 2.2 : isPickup ? 2.2 : isHatch ? 1.85 : 2.0;
  const bodyH = isSUV ? 0.8 : isPickup ? 0.75 : 0.65;
  const bodyL = isSUV ? 4.6 : isPickup ? 4.9 : isHatch ? 3.8 : 4.4;

  const cabW = bodyW - 0.25;
  const cabH = isSUV ? 0.8 : 0.65;
  const cabL = isPickup ? 1.9 : isHatch ? 2.1 : isWagon ? 2.8 : 2.3;
  const cabZ = isPickup ? 0.55 : isWagon ? -0.35 : -0.2;

  return (
    <group position={position} rotation={rotation}>
      {/* Lower Car Chassis / Body */}
      <mesh position={[0, bodyH * 0.5 + 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[bodyW, bodyH, bodyL]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.25} />
      </mesh>

      {/* Glass Cabin / Windows */}
      <mesh position={[0, bodyH + cabH * 0.5 + 0.25, cabZ]} castShadow>
        <boxGeometry args={[cabW, cabH, cabL]} />
        <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.8} />
      </mesh>

      {/* Roof Panel */}
      <mesh position={[0, bodyH + cabH + 0.26, cabZ]}>
        <boxGeometry args={[cabW - 0.05, 0.04, cabL - 0.05]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.25} />
      </mesh>

      {/* Pickup Truck Open Cargo Bed */}
      {isPickup && (
        <group position={[0, 0.25 + bodyH * 0.5, -1.2]}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[cabW, 0.45, 2.0]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.55, 0.4]} castShadow>
            <boxGeometry args={[1.5, 0.45, 0.7]} />
            <meshStandardMaterial color="#b45309" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* Front & Rear Bumpers */}
      <mesh position={[0, 0.38, bodyL * 0.5 + 0.04]}>
        <boxGeometry args={[bodyW + 0.05, 0.26, 0.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.38, -bodyL * 0.5 - 0.04]}>
        <boxGeometry args={[bodyW + 0.05, 0.26, 0.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Headlights (Front +Z) */}
      {[-bodyW * 0.36, bodyW * 0.36].map((lx, i) => (
        <mesh key={`hl_${i}`} position={[lx, 0.55, bodyL * 0.5 + 0.06]}>
          <boxGeometry args={[0.35, 0.16, 0.06]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      ))}

      {/* Taillights (Rear -Z) */}
      {[-bodyW * 0.36, bodyW * 0.36].map((lx, i) => (
        <mesh key={`tl_${i}`} position={[lx, 0.55, -bodyL * 0.5 - 0.06]}>
          <boxGeometry args={[0.35, 0.16, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      ))}

      {/* 4 Wheels (Rubber Tires + Silver Hubcaps) */}
      {[-bodyW * 0.5 - 0.05, bodyW * 0.5 + 0.05].map((wx, wxi) =>
        [-bodyL * 0.28, bodyL * 0.28].map((wz, wzi) => (
          <group key={`w_${wxi}_${wzi}`} position={[wx, 0.34, wz]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.34, 0.34, 0.24, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
            <mesh position={[wxi === 0 ? -0.11 : 0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.04, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}

// =============================================================================
// REUSABLE ANIMATED SETTLEMENT PEDESTRIAN COMPONENT
// =============================================================================
function SettlementPedestrian({
  waypoints = [],
  speed = 1.2,
  shirtColor = '#1e3a8a',
  pantsColor = '#334155',
  hatType = 'none',
  hatColor = '#451a03',
  initialWp = 0
}) {
  const pRef = useRef();
  const legLRef = useRef();
  const legRRef = useRef();
  const armLRef = useRef();
  const armRRef = useRef();

  const simRef = useRef({
    wpIdx: initialWp,
    x: waypoints[initialWp]?.[0] || 0,
    z: waypoints[initialWp]?.[1] || 0,
    rot: 0,
    state: 'walking',
    idleTimer: 0,
    walkPhase: Math.random() * Math.PI * 2
  });

  useFrame((_, delta) => {
    if (!pRef.current || waypoints.length < 2) return;
    const dt = Math.min(delta, 0.05);
    const sim = simRef.current;

    if (sim.state === 'idle') {
      sim.idleTimer -= dt;
      if (legLRef.current) legLRef.current.rotation.x *= 0.82;
      if (legRRef.current) legRRef.current.rotation.x *= 0.82;
      if (armLRef.current) armLRef.current.rotation.x *= 0.82;
      if (armRRef.current) armRRef.current.rotation.x *= 0.82;

      if (sim.idleTimer <= 0) {
        sim.wpIdx = (sim.wpIdx + 1) % waypoints.length;
        sim.state = 'walking';
      }
    } else if (sim.state === 'walking') {
      const target = waypoints[sim.wpIdx];
      const dx = target[0] - sim.x;
      const dz = target[1] - sim.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.4) {
        sim.state = 'idle';
        sim.idleTimer = 3.5 + Math.random() * 4.5;
      } else {
        const targetRot = Math.atan2(dx, dz);
        let diff = targetRot - sim.rot;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        sim.rot += diff * Math.min(dt * 5.0, 1.0);

        const step = Math.min(speed * dt, dist);
        sim.x += Math.sin(sim.rot) * step;
        sim.z += Math.cos(sim.rot) * step;
        sim.walkPhase += dt * 7.5;

        const legSwing = Math.sin(sim.walkPhase) * 0.42;
        if (legLRef.current) legLRef.current.rotation.x = legSwing;
        if (legRRef.current) legRRef.current.rotation.x = -legSwing;
        if (armLRef.current) armLRef.current.rotation.x = -legSwing * 0.75;
        if (armRRef.current) armRRef.current.rotation.x = legSwing * 0.75;
      }

      pRef.current.position.x = sim.x;
      pRef.current.position.z = sim.z;
      pRef.current.rotation.y = sim.rot;
    }
  });

  return (
    <group ref={pRef} position={[simRef.current.x, 0, simRef.current.z]}>
      {/* Torso */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.38, 0.52, 0.22]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.7} />
      </mesh>
      {/* Hat or Hair */}
      {hatType === 'hardHat' && (
        <group position={[0, 1.38, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.15, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color={hatColor || '#facc15'} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.04]} rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.03, 12]} />
            <meshStandardMaterial color={hatColor || '#facc15'} roughness={0.3} />
          </mesh>
        </group>
      )}
      {hatType === 'cap' && (
        <mesh position={[0, 1.4, 0.03]}>
          <boxGeometry args={[0.26, 0.08, 0.32]} />
          <meshStandardMaterial color={hatColor || '#1e3a8a'} roughness={0.8} />
        </mesh>
      )}
      {hatType === 'beanie' && (
        <mesh position={[0, 1.42, 0]}>
          <sphereGeometry args={[0.14, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
          <meshStandardMaterial color={hatColor || '#991b1b'} roughness={0.9} />
        </mesh>
      )}
      {hatType === 'none' && (
        <mesh position={[0, 1.39, 0]}>
          <sphereGeometry args={[0.13, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hatColor || '#451a03'} roughness={0.8} />
        </mesh>
      )}
      {/* Legs (swinging from hips at y = 0.68) */}
      <group ref={legLRef} position={[-0.11, 0.68, 0]}>
        <mesh position={[0, -0.34, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.68, 8]} />
          <meshStandardMaterial color={pantsColor} roughness={0.85} />
        </mesh>
      </group>
      <group ref={legRRef} position={[0.11, 0.68, 0]}>
        <mesh position={[0, -0.34, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.68, 8]} />
          <meshStandardMaterial color={pantsColor} roughness={0.85} />
        </mesh>
      </group>
      {/* Arms (swinging from shoulders at y = 1.15) */}
      <group ref={armLRef} position={[-0.24, 1.15, 0]}>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.44, 8]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
      </group>
      <group ref={armRRef} position={[0.24, 1.15, 0]}>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.44, 8]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Procedural Living Settlements System:
 * 1. Pine Ridge Alpine Village (Mountain valley chalets & clock tower)
 * 2. Sunfire Coastal City (Modern downtown buildings, offices & avenues)
 * 3. Agri-Valley Farm (Red barn, grain silos, crop fields & tractor)
 * 4. Energy Tech Logistics Park (Industrial sheds, fuel tanks & container yard)
 * 5. Coastal Harbor & Lighthouse (Pier, docked ships & rotating lighthouse beam)
 */
export default function LivingSettlements({ isNight = false, season = 'summer' }) {
  const lighthouseBeamRef = useRef();
  const windowGlowRef = useRef();
  const smokeParticlesRef = useRef([]);

  // Animate night lights, lighthouse rotation and chimney smoke
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Rotating lighthouse searchlight beam
    if (lighthouseBeamRef.current) {
      lighthouseBeamRef.current.rotation.y = t * 0.85;
      lighthouseBeamRef.current.visible = isNight;
    }

    // Subtle breathing / flickering window lights at night
    if (windowGlowRef.current) {
      windowGlowRef.current.intensity = isNight ? 1.6 + Math.sin(t * 2.8) * 0.15 : 0;
    }
  });

  // Materials for living settlements
  const mats = useMemo(() => {
    return {
      woodChaletWall: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.8 }),
      chaletRoof: new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.7 }),
      stoneFoundation: new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.9 }),
      cityWallMat: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.55, metalness: 0.1 }),
      cityGlassMat: new THREE.MeshStandardMaterial({
        color: isNight ? '#0369a1' : '#38bdf8',
        emissive: isNight ? '#0284c7' : '#075985',
        emissiveIntensity: isNight ? 0.5 : 0.08,
        roughness: 0.15,
        metalness: 0.75,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2.0,
        polygonOffsetUnits: -4.0
      }),
      redBarnMat: new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.65 }),
      barnRoofMat: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 }),
      siloMat: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.35, metalness: 0.75 }),
      wheatFieldMat: new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.9 }),
      cropFieldMat: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.85 }),
      dockWoodMat: new THREE.MeshStandardMaterial({ color: '#332014', roughness: 0.85 }),
      shipHullMat: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 }),
      containerBlue: new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.5, metalness: 0.4 }),
      containerOrange: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.5, metalness: 0.4 }),
      containerGreen: new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.5, metalness: 0.4 }),
      industrialShed: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.6 }),
      windowLit: new THREE.MeshBasicMaterial({
        color: isNight ? '#fbbf24' : '#64748b',
        transparent: true,
        opacity: isNight ? 0.95 : 0.4
      }),
      streetLampGlow: new THREE.MeshBasicMaterial({
        color: isNight ? '#fef08a' : '#94a3b8'
      })
    };
  }, [isNight]);

  // Settlement Centers on Island Topography
  const PINE_RIDGE_POS = { x: -75, z: -175, y: getTerrainHeight(-75, -175) };
  const SUNFIRE_CITY_POS = { x: 380, z: 90, y: getTerrainHeight(380, 90) };
  const AGRI_FARM_POS = { x: -35, z: 230, y: getTerrainHeight(-35, 230) };
  const INDUSTRIAL_PARK_POS = { x: 85, z: -45, y: getTerrainHeight(85, -45) };
  const MARINA_HARBOR_POS = { x: 195, z: -570, y: getTerrainHeight(195, -570) };

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. PINE RIDGE ALPINE VILLAGE                              */}
      {/* ========================================================= */}
      <group position={[PINE_RIDGE_POS.x, PINE_RIDGE_POS.y, PINE_RIDGE_POS.z]}>
        {/* Village Center Cobblestone Plaza Solid Platform (Never clips or flickers) */}
        <mesh position={[0, 0.35, 0]} receiveShadow>
          <cylinderGeometry args={[26, 27, 0.7, 32]} />
          <meshStandardMaterial
            color="#475569"
            roughness={0.94}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>

        {/* Historic Alpine Church & Clock Tower */}
        <group position={[0, 0.7, -8]}>
          <mesh position={[0, 4.0, 0]} castShadow receiveShadow material={mats.stoneFoundation}>
            <boxGeometry args={[9, 8, 14]} />
          </mesh>
          {/* Steeple Tower */}
          <mesh position={[0, 11.5, 5.5]} castShadow material={mats.stoneFoundation}>
            <boxGeometry args={[4.2, 15, 4.2]} />
          </mesh>
          <mesh position={[0, 20.5, 5.5]} castShadow material={mats.chaletRoof}>
            <coneGeometry args={[3.2, 7.5, 4]} rotation={[0, Math.PI / 4, 0]} />
          </mesh>
          {/* Glowing Stained Glass Church Windows */}
          <mesh position={[0, 4.2, 7.05]} material={mats.windowLit}>
            <planeGeometry args={[1.6, 3.2]} />
          </mesh>
          <mesh position={[-4.55, 4.2, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.windowLit}>
            <planeGeometry args={[2.2, 3.2]} />
          </mesh>
          <mesh position={[4.55, 4.2, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.windowLit}>
            <planeGeometry args={[2.2, 3.2]} />
          </mesh>
        </group>

        {/* Alpine Chalet Houses with Pitched Roofs & Glowing Windows */}
        {[
          { x: -16, z: 6, rot: 0.3 },
          { x: 16, z: 6, rot: -0.25 },
          { x: -18, z: -14, rot: 0.8 },
          { x: 18, z: -14, rot: -0.6 },
          { x: -8, z: 18, rot: 0.1 },
          { x: 10, z: 18, rot: -0.15 }
        ].map((h, i) => (
          <group key={`chalet_${i}`} position={[h.x, 0.7, h.z]} rotation={[0, h.rot, 0]}>
            {/* House Body */}
            <mesh position={[0, 2.2, 0]} castShadow receiveShadow material={mats.woodChaletWall}>
              <boxGeometry args={[6.5, 4.4, 7.8]} />
            </mesh>
            {/* Pitched Chalet Roof */}
            <mesh position={[0, 5.4, 0]} rotation={[0, 0, 0]} castShadow material={mats.chaletRoof}>
              <coneGeometry args={[5.8, 2.6, 4]} rotation={[0, Math.PI / 4, 0]} />
            </mesh>
            {/* Stone Chimney */}
            <mesh position={[2.2, 6.2, 1.8]} castShadow material={mats.stoneFoundation}>
              <boxGeometry args={[0.9, 3.8, 0.9]} />
            </mesh>
            {/* Glowing Windows */}
            <mesh position={[0, 2.2, 3.95]} material={mats.windowLit}>
              <planeGeometry args={[1.5, 1.3]} />
            </mesh>
            <mesh position={[-3.3, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.windowLit}>
              <planeGeometry args={[1.5, 1.3]} />
            </mesh>
            <mesh position={[3.3, 2.2, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.windowLit}>
              <planeGeometry args={[1.5, 1.3]} />
            </mesh>
          </group>
        ))}

        {/* Village Streetlamps */}
        {[
          [-10, 0, -2],
          [10, 0, -2],
          [0, 0, 12],
          [-12, 0, 12],
          [12, 0, 12]
        ].map(([sx, sy, sz], si) => (
          <group key={`lamp_pr_${si}`} position={[sx, 0.7, sz]}>
            <mesh position={[0, 1.9, 0]} material={mats.stoneFoundation}>
              <cylinderGeometry args={[0.08, 0.12, 3.8, 6]} />
            </mesh>
            <mesh position={[0, 3.8, 0]} material={mats.streetLampGlow}>
              <sphereGeometry args={[0.26, 8, 8]} />
            </mesh>
          </group>
        ))}

        {/* Parked Village Vehicles */}
        <LowPolyParkedCar position={[-19, 0.7, 14]} rotation={[0, 0.3, 0]} type="wagon" color="#064e3b" />
        <LowPolyParkedCar position={[16, 0.7, 16]} rotation={[0, -0.2, 0]} type="suv" color="#cbd5e1" />

        {/* Animated Villagers Strolling around Plaza & Chalets */}
        <group position={[0, 0.7, 0]}>
          <SettlementPedestrian
            waypoints={[[0, 4], [-10, 8], [-14, 15], [-4, 12], [4, 8]]}
            speed={1.2}
            shirtColor="#b91c1c"
            pantsColor="#1e3a8a"
            hatType="beanie"
            hatColor="#7f1d1d"
            initialWp={0}
          />
          <SettlementPedestrian
            waypoints={[[-8, -2], [8, -2], [6, -12], [-6, -10]]}
            speed={1.1}
            shirtColor="#047857"
            pantsColor="#334155"
            hatType="cap"
            hatColor="#064e3b"
            initialWp={1}
          />
          <SettlementPedestrian
            waypoints={[[12, 6], [2, 0], [0, -6], [2, 0]]}
            speed={1.05}
            shirtColor="#475569"
            pantsColor="#1e293b"
            hatType="none"
            hatColor="#451a03"
            initialWp={2}
          />
        </group>
      </group>

      {/* ========================================================= */}
      {/* 2. SUNFIRE COASTAL CITY                                   */}
      {/* ========================================================= */}
      <group position={[SUNFIRE_CITY_POS.x, SUNFIRE_CITY_POS.y, SUNFIRE_CITY_POS.z]}>
        {/* City Asphalt Ground Grid Foundation Slabs (Solid 3D Plinth - Zero Z-Fighting) */}
        <mesh position={[0, 0.45, 0]} receiveShadow>
          <boxGeometry args={[92, 0.9, 80]} />
          <meshStandardMaterial
            color="#1e242d"
            roughness={0.92}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>

        {/* Raised Sidewalk Perimeter Pedestrian Curbs */}
        <mesh position={[0, 0.92, 0]} receiveShadow>
          <boxGeometry args={[86, 0.12, 74]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.85}
            polygonOffset
            polygonOffsetFactor={-3}
            polygonOffsetUnits={-3}
          />
        </mesh>

        {/* Multi-story Modern Commercial & Residential Towers */}
        {[
          { x: -26, z: -18, w: 14, h: 26, d: 12, rot: 0 },
          { x: -26, z: 14, w: 13, h: 20, d: 13, rot: 0 },
          { x: 0, z: -20, w: 18, h: 36, d: 14, rot: 0 }, // Landmark Highrise
          { x: 0, z: 16, w: 15, h: 22, d: 15, rot: 0 },
          { x: 26, z: -18, w: 14, h: 24, d: 13, rot: 0 },
          { x: 26, z: 14, w: 12, h: 18, d: 12, rot: 0 }
        ].map((b, bi) => (
          <group key={`city_b_${bi}`} position={[b.x, 0.98, b.z]} rotation={[0, b.rot, 0]}>
            {/* 1. Main Structural Tower Body */}
            <mesh position={[0, b.h * 0.5, 0]} castShadow receiveShadow material={mats.cityWallMat}>
              <boxGeometry args={[b.w, b.h, b.d]} />
            </mesh>

            {/* 2. Glass Curtain Façade Paneling (3D Inset - Zero Shadow Acne or Z-Fighting) */}
            {/* Front Window Façade (+Z) */}
            <mesh position={[0, b.h * 0.5, b.d * 0.5 + 0.05]} material={mats.cityGlassMat} castShadow={false} receiveShadow={false}>
              <boxGeometry args={[b.w * 0.86, b.h * 0.88, 0.08]} />
            </mesh>
            {/* Back Window Façade (-Z) */}
            <mesh position={[0, b.h * 0.5, -b.d * 0.5 - 0.05]} material={mats.cityGlassMat} castShadow={false} receiveShadow={false}>
              <boxGeometry args={[b.w * 0.86, b.h * 0.88, 0.08]} />
            </mesh>
            {/* East Window Façade (+X) */}
            <mesh position={[b.w * 0.5 + 0.05, b.h * 0.5, 0]} material={mats.cityGlassMat} castShadow={false} receiveShadow={false}>
              <boxGeometry args={[0.08, b.h * 0.88, b.d * 0.86]} />
            </mesh>
            {/* West Window Façade (-X) */}
            <mesh position={[-b.w * 0.5 - 0.05, b.h * 0.5, 0]} material={mats.cityGlassMat} castShadow={false} receiveShadow={false}>
              <boxGeometry args={[0.08, b.h * 0.88, b.d * 0.86]} />
            </mesh>

            {/* 3. Rooftop Mechanical Penthouse Core */}
            <mesh position={[0, b.h + 1.2, 0]} castShadow material={mats.industrialShed}>
              <boxGeometry args={[b.w * 0.5, 2.4, b.d * 0.5]} />
            </mesh>

            {/* 4. Roof Communications Mast & Antenna */}
            <mesh position={[b.w * 0.25, b.h + 3.8, b.d * 0.2]} material={mats.stoneFoundation}>
              <cylinderGeometry args={[0.08, 0.08, 4.0, 6]} />
            </mesh>
            {/* 5. Rooftop Aviation Safety Strobe */}
            <mesh position={[b.w * 0.25, b.h + 5.9, b.d * 0.2]}>
              <sphereGeometry args={[0.22, 6, 6]} />
              <meshBasicMaterial color={isNight ? '#ef4444' : '#64748b'} />
            </mesh>
          </group>
        ))}

        {/* City Avenues Street Lighting */}
        {[-36, -12, 12, 36].map((lx, li) => (
          <group key={`c_light_${li}`} position={[lx, 0.98, 0]}>
            <mesh position={[0, 3.2, 0]} material={mats.stoneFoundation}>
              <cylinderGeometry args={[0.1, 0.14, 6.4, 6]} />
            </mesh>
            <mesh position={[0, 6.4, 0]} material={mats.streetLampGlow}>
              <sphereGeometry args={[0.32, 8, 8]} />
            </mesh>
          </group>
        ))}

        {/* Curbside & Parking Stall Parked Vehicles */}
        <LowPolyParkedCar position={[13, 0.98, -8]} rotation={[0, 0, 0]} type="sedan" color="#1d4ed8" />
        <LowPolyParkedCar position={[-13, 0.98, -8]} rotation={[0, 0, 0]} type="hatchback" color="#f8fafc" />
        <LowPolyParkedCar position={[14, 0.98, 28]} rotation={[0, Math.PI / 2, 0]} type="sedan" color="#dc2626" />
        <LowPolyParkedCar position={[-36, 0.98, 28]} rotation={[0, 0, 0]} type="suv" color="#475569" />

        {/* Animated Citizens Strolling across Sidewalks & Avenues */}
        <group position={[0, 0.98, 0]}>
          <SettlementPedestrian
            waypoints={[[13, -26], [13, -4], [13, 20], [13, -4]]}
            speed={1.25}
            shirtColor="#0f172a"
            pantsColor="#1e293b"
            hatType="none"
            hatColor="#0f172a"
            initialWp={0}
          />
          <SettlementPedestrian
            waypoints={[[-13, 22], [-13, 2], [-13, -22], [-13, 2]]}
            speed={1.2}
            shirtColor="#b45309"
            pantsColor="#1e293b"
            hatType="none"
            hatColor="#78350f"
            initialWp={1}
          />
          <SettlementPedestrian
            waypoints={[[-6, 8], [6, 8], [6, -4], [-6, -4]]}
            speed={1.15}
            shirtColor="#0284c7"
            pantsColor="#334155"
            hatType="none"
            hatColor="#1e293b"
            initialWp={2}
          />
          <SettlementPedestrian
            waypoints={[[-24, -26], [0, -26], [24, -26], [0, -26]]}
            speed={1.1}
            shirtColor="#15803d"
            pantsColor="#1e293b"
            hatType="cap"
            hatColor="#0f172a"
            initialWp={3}
          />
        </group>
      </group>

      {/* ========================================================= */}
      {/* 3. AGRI-VALLEY FARM & CROP FIELDS                         */}
      {/* ========================================================= */}
      <group position={[AGRI_FARM_POS.x, AGRI_FARM_POS.y, AGRI_FARM_POS.z]}>
        {/* Large Traditional Red Barn */}
        <group position={[0, 0, 0]}>
          <mesh position={[0, 3.8, 0]} castShadow receiveShadow material={mats.redBarnMat}>
            <boxGeometry args={[14, 7.6, 18]} />
          </mesh>
          {/* Barn Gambrel Roof */}
          <mesh position={[0, 9.2, 0]} castShadow material={mats.barnRoofMat}>
            <cylinderGeometry args={[0, 10.2, 4.4, 4, 1, false, Math.PI / 4]} rotation={[0, Math.PI / 4, 0]} />
          </mesh>
          {/* Barn Door */}
          <mesh position={[0, 2.5, 9.05]} material={mats.stoneFoundation}>
            <boxGeometry args={[4.2, 5.0, 0.1]} />
          </mesh>
        </group>

        {/* Twin Silver Grain Silos */}
        <group position={[12, 0, -2]}>
          <mesh position={[0, 6.0, 0]} castShadow material={mats.siloMat}>
            <cylinderGeometry args={[2.8, 2.8, 12, 16]} />
          </mesh>
          <mesh position={[0, 13.0, 0]} castShadow material={mats.siloMat}>
            <coneGeometry args={[3.0, 2.4, 16]} />
          </mesh>
        </group>
        <group position={[12, 0, 6]}>
          <mesh position={[0, 5.0, 0]} castShadow material={mats.siloMat}>
            <cylinderGeometry args={[2.5, 2.5, 10, 16]} />
          </mesh>
          <mesh position={[0, 11.0, 0]} castShadow material={mats.siloMat}>
            <coneGeometry args={[2.7, 2.2, 16]} />
          </mesh>
        </group>

        {/* Farmhouse */}
        <group position={[-16, 0, 4]}>
          <mesh position={[0, 2.6, 0]} castShadow receiveShadow material={mats.cityWallMat}>
            <boxGeometry args={[8.5, 5.2, 8.5]} />
          </mesh>
          <mesh position={[0, 6.2, 0]} castShadow material={mats.chaletRoof}>
            <coneGeometry args={[6.6, 2.8, 4]} rotation={[0, Math.PI / 4, 0]} />
          </mesh>
          <mesh position={[0, 2.4, 4.3]} material={mats.windowLit}>
            <planeGeometry args={[1.6, 1.4]} />
          </mesh>
        </group>

        {/* Green & Yellow Farm Tractor */}
        <group position={[6, 0, 14]} rotation={[0, 0.4, 0]}>
          <mesh position={[0, 1.2, 0]} material={mats.cropFieldMat} castShadow>
            <boxGeometry args={[2.2, 1.6, 3.4]} />
          </mesh>
          <mesh position={[0, 2.2, -0.4]} material={mats.barnRoofMat}>
            <boxGeometry args={[1.8, 1.2, 1.6]} />
          </mesh>
          {/* Big Rear Wheels */}
          <mesh position={[-1.25, 0.9, -0.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.9, 0.9, 0.5, 12]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[1.25, 0.9, -0.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.9, 0.9, 0.5, 12]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>

        {/* Textured Agricultural Crop & Golden Wheat Fields (Solid 3D Raised Plots - Zero Z-Fighting) */}
        <group position={[0, 0.25, 38]}>
          {/* Golden Wheat Crop Field Plot */}
          <mesh position={[-18, 0, 0]} receiveShadow>
            <boxGeometry args={[32, 0.5, 28]} />
            <primitive object={mats.wheatFieldMat} />
          </mesh>
          {/* Lush Green Vegetable Crop Field Plot */}
          <mesh position={[18, 0, 0]} receiveShadow>
            <boxGeometry args={[32, 0.5, 28]} />
            <primitive object={mats.cropFieldMat} />
          </mesh>

          {/* Golden Hay Bales */}
          {[
            [-12, 0.6, -6],
            [-20, 0.6, 4],
            [-8, 0.6, 8],
            [14, 0.6, -4],
            [22, 0.6, 6]
          ].map(([hx, hy, hz], hi) => (
            <mesh key={`hay_${hi}`} position={[hx, hy + 0.25, hz]} castShadow>
              <cylinderGeometry args={[0.7, 0.7, 1.4, 12]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.9} />
            </mesh>
          ))}
        </group>

        {/* Parked Farm Pickup Truck */}
        <LowPolyParkedCar position={[-21, 0, 8]} rotation={[0, 0.25, 0]} type="pickup" color="#1e3a8a" />

        {/* Animated Farmers Walking between Barn, Silos & Tractor */}
        <group position={[0, 0, 0]}>
          <SettlementPedestrian
            waypoints={[[2, 6], [6, 12], [2, 16], [-2, 10]]}
            speed={1.15}
            shirtColor="#1e40af"
            pantsColor="#1e3a8a"
            hatType="cap"
            hatColor="#991b1b"
            initialWp={0}
          />
          <SettlementPedestrian
            waypoints={[[-12, 4], [-2, 2], [10, 2], [10, -4], [-2, 2]]}
            speed={1.1}
            shirtColor="#b45309"
            pantsColor="#334155"
            hatType="none"
            hatColor="#451a03"
            initialWp={1}
          />
        </group>
      </group>

      {/* ========================================================= */}
      {/* 4. ENERGY LOGISTICS & INDUSTRIAL PARK                    */}
      {/* ========================================================= */}
      <group position={[INDUSTRIAL_PARK_POS.x, INDUSTRIAL_PARK_POS.y, INDUSTRIAL_PARK_POS.z]}>
        {/* Reinforced Heavy-Duty Industrial Concrete Slab (Solid 3D Plinth - Zero Z-Fighting) */}
        <mesh position={[0, 0.45, 0]} receiveShadow>
          <boxGeometry args={[78, 0.9, 58]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.88}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>

        {/* Large Industrial Distribution Warehouses */}
        <group position={[-18, 0.9, -8]}>
          <mesh position={[0, 4.2, 0]} castShadow receiveShadow material={mats.industrialShed}>
            <boxGeometry args={[26, 8.4, 18]} />
          </mesh>
          {/* Sawtooth Industrial Roof */}
          <mesh position={[0, 9.4, 0]} material={mats.barnRoofMat}>
            <boxGeometry args={[26.4, 1.2, 18.4]} />
          </mesh>
          {/* Cargo Loading Bay Doors */}
          {[-8, 0, 8].map((dx, di) => (
            <mesh key={`bay_${di}`} position={[dx, 2.5, 9.05]} material={mats.stoneFoundation}>
              <boxGeometry args={[4.2, 5.0, 0.1]} />
            </mesh>
          ))}
        </group>

        {/* Spherical & Cylindrical Industrial Energy Fuel Tanks */}
        <group position={[18, 0.9, -10]}>
          <mesh position={[0, 5.2, 0]} castShadow material={mats.siloMat}>
            <sphereGeometry args={[4.8, 16, 16]} />
          </mesh>
          <mesh position={[10, 4.5, 0]} castShadow material={mats.siloMat}>
            <cylinderGeometry args={[3.4, 3.4, 9, 16]} />
          </mesh>
        </group>

        {/* Stacked ISO Shipping Containers (Logistics Depot) */}
        <group position={[12, 0.9, 14]}>
          {/* Row 1 */}
          <mesh position={[0, 1.3, 0]} castShadow material={mats.containerBlue}>
            <boxGeometry args={[6.2, 2.6, 2.6]} />
          </mesh>
          <mesh position={[6.6, 1.3, 0]} castShadow material={mats.containerOrange}>
            <boxGeometry args={[6.2, 2.6, 2.6]} />
          </mesh>
          <mesh position={[0, 3.9, 0]} castShadow material={mats.containerGreen}>
            <boxGeometry args={[6.2, 2.6, 2.6]} />
          </mesh>
          {/* Row 2 */}
          <mesh position={[3.2, 1.3, 3.8]} castShadow material={mats.containerOrange}>
            <boxGeometry args={[6.2, 2.6, 2.6]} />
          </mesh>
        </group>

        {/* High-Mast Industrial Security Floodlight Towers */}
        {[
          [-32, 0, -22],
          [32, 0, -22],
          [-32, 0, 22],
          [32, 0, 22]
        ].map(([fx, fy, fz], fi) => (
          <group key={`flood_${fi}`} position={[fx, 0.9, fz]}>
            <mesh position={[0, 7.5, 0]} material={mats.stoneFoundation}>
              <cylinderGeometry args={[0.14, 0.22, 15, 6]} />
            </mesh>
            <mesh position={[0, 15.2, 0]}>
              <boxGeometry args={[1.4, 0.8, 0.4]} />
              <meshBasicMaterial color={isNight ? '#fef08a' : '#64748b'} />
            </mesh>
          </group>
        ))}

        {/* Parked Logistics & Worker Vehicles */}
        <LowPolyParkedCar position={[18, 0.9, 12]} rotation={[0, Math.PI, 0]} type="pickup" color="#f8fafc" />
        <LowPolyParkedCar position={[24, 0.9, 12]} rotation={[0, Math.PI, 0]} type="hatchback" color="#334155" />

        {/* Animated Facility Engineers & Depot Workers */}
        <group position={[0, 0.9, 0]}>
          <SettlementPedestrian
            waypoints={[[-10, 12], [0, 12], [10, 12], [14, 4], [0, 12]]}
            speed={1.2}
            shirtColor="#ea580c"
            pantsColor="#1e3a8a"
            hatType="hardHat"
            hatColor="#facc15"
            initialWp={0}
          />
          <SettlementPedestrian
            waypoints={[[10, -12], [22, -12], [22, 2], [10, 2]]}
            speed={1.15}
            shirtColor="#eab308"
            pantsColor="#334155"
            hatType="hardHat"
            hatColor="#ffffff"
            initialWp={1}
          />
        </group>
      </group>

      {/* ========================================================= */}
      {/* 5. COASTAL MARINA & HARBOR PIER + CAPE LIGHTHOUSE         */}
      {/* ========================================================= */}
      <group position={[MARINA_HARBOR_POS.x, MARINA_HARBOR_POS.y, MARINA_HARBOR_POS.z]}>
        {/* Main Timber Harbor Pier extending from shoreline into ocean bay */}
        <group position={[15, -MARINA_HARBOR_POS.y + 0.8, -25]} rotation={[0, -0.32, 0]}>
          <mesh position={[0, 0, 0]} castShadow receiveShadow material={mats.dockWoodMat}>
            <boxGeometry args={[8.5, 0.8, 36]} />
          </mesh>
          {/* Wooden Mooring Pilings descending into ocean water */}
          {[-4, 4].map((px) =>
            [-14, -7, 0, 7, 14].map((pz, pzi) => (
              <mesh key={`piling_${px}_${pzi}`} position={[px, -3.2, pz]} material={mats.stoneFoundation}>
                <cylinderGeometry args={[0.32, 0.32, 6.4, 8]} />
              </mesh>
            ))
          )}
          {/* Iron Mooring Cleats / Bollards on Pier Edges */}
          {[-3.8, 3.8].map((bx, bxi) =>
            [-12, -4, 4, 12].map((bz, bzi) => (
              <mesh key={`bollard_${bxi}_${bzi}`} position={[bx, 0.55, bz]}>
                <cylinderGeometry args={[0.12, 0.16, 0.35, 8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
              </mesh>
            ))
          )}
          {/* Dock Lantern Posts with Night Amber Glow */}
          {[-3.8, 3.8].map((lx, lxi) =>
            [-10, 10].map((lz, lzi) => (
              <group key={`dlamp_${lxi}_${lzi}`} position={[lx, 0.4, lz]}>
                <mesh position={[0, 1.2, 0]}>
                  <cylinderGeometry args={[0.06, 0.08, 2.4, 8]} />
                  <meshStandardMaterial color="#334155" metalness={0.8} />
                </mesh>
                <mesh position={[0, 2.4, 0]}>
                  <sphereGeometry args={[0.18, 8, 8]} />
                  <meshBasicMaterial color={isNight ? '#fef08a' : '#64748b'} />
                </mesh>
              </group>
            ))
          )}
          {/* Stacked Wooden Fish Crates & Pallets on Pier */}
          <group position={[-2.4, 0.65, 8]}>
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[1.2, 0.5, 1.4]} />
              <meshStandardMaterial color="#b45309" roughness={0.85} />
            </mesh>
            <mesh position={[0.2, 0.65, 0.1]}>
              <boxGeometry args={[0.9, 0.4, 1.0]} />
              <meshStandardMaterial color="#78350f" roughness={0.85} />
            </mesh>
          </group>
        </group>

        {/* Scenic Rocky Promontory Cape with Historic Coastal Lighthouse */}
        <group position={[-20, getTerrainHeight(175, -565) - MARINA_HARBOR_POS.y, 5]}>
          {/* Octagonal Stone Foundation Terrace on Cape Rocks */}
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow material={mats.stoneFoundation}>
            <cylinderGeometry args={[5.2, 5.8, 1.2, 8]} />
          </mesh>

          {/* Rocky Outcrops around Lighthouse Base */}
          {[
            [-4.8, 0.4, 3.5, 2.2],
            [4.5, 0.4, 3.2, 1.8],
            [-3.8, 0.4, -4.2, 2.0],
            [4.2, 0.4, -3.8, 2.4]
          ].map(([rx, ry, rz, rs], ri) => (
            <mesh key={`rock_${ri}`} position={[rx, ry, rz]}>
              <dodecahedronGeometry args={[rs, 0]} />
              <meshStandardMaterial color="#475569" roughness={0.95} />
            </mesh>
          ))}

          {/* Whitewashed Lighthouse Keeper's Quarters / Cottage */}
          <group position={[-5.5, 0.6, -1.2]}>
            {/* Cottage Walls */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow material={mats.cityWallMat}>
              <boxGeometry args={[4.4, 3.0, 4.8]} />
            </mesh>
            {/* Pitch Slate Roof */}
            <mesh position={[0, 3.8, 0]} castShadow material={mats.barnRoofMat}>
              <coneGeometry args={[3.8, 2.0, 4]} rotation={[0, Math.PI / 4, 0]} />
            </mesh>
            {/* Stone Chimney */}
            <mesh position={[1.4, 4.2, 1.0]} castShadow material={mats.stoneFoundation}>
              <boxGeometry args={[0.65, 2.2, 0.65]} />
            </mesh>
            {/* Cozy Glowing Window at Night */}
            <mesh position={[0, 1.6, 2.42]} material={mats.windowLit}>
              <planeGeometry args={[1.2, 1.4]} />
            </mesh>
          </group>

          {/* Classic White & Red Striped Tapered Lighthouse Tower */}
          <group position={[0, 1.2, 0]}>
            {/* Lower White Base Cylinder */}
            <mesh position={[0, 4.0, 0]} castShadow material={mats.cityWallMat}>
              <cylinderGeometry args={[2.5, 3.8, 8, 16]} />
            </mesh>
            {/* Mid Bold Nautical Red Band */}
            <mesh position={[0, 10.5, 0]} castShadow material={mats.redBarnMat}>
              <cylinderGeometry args={[2.1, 2.5, 5, 16]} />
            </mesh>
            {/* Upper White Tower Section */}
            <mesh position={[0, 15.5, 0]} castShadow material={mats.cityWallMat}>
              <cylinderGeometry args={[1.8, 2.1, 5, 16]} />
            </mesh>
            {/* Top Red Band */}
            <mesh position={[0, 18.5, 0]} material={mats.redBarnMat}>
              <cylinderGeometry args={[1.65, 1.8, 1.5, 16]} />
            </mesh>

            {/* Observation Gallery & Balcony Catwalk */}
            <mesh position={[0, 19.6, 0]} material={mats.stoneFoundation}>
              <cylinderGeometry args={[2.7, 2.2, 0.7, 16]} />
            </mesh>
            {/* Metal Safety Railing */}
            <mesh position={[0, 20.25, 0]}>
              <cylinderGeometry args={[2.65, 2.65, 0.7, 16, 1, true]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>

            {/* Lantern Room Glass Housing */}
            <mesh position={[0, 21.0, 0]} material={mats.cityGlassMat}>
              <cylinderGeometry args={[1.9, 1.9, 2.2, 16]} />
            </mesh>

            {/* Domed Roof Cupola with Spire */}
            <mesh position={[0, 22.8, 0]} material={mats.barnRoofMat}>
              <coneGeometry args={[2.2, 1.6, 16]} />
            </mesh>
            <mesh position={[0, 24.0, 0]}>
              <cylinderGeometry args={[0.04, 0.08, 1.4, 6]} />
              <meshStandardMaterial color="#ca8a04" metalness={0.9} />
            </mesh>

            {/* Rotating High-Power Searchlight Beam Sweeping Ocean at Night */}
            <group ref={lighthouseBeamRef} position={[0, 21.0, 0]}>
              <mesh position={[0, 0, 45]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[14, 0.4, 90, 16, 1, true]} />
                <meshBasicMaterial
                  color="#fef08a"
                  transparent
                  opacity={0.35}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            </group>
          </group>
        </group>

        {/* Shore Quay Approach: Parked Vehicles & Signs */}
        <group position={[10, 0.2, 6]}>
          <LowPolyParkedCar position={[0, 0, 0]} rotation={[0, -Math.PI / 3, 0]} type="pickup" color="#0284c7" />
          <LowPolyParkedCar position={[5.5, 0, 2.5]} rotation={[0, -Math.PI / 4, 0]} type="suv" color="#ea580c" />
        </group>

        {/* Animated Marina Pedestrians (Dockmaster & Harbor Visitors) */}
        <group position={[0, 0, 0]}>
          {/* Dockmaster patrolling the timber pier */}
          <SettlementPedestrian
            waypoints={[[15, -15], [18, -35], [20, -38], [15, -15]]}
            speed={0.95}
            shirtColor="#1e3a8a"
            pantsColor="#f8fafc"
            hatType="cap"
            hatColor="#1e3a8a"
            initialWp={0}
          />
          {/* Visitor walking from car park to scenic lighthouse path */}
          <SettlementPedestrian
            waypoints={[[8, 4], [-4, 6], [-14, 5], [-4, 6]]}
            speed={1.05}
            shirtColor="#eab308"
            pantsColor="#334155"
            hatType="beanie"
            hatColor="#dc2626"
            initialWp={1}
          />
        </group>
      </group>

      {/* ========================================================= */}
      {/* 6. LIVELY OCEAN MARITIME FLEET                            */}
      {/* Container Ship, Tanker, Fishing Trawler, Fishermen & Yacht */}
      {/* ========================================================= */}
      <MaritimeFleet isNight={isNight} />
    </group>
  );
}

