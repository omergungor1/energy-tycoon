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
import { WindTurbineConstructionSite, SolarConstructionSite } from './ConstructionSites';

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
  let falloff = getIslandFalloff(x, z);

  // Coastal Harbor Bay indentation into northern coast (giving a natural ocean harbor for ships & lighthouse)
  if (z < -490 && Math.abs(x - 280) < 190) {
    const dx = (x - 280) / 130;
    const depth = Math.min(1.0, Math.max(0, (-490 - z) / 150));
    const bayCarve = Math.exp(-dx * dx) * depth;
    falloff = Math.max(0, falloff - bayCarve * 0.88);
  }

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

// Pre-computed anchor heights for Living Settlements to ensure flat, stable building foundations (no Z-fighting)
export const SETTLEMENT_ZONES = [
  { name: 'Sunfire City', x: 380, z: 90, radius: 75, innerRadius: 48 },
  { name: 'Energy Logistics Park', x: 85, z: -45, radius: 55, innerRadius: 36 },
  { name: 'Pine Ridge Village', x: -75, z: -175, radius: 42, innerRadius: 24 },
  { name: 'Agri Farm', x: -35, z: 248, radius: 82, innerRadius: 58 },
  { name: 'Marina Harbor', x: 195, z: -570, radius: 44, innerRadius: 22 },
  { name: 'Sunflower Farm', x: 430, z: -140, radius: 72, innerRadius: 50 },
  { name: 'Valley Orchard Farm', x: -290, z: 80, radius: 72, innerRadius: 50 },
  { name: 'North Sea Port Terminal', x: 345, z: -710, radius: 65, innerRadius: 42, customHeight: 1.4 },
  { name: 'Sunset Dunes Beach Camp', x: 372, z: -835, radius: 24, innerRadius: 14, customHeight: 2.1 },
  { name: 'South Sands Beach Camp', x: 75, z: 1030, radius: 26, innerRadius: 15, customHeight: 3.3 },
  { name: 'Pine Cove Beach Camp', x: -115, z: 1020, radius: 25, innerRadius: 14, customHeight: 2.5 },
  { name: 'East Dunes Beach Camp', x: 915, z: -590, radius: 25, innerRadius: 14, customHeight: 4.6 }
];
const SETTLEMENT_ANCHOR_HEIGHTS = SETTLEMENT_ZONES.map((s) => s.customHeight !== undefined ? s.customHeight : getRawTerrainHeight(s.x, s.z));

// Global terrain height function (shared between mesh, objects, power lines, and markers)
export function getTerrainHeight(x, z) {
  let h = getRawTerrainHeight(x, z);

  // Central Substation & Interchange leveled terrace (radius 88m, innerRadius 62m centered at (0, -30))
  const distSub = Math.hypot(x, z + 30);
  if (distSub < 88) {
    const t = smoothstep(88, 62, distSub);
    h = h * (1 - t * 0.95) + SUBSTATION_ANCHOR_HEIGHT * (t * 0.95);
  }

  // Stable leveled terraces around Living Settlements (Eliminates ground clipping and flickering)
  for (let i = 0; i < SETTLEMENT_ZONES.length; i++) {
    const sz = SETTLEMENT_ZONES[i];
    if (Math.abs(x - sz.x) < sz.radius && Math.abs(z - sz.z) < sz.radius) {
      const d = Math.hypot(x - sz.x, z - sz.z);
      if (d < sz.radius) {
        const t = smoothstep(sz.radius, sz.innerRadius, d);
        const targetH = sz.customHeight !== undefined ? sz.customHeight : SETTLEMENT_ANCHOR_HEIGHTS[i];
        h = h * (1 - t * 0.96) + targetH * (t * 0.96);
        break;
      }
    }
  }

  // Stable leveled terraces around all 24 sites (flat plateau radius 76m, smooth transition to 110m)
  for (let i = 0; i < KNOWN_SITES.length; i++) {
    const s = KNOWN_SITES[i];
    if (Math.abs(x - s.x) < 112 && Math.abs(z - s.z) < 112) {
      const d = Math.hypot(x - s.x, z - s.z);
      if (d < 110) {
        const t = smoothstep(110, 76, d);
        h = h * (1 - t) + SITE_ANCHOR_HEIGHTS[i] * t;
        break;
      }
    }
  }

  return h;
}

// Terrain mesh geometry constants (matches IslandTerrain PlaneGeometry: 2800x2800 with 180x180 quads)
const TERRAIN_GRID_SIZE = 2800;
const TERRAIN_SEGMENTS = 180;
const TERRAIN_STEP = TERRAIN_GRID_SIZE / TERRAIN_SEGMENTS;
const TERRAIN_HALF = TERRAIN_GRID_SIZE * 0.5;

