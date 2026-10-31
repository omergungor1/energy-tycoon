'use client';

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import DrivableBuggy from './DrivableBuggy';
import WalkableCharacter from './WalkableCharacter';
import WaterFeatures from './WaterFeatures';
import LivingSettlements from './LivingSettlements';
import RailwaySystem from './RailwaySystem';
import WildlifeAndSky from './WildlifeAndSky';
import CinematicCameraTour from './CinematicCameraTour';

// 24 World Investment Sites coordinates
const KNOWN_SITES = [
  { id: 1, x: -450.0, z: -320.0, area: 45.0 },
  { id: 2, x: -580.0, z: -420.0, area: 75.0 },
  { id: 3, x: -320.0, z: -510.0, area: 60.0 },
  { id: 4, x: -690.0, z: -180.0, area: 85.0 },
  { id: 5, x: -260.0, z: -390.0, area: 55.0 },
  { id: 6, x: -750.0, z: -350.0, area: 90.0 },
  { id: 7, x: -400.0, z: -150.0, area: 65.0 },
  { id: 8, x: -820.0, z: -520.0, area: 110.0 },
  { id: 9, x: 380.0, z: 280.0, area: 50.0 },
  { id: 10, x: 490.0, z: 350.0, area: 80.0 },
  { id: 11, x: 620.0, z: 190.0, area: 100.0 },
  { id: 12, x: 310.0, z: 420.0, area: 70.0 },
  { id: 13, x: 540.0, z: 480.0, area: 95.0 },
  { id: 14, x: 240.0, z: 220.0, area: 60.0 },
  { id: 15, x: 730.0, z: 310.0, area: 120.0 },
  { id: 16, x: 820.0, z: 420.0, area: 140.0 },
  { id: 17, x: 50.0, z: -180.0, area: 65.0 },
  { id: 18, x: -120.0, z: 80.0, area: 80.0 },
  { id: 19, x: 180.0, z: -90.0, area: 75.0 },
  { id: 20, x: -50.0, z: -320.0, area: 90.0 },
  { id: 21, x: 120.0, z: 150.0, area: 85.0 },
  { id: 22, x: -220.0, z: 240.0, area: 105.0 },
  { id: 23, x: 290.0, z: -220.0, area: 115.0 },
  { id: 24, x: 50.0, z: 380.0, area: 150.0 }
];

function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

// Organic Island Coastal Falloff Mask
function getIslandFalloff(x, z) {
  const theta = Math.atan2(z, x);
  // Organic island contour: elongated along NW-SE energy axes with natural bays and capes
  const islandRadius =
    1150 +
    Math.cos(theta * 2 - 0.45) * 130 +
    Math.sin(theta * 3) * 75 +
    Math.cos(theta * 5) * 35;
  const dist = Math.hypot(x, z);

  if (dist < islandRadius - 130) {
    return 1.0; // Inward solid dry land
  } else if (dist < islandRadius + 160) {
    // Smooth coastal shoreline drop into the ocean
    const t = (dist - (islandRadius - 130)) / 290;
    return Math.cos(t * Math.PI * 0.5);
  } else {
    return 0.0; // Deep seabed
  }
}

// Alpine Lake Center and Water Level in the picturesque Western Valley
const ALPINE_LAKE_CENTER = { x: -150.0, z: -40.0, radius: 54.0, waterLevel: 13.8 };

// Procedural Harmonic Noise for Island Topography
function getRawTerrainHeight(x, z) {
  const falloff = getIslandFalloff(x, z);

  // Western mountain mass (dominates west of x = -50)
  const westDist = Math.max(0, -x - 50);
  const mtnWeight = Math.min(1, westDist / 340);

  // Multi-harmonic ridged mountain noise (sharp ridges & peaks)
  const r1 = Math.abs(Math.sin(x * 0.0075 + z * 0.0055));
  const r2 = Math.abs(Math.cos(x * 0.015 - z * 0.012));
  const r3 = Math.sin(x * 0.03 + z * 0.025) * 0.5 + 0.5;
  const ridge = Math.pow(r1 * 0.6 + r2 * 0.3 + r3 * 0.1, 1.6);
  const mountainMass = mtnWeight * (16.0 + (westDist / 320) * 16.0 + ridge * 38.0);

  // Gentle, positive-definite rolling hills (smooth undulating meadows, never negative)
  const h1 = Math.sin(x * 0.009) * Math.cos(z * 0.009) * 0.5 + 0.5;
  const h2 = Math.sin(x * 0.02 + 0.8) * Math.cos(z * 0.016 + 0.4) * 0.5 + 0.5;
  const hills = Math.pow(h1, 1.3) * 5.5 + h2 * 2.5;

  // Eastern solar steppe & gentle dunes
  const eastDist = Math.max(0, x - 120);
  const eastWeight = Math.min(1, eastDist / 300);
  const dunes = eastWeight * ((Math.sin(x * 0.016 - z * 0.01) * 0.5 + 0.5) * 3.5 + (Math.cos(z * 0.014) * 0.5 + 0.5) * 2.0);

  // Dedicated Alpine Lake basin (peaceful valley at x = -150, z = -40)
  const distLake = Math.hypot(x - ALPINE_LAKE_CENTER.x, z - ALPINE_LAKE_CENTER.z);
  let lakeBasin = 0;
  if (distLake < ALPINE_LAKE_CENTER.radius + 12) {
    const t = Math.cos(Math.min(1, distLake / (ALPINE_LAKE_CENTER.radius + 12)) * Math.PI * 0.5);
    lakeBasin = t * t * 5.8;
  }

  // Base elevation safely elevated above sea level (14.0m)
  const baseElevation = 14.0;
  const rawLandH = baseElevation + mountainMass + (1 - mtnWeight * 0.5) * hills + dunes - lakeBasin;

  // Modulate land elevation with island coastal falloff; exterior becomes ocean floor (-12m)
  const seaFloorH = -12.0;
  return rawLandH * falloff + seaFloorH * (1.0 - falloff);
}

// Pre-computed site anchor heights for leveled terrace platforms
const SITE_ANCHOR_HEIGHTS = KNOWN_SITES.map((s) => getRawTerrainHeight(s.x, s.z));
const SUBSTATION_ANCHOR_HEIGHT = getRawTerrainHeight(0, 0);

// Global terrain height function (shared between mesh, objects, power lines, and markers)
export function getTerrainHeight(x, z) {
  let h = getRawTerrainHeight(x, z);

  // Central Substation leveled terrace (radius 44m)
  const distSub = Math.hypot(x, z);
  if (distSub < 44) {
    const t = smoothstep(44, 14, distSub);
    h = h * (1 - t * 0.94) + SUBSTATION_ANCHOR_HEIGHT * (t * 0.94);
  }

  // Stable leveled terraces around all 24 sites (radius 75m)
  for (let i = 0; i < KNOWN_SITES.length; i++) {
    const s = KNOWN_SITES[i];
    if (Math.abs(x - s.x) < 80 && Math.abs(z - s.z) < 80) {
      const d = Math.hypot(x - s.x, z - s.z);
      if (d < 80) {
        const t = smoothstep(80, 20, d);
        h = h * (1 - t * 0.94) + SITE_ANCHOR_HEIGHTS[i] * (t * 0.94);
        break;
      }
    }
  }

  return h;
}

// Spaced turbine layout coordinates across wide site concession (40m - 60m wake spacing)
const TURBINE_SLOTS = [
  { x: -32, z: -24 },
  { x: 34, z: 26 },
  { x: 36, z: -28 },
  { x: -36, z: 32 },
  { x: 0, z: -48 },
  { x: 0, z: 48 },
  { x: -52, z: 0 },
  { x: 52, z: 0 }
];

// Helper to determine the cohesive prevailing wind direction for any given site on the island
function getSitePrevailingWindAngle(site) {
  if (!site) return 270;
  const x = Number(site.center_x || 0);
  const z = Number(site.center_z || 0);
  // Dominant oceanic wind flows from West (~270°) with gentle natural valley/mountain deflection (±10°)
  const channelDeflection = Math.sin(x * 0.0035 + z * 0.0025) * 10;
  return 270 + channelDeflection;
}

