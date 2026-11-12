'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';

// =============================================================================
// REUSABLE LOW-POLY WORKER FIGURE (STATIC FALLBACK)
// =============================================================================
function ConstructionWorker({ position = [0, 0, 0], rotation = [0, 0, 0], action = 'standing' }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Boots / Shoes */}
      <mesh position={[-0.11, 0.1, 0]}>
        <boxGeometry args={[0.14, 0.2, 0.24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      <mesh position={[0.11, 0.1, 0]}>
        <boxGeometry args={[0.14, 0.2, 0.24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Pants / Legs */}
      <mesh position={[-0.11, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
      </mesh>
      <mesh position={[0.11, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
      </mesh>

      {/* Torso & High-Vis Safety Vest */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.38, 0.52, 0.22]} />
        <meshStandardMaterial color="#ea580c" roughness={0.6} />
      </mesh>
      {/* Silver Reflective Strip on Vest */}
      <mesh position={[0, 0.95, 0.12]}>
        <boxGeometry args={[0.34, 0.08, 0.02]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.24, 0.92, action === 'signaling' ? 0.15 : 0]} rotation={[action === 'signaling' ? 0.8 : 0, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.45, 8]} />
        <meshStandardMaterial color="#ea580c" roughness={0.7} />
      </mesh>
      <mesh position={[0.24, 0.92, action === 'clipboard' ? 0.18 : 0]} rotation={[action === 'clipboard' ? 1.0 : 0, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.45, 8]} />
        <meshStandardMaterial color="#ea580c" roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.7} />
      </mesh>

      {/* Yellow Safety Hard Hat */}
      <mesh position={[0, 1.42, 0]}>
        <sphereGeometry args={[0.15, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Hard Hat Brim */}
      <mesh position={[0, 1.38, 0.04]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.03, 12]} />
        <meshStandardMaterial color="#facc15" roughness={0.3} />
      </mesh>
    </group>
  );
}

// =============================================================================
// REUSABLE ANIMATED ACTIVE CONSTRUCTION WORKER (PATROLLING & TASKS)
// =============================================================================
function ActiveConstructionWorker({
  waypoints = [],
  shirtColor = '#ea580c',
  pantsColor = '#1e3a8a',
  hatColor = '#facc15',
  role = 'worker', // 'foreman', 'signalman', 'technician', 'worker'
  initialWp = 0,
  baseY = 1.36
}) {
  const wp = waypoints[initialWp] || waypoints[0] || [0, 0];
  const posX = wp[0];
  const posZ = wp[1];

  return (
    <group position={[posX, baseY, posZ]}>
      {/* Boots */}
      <mesh position={[-0.11, 0.1, 0]}>
        <boxGeometry args={[0.14, 0.2, 0.24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      <mesh position={[0.11, 0.1, 0]}>
        <boxGeometry args={[0.14, 0.2, 0.24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.11, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.5, 6]} />
        <meshStandardMaterial color={pantsColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.11, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.5, 6]} />
        <meshStandardMaterial color={pantsColor} roughness={0.8} />
      </mesh>

      {/* Torso & High-Vis Safety Vest */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.38, 0.52, 0.22]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.95, 0.12]}>
        <boxGeometry args={[0.34, 0.08, 0.02]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.24, 0.93, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 0.45, 6]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.24, 0.93, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 0.45, 6]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.7} />
      </mesh>

      {/* Safety Hard Hat */}
      <mesh position={[0, 1.42, 0]}>
        <sphereGeometry args={[0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={hatColor} roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
}

// =============================================================================
// REUSABLE SAFETY FLOODLIGHT TOWER (FOR NIGHT ILLUMINATION)
// =============================================================================
export function SafetyFloodlightTower({ position = [0, 0, 0], isNight = false }) {
  return (
    <group position={position}>
      {/* Tripod Base */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.9, 0.8, 4]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>

      {/* Vertical Telescoping Mast */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 4.2, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
      </mesh>

      {/* Horizontal Light Bar */}
      <mesh position={[0, 4.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>

      {/* 2 Halogen Floodlight Enclosures with High-Efficiency Emissive Night Glow */}
      {[-0.45, 0.45].map((xOff, i) => (
        <group key={i} position={[xOff, 4.55, 0]} rotation={[0.45, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.34, 0.24, 0.2]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Glowing Lens (Zero-cost emissive, eliminates expensive dynamic point lights) */}
          <mesh position={[0, 0, 0.11]}>
            <planeGeometry args={[0.3, 0.2]} />
            <meshBasicMaterial color={isNight ? '#fef08a' : '#64748b'} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// =============================================================================
// REUSABLE SAFETY CONE
// =============================================================================
function SafetyCone({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Base Square */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.42, 0.06, 0.42]} />
        <meshStandardMaterial color="#c2410c" roughness={0.6} />
      </mesh>
      {/* Orange Cone */}
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.2, 0.75, 10]} />
        <meshStandardMaterial color="#ea580c" roughness={0.5} />
      </mesh>
      {/* White Reflective Band */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.22, 10]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.4} />
      </mesh>
    </group>
  );
}

// =============================================================================
// REUSABLE CONSTRUCTION SUPPORT VAN (SERVIS ARACI)
// =============================================================================
function ConstructionVan({ position = [0, 0, 0], rotation = [0, 0, 0], isNight = false }) {
  const vanBeaconRef = useRef();

  useFrame(({ clock }) => {
    if (vanBeaconRef.current) {
      if (!isNight) {
        const t = clock.getElapsedTime();
        vanBeaconRef.current.material.opacity = Math.sin(t * 8) > 0.2 ? 1.0 : 0.2;
      } else {
        vanBeaconRef.current.material.opacity = 0.08;
      }
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Yellow Box Van Body */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[2.3, 1.7, 5.2]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>

      {/* Driver Windshield */}
      <mesh position={[0, 1.45, 2.61]}>
        <boxGeometry args={[2.0, 0.8, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Front Hood Bumper */}
      <mesh position={[0, 0.65, 2.7]}>
        <boxGeometry args={[2.2, 0.5, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Roof Amber Hazard Beacon */}
      <mesh position={[0, 2.18, 1.2]} ref={vanBeaconRef}>
        <cylinderGeometry args={[0.14, 0.14, 0.16, 8]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={isNight ? 0.1 : 0.9} transparent />
      </mesh>

      {/* Wheels */}
      {[-1.2, 1.2].map((wx, xi) =>
        [-1.6, 1.6].map((wz, zi) => (
          <mesh key={`${xi}_${zi}`} position={[wx, 0.42, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.42, 0.42, 0.28, 12]} />
            <meshStandardMaterial color="#09090b" roughness={0.95} />
          </mesh>
        ))
      )}

      {/* Roof Tool Rack */}
      <mesh position={[0, 2.16, -0.6]}>
        <boxGeometry args={[1.6, 0.1, 2.4]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* Aluminum Ladder strapped on roof rack */}
      <mesh position={[0.4, 2.26, -0.6]}>
        <boxGeometry args={[0.35, 0.08, 2.6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
      </mesh>
    </group>
  );
}

// =============================================================================
// REUSABLE HEAVY-DUTY MOBILE TELESCOPIC CRANE (MOBİL VİNÇ)
// =============================================================================
function MobileTelescopicCrane({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  targetPos = [0, 50, 0], // Exact world point the crane is actively working on
  isNight = false
}) {
  const craneBeaconRef = useRef();
  const hookSwayRef = useRef();

  // Compute exact turntable slew angle, boom length, elevation angle, and vertical cable drop
  const { slewAngle, boomPitch, boomLen, cableLen } = useMemo(() => {
    const cx = position[0];
    const cy = position[1];
    const cz = position[2];
    const chassisHeading = rotation[1] || 0;

    // Chassis group to transform world target into chassis local space
    const chassis = new THREE.Group();
    chassis.position.set(cx, cy, cz);
    chassis.rotation.y = chassisHeading;

    const target = new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]);
    const turntablePos = new THREE.Vector3(0, 1.5, -1.8);
    const boomPivotPos = new THREE.Vector3(0, 0.9, 0);

    // Target in chassis coordinates
    const targetInChassis = chassis.worldToLocal(target.clone());
    const pivotInChassis = turntablePos.clone().add(boomPivotPos);
    const toTargetLocal = targetInChassis.clone().sub(pivotInChassis);

    // Slew angle around Y:
    // When turntable rotates by slew, its local +Z axis points directly at target!
    const slew = Math.atan2(toTargetLocal.x, toTargetLocal.z);

    // Elevation angle and boom length:
    const horizDist = Math.hypot(toTargetLocal.x, toTargetLocal.z);
    const tipClearance = 5.0; // vertical cable drop clearance above target
    const tipY = toTargetLocal.y + tipClearance;
    const boomLen = Math.hypot(horizDist, tipY);
    const elev = Math.atan2(tipY, horizDist); // elevation above horizontal (radians)

    // Boom pitch from vertical towards +Z:
    const boomPitch = Math.PI / 2 - elev;
    const cableLen = tipClearance;

    return { slewAngle: slew, boomPitch, boomLen, cableLen };
  }, [position, rotation, targetPos[0], targetPos[1], targetPos[2]]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (craneBeaconRef.current) {
      if (!isNight) {
        // Double flash amber hazard strobe
        const strobeCycle = t % 1.2;
        const isFlash = strobeCycle < 0.1 || (strobeCycle > 0.22 && strobeCycle < 0.32);
        craneBeaconRef.current.material.opacity = isFlash ? 1.0 : 0.2;
      } else {
        craneBeaconRef.current.material.opacity = 0.08;
      }
    }
    if (hookSwayRef.current) {
      // Subtle wind sway of suspended hook and load
      hookSwayRef.current.rotation.z = Math.sin(t * 1.6) * 0.025;
      hookSwayRef.current.rotation.x = Math.cos(t * 1.3) * 0.02;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* 1. Heavy Carrier Chassis (Yellow Heavy-Duty Frame) */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[3.2, 1.1, 12.5]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Front Driver Cab (Faces +Z) */}
      <mesh position={[0, 1.7, 4.8]} castShadow>
        <boxGeometry args={[2.8, 1.4, 2.6]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>
      {/* Front Windshield */}
      <mesh position={[0, 1.85, 6.05]}>
        <boxGeometry args={[2.6, 0.9, 0.15]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Cab Amber Safety Beacons */}
      {[-0.9, 0.9].map((xOff, i) => (
        <mesh key={i} position={[xOff, 2.45, 5.2]} ref={i === 0 ? craneBeaconRef : null}>
          <cylinderGeometry args={[0.12, 0.12, 0.16, 8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={isNight ? 0.1 : 0.9} transparent />
        </mesh>
      ))}

      {/* 5 Pairs of Heavy Rubber Wheels */}
      {[-4.2, -2.4, -0.6, 1.8, 3.8].map((zPos, i) => (
        <React.Fragment key={i}>
          <mesh position={[-1.65, 0.5, zPos]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.45, 14]} />
            <meshStandardMaterial color="#09090b" roughness={0.95} />
          </mesh>
          <mesh position={[1.65, 0.5, zPos]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.45, 14]} />
            <meshStandardMaterial color="#09090b" roughness={0.95} />
          </mesh>
        </React.Fragment>
      ))}

      {/* 4 Extended Hydraulic Outriggers (Denge Ayakları) */}
      {[
        [-2.8, -3.8, -0.78],
        [2.8, -3.8, 0.78],
        [-2.8, 2.8, -0.78],
        [2.8, 2.8, 0.78]
      ].map(([xOff, zOff, rotZ], i) => (
        <group key={i} position={[xOff, 0.4, zOff]}>
          {/* Horizontal Beam */}
          <mesh position={[xOff > 0 ? -0.8 : 0.8, 0.1, 0]}>
            <boxGeometry args={[1.8, 0.3, 0.4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          {/* Vertical Hydraulic Cylinder */}
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.5, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          {/* Heavy Steel Footpad planted firmly on ground */}
          <mesh position={[0, -0.38, 0]}>
            <boxGeometry args={[0.9, 0.1, 0.9]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 2. Slewing Superstructure & Crane Operator Cab (Slews dynamically towards target!) */}
      <group position={[0, 1.5, -1.8]} rotation={[0, slewAngle, 0]}>
        {/* Turntable Base Ring */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[1.5, 1.6, 0.3, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>

        {/* Heavy Steel Counterweight Slabs at Rear (-Z, balances boom) */}
        <mesh position={[0, 0.85, -2.2]} castShadow>
          <boxGeometry args={[3.2, 1.4, 2.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>

        {/* Crane Operator Cab (Offset Left, faces forward along boom towards +Z) */}
        <mesh position={[-1.1, 1.1, 0.6]}>
          <boxGeometry args={[1.2, 1.6, 2.2]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
        <mesh position={[-1.1, 1.25, 1.65]}>
          <boxGeometry args={[1.05, 1.2, 0.12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* 3. Telescopic Boom Pinned to Superstructure (Pitches from vertical +Y towards +Z directly over target) */}
        <group position={[0.5, 0.9, 0]} rotation={[boomPitch, 0, 0]}>
          {/* Base Boom Section */}
          <mesh position={[0, boomLen * 0.2, 0]} castShadow>
            <boxGeometry args={[1.4, boomLen * 0.4, 1.6]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.5} />
          </mesh>
          {/* Middle Telescopic Boom Section */}
          <mesh position={[0, boomLen * 0.52, 0]} castShadow>
            <boxGeometry args={[1.15, boomLen * 0.38, 1.35]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
          {/* Tip Boom Section */}
          <mesh position={[0, boomLen * 0.82, 0]} castShadow>
            <boxGeometry args={[0.95, boomLen * 0.34, 1.15]} />
            <meshStandardMaterial color="#facc15" roughness={0.4} />
          </mesh>

          {/* Boom Head & Pulley Sheaves */}
          <mesh position={[0, boomLen, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.7, 12]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>

          {/* Vertical Hoist Cable & Hook Assembly (Counter-rotated by -boomPitch to hang straight down with gravity!) */}
          <group position={[0, boomLen, 0]} rotation={[-boomPitch, 0, 0]}>
            {/* Hoist Cable Dropping Down Vertically */}
            <mesh position={[0, -cableLen / 2, 0]}>
              <cylinderGeometry args={[0.025, 0.025, cableLen, 6]} />
              <meshStandardMaterial color="#09090b" metalness={0.9} />
            </mesh>

            {/* Heavy Hook Block & Swivel Hook at the end of the cable */}
            <group position={[0, -cableLen, 0]} ref={hookSwayRef}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.6, 0.9, 0.5]} />
                <meshStandardMaterial color="#eab308" metalness={0.4} />
              </mesh>
              {/* Hook Loop */}
              <mesh position={[0, -0.65, 0]} rotation={[0, 0, Math.PI / 4]}>
                <torusGeometry args={[0.22, 0.06, 8, 14]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// =============================================================================
// REUSABLE FLATBED HEAVY CONSTRUCTION TRANSPORT TRUCK (AŞAMAYA GÖRE DEĞİŞEN YÜK)
// =============================================================================
function HeavyConstructionTransportTruck({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  phase = 1,
  cargoType = 'wind' // 'wind' | 'solar'
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* ---------------- TRACTOR CAB ---------------- */}
      <mesh position={[0, 1.4, 5.2]} castShadow>
        <boxGeometry args={[2.6, 2.2, 2.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 1.8, 6.55]}>
        <boxGeometry args={[2.4, 0.95, 0.15]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Front Bumper & Chrome Grill */}
      <mesh position={[0, 0.5, 6.6]}>
        <boxGeometry args={[2.5, 0.5, 0.2]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
      {/* Headlights */}
      {[-0.95, 0.95].map((hx, hi) => (
        <mesh key={hi} position={[hx, 0.5, 6.68]}>
          <boxGeometry args={[0.32, 0.18, 0.05]} />
          <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* Amber Beacon on Cab Roof */}
      <mesh position={[0, 2.58, 5.0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.16, 8]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
      </mesh>

      {/* ---------------- LOW-BED SEMI-TRAILER ---------------- */}
      <mesh position={[0, 0.65, -3.5]} castShadow>
        <boxGeometry args={[2.8, 0.45, 16.5]} />
        <meshStandardMaterial color="#ea580c" roughness={0.6} />
      </mesh>
      {/* Trailer Deck Surface (Tough non-slip wood/steel finish) */}
      <mesh position={[0, 0.88, -3.5]}>
        <boxGeometry args={[2.7, 0.02, 16.3]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
      {/* Reflective Conspicuity Tape along trailer sides */}
      {[-1.41, 1.41].map((sx, si) => (
        <mesh key={si} position={[sx, 0.65, -3.5]}>
          <boxGeometry args={[0.02, 0.08, 16.2]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      ))}

      {/* Double Heavy-Duty Wheels */}
      {[-10.2, -8.6, 4.0, 5.8].map((zPos, i) => (
        <React.Fragment key={i}>
          <mesh position={[-1.4, 0.45, zPos]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.42, 0.42, 0.35, 12]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
          <mesh position={[1.4, 0.45, zPos]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.42, 0.42, 0.35, 12]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Rear Taillights */}
      {[-1.1, 1.1].map((rx, ri) => (
        <mesh key={ri} position={[rx, 0.6, -11.78]}>
          <boxGeometry args={[0.3, 0.15, 0.05]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* ---------------- CARGO PER PHASE: WIND TURBINE ---------------- */}
      {cargoType === 'wind' && (
        <>
          {/* Phase 1: Foundation Anchor Cage Ring, Heavy Cable Spools & Gang Box */}
          {phase === 1 && (
            <group position={[0, 0.88, 0]}>
              {/* Spool 1: Large Underground Power Cable Reel */}
              <group position={[0, 1.15, -7.0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh position={[0, -0.68, 0]}>
                  <cylinderGeometry args={[1.15, 1.15, 0.12, 16]} />
                  <meshStandardMaterial color="#78350f" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.68, 0]}>
                  <cylinderGeometry args={[1.15, 1.15, 0.12, 16]} />
                  <meshStandardMaterial color="#78350f" roughness={0.8} />
                </mesh>
                <mesh>
                  <cylinderGeometry args={[0.96, 0.96, 1.25, 16]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.9} />
                </mesh>
                <mesh>
                  <cylinderGeometry args={[0.98, 0.98, 0.25, 16]} />
                  <meshStandardMaterial color="#dc2626" />
                </mesh>
                <mesh position={[0.9, 0, -0.9]} rotation={[0, 0, Math.PI / 2]}>
                  <boxGeometry args={[1.3, 0.2, 0.3]} />
                  <meshStandardMaterial color="#b45309" roughness={0.8} />
                </mesh>
              </group>

              {/* Spool 2: Medium High-Voltage Umbilical Cable Reel */}
              <group position={[0, 0.95, -3.6]} rotation={[0, 0, Math.PI / 2]}>
                <mesh position={[0, -0.58, 0]}>
                  <cylinderGeometry args={[0.92, 0.92, 0.1, 14]} />
                  <meshStandardMaterial color="#78350f" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.58, 0]}>
                  <cylinderGeometry args={[0.92, 0.92, 0.1, 14]} />
                  <meshStandardMaterial color="#78350f" roughness={0.8} />
                </mesh>
                <mesh>
                  <cylinderGeometry args={[0.76, 0.76, 1.08, 14]} />
                  <meshStandardMaterial color="#ea580c" roughness={0.8} />
                </mesh>
              </group>

              {/* Foundation Anchor Bolt Collar / Cage Ring */}
              <group position={[0, 0.18, 0.6]}>
                <mesh castShadow>
                  <cylinderGeometry args={[1.2, 1.2, 0.35, 20]} />
                  <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.7} />
                </mesh>
                <mesh position={[0, 0.05, 0]}>
                  <cylinderGeometry args={[0.85, 0.85, 0.3, 18]} />
                  <meshStandardMaterial color="#334155" roughness={0.6} />
                </mesh>
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
                  const rad = (deg * Math.PI) / 180;
                  return (
                    <mesh key={i} position={[Math.cos(rad) * 1.05, 0.45, Math.sin(rad) * 1.05]}>
                      <cylinderGeometry args={[0.035, 0.035, 0.65, 6]} />
                      <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
                    </mesh>
                  );
                })}
              </group>

              {/* Rigging Tool Chest / Hydraulic Jobsite Gang Box */}
              <group position={[0, 0.55, 3.2]}>
                <mesh castShadow>
                  <boxGeometry args={[1.8, 1.05, 1.2]} />
                  <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.5} />
                </mesh>
                <mesh position={[0, 0.54, 0]}>
                  <boxGeometry args={[1.85, 0.08, 1.25]} />
                  <meshStandardMaterial color="#ca8a04" metalness={0.6} />
                </mesh>
                {[-0.8, 0.8].map((lx, li) => (
                  <mesh key={li} position={[lx, 0.58, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.12, 6]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.9} />
                  </mesh>
                ))}
              </group>

              {/* Yellow Tie-Down Ratchet Straps */}
              {[-7.0, -3.6, 0.6].map((sz, si) => (
                <mesh key={si} position={[0, 1.2, sz]}>
                  <boxGeometry args={[2.55, 0.04, 0.12]} />
                  <meshStandardMaterial color="#facc15" roughness={0.5} />
                </mesh>
              ))}
            </group>
          )}

          {/* Phase 2: Massive Tubular Steel Tower Segment in Saddles */}
          {phase === 2 && (
            <group position={[0, 0.88, 0]}>
              {/* Heavy Contoured Transport Saddles */}
              {[-8.5, -2.5, 2.8].map((saddleZ, si) => (
                <group key={si} position={[0, 0.25, saddleZ]}>
                  <mesh castShadow>
                    <boxGeometry args={[2.5, 0.5, 0.7]} />
                    <meshStandardMaterial color="#ea580c" roughness={0.5} />
                  </mesh>
                  <mesh position={[-0.95, 0.45, 0]} rotation={[0, 0, 0.4]}>
                    <boxGeometry args={[0.3, 0.7, 0.65]} />
                    <meshStandardMaterial color="#c2410c" roughness={0.6} />
                  </mesh>
                  <mesh position={[0.95, 0.45, 0]} rotation={[0, 0, -0.4]}>
                    <boxGeometry args={[0.3, 0.7, 0.65]} />
                    <meshStandardMaterial color="#c2410c" roughness={0.6} />
                  </mesh>
                  <mesh position={[0, 0.32, 0]}>
                    <boxGeometry args={[1.7, 0.12, 0.6]} />
                    <meshStandardMaterial color="#09090b" roughness={0.95} />
                  </mesh>
                </group>
              ))}

              {/* Massive White Tubular Steel Tower Segment */}
              <group position={[0, 1.85, -2.8]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[1.35, 1.48, 13.5, 22]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.28} metalness={0.25} />
                </mesh>
                <mesh position={[0, 0, 6.75]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[1.56, 1.56, 0.4, 22]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0, -6.75]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[1.42, 1.42, 0.4, 22]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
                </mesh>
                {[-0.3, 0.3].map((lx, li) => (
                  <mesh key={li} position={[lx, -0.6, 6.4]}>
                    <boxGeometry args={[0.04, 0.04, 1.2]} />
                    <meshStandardMaterial color="#eab308" metalness={0.5} />
                  </mesh>
                ))}
              </group>

              {/* Ratchet Webbing Straps looped over tower */}
              {[-8.5, -2.5, 2.8].map((strapZ, si) => (
                <group key={si} position={[0, 3.25, strapZ]}>
                  <mesh>
                    <boxGeometry args={[2.9, 0.06, 0.16]} />
                    <meshStandardMaterial color="#eab308" roughness={0.4} />
                  </mesh>
                  <mesh position={[-1.46, -1.8, 0]}>
                    <boxGeometry args={[0.12, 0.3, 0.18]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
                  </mesh>
                  <mesh position={[1.46, -1.8, 0]}>
                    <boxGeometry args={[0.12, 0.3, 0.18]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
                  </mesh>
                </group>
              ))}

              {/* Rear Oversized Load Hazard Plate */}
              <mesh position={[0, 0.35, -11.8]}>
                <boxGeometry args={[2.4, 0.45, 0.06]} />
                <meshStandardMaterial color="#facc15" roughness={0.4} />
              </mesh>
            </group>
          )}

          {/* Phase 3: Aerodynamic Wind Turbine Blade */}
          {phase === 3 && (
            <group position={[0, 0.88, 0]}>
              {/* Forward Root Clamping Fixture */}
              <group position={[0, 0.45, 3.2]}>
                <mesh castShadow>
                  <boxGeometry args={[2.4, 0.85, 0.8]} />
                  <meshStandardMaterial color="#ea580c" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.82, 0.12, 8, 16]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
                </mesh>
              </group>

              {/* Mid-Span & Tip Support Cradles */}
              {[-3.5, -8.8].map((cz, ci) => (
                <group key={ci} position={[0, 0.3, cz]}>
                  <mesh castShadow>
                    <boxGeometry args={[2.2, 0.55, 0.5]} />
                    <meshStandardMaterial color="#ea580c" roughness={0.6} />
                  </mesh>
                  <mesh position={[0, 0.3, 0]}>
                    <boxGeometry args={[1.6, 0.1, 0.45]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.9} />
                  </mesh>
                </group>
              ))}

              {/* The Aerodynamic Blade */}
              <group position={[0, 1.25, -3.2]}>
                <mesh position={[0, 0, 6.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.78, 0.78, 1.6, 18]} />
                  <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
                </mesh>
                <mesh position={[0, 0, 7.55]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.84, 0.84, 0.2, 18]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>
                <mesh position={[0, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.26, 0.75, 15.0, 14]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.25} />
                </mesh>
                <mesh position={[0.25, 0, -1.0]}>
                  <boxGeometry args={[0.08, 0.65, 13.5]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.3} />
                </mesh>
                {[-7.2, -8.3, -9.4].map((sz, si) => (
                  <mesh key={si} position={[0, 0, sz]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.26 + (si * 0.02), 0.28 + (si * 0.02), 0.75, 12]} />
                    <meshStandardMaterial color="#dc2626" roughness={0.4} />
                  </mesh>
                ))}
                <mesh position={[0.35, -0.2, -10.5]} rotation={[0, 0.2, 0]}>
                  <boxGeometry args={[0.35, 0.35, 0.02]} />
                  <meshStandardMaterial color="#ef4444" roughness={0.5} />
                </mesh>
              </group>

              {/* Tie-Down Straps */}
              {[-3.5, 3.2].map((sz, si) => (
                <mesh key={si} position={[0, 1.85, sz]}>
                  <boxGeometry args={[2.4, 0.05, 0.14]} />
                  <meshStandardMaterial color="#eab308" />
                </mesh>
              ))}
            </group>
          )}

          {/* Phase 4: Disassembled Cradles, Pallets & Demobilization */}
          {phase === 4 && (
            <group position={[0, 0.88, 0]}>
              {/* Empty Steel Transport Cradles Folded Flat */}
              {[-7.5, 1.5].map((cz, ci) => (
                <group key={ci} position={[0, 0.15, cz]}>
                  <mesh castShadow>
                    <boxGeometry args={[2.5, 0.3, 0.6]} />
                    <meshStandardMaterial color="#ea580c" roughness={0.6} />
                  </mesh>
                  <mesh position={[0, 0.16, 0]}>
                    <boxGeometry args={[1.9, 0.05, 0.45]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.95} />
                  </mesh>
                </group>
              ))}

              {/* Stack of 4 Wooden Euro Shipping Pallets */}
              <group position={[0, 0.35, -3.2]}>
                {[0, 0.16, 0.32, 0.48].map((py, pi) => (
                  <group key={pi} position={[0, py, 0]}>
                    <mesh castShadow>
                      <boxGeometry args={[1.8, 0.04, 1.4]} />
                      <meshStandardMaterial color="#a16207" roughness={0.85} />
                    </mesh>
                    {[-0.7, 0, 0.7].map((bx, bi) => (
                      <mesh key={bi} position={[bx, -0.05, 0]}>
                        <boxGeometry args={[0.15, 0.07, 1.3]} />
                        <meshStandardMaterial color="#78350f" roughness={0.9} />
                      </mesh>
                    ))}
                  </group>
                ))}
              </group>

              {/* Heavy Rigging Spreader Beam & Wire Slings on Deck */}
              <group position={[0.65, 0.22, -3.2]}>
                <mesh castShadow>
                  <boxGeometry args={[0.3, 0.3, 4.2]} />
                  <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.6} />
                </mesh>
                {[-1.8, 1.8].map((lx, li) => (
                  <mesh key={li} position={[0, 0.2, lx]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.12, 6]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.9} />
                  </mesh>
                ))}
              </group>

              {/* Jobsite Tool Gang Box & Coiled Straps */}
              <group position={[0, 0.45, 3.5]}>
                <mesh castShadow>
                  <boxGeometry args={[1.6, 0.85, 1.1]} />
                  <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.5} />
                </mesh>
              </group>
              {[-0.6, 0, 0.6].map((sx, si) => (
                <mesh key={si} position={[sx, 0.12, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.2, 0.2, 0.14, 12]} />
                  <meshStandardMaterial color="#eab308" roughness={0.6} />
                </mesh>
              ))}
            </group>
          )}
        </>
      )}

      {/* ---------------- CARGO PER PHASE: SOLAR FARM ---------------- */}
      {cargoType === 'solar' && (
        <>
          {/* Phase 1: Steel Foundation Ground Piles & Trenching Cable Drum */}
          {phase === 1 && (
            <group position={[0, 0.88, 0]}>
              {[-0.6, 0.6].map((bx, bi) => (
                <group key={bi} position={[bx, 0.4, -4.0]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.85, 0.65, 8.5]} />
                    <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.8} />
                  </mesh>
                  {[-3.0, 0, 3.0].map((bz, bzi) => (
                    <mesh key={bzi} position={[0, 0, bz]}>
                      <boxGeometry args={[0.88, 0.68, 0.08]} />
                      <meshStandardMaterial color="#1e293b" metalness={0.9} />
                    </mesh>
                  ))}
                </group>
              ))}
              <group position={[0, 0.95, 2.2]} rotation={[0, 0, Math.PI / 2]}>
                <mesh position={[0, -0.6, 0]}>
                  <cylinderGeometry args={[0.9, 0.9, 0.1, 14]} />
                  <meshStandardMaterial color="#78350f" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.6, 0]}>
                  <cylinderGeometry args={[0.9, 0.9, 0.1, 14]} />
                  <meshStandardMaterial color="#78350f" roughness={0.8} />
                </mesh>
                <mesh>
                  <cylinderGeometry args={[0.75, 0.75, 1.1, 14]} />
                  <meshStandardMaterial color="#dc2626" roughness={0.7} />
                </mesh>
              </group>
            </group>
          )}

          {/* Phase 2: Galvanized Structural Mounting Racks & Torque Tubes */}
          {phase === 2 && (
            <group position={[0, 0.88, 0]}>
              <group position={[0, 0.55, -2.5]}>
                <mesh castShadow>
                  <boxGeometry args={[2.2, 0.95, 11.5]} />
                  <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.75} />
                </mesh>
                {[-4.0, 0, 4.0].map((sz, si) => (
                  <mesh key={si} position={[0, 0.5, sz]}>
                    <boxGeometry args={[2.3, 0.04, 0.15]} />
                    <meshStandardMaterial color="#eab308" />
                  </mesh>
                ))}
              </group>
              <group position={[0, 0.35, 4.2]}>
                {[-0.6, 0, 0.6].map((kx, ki) => (
                  <mesh key={ki} position={[kx, 0, 0]}>
                    <cylinderGeometry args={[0.24, 0.24, 0.6, 10]} />
                    <meshStandardMaterial color="#0284c7" metalness={0.5} />
                  </mesh>
                ))}
              </group>
            </group>
          )}

          {/* Phase 3: Palletized Photovoltaic (PV) Solar Module Crates */}
          {phase === 3 && (
            <group position={[0, 0.88, 0]}>
              {[-6.5, -1.5, 3.5].map((pz, pi) => (
                <group key={pi} position={[0, 0.8, pz]}>
                  <mesh position={[0, -0.68, 0]}>
                    <boxGeometry args={[2.2, 0.14, 2.0]} />
                    <meshStandardMaterial color="#a16207" roughness={0.85} />
                  </mesh>
                  <mesh castShadow>
                    <boxGeometry args={[2.1, 1.25, 1.9]} />
                    <meshStandardMaterial color="#0284c7" roughness={0.25} metalness={0.5} />
                  </mesh>
                  <mesh position={[0, 0.64, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[2.0, 1.8]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
                  </mesh>
                  <mesh position={[1.06, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[0.5, 0.3]} />
                    <meshBasicMaterial color="#facc15" />
                  </mesh>
                  <mesh position={[0, 0.66, 0]}>
                    <boxGeometry args={[2.15, 0.04, 0.14]} />
                    <meshStandardMaterial color="#f97316" />
                  </mesh>
                </group>
              ))}
            </group>
          )}

          {/* Phase 4: High-Voltage Grid Inverter Skid & Commissioning Tools */}
          {phase === 4 && (
            <group position={[0, 0.88, 0]}>
              <group position={[0, 0.95, -2.0]}>
                <mesh castShadow>
                  <boxGeometry args={[2.2, 1.75, 3.8]} />
                  <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.6} />
                </mesh>
                <mesh position={[1.12, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <planeGeometry args={[2.8, 1.1]} />
                  <meshStandardMaterial color="#334155" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.4, 1.92]}>
                  <boxGeometry args={[0.3, 0.3, 0.02]} />
                  <meshBasicMaterial color="#ef4444" />
                </mesh>
              </group>
              <group position={[0, 0.3, 3.0]}>
                <mesh>
                  <boxGeometry args={[1.8, 0.4, 1.4]} />
                  <meshStandardMaterial color="#a16207" roughness={0.85} />
                </mesh>
              </group>
            </group>
          )}
        </>
      )}
    </group>
  );
}

// Backwards-compatible alias for any legacy callers
function HeavyBladeTransportTruck(props) {
  return <HeavyConstructionTransportTruck {...props} phase={props.phase || 3} cargoType="wind" />;
}

// =============================================================================
// REUSABLE FLOATING CONSTRUCTION PROGRESS BADGE (HER AÇIDAN GÖRÜNÜR BILLBOARD)
// =============================================================================
function ConstructionProgressBadge({
  position = [0, 60, 0],
  progress = 0.5,
  remainingHours = 84,
  siteType = 'wind', // 'wind' or 'solar'
  onClick = null
}) {
  const remainingDays = Math.floor(remainingHours / 24);
  const remHoursInDay = remainingHours % 24;

  let timeString = '';
  if (remainingDays > 0) {
    timeString = `${remainingDays} Gün ${remHoursInDay} Saat`;
  } else {
    timeString = `${remainingHours} Saat`;
  }

  const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));

  // Phase text
  let phaseText = '';
  if (siteType === 'wind') {
    if (progress < 0.28) phaseText = 'Aşama 1/4: Temel & Ankraj';
    else if (progress < 0.58) phaseText = 'Aşama 2/4: Alt Kule Gövdesi';
    else if (progress < 0.88) phaseText = 'Aşama 3/4: Rotor & Kanat Kaldırma';
    else phaseText = 'Aşama 4/4: Test & Devreye Alma';
  } else {
    if (progress < 0.28) phaseText = 'Aşama 1/4: Zemin & Kazıklar';
    else if (progress < 0.58) phaseText = 'Aşama 2/4: Taşıyıcı Konstrüksiyon';
    else if (progress < 0.88) phaseText = 'Aşama 3/4: PV Panel & Kablolama';
    else phaseText = 'Aşama 4/4: İnverter & Şebeke';
  }

  // Progress bar width
  const totalBarWidth = 24.6;
  const fillWidth = Math.max(0.8, totalBarWidth * Math.min(1.0, Math.max(0.02, progress)));

  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      <group
        onClick={(e) => {
          if (onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
        onPointerOver={() => {
          if (onClick) document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          if (onClick) document.body.style.cursor = 'auto';
        }}
      >
        {/* Main Card Background */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[27.0, 7.8]} />
          <meshBasicMaterial color="#090d16" transparent opacity={0.88} depthTest={false} />
        </mesh>

        {/* Outer Glowing Amber Border Wireframe */}
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[27.3, 8.1]} />
          <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.5} depthTest={false} />
        </mesh>

        {/* Left Orange Safety Accent Stripe */}
        <mesh position={[-13.0, 0, 0.05]}>
          <planeGeometry args={[0.9, 7.6]} />
          <meshBasicMaterial color="#ea580c" depthTest={false} />
        </mesh>

        {/* Top Header Row */}
        <Text
          position={[-12.0, 2.4, 0.1]}
          fontSize={1.4}
          color="#f59e0b"
          anchorX="left"
          anchorY="middle"
          depthTest={false}
        >
          {siteType === 'wind' ? '🚧 RÜZGAR TÜRBİNİ KURULUMU' : '🚧 GÜNEŞ ENERJİSİ KURULUMU'}
        </Text>
        <Text
          position={[12.5, 2.4, 0.1]}
          fontSize={1.2}
          color="#94a3b8"
          anchorX="right"
          anchorY="middle"
          depthTest={false}
        >
          {phaseText}
        </Text>

        {/* Middle Row - Countdown Clock & Percentage */}
        <Text
          position={[-12.0, 0.6, 0.1]}
          fontSize={2.1}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          depthTest={false}
        >
          {`⏱️ Kalan Süre: ${timeString}`}
        </Text>
        <Text
          position={[12.5, 0.6, 0.1]}
          fontSize={2.2}
          color="#facc15"
          anchorX="right"
          anchorY="middle"
          depthTest={false}
        >
          {`%${percent}`}
        </Text>

        {/* Bottom Row - Progress Bar Track */}
        <mesh position={[0.3, -1.8, 0.05]}>
          <planeGeometry args={[totalBarWidth, 0.9]} />
          <meshBasicMaterial color="#1e293b" depthTest={false} />
        </mesh>

        {/* Progress Bar Active Fill */}
        <mesh position={[-12.0 + fillWidth / 2, -1.8, 0.08]}>
          <planeGeometry args={[fillWidth, 0.7]} />
          <meshBasicMaterial color="#f59e0b" depthTest={false} />
        </mesh>
      </group>
    </Billboard>
  );
}

// =============================================================================
// REUSABLE PHYSICAL IN-WORLD CONSTRUCTION SIGNBOARD (ŞANTİYE PROJE TABELASI)
// =============================================================================
function InWorldProjectSignboard({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  timeString = '',
  percent = 50,
  title = 'RÜZGAR TÜRBİNİ'
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* 2 Wooden / Steel Support Legs */}
      {[-1.5, 1.5].map((lx, li) => (
        <mesh key={li} position={[lx, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 2.5, 6]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>
      ))}

      {/* Main Board Plate (Safety Dark Board) */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <boxGeometry args={[3.8, 1.9, 0.1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} />
      </mesh>
      {/* Board Safety Amber Border Frame */}
      <mesh position={[0, 2.2, 0.06]}>
        <boxGeometry args={[3.9, 2.0, 0.03]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </mesh>

      {/* Text on Signboard */}
      <Text
        position={[0, 2.7, 0.09]}
        fontSize={0.24}
        color="#facc15"
        anchorX="center"
        anchorY="middle"
      >
        ŞANTİYE KURULUM SAHASI
      </Text>
      <Text
        position={[0, 2.35, 0.09]}
        fontSize={0.21}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>
      <Text
        position={[0, 1.95, 0.09]}
        fontSize={0.26}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        {`⏱️ ${timeString}`}
      </Text>
      <Text
        position={[0, 1.55, 0.09]}
        fontSize={0.24}
        color="#4ade80"
        anchorX="center"
        anchorY="middle"
      >
        {`İlerleme: %${percent}`}
      </Text>
    </group>
  );
}

// =============================================================================
// 1. WIND TURBINE UNDER-CONSTRUCTION 3D COMPONENT (1-WEEK DURATION)
// =============================================================================
export function WindTurbineConstructionSite({
  position = [0, 0, 0],
  siteBaseAngle = 270,
  progress = 0.5, // 0.0 to 1.0 (elapsedHours / 168)
  remainingHours = null,
  equipmentName = 'Rüzgar Türbini',
  isNight = false,
  onClick = null
}) {
  // Construction phases based on 1 game week (168h):
  // Phase 1 (0.00 - 0.28): Ground clearing, concrete pad poured & rebar bolts (Days 1-2)
  // Phase 2 (0.28 - 0.58): Lower tower erected, crane suspending upper tower segment (Days 3-4)
  // Phase 3 (0.58 - 0.88): Full tower & nacelle mounted, rotor actively suspended on crane hook (Days 5-6)
  // Phase 4 (0.88 - 1.00): Rotor mounted to nacelle, final testing & crane packing (Day 7)
  const isPhase1 = progress < 0.28;
  const isPhase2 = progress >= 0.28 && progress < 0.58;
  const isPhase3 = progress >= 0.58 && progress < 0.88;
  const isPhase4 = progress >= 0.88;

  const actualRemainingHours = remainingHours !== null 
    ? Math.max(0, remainingHours) 
    : Math.max(0, Math.round((1 - progress) * 168));

  const remainingDays = Math.floor(actualRemainingHours / 24);
  const remHoursInDay = actualRemainingHours % 24;
  const timeString = remainingDays > 0 
    ? `${remainingDays}g ${remHoursInDay}s kaldı` 
    : `${actualRemainingHours}s kaldı`;

  // Calculate exact position of the load being lifted by the crane
  const angleRad = (siteBaseAngle * Math.PI) / 180;
  const rotorHubX = 3.4 * Math.sin(angleRad);
  const rotorHubZ = 3.4 * Math.cos(angleRad);

  const craneTarget = useMemo(() => {
    if (isPhase2) return [0, 37.5, 0]; // Lower tower erected; crane holding suspended upper tower tube
    if (isPhase3) return [rotorHubX, 49.9, rotorHubZ]; // Full tower erected; crane actively lifting & holding the 3-blade rotor assembly right to the nacelle hub!
    if (isPhase4) return [rotorHubX, 49.9, rotorHubZ]; // Final commissioning
    return [0, 8.0, 0]; // Phase 1: Rebar / foundation lift
  }, [isPhase1, isPhase2, isPhase3, isPhase4, rotorHubX, rotorHubZ]);

  return (
    <group position={position} onClick={onClick}>
      {/* In-World Construction Site Project Signboard */}
      <InWorldProjectSignboard
        position={[6.5, 0.65, -4.0]}
        rotation={[0, -0.4, 0]}
        timeString={timeString}
        percent={Math.min(100, Math.max(0, Math.round(progress * 100)))}
        title={equipmentName}
      />
      {/* 1. Compact Engineered Foundation Civil Pad (Clean octagonal profile, prevents brown blob clumping) */}
      <mesh position={[0, 0.35, 0]} receiveShadow>
        <cylinderGeometry args={[6.2, 7.0, 0.7, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.92} />
      </mesh>
      {/* Compacted Fine Gravel Working Collar */}
      <mesh position={[0, 0.71, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.5, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.88} />
      </mesh>

      {/* 2. Reinforced Concrete Turbine Foundation Pad */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[4.4, 4.8, 0.9, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.88} />
      </mesh>

      {/* Circular Rebar / Anchor Flange Collar */}
      <mesh position={[0, 1.65, 0]}>
        <cylinderGeometry args={[2.2, 2.2, 0.22, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* 3. Safety Cones around the perimeter collar */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const cx = Math.cos(rad) * 6.0;
        const cz = Math.sin(rad) * 6.0;
        return <SafetyCone key={i} position={[cx, 0.71, cz]} />;
      })}

      {/* 4. Safety Floodlight Tower for Night Illumination (Zero-overhead emissive) */}
      <SafetyFloodlightTower position={[-5.8, 0.71, -4.5]} isNight={isNight} />

      {/* =====================================================================
          TURBINE STRUCTURE ACCORDING TO CONSTRUCTION PROGRESS
      ====================================================================== */}
      {/* Phase 1: Foundation Collar only with exposed anchor bolts */}
      {isPhase1 && (
        <group position={[0, 2.9, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[2.0, 2.15, 1.8, 16]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
          </mesh>
          {/* Exposed Rebar Bolts */}
          {[0, 60, 120, 180, 240, 300].map((bDeg, idx) => {
            const bRad = (bDeg * Math.PI) / 180;
            return (
              <mesh key={idx} position={[Math.cos(bRad) * 1.8, 1.1, Math.sin(bRad) * 1.8]}>
                <cylinderGeometry args={[0.04, 0.04, 0.6, 6]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Phase 2: Lower Tower Section Erected (~22m height) */}
      {isPhase2 && (
        <group position={[0, 13.1, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.5, 2.15, 22.5, 18]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Flange ring at top of 1st section */}
          <mesh position={[0, 11.3, 0]}>
            <cylinderGeometry args={[1.6, 1.6, 0.35, 18]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
          </mesh>
        </group>
      )}

      {/* Phase 2 Active Lift: Upper Tower Section suspended from Crane Hook directly over lower tower! */}
      {isPhase2 && (
        <group position={[0, 25.5, 0]}>
          {/* Suspended Upper Tubular Steel Tower Segment */}
          <mesh position={[0, 6.0, 0]} castShadow>
            <cylinderGeometry args={[1.3, 1.55, 12.0, 18]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Top Flange Collar */}
          <mesh position={[0, 12.0, 0]}>
            <cylinderGeometry args={[1.4, 1.4, 0.35, 18]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
          </mesh>
          {/* High-Vis Lifting Slings connecting top flange to crane hook at Y=38 */}
          {[-0.85, 0.85].map((lx, li) => (
            <mesh key={li} position={[lx, 12.7, 0]} rotation={[0, 0, li === 0 ? 0.35 : -0.35]}>
              <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
              <meshStandardMaterial color="#eab308" metalness={0.4} />
            </mesh>
          ))}
        </group>
      )}

      {/* Phase 3 & 4: Full Tower Height (~48m) with Nacelle Mounted */}
      {(isPhase3 || isPhase4) && (
        <group>
          {/* Full Tubular Steel Tapered Tower */}
          <mesh position={[0, 25.6, 0]} castShadow>
            <cylinderGeometry args={[1.15, 2.15, 47.5, 20]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.2} />
          </mesh>

          {/* Nacelle Housing on Tower Top */}
          <group position={[0, 49.9, 0]} rotation={[0, (siteBaseAngle * Math.PI) / 180, 0]}>
            {/* Nacelle Generator Box */}
            <mesh position={[0, 0, -0.6]} castShadow>
              <boxGeometry args={[2.5, 2.4, 7.4]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Rear Cooling Radiator Fins */}
            <mesh position={[0, 0.6, -4.2]}>
              <boxGeometry args={[1.9, 1.1, 0.6]} />
              <meshStandardMaterial color="#475569" roughness={0.7} />
            </mesh>

            {/* In Phase 4: Rotor already mounted to nacelle front! */}
            {isPhase4 && (
              <group position={[0, 0, 3.4]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[1.0, 1.25, 1.8, 16]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.4} />
                </mesh>
                {/* 3 Mounted Blades resting locked */}
                {[0, 120, 240].map((deg, i) => (
                  <group key={i} rotation={[0, 0, (deg * Math.PI) / 180]}>
                    <mesh position={[0, 11.0, 0]}>
                      <cylinderGeometry args={[0.2, 0.55, 21.0, 10]} />
                      <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                    <mesh position={[0, 19.5, 0]}>
                      <cylinderGeometry args={[0.21, 0.28, 2.0, 10]} />
                      <meshStandardMaterial color="#dc2626" />
                    </mesh>
                  </group>
                ))}
              </group>
            )}
          </group>
        </group>
      )}

      {/* In Phase 3: The Rotor is actively SUSPENDED from the Crane Hook! (Matches User Reference Image!) */}
      {isPhase3 && (
        <group position={[rotorHubX, 49.9, rotorHubZ]} rotation={[0, (siteBaseAngle * Math.PI) / 180, 0]}>
          {/* Suspended Rotor Hub */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[1.05, 1.25, 1.8, 16]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.4} />
          </mesh>

          {/* 3 Aerodynamic Blades suspended in mid-air */}
          {[0, 120, 240].map((deg, i) => (
            <group key={i} rotation={[0, 0, (deg * Math.PI) / 180]}>
              <mesh position={[0, 11.0, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.55, 21.0, 10]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.25} />
              </mesh>
              {/* Red Tip Warning Stripes */}
              <mesh position={[0, 19.5, 0]}>
                <cylinderGeometry args={[0.21, 0.28, 2.0, 10]} />
                <meshStandardMaterial color="#dc2626" />
              </mesh>
            </group>
          ))}

          {/* Yellow Heavy Rigging Slings connecting Hub to Crane Hook */}
          {[-0.6, 0.6].map((lx, li) => (
            <mesh key={li} position={[lx, 1.2, 0]} rotation={[0, 0, li === 0 ? 0.4 : -0.4]}>
              <cylinderGeometry args={[0.02, 0.02, 1.8, 6]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} />
            </mesh>
          ))}
        </group>
      )}

      {/* =====================================================================
          HEAVY MOBILE TELESCOPIC CRANE (MOBİL VİNÇ) - REACHES OVER TURBINE!
      ====================================================================== */}
      <MobileTelescopicCrane
        position={[9.5, 1.36, 5.5]}
        rotation={[0, 0.6, 0]}
        targetPos={craneTarget}
        isNight={isNight}
      />

      {/* =====================================================================
          HEAVY TRANSPORT TRUCK WITH PHASE-DEPENDENT CARGO
          Phase 1: Foundation Anchor Cage & High-Voltage Underground Cable Spools
          Phase 2: Massive Tubular Steel Tower Segment in Saddles
          Phase 3: Aerodynamic Wind Turbine Blade with Safety Stripes
          Phase 4: Demobilization Cradles, Wooden Pallets & Rigging Gear
      ====================================================================== */}
      <HeavyConstructionTransportTruck
        position={[-8.5, 1.36, 8.5]}
        rotation={[0, 0.35, 0]}
        phase={isPhase1 ? 1 : isPhase2 ? 2 : isPhase3 ? 3 : 4}
        cargoType="wind"
      />

      {/* =====================================================================
          CONSTRUCTION SUPPORT VAN
      ====================================================================== */}
      <ConstructionVan
        position={[1.5, 1.36, 13.0]}
        rotation={[0, 2.6, 0]}
        isNight={isNight}
      />

      {/* =====================================================================
          ACTIVE ANIMATED CREW / WORKERS (VISIBLE ONLY DURING DAYTIME)
      ====================================================================== */}
      {!isNight && (
        <group>
          {/* Worker 1: Crane Spotter / Signalman guiding crane operator with radio */}
          <ActiveConstructionWorker
            waypoints={[
              [6.5, 4.5],
              [5.5, 2.5],
              [5.2, 5.5],
              [7.0, 7.0]
            ]}
            speed={1.0}
            shirtColor="#ea580c"
            pantsColor="#1e3a8a"
            hatColor="#facc15"
            role="signalman"
            initialWp={0}
            baseY={1.36}
          />

          {/* Worker 2: Site Superintendent / Lead Engineer inspecting site with clipboard */}
          <ActiveConstructionWorker
            waypoints={[
              [-5.5, 2.5],
              [-5.2, -3.5],
              [-2.0, -5.5],
              [3.5, -5.2],
              [5.5, -2.5]
            ]}
            speed={1.1}
            shirtColor="#eab308"
            pantsColor="#1e293b"
            hatColor="#ffffff"
            role="foreman"
            initialWp={1}
            baseY={1.36}
          />

          {/* Worker 3: Blade Rigging Specialist inspecting trailer and blade cradles */}
          <ActiveConstructionWorker
            waypoints={[
              [-11.0, 4.0],
              [-9.5, 8.5],
              [-7.5, 14.0],
              [-9.5, 8.5]
            ]}
            speed={1.05}
            shirtColor="#ea580c"
            pantsColor="#334155"
            hatColor="#ea580c"
            role="worker"
            initialWp={2}
            baseY={1.36}
          />

          {/* Worker 4: Mechanical Technician / Assembly Crew member carrying supplies */}
          <ActiveConstructionWorker
            waypoints={[
              [2.5, 11.5],
              [0.5, 8.0],
              [-3.0, 6.0],
              [0.5, 8.0]
            ]}
            speed={1.15}
            shirtColor="#1e3a8a"
            pantsColor="#475569"
            hatColor="#facc15"
            role="technician"
            initialWp={3}
            baseY={1.36}
          />
        </group>
      )}
    </group>
  );
}

// =============================================================================
// ANIMATED MOBILE TELESCOPIC CRANE FOR SOLAR FARM PV MODULE INSTALLATION
// =============================================================================
function SolarInstallationCrane({
  position = [8.0, 1.07, -1.0],
  rotation = [0, 0, 0],
  isNight = false,
  phase = 3
}) {
  const turntableRef = useRef();
  const boomRef = useRef();
  const tipHangerRef = useRef();
  const cableRef = useRef();
  const hookGroupRef = useRef();
  const suspendedPanelRef = useRef();
  const beaconRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Dual amber safety strobe
    if (beaconRef.current) {
      if (!isNight) {
        const strobe = (t * 2.2) % 1.0;
        beaconRef.current.material.opacity = strobe < 0.25 || (strobe > 0.45 && strobe < 0.7) ? 1.0 : 0.2;
      } else {
        beaconRef.current.material.opacity = 0.08;
      }
    }

    if (isNight) return;

    // Smooth industrial crane cycle (~16 seconds)
    const cycleTime = 16.0;
    const p = (t % cycleTime) / cycleTime; // 0.0 to 1.0

    // Coordinates:
    // Flatbed truck cargo is at [+14.2, +3.5] -> Slew angle ~ +0.943 rad
    // Target tracker rack is at [+1.5, -2.5] -> Slew angle ~ -1.80 rad
    let targetSlew = 0.95;
    let targetBoomPitch = 0.65;
    let targetCableDrop = 4.4;
    let hasLoad = false;

    if (phase === 1) {
      // Phase 1: Site preparation / Standby posture
      targetSlew = 0.0;
      targetBoomPitch = 0.38;
      targetCableDrop = 2.8;
      hasLoad = false;
    } else if (p < 0.18) {
      // Step 1: Hook descends cleanly onto the flatbed truck cargo
      targetSlew = 0.95;
      targetBoomPitch = 0.65;
      const progress = p / 0.18;
      const ease = Math.sin(progress * Math.PI * 0.5);
      targetCableDrop = 4.4 + ease * 3.8; // descends to 8.2m (resting on truck bed)
      hasLoad = p > 0.13;
    } else if (p < 0.30) {
      // Step 2: Hoist load smoothly up off the truck flatbed into safe transit height
      targetSlew = 0.95;
      const progress = (p - 0.18) / 0.12;
      const ease = progress * progress * (3 - 2 * progress);
      targetCableDrop = 8.2 - ease * 3.8; // hoists back to 4.4m
      targetBoomPitch = 0.65 - ease * 0.06; // slight pitch up to 0.59
      hasLoad = true;
    } else if (p < 0.65) {
      // Step 3: Slew across from truck to tracker array rack at safe high transit altitude
      const progress = (p - 0.30) / 0.35;
      const ease = progress * progress * (3 - 2 * progress);
      targetSlew = 0.95 + ease * (-1.80 - 0.95);
      targetBoomPitch = 0.59 + Math.sin(progress * Math.PI) * 0.02 - progress * 0.05; // 0.59 -> 0.54
      targetCableDrop = 4.4;
      hasLoad = true;
    } else if (p < 0.80) {
      // Step 4: Lower the solar module table onto the tracker rack torque tube
      targetSlew = -1.80;
      targetBoomPitch = 0.54;
      const progress = (p - 0.65) / 0.15;
      const ease = Math.sin(progress * Math.PI * 0.5);
      targetCableDrop = 4.4 + ease * 2.85; // lowers to 7.25m (landing on torque tube)
      hasLoad = p < 0.77;
    } else {
      // Step 5: Hook unhooks, hoists back up, turntable slews back towards truck
      const progress = (p - 0.80) / 0.20;
      const ease = progress * progress * (3 - 2 * progress);
      targetSlew = -1.80 + ease * (0.95 - -1.80);
      targetBoomPitch = 0.54 + ease * 0.11; // 0.54 -> 0.65
      targetCableDrop = 7.25 - ease * 2.85; // retracts to 4.4m
      hasLoad = false;
    }

    // Ultra smooth interpolation
    if (turntableRef.current) {
      turntableRef.current.rotation.y = THREE.MathUtils.lerp(turntableRef.current.rotation.y, targetSlew, 0.07);
    }
    if (boomRef.current) {
      boomRef.current.rotation.x = THREE.MathUtils.lerp(boomRef.current.rotation.x, targetBoomPitch, 0.07);
    }
    // Counter-rotate the tip hanger so local Y is STRICTLY vertical under gravity at all times
    if (tipHangerRef.current && boomRef.current) {
      tipHangerRef.current.rotation.x = -boomRef.current.rotation.x;
    }
    if (hookGroupRef.current) {
      hookGroupRef.current.position.y = THREE.MathUtils.lerp(hookGroupRef.current.position.y, -targetCableDrop, 0.07);
      // Subtle natural pendulum sway relative to vertical gravity
      hookGroupRef.current.rotation.z = Math.sin(t * 1.8) * 0.015;
      hookGroupRef.current.rotation.x = Math.cos(t * 1.5) * 0.012;
    }
    // Cable scales and positions directly between sheave and hook block
    if (cableRef.current && hookGroupRef.current) {
      const curDrop = Math.max(0.2, -hookGroupRef.current.position.y);
      cableRef.current.scale.y = curDrop;
      cableRef.current.position.y = -curDrop / 2;
    }
    if (suspendedPanelRef.current && turntableRef.current) {
      suspendedPanelRef.current.visible = hasLoad;
      // Align panel squarely with solar farm grid coordinates
      suspendedPanelRef.current.rotation.y = -turntableRef.current.rotation.y;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* 1. Heavy Carrier Chassis (Yellow Heavy-Duty Frame) */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[3.0, 1.0, 11.5]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Driver Transport Cab (Faces +Z) */}
      <mesh position={[0, 1.6, 4.3]} castShadow>
        <boxGeometry args={[2.7, 1.3, 2.4]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 1.75, 5.46]}>
        <boxGeometry args={[2.5, 0.85, 0.12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Amber Safety Strobes on Cab */}
      {[-0.9, 0.9].map((xOff, i) => (
        <mesh key={i} position={[xOff, 2.32, 4.6]} ref={i === 0 ? beaconRef : null}>
          <cylinderGeometry args={[0.11, 0.11, 0.16, 8]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={isNight ? 0.1 : 0.9} transparent />
        </mesh>
      ))}

      {/* 5 Pairs of Heavy Rubber Wheels */}
      {[-3.8, -2.1, -0.4, 1.6, 3.4].map((zPos, i) => (
        <React.Fragment key={i}>
          <mesh position={[-1.55, 0.45, zPos]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.46, 0.46, 0.42, 14]} />
            <meshStandardMaterial color="#09090b" roughness={0.95} />
          </mesh>
          <mesh position={[1.55, 0.45, zPos]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.46, 0.46, 0.42, 14]} />
            <meshStandardMaterial color="#09090b" roughness={0.95} />
          </mesh>
        </React.Fragment>
      ))}

      {/* 4 Extended Hydraulic Outriggers (Denge Ayakları) */}
      {[
        [-2.4, -3.2],
        [2.4, -3.2],
        [-2.4, 2.5],
        [2.4, 2.5]
      ].map(([xOff, zOff], i) => (
        <group key={i} position={[xOff, 0.35, zOff]}>
          <mesh position={[xOff > 0 ? -0.7 : 0.7, 0.08, 0]}>
            <boxGeometry args={[1.5, 0.25, 0.35]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.45, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
          {/* Steel Footpad on Timber Dunnage */}
          <mesh position={[0, -0.32, 0]}>
            <boxGeometry args={[0.8, 0.08, 0.8]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 2. Slewing Turntable Base & Operator Cab */}
      <group position={[0, 1.4, -1.6]} ref={turntableRef}>
        {/* Turntable Ring */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[1.4, 1.5, 0.28, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Counterweight Slabs at Rear */}
        <mesh position={[0, 0.8, -2.0]} castShadow>
          <boxGeometry args={[2.9, 1.3, 1.8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Operator Cab */}
        <mesh position={[-1.0, 1.0, 0.5]}>
          <boxGeometry args={[1.1, 1.5, 2.0]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
        <mesh position={[-1.0, 1.15, 1.48]}>
          <boxGeometry args={[0.95, 1.1, 0.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* 3. Telescopic Boom Pinned to Turntable */}
        <group position={[0.4, 0.8, 0]} ref={boomRef}>
          {/* Base Section */}
          <mesh position={[0, 2.4, 0]} castShadow>
            <boxGeometry args={[1.2, 4.8, 1.4]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.5} />
          </mesh>
          {/* Middle Telescopic Section */}
          <mesh position={[0, 6.2, 0]} castShadow>
            <boxGeometry args={[1.0, 4.4, 1.2]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
          {/* Tip Section */}
          <mesh position={[0, 9.8, 0]} castShadow>
            <boxGeometry args={[0.82, 4.0, 1.0]} />
            <meshStandardMaterial color="#facc15" roughness={0.4} />
          </mesh>
          {/* Boom Head Sheave Pulley Assembly */}
          <mesh position={[0, 11.6, 0.45]}>
            <cylinderGeometry args={[0.44, 0.44, 0.65, 14]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[0, 11.6, 0.85]}>
            <cylinderGeometry args={[0.26, 0.26, 0.5, 12]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>

          {/* 4. Counter-Rotated Tip Hanger: Cancels boom pitch so local Y is STRICTLY vertical under gravity */}
          <group position={[0, 11.6, 0.85]} ref={tipHangerRef}>
            {/* Hoist Steel Cable hanging straight down */}
            <mesh ref={cableRef} position={[0, -2.0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 1.0, 6]} />
              <meshStandardMaterial color="#09090b" metalness={0.9} />
            </mesh>

            {/* Hook Block Assembly */}
            <group ref={hookGroupRef} position={[0, -4.0, 0]}>
              {/* Hook Block Body */}
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.5, 0.75, 0.4]} />
                <meshStandardMaterial color="#eab308" metalness={0.4} />
              </mesh>
              {/* Swivel Pulley Inside Block */}
              <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 0.44, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>
              {/* Heavy Swivel Hook */}
              <mesh position={[0, -0.55, 0]} rotation={[0, 0, Math.PI / 4]}>
                <torusGeometry args={[0.22, 0.055, 8, 16]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
              </mesh>

              {/* 5. Suspended Solar Module Table with Spreader Lifting Frame */}
              <group ref={suspendedPanelRef} position={[0, -0.65, 0]}>
                {/* Yellow Spreader Lifting Beam */}
                <mesh position={[0, 0, 0]} castShadow>
                  <boxGeometry args={[3.8, 0.14, 0.14]} />
                  <meshStandardMaterial color="#eab308" roughness={0.4} />
                </mesh>
                {/* Spreader Cross Arms */}
                {[-1.6, 1.6].map((cx, ci) => (
                  <mesh key={ci} position={[cx, 0, 0]}>
                    <boxGeometry args={[0.12, 0.12, 2.6]} />
                    <meshStandardMaterial color="#ca8a04" roughness={0.4} />
                  </mesh>
                ))}
                {/* 4 Corner Drop Chains */}
                {[
                  [-1.6, -0.35, -1.2],
                  [1.6, -0.35, -1.2],
                  [-1.6, -0.35, 1.2],
                  [1.6, -0.35, 1.2]
                ].map(([sx, sy, sz], si) => (
                  <mesh key={si} position={[sx, sy, sz]}>
                    <cylinderGeometry args={[0.018, 0.018, 0.7, 6]} />
                    <meshStandardMaterial color="#64748b" metalness={0.8} />
                  </mesh>
                ))}

                {/* Suspended Full-Scale Solar PV Panel Table */}
                <group position={[0, -0.7, 0]}>
                  {/* Anodized Frame */}
                  <mesh castShadow>
                    <boxGeometry args={[4.2, 0.1, 3.2]} />
                    <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.6} />
                  </mesh>
                  {/* Anti-Reflective Silicon Face (100% FLAT ON TOP) */}
                  <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[4.0, 3.0]} />
                    <meshStandardMaterial color="#0b192c" roughness={0.12} metalness={0.9} />
                  </mesh>
                  {/* Silver Grid Lines */}
                  {[-1.2, 0, 1.2].map((lx, li) => (
                    <mesh key={li} position={[lx, 0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                      <planeGeometry args={[0.04, 2.9]} />
                      <meshBasicMaterial color="#94a3b8" />
                    </mesh>
                  ))}
                  {/* Underside Mounting Clamps */}
                  {[-1.4, 1.4].map((mx, mi) => (
                    <mesh key={mi} position={[mx, -0.08, 0]}>
                      <boxGeometry args={[0.1, 0.16, 2.8]} />
                      <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                    </mesh>
                  ))}
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* Two Ground Riggers guiding panel near Tracker Row */}
      {phase >= 2 && !isNight && (
        <group position={[-5.5, 0, -1.5]}>
          {/* Rigger 1 holding tagline rope */}
          <group position={[-0.8, 0, -1.8]}>
            <ConstructionWorker action="signaling" />
            <mesh position={[1.2, 1.2, 0.6]} rotation={[0.4, 0.6, 0.3]}>
              <cylinderGeometry args={[0.01, 0.01, 2.8, 4]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>
          </group>
          {/* Rigger 2 holding other tagline rope */}
          <group position={[-0.8, 0, 1.8]}>
            <ConstructionWorker action="signaling" />
            <mesh position={[1.2, 1.2, -0.6]} rotation={[-0.4, 0.6, -0.3]}>
              <cylinderGeometry args={[0.01, 0.01, 2.8, 4]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}

// =============================================================================
// 2. SOLAR FARM UNDER-CONSTRUCTION 3D COMPONENT (1-WEEK DURATION)
// =============================================================================
export function SolarConstructionSite({
  position = [0, 0, 0],
  progress = 0.5, // 0.0 to 1.0 (elapsedHours / 168)
  remainingHours = null,
  equipmentName = 'Güneş Paneli',
  isNight = false,
  onClick = null
}) {
  // Phases:
  // Phase 1 (0.00 - 0.28): Ground clearing, boundary fence, concrete foundation pillar piles (Days 1-2)
  // Phase 2 (0.28 - 0.58): Galvanized steel mounting racks & tracker torque tubes installed (Days 3-4)
  // Phase 3 (0.58 - 0.88): PV solar module tables mounted, active crane lifting panels (Days 5-6)
  // Phase 4 (0.88 - 1.00): Inverter connection, grid transformer commissioning (Day 7)
  const isPhase1 = progress < 0.28;
  const isPhase2 = progress >= 0.28 && progress < 0.58;
  const isPhase3 = progress >= 0.58 && progress < 0.88;
  const isPhase4 = progress >= 0.88;

  const actualRemainingHours = remainingHours !== null 
    ? Math.max(0, remainingHours) 
    : Math.max(0, Math.round((1 - progress) * 168));

  const remainingDays = Math.floor(actualRemainingHours / 24);
  const remHoursInDay = actualRemainingHours % 24;
  const timeString = remainingDays > 0 
    ? `${remainingDays}g ${remHoursInDay}s kaldı` 
    : `${actualRemainingHours}s kaldı`;

  // 3-Row x 3-Table Compact Grid layout coordinates (Matching completed SolarArray 20m x 14m pad)
  const columnsX = [-5.5, 0.0, 5.5];
  const rowsZ = [-3.8, 0.0, 3.8];

  return (
    <group position={position} onClick={onClick}>
      {/* In-World Construction Site Project Signboard */}
      <InWorldProjectSignboard
        position={[-8.5, 0.71, 5.5]}
        rotation={[0, 0.2, 0]}
        timeString={timeString}
        percent={Math.min(100, Math.max(0, Math.round(progress * 100)))}
        title={equipmentName}
      />
      {/* 1. Compact Graded Crushed-Stone Construction Pad with subterranean foundation skirt */}
      <mesh position={[0, 0.45, 0]} receiveShadow>
        <boxGeometry args={[20.0, 1.3, 14.0]} />
        <meshStandardMaterial color="#334155" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[19.8, 13.8]} />
        <meshStandardMaterial color="#475569" roughness={0.88} />
      </mesh>

      {/* Safety Cones along perimeter */}
      {[-8.5, -4.0, 0, 4.0, 8.5].map((cx, i) => (
        <React.Fragment key={i}>
          <SafetyCone position={[cx, 1.11, -6.2]} />
          <SafetyCone position={[cx, 1.11, 6.2]} />
        </React.Fragment>
      ))}

      {/* Floodlights for Night Illumination */}
      <SafetyFloodlightTower position={[-8.8, 1.11, -5.8]} isNight={isNight} />
      <SafetyFloodlightTower position={[8.8, 1.11, 5.8]} isNight={isNight} />

      {/* Concrete Foundation Pillar Piles (Phase 1+) */}
      {columnsX.map((gx, xi) =>
        [-4.0, 0, 4.0].map((gz, zi) => (
          <group key={`pile_${xi}_${zi}`} position={[gx, 1.11, gz]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 0.9, 8]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.85} />
            </mesh>
            <mesh position={[0, 1.05, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.4, 6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          </group>
        ))
      )}

      {/* Phase 2+: Galvanized Steel Racks & Tracker Torque Tubes */}
      {(isPhase2 || isPhase3 || isPhase4) && (
        <group>
          {columnsX.map((rx, ri) => (
            <group key={`rack_${ri}`} position={[rx, 1.85, 0]}>
              {/* Long Horizontal Torque Tube along Z */}
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 11.5, 8]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
              </mesh>
              {/* Supporting Angle Struts */}
              {[-4.0, 0, 4.0].map((sz, si) => (
                <mesh key={si} position={[0, -0.45, sz]}>
                  <cylinderGeometry args={[0.05, 0.05, 1.0, 6]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

      {/* Phase 3 & 4: Mounted Solar PV Panel Module Tables (3x3 Tables, 100% Flat on Top) */}
      {(isPhase3 || isPhase4) && (
        <group>
          {columnsX.map((px, pi) =>
            rowsZ.map((pz, pzi) => {
              // During Phase 3, panel at [col 2, row 1] is being actively lifted and lowered by the crane!
              const isActivelyLifted = isPhase3 && pi === 2 && pzi === 1;
              if (isActivelyLifted) return null;

              return (
                <group key={`pv_${pi}_${pzi}`} position={[px, 1.95, pz]} rotation={[0, 0, -0.22]}>
                  {/* Silicon Solar Panel Frame */}
                  <mesh castShadow>
                    <boxGeometry args={[3.4, 0.08, 2.8]} />
                    <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.6} />
                  </mesh>
                  {/* Anti-reflective Glass Face */}
                  <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[3.2, 2.6]} />
                    <meshStandardMaterial color="#0b192c" roughness={0.12} metalness={0.9} />
                  </mesh>
                  {/* Silver Grid Lines */}
                  {[-0.9, 0, 0.9].map((lx, li) => (
                    <mesh key={li} position={[lx, 0.048, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                      <planeGeometry args={[0.03, 2.5]} />
                      <meshBasicMaterial color="#94a3b8" />
                    </mesh>
                  ))}
                  {/* Underside mounting clamps */}
                  {[-1.1, 1.1].map((mx, mi) => (
                    <mesh key={mi} position={[mx, -0.06, 0]}>
                      <boxGeometry args={[0.08, 0.12, 2.4]} />
                      <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                    </mesh>
                  ))}
                </group>
              );
            })
          )}
        </group>
      )}

      {/* Phase 3+: Inground Cable Trenches with High-Voltage Conduit */}
      {(isPhase3 || isPhase4) && (
        <group position={[6.5, 0.72, -3.2]}>
          <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 2.2, 8]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* Phase 4: Central Inverter Station & SCADA Monitoring Kiosk */}
      {isPhase4 && (
        <group position={[7.8, 0.71, -3.2]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[1.8, 1.8, 1.6]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 1.85, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.15, 8]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* Active Mobile Telescopic Assembly Crane */}
      <SolarInstallationCrane
        position={[7.5, 0.71, 0.0]}
        rotation={[0, 0, 0]}
        isNight={isNight}
        phase={isPhase1 ? 1 : isPhase2 ? 2 : isPhase3 ? 3 : 4}
      />

      {/* Construction Utility Van */}
      <ConstructionVan
        position={[-7.5, 0.71, 4.8]}
        rotation={[0, 0.1, 0]}
        isNight={isNight}
      />

      {/* Heavy Material Delivery Flatbed Truck */}
      <HeavyConstructionTransportTruck
        position={[8.0, 0.71, 3.8]}
        rotation={[0, 0, 0]}
        phase={isPhase1 ? 1 : isPhase2 ? 2 : isPhase3 ? 3 : 4}
        cargoType="solar"
      />

      {/* Active Crew (Visible only during daytime) */}
      {!isNight && (
        <group>
          {/* Worker 1: Solar Rack Assembler */}
          <ActiveConstructionWorker
            waypoints={[
              [-6.0, -2.0],
              [-6.0, 2.0],
              [-3.0, 2.0],
              [-3.0, -2.0]
            ]}
            speed={1.1}
            shirtColor="#ea580c"
            pantsColor="#1e3a8a"
            hatColor="#facc15"
            role="worker"
            initialWp={0}
            baseY={0.71}
          />
          {/* Worker 2: Electrical Technician checking cable conduits */}
          <ActiveConstructionWorker
            waypoints={[
              [2.0, -2.0],
              [4.0, -2.0],
              [4.0, 3.0],
              [2.0, 3.0]
            ]}
            speed={1.15}
            shirtColor="#1e3a8a"
            pantsColor="#334155"
            hatColor="#ea580c"
            role="technician"
            initialWp={1}
            baseY={0.71}
          />
          {/* Worker 3: Site Inspector / Quality Foreman with clipboard */}
          <ActiveConstructionWorker
            waypoints={[
              [-5.0, 4.5],
              [0.0, 4.5],
              [4.0, 4.5],
              [-1.0, 4.5]
            ]}
            speed={1.05}
            shirtColor="#eab308"
            pantsColor="#1e293b"
            hatColor="#ffffff"
            role="foreman"
            initialWp={2}
            baseY={0.71}
          />
        </group>
      )}
    </group>
  );
}