// Exact mathematical height on the Three.js terrain mesh triangular facets
export function getMeshHeightAt(x, z) {
  const col = Math.floor((x + TERRAIN_HALF) / TERRAIN_STEP);
  const row = Math.floor((z + TERRAIN_HALF) / TERRAIN_STEP);
  if (col < 0 || col >= TERRAIN_SEGMENTS || row < 0 || row >= TERRAIN_SEGMENTS) {
    return getTerrainHeight(x, z);
  }
  const x0 = -TERRAIN_HALF + col * TERRAIN_STEP;
  const z0 = -TERRAIN_HALF + row * TERRAIN_STEP;
  const y00 = getTerrainHeight(x0, z0);
  const y10 = getTerrainHeight(x0 + TERRAIN_STEP, z0);
  const y01 = getTerrainHeight(x0, z0 + TERRAIN_STEP);
  const y11 = getTerrainHeight(x0 + TERRAIN_STEP, z0 + TERRAIN_STEP);
  const u = (x - x0) / TERRAIN_STEP;
  const v = (z - z0) / TERRAIN_STEP;
  if (u + v < 1.0) {
    return y00 + u * (y10 - y00) + v * (y01 - y00);
  } else {
    return y11 + (1.0 - u) * (y01 - y11) + (1.0 - v) * (y10 - y11);
  }
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

// =============================================================================
// REALISTIC HIGH-VOLTAGE CENTRAL SUBSTATION FACILITY (154/380 kV - 100 MW)
// =============================================================================
function SubstationNode({ position = [-5, 0, -64], showLabels = true }) {
  const y = getTerrainHeight(position[0], position[2]);

  return (
    <group position={[position[0], y, position[2]]}>
      {/* 1. Permeable Crushed-Stone Gravel Switchyard Bed */}
      <mesh position={[0, 0.4, 0]} receiveShadow>
        <boxGeometry args={[66, 0.8, 54]} />
        <meshStandardMaterial
          color="#526071"
          roughness={0.96}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>

      {/* Concrete Curb Perimeter Ring */}
      <mesh position={[0, 0.82, 0]} receiveShadow>
        <boxGeometry args={[66.8, 0.14, 54.8]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>

      {/* 2. Perimeter Galvanized Chain-Link Security Fence with Barbed Wire */}
      <group position={[0, 0.8, 0]}>
        {/* North Fence (-Z) */}
        <mesh position={[0, 1.6, -26.8]}>
          <boxGeometry args={[65.6, 3.2, 0.08]} />
          <meshBasicMaterial color="#94a3b8" wireframe transparent opacity={0.4} />
        </mesh>
        {/* South Fence (+Z) with Gate Opening */}
        <mesh position={[-18, 1.6, 26.8]}>
          <boxGeometry args={[28, 3.2, 0.08]} />
          <meshBasicMaterial color="#94a3b8" wireframe transparent opacity={0.4} />
        </mesh>
        <mesh position={[18, 1.6, 26.8]}>
          <boxGeometry args={[28, 3.2, 0.08]} />
          <meshBasicMaterial color="#94a3b8" wireframe transparent opacity={0.4} />
        </mesh>
        {/* West Fence (-X) */}
        <mesh position={[-32.8, 1.6, 0]}>
          <boxGeometry args={[0.08, 3.2, 53.6]} />
          <meshBasicMaterial color="#94a3b8" wireframe transparent opacity={0.4} />
        </mesh>
        {/* East Fence (+X) */}
        <mesh position={[32.8, 1.6, 0]}>
          <boxGeometry args={[0.08, 3.2, 53.6]} />
          <meshBasicMaterial color="#94a3b8" wireframe transparent opacity={0.4} />
        </mesh>

        {/* Fence Corner & Intermediate Steel Tubular Posts */}
        {[-32.8, -16.4, 0, 16.4, 32.8].map((px, pi) =>
          [-26.8, 26.8].map((pz, pzi) => (
            <mesh key={`post_ns_${pi}_${pzi}`} position={[px, 1.8, pz]}>
              <cylinderGeometry args={[0.1, 0.1, 3.6, 6]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} />
            </mesh>
          ))
        )}

        {/* High-Voltage Danger Warning Signboards on Fence */}
        {[-14, 14].map((sx, si) => (
          <group key={`danger_sign_${si}`} position={[sx, 1.8, 26.9]}>
            <mesh>
              <boxGeometry args={[3.2, 1.6, 0.1]} />
              <meshStandardMaterial color="#dc2626" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.06]}>
              <boxGeometry args={[2.9, 1.3, 0.02]} />
              <meshStandardMaterial color="#fef08a" />
            </mesh>
            <Text
              position={[0, 0.1, 0.08]}
              fontSize={0.32}
              color="#0f172a"
              fontWeight="bold"
              anchorX="center"
              anchorY="middle"
            >
              {'DİKKAT!\nYÜKSEK GERİLİM\n154 kV / 380 kV'}
            </Text>
          </group>
        ))}

        {/* Sliding Main Entrance Security Gate */}
        <group position={[0, 0, 26.8]}>
          <mesh position={[0, 1.4, 0]}>
            <boxGeometry args={[7.2, 2.8, 0.12]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Yellow / Black Hazard Stripe on Gate */}
          <mesh position={[0, 0.4, 0.08]}>
            <boxGeometry args={[6.8, 0.25, 0.02]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>

        {/* Security Guard Booth & Barrier Arm */}
        <group position={[6.0, 0, 23.5]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[3.2, 3.0, 2.8]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
          </mesh>
          <mesh position={[0, 3.1, 0]}>
            <boxGeometry args={[3.6, 0.2, 3.2]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Glass Windows */}
          <mesh position={[-0.8, 1.6, 1.42]}>
            <planeGeometry args={[1.2, 1.2]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
          </mesh>
          {/* Barrier Arm */}
          <mesh position={[-3.2, 1.0, 3.0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[4.2, 0.15, 0.08]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>
      </group>

      {/* 3. Three Massive 3-Phase High-Voltage Power Transformers */}
      {[-16, 0, 16].map((tx, ti) => (
        <group key={`trafo_${ti}`} position={[tx, 0.8, 2]}>
          {/* Concrete Foundation Plinth */}
          <mesh position={[0, 0.35, 0]} receiveShadow>
            <boxGeometry args={[7.2, 0.7, 6.2]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.9} />
          </mesh>

          {/* Heavy Main Transformer Steel Tank */}
          <mesh position={[0, 2.7, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.2, 4.0, 4.4]} />
            <meshStandardMaterial color="#2d3748" roughness={0.45} metalness={0.6} />
          </mesh>

          {/* Left Cooling Radiator Bank */}
          <group position={[-3.1, 2.6, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.8, 3.4, 3.8]} />
              <meshStandardMaterial color="#1a202c" roughness={0.7} metalness={0.5} />
            </mesh>
            {[-1.2, 0, 1.2].map((rz, ri) => (
              <mesh key={`fan_l_${ri}`} position={[-0.45, 0, rz]}>
                <cylinderGeometry args={[0.55, 0.55, 0.1, 12]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#4a5568" />
              </mesh>
            ))}
          </group>

          {/* Right Cooling Radiator Bank */}
          <group position={[3.1, 2.6, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.8, 3.4, 3.8]} />
              <meshStandardMaterial color="#1a202c" roughness={0.7} metalness={0.5} />
            </mesh>
            {[-1.2, 0, 1.2].map((rz, ri) => (
              <mesh key={`fan_r_${ri}`} position={[0.45, 0, rz]}>
                <cylinderGeometry args={[0.55, 0.55, 0.1, 12]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#4a5568" />
              </mesh>
            ))}
          </group>

          {/* Overhead Oil Conservator Drum */}
          <mesh position={[0, 5.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.7, 0.7, 4.6, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* High-Voltage Primary Porcelain Bushings (3-Phase Terracotta Brown) */}
          {[-1.5, 0, 1.5].map((bx, bi) => (
            <group key={`bushing_hv_${bi}`} position={[bx, 4.8, -1.2]}>
              <mesh rotation={[0.15, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.38, 2.2, 10]} />
                <meshStandardMaterial color="#b45309" roughness={0.25} />
              </mesh>
              {/* Terminal Cap & Spark Gap Horn */}
              <mesh position={[0, 1.2, 0]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
              </mesh>
            </group>
          ))}

          {/* Medium-Voltage Secondary Bushings */}
          {[-1.4, 0, 1.4].map((bx, bi) => (
            <mesh key={`bushing_mv_${bi}`} position={[bx, 4.8, 1.3]}>
              <cylinderGeometry args={[0.18, 0.28, 1.5, 8]} />
              <meshStandardMaterial color="#b45309" roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Concrete Blast Containment Firewalls between Transformers */}
      {[-8, 8].map((fx, fi) => (
        <mesh key={`firewall_${fi}`} position={[fx, 4.0, 2]} receiveShadow castShadow>
          <boxGeometry args={[0.8, 6.8, 7.8]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.9} />
        </mesh>
      ))}

      {/* 4. High-Voltage Steel Lattice Portal Gantries (Overhead Busbars) */}
      {[-7, -17].map((gz, gi) => (
        <group key={`gantry_${gi}`} position={[0, 0.8, gz]}>
          {/* Left Lattice Pylon Column */}
          <mesh position={[-25, 6.5, 0]} castShadow>
            <cylinderGeometry args={[0.35, 1.1, 13.0, 4]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Center Lattice Pylon Column */}
          <mesh position={[0, 6.5, 0]} castShadow>
            <cylinderGeometry args={[0.35, 1.1, 13.0, 4]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Right Lattice Pylon Column */}
          <mesh position={[25, 6.5, 0]} castShadow>
            <cylinderGeometry args={[0.35, 1.1, 13.0, 4]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Overhead Horizontal Lattice Box Truss Crossbeam */}
          <mesh position={[0, 13.0, 0]} castShadow>
            <boxGeometry args={[52, 0.9, 0.9]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Suspended Porcelain Insulator Strings & 3-Phase Busbars */}
          {[-20, -14, -8, -2, 4, 10, 16, 22].map((bx, bi) => (
            <group key={`busbar_${bi}`} position={[bx, 13.0, 0]}>
              <mesh position={[0, -0.9, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 1.8, 8]} />
                <meshStandardMaterial color="#b45309" roughness={0.3} />
              </mesh>
              {/* Horizontal Tubular Busbar Conductor */}
              <mesh position={[0, -1.8, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.07, 0.07, 6.0, 8]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* 5. SF6 High-Voltage Gas Circuit Breakers & Disconnector Switches */}
      {[-16, 0, 16].map((bx, bi) => (
        <group key={`switchgear_${bi}`} position={[bx, 0.8, -12]}>
          {/* Base Cabinet */}
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[2.4, 2.0, 1.2]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* 3 Vertical SF6 Interrupt Chambers */}
          {[-0.7, 0, 0.7].map((px, pi) => (
            <mesh key={`breaker_${pi}`} position={[px, 2.8, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 1.8, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 6. SCADA Operations & Substation Control Center Building */}
      <group position={[-20, 0.8, -16]}>
        <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[14, 4.6, 9]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        {/* Parapet Roof with HVAC Chillers */}
        <mesh position={[0, 4.7, 0]}>
          <boxGeometry args={[14.4, 0.3, 9.4]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[3.5, 5.2, 0]}>
          <boxGeometry args={[2.8, 1.0, 2.2]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        {/* Rooftop Telemetry Microwave Dish & Antenna Mast */}
        <group position={[-4.5, 4.8, -2.5]}>
          <mesh position={[0, 4.0, 0]}>
            <cylinderGeometry args={[0.08, 0.14, 8.0, 6]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
          </mesh>
          <mesh position={[0, 6.5, 0.3]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.7, 0.2, 0.2, 16]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
        {/* Front Glass Windows */}
        <mesh position={[0, 2.4, 4.55]}>
          <planeGeometry args={[7.5, 1.8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
        </mesh>
      </group>

      {/* 7. Main High-Voltage Grid Interconnection Take-Off Terminal Pylon */}
      <group position={[0, 0.8, -22]}>
        {/* Base Lattice Mast */}
        <mesh position={[0, 13.0, 0]} castShadow>
          <cylinderGeometry args={[0.6, 3.2, 26.0, 4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Upper Transmission Crossarms */}
        <mesh position={[0, 20.0, 0]} castShadow>
          <boxGeometry args={[24, 0.8, 0.8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 24.0, 0]} castShadow>
          <boxGeometry args={[16, 0.7, 0.7]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Red Flashing FAA Safety Beacon */}
        <mesh position={[0, 26.5, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* 8. Four High-Mast Night Floodlight Towers at Yard Corners */}
      {[
        [-31, -25],
        [31, -25],
        [-31, 25],
        [31, 25]
      ].map(([fx, fz], fi) => (
        <group key={`yard_light_${fi}`} position={[fx, 0.8, fz]}>
          <mesh position={[0, 7.0, 0]}>
            <cylinderGeometry args={[0.12, 0.25, 14.0, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} />
          </mesh>
          <mesh position={[0, 14.1, 0]}>
            <boxGeometry args={[1.6, 0.6, 0.8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 13.9, 0.4]}>
            <planeGeometry args={[1.4, 0.5]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* 9. Top HUD Label */}
      {showLabels && (
        <group position={[0, 31, -12]}>
          <mesh position={[0, 0, -0.1]}>
            <planeGeometry args={[36, 4.2]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.75} />
          </mesh>
          <Text
            color="#38bdf8"
            fontSize={2.4}
            outlineWidth={0.25}
            outlineColor="#020617"
            textAlign="center"
            anchorX="center"
            anchorY="middle"
          >
            {'MERKEZİ TRAFO & ULUSAL ŞEBEKE DAĞITIM (100 MW)\n154 kV / 380 kV İNDİRİCİ MERKEZ'}
          </Text>
        </group>
      )}
    </group>
  );
}

// High-Voltage Power Lines connecting sites to central substation
function PowerLine({ from, to }) {
  const points = useMemo(() => {
    const fx = Number.isFinite(from?.[0]) ? from[0] : -5;
    const fz = Number.isFinite(from?.[2]) ? from[2] : -86;
    const tx = Number.isFinite(to?.[0]) ? to[0] : 0;
    const tz = Number.isFinite(to?.[2]) ? to[2] : 0;

    // Substation terminal pylon upper crossarm connection (24.5m)
    const fromY = getTerrainHeight(fx, fz) + (Number.isFinite(from?.[1]) && from[1] > 0 ? from[1] : 24.5);
    const toY = getTerrainHeight(tx, tz) + 5.5;
    const midX = (fx + tx) / 2;
    const midZ = (fz + tz) / 2;
    // Natural catenary cable sag under gravity
    const midY = Math.max(getTerrainHeight(midX, midZ) + 6.0, (fromY + toY) / 2 - 2.8);

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

      // 1. Inland Biome Coloring (Mountains, Desert Steppe, Alpine Lake, or Seasonal Meadow)
      let r = 0.32, g = 0.48, b = 0.20; // Default summer valley meadow
      if (season === 'autumn') {
        r = 0.52; g = 0.50; b = 0.22; // Golden harvest autumn grass
      } else if (season === 'winter') {
        r = 0.42; g = 0.48; b = 0.42; // Frosted cool winter highland grass
      } else if (season === 'spring') {
        r = 0.24; g = 0.56; b = 0.22; // Lush spring emerald meadow
      }

      if (distLake < ALPINE_LAKE_CENTER.radius + 12) {
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
      }

      // 2. Coastal Shoreline & Marine Seabed Gradient (100% Smooth, Continuous, Flicker-Free)
      // Sea level is Y = 0.0m. Blends smoothly without hard color steps or depth artifacts.
      if (y < 4.2 || falloff < 0.82) {
        // Warm golden dry beach sand palette
        const sandR = 0.86, sandG = 0.72, sandB = 0.46;
        // Wet intertidal shoreline sand palette (damp, darker earth-gold)
        const wetR = 0.68, wetG = 0.56, wetB = 0.38;
        // Shallow coastal reef & turquoise lagoon seabed
        const reefR = 0.10, reefG = 0.44, reefB = 0.52;
        // Deep ocean abyss seabed
        const abyssR = 0.03, abyssG = 0.16, abyssB = 0.28;

        if (y >= 2.0) {
          // Transition: Inland Biome Grass/Steppe -> Dry Beach Sand
          const t = Math.max(0, Math.min(1, (4.2 - y) / 2.2));
          r = r * (1 - t) + sandR * t;
          g = g * (1 - t) + sandG * t;
          b = b * (1 - t) + sandB * t;
        } else if (y >= 0.5) {
          // Pure Dry Golden Beach Sand
          r = sandR;
          g = sandG;
          b = sandB;
        } else if (y >= 0.0) {
          // Wet Shoreline Intertidal Sand (sloping down to water's edge at Y = 0.0)
          const t = y / 0.5; // 0 at water line, 1 at dry sand
          r = wetR * (1 - t) + sandR * t;
          g = wetG * (1 - t) + sandG * t;
          b = wetB * (1 - t) + sandB * t;

          // Subtle organic surf froth foam hint near water's edge
          if (y < 0.28) {
            const foam = Math.sin(x * 0.15 + z * 0.15) * 0.5 + 0.5;
            const foamT = (1.0 - y / 0.28) * foam * 0.35;
            r = r * (1 - foamT) + 0.95 * foamT;
            g = g * (1 - foamT) + 0.98 * foamT;
            b = b * (1 - foamT) + 1.00 * foamT;
          }
        } else if (y >= -3.0) {
          // Submerged Coastal Lagoon & Reef (Y in [-3.0, 0.0])
          // At Y = 0, matches wet sand smoothly; at Y = -3.0, reaches rich turquoise reef
          const t = (y - (-3.0)) / 3.0; // 0 at -3.0m, 1 at 0.0m
          r = reefR * (1 - t) + (wetR * 0.8) * t;
          g = reefG * (1 - t) + (wetG * 0.85) * t;
          b = reefB * (1 - t) + (wetB * 0.9) * t;
        } else {
          // Deep Ocean Abyss Floor (Y < -3.0m)
          const t = Math.min(1.0, (-y - 3.0) / 6.0);
          r = reefR * (1 - t) + abyssR * t;
          g = reefG * (1 - t) + abyssG * t;
          b = reefB * (1 - t) + abyssB * t;
        }
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

// =============================================================================
// EXPANSIVE ANIMATED OCEAN (STABLE ZERO-FLICKER COASTLINE & DEEP SEA SWELL)
// =============================================================================
function AnimatedOcean({ isNight = false }) {
  const meshRef = useRef();

  // 4800x4800 expansive ocean extending cleanly to the horizon
  const oceanGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(4800, 4800, 72, 72);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;

    // Only roll gentle waves in the deep open sea far outside the island (>1180m from center and not in harbor)
    // The island coast and harbor bay remain 100% stationary and perfectly flat at Y = 0.0 (Eliminates all flickering & clipping)
    let needsUpdate = false;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.hypot(x, z);
      const inHarbor = z < -380 && Math.abs(x - 280) < 260;

      if (dist < 1180 || inHarbor) {
        // Perfectly still sea level at the island coast, beaches, harbor piers & ships
        if (pos.getY(i) !== 0.0) {
          pos.setY(i, 0.0);
          needsUpdate = true;
        }
      } else {
        // Gentle oceanic horizon swell (fades in smoothly beyond 1180m)
        const swellFactor = Math.min(1.0, (dist - 1180) / 260);
        const wave =
          (Math.sin(x * 0.008 + t * 0.6) * Math.cos(z * 0.008 + t * 0.5) * 0.24 +
           Math.sin(x * 0.016 - t * 0.8) * 0.10) * swellFactor;
        pos.setY(i, wave);
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      pos.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Pristine Ocean Surface Deck (depthWrite=false completely eliminates any Z-fighting with terrain & seabed) */}
      <mesh ref={meshRef} geometry={oceanGeo}>
        <meshStandardMaterial
          color={isNight ? '#0369a1' : '#0284c7'}
          roughness={0.12}
          metalness={0.28}
          transparent
          opacity={0.82}
          depthWrite={false}
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

// High-Definition 3D Regional Highway Ribbon Generator (Conforms smoothly above terrain)
function createRoadRibbon(points, width = 7.8, isClosed = true) {
  const curve = new THREE.CatmullRomCurve3(points, isClosed);
  const totalLength = curve.getLength();
  // Denser cross sections every ~2.0m to accurately hug terrain contours without polygon clipping
  const segments = Math.max(80, Math.floor(totalLength / 2.0));
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
  const shoulderExtra = 2.2;
  const stripeHalfW = 0.16;
  const baseElev = 0.85; // Safely elevated roadbed above terrain polygon facets

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

    // Sample BOTH continuous mathematical terrain AND physical Three.js mesh triangle facets across full deck width
    const yCenterMesh = getMeshHeightAt(curr.x, curr.z);
    const yLeftMesh = getMeshHeightAt(leftP.x, leftP.z);
    const yRightMesh = getMeshHeightAt(rightP.x, rightP.z);
    const yCenterMath = getTerrainHeight(curr.x, curr.z);
    const yLeftMath = getTerrainHeight(leftP.x, leftP.z);
    const yRightMath = getTerrainHeight(rightP.x, rightP.z);

    const maxTerrainPeak = Math.max(
      yCenterMesh,
      yLeftMesh,
      yRightMesh,
      yCenterMath,
      yLeftMath,
      yRightMath
    );

    // Road surface is guaranteed to sit firmly above the highest terrain peak everywhere
    const roadDeckY = maxTerrainPeak + 0.45;
    const yLeft = roadDeckY;
    const yRight = roadDeckY;
    const yCenter = roadDeckY + 0.04;

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

    // 2. Beveled Gravel Shoulder Embankment (Slopes down and seals securely into the terrain)
    const outLeftP = curr.clone().addScaledVector(normal, halfW + shoulderExtra);
    const outRightP = curr.clone().addScaledVector(normal, -(halfW + shoulderExtra));
    const yOutLeft = Math.min(getMeshHeightAt(outLeftP.x, outLeftP.z), getTerrainHeight(outLeftP.x, outLeftP.z)) - 0.25;
    const yOutRight = Math.min(getMeshHeightAt(outRightP.x, outRightP.z), getTerrainHeight(outRightP.x, outRightP.z)) - 0.25;

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
      // Asphalt indices (Counter-Clockwise: faces up towards the sky)
      const bIdx = i * 2;
      roadIndices.push(bIdx, bIdx + 2, bIdx + 1);
      roadIndices.push(bIdx + 1, bIdx + 2, bIdx + 3);

      // Shoulder indices (Counter-Clockwise: faces up towards the sky)
      const sIdx = i * 4;
      // Left Shoulder: outLeftP -> leftP
      shoulderIndices.push(sIdx, sIdx + 4, sIdx + 1);
      shoulderIndices.push(sIdx + 1, sIdx + 4, sIdx + 5);
      // Right Shoulder: rightP -> outRightP
      shoulderIndices.push(sIdx + 2, sIdx + 6, sIdx + 3);
      shoulderIndices.push(sIdx + 3, sIdx + 6, sIdx + 7);

      // Dashed centerline: 3 segments visible, 2 segments gap
      if (i % 5 < 3) {
        stripeIndices.push(bIdx, bIdx + 2, bIdx + 1);
        stripeIndices.push(bIdx + 1, bIdx + 2, bIdx + 3);
      }

      // Edge lines (Counter-Clockwise)
      const eIdx = i * 4;
      edgeIndices.push(eIdx, eIdx + 4, eIdx + 1);
      edgeIndices.push(eIdx + 1, eIdx + 4, eIdx + 5);
      edgeIndices.push(eIdx + 2, eIdx + 6, eIdx + 3);
      edgeIndices.push(eIdx + 3, eIdx + 6, eIdx + 7);
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

// 3 Seamless Closed-Loop Regional Highway Systems (Connecting to Outer Rim of Roundabout)
const HIGHWAY_CURVES = [
  // Highway 1: West Mountain, Firewatch & Alpine Lake Scenic Loop (Branching West from Roundabout)
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(-34, 0, 8),
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
    new THREE.Vector3(-80, 0, -140),
    new THREE.Vector3(-34, 0, -12)
  ], true),

  // Highway 2: East Sunfire Solar Steppe Expressway Loop (Branching East from Roundabout)
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(34, 0, 14),
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
    new THREE.Vector3(125, 0, 35),
    new THREE.Vector3(34, 0, -2)
  ], true),

  // Highway 3: South Alpine Lake Shoreline & Hybrid Plains Circuit (Branching South from Roundabout)
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8, 0, 34),
    new THREE.Vector3(-50, 0, 70),
    new THREE.Vector3(-105, 0, 125),
    new THREE.Vector3(-170, 0, 195),
    new THREE.Vector3(-240, 0, 265),
    new THREE.Vector3(-190, 0, 345),
    new THREE.Vector3(-45, 0, 365),
    new THREE.Vector3(65, 0, 325),
    new THREE.Vector3(125, 0, 215),
    new THREE.Vector3(70, 0, 115),
    new THREE.Vector3(10, 0, 34)
  ], true)
];

// Pre-sampled road and railway clearance checkpoints ensuring 100% tree-free corridors
const RAIL_CURVE_CHECK = new THREE.CatmullRomCurve3([
  new THREE.Vector3(220, 0, -340), // Harbor Freight Terminal
  new THREE.Vector3(175, 0, -220),
  new THREE.Vector3(120, 0, -110),
  new THREE.Vector3(85, 0, -25),   // Industrial Park Siding
  new THREE.Vector3(85, 0, 60),    // Level Crossing with Highway 2
  new THREE.Vector3(65, 0, 150),   // Scenic Valley Green Corridor
  new THREE.Vector3(35, 0, 220),   // Agri-Valley Farm Station
  new THREE.Vector3(105, 0, 230),  // River Trestle Crossing
  new THREE.Vector3(195, 0, 205),
  new THREE.Vector3(270, 0, 165),
  new THREE.Vector3(316, 0, 85),   // Sunfire City Bypass Station
  new THREE.Vector3(350, 0, -15),  // City North Bypass
  new THREE.Vector3(395, 0, -130), // Scenic Eastern Coastal Plain
  new THREE.Vector3(330, 0, -260)
], true);

const INFRASTRUCTURE_CLEARANCE_POINTS = [];
for (let c = 0; c < HIGHWAY_CURVES.length; c++) {
  const curve = HIGHWAY_CURVES[c];
  const count = Math.max(120, Math.floor(curve.getLength() / 2.0));
  const pts = curve.getSpacedPoints(count);
  for (let p = 0; p < pts.length; p++) {
    // 14.0m clearance from highway centerline (ensures no trees on road or shoulders)
    INFRASTRUCTURE_CLEARANCE_POINTS.push({ x: pts[p].x, z: pts[p].z, minDistSq: 14.0 * 14.0 });
  }
}
const railPtsCheck = RAIL_CURVE_CHECK.getSpacedPoints(Math.floor(RAIL_CURVE_CHECK.getLength() / 2.0));
for (let p = 0; p < railPtsCheck.length; p++) {
  // 12.0m clearance from railway tracks
  INFRASTRUCTURE_CLEARANCE_POINTS.push({ x: railPtsCheck[p].x, z: railPtsCheck[p].z, minDistSq: 12.0 * 12.0 });
}

// Island River and Stream Clearance to ensure no trees grow inside watercourses
const RIVER_CLEARANCE_CURVES = [
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(-245, 0, -42),
    new THREE.Vector3(-220, 0, -43),
    new THREE.Vector3(-195, 0, -41),
    new THREE.Vector3(-175, 0, -40),
    new THREE.Vector3(-150, 0, -40)
  ]),
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(-110, 0, -32),
    new THREE.Vector3(-75, 0, 15),
    new THREE.Vector3(-45, 0, 85),
    new THREE.Vector3(-20, 0, 160),
    new THREE.Vector3(15, 0, 240),
    new THREE.Vector3(70, 0, 310),
    new THREE.Vector3(135, 0, 385),
    new THREE.Vector3(210, 0, 470),
    new THREE.Vector3(290, 0, 560),
    new THREE.Vector3(380, 0, 660)
  ]),
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(180, 0, -90),
    new THREE.Vector3(240, 0, -40),
    new THREE.Vector3(320, 0, 25),
    new THREE.Vector3(410, 0, 110),
    new THREE.Vector3(490, 0, 190),
    new THREE.Vector3(580, 0, 250)
  ])
];
for (let rc = 0; rc < RIVER_CLEARANCE_CURVES.length; rc++) {
  const rCurve = RIVER_CLEARANCE_CURVES[rc];
  const rPts = rCurve.getSpacedPoints(Math.floor(rCurve.getLength() / 3.0));
  for (let p = 0; p < rPts.length; p++) {
    // 9.0m clearance from river centerline (prevents trees in riverbeds)
    INFRASTRUCTURE_CLEARANCE_POINTS.push({ x: rPts[p].x, z: rPts[p].z, minDistSq: 9.0 * 9.0 });
  }
}

// =============================================================================
// CENTRAL MULTI-LANE HIGHWAY ROUNDABOUT & ENERGY MONUMENT (DÖNEL KAVŞAK)
// =============================================================================
function SubstationInterchange() {
  const centerY = getTerrainHeight(0, 0);

  // 1. Multi-lane asphalt roundabout deck (Radius 22m to 36m)
  const asphaltGeo = useMemo(() => {
    const ring = new THREE.RingGeometry(22, 36, 64);
    ring.rotateX(-Math.PI / 2);
    const pos = ring.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.max(getMeshHeightAt(x, z), getTerrainHeight(x, z)) + 0.46);
    }
    ring.computeVertexNormals();
    return ring;
  }, []);

  // 2. Raised granite curbstone perimeter of central traffic island (Radius 21.4m to 22.4m)
  const curbGeo = useMemo(() => {
    const ring = new THREE.RingGeometry(21.4, 22.4, 64);
    ring.rotateX(-Math.PI / 2);
    const pos = ring.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.max(getMeshHeightAt(x, z), getTerrainHeight(x, z)) + 0.62);
    }
    ring.computeVertexNormals();
    return ring;
  }, []);

  // 3. Landscaped interior green turf lawn (Radius 21.4m)
  const lawnGeo = useMemo(() => {
    const circle = new THREE.CircleGeometry(21.4, 64);
    circle.rotateX(-Math.PI / 2);
    const pos = circle.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.max(getMeshHeightAt(x, z), getTerrainHeight(x, z)) + 0.54);
    }
    circle.computeVertexNormals();
    return circle;
  }, []);

  // 4. White Lane Divider Dashes on Roundabout (Radius 29m)
  const laneDashes = useMemo(() => {
    const count = 36;
    const dashes = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * 29.0;
      const z = Math.sin(angle) * 29.0;
      const y = Math.max(getMeshHeightAt(x, z), getTerrainHeight(x, z)) + 0.49;
      dashes.push({ x, y, z, rotY: -angle });
    }
    return dashes;
  }, []);

  return (
    <group>
      {/* 1. Elevated Asphalt Deck */}
      <mesh geometry={asphaltGeo} receiveShadow>
        <meshStandardMaterial
          color="#1a202c"
          roughness={0.9}
          metalness={0.12}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>

      {/* 2. White Lane Divider Dashes */}
      {laneDashes.map((d, i) => (
        <mesh key={`dash_${i}`} position={[d.x, d.y, d.z]} rotation={[0, d.rotY, 0]}>
          <boxGeometry args={[0.24, 0.04, 1.8]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
      ))}

      {/* 3. Granite Curbstone Border */}
      <mesh geometry={curbGeo} receiveShadow>
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {/* 4. Landscaped Interior Turf */}
      <mesh geometry={lawnGeo} receiveShadow>
        <meshStandardMaterial color="#15803d" roughness={0.92} />
      </mesh>

      {/* 5. Substation Northern Access Spur Road (Connects Roundabout to Substation Gate) */}
      <group position={[-2.5, getTerrainHeight(-2.5, -35) + 0.47, -35]}>
        {/* Asphalt Road Surface */}
        <mesh receiveShadow>
          <boxGeometry args={[9.2, 0.14, 12]} />
          <meshStandardMaterial color="#1a202c" roughness={0.9} />
        </mesh>
        {/* Yellow Lateral Warning Line Markings */}
        <mesh position={[-4.3, 0.08, 0]}>
          <boxGeometry args={[0.18, 0.03, 12]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
        <mesh position={[4.3, 0.08, 0]}>
          <boxGeometry args={[0.18, 0.03, 12]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>

      {/* 6. Central Island Clean Energy Monument (Kinetic Transition Sculpture) */}
      <group position={[0, centerY + 0.55, 0]}>
        {/* Tier 1 Stepped Granite Plinth */}
        <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[6.2, 7.0, 0.7, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* Tier 2 Stepped Granite Plinth */}
        <mesh position={[0, 0.85, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[4.4, 5.0, 0.5, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>

        {/* Polished Stainless Steel Sculptural Base Mast */}
        <mesh position={[0, 3.2, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.65, 4.8, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Kinetic Clean Energy Rings (Wind Cyan & Solar Gold) */}
        <mesh position={[0, 5.2, 0]} rotation={[0.42, 0.55, 0.2]} castShadow>
          <torusGeometry args={[2.5, 0.18, 12, 32]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} emissive="#0284c7" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 5.2, 0]} rotation={[-0.52, -0.38, 0.85]} castShadow>
          <torusGeometry args={[1.8, 0.16, 12, 32]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} emissive="#d97706" emissiveIntensity={0.4} />
        </mesh>

        {/* Glowing Central Energy Core */}
        <mesh position={[0, 5.2, 0]}>
          <octahedronGeometry args={[0.75, 0]} />
          <meshStandardMaterial color="#67e8f9" emissive="#38bdf8" emissiveIntensity={0.9} roughness={0.1} />
        </mesh>

        {/* 4 Low Evergreen Ornamental Topiary Shrubs around Plinth */}
        {[
          [-3.6, -3.6],
          [3.6, -3.6],
          [-3.6, 3.6],
          [3.6, 3.6]
        ].map(([bx, bz], bi) => (
          <mesh key={`shrub_${bi}`} position={[bx, 0.9, bz]} castShadow>
            <sphereGeometry args={[0.85, 8, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.9} />
          </mesh>
        ))}

        {/* Monument Direction Signboard */}
        <group position={[0, 2.0, 4.4]} rotation={[0, 0, 0]}>
          <mesh>
            <boxGeometry args={[4.2, 0.8, 0.12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
          <Text
            position={[0, 0, 0.08]}
            fontSize={0.28}
            color="#38bdf8"
            outlineWidth={0.03}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            MERKEZİ ENERJİ KAVŞAĞI
          </Text>
        </group>
      </group>

      {/* 7. Directional Highway Overhead Gantry Signs on Approaches */}
      {[
        { pos: [-36, getTerrainHeight(-36, -2), -2], rot: Math.PI / 2, title: "BATI", desc: "DAĞ VE GÖL GEÇİDİ (WIND PARK)" },
        { pos: [36, getTerrainHeight(36, 6), 6], rot: -Math.PI / 2, title: "DOĞU", desc: "SUNFİRE ŞEHİR MERKEZİ & BOZKIR" },
        { pos: [1, getTerrainHeight(1, 36), 36], rot: Math.PI, title: "GÜNEY", desc: "TARIM VADİSİ & KIYI BÖLGESİ" },
        { pos: [-2.5, getTerrainHeight(-2.5, -34), -34], rot: 0, title: "KUZEY", desc: "MERKEZİ TRAFO (154/380 kV)" }
      ].map((gantry, gi) => (
        <group key={`gantry_sign_${gi}`} position={gantry.pos} rotation={[0, gantry.rot, 0]}>
          {/* Steel Support Posts */}
          {[-4.6, 4.6].map((px, pi) => (
            <mesh key={`g_post_${pi}`} position={[px, 3.0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 6.0, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} />
            </mesh>
          ))}
          {/* Overhead Crossbar Beam */}
          <mesh position={[0, 5.8, 0]}>
            <boxGeometry args={[9.8, 0.35, 0.35]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} />
          </mesh>
          {/* Green Highway Signboard */}
          <mesh position={[0, 5.4, 0.2]}>
            <boxGeometry args={[8.6, 1.3, 0.1]} />
            <meshStandardMaterial color="#15803d" roughness={0.4} />
          </mesh>
          <Text
            position={[0, 5.65, 0.27]}
            fontSize={0.34}
            color="#f8fafc"
            outlineWidth={0.04}
            outlineColor="#0f172a"
            anchorX="center"
            anchorY="middle"
          >
            {gantry.title}
          </Text>
          <Text
            position={[0, 5.25, 0.27]}
            fontSize={0.22}
            color="#fef08a"
            outlineWidth={0.03}
            outlineColor="#0f172a"
            anchorX="center"
            anchorY="middle"
          >
            {gantry.desc}
          </Text>
        </group>
      ))}
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
            <meshStandardMaterial color="#334155" roughness={0.96} side={THREE.DoubleSide} />
          </mesh>

          {/* Elevated Asphalt Highway Deck (Counter-clockwise normals, DoubleSide visible from all angles) */}
          <mesh geometry={rd.roadGeo} receiveShadow>
            <meshStandardMaterial
              color="#1a202c"
              roughness={0.88}
              metalness={0.12}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-4}
              polygonOffsetUnits={-4}
            />
          </mesh>

          {/* Solid White Outer Fog Lines */}
          <mesh geometry={rd.edgeGeo}>
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>

          {/* Dashed Amber-Yellow Centerline */}
          <mesh geometry={rd.stripeGeo}>
            <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
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

  // Traffic vehicle simulation state: realistic cruising speeds with periodic stop-and-go behavior
  const vehiclesState = useRef([
    // 0: Van 1 (Route 0): Service Van - gentle cruise, stops near mountain overlook
    { progress: 0.08, baseSpeed: 0.0072, stopPeriod: 34, stopDuration: 6.5, phase: 0, isReverse: false, lane: 2.0 },
    // 1: Truck 1 (Route 0): Heavy Wind Maintenance Crane - slower pace, pauses at waypoint
    { progress: 0.55, baseSpeed: 0.0054, stopPeriod: 44, stopDuration: 8.0, phase: 14, isReverse: false, lane: 2.0 },
    // 2: Rover 1 (Route 0): Mountain Ranger 4x4 - reverse oncoming lane
    { progress: 0.28, baseSpeed: 0.0080, stopPeriod: 36, stopDuration: 5.5, phase: 22, isReverse: true, lane: 2.0 },

    // 3: Hauler (Route 1): Solar Steppe Heavy Industrial Hauler
    { progress: 0.12, baseSpeed: 0.0050, stopPeriod: 46, stopDuration: 7.5, phase: 8, isReverse: false, lane: 2.0 },
    // 4: Van 2 (Route 1): Solar Maintenance Van
    { progress: 0.62, baseSpeed: 0.0075, stopPeriod: 32, stopDuration: 6.0, phase: 18, isReverse: false, lane: 2.0 },
    // 5: Flatbed (Route 1): Commercial Flatbed - reverse oncoming lane
    { progress: 0.36, baseSpeed: 0.0058, stopPeriod: 40, stopDuration: 7.5, phase: 26, isReverse: true, lane: 2.0 },

    // 6: SUV 1 (Route 2): Executive Hybrid SUV
    { progress: 0.18, baseSpeed: 0.0070, stopPeriod: 35, stopDuration: 6.0, phase: 12, isReverse: false, lane: 1.9 },
    // 7: Truck 2 (Route 2): Regional Cargo Truck - reverse oncoming lane
    { progress: 0.68, baseSpeed: 0.0056, stopPeriod: 42, stopDuration: 7.0, phase: 30, isReverse: true, lane: 1.9 }
  ]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);

    const updateCar = (ref, curve, stateIndex) => {
      if (!ref.current || !curve) return;
      const v = vehiclesState.current[stateIndex];

      // Calculate realistic periodic stop-and-go cycle
      const cycleTime = (t + v.phase) % v.stopPeriod;
      let speedFactor = 1.0;

      // In the final stopDuration seconds of each cycle: decelerate, wait/stop, and accelerate back
      if (cycleTime > v.stopPeriod - v.stopDuration) {
        const stopProgress = (cycleTime - (v.stopPeriod - v.stopDuration)) / v.stopDuration;
        if (stopProgress < 0.25) {
          // Smooth deceleration to stop
          speedFactor = Math.cos((stopProgress / 0.25) * Math.PI * 0.5);
        } else if (stopProgress > 0.75) {
          // Smooth acceleration away from stop
          speedFactor = Math.sin(((stopProgress - 0.75) / 0.25) * Math.PI * 0.5);
        } else {
          // Completely stopped at viewpoint / crossing
          speedFactor = 0.0;
        }
      }

      // Advance progress smoothly based on current speed factor
      v.progress = (v.progress + dt * v.baseSpeed * speedFactor) % 1.0;

      let effectiveProgress = v.isReverse ? (1.0 - v.progress) % 1.0 : v.progress;
      if (effectiveProgress < 0) effectiveProgress += 1.0;

      const p = curve.getPointAt(effectiveProgress);
      const tangent = curve.getTangentAt(effectiveProgress).normalize();
      if (v.isReverse) tangent.negate();

      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Right-hand lane positioning
      const carPos = p.clone().addScaledVector(normal, v.lane);
      const groundY = Math.max(getMeshHeightAt(carPos.x, carPos.z), getTerrainHeight(carPos.x, carPos.z));
      carPos.y = groundY + 0.45 + 0.35;

      // Lookahead point for slope pitch & directional alignment
      const lookDelta = v.isReverse ? -0.005 : 0.005;
      const nextProgress = (effectiveProgress + lookDelta + 1.0) % 1.0;
      const pNext = curve.getPointAt(nextProgress);
      const lookPos = pNext.clone().addScaledVector(normal, v.lane);
      const nextGroundY = Math.max(getMeshHeightAt(lookPos.x, lookPos.z), getTerrainHeight(lookPos.x, lookPos.z));
      lookPos.y = nextGroundY + 0.45 + 0.35;

      ref.current.position.copy(carPos);
      ref.current.lookAt(lookPos);
    };

    // Route 1 (West Mountain & Lake Scenic Highway)
    updateCar(van1Ref, HIGHWAY_CURVES[0], 0);
    updateCar(truck1Ref, HIGHWAY_CURVES[0], 1);
    updateCar(rover1Ref, HIGHWAY_CURVES[0], 2);

    // Route 2 (East Sunfire Solar Steppe Expressway)
    updateCar(haulerRef, HIGHWAY_CURVES[1], 3);
    updateCar(van2Ref, HIGHWAY_CURVES[1], 4);
    updateCar(flatbedRef, HIGHWAY_CURVES[1], 5);

    // Route 3 (South Coastal Plains Circuit)
    updateCar(suv1Ref, HIGHWAY_CURVES[2], 6);
    updateCar(truck2Ref, HIGHWAY_CURVES[2], 7);
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

// =============================================================================
// DENSE FOREST RESERVES & PROCEDURAL FIREWATCH VEGETATION BIOMES
// =============================================================================
export const DENSE_FOREST_ZONES = [
  // 1. Whispering Pines National Reserve (Northwest Mountain Valleys & Lookout Ridge - Evergreen Canopy)
  { name: 'Whispering Pines Forest', x: -260, z: -220, radius: 185, pineRatio: 0.94, targetTrees: 1400 },
  // 2. Emerald River Valley Woodlands (Southwest Mountain Foothills & River Basin - Dense Mixed Forest)
  { name: 'Emerald River Woods', x: -140, z: 340, radius: 170, pineRatio: 0.72, targetTrees: 1200 },
  // 3. East Ridge Great Forest (Northeast Highland Woods overlooking Bay & Railway)
  { name: 'East Ridge Forest', x: 260, z: -320, radius: 165, pineRatio: 0.86, targetTrees: 1200 },
  // 4. Alpine Lake Pine Sanctuary (Lush Mountain Spruce Forest Ringing Alpine Lake)
  { name: 'Alpine Lake Woods', x: -430, z: 140, radius: 140, pineRatio: 0.96, targetTrees: 900 }
];

// Procedural Deterministic Firewatch Dense Forest & Woodland Generator
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

  const MAX_PINES = 5400;
  const MAX_DEC = 1400;
  const MAX_SHRUBS = 800;

  // Strict clearance verification for all candidate tree positions
  function isTreePositionClear(x, z, y) {
    const falloff = getIslandFalloff(x, z);
    if (falloff < 0.94) return false;

    // Strict Water & Bay Clearance: Never spawn trees in the ocean, carved harbor bay, or under ships
    if (z < -490 && Math.abs(x - 280) < 220) return false;

    // Keep clearings around central substation & interchange
    if (Math.hypot(x, z + 30) < 88) return false;

    // Keep clearings around all Living Settlements & Beach Campgrounds
    for (let s = 0; s < SETTLEMENT_ZONES.length; s++) {
      const sz = SETTLEMENT_ZONES[s];
      if (Math.hypot(x - sz.x, z - sz.z) < sz.radius + 6) {
        return false;
      }
    }

    // 100% Strict Infrastructure & River Clearance: Trees NEVER spawn on roads, railways, or in rivers
    for (let r = 0; r < INFRASTRUCTURE_CLEARANCE_POINTS.length; r++) {
      const ip = INFRASTRUCTURE_CLEARANCE_POINTS[r];
      const dx = x - ip.x;
      const dz = z - ip.z;
      if (Math.abs(dx) < 14.0 && Math.abs(dz) < 14.0) {
        if (dx * dx + dz * dz < ip.minDistSq) {
          return false;
        }
      }
    }

    // Lake clearing (preserve water & immediate shoreline)
    const distLake = Math.hypot(x - ALPINE_LAKE_CENTER.x, z - ALPINE_LAKE_CENTER.z);
    if (distLake < ALPINE_LAKE_CENTER.radius + 8) return false;

    // Keep building clearance around all 24 energy sites (78m flat plateau)
    for (let s = 0; s < KNOWN_SITES.length; s++) {
      if (Math.hypot(x - KNOWN_SITES[s].x, z - KNOWN_SITES[s].z) < 78) {
        return false;
      }
    }

    // Strict water clearance & summit crag clearance
    if (y < 2.0 || y > 70) return false;

    return true;
  }

  // ===========================================================================
  // PHASE 1: TARGETED HIGH-DENSITY FOREST BIOMES (SIK AĞAÇLI ORMANLIK ALANLAR)
  // Creates realistic, dense forest canopies with natural tree clusters & groves
  // ===========================================================================
  for (let b = 0; b < DENSE_FOREST_ZONES.length; b++) {
    const fz = DENSE_FOREST_ZONES[b];
    let treesInZone = 0;
    const maxAttempts = fz.targetTrees * 4;

    for (let a = 0; a < maxAttempts && treesInZone < fz.targetTrees; a++) {
      const ang = random() * Math.PI * 2;
      const rad = Math.sqrt(random()) * fz.radius;
      const x = fz.x + Math.cos(ang) * rad;
      const z = fz.z + Math.sin(ang) * rad;
      const y = getTerrainHeight(x, z);

      if (!isTreePositionClear(x, z, y)) continue;

      const isPine = random() < fz.pineRatio;
      let type = isPine ? 'pine' : (random() > 0.35 ? 'deciduous' : 'shrub');

      if (type === 'pine' && pineCount >= MAX_PINES) continue;
      if (type === 'deciduous' && decCount >= MAX_DEC) continue;
      if (type === 'shrub' && shrubCount >= MAX_SHRUBS) continue;

      if (type === 'pine') pineCount++;
      else if (type === 'deciduous') decCount++;
      else if (type === 'shrub') shrubCount++;

      // Multi-story canopy scaling (mature tall trees and younger understory)
      const scale = 0.75 + random() * 0.85;
      const rotY = random() * Math.PI * 2;
      locations.push({ x, y, z, scale, rotY, type });
      treesInZone++;

      // Natural Dense Forest Clumping: 45% chance to add a companion tree / shrub in a close grove
      if (random() < 0.45 && treesInZone < fz.targetTrees) {
        const cAngle = random() * Math.PI * 2;
        const cDist = 3.2 + random() * 4.2;
        const cx = x + Math.cos(cAngle) * cDist;
        const cz = z + Math.sin(cAngle) * cDist;
        const cy = getTerrainHeight(cx, cz);

        if (isTreePositionClear(cx, cz, cy)) {
          const cType = random() < 0.75 ? type : 'shrub';
          if (cType === 'pine' && pineCount < MAX_PINES) {
            pineCount++;
            locations.push({ x: cx, y: cy, z: cz, scale: scale * (0.65 + random() * 0.35), rotY: random() * Math.PI * 2, type: 'pine' });
            treesInZone++;
          } else if (cType === 'deciduous' && decCount < MAX_DEC) {
            decCount++;
            locations.push({ x: cx, y: cy, z: cz, scale: scale * (0.65 + random() * 0.35), rotY: random() * Math.PI * 2, type: 'deciduous' });
            treesInZone++;
          } else if (cType === 'shrub' && shrubCount < MAX_SHRUBS) {
            shrubCount++;
            locations.push({ x: cx, y: cy, z: cz, scale: 0.8 + random() * 0.6, rotY: random() * Math.PI * 2, type: 'shrub' });
            treesInZone++;
          }
        }
      }
    }
  }

  // ===========================================================================
  // PHASE 2: ISLAND-WIDE NATURAL VEGETATION FILL
  // Disperses natural trees across meadows, valleys, hills & savannas
  // ===========================================================================
  for (let i = 0; i < 9000; i++) {
    if (pineCount >= MAX_PINES && decCount >= MAX_DEC && shrubCount >= MAX_SHRUBS) break;

    const angle = random() * Math.PI * 2;
    const rad = Math.sqrt(random()) * 1050;
    const x = Math.cos(angle) * rad;
    const z = Math.sin(angle) * rad;
    const y = getTerrainHeight(x, z);

    if (!isTreePositionClear(x, z, y)) continue;

    // Biome determination matching Firewatch national forest distribution
    let type = 'pine';
    const isWesternHighlands = x < -45;
    const isNearTower = Math.hypot(x - (-230), z - (-15)) < 190;
    const distLake = Math.hypot(x - ALPINE_LAKE_CENTER.x, z - ALPINE_LAKE_CENTER.z);
    const isNearLake = distLake < 170;

    if (isWesternHighlands || isNearTower || isNearLake || y > 24) {
      type = random() > 0.08 ? 'pine' : 'deciduous';
    } else if (x > 140 && z > 60) {
      type = random() > 0.55 ? 'shrub' : random() > 0.4 ? 'deciduous' : 'pine';
    } else {
      type = random() > 0.45 ? 'pine' : random() > 0.4 ? 'deciduous' : 'shrub';
    }

    if (type === 'pine' && pineCount >= MAX_PINES) continue;
    if (type === 'deciduous' && decCount >= MAX_DEC) continue;
    if (type === 'shrub' && shrubCount >= MAX_SHRUBS) continue;

    if (type === 'pine') pineCount++;
    else if (type === 'deciduous') decCount++;
    else if (type === 'shrub') shrubCount++;

    const scale = 0.82 + random() * 0.78;
    const rotY = random() * Math.PI * 2;
    locations.push({ x, y, z, scale, rotY, type });
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

  // Global island-wide bounding sphere & box to prevent premature frustum culling on instanced vegetation
  const islandBounds = useMemo(() => ({
    sphere: new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2800),
    box: new THREE.Box3(new THREE.Vector3(-1450, -100, -1450), new THREE.Vector3(1450, 300, 1450))
  }), []);

  const pineTrunkGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.24, 0.44, 2.6, 5);
    geo.translate(0, 1.3, 0);
    geo.boundingSphere = islandBounds.sphere;
    geo.boundingBox = islandBounds.box;
    return geo;
  }, [islandBounds]);

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

    const merged = BufferGeometryUtils.mergeGeometries([t1, t2, t3, t4]);
    merged.boundingSphere = islandBounds.sphere;
    merged.boundingBox = islandBounds.box;
    return merged;
  }, [islandBounds]);

  const decTrunkGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.28, 0.45, 2.2, 5);
    geo.translate(0, 1.1, 0);
    geo.boundingSphere = islandBounds.sphere;
    geo.boundingBox = islandBounds.box;
    return geo;
  }, [islandBounds]);

  const decFoliageGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(2.2, 1);
    geo.translate(0, 3.8, 0);
    geo.boundingSphere = islandBounds.sphere;
    geo.boundingBox = islandBounds.box;
    return geo;
  }, [islandBounds]);

  const shrubGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1.4, 0);
    geo.scale(1.3, 0.75, 1.3);
    geo.translate(0, 0.7, 0);
    geo.boundingSphere = islandBounds.sphere;
    geo.boundingBox = islandBounds.box;
    return geo;
  }, [islandBounds]);

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
      pineTrunkRef.current.frustumCulled = false;
      pineTrunkRef.current.instanceMatrix.needsUpdate = true;
      pineTrunkRef.current.count = pCount;
    }
    if (pineFoliageRef.current) {
      pineFoliageRef.current.frustumCulled = false;
      pineFoliageRef.current.instanceMatrix.needsUpdate = true;
      pineFoliageRef.current.count = pCount;
    }
    if (decTrunkRef.current) {
      decTrunkRef.current.frustumCulled = false;
      decTrunkRef.current.instanceMatrix.needsUpdate = true;
      decTrunkRef.current.count = dCount;
    }
    if (decFoliageRef.current) {
      decFoliageRef.current.frustumCulled = false;
      decFoliageRef.current.instanceMatrix.needsUpdate = true;
      decFoliageRef.current.count = dCount;
    }
    if (shrubRef.current) {
      shrubRef.current.frustumCulled = false;
      shrubRef.current.instanceMatrix.needsUpdate = true;
      shrubRef.current.count = sCount;
    }
  }, [vegData]);

  return (
    <group>
      {/* 4-Tier Firewatch Coniferous Pines */}
      <instancedMesh
        ref={pineTrunkRef}
        args={[pineTrunkGeo, null, 5600]}
        frustumCulled={false}
        castShadow
      >
        <meshStandardMaterial color="#3b1d12" roughness={0.92} />
      </instancedMesh>
      <instancedMesh
        ref={pineFoliageRef}
        args={[pineFoliageGeo, null, 5600]}
        frustumCulled={false}
        castShadow
      >
        <meshStandardMaterial color={pineFoliageColor} roughness={0.84} />
      </instancedMesh>

      {/* Deciduous Valley Trees */}
      <instancedMesh
        ref={decTrunkRef}
        args={[decTrunkGeo, null, 1500]}
        frustumCulled={false}
        castShadow
      >
        <meshStandardMaterial color="#6b3414" roughness={0.9} />
      </instancedMesh>
      <instancedMesh
        ref={decFoliageRef}
        args={[decFoliageGeo, null, 1500]}
        frustumCulled={false}
        castShadow
      >
        <meshStandardMaterial color={decFoliageColor} roughness={0.78} />
      </instancedMesh>

      {/* Flowering Meadow Shrubs */}
      <instancedMesh
        ref={shrubRef}
        args={[shrubGeo, null, 900]}
        frustumCulled={false}
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

// =============================================================================
// CAMERA CONTROLLER: SMART CURSOR-CENTRIC ZOOM, ANTI-STALL & AUTO-FOCUS
// =============================================================================
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
  }, [focusedSite, worldSites, enabled]);

  // Ray-terrain ground intersection helper under mouse pointer
  const getGroundIntersection = useCallback(
    (e) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
      const ray = raycaster.ray;

      if (ray.direction.y < -0.008) {
        // Intersects downward towards terrain: 3 rapid mathematical iterations
        let t = Math.max(0, -ray.origin.y / ray.direction.y);
        let p = ray.origin.clone().addScaledVector(ray.direction, t);
        let h = getTerrainHeight(p.x, p.z);
        t = Math.max(0, (h - ray.origin.y) / ray.direction.y);
        p = ray.origin.clone().addScaledVector(ray.direction, t);
        h = getTerrainHeight(p.x, p.z);
        t = Math.max(0, (h - ray.origin.y) / ray.direction.y);
        p = ray.origin.clone().addScaledVector(ray.direction, t);
        return { point: p, isGround: true };
      }

      const currentTarget = controlsRef?.current?.target || new THREE.Vector3(0, 0, 0);
      return { point: currentTarget.clone(), isGround: false };
    },
    [camera, gl, controlsRef]
  );

  // Smart Rotation-Free Zoom & Anti-Stall Controller (Effortless, Fast, Zero Rotation, Closes down to 3.5m)
  useEffect(() => {
    const controls = controlsRef?.current;
    const domElement = gl?.domElement;
    if (!controls || !domElement) return;

    const cancelAnimation = () => {
      isAnimating.current = false;
      targetLookAt.current = null;
      targetCamPos.current = null;
    };

    const handleWheel = (e) => {
      if (!enabled || !controlsRef?.current) return;
      e.preventDefault();
      e.stopPropagation();

      cancelAnimation();

      const ctrl = controlsRef.current;
      const target = ctrl.target;
      const camPos = camera.position;

      // 1. Current offset vector from target to camera defines the exact line of sight
      const offset = new THREE.Vector3().subVectors(camPos, target);
      const currentDist = offset.length();

      // Guard against degenerate distances
      if (currentDist < 0.1) return;

      // Line-of-sight unit vector pointing from target to camera (fixed heading & pitch!)
      // Keeping this vector strictly invariant guarantees the map NEVER rotates or twists during zoom!
      const lookUnit = offset.clone().normalize();

      // 2. Wheel event sensitivity & trackpad handling
      const isZoomIn = e.deltaY < 0;
      const isTrackpad = Math.abs(e.deltaY) < 30;
      const deltaMag = Math.min(Math.abs(e.deltaY), 120);
      const intensity = isTrackpad
        ? Math.max(0.25, deltaMag * 0.05)
        : Math.max(0.65, Math.min(1.8, deltaMag / 60));

      if (isZoomIn) {
        // Fast yet smooth step that NEVER stalls: guaranteed minimum step of 2.5m
        const step = Math.max(2.5, currentDist * 0.18) * intensity;
        const newDist = Math.max(3.5, currentDist - step);

        // Smoothly shift target towards cursor ground point WITHOUT altering lookUnit orientation
        const { point: anchorPoint, isGround } = getGroundIntersection(e);
        if (isGround && anchorPoint) {
          // Slide target horizontally towards anchor point under cursor
          const shiftX = (anchorPoint.x - target.x) * 0.10 * intensity;
          const shiftZ = (anchorPoint.z - target.z) * 0.10 * intensity;
          target.x += shiftX;
          target.z += shiftZ;
          const desiredGroundY = getTerrainHeight(target.x, target.z) + 1.2;
          target.y = THREE.MathUtils.lerp(target.y, desiredGroundY, 0.25);
        }

        // Apply new camera position STRICTLY along lookUnit:
        // camPos = target + lookUnit * newDist -> preserves azimuth & polar angles identically!
        camPos.copy(target).addScaledVector(lookUnit, newDist);

        // Terrain collision guard: ensure camera never dips below terrain
        const terrainH = getTerrainHeight(camPos.x, camPos.z);
        const minCamY = terrainH + 1.8;
        if (camPos.y < minCamY) {
          if (lookUnit.y > 0.05) {
            const safeDist = (minCamY - target.y) / lookUnit.y;
            if (safeDist > newDist) {
              camPos.copy(target).addScaledVector(lookUnit, safeDist);
            }
          } else {
            camPos.y = minCamY;
          }
        }
      } else {
        // Zoom OUT: smoothly pull back strictly along lookUnit without changing orientation
        const step = Math.max(3.5, currentDist * 0.18) * intensity;
        const newDist = Math.min(2400, currentDist + step);

        camPos.copy(target).addScaledVector(lookUnit, newDist);
      }

      // 3. Neutralize any residual rotational or pan damping inertia from prior drag gestures
      if (ctrl._sphericalDelta) {
        ctrl._sphericalDelta.set(0, 0, 0);
      }
      if (ctrl._panOffset) {
        ctrl._panOffset.set(0, 0, 0);
      }
      if (ctrl._scale !== undefined) {
        ctrl._scale = 1;
      }

      // 4. Update OrbitControls with new position and target
      ctrl.update();
    };

    controls.addEventListener('start', cancelAnimation);
    domElement.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    domElement.addEventListener('pointerdown', cancelAnimation, { passive: true });

    return () => {
      controls.removeEventListener('start', cancelAnimation);
      domElement.removeEventListener('wheel', handleWheel, { capture: true });
      domElement.removeEventListener('pointerdown', cancelAnimation);
    };
  }, [controlsRef, gl, camera, enabled, getGroundIntersection]);

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
  drivingCameraMode = 'chase',
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
        camera={{ position: [-180, 280, 420], fov: 46, near: 1.0, far: 4500 }}
        shadows={!isLowGraphics}
        dpr={dpr}
        gl={{
          powerPreference: 'high-performance',
          antialias: true
        }}
        className="w-full h-full"
      >
        {/* Dynamic Smooth Camera Controller for Plant Focus & Zoom */}
        <CameraController
          focusedSite={focusedSite}
          worldSites={worldSites}
          controlsRef={controlsRef}
          enabled={!isGroundMode && !isCinematicMode}
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
              shadow-bias={0.00015}
              shadow-normalBias={0.06}
            />
          </>
        )}

        {/* 360-Degree Firewatch Sky Dome (Day Sunset with Sun Disc) / Deep Starlit Night with Radiant Moon */}
        {!isNight ? <FirewatchSkyDome /> : <NightSkyAndMoon />}

        {/* Distant Multi-Layered Firewatch Mountain Silhouette Ridges */}
        <FirewatchDistantMountains />

        {/* Expansive Animated Ocean (Zero-Flicker Shoreline & Smooth Horizon Swell) */}
        <AnimatedOcean isNight={isNight} />

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

        {/* Central High-Voltage Substation Facility (Dedicated Compound North of Roundabout) */}
        <SubstationNode position={[-5, 0, -64]} showLabels={showSiteLabels} />

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

        {/* Power Grid Lines from Central Substation Terminal Pylon to key sites (Toggled via Settings) */}
        {showInfrastructure &&
          worldSites.slice(0, 10).map((site) => {
            const cx = Number(site?.center_x);
            const cz = Number(site?.center_z);
            if (!Number.isFinite(cx) || !Number.isFinite(cz)) return null;
            return (
              <PowerLine
                key={`line_${site.id}`}
                from={[-5, 24.5, -86]}
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

          // 1 game week = 168 game hours construction duration
          const elapsedHours = Math.max(0, (Number(clock?.gameHour) || 0) - Number(asset.installed_game_hour || 0));
          const isUnderConstruction = elapsedHours < 168;
          const constructionProgress = Math.min(1.0, Math.max(0.0, elapsedHours / 168));

          if (asset.equipment_catalog?.equipment_type === 'wind_turbine') {
            const sitePrevailingAngle = getSitePrevailingWindAngle(worldSite);
            const microOffset = ((turbineIndexInSite * 3) % 7) - 3; // tiny ±3° natural micro-alignment variation
            const siteBaseAngle = sitePrevailingAngle + microOffset;

            // Render active construction site with crane, transport trucks and crew during 1st week
            if (isUnderConstruction) {
              const remainingHours = Math.max(0, 168 - elapsedHours);
              return (
                <WindTurbineConstructionSite
                  key={asset.id}
                  position={[posX, posY, posZ]}
                  siteBaseAngle={siteBaseAngle}
                  progress={constructionProgress}
                  remainingHours={remainingHours}
                  equipmentName={asset.equipment_catalog?.model_name || 'Rüzgar Türbini'}
                  isNight={Boolean(clock?.isNight)}
                  onClick={() => worldSite && onSelectSite(worldSite)}
                />
              );
            }

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
            if (isUnderConstruction) {
              const remainingHours = Math.max(0, 168 - elapsedHours);
              return (
                <SolarConstructionSite
                  key={asset.id}
                  position={[posX, posY, posZ]}
                  progress={constructionProgress}
                  remainingHours={remainingHours}
                  equipmentName={asset.equipment_catalog?.model_name || 'Güneş Paneli'}
                  isNight={Boolean(clock?.isNight)}
                  hasTracker={Boolean(cSite?.has_solar_tracker)}
                  onClick={() => worldSite && onSelectSite(worldSite)}
                />
              );
            }

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
          minDistance={1.0}
          maxDistance={2800}
          enablePan={true}
          panSpeed={2.2}
          zoomSpeed={2.0}
          rotateSpeed={0.9}
          screenSpacePanning={true}
          enableDamping={true}
          dampingFactor={0.12}
        />
      </Canvas>
    </div>
  );
}