// Highly Realistic Industrial 3D Wind Turbine with Coordinated Dynamic Yaw Tracking, Aerodynamic Airfoil Blades & Anemometer
function WindTurbine({
  position,
  siteBaseAngle = 270,
  turbineIndex = 0,
  siteId = 1,
  windSpeed = 8.8,
  isNight = false,
  onClick
}) {
  const bladesRef = useRef();
  const beaconRef = useRef();
  const yawHeadRef = useRef();
  const anemometerRef = useRef();

  // Subtle individual mechanical personality per turbine
  const speedMultiplier = useMemo(() => 0.94 + ((turbineIndex * 17) % 13) * 0.01, [turbineIndex]);
  const phaseDelay = useMemo(() => ((turbineIndex * 23) % 47) * 0.12, [turbineIndex]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // 1. Aerodynamic Rotor rotation: smooth, heavy, majestic rotational momentum
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * (windSpeed * 0.30 * speedMultiplier);
    }

    // 2. Anemometer cups rapidly spinning on the rear of the nacelle roof
    if (anemometerRef.current) {
      anemometerRef.current.rotation.y += delta * (windSpeed * 1.8);
    }

    // 3. Realistic Dynamic Yawing:
    // The head smoothly turns left and right tracking the shifting wind vector.
    // Turbines in the same plant yaw together in a coordinated natural wave.
    if (yawHeadRef.current) {
      // Macro site-wide wind oscillation: ~24s period, ±13.5 degrees amplitude
      const siteWindPhase = t * 0.15 + siteId * 0.7;
      const macroWindShift =
        Math.sin(siteWindPhase) * 0.17 +
        Math.sin(siteWindPhase * 0.41) * 0.065; // in radians (~ ±13.5°)

      // Micro turbulence delay: brief gust arrival ripple between front and rear rows
      const microLag = Math.sin(siteWindPhase * 1.7 + phaseDelay) * 0.03; // ~ ±1.7°

      // Total yaw angle around the vertical Y-axis
      const currentYawRad = (siteBaseAngle * Math.PI) / 180 + macroWindShift + microLag;
      yawHeadRef.current.rotation.y = currentYawRad;
    }

    // 4. Aviation Obstacle Beacon: ICAO double-flash red strobe
    if (beaconRef.current) {
      const cycle = t % 1.5;
      const isFlash = cycle < 0.11 || (cycle > 0.22 && cycle < 0.33);
      beaconRef.current.material.opacity = isFlash ? 1.0 : (isNight ? 0.08 : 0.0);
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* 1. Heavy Octagonal Reinforced Concrete Foundation Pad */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.8, 4.4, 0.9, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>

      {/* 2. Steel Foundation Flange & Ground Collar */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[1.65, 1.95, 0.35, 20]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Yellow Tower Base Service Platform & Entrance Door */}
      <mesh position={[0, 1.6, 1.7]} castShadow>
        <boxGeometry args={[1.2, 1.2, 0.35]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>

      {/* 3. Three-Tier Tapered Steel Tubular Tower (38m hub height) */}
      {/* Lower Tower Section */}
      <mesh position={[0, 7.5, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.65, 13.0, 20]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.25} metalness={0.15} />
      </mesh>
      {/* Flange Ring 1 */}
      <mesh position={[0, 14.0, 0]}>
        <cylinderGeometry args={[1.45, 1.45, 0.2, 20]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.4} />
      </mesh>
      {/* Mid Tower Section */}
      <mesh position={[0, 20.5, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.4, 13.0, 20]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.15} />
      </mesh>
      {/* Flange Ring 2 */}
      <mesh position={[0, 27.0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.2, 20]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.4} />
      </mesh>
      {/* Upper Tower Section */}
      <mesh position={[0, 32.5, 0]} castShadow>
        <cylinderGeometry args={[0.95, 1.15, 11.0, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.15} />
      </mesh>

      {/* 4. Top Yaw Bearing Gear Ring */}
      <mesh position={[0, 38.1, 0]}>
        <cylinderGeometry args={[1.18, 1.18, 0.45, 20]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* 5. DYNAMIC YAWING HEAD ASSEMBLY (Rotates smoothly left/right to track wind) */}
      <group position={[0, 38.35, 0]} ref={yawHeadRef}>
        {/* Main Aerodynamic Nacelle Body */}
        <mesh position={[0, 0.2, 0.8]} castShadow>
          <boxGeometry args={[2.6, 2.5, 6.4]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Nacelle Upper Curvature (Streamlined Top Casing) */}
        <mesh position={[0, 1.5, 0.8]} castShadow>
          <boxGeometry args={[2.3, 0.4, 5.8]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.15} />
        </mesh>

        {/* Rear Cooler Louvers & Generator Heat Exchanger */}
        <mesh position={[0, 0.2, -2.5]} castShadow>
          <boxGeometry args={[2.35, 2.3, 0.6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* Rear Transformer / Cooler Vent on Roof */}
        <mesh position={[0, 1.85, -1.8]}>
          <boxGeometry args={[1.6, 0.5, 1.4]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Rear Meteorological Instrument Mast (Wind Vane & Anemometer) */}
        <group position={[0, 1.7, -2.3]}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          {/* Ultrasonic sensor crossarm */}
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[0.8, 0.05, 0.05]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
          {/* Spinning Anemometer 3-Cups */}
          <group position={[0, 1.25, 0]} ref={anemometerRef}>
            {[0, 1, 2].map((k) => {
              const cupAngle = (k * 2 * Math.PI) / 3;
              return (
                <group key={k} rotation={[0, cupAngle, 0]}>
                  <mesh position={[0.2, 0, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} rotation={[0, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#0f172a" />
                  </mesh>
                  <mesh position={[0.4, 0, 0]}>
                    <sphereGeometry args={[0.08, 8, 8]} />
                    <meshStandardMaterial color="#0f172a" />
                  </mesh>
                </group>
              );
            })}
          </group>
        </group>

        {/* Pulsing ICAO Aviation Safety Obstacle Beacon Light */}
        <mesh position={[0, 2.0, -0.6]} ref={beaconRef}>
          <sphereGeometry args={[0.32, 12, 12]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={1.0} />
        </mesh>

        {/* 6. ROTOR SHAFT & HUB (with 4-Degree Authentic Upward Rotor Shaft Tilt) */}
        <group position={[0, 0.2, 4.0]} rotation={[-0.07, 0, 0]}>
          {/* Bullet Nose Cone / Aerodynamic Spinner Covering Hub */}
          <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[1.28, 2.2, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.25} />
          </mesh>

          {/* Hub Base Collar */}
          <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[1.28, 1.34, 1.2, 24]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.3} />
          </mesh>

          {/* 7. SPINNING ROTOR ASSEMBLY (Hub Center + 3 Airfoil Blades) */}
          <group ref={bladesRef}>
            {[0, 1, 2].map((i) => {
              const bladeAngle = (i * 2 * Math.PI) / 3;
              return (
                <group key={i} rotation={[0, 0, bladeAngle]}>
                  {/* Pitch Bearing Ring at Blade Root */}
                  <mesh position={[0, 1.4, 0]}>
                    <cylinderGeometry args={[0.46, 0.46, 0.35, 16]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.6} />
                  </mesh>

                  {/* Cylindrical Blade Root Transition */}
                  <mesh position={[0, 2.4, 0]} castShadow>
                    <cylinderGeometry args={[0.42, 0.45, 1.8, 14]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.2} />
                  </mesh>

                  {/* Main Aerodynamic Airfoil Blade (22m length, subtle pitch twist) */}
                  <group rotation={[0, 0.08, 0]}>
                    {/* Inner Lifting Section (Wide Chord) */}
                    <mesh position={[0, 9.5, 0]} castShadow>
                      <boxGeometry args={[0.88, 12.5, 0.18]} />
                      <meshStandardMaterial color="#ffffff" roughness={0.18} />
                    </mesh>

                    {/* Outer Tapered Section */}
                    <mesh position={[0, 18.0, 0]} castShadow>
                      <boxGeometry args={[0.62, 5.0, 0.14]} />
                      <meshStandardMaterial color="#ffffff" roughness={0.18} />
                    </mesh>

                    {/* Tip Stripe 1: Red Aviation Warning Band (RAL 3020) */}
                    <mesh position={[0, 21.0, 0]}>
                      <boxGeometry args={[0.55, 1.2, 0.14]} />
                      <meshStandardMaterial color="#dc2626" roughness={0.3} />
                    </mesh>

                    {/* White Spacer Band */}
                    <mesh position={[0, 22.0, 0]}>
                      <boxGeometry args={[0.50, 0.8, 0.13]} />
                      <meshStandardMaterial color="#ffffff" roughness={0.2} />
                    </mesh>

                    {/* Tip Stripe 2: Red Aviation Tip End */}
                    <mesh position={[0, 22.9, 0]}>
                      <boxGeometry args={[0.42, 1.0, 0.12]} />
                      <meshStandardMaterial color="#dc2626" roughness={0.3} />
                    </mesh>
                  </group>
                </group>
              );
            })}
          </group>
        </group>
      </group>
    </group>
  );
}

// 3D Solar Array with Optional Solar Sun-Tracker
function SolarArray({ position, hasTracker = false, clock, onClick }) {
  const panelRackRef = useRef();

  useFrame(() => {
    if (panelRackRef.current && hasTracker) {
      const hourOfDay = Number(clock?.gameHour || 12) % 24;
      if (hourOfDay >= 6 && hourOfDay <= 18) {
        const sunProgress = (hourOfDay - 6) / 12;
        const targetTiltZ = (sunProgress - 0.5) * 0.88;
        panelRackRef.current.rotation.z = THREE.MathUtils.lerp(
          panelRackRef.current.rotation.z,
          targetTiltZ,
          0.05
        );
      } else {
        panelRackRef.current.rotation.z = THREE.MathUtils.lerp(
          panelRackRef.current.rotation.z,
          0,
          0.05
        );
      }
    }
  });

  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[16, 0.5, 11]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>

      {[-6, 6].map((xOffset, idx) => (
        <mesh key={idx} position={[xOffset, 1.2, 0]}>
          <boxGeometry args={[0.5, 1.8, 0.5]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
      ))}

      <mesh position={[0, 1.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 15, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} />
      </mesh>

      {hasTracker && (
        <group position={[0, 1.4, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.65, 0.65, 0.9, 12]} />
            <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.4, 1.2]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 1.2, 8]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.5, 0.6]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      )}

      <group position={[0, 2.0, 0]} ref={panelRackRef}>
        <mesh position={[0, 0.35, 0]} rotation={[-0.38, 0, 0]} castShadow>
          <boxGeometry args={[15.2, 0.25, 10.2]} />
          <meshStandardMaterial
            color="#0b192c"
            roughness={0.08}
            metalness={0.92}
            emissive={hasTracker ? '#1d4ed8' : '#1e3a8a'}
            emissiveIntensity={hasTracker ? 0.35 : 0.22}
          />
        </mesh>

        <mesh position={[0, 0.5, 0]} rotation={[-0.38, 0, 0]}>
          <planeGeometry args={[15.0, 10.0]} />
          <meshBasicMaterial
            color={hasTracker ? '#38bdf8' : '#60a5fa'}
            wireframe
            transparent
            opacity={0.22}
          />
        </mesh>
      </group>
    </group>
  );
}

// 3D Battery Energy Storage Container
function BatteryContainer({ position, onClick }) {
  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[10, 0.6, 5]} />
        <meshStandardMaterial color="#334155" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[9.2, 3.6, 4.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.15} />
      </mesh>
      <mesh position={[0, 3.2, 2.12]}>
        <planeGeometry args={[7.5, 0.35]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      <mesh position={[0, 1.5, 2.12]}>
        <planeGeometry args={[5.0, 1.2]} />
        <meshBasicMaterial color="#1e293b" wireframe transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// Central High-Voltage Substation (Trafo Merkezi)
function SubstationNode({ position = [0, 0, 0], showLabels = true }) {
  const y = getTerrainHeight(position[0], position[2]);

  return (
    <group position={[position[0], y, position[2]]}>
      <mesh position={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[44, 0.6, 44]} />
        <meshStandardMaterial color="#475569" roughness={0.95} />
      </mesh>

      <mesh position={[0, 2.0, 0]}>
        <boxGeometry args={[43, 3.4, 43]} />
        <meshBasicMaterial color="#94a3b8" wireframe transparent opacity={0.3} />
      </mesh>

      {[-12, 0, 12].map((offset, idx) => (
        <group key={idx} position={[offset, 1.8, 0]}>
          <mesh castShadow>
            <boxGeometry args={[5.5, 4.8, 5.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.6} />
          </mesh>
          {[-1.6, 0, 1.6].map((ins, i) => (
            <mesh key={i} position={[ins, 3.4, 0]}>
              <cylinderGeometry args={[0.3, 0.45, 2.2, 8]} />
              <meshStandardMaterial color="#b45309" roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh position={[0, 13, 0]} castShadow>
        <cylinderGeometry args={[0.4, 1.5, 26, 6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
      </mesh>

      {showLabels && (
        <Text
          position={[0, 29, 0]}
          color="#38bdf8"
          fontSize={5.5}
          outlineWidth={0.6}
          outlineColor="#020617"
          textAlign="center"
        >
          MERKEZİ TRAFO & ŞEBEKE DAĞITIM (100 MW)
        </Text>
      )}
    </group>
  );
}

// High-Voltage Power Lines connecting sites to central substation
function PowerLine({ from, to }) {
  const points = useMemo(() => {
    const fx = Number.isFinite(from?.[0]) ? from[0] : 0;
    const fz = Number.isFinite(from?.[2]) ? from[2] : 0;
    const tx = Number.isFinite(to?.[0]) ? to[0] : 0;
    const tz = Number.isFinite(to?.[2]) ? to[2] : 0;

    const fromY = getTerrainHeight(fx, fz) + 4.5;
    const toY = getTerrainHeight(tx, tz) + 4.5;
    const midX = (fx + tx) / 2;
    const midZ = (fz + tz) / 2;
    const midY = (fromY + toY) / 2 + 7;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(fx, fromY, fz),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(tx, toY, tz)
    ]);
    return curve.getPoints(24);
  }, [from, to]);

  const lineGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <primitive
      object={
        new THREE.Line(
          lineGeo,
          new THREE.LineBasicMaterial({
            color: '#38bdf8',
            transparent: true,
            opacity: 0.35
          })
        )
      }
    />
  );
}

// Expansive 3D Investment Site Marker with Hugging Boundary & 8 Surveyor Pylons
function SiteMarker({
  site,
  isOwned,
  isLeased,
  showBoundaries = true,
  showLabels = true,
  onSelect
}) {
  const siteX = Number.isFinite(site?.center_x) ? site.center_x : 0;
  const siteZ = Number.isFinite(site?.center_z) ? site.center_z : 0;
  const siteY = getTerrainHeight(siteX, siteZ);

  const territoryRadius = useMemo(() => {
    const ha = Number(site?.area_hectares || 50);
    return Math.max(52, Math.min(80, 42 + Math.sqrt(ha) * 2.8));
  }, [site?.area_hectares]);

  const ringColor = isOwned
    ? '#10b981'
    : isLeased
    ? '#06b6d4'
    : site?.region_type === 'wind'
    ? '#38bdf8'
    : site?.region_type === 'solar'
    ? '#f59e0b'
    : '#c084fc';

  // Terrain-conforming wide perimeter line (never clips into hills)
  const boundaryLine = useMemo(() => {
    const points = [];
    const segments = 64;
    const rad = Number.isFinite(territoryRadius) ? territoryRadius : 50;

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const px = siteX + Math.cos(theta) * rad;
      const pz = siteZ + Math.sin(theta) * rad;
      // Sampling terrain height with +0.8m offset to glide cleanly over slopes
      const py = getTerrainHeight(px, pz) + 0.8;
      points.push(new THREE.Vector3(px, Number.isFinite(py) ? py : 0, pz));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: isOwned || isLeased ? 0.95 : 0.7,
      depthTest: true
    });
    return new THREE.LineLoop(geo, mat);
  }, [siteX, siteZ, territoryRadius, ringColor, isOwned, isLeased]);

  // 8 Perimeter Surveyor Pylons
  const pylons = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) {
      const theta = (i * Math.PI) / 4;
      const px = site.center_x + Math.cos(theta) * territoryRadius;
      const pz = site.center_z + Math.sin(theta) * territoryRadius;
      const py = getTerrainHeight(px, pz);
      arr.push({ x: px, y: py, z: pz });
    }
    return arr;
  }, [site.center_x, site.center_z, territoryRadius]);

  return (
    <group>
      {/* Concession Boundary Ring & Surveyor Pylons (Toggled via showBoundaries) */}
      {showBoundaries && (
        <>
          <primitive object={boundaryLine} onClick={() => onSelect(site)} />

          {pylons.map((p, idx) => (
            <group key={idx} position={[p.x, p.y, p.z]}>
              <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.7, 0.9, 0.8, 8]} />
                <meshStandardMaterial color="#334155" roughness={0.9} />
              </mesh>
              <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.15, 0.2, 2.6, 8]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.7} />
              </mesh>
              <mesh position={[0, 3.2, 0]}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshBasicMaterial color={ringColor} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {/* Invisible Click Boundary - Always clickable even when visual rings are hidden */}
      <mesh
        position={[site.center_x, siteY + 2.0, site.center_z]}
        onClick={() => onSelect(site)}
      >
        <cylinderGeometry args={[territoryRadius, territoryRadius, 6.0, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Floating Native WebGL 3D Billboard Badge (Toggled via showLabels) */}
      {showLabels && (
        <Billboard
          position={[site.center_x, siteY + 22, site.center_z]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <group
            onClick={(e) => {
              e.stopPropagation();
              onSelect(site);
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
          >
            {/* Main Card Background */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[26, 7.2]} />
              <meshBasicMaterial
                color="#090d16"
                transparent
                opacity={0.88}
                depthTest={false}
              />
            </mesh>

            {/* Glowing Border Trim */}
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[26.4, 7.6]} />
              <meshBasicMaterial
                color={ringColor}
                wireframe
                transparent
                opacity={0.4}
                depthTest={false}
              />
            </mesh>

            {/* Left Colored Accent Bar */}
            <mesh position={[-12.2, 0, 0.05]}>
              <planeGeometry args={[1.2, 7.0]} />
              <meshBasicMaterial color={ringColor} depthTest={false} />
            </mesh>

            {/* Site ID Pill Box */}
            <mesh position={[-9.2, 0, 0.05]}>
              <planeGeometry args={[3.8, 4.4]} />
              <meshBasicMaterial color="#1e293b" depthTest={false} />
            </mesh>
            <Text
              position={[-9.2, 0, 0.1]}
              fontSize={2.0}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              depthTest={false}
            >
              {String(site.id)}
            </Text>

            {/* Site Name Text */}
            <Text
              position={[-6.2, 1.3, 0.1]}
              fontSize={1.75}
              color="#ffffff"
              anchorX="left"
              anchorY="middle"
              outlineWidth={0.08}
              outlineColor="#020617"
              depthTest={false}
            >
              {site.name}
            </Text>

            {/* Status Subtitle Text */}
            <Text
              position={[-6.2, -1.4, 0.1]}
              fontSize={1.15}
              color={ringColor}
              anchorX="left"
              anchorY="middle"
              depthTest={false}
            >
              {isOwned
                ? 'MÜLKİYETİNİZ'
                : isLeased
                ? 'KİRALIK SANTRAL'
                : `${
                    site.region_type === 'wind'
                      ? 'RÜZGÂR'
                      : site.region_type === 'solar'
                      ? 'GÜNEŞ'
                      : 'HİBRİT'
                  } • ${site.area_hectares} Ha`}
            </Text>
          </group>
        </Billboard>
      )}
    </group>
  );
}

// Procedural 3D Island Terrain with Warm Firewatch Natural Color Palette & Seasonal Adaptations
function IslandTerrain({ season = 'summer' }) {
  const terrainGeo = useMemo(() => {
    // 2800x2800 island mesh spanning [-1400, 1400] to encompass all 24 sites inside dry land
    const geo = new THREE.PlaneGeometry(2800, 2800, 180, 180);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      const falloff = getIslandFalloff(x, z);
      const distLake = Math.hypot(x - ALPINE_LAKE_CENTER.x, z - ALPINE_LAKE_CENTER.z);

      // Baseline meadow tone adapting to Season
      let r = 0.32, g = 0.48, b = 0.20; // Summer default
      if (season === 'autumn') {
        r = 0.52; g = 0.50; b = 0.22; // Golden harvest autumn grass
      } else if (season === 'winter') {
        r = 0.42; g = 0.48; b = 0.42; // Frosted cool winter highland grass
      } else if (season === 'spring') {
        r = 0.24; g = 0.56; b = 0.22; // Lush spring emerald meadow
      }

      if (falloff < 0.25 || y < 1.0) {
        // Shallow turquoise coastal reef & lagoon
        r = 0.08;
        g = 0.46;
        b = 0.56;
      } else if (falloff < 0.85 || y < 4.5) {
        // Sunny warm golden ocean beach & coastal sands
        const t = Math.max(0, Math.min(1, (y - 1.0) / 3.5));
        r = 0.86 - t * 0.16;
        g = 0.72 - t * 0.12;
        b = 0.46 - t * 0.12;
      } else if (distLake < ALPINE_LAKE_CENTER.radius + 12) {
        // Alpine Lake Shoreline & Banks
        if (y < ALPINE_LAKE_CENTER.waterLevel + 0.8) {
          // Soft golden pebble & sand lakeshore
          r = 0.78;
          g = 0.65;
          b = 0.44;
        } else {
          // Lush emerald mossy bank
          r = 0.22;
          g = 0.46;
          b = 0.22;
        }
      } else if (x > 120 && z > 60) {
        // Desert / Sunfire Solar Steppe (SE quadrant)
        if (x > 500 && z > 200) {
          // Radiant warm sandstone flats
          r = 0.84;
          g = 0.74;
          b = 0.58;
        } else if (x > 260) {
          // Golden sunbaked sand dunes & canyon earth
          r = 0.78;
          g = 0.52;
          b = 0.30;
        } else {
          // Arid terracotta savanna
          r = 0.68;
          g = 0.48;
          b = 0.28;
        }
      } else if (x < -60) {
        // Mountain & Highland Wind Zone (Western Ridge)
        if (season === 'winter' && y > 46) {
          // Pristine Alpine Snow Caps on High Mountain Peaks in Winter
          const t = Math.min(1, (y - 46) / 22);
          r = 0.90 + t * 0.08;
          g = 0.93 + t * 0.05;
          b = 0.98 + t * 0.01;
        } else if (y > 66) {
          // Sunlit granite summit peaks & alpine rock
          const t = Math.min(1, (y - 66) / 14);
          r = 0.74 + t * 0.12;
          g = 0.48 + t * 0.10;
          b = 0.36 + t * 0.08;
        } else if (y > 44) {
          // Warm terracotta cliffs, slate & crag rock
          const t = (y - 44) / 22;
          r = 0.58 + t * 0.16;
          g = 0.32 + t * 0.16;
          b = 0.22 + t * 0.14;
        } else if (y > 22) {
          // Mountain Pine Forest slopes (deep evergreen undergrowth)
          const t = (y - 22) / 22;
          r = 0.16 + t * 0.24;
          g = 0.32 + t * 0.08;
          b = 0.16 + t * 0.10;
        } else {
          // Highland Foothills (warm olive meadow)
          r = 0.28;
          g = 0.44;
          b = 0.20;
        }
      } else {
        // Central Hybrid Valleys & River Plain
        r = 0.32;
        g = 0.48;
        b = 0.20;
      }

      // Natural organic noise variation for rich texture
      const noise = (Math.sin(x * 0.05) * Math.cos(z * 0.05) + Math.sin(x * 0.11 + z * 0.09) * 0.5) * 0.025;
      colors[i * 3] = Math.max(0, Math.min(1, r + noise));
      colors[i * 3 + 1] = Math.max(0, Math.min(1, g + noise));
      colors[i * 3 + 2] = Math.max(0, Math.min(1, b + noise));
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      <mesh geometry={terrainGeo} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.88}
          metalness={0.06}
          flatShading={true}
        />
      </mesh>
    </group>
  );
}

// Pristine Alpine Lake with Animated Water, Wooden Pier & Viewpoint
function AlpineLake() {
  const waterRef = useRef();

  useFrame(({ clock }) => {
    if (waterRef.current) {
      const t = clock.getElapsedTime();
      waterRef.current.rotation.z = Math.sin(t * 0.1) * 0.02;
    }
  });

  return (
    <group position={[ALPINE_LAKE_CENTER.x, ALPINE_LAKE_CENTER.waterLevel, ALPINE_LAKE_CENTER.z]}>
      {/* Crystal Azure Lake Surface */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[ALPINE_LAKE_CENTER.radius, 48]} />
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.06}
          metalness={0.4}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Shallow Turquoise Shoreline Water Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[ALPINE_LAKE_CENTER.radius - 8, ALPINE_LAKE_CENTER.radius + 4, 48]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Scenic Wooden Pier / Jetty on the South Shore */}
      <group position={[0, 0.15, ALPINE_LAKE_CENTER.radius - 12]}>
        {/* Pier Decking */}
        <mesh position={[0, 0, -6]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.25, 12]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Support Pilings into Water */}
        {[-4, -8, -12].map((zOffset, i) => (
          <group key={i}>
            <mesh position={[-1.4, -1.2, zOffset]}>
              <cylinderGeometry args={[0.15, 0.15, 2.6, 6]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
            <mesh position={[1.4, -1.2, zOffset]}>
              <cylinderGeometry args={[0.15, 0.15, 2.6, 6]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
          </group>
        ))}
        {/* Pier End Lantern Light */}
        <mesh position={[1.2, 0.9, -11]}>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[1.2, 1.6, -11]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      </group>
    </group>
  );
}

// Expansive Animated Ocean with Gentle Wave Swell
function AnimatedOcean() {
  const meshRef = useRef();

  const oceanGeo = useMemo(() => {
    // 4400x4400 expansive ocean extending to the horizon
    const geo = new THREE.PlaneGeometry(4400, 4400, 56, 56);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Gentle ocean rolling wave swell (height oscillation -0.25 to +0.25m around y = 0.0)
      const wave =
        Math.sin(x * 0.012 + t * 0.8) * Math.cos(z * 0.012 + t * 0.6) * 0.28 +
        Math.sin(x * 0.024 - t * 1.1) * 0.12;
      pos.setY(i, wave);
    }
    pos.needsUpdate = true;
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={oceanGeo}>
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.10}
          metalness={0.35}
          transparent
          opacity={0.85}
          flatShading
        />
      </mesh>

      {/* Coastal Surf Foam Ring around Island Periphery */}
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1040, 1260, 64]} />
        <meshBasicMaterial
          color="#e0f2fe"
          transparent
          opacity={0.24}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Firewatch Atmospheric Sky Dome with Rich Sunset Gradient & Glowing Sun Corona
function FirewatchSkyDome() {
  const skyGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(4400, 36, 24);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 4400; // -1 to +1

      let c = new THREE.Color();
      if (y > 0.55) {
        // Twilight plum / deep maroon zenith
        const t = (y - 0.55) / 0.45;
        c.lerpColors(new THREE.Color('#661824'), new THREE.Color('#300c18'), t);
      } else if (y > 0.16) {
        // High sunset orange to crimson
        const t = (y - 0.16) / 0.39;
        c.lerpColors(new THREE.Color('#e05218'), new THREE.Color('#661824'), t);
      } else if (y > -0.04) {
        // Radiant golden peach / soft apricot horizon glow
        const t = Math.max(0, (y + 0.04) / 0.20);
        c.lerpColors(new THREE.Color('#fed7aa'), new THREE.Color('#e05218'), t);
      } else {
        // Below horizon warm terracotta atmospheric haze
        const t = Math.min(1, (-y - 0.04) / 0.36);
        c.lerpColors(new THREE.Color('#fed7aa'), new THREE.Color('#7c2d12'), t);
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <group>
      {/* 360-Degree Firewatch Sky Gradient Hemisphere */}
      <mesh geometry={skyGeo}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Radiant Golden Sunset Disc on the Western Horizon */}
      <group position={[-1850, 480, -1250]}>
        {/* Core Glowing Sun Disc */}
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <circleGeometry args={[120, 32]} />
          <meshBasicMaterial color="#fffbeb" />
        </mesh>
        {/* Soft Golden Sun Corona Ring */}
        <mesh position={[0, 0, -2]} rotation={[0, Math.PI / 4, 0]}>
          <ringGeometry args={[110, 320, 32]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.38} side={THREE.DoubleSide} />
        </mesh>
        {/* Wide Warm Amber Sunset Halo */}
        <mesh position={[0, 0, -4]} rotation={[0, Math.PI / 4, 0]}>
          <ringGeometry args={[280, 720, 32]} />
          <meshBasicMaterial color="#ea580c" transparent opacity={0.22} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// Deep Midnight Starlit Sky Dome with Glowing Luminous Full Moon
function NightSkyAndMoon() {
  const moonGroupRef = useRef();

  const skyGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(4400, 36, 24);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 4400; // -1 to +1

      let c = new THREE.Color();
      if (y > 0.45) {
        // Deep space cosmic navy / indigo zenith
        const t = (y - 0.45) / 0.55;
        c.lerpColors(new THREE.Color('#070b19'), new THREE.Color('#020617'), t);
      } else if (y > 0.08) {
        // Mid-altitude midnight blue
        const t = (y - 0.08) / 0.37;
        c.lerpColors(new THREE.Color('#0f172a'), new THREE.Color('#070b19'), t);
      } else if (y > -0.06) {
        // Soft moonlit horizon haze
        const t = Math.max(0, (y + 0.06) / 0.14);
        c.lerpColors(new THREE.Color('#1e293b'), new THREE.Color('#0f172a'), t);
      } else {
        // Sub-horizon abyss
        c.set('#020617');
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // 650 Twinkling Starlight Points in Upper Hemisphere
  const starsGeo = useMemo(() => {
    const starCount = 650;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random() * 0.75 + 0.15; // upper hemisphere
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 4100 + Math.random() * 150;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi));
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    return geo;
  }, []);

  useEffect(() => {
    if (moonGroupRef.current) {
      moonGroupRef.current.lookAt(0, 0, 0);
    }
  }, []);

  return (
    <group>
      {/* 360-Degree Midnight Blue Sky Gradient Hemisphere */}
      <mesh geometry={skyGeo}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Twinkling High-Altitude Stars */}
      <points geometry={starsGeo}>
        <pointsMaterial size={8.5} color="#cbd5e1" transparent opacity={0.85} sizeAttenuation={false} />
      </points>

      {/* Radiant Luminous Moon (Aligned with Night Directional Light) */}
      <group
        ref={moonGroupRef}
        position={[-920, 1920, -710]}
      >
        {/* Core Glowing Pearl Moon Disc */}
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[115, 32]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
        {/* Subtle Lunar Craters / Topography */}
        <mesh position={[-25, 20, 1]}>
          <circleGeometry args={[26, 16]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.65} />
        </mesh>
        <mesh position={[28, -15, 1]}>
          <circleGeometry args={[32, 16]} />
          <meshBasicMaterial color="#cbd5e1" transparent opacity={0.55} />
        </mesh>
        <mesh position={[-10, -32, 1]}>
          <circleGeometry args={[20, 16]} />
          <meshBasicMaterial color="#cbd5e1" transparent opacity={0.55} />
        </mesh>
        {/* Soft Silvery-Cyan Inner Lunar Corona */}
        <mesh position={[0, 0, -2]}>
          <ringGeometry args={[110, 260, 32]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.36} side={THREE.DoubleSide} />
        </mesh>
        {/* Wide Ambient Moonlit Glow */}
        <mesh position={[0, 0, -4]}>
          <ringGeometry args={[250, 680, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.16} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// Procedural Multi-Layered Mountain Silhouette Ridges Framing the Firewatch Horizon
function createMountainRidgeGeo(radius, minHeight, maxHeight, segments = 96, harmonics = [5, 9, 17]) {
  const geo = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];

  const rad = Number.isFinite(radius) ? radius : 1200;
  const minH = Number.isFinite(minHeight) ? minHeight : 20;
  const maxH = Number.isFinite(maxHeight) ? maxHeight : 120;

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    // Multi-harmonic ridged noise for jagged alpine silhouettes
    const h1 = Math.abs(Math.sin(theta * harmonics[0])) * 0.52;
    const h2 = Math.abs(Math.cos(theta * harmonics[1] + 0.7)) * 0.34;
    const h3 = Math.sin(theta * harmonics[2] + 1.3) * 0.14;
    const peakT = Math.pow(h1 + h2 + h3, 1.4);
    const height = minH + peakT * (maxH - minH);

    // Bottom vertex (below sea level)
    const bx = Math.cos(theta) * rad;
    const bz = Math.sin(theta) * rad;
    const by = -20;

    // Top peak ridge vertex
    const tx = bx;
    const tz = bz;
    const ty = height;

    vertices.push(
      Number.isFinite(bx) ? bx : 0,
      Number.isFinite(by) ? by : -20,
      Number.isFinite(bz) ? bz : 0
    );
    vertices.push(
      Number.isFinite(tx) ? tx : 0,
      Number.isFinite(ty) ? ty : minH,
      Number.isFinite(tz) ? tz : 0
    );

    if (i < segments) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function FirewatchDistantMountains() {
  const nearRidgeGeo = useMemo(() => {
    return createMountainRidgeGeo(1620, 75, 210, 96, [5, 9, 17]);
  }, []);

  const midMtnGeo = useMemo(() => {
    return createMountainRidgeGeo(2320, 140, 320, 108, [6, 11, 21]);
  }, []);

  const farAlpineGeo = useMemo(() => {
    return createMountainRidgeGeo(3150, 230, 450, 120, [4, 8, 15]);
  }, []);

  return (
    <group>
      {/* Layer 1: Near Mountain Ridge (Deep Sunset Burgundy / Terracotta Pine Ridge) */}
      <mesh geometry={nearRidgeGeo}>
        <meshStandardMaterial
          color="#5a181e"
          roughness={0.92}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>

      {/* Layer 2: Mid-Distance Mountains (Warm Burnt Crimson / Terracotta Saw-Tooth Peaks) */}
      <mesh geometry={midMtnGeo}>
        <meshStandardMaterial
          color="#9c3220"
          roughness={0.94}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>

      {/* Layer 3: Horizon Alpine Giants (Soft Glowing Peach / Apricot Haze Silhouettes) */}
      <mesh geometry={farAlpineGeo}>
        <meshStandardMaterial
          color="#cf6f4c"
          roughness={0.96}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
    </group>
  );
}

// High-Definition 3D Regional Highway Ribbon Generator
function createRoadRibbon(points, width = 7.8, isClosed = true) {
  const curve = new THREE.CatmullRomCurve3(points, isClosed);
  const totalLength = curve.getLength();
  // Spaced cross sections every ~4 meters for butter-smooth curvature
  const segments = Math.max(50, Math.floor(totalLength / 4.0));
  const curvePoints = curve.getSpacedPoints(segments);

  const roadVertices = [];
  const roadIndices = [];
  const roadUVs = [];

  const shoulderVertices = [];
  const shoulderIndices = [];

  const stripeVertices = [];
  const stripeIndices = [];

  const edgeVertices = [];
  const edgeIndices = [];

  const halfW = width * 0.5;
  const shoulderExtra = 1.6;
  const stripeHalfW = 0.16;
  const baseElev = 0.55; // Elevated roadbed above terrain polygon facets

  for (let i = 0; i < curvePoints.length; i++) {
    const curr = curvePoints[i];
    let tangent = new THREE.Vector3();

    if (isClosed) {
      const prev = curvePoints[(i - 1 + curvePoints.length) % curvePoints.length];
      const next = curvePoints[(i + 1) % curvePoints.length];
      tangent.subVectors(next, prev);
    } else {
      if (i === 0) {
        tangent.subVectors(curvePoints[1], curr);
      } else if (i === curvePoints.length - 1) {
        tangent.subVectors(curr, curvePoints[i - 1]);
      } else {
        tangent.subVectors(curvePoints[i + 1], curvePoints[i - 1]);
      }
    }

    if (tangent.lengthSq() < 0.00001) {
      tangent.set(0, 0, 1);
    } else {
      tangent.normalize();
    }

    let normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    if (normal.lengthSq() < 0.00001) {
      normal.set(1, 0, 0);
    } else {
      normal.normalize();
    }

    // 1. Asphalt Deck Cross Section
    const leftP = curr.clone().addScaledVector(normal, halfW);
    const rightP = curr.clone().addScaledVector(normal, -halfW);
    const yLeft = getTerrainHeight(leftP.x, leftP.z) + baseElev;
    const yRight = getTerrainHeight(rightP.x, rightP.z) + baseElev;
    const yCenter = (yLeft + yRight) * 0.5;

    roadVertices.push(
      Number.isFinite(leftP.x) ? leftP.x : 0,
      Number.isFinite(yLeft) ? yLeft : 0,
      Number.isFinite(leftP.z) ? leftP.z : 0
    );
    roadVertices.push(
      Number.isFinite(rightP.x) ? rightP.x : 0,
      Number.isFinite(yRight) ? yRight : 0,
      Number.isFinite(rightP.z) ? rightP.z : 0
    );

    const v = (i / segments) * (totalLength / 6.0);
    roadUVs.push(0, Number.isFinite(v) ? v : 0);
    roadUVs.push(1, Number.isFinite(v) ? v : 0);

    // 2. Beveled Gravel Shoulder Embankment (Slopes down to terrain)
    const outLeftP = curr.clone().addScaledVector(normal, halfW + shoulderExtra);
    const outRightP = curr.clone().addScaledVector(normal, -(halfW + shoulderExtra));
    const yOutLeft = getTerrainHeight(outLeftP.x, outLeftP.z) + 0.15;
    const yOutRight = getTerrainHeight(outRightP.x, outRightP.z) + 0.15;

    shoulderVertices.push(
      Number.isFinite(outLeftP.x) ? outLeftP.x : 0,
      Number.isFinite(yOutLeft) ? yOutLeft : 0,
      Number.isFinite(outLeftP.z) ? outLeftP.z : 0
    );
    shoulderVertices.push(
      Number.isFinite(leftP.x) ? leftP.x : 0,
      Number.isFinite(yLeft) ? yLeft : 0,
      Number.isFinite(leftP.z) ? leftP.z : 0
    );
    shoulderVertices.push(
      Number.isFinite(rightP.x) ? rightP.x : 0,
      Number.isFinite(yRight) ? yRight : 0,
      Number.isFinite(rightP.z) ? rightP.z : 0
    );
    shoulderVertices.push(
      Number.isFinite(outRightP.x) ? outRightP.x : 0,
      Number.isFinite(yOutRight) ? yOutRight : 0,
      Number.isFinite(outRightP.z) ? outRightP.z : 0
    );

    // 3. Dashed Amber Centerline
    const stripeLeft = curr.clone().addScaledVector(normal, stripeHalfW);
    const stripeRight = curr.clone().addScaledVector(normal, -stripeHalfW);
    stripeVertices.push(
      Number.isFinite(stripeLeft.x) ? stripeLeft.x : 0,
      Number.isFinite(yCenter) ? yCenter + 0.05 : 0.05,
      Number.isFinite(stripeLeft.z) ? stripeLeft.z : 0
    );
    stripeVertices.push(
      Number.isFinite(stripeRight.x) ? stripeRight.x : 0,
      Number.isFinite(yCenter) ? yCenter + 0.05 : 0.05,
      Number.isFinite(stripeRight.z) ? stripeRight.z : 0
    );

    // 4. Solid White Fog Edge Lines
    const edgeL1 = curr.clone().addScaledVector(normal, halfW - 0.45);
    const edgeL2 = curr.clone().addScaledVector(normal, halfW - 0.22);
    const edgeR1 = curr.clone().addScaledVector(normal, -(halfW - 0.22));
    const edgeR2 = curr.clone().addScaledVector(normal, -(halfW - 0.45));

    edgeVertices.push(
      Number.isFinite(edgeL1.x) ? edgeL1.x : 0,
      Number.isFinite(yLeft) ? yLeft + 0.04 : 0.04,
      Number.isFinite(edgeL1.z) ? edgeL1.z : 0
    );
    edgeVertices.push(
      Number.isFinite(edgeL2.x) ? edgeL2.x : 0,
      Number.isFinite(yLeft) ? yLeft + 0.04 : 0.04,
      Number.isFinite(edgeL2.z) ? edgeL2.z : 0
    );
    edgeVertices.push(
      Number.isFinite(edgeR1.x) ? edgeR1.x : 0,
      Number.isFinite(yRight) ? yRight + 0.04 : 0.04,
      Number.isFinite(edgeR1.z) ? edgeR1.z : 0
    );
    edgeVertices.push(
      Number.isFinite(edgeR2.x) ? edgeR2.x : 0,
      Number.isFinite(yRight) ? yRight + 0.04 : 0.04,
      Number.isFinite(edgeR2.z) ? edgeR2.z : 0
    );

    if (i < curvePoints.length - 1) {
      // Asphalt indices
      const bIdx = i * 2;
      roadIndices.push(bIdx, bIdx + 1, bIdx + 2);
      roadIndices.push(bIdx + 1, bIdx + 3, bIdx + 2);

      // Shoulder indices
      const sIdx = i * 4;
      shoulderIndices.push(sIdx, sIdx + 1, sIdx + 4);
      shoulderIndices.push(sIdx + 1, sIdx + 5, sIdx + 4);
      shoulderIndices.push(sIdx + 2, sIdx + 3, sIdx + 6);
      shoulderIndices.push(sIdx + 3, sIdx + 7, sIdx + 6);

      // Dashed centerline: 3 segments visible, 2 segments gap
      if (i % 5 < 3) {
        stripeIndices.push(bIdx, bIdx + 1, bIdx + 2);
        stripeIndices.push(bIdx + 1, bIdx + 3, bIdx + 2);
      }

      // Edge lines
      const eIdx = i * 4;
      edgeIndices.push(eIdx, eIdx + 1, eIdx + 4);
      edgeIndices.push(eIdx + 1, eIdx + 5, eIdx + 4);
      edgeIndices.push(eIdx + 2, eIdx + 3, eIdx + 6);
      edgeIndices.push(eIdx + 3, eIdx + 7, eIdx + 6);
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const shoulderGeo = new THREE.BufferGeometry();
  shoulderGeo.setAttribute('position', new THREE.Float32BufferAttribute(shoulderVertices, 3));
  shoulderGeo.setIndex(shoulderIndices);
  shoulderGeo.computeVertexNormals();

  const stripeGeo = new THREE.BufferGeometry();
  stripeGeo.setAttribute('position', new THREE.Float32BufferAttribute(stripeVertices, 3));
  stripeGeo.setIndex(stripeIndices);
  stripeGeo.computeVertexNormals();

  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3));
  edgeGeo.setIndex(edgeIndices);
  edgeGeo.computeVertexNormals();

  return { roadGeo, shoulderGeo, stripeGeo, edgeGeo, curve };
}

// 3 Seamless Closed-Loop Regional Highway Systems
const HIGHWAY_CURVES = [
  // Highway 1: West Mountain, Firewatch & Alpine Lake Scenic Loop
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-75, 0, -25),
    new THREE.Vector3(-130, 0, -50),
    new THREE.Vector3(-210, 0, -65),
    new THREE.Vector3(-315, 0, -115),
    new THREE.Vector3(-425, 0, -165),
    new THREE.Vector3(-550, 0, -280),
    new THREE.Vector3(-670, 0, -230),
    new THREE.Vector3(-590, 0, -390),
    new THREE.Vector3(-440, 0, -430),
    new THREE.Vector3(-290, 0, -380),
    new THREE.Vector3(-170, 0, -260),
    new THREE.Vector3(-80, 0, -140)
  ], true),

  // Highway 2: East Sunfire Solar Steppe Expressway Loop
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(115, 0, 75),
    new THREE.Vector3(215, 0, 165),
    new THREE.Vector3(325, 0, 245),
    new THREE.Vector3(445, 0, 315),
    new THREE.Vector3(575, 0, 425),
    new THREE.Vector3(705, 0, 365),
    new THREE.Vector3(785, 0, 405),
    new THREE.Vector3(725, 0, 265),
    new THREE.Vector3(585, 0, 185),
    new THREE.Vector3(415, 0, 155),
    new THREE.Vector3(265, 0, 95),
    new THREE.Vector3(125, 0, 35)
  ], true),

  // Highway 3: South Alpine Lake Shoreline & Hybrid Plains Circuit
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-50, 0, 70),
    new THREE.Vector3(-105, 0, 125),
    new THREE.Vector3(-170, 0, 195),
    new THREE.Vector3(-240, 0, 265),
    new THREE.Vector3(-190, 0, 345),
    new THREE.Vector3(-45, 0, 365),
    new THREE.Vector3(65, 0, 325),
    new THREE.Vector3(125, 0, 215),
    new THREE.Vector3(70, 0, 115)
  ], true)
];

// Central Substation Roundabout Interchange Hub
function SubstationInterchange() {
  const geo = useMemo(() => {
    const ring = new THREE.RingGeometry(18, 38, 48);
    ring.rotateX(-Math.PI / 2);
    const pos = ring.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getTerrainHeight(x, z) + 0.54);
    }
    ring.computeVertexNormals();
    return ring;
  }, []);

  return (
    <group>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial
          color="#1f242d"
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </group>
  );
}

