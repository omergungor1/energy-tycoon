'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight, getMeshHeightAt } from './WorldCanvas';

/**
 * Open-Wilderness Autonomous Roaming Motocross Enduro Riders
 * 3 dynamic cross/enduro dirt bikes roam freely across the natural western mountain expanses,
 * ridges, screes, and alpine meadows without any fixed roads or preset paths.
 */

// Team configurations for the 3 distinct dirt bikes & riders
const RIDERS_CONFIG = [
  {
    id: 1,
    name: 'Lead Scout',
    number: '7',
    bikeColor: '#f97316',    // KTM Factory Orange
    accentColor: '#ffffff',
    jerseyColor: '#ea580c',
    helmetColor: '#f97316',
    initX: -250,
    initZ: -20,
    initHeading: 0.6
  },
  {
    id: 2,
    name: 'Wingman',
    number: '24',
    bikeColor: '#22c55e',    // Kawasaki Lime Green
    accentColor: '#0f172a',
    jerseyColor: '#16a34a',
    helmetColor: '#22c55e',
    initX: -370,
    initZ: -160,
    initHeading: -1.1
  },
  {
    id: 3,
    name: 'Sweep',
    number: '99',
    bikeColor: '#0284c7',    // Yamaha Racing Blue
    accentColor: '#ffffff',
    jerseyColor: '#0369a1',
    helmetColor: '#0284c7',
    initX: -490,
    initZ: -320,
    initHeading: 2.2
  }
];

// Validate that candidate position sits cleanly on dry open mountain land
function isValidRoamPoint(x, z) {
  // Western mountain sector bounds
  if (x < -720 || x > -110 || z < -560 || z > 220) return false;
  const h = getTerrainHeight(x, z);
  if (h < 3.2) return false; // Well above sea level
  // Stay clear of Alpine Lake
  if (Math.hypot(x - (-125), z - (-35)) < 46) return false;
  // Stay clear of HES Dam Canyon Gorge
  if (Math.hypot(x - (-280), z - (-145)) < 32) return false;
  return true;
}

// Select a random destination point in open natural wilderness
function pickRandomOpenTerrainTarget(currX, currZ, currHeading) {
  // First attempt forward-biased exploration arcs
  for (let attempt = 0; attempt < 8; attempt++) {
    const angleOffset = (Math.random() - 0.5) * 2.4;
    const candAngle = currHeading + angleOffset;
    const candDist = 55 + Math.random() * 85; // 55m to 140m ahead
    const tx = currX + Math.sin(candAngle) * candDist;
    const tz = currZ + Math.cos(candAngle) * candDist;
    if (isValidRoamPoint(tx, tz)) {
      return { x: tx, z: tz };
    }
  }
  // Fallback: pick any valid point in the open mountain area
  for (let attempt = 0; attempt < 16; attempt++) {
    const rx = -680 + Math.random() * 540;
    const rz = -520 + Math.random() * 700;
    if (isValidRoamPoint(rx, rz)) {
      return { x: rx, z: rz };
    }
  }
  return { x: -280, z: -80 };
}

/**
 * 3D Low-Poly Motocross / Enduro Dirt Bike & Rider
 */