// Island Road Networks with 3D Asphalt Deck, Beveled Shoulders & Dual Striping
function IslandRoads() {
  const roadData = useMemo(() => {
    return [
      createRoadRibbon(HIGHWAY_CURVES[0].points, 8.0, true),
      createRoadRibbon(HIGHWAY_CURVES[1].points, 8.0, true),
      createRoadRibbon(HIGHWAY_CURVES[2].points, 7.6, true)
    ];
  }, []);

  return (
    <group>
      {/* Central Substation Interchange Hub */}
      <SubstationInterchange />

      {roadData.map((rd, i) => (
        <group key={`road_net_${i}`}>
          {/* Beveled Crushed-Stone Shoulder Embankment */}
          <mesh geometry={rd.shoulderGeo} receiveShadow>
            <meshStandardMaterial color="#334155" roughness={0.96} />
          </mesh>

          {/* Elevated Asphalt Highway Deck (Never clips into terrain) */}
          <mesh geometry={rd.roadGeo} receiveShadow>
            <meshStandardMaterial
              color="#1f242d"
              roughness={0.88}
              metalness={0.08}
              polygonOffset
              polygonOffsetFactor={-4}
              polygonOffsetUnits={-4}
            />
          </mesh>

          {/* Solid White Outer Fog Lines */}
          <mesh geometry={rd.edgeGeo}>
            <meshBasicMaterial color="#f8fafc" />
          </mesh>

          {/* Dashed Amber-Yellow Centerline */}
          <mesh geometry={rd.stripeGeo}>
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Active Living Traffic: Utility Vans, Haulers, 4x4 Rangers & Commercial EVs
function TrafficVehicles() {
  const van1Ref = useRef();
  const truck1Ref = useRef();
  const rover1Ref = useRef();
  const haulerRef = useRef();
  const van2Ref = useRef();
  const flatbedRef = useRef();
  const suv1Ref = useRef();
  const truck2Ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    const updateCar = (ref, curve, speed, offset, laneOffset = 2.0, isReverse = false) => {
      if (!ref.current || !curve) return;

      let progress = (offset + t * speed) % 1.0;
      if (progress < 0) progress += 1.0;
      if (isReverse) {
        progress = (1.0 - progress) % 1.0;
      }

      const p = curve.getPointAt(progress);
      const tangent = curve.getTangentAt(progress).normalize();
      if (isReverse) tangent.negate();

      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Right-hand lane positioning
      const carPos = p.clone().addScaledVector(normal, laneOffset);
      const roadElevation = 0.55;
      carPos.y = getTerrainHeight(carPos.x, carPos.z) + roadElevation + 0.35;

      // Lookahead point for slope pitch & directional alignment
      const lookDelta = isReverse ? -0.005 : 0.005;
      const nextProgress = (progress + lookDelta + 1.0) % 1.0;
      const pNext = curve.getPointAt(nextProgress);
      const lookPos = pNext.clone().addScaledVector(normal, laneOffset);
      lookPos.y = getTerrainHeight(lookPos.x, lookPos.z) + roadElevation + 0.35;

      ref.current.position.copy(carPos);
      ref.current.lookAt(lookPos);
    };

    // Route 1 (West Mountain & Lake Scenic Highway)
    updateCar(van1Ref, HIGHWAY_CURVES[0], 0.022, 0.08, 2.0, false);
    updateCar(truck1Ref, HIGHWAY_CURVES[0], 0.016, 0.55, 2.0, false);
    updateCar(rover1Ref, HIGHWAY_CURVES[0], 0.025, 0.28, 2.0, true); // Oncoming traffic

    // Route 2 (East Sunfire Solar Steppe Expressway)
    updateCar(haulerRef, HIGHWAY_CURVES[1], 0.015, 0.12, 2.0, false);
    updateCar(van2Ref, HIGHWAY_CURVES[1], 0.024, 0.62, 2.0, false);
    updateCar(flatbedRef, HIGHWAY_CURVES[1], 0.018, 0.36, 2.0, true); // Oncoming traffic

    // Route 3 (South Coastal Plains Circuit)
    updateCar(suv1Ref, HIGHWAY_CURVES[2], 0.021, 0.18, 1.9, false);
    updateCar(truck2Ref, HIGHWAY_CURVES[2], 0.017, 0.68, 1.9, true); // Oncoming traffic
  });

  return (
    <group>
      {/* 1. Wind Turbine Service Van (White with Amber Lightbar) */}
      <group ref={van1Ref}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[2.2, 1.4, 4.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.25, 0.8]}>
          <boxGeometry args={[2.0, 0.65, 1.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.75, -0.4]}>
          <boxGeometry args={[1.2, 0.2, 0.4]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {/* Headlights */}
        <mesh position={[-0.8, 0.7, 2.22]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.8, 0.7, 2.22]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        {/* Taillights */}
        <mesh position={[-0.8, 0.7, -2.22]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.8, 0.7, -2.22]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Wheels */}
        {[-1.15, 1.15].map((x) =>
          [-1.3, 1.3].map((z, idx) => (
            <mesh key={`van1_w_${x}_${z}_${idx}`} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.35, 0.35, 0.28, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>

      {/* 2. Heavy Wind Crane & Maintenance Truck */}
      <group ref={truck1Ref}>
        <mesh position={[0, 1.2, 1.0]} castShadow>
          <boxGeometry args={[2.5, 1.8, 2.6]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.7, -1.5]} castShadow>
          <boxGeometry args={[2.4, 0.6, 3.8]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.5, -1.5]} castShadow>
          <boxGeometry args={[2.1, 1.0, 3.2]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.2, 1.0]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {/* Headlights */}
        <mesh position={[-0.9, 0.75, 2.32]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.9, 0.75, 2.32]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        {/* Taillights */}
        <mesh position={[-0.9, 0.7, -3.42]}>
          <boxGeometry args={[0.35, 0.2, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.9, 0.7, -3.42]}>
          <boxGeometry args={[0.35, 0.2, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Wheels */}
        {[-1.25, 1.25].map((x) =>
          [-2.2, -0.8, 1.2].map((z, idx) => (
            <mesh key={`truck1_w_${x}_${z}_${idx}`} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.45, 0.45, 0.35, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>

      {/* 3. Highland Energy Ranger 4x4 SUV (Oncoming Mountain Traffic) */}
      <group ref={rover1Ref}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[2.1, 1.3, 4.2]} />
          <meshStandardMaterial color="#15803d" roughness={0.3} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.25, 0.3]}>
          <boxGeometry args={[1.9, 0.65, 2.0]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} />
        </mesh>
        {/* Roof Cargo Rack */}
        <mesh position={[0, 1.65, 0.3]}>
          <boxGeometry args={[1.6, 0.1, 1.8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Headlights & Taillights */}
        <mesh position={[-0.75, 0.7, 2.12]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.75, 0.7, 2.12]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[-0.75, 0.7, -2.12]}>
          <boxGeometry args={[0.25, 0.16, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.75, 0.7, -2.12]}>
          <boxGeometry args={[0.25, 0.16, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* 4x4 Rugged Wheels */}
        {[-1.1, 1.1].map((x) =>
          [-1.25, 1.25].map((z, idx) => (
            <mesh key={`rover1_w_${x}_${z}_${idx}`} position={[x, 0.38, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.38, 0.3, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>

      {/* 4. Mega Battery Logistics Hauler with Glowing Modules */}
      <group ref={haulerRef}>
        <mesh position={[0, 1.3, 2.2]} castShadow>
          <boxGeometry args={[2.6, 2.0, 2.8]} />
          <meshStandardMaterial color="#0369a1" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.6, -1.8]} castShadow>
          <boxGeometry args={[2.6, 0.5, 7.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        {/* Battery Container Cargo 1 */}
        <mesh position={[0, 1.5, -0.3]} castShadow>
          <boxGeometry args={[2.3, 1.3, 2.8]} />
          <meshStandardMaterial color="#0f766e" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Battery Container Cargo 2 */}
        <mesh position={[0, 1.5, -3.4]} castShadow>
          <boxGeometry args={[2.3, 1.3, 2.8]} />
          <meshStandardMaterial color="#0f766e" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Glowing Status LED Strips */}
        <mesh position={[1.18, 1.5, -0.3]}>
          <boxGeometry args={[0.04, 0.15, 2.0]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
        <mesh position={[1.18, 1.5, -3.4]}>
          <boxGeometry args={[0.04, 0.15, 2.0]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
        {/* Headlights & Taillights */}
        <mesh position={[-0.95, 0.8, 3.62]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.95, 0.8, 3.62]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[-0.95, 0.7, -5.42]}>
          <boxGeometry args={[0.4, 0.2, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.95, 0.7, -5.42]}>
          <boxGeometry args={[0.4, 0.2, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Heavy Double Wheels */}
        {[-1.3, 1.3].map((x) =>
          [-4.5, -3.2, 1.2, 2.6].map((z, idx) => (
            <mesh key={`hauler_w_${x}_${z}_${idx}`} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.45, 0.45, 0.35, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>

      {/* 5. Solar Tech Rapid Response Van */}
      <group ref={van2Ref}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[2.2, 1.4, 4.4]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.25, 0.8]}>
          <boxGeometry args={[2.0, 0.65, 1.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.75, -0.4]}>
          <boxGeometry args={[1.2, 0.2, 0.4]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Headlights & Taillights */}
        <mesh position={[-0.8, 0.7, 2.22]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.8, 0.7, 2.22]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[-0.8, 0.7, -2.22]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.8, 0.7, -2.22]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Wheels */}
        {[-1.15, 1.15].map((x) =>
          [-1.3, 1.3].map((z, idx) => (
            <mesh key={`van2_w_${x}_${z}_${idx}`} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.35, 0.35, 0.28, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>

      {/* 6. Solar Maintenance Flatbed Truck (Oncoming Solar Traffic) */}
      <group ref={flatbedRef}>
        <mesh position={[0, 1.15, 1.2]} castShadow>
          <boxGeometry args={[2.4, 1.6, 2.4]} />
          <meshStandardMaterial color="#ea580c" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.65, -1.2]} castShadow>
          <boxGeometry args={[2.4, 0.5, 4.2]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
        {/* Inverter Crate Cargo */}
        <mesh position={[0, 1.35, -1.2]} castShadow>
          <boxGeometry args={[1.8, 1.0, 3.2]} />
          <meshStandardMaterial color="#475569" roughness={0.4} />
        </mesh>
        {/* Headlights & Taillights */}
        <mesh position={[-0.85, 0.7, 2.42]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.85, 0.7, 2.42]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[-0.85, 0.7, -3.32]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.85, 0.7, -3.32]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Wheels */}
        {[-1.2, 1.2].map((x) =>
          [-2.2, -0.6, 1.4].map((z, idx) => (
            <mesh key={`flatbed_w_${x}_${z}_${idx}`} position={[x, 0.42, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.42, 0.42, 0.32, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>

      {/* 7. Clean Energy Ranger SUV (South Loop) */}
      <group ref={suv1Ref}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[2.1, 1.3, 4.2]} />
          <meshStandardMaterial color="#059669" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0, 1.2, 0.4]}>
          <boxGeometry args={[1.9, 0.6, 1.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} />
        </mesh>
        {/* Headlights & Taillights */}
        <mesh position={[-0.75, 0.65, 2.12]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.75, 0.65, 2.12]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[-0.75, 0.65, -2.12]}>
          <boxGeometry args={[0.25, 0.16, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.75, 0.65, -2.12]}>
          <boxGeometry args={[0.25, 0.16, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Wheels */}
        {[-1.1, 1.1].map((x) =>
          [-1.25, 1.25].map((z, idx) => (
            <mesh key={`suv1_w_${x}_${z}_${idx}`} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.35, 0.35, 0.28, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>

      {/* 8. Power Grid Transmission Utility Truck (Oncoming South Traffic) */}
      <group ref={truck2Ref}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[2.2, 1.4, 4.6]} />
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.35, 0.8]}>
          <boxGeometry args={[2.0, 0.65, 1.4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} />
        </mesh>
        {/* Hydraulic Service Bucket Arm */}
        <mesh position={[0, 1.95, -0.6]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.6, 0.4, 2.6]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.5} />
        </mesh>
        {/* Headlights & Taillights */}
        <mesh position={[-0.8, 0.75, 2.32]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.8, 0.75, 2.32]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[-0.8, 0.75, -2.32]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0.8, 0.75, -2.32]}>
          <boxGeometry args={[0.3, 0.18, 0.06]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        {/* Wheels */}
        {[-1.15, 1.15].map((x) =>
          [-1.4, 1.4].map((z, idx) => (
            <mesh key={`truck2_w_${x}_${z}_${idx}`} position={[x, 0.4, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.4, 0.4, 0.3, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}

// Procedural Deterministic Firewatch Dense Forest Locations
function getVegetationLocations() {
  const locations = [];
  let seed = 1337;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  let pineCount = 0;
  let decCount = 0;
  let shrubCount = 0;

  for (let i = 0; i < 7500; i++) {
    const angle = random() * Math.PI * 2;
    const rad = Math.sqrt(random()) * 1050;
    const x = Math.cos(angle) * rad;
    const z = Math.sin(angle) * rad;

    const falloff = getIslandFalloff(x, z);
    if (falloff < 0.94) continue;

    // Keep clearings around central substation
    if (Math.hypot(x, z) < 56) continue;

    // Lake clearing (preserve water & immediate shoreline)
    const distLake = Math.hypot(x - ALPINE_LAKE_CENTER.x, z - ALPINE_LAKE_CENTER.z);
    if (distLake < ALPINE_LAKE_CENTER.radius + 6) continue;

    // Keep building clearance around all 24 energy sites
    let tooCloseToSite = false;
    for (let s = 0; s < KNOWN_SITES.length; s++) {
      if (Math.hypot(x - KNOWN_SITES[s].x, z - KNOWN_SITES[s].z) < 46) {
        tooCloseToSite = true;
        break;
      }
    }
    if (tooCloseToSite) continue;

    const y = getTerrainHeight(x, z);
    if (y > 70) continue; // Stay below highest summit crags

    // Biome determination matching Firewatch national forest distribution
    let type = 'pine';
    const isWesternHighlands = x < -45;
    const isNearTower = Math.hypot(x - (-230), z - (-15)) < 190;
    const isNearLake = distLake < 170;

    if (isWesternHighlands || isNearTower || isNearLake || y > 24) {
      // Dense highland coniferous forest (92% pine)
      type = random() > 0.08 ? 'pine' : 'deciduous';
    } else if (x > 140 && z > 60) {
      // Eastern solar savanna & dunes
      type = random() > 0.55 ? 'shrub' : random() > 0.4 ? 'deciduous' : 'pine';
    } else {
      // Central hybrid valley meadows
      type = random() > 0.45 ? 'pine' : random() > 0.4 ? 'deciduous' : 'shrub';
    }

    if (type === 'pine' && pineCount >= 2800) continue;
    if (type === 'deciduous' && decCount >= 550) continue;
    if (type === 'shrub' && shrubCount >= 350) continue;

    if (type === 'pine') pineCount++;
    else if (type === 'deciduous') decCount++;
    else if (type === 'shrub') shrubCount++;

    const scale = 0.85 + random() * 0.75; // Scale heights from 6m to 15m
    const rotY = random() * Math.PI * 2;

    locations.push({ x, y, z, scale, rotY, type });
    if (pineCount >= 2800 && decCount >= 550 && shrubCount >= 350) break;
  }
  return locations;
}

// Lush 3D Firewatch Nature: 4-Tier Coniferous Pines, Valley Trees & Shrubs with Seasonal Foliage
function IslandVegetation({ season = 'summer' }) {
  const pineTrunkRef = useRef();
  const pineFoliageRef = useRef();
  const decTrunkRef = useRef();
  const decFoliageRef = useRef();
  const shrubRef = useRef();

  const decFoliageColor = useMemo(() => {
    if (season === 'autumn') return '#ea580c'; // Vibrant warm Autumn orange
    if (season === 'winter') return '#64748b'; // Muted frosted winter slate
    if (season === 'spring') return '#16a34a'; // Fresh bright spring emerald
    return '#2d7a36'; // Rich summer green
  }, [season]);

  const pineFoliageColor = useMemo(() => {
    if (season === 'winter') return '#164e63'; // Frosted spruce with blue-green undertone
    if (season === 'autumn') return '#15803d';
    return '#143c26';
  }, [season]);

  const shrubColor = useMemo(() => {
    if (season === 'autumn') return '#d97706'; // Golden autumn shrubs
    if (season === 'winter') return '#64748b'; // Frosted winter heather
    if (season === 'spring') return '#84cc16'; // Vivid lime spring bloom
    return '#65a30d';
  }, [season]);

  const vegData = useMemo(() => getVegetationLocations(), []);

  const pineTrunkGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.24, 0.44, 2.6, 5);
    geo.translate(0, 1.3, 0);
    return geo;
  }, []);

  // 4-Tier Stepped Conical Pine Foliage Geometry (Signature Firewatch Fir/Spruce Tree)
  const pineFoliageGeo = useMemo(() => {
    const t1 = new THREE.ConeGeometry(3.0, 2.8, 6);
    t1.translate(0, 2.0, 0);

    const t2 = new THREE.ConeGeometry(2.4, 2.5, 6);
    t2.translate(0, 3.6, 0);

    const t3 = new THREE.ConeGeometry(1.7, 2.2, 6);
    t3.translate(0, 5.1, 0);

    const t4 = new THREE.ConeGeometry(0.95, 2.0, 6);
    t4.translate(0, 6.5, 0);

    return BufferGeometryUtils.mergeGeometries([t1, t2, t3, t4]);
  }, []);

  const decTrunkGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.28, 0.45, 2.2, 5);
    geo.translate(0, 1.1, 0);
    return geo;
  }, []);

  const decFoliageGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(2.2, 1);
    geo.translate(0, 3.8, 0);
    return geo;
  }, []);

  const shrubGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1.4, 0);
    geo.scale(1.3, 0.75, 1.3);
    geo.translate(0, 0.7, 0);
    return geo;
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    let pCount = 0;
    let dCount = 0;
    let sCount = 0;

    vegData.forEach((item) => {
      dummy.position.set(item.x, item.y, item.z);
      dummy.rotation.set(0, item.rotY, 0);
      dummy.scale.set(item.scale, item.scale, item.scale);
      dummy.updateMatrix();

      if (item.type === 'pine') {
        if (pineTrunkRef.current && pineFoliageRef.current) {
          pineTrunkRef.current.setMatrixAt(pCount, dummy.matrix);
          pineFoliageRef.current.setMatrixAt(pCount, dummy.matrix);
          pCount++;
        }
      } else if (item.type === 'deciduous') {
        if (decTrunkRef.current && decFoliageRef.current) {
          decTrunkRef.current.setMatrixAt(dCount, dummy.matrix);
          decFoliageRef.current.setMatrixAt(dCount, dummy.matrix);
          dCount++;
        }
      } else if (item.type === 'shrub') {
        if (shrubRef.current) {
          shrubRef.current.setMatrixAt(sCount, dummy.matrix);
          sCount++;
        }
      }
    });

    if (pineTrunkRef.current) {
      pineTrunkRef.current.instanceMatrix.needsUpdate = true;
      pineTrunkRef.current.count = pCount;
    }
    if (pineFoliageRef.current) {
      pineFoliageRef.current.instanceMatrix.needsUpdate = true;
      pineFoliageRef.current.count = pCount;
    }
    if (decTrunkRef.current) {
      decTrunkRef.current.instanceMatrix.needsUpdate = true;
      decTrunkRef.current.count = dCount;
    }
    if (decFoliageRef.current) {
      decFoliageRef.current.instanceMatrix.needsUpdate = true;
      decFoliageRef.current.count = dCount;
    }
    if (shrubRef.current) {
      shrubRef.current.instanceMatrix.needsUpdate = true;
      shrubRef.current.count = sCount;
    }
  }, [vegData]);

  return (
    <group>
      {/* 4-Tier Firewatch Coniferous Pines */}
      <instancedMesh
        ref={pineTrunkRef}
        args={[pineTrunkGeo, null, 3000]}
        castShadow
      >
        <meshStandardMaterial color="#3b1d12" roughness={0.92} />
      </instancedMesh>
      <instancedMesh
        ref={pineFoliageRef}
        args={[pineFoliageGeo, null, 3000]}
        castShadow
      >
        <meshStandardMaterial color={pineFoliageColor} roughness={0.84} />
      </instancedMesh>

      {/* Deciduous Valley Trees */}
      <instancedMesh
        ref={decTrunkRef}
        args={[decTrunkGeo, null, 700]}
        castShadow
      >
        <meshStandardMaterial color="#6b3414" roughness={0.9} />
      </instancedMesh>
      <instancedMesh
        ref={decFoliageRef}
        args={[decFoliageGeo, null, 700]}
        castShadow
      >
        <meshStandardMaterial color={decFoliageColor} roughness={0.78} />
      </instancedMesh>

      {/* Flowering Meadow Shrubs */}
      <instancedMesh
        ref={shrubRef}
        args={[shrubGeo, null, 500]}
        castShadow
      >
        <meshStandardMaterial color={shrubColor} roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

// Atmospheric Drifting Sky Clouds (Warm Sunset in Day, Moonlit Slate at Night)
function AtmosphericClouds({ isNight = false }) {
  const cloudsGroupRef = useRef();

  const clouds = useMemo(() => {
    const list = [];
    for (let i = 0; i < 12; i++) {
      list.push({
        x: (Math.random() - 0.5) * 2400,
        y: 210 + Math.random() * 70,
        z: (Math.random() - 0.5) * 2400,
        scale: 1.3 + Math.random() * 1.6,
        speed: 2.2 + Math.random() * 3.2
      });
    }
    return list;
  }, []);

  useFrame((_, delta) => {
    if (!cloudsGroupRef.current) return;
    cloudsGroupRef.current.children.forEach((cloudMesh, i) => {
      const c = clouds[i];
      cloudMesh.position.x += delta * c.speed;
      if (cloudMesh.position.x > 1400) {
        cloudMesh.position.x = -1400;
      }
    });
  });

  const mainColor = isNight ? '#334155' : '#fff1e6';
  const subColor = isNight ? '#1e293b' : '#fed7aa';
  const opacityMain = isNight ? 0.65 : 0.88;
  const opacitySub = isNight ? 0.58 : 0.85;

  return (
    <group ref={cloudsGroupRef}>
      {clouds.map((c, idx) => (
        <group key={idx} position={[c.x, c.y, c.z]} scale={c.scale}>
          <mesh position={[0, 0, 0]} castShadow={!isNight}>
            <sphereGeometry args={[28, 8, 8]} />
            <meshStandardMaterial color={mainColor} roughness={0.9} transparent opacity={opacityMain} />
          </mesh>
          <mesh position={[22, -4, 6]}>
            <sphereGeometry args={[20, 8, 8]} />
            <meshStandardMaterial color={subColor} roughness={0.9} transparent opacity={opacitySub} />
          </mesh>
          <mesh position={[-20, -3, -5]}>
            <sphereGeometry args={[22, 8, 8]} />
            <meshStandardMaterial color={subColor} roughness={0.9} transparent opacity={opacitySub} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Iconic Firewatch Lookout Tower on the Western Mountain Ridge
function FirewatchTower({ position = [-230, 0, -15] }) {
  const [posX, , posZ] = position;
  const groundY = getTerrainHeight(posX, posZ);
  const towerH = 22.0;
  const anemometerRef = useRef();

  useFrame(({ clock }) => {
    if (anemometerRef.current) {
      anemometerRef.current.rotation.y = clock.getElapsedTime() * 4.5;
    }
  });

  // 3 Rustic Wooden Telegraph Poles Descending down the Mountain Ridge into the Pines
  const poles = useMemo(() => {
    const poleOffsets = [
      { dx: 38, dz: 26 },
      { dx: 86, dz: 62 },
      { dx: 142, dz: 104 }
    ];
    return poleOffsets.map((off) => {
      const px = posX + off.dx;
      const pz = posZ + off.dz;
      const py = getTerrainHeight(px, pz);
      return { x: px, y: py, z: pz };
    });
  }, [posX, posZ]);

  // Sagging Telephone/Power Wires connecting Cabin to Pole 1, Pole 2, Pole 3
  const wireGeometries = useMemo(() => {
    const geos = [];
    const cabinPoint = new THREE.Vector3(2.4, 24.5, 0);

    // Wire 1: Tower to Pole 1
    const p1 = new THREE.Vector3(poles[0].x - posX, poles[0].y - groundY + 7.6, poles[0].z - posZ);
    const mid1 = new THREE.Vector3(
      (cabinPoint.x + p1.x) * 0.5,
      (cabinPoint.y + p1.y) * 0.5 - 3.4,
      (cabinPoint.z + p1.z) * 0.5
    );
    geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([cabinPoint, mid1, p1]), 24, 0.045, 5, false));

    // Wire 2: Pole 1 to Pole 2
    const p2 = new THREE.Vector3(poles[1].x - posX, poles[1].y - groundY + 7.6, poles[1].z - posZ);
    const mid2 = new THREE.Vector3(
      (p1.x + p2.x) * 0.5,
      (p1.y + p2.y) * 0.5 - 2.8,
      (p1.z + p2.z) * 0.5
    );
    geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p1, mid2, p2]), 24, 0.045, 5, false));

    // Wire 3: Pole 2 to Pole 3
    const p3 = new THREE.Vector3(poles[2].x - posX, poles[2].y - groundY + 7.6, poles[2].z - posZ);
    const mid3 = new THREE.Vector3(
      (p2.x + p3.x) * 0.5,
      (p2.y + p3.y) * 0.5 - 2.8,
      (p2.z + p3.z) * 0.5
    );
    geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p2, mid3, p3]), 24, 0.045, 5, false));

    return geos;
  }, [posX, groundY, posZ, poles]);

  return (
    <group position={[posX, groundY, posZ]}>
      {/* 4 Concrete Pier Footings */}
      {[-3.6, 3.6].map((x) =>
        [-3.6, 3.6].map((z, idx) => (
          <mesh key={`pier_${x}_${z}_${idx}`} position={[x, 0.5, z]}>
            <boxGeometry args={[1.4, 1.0, 1.4]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
        ))
      )}

      {/* 4 Main Heavy Timber Truss Columns tapering upward */}
      {[
        { bx: -3.6, bz: -3.6, tx: -2.4, tz: -2.4 },
        { bx: 3.6, bz: -3.6, tx: 2.4, tz: -2.4 },
        { bx: 3.6, bz: 3.6, tx: 2.4, tz: 2.4 },
        { bx: -3.6, bz: 3.6, tx: -2.4, tz: 2.4 }
      ].map((leg, idx) => {
        const midX = (leg.bx + leg.tx) * 0.5;
        const midZ = (leg.bz + leg.tz) * 0.5;
        const dx = leg.tx - leg.bx;
        const dz = leg.tz - leg.bz;
        return (
          <mesh
            key={`leg_${idx}`}
            position={[midX, towerH * 0.5, midZ]}
            rotation={[dz * 0.05, 0, -dx * 0.05]}
            castShadow
          >
            <boxGeometry args={[0.42, towerH, 0.42]} />
            <meshStandardMaterial color="#3f1d1d" roughness={0.85} />
          </mesh>
        );
      })}

      {/* 4-Tier Horizontal Struts and Cross X-Bracing */}
      {[5.5, 11.0, 16.5, 21.8].map((h, lvl) => {
        const spread = 7.2 - lvl * 0.6;
        return (
          <group key={`tier_${lvl}`} position={[0, h, 0]}>
            {/* Horizontal Perimeter Beams */}
            <mesh position={[0, 0, -spread * 0.5]}>
              <boxGeometry args={[spread, 0.32, 0.32]} />
              <meshStandardMaterial color="#451a03" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0, spread * 0.5]}>
              <boxGeometry args={[spread, 0.32, 0.32]} />
              <meshStandardMaterial color="#451a03" roughness={0.85} />
            </mesh>
            <mesh position={[-spread * 0.5, 0, 0]}>
              <boxGeometry args={[0.32, 0.32, spread]} />
              <meshStandardMaterial color="#451a03" roughness={0.85} />
            </mesh>
            <mesh position={[spread * 0.5, 0, 0]}>
              <boxGeometry args={[0.32, 0.32, spread]} />
              <meshStandardMaterial color="#451a03" roughness={0.85} />
            </mesh>
            {/* X-Diagonal Bracing between tiers */}
            {lvl > 0 && (
              <>
                <mesh position={[0, -2.75, -spread * 0.5]} rotation={[0, 0, 0.72]}>
                  <boxGeometry args={[7.2, 0.16, 0.16]} />
                  <meshStandardMaterial color="#451a03" roughness={0.9} />
                </mesh>
                <mesh position={[0, -2.75, -spread * 0.5]} rotation={[0, 0, -0.72]}>
                  <boxGeometry args={[7.2, 0.16, 0.16]} />
                  <meshStandardMaterial color="#451a03" roughness={0.9} />
                </mesh>
                <mesh position={[0, -2.75, spread * 0.5]} rotation={[0, 0, 0.72]}>
                  <boxGeometry args={[7.2, 0.16, 0.16]} />
                  <meshStandardMaterial color="#451a03" roughness={0.9} />
                </mesh>
                <mesh position={[0, -2.75, spread * 0.5]} rotation={[0, 0, -0.72]}>
                  <boxGeometry args={[7.2, 0.16, 0.16]} />
                  <meshStandardMaterial color="#451a03" roughness={0.9} />
                </mesh>
              </>
            )}
          </group>
        );
      })}

      {/* Switchback Wooden Ladder / Service Access */}
      <mesh position={[0, 10.9, -1.8]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.9, 22.0, 0.12]} />
        <meshStandardMaterial color="#27130b" roughness={0.9} />
      </mesh>

      {/* Observation Deck Platform */}
      <mesh position={[0, towerH, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.2, 0.4, 7.2]} />
        <meshStandardMaterial color="#5c2d1b" roughness={0.85} />
      </mesh>

      {/* Deck Perimeter Railing */}
      {[-3.4, 3.4].map((z, idx) => (
        <mesh key={`rail_z_${idx}`} position={[0, towerH + 1.1, z]}>
          <boxGeometry args={[7.0, 0.12, 0.12]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
      {[-3.4, 3.4].map((x, idx) => (
        <mesh key={`rail_x_${idx}`} position={[x, towerH + 1.1, 0]}>
          <boxGeometry args={[0.12, 0.12, 7.0]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
      {/* Railing Corner and Baluster Posts */}
      {[-3.4, 0, 3.4].map((x) =>
        [-3.4, 3.4].map((z, idx) => (
          <mesh key={`post_${x}_${z}_${idx}`} position={[x, towerH + 0.55, z]}>
            <boxGeometry args={[0.16, 1.1, 0.16]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        ))
      )}

      {/* Lookout Cabin: Lower Timber Cladding */}
      <mesh position={[0, towerH + 0.8, 0]} castShadow>
        <boxGeometry args={[4.8, 1.2, 4.8]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>

      {/* Lookout Cabin: 360-degree Glass Observation Ribbon */}
      <mesh position={[0, towerH + 2.2, 0]}>
        <boxGeometry args={[4.6, 1.6, 4.6]} />
        <meshStandardMaterial
          color="#fed7aa"
          roughness={0.1}
          metalness={0.4}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Cabin Corner Window Posts */}
      {[-2.3, 2.3].map((x) =>
        [-2.3, 2.3].map((z, idx) => (
          <mesh key={`win_post_${x}_${z}_${idx}`} position={[x, towerH + 2.2, z]}>
            <boxGeometry args={[0.22, 1.6, 0.22]} />
            <meshStandardMaterial color="#3f1d1d" roughness={0.8} />
          </mesh>
        ))
      )}

      {/* Cozy Interior Lantern / Cabin Glow */}
      <pointLight
        position={[0, towerH + 2.2, 0]}
        color="#fbbf24"
        intensity={3.5}
        distance={50}
        decay={2}
      />
      <mesh position={[0, towerH + 2.2, 0]}>
        <sphereGeometry args={[0.32, 8, 8]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>

      {/* Iconic Crimson Pyramid Hipped Roof */}
      <mesh position={[0, towerH + 4.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[4.4, 2.2, 4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.75} />
      </mesh>

      {/* Roof Apex Cupola Vent */}
      <mesh position={[0, towerH + 5.5, 0]}>
        <boxGeometry args={[0.9, 0.5, 0.9]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
      </mesh>

      {/* Antenna Mast & Lightning Rod */}
      <mesh position={[0, towerH + 8.2, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 5.0, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Rotating Anemometer at Top of Mast */}
      <group ref={anemometerRef} position={[0, towerH + 10.7, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
          <meshBasicMaterial color="#cbd5e1" />
        </mesh>
        <mesh position={[0.6, 0, 0]}>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[-0.6, 0, 0]}>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* 3 Sagging Telephone/Power Wires Down to Poles in the Forest */}
      {wireGeometries.map((wGeo, i) => (
        <mesh key={`wire_${i}`} geometry={wGeo}>
          <meshBasicMaterial color="#18181b" />
        </mesh>
      ))}

      {/* 3 Wooden Telegraph Poles Descending the Ridge */}
      {poles.map((p, pIdx) => (
        <group key={`pole_${pIdx}`} position={[p.x - posX, p.y - groundY, p.z - posZ]}>
          <mesh position={[0, 3.8, 0]}>
            <cylinderGeometry args={[0.2, 0.28, 7.6, 6]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          {/* Crossarm & Ceramic Insulators */}
          <mesh position={[0, 7.3, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[1.8, 0.16, 0.16]} />
            <meshStandardMaterial color="#3f1d1d" />
          </mesh>
          {[-0.7, 0.7].map((cx, idx) => (
            <mesh key={`insul_${pIdx}_${idx}`} position={[cx, 7.55, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.22, 6]} />
              <meshStandardMaterial color="#e2e8f0" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// Articulated Realistic Soaring Avian Bird (Sculpted Fuselage & Flapping Swept Wings)
function RealisticBird({ offset = [0, 0, 0], flapOffset = 0, scale = 1.0 }) {
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const bodyRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Natural flapping cadence: active wingbeat cycles alternating with thermal soaring glide
    const cycle = (t * 2.8 + flapOffset) % 6.4;
    const isGliding = cycle > 3.6;

    const flapAngle = isGliding
      ? 0.06 // Slight dihedral V during thermal glide
      : Math.sin(cycle * Math.PI * 2) * 0.48;

    const pitchAngle = isGliding
      ? 0.04
      : Math.cos(cycle * Math.PI * 2) * 0.12;

    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = flapAngle;
      leftWingRef.current.rotation.y = pitchAngle;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = -flapAngle;
      rightWingRef.current.rotation.y = -pitchAngle;
    }
    if (bodyRef.current) {
      bodyRef.current.rotation.x = isGliding ? 0 : Math.sin(cycle * Math.PI * 2) * 0.04;
    }
  });

  return (
    <group position={offset} scale={scale}>
      <group ref={bodyRef}>
        {/* Aerodynamic Fuselage Torso */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.34, 2.4, 7]} />
          <meshBasicMaterial color="#18181b" />
        </mesh>

        {/* Head & Pointed Beak */}
        <mesh position={[0, 0.12, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.26, 0.8, 7]} />
          <meshBasicMaterial color="#18181b" />
        </mesh>
        <mesh position={[0, 0.08, 1.95]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.1, 0.5, 5]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>

        {/* Flared Wedge Tail Fan */}
        <mesh position={[0, 0.1, -1.5]} rotation={[0.18, 0, 0]}>
          <boxGeometry args={[1.3, 0.06, 1.0]} />
          <meshBasicMaterial color="#18181b" />
        </mesh>

        {/* Articulated Left Wing */}
        <group ref={leftWingRef} position={[-0.3, 0.08, 0.3]}>
          {/* Inner Wing */}
          <mesh position={[-1.2, 0, -0.2]} rotation={[0, 0.22, 0]}>
            <boxGeometry args={[2.4, 0.08, 0.82]} />
            <meshBasicMaterial color="#18181b" />
          </mesh>
          {/* Swept Outer Wingtip */}
          <mesh position={[-2.8, 0.06, -0.6]} rotation={[0, 0.42, 0.08]}>
            <boxGeometry args={[1.8, 0.05, 0.54]} />
            <meshBasicMaterial color="#18181b" />
          </mesh>
        </group>

        {/* Articulated Right Wing */}
        <group ref={rightWingRef} position={[0.3, 0.08, 0.3]}>
          {/* Inner Wing */}
          <mesh position={[1.2, 0, -0.2]} rotation={[0, -0.22, 0]}>
            <boxGeometry args={[2.4, 0.08, 0.82]} />
            <meshBasicMaterial color="#18181b" />
          </mesh>
          {/* Swept Outer Wingtip */}
          <mesh position={[2.8, 0.06, -0.6]} rotation={[0, -0.42, -0.08]}>
            <boxGeometry args={[1.8, 0.05, 0.54]} />
            <meshBasicMaterial color="#18181b" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// Iconic V-Formation Flock Soaring Gracefully Above Firewatch Ridge & Lake
function BirdFlock() {
  const flockRef = useRef();

  // Authentic 9-bird Chevron V-Formation
  const formation = useMemo(() => [
    { offset: [0, 0, 0], flapOffset: 0.0, scale: 1.1 },       // Leader
    { offset: [-12, 1.2, -14], flapOffset: 0.7, scale: 1.0 }, // Left 1
    { offset: [-24, 2.3, -28], flapOffset: 1.4, scale: 0.95 },// Left 2
    { offset: [-36, 3.4, -42], flapOffset: 2.1, scale: 0.9 }, // Left 3
    { offset: [-48, 4.6, -56], flapOffset: 2.8, scale: 0.85 },// Left 4
    { offset: [12, 1.0, -14], flapOffset: 0.8, scale: 1.0 },  // Right 1
    { offset: [24, 2.1, -28], flapOffset: 1.5, scale: 0.95 }, // Right 2
    { offset: [36, 3.2, -42], flapOffset: 2.2, scale: 0.9 },  // Right 3
    { offset: [48, 4.4, -56], flapOffset: 2.9, scale: 0.85 }  // Right 4
  ], []);

  useFrame(({ clock }) => {
    if (!flockRef.current) return;
    const t = clock.getElapsedTime();
    // Elliptical flight loop soaring high over western mountain ridge, firewatch tower and lake
    const speed = 0.045;
    const theta = t * speed;
    const x = Math.cos(theta) * 480 - 70;
    const z = Math.sin(theta) * 380 - 20;
    const y = 145 + Math.sin(t * 0.25) * 20;

    flockRef.current.position.set(x, y, z);

    // Tangent look direction
    const nextTheta = theta + 0.01;
    const nextX = Math.cos(nextTheta) * 480 - 70;
    const nextZ = Math.sin(nextTheta) * 380 - 20;
    flockRef.current.lookAt(nextX, y, nextZ);

    // Dynamic banking roll into curves
    flockRef.current.rotation.z = Math.sin(theta) * 0.26;
  });

  return (
    <group ref={flockRef}>
      {formation.map((b, idx) => (
        <RealisticBird
          key={`bird_${idx}`}
          offset={b.offset}
          flapOffset={b.flapOffset}
          scale={b.scale}
        />
      ))}
    </group>
  );
}

// Camera Controller for Smooth Plant Focus & Auto-Zoom (Cancels immediately on user pan/wheel)
function CameraController({ focusedSite, worldSites, controlsRef, enabled = true }) {
  const { camera, gl } = useThree();
  const targetLookAt = useRef(null);
  const targetCamPos = useRef(null);
  const isAnimating = useRef(false);
  const lastProcessedTimestamp = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    if (!focusedSite?.siteId || !focusedSite?.timestamp) return;

    // Only start a transition when a NEW user selection event occurs
    // Never re-animate on periodic background polling of worldSites!
    if (lastProcessedTimestamp.current === focusedSite.timestamp) return;
    lastProcessedTimestamp.current = focusedSite.timestamp;

    const site = worldSites.find((s) => s.id === focusedSite.siteId);
    if (!site) return;

    const siteY = getTerrainHeight(site.center_x, site.center_z);
    const ha = Number(site.area_hectares || 50);
    // Balanced overview distance so the entire power plant and all equipment fit cleanly in view
    const viewDist = Math.max(110, Math.min(160, 95 + Math.sqrt(ha) * 4.5));

    targetLookAt.current = new THREE.Vector3(site.center_x, siteY + 4, site.center_z);
    // Elevated bird's-eye isometric vantage point
    targetCamPos.current = new THREE.Vector3(
      site.center_x - viewDist * 0.58,
      siteY + viewDist * 0.48,
      site.center_z + viewDist * 0.68
    );
    isAnimating.current = true;
  }, [focusedSite, worldSites]);

  // Cancel auto-animation IMMEDIATELY on any user interaction (mouse drag, wheel zoom, touch)
  useEffect(() => {
    const controls = controlsRef?.current;
    const domElement = gl?.domElement;
    if (!controls) return;

    const cancelAnimation = () => {
      isAnimating.current = false;
      targetLookAt.current = null;
      targetCamPos.current = null;
    };

    controls.addEventListener('start', cancelAnimation);

    if (domElement) {
      domElement.addEventListener('wheel', cancelAnimation, { passive: true });
      domElement.addEventListener('pointerdown', cancelAnimation, { passive: true });
    }

    return () => {
      controls.removeEventListener('start', cancelAnimation);
      if (domElement) {
        domElement.removeEventListener('wheel', cancelAnimation);
        domElement.removeEventListener('pointerdown', cancelAnimation);
      }
    };
  }, [controlsRef, gl]);

  useFrame((_, delta) => {
    if (!enabled || !isAnimating.current || !targetLookAt.current || !targetCamPos.current) return;
    // Swift and smooth auto-focus transition
    const t = Math.min(1, delta * 4.2);

    if (controlsRef?.current) {
      controlsRef.current.target.lerp(targetLookAt.current, t);
    }
    camera.position.lerp(targetCamPos.current, t);

    const distCam = camera.position.distanceTo(targetCamPos.current);
    const distTarget = controlsRef?.current
      ? controlsRef.current.target.distanceTo(targetLookAt.current)
      : 0;

    if (distCam < 0.6 && distTarget < 0.3) {
      if (controlsRef?.current) {
        controlsRef.current.target.copy(targetLookAt.current);
      }
      camera.position.copy(targetCamPos.current);
      isAnimating.current = false;
      targetLookAt.current = null;
      targetCamPos.current = null;
    }

    if (controlsRef?.current) {
      controlsRef.current.update();
    }
  });

  return null;
}

// Main 3D World Canvas
export default function WorldCanvas({
  worldSites = [],
  companySites = [],
  installedAssets = [],
  clock,
  settings = {},
  focusedSite = null,
  initialSpawnCoords = null,
  onSelectSite,
  isDrivingMode = false,
  drivingCameraMode = 'cockpit',
  onDrivingCameraModeChange = () => {},
  touchInput = {},
  onVehicleStatsUpdate = () => {},
  onExitDrivingMode = () => {},
  isWalkingMode = false,
  walkingCameraMode = 'chase',
  onWalkingCameraModeChange = () => {},
  onWalkerStatsUpdate = () => {},
  onExitWalkingMode = () => {},
  isCinematicMode = false,
  cinematicTourType = 'grand',
  cinematicSpeed = 1.0,
  onExitCinematicMode = () => {}
}) {
  const controlsRef = useRef();
  const isNight = clock?.isNight ?? false;
  const season = clock?.season || 'summer';

  const [spawnPoint, setSpawnPoint] = useState({ pos: [0, 0], yaw: 0 });
  const isGroundMode = isDrivingMode || isWalkingMode;
  const prevGroundMode = useRef(false);
  const lastGroundStats = useRef(null);

  // Transition handler between aerial orbit view and ground exploration view (Vehicle / Pedestrian)
  useEffect(() => {
    if (isGroundMode && !prevGroundMode.current) {
      // Transitioning into ground exploration: get current orbit target as spawn point
      let spawnX = 0;
      let spawnZ = 0;
      let initialYaw = 0;

      if (initialSpawnCoords && !lastGroundStats.current) {
        spawnX = Number(initialSpawnCoords[0]);
        spawnZ = Number(initialSpawnCoords[1]);
      } else if (controlsRef.current?.target) {
        const tx = Number(controlsRef.current.target.x);
        const tz = Number(controlsRef.current.target.z);
        if (Number.isFinite(tx) && Number.isFinite(tz)) {
          spawnX = tx;
          spawnZ = tz;
        }
        if (controlsRef.current.object) {
          const cam = controlsRef.current.object;
          const cx = Number(cam.position.x);
          const cz = Number(cam.position.z);
          if (Number.isFinite(cx) && Number.isFinite(cz)) {
            const computedYaw = Math.atan2(spawnX - cx, spawnZ - cz);
            if (Number.isFinite(computedYaw)) {
              initialYaw = computedYaw;
            }
          }
        }
      } else if (focusedSite) {
        const fx = Number(focusedSite.center_x);
        const fz = Number(focusedSite.center_z);
        if (Number.isFinite(fx) && Number.isFinite(fz)) {
          spawnX = fx;
          spawnZ = fz;
        }
      }

      setSpawnPoint({ pos: [spawnX, spawnZ], yaw: initialYaw });
    } else if (!isGroundMode && prevGroundMode.current) {
      // Transitioning back to aerial view: refocus camera on where vehicle or pedestrian stopped
      if (lastGroundStats.current && controlsRef.current) {
        const lv = lastGroundStats.current;
        controlsRef.current.target.set(lv.x, (lv.altitude || 0) + 1.2, lv.z);
        if (controlsRef.current.object) {
          controlsRef.current.object.position.set(lv.x - 30, (lv.altitude || 0) + 42, lv.z + 42);
          controlsRef.current.object.fov = 46;
          controlsRef.current.object.updateProjectionMatrix();
        }
        controlsRef.current.update();
      }
    }
    prevGroundMode.current = isGroundMode;
  }, [isGroundMode, focusedSite]);

  const handleVehicleStats = useCallback((stats) => {
    lastGroundStats.current = stats;
    onVehicleStatsUpdate(stats);
  }, [onVehicleStatsUpdate]);

  const handleWalkerStats = useCallback((stats) => {
    lastGroundStats.current = stats;
    onWalkerStatsUpdate(stats);
  }, [onWalkerStatsUpdate]);

  // Settings with defaults
  const showInfrastructure = settings.showInfrastructure ?? true;
  const graphicQuality = settings.graphicQuality || 'high';
  const showClouds = settings.showClouds ?? true;
  const showTraffic = settings.showTraffic ?? true;
  const showWildlife = settings.showWildlife ?? true;
  const showSiteBoundaries = settings.showSiteBoundaries ?? false;
  const showSiteLabels = settings.showSiteLabels ?? false;
  const firewatchMode = settings.firewatchMode ?? true;

  const isLowGraphics = graphicQuality === 'low';
  const isUltraGraphics = graphicQuality === 'ultra';

  const dpr = useMemo(() => {
    if (isLowGraphics) return 1;
    if (isUltraGraphics) return [1, 2];
    return [1, 1.25];
  }, [isLowGraphics, isUltraGraphics]);

  const shadowMapSize = useMemo(() => {
    if (isLowGraphics) return 512;
    if (isUltraGraphics) return 2048;
    return 1024;
  }, [isLowGraphics, isUltraGraphics]);

  const ownedSiteIds = useMemo(() => {
    return new Set(companySites.filter((s) => s.tenure_type === 'own').map((s) => s.site_id));
  }, [companySites]);

  const leasedSiteIds = useMemo(() => {
    return new Set(companySites.filter((s) => s.tenure_type === 'lease').map((s) => s.site_id));
  }, [companySites]);

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [-180, 280, 420], fov: 46, near: 0.5, far: 5500 }}
        shadows={!isLowGraphics}
        dpr={dpr}
        className="w-full h-full"
      >
        {/* Dynamic Smooth Camera Controller for Plant Focus & Zoom */}
        <CameraController
          focusedSite={focusedSite}
          worldSites={worldSites}
          controlsRef={controlsRef}
          enabled={!isDrivingMode}
        />

        {/* Sky, Fog & Lighting */}
        {isNight ? (
          <>
            <color attach="background" args={['#050816']} />
            <fog attach="fog" args={['#050816', 500, 2600]} />
            <ambientLight intensity={0.28} color="#334155" />
            <directionalLight
              position={[-180, 380, -140]}
              intensity={0.6}
              color="#7dd3fc"
            />
          </>
        ) : (
          <>
            {/* Iconic Firewatch Warm Golden-Hour Sunset Atmosphere */}
            <color attach="background" args={['#ea6c45']} />
            <fog attach="fog" args={['#ea6c45', 400, 3200]} />
            <ambientLight intensity={0.58} color="#fed7aa" />
            <hemisphereLight args={['#fca5a5', '#451a03', 0.65]} />
            <directionalLight
              position={[-360, 420, -220]}
              intensity={2.3}
              color="#ffecd1"
              castShadow={!isLowGraphics}
              shadow-mapSize-width={shadowMapSize}
              shadow-mapSize-height={shadowMapSize}
              shadow-camera-near={50}
              shadow-camera-far={1600}
              shadow-camera-left={-850}
              shadow-camera-right={850}
              shadow-camera-top={850}
              shadow-camera-bottom={-850}
              shadow-bias={-0.00008}
              shadow-normalBias={0.04}
            />
          </>
        )}

        {/* 360-Degree Firewatch Sky Dome (Day Sunset with Sun Disc) / Deep Starlit Night with Radiant Moon */}
        {!isNight ? <FirewatchSkyDome /> : <NightSkyAndMoon />}

        {/* Distant Multi-Layered Firewatch Mountain Silhouette Ridges */}
        <FirewatchDistantMountains />

        {/* Expansive Animated Ocean */}
        <AnimatedOcean />

        {/* Cohesive Island 3D Terrain adapting to Season */}
        <IslandTerrain season={season} />

        {/* Crystal Shimmering Alpine Lake in the Western Mountain Valley */}
        <AlpineLake />

        {/* 1. Natural Water Systems: Mountain Waterfalls, Rivers & Reservoir Dam */}
        <WaterFeatures isNight={isNight} season={season} />

        {/* 2. Living Settlements: Pine Ridge Alpine Village, Sunfire Coastal City, Farm, Industrial Park & Harbor Pier */}
        <LivingSettlements isNight={isNight} season={season} />

        {/* 3. Island Railway Network with Moving Freight Train (Active Day & Night with Headlights) */}
        <RailwaySystem isNight={isNight} />

        {/* 4. Natural Wildlife & Living Sky: Hot Air Balloons (Day), Commuter Airplane (Day), Grazing Deer */}
        <WildlifeAndSky isNight={isNight} />

        {/* Iconic Firewatch Lookout Tower on the Western Ridge */}
        <FirewatchTower position={[-230, 0, -15]} />

        {/* Living World Nature: Dense Firewatch Coniferous Pines, Valley Trees & Shrubs with Seasonal Foliage */}
        <IslandVegetation season={season} />

        {/* Central High-Voltage Substation */}
        <SubstationNode position={[0, 0, 0]} showLabels={showInfrastructure} />

        {/* Living World: 3D Ribbon Roads with Highway Streetlights (Traffic Roams in Daytime Only) */}
        {showTraffic && (
          <>
            <IslandRoads />
            {!isNight && <TrafficVehicles />}
          </>
        )}

        {/* Living World: Clouds (Adapts to Day Peach Sunset / Night Moonlit Slate) */}
        {showClouds && <AtmosphericClouds isNight={isNight} />}

        {/* Living World: Wildlife Birds (Daytime Only - Resting at Night) */}
        {showWildlife && !isNight && <BirdFlock />}

        {/* Power Grid Lines from Central Substation to key sites (Toggled via Settings) */}
        {showInfrastructure &&
          worldSites.slice(0, 10).map((site) => {
            const cx = Number(site?.center_x);
            const cz = Number(site?.center_z);
            if (!Number.isFinite(cx) || !Number.isFinite(cz)) return null;
            return (
              <PowerLine
                key={`line_${site.id}`}
                from={[0, 0, 0]}
                to={[cx, 0, cz]}
              />
            );
          })}

        {/* 24 Sites Markers with Concession Boundaries & Surveyor Pylons */}
        {worldSites.map((site) => (
          <SiteMarker
            key={site.id}
            site={site}
            isOwned={ownedSiteIds.has(site.id)}
            isLeased={leasedSiteIds.has(site.id)}
            showBoundaries={showSiteBoundaries}
            showLabels={showSiteLabels}
            onSelect={onSelectSite}
          />
        ))}

        {/* Installed Player Assets */}
        {installedAssets.map((asset, idx) => {
          const cSite = companySites.find((cs) => cs.id === asset.company_site_id);
          const worldSite = worldSites.find((ws) => ws.id === cSite?.site_id);

          // Find all turbines on this specific company site for coherent site-relative alignment & spacing
          const siteWindTurbines = installedAssets.filter(
            (a) => a.company_site_id === asset.company_site_id && a.equipment_catalog?.equipment_type === 'wind_turbine'
          );
          const turbineIndexInSite = Math.max(0, siteWindTurbines.findIndex((a) => a.id === asset.id));

          const rawX = Number(asset.position_x || 0);
          const rawZ = Number(asset.position_z || 0);
          const slot = TURBINE_SLOTS[turbineIndexInSite % TURBINE_SLOTS.length];
          const offsetDistX = rawX !== 0 ? rawX : slot.x;
          const offsetDistZ = rawZ !== 0 ? rawZ : slot.z;

          const posX = (worldSite?.center_x || 0) + offsetDistX;
          const posZ = (worldSite?.center_z || 0) + offsetDistZ;
          const posY = getTerrainHeight(posX, posZ);

          if (asset.equipment_catalog?.equipment_type === 'wind_turbine') {
            const sitePrevailingAngle = getSitePrevailingWindAngle(worldSite);
            const microOffset = ((turbineIndexInSite * 3) % 7) - 3; // tiny ±3° natural micro-alignment variation
            const siteBaseAngle = sitePrevailingAngle + microOffset;

            return (
              <WindTurbine
                key={asset.id}
                position={[posX, posY, posZ]}
                siteBaseAngle={siteBaseAngle}
                turbineIndex={turbineIndexInSite}
                siteId={Number(worldSite?.id || cSite?.site_id || 1)}
                windSpeed={Number(asset.equipment_catalog?.capacity_kw || 1000) > 2000 ? 9.2 : 8.6}
                isNight={Boolean(clock?.isNight)}
                onClick={() => worldSite && onSelectSite(worldSite)}
              />
            );
          }

          if (asset.equipment_catalog?.equipment_type === 'solar_pack') {
            return (
              <SolarArray
                key={asset.id}
                position={[posX, posY, posZ]}
                hasTracker={Boolean(cSite?.has_solar_tracker)}
                clock={clock}
                onClick={() => worldSite && onSelectSite(worldSite)}
              />
            );
          }

          if (asset.equipment_catalog?.equipment_type === 'battery') {
            return (
              <BatteryContainer
                key={asset.id}
                position={[posX, posY, posZ]}
                onClick={() => worldSite && onSelectSite(worldSite)}
              />
            );
          }

          return null;
        })}

        {/* Interactive Drivable Exploration Buggy */}
        {isDrivingMode && (
          <DrivableBuggy
            spawnPosition={spawnPoint.pos}
            initialYaw={spawnPoint.yaw}
            cameraMode={drivingCameraMode}
            onCameraModeChange={onDrivingCameraModeChange}
            isNight={isNight}
            touchInput={touchInput}
            onStatsUpdate={handleVehicleStats}
            onExit={onExitDrivingMode}
            controlsRef={controlsRef}
          />
        )}

        {/* Interactive Walkable Pedestrian / Engineer Mode */}
        {isWalkingMode && (
          <WalkableCharacter
            spawnPosition={spawnPoint.pos}
            initialYaw={spawnPoint.yaw}
            cameraMode={walkingCameraMode}
            onCameraModeChange={onWalkingCameraModeChange}
            isNight={isNight}
            touchInput={touchInput}
            onStatsUpdate={handleWalkerStats}
            onExit={onExitWalkingMode}
            controlsRef={controlsRef}
          />
        )}

        {/* 5. Cinematic Auto-Camera Tour Director */}
        <CinematicCameraTour
          isActive={isCinematicMode}
          tourType={cinematicTourType}
          speedMultiplier={cinematicSpeed}
          onExit={onExitCinematicMode}
        />

        {/* Orbit Camera Controls: Fast Effortless Zoom-In & Responsive Screen-Space Pan */}
        <OrbitControls
          ref={controlsRef}
          enabled={!isGroundMode && !isCinematicMode}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={1.2}
          maxDistance={1800}
          enablePan={true}
          panSpeed={2.4}
          zoomSpeed={2.5}
          rotateSpeed={0.9}
          screenSpacePanning={true}
          enableDamping={true}
          dampingFactor={0.12}
        />
      </Canvas>
    </div>
  );
}