function DirtBikeModel({ config, isNight = false, wheelRotation = 0, suspensionOffset = 0 }) {
  const { bikeColor, accentColor, jerseyColor, helmetColor } = config;

  return (
    <group position={[0, suspensionOffset, 0]}>
      {/* =========================================================================
          1. CHASSIS & FRAME
      ========================================================================= */}
      {/* Perimeter Double-Cradle Frame */}
      <mesh position={[0, 0.46, -0.05]} castShadow>
        <boxGeometry args={[0.26, 0.28, 0.72]} />
        <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.7} />
      </mesh>

      {/* 450cc 4-Stroke Thumper Engine Block */}
      <mesh position={[0, 0.36, 0.02]} castShadow>
        <boxGeometry args={[0.22, 0.26, 0.34]} />
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.8} />
      </mesh>
      {/* Engine Cylinder Cooling Fins */}
      <mesh position={[0, 0.44, 0.06]}>
        <cylinderGeometry args={[0.11, 0.12, 0.16, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.9} />
      </mesh>
      {/* Aluminum Skid Plate / Bash Guard */}
      <mesh position={[0, 0.22, 0.02]}>
        <boxGeometry args={[0.24, 0.04, 0.44]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Heavy-Duty Rear Swingarm */}
      <mesh position={[0, 0.36, -0.42]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[0.24, 0.06, 0.42]} />
        <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Rear Monoshock Progressive Spring (Red) */}
      <mesh position={[0, 0.46, -0.26]} rotation={[-0.32, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.22, 8]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Upswept Performance Exhaust Header & Silencer Pipe */}
      <group position={[0.14, 0.44, -0.12]}>
        {/* Header Curve */}
        <mesh position={[-0.01, -0.04, 0.16]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.24, 6]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* High-Mounted Oval Muffler / Silencer */}
        <mesh position={[0, 0.12, -0.32]} rotation={[-0.24, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.06, 0.38, 8]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Chrome Exhaust Tip */}
        <mesh position={[0, 0.16, -0.52]} rotation={[-0.24, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.06, 8]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.95} />
        </mesh>
      </group>

      {/* =========================================================================
          2. BODYWORK & PLASTICS (TEAM COLORS)
      ========================================================================= */}
      {/* Fuel Tank & Shrouds */}
      <mesh position={[0, 0.65, 0.12]} castShadow>
        <boxGeometry args={[0.26, 0.22, 0.40]} />
        <meshStandardMaterial color={bikeColor} roughness={0.35} metalness={0.2} />
      </mesh>
      {/* Radiator Shroud Decals / Side Panels */}
      <mesh position={[0.135, 0.62, 0.14]} rotation={[0, 0.12, 0]}>
        <boxGeometry args={[0.01, 0.16, 0.26]} />
        <meshStandardMaterial color={accentColor} roughness={0.3} />
      </mesh>
      <mesh position={[-0.135, 0.62, 0.14]} rotation={[0, -0.12, 0]}>
        <boxGeometry args={[0.01, 0.16, 0.26]} />
        <meshStandardMaterial color={accentColor} roughness={0.3} />
      </mesh>

      {/* Long Gripper Enduro Seat (Black Textured) */}
      <mesh position={[0, 0.74, -0.16]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.18, 0.08, 0.54]} />
        <meshStandardMaterial color="#18181b" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Front High Motocross Fender / Mudguard */}
      <mesh position={[0, 0.72, 0.62]} rotation={[-0.22, 0, 0]}>
        <boxGeometry args={[0.22, 0.03, 0.42]} />
        <meshStandardMaterial color={bikeColor} roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Rear High Tail Fender */}
      <mesh position={[0, 0.71, -0.52]} rotation={[0.24, 0, 0]}>
        <boxGeometry args={[0.20, 0.03, 0.36]} />
        <meshStandardMaterial color={bikeColor} roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Front Number Plate & Headlight Cowl */}
      <mesh position={[0, 0.88, 0.52]} rotation={[0.34, 0, 0]}>
        <boxGeometry args={[0.22, 0.22, 0.04]} />
        <meshStandardMaterial color={accentColor} roughness={0.3} />
      </mesh>

      {/* Front LED Enduro Headlight */}
      <mesh position={[0, 0.84, 0.54]} rotation={[0.34, 0, 0]}>
        <boxGeometry args={[0.12, 0.08, 0.03]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={isNight ? 2.5 : 0.4}
        />
      </mesh>
      {/* Dynamic Night Headlight Cone / Light Beam */}
      {isNight && (
        <group position={[0, 0.84, 0.60]}>
          <spotLight
            position={[0, 0, 0]}
            target-position={[0, -0.5, 16]}
            angle={0.45}
            penumbra={0.6}
            intensity={4.5}
            distance={28}
            color="#fffbeb"
          />
        </group>
      )}

      {/* Rear Compact Red LED Taillight */}
      <mesh position={[0, 0.75, -0.68]}>
        <boxGeometry args={[0.08, 0.04, 0.03]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={isNight ? 3.0 : 0.8}
        />
      </mesh>

      {/* =========================================================================
          3. FRONT SUSPENSION & CONTROLS
      ========================================================================= */}
      {/* Inverted Telescopic Forks (Gold Anodized Stanchions) */}
      <group position={[0, 0.62, 0.54]} rotation={[-0.38, 0, 0]}>
        <mesh position={[-0.09, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.58, 8]} />
          <meshStandardMaterial color="#eab308" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0.09, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.58, 8]} />
          <meshStandardMaterial color="#eab308" roughness={0.2} metalness={0.9} />
        </mesh>
      </group>

      {/* Handlebars with Crossbar, Grips & Handguards */}
      <group position={[0, 0.98, 0.42]}>
        {/* Main Handlebar Tube */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, 0.78, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Rubber Grips */}
        <mesh position={[-0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.12, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        <mesh position={[0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.12, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        {/* Wrap-around Enduro Handguards */}
        <mesh position={[-0.38, 0.02, 0.03]}>
          <boxGeometry args={[0.04, 0.07, 0.10]} />
          <meshStandardMaterial color={bikeColor} roughness={0.35} />
        </mesh>
        <mesh position={[0.38, 0.02, 0.03]}>
          <boxGeometry args={[0.04, 0.07, 0.10]} />
          <meshStandardMaterial color={bikeColor} roughness={0.35} />
        </mesh>
      </group>

      {/* Left & Right Footpegs */}
      <mesh position={[-0.20, 0.28, -0.06]}>
        <boxGeometry args={[0.10, 0.03, 0.06]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[0.20, 0.28, -0.06]}>
        <boxGeometry args={[0.10, 0.03, 0.06]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* =========================================================================
          4. WHEELS (SPINNING WITH KNOBBY TIRES)
      ========================================================================= */}
      {/* Front 21" Wheel */}
      <group position={[0, 0.38, 0.72]} rotation={[wheelRotation, 0, 0]}>
        {/* Knobby Black Dirt Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.10, 16]} />
          <meshStandardMaterial color="#171717" roughness={0.9} />
        </mesh>
        {/* Silver Spoke Hub */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.09, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.8} />
        </mesh>
      </group>

      {/* Rear 18" Wheel */}
      <group position={[0, 0.34, -0.68]} rotation={[wheelRotation, 0, 0]}>
        {/* Wider Knobby Black Dirt Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.14, 16]} />
          <meshStandardMaterial color="#171717" roughness={0.9} />
        </mesh>
        {/* Sprocket & Spoke Hub */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.13, 12]} />
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
        </mesh>
      </group>

      {/* =========================================================================
          5. MOTOCROSS RIDER CHARACTER (ATTACK POSTURE)
      ========================================================================= */}
      <group position={[0, 0.78, 0.05]}>
        {/* Rider Torso & Jersey (Leaning Forward) */}
        <mesh position={[0, 0.32, -0.04]} rotation={[0.32, 0, 0]} castShadow>
          <boxGeometry args={[0.34, 0.38, 0.22]} />
          <meshStandardMaterial color={jerseyColor} roughness={0.7} />
        </mesh>
        {/* White Race Number Stripe on Chest/Back */}
        <mesh position={[0, 0.34, -0.155]} rotation={[0.32, 0, 0]}>
          <boxGeometry args={[0.18, 0.18, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>

        {/* Full-Face Motocross Helmet */}
        <group position={[0, 0.60, 0.08]} rotation={[0.14, 0, 0]}>
          {/* Main Helmet Shell */}
          <mesh castShadow>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshStandardMaterial color={helmetColor} roughness={0.35} metalness={0.3} />
          </mesh>
          {/* Protruding Chin Bar */}
          <mesh position={[0, -0.06, 0.12]}>
            <boxGeometry args={[0.14, 0.10, 0.14]} />
            <meshStandardMaterial color={helmetColor} roughness={0.35} />
          </mesh>
          {/* Extended Motocross Sun Peak / Visor */}
          <mesh position={[0, 0.12, 0.14]} rotation={[0.35, 0, 0]}>
            <boxGeometry args={[0.18, 0.02, 0.18]} />
            <meshStandardMaterial color={bikeColor} roughness={0.35} />
          </mesh>
          {/* Tinted Off-Road Goggles */}
          <mesh position={[0, 0.03, 0.14]}>
            <boxGeometry args={[0.18, 0.07, 0.06]} />
            <meshStandardMaterial color="#0ea5e9" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Goggle Strap Around Helmet */}
          <mesh position={[0, 0.03, -0.02]}>
            <boxGeometry args={[0.33, 0.04, 0.30]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>

        {/* Arms Reaching to Handlebars */}
        {/* Left Arm */}
        <mesh position={[-0.24, 0.24, 0.15]} rotation={[-0.45, 0.25, 0.4]}>
          <cylinderGeometry args={[0.045, 0.045, 0.34, 6]} />
          <meshStandardMaterial color={jerseyColor} roughness={0.7} />
        </mesh>
        {/* Left Glove on Grip */}
        <mesh position={[-0.34, 0.18, 0.35]}>
          <boxGeometry args={[0.07, 0.07, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* Right Arm */}
        <mesh position={[0.24, 0.24, 0.15]} rotation={[-0.45, -0.25, -0.4]}>
          <cylinderGeometry args={[0.045, 0.045, 0.34, 6]} />
          <meshStandardMaterial color={jerseyColor} roughness={0.7} />
        </mesh>
        {/* Right Glove on Grip */}
        <mesh position={[0.34, 0.18, 0.35]}>
          <boxGeometry args={[0.07, 0.07, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* Legs / Enduro Riding Pants (Hugging Bike Tank) */}
        {/* Left Thigh & Lower Leg */}
        <mesh position={[-0.18, 0.04, -0.04]} rotation={[0.55, 0, -0.2]}>
          <cylinderGeometry args={[0.06, 0.05, 0.32, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <mesh position={[-0.19, -0.22, -0.06]} rotation={[-0.25, 0, -0.1]}>
          <cylinderGeometry args={[0.05, 0.05, 0.30, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Left Heavy Motocross Boot on Peg */}
        <mesh position={[-0.19, -0.42, -0.04]}>
          <boxGeometry args={[0.09, 0.12, 0.16]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} metalness={0.2} />
        </mesh>

        {/* Right Thigh & Lower Leg */}
        <mesh position={[0.18, 0.04, -0.04]} rotation={[0.55, 0, 0.2]}>
          <cylinderGeometry args={[0.06, 0.05, 0.32, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <mesh position={[0.19, -0.22, -0.06]} rotation={[-0.25, 0, 0.1]}>
          <cylinderGeometry args={[0.05, 0.05, 0.30, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Right Heavy Motocross Boot on Peg */}
        <mesh position={[0.19, -0.42, -0.04]}>
          <boxGeometry args={[0.09, 0.12, 0.16]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} metalness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Lightweight Dynamic Tire Dust Trail Puffs
 */
function TireDustPuffs({ positionsRef }) {
  const meshRefs = useRef([useRef(), useRef(), useRef()]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < 3; i++) {
      const mesh = meshRefs.current[i].current;
      const p = positionsRef.current[i];
      if (mesh && p) {
        mesh.position.set(p.x, p.y + 0.15, p.z);
        const pulse = 0.5 + 0.5 * Math.sin(t * 8 + i * 2.1);
        mesh.scale.setScalar(0.35 + pulse * 0.25);
      }
    }
  });

  return (
    <group>
      {[0, 1, 2].map((idx) => (
        <mesh key={idx} ref={meshRefs.current[idx]}>
          <sphereGeometry args={[0.35, 6, 4]} />
          <meshBasicMaterial color="#d4c3a3" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Main Autonomous Wilderness Motocross Roaming Component
 * ZERO roads or fixed singletrack ribbons. Completely free open-terrain riding.
 */
export default function MountainMotocrossTour({ isNight = false }) {
  const bikeGroupRefs = [useRef(), useRef(), useRef()];
  const dustPosRef = useRef([
    { x: 0, y: -999, z: 0 },
    { x: 0, y: -999, z: 0 },
    { x: 0, y: -999, z: 0 }
  ]);

  // Autonomous state for each of the 3 free-roaming dirt bikes
  const ridersState = useRef(
    RIDERS_CONFIG.map((cfg) => {
      const initTarget = pickRandomOpenTerrainTarget(cfg.initX, cfg.initZ, cfg.initHeading);
      return {
        x: cfg.initX,
        z: cfg.initZ,
        heading: cfg.initHeading,
        speed: 12.5 + Math.random() * 3.5,
        targetSpeed: 14.0,
        targetX: initTarget.x,
        targetZ: initTarget.z,
        targetTimer: 12.0 + Math.random() * 8.0,
        dwellTimer: 0,
        isDwelling: false,
        roll: 0,
        wheelRotation: 0
      };
    })
  );

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();

    RIDERS_CONFIG.forEach((cfg, idx) => {
      const grp = bikeGroupRefs[idx].current;
      if (!grp) return;

      const r = ridersState.current[idx];

      if (r.isDwelling) {
        r.dwellTimer -= dt;
        r.speed = 0;
        if (r.dwellTimer <= 0) {
          r.isDwelling = false;
          r.speed = 4.0; // Acceleration rev
          const nextT = pickRandomOpenTerrainTarget(r.x, r.z, r.heading);
          r.targetX = nextT.x;
          r.targetZ = nextT.z;
          r.targetTimer = 14.0 + Math.random() * 8.0;
          r.targetSpeed = 12.0 + Math.random() * 5.0;
        }
      } else {
        // Distance to current open terrain waypoint
        const distToTarget = Math.hypot(r.targetX - r.x, r.targetZ - r.z);
        r.targetTimer -= dt;

        // Reach target or target timer expired
        if (distToTarget < 14.0 || r.targetTimer <= 0) {
          // 14% chance to pause for scenic view
          if (Math.random() < 0.14 && r.targetTimer <= 0) {
            r.isDwelling = true;
            r.dwellTimer = 4.0 + Math.random() * 3.5;
          } else {
            const nextT = pickRandomOpenTerrainTarget(r.x, r.z, r.heading);
            r.targetX = nextT.x;
            r.targetZ = nextT.z;
            r.targetTimer = 14.0 + Math.random() * 10.0;
            r.targetSpeed = 12.0 + Math.random() * 5.5; // ~12 - 17.5 m/s (~45 - 63 km/h)
          }
        }

        // Steer towards target point
        const desiredHeading = Math.atan2(r.targetX - r.x, r.targetZ - r.z);
        let headingDiff = desiredHeading - r.heading;
        while (headingDiff > Math.PI) headingDiff -= 2 * Math.PI;
        while (headingDiff < -Math.PI) headingDiff += 2 * Math.PI;

        // Smooth steering rate
        const maxTurn = 2.4 * dt;
        const turn = THREE.MathUtils.clamp(headingDiff, -maxTurn, maxTurn);
        r.heading += turn;

        // Lean into corners (Roll banking)
        const targetRoll = THREE.MathUtils.clamp(-headingDiff * 6.0, -0.36, 0.36);
        r.roll = THREE.MathUtils.lerp(r.roll, targetRoll, 0.10);

        // Smooth speed acceleration
        r.speed = THREE.MathUtils.lerp(r.speed, r.targetSpeed, 0.04);

        // Advance forward across the open ground
        const nextX = r.x + Math.sin(r.heading) * r.speed * dt;
        const nextZ = r.z + Math.cos(r.heading) * r.speed * dt;

        if (isValidRoamPoint(nextX, nextZ)) {
          r.x = nextX;
          r.z = nextZ;
        } else {
          // Steer safely away from boundary / water
          r.heading += (Math.random() > 0.5 ? 1.9 : -1.9);
          const nextT = pickRandomOpenTerrainTarget(r.x, r.z, r.heading);
          r.targetX = nextT.x;
          r.targetZ = nextT.z;
          r.targetTimer = 10.0;
        }

        // Gentle separation between riders to prevent crowding
        for (let j = 0; j < 3; j++) {
          if (j === idx) continue;
          const other = ridersState.current[j];
          const sepDist = Math.hypot(r.x - other.x, r.z - other.z);
          if (sepDist < 12.0 && sepDist > 0.1) {
            const pushX = (r.x - other.x) / sepDist;
            const pushZ = (r.z - other.z) / sepDist;
            r.x += pushX * 2.8 * dt;
            r.z += pushZ * 2.8 * dt;
          }
        }

        // Spin knobby wheels
        r.wheelRotation -= (r.speed * dt / 0.36);
      }

      // Wheelbase sampling for slope pitch conforming
      const halfWheelbase = 0.70;
      const frontX = r.x + Math.sin(r.heading) * halfWheelbase;
      const frontZ = r.z + Math.cos(r.heading) * halfWheelbase;
      const rearX = r.x - Math.sin(r.heading) * halfWheelbase;
      const rearZ = r.z - Math.cos(r.heading) * halfWheelbase;

      const frontY = Math.max(getMeshHeightAt(frontX, frontZ), getTerrainHeight(frontX, frontZ));
      const rearY = Math.max(getMeshHeightAt(rearX, rearZ), getTerrainHeight(rearX, rearZ));
      const groundY = (frontY + rearY) * 0.5;

      const slopePitch = -Math.atan2(frontY - rearY, halfWheelbase * 2.0);
      const suspensionThump = !r.isDwelling && r.speed > 0.5 ? Math.sin(t * 26 + idx * 3) * 0.022 : 0;

      // Position bike and rider on the natural terrain
      grp.position.set(r.x, groundY + suspensionThump, r.z);
      grp.rotation.order = 'YXZ';
      grp.rotation.set(slopePitch, r.heading, r.roll);

      // Dust puffs behind rear tire
      if (!r.isDwelling && r.speed > 2.0) {
        dustPosRef.current[idx] = { x: rearX, y: rearY, z: rearZ };
      } else {
        dustPosRef.current[idx] = { x: 0, y: -999, z: 0 };
      }
    });
  });

  return (
    <group name="MountainMotocrossWilderness">
      {/* Three Motocross Bikes & Active Riders roaming freely across open wilderness */}
      {RIDERS_CONFIG.map((cfg, idx) => (
        <group key={cfg.id} ref={bikeGroupRefs[idx]}>
          <DirtBikeModel
            config={cfg}
            isNight={isNight}
            wheelRotation={ridersState.current[idx].wheelRotation}
            suspensionOffset={Math.sin(idx * 1.5) * 0.01}
          />
        </group>
      ))}

      {/* Trailing Knobby Tire Dust Puffs */}
      <TireDustPuffs positionsRef={dustPosRef} />
    </group>
  );
}
