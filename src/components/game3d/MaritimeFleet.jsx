'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Procedural Maritime Ocean Fleet
 * Includes:
 * 1. Anchored Large Container Ship (Demir Atmış Büyük Konteyner Gemisi)
 * 2. Anchored Coastal Tanker / Bulk Freighter
 * 3. Active Ocean Fishing Trawler (Balıkçı Gemisi)
 * 4. Small Fishing Boat #1 with Fisherman (Balık Tutan Sandal - Bay)
 * 5. Small Fishing Boat #2 with Fisherman (Balık Tutan Sandal - Cliff Edge)
 * 6. Sailing Yacht (Yelkenli Tekne)
 * 7. Navigational Channel Buoys (Yeşil & Kırmızı Seyir Şamandıraları)
 *
 * All vessels float directly on the ocean water surface (Y = 0.0)
 * with individual realistic wave bobbing, heave, pitch, and roll.
 */

// =============================================================================
// 1. ANCHORED LARGE CONTAINER SHIP
// =============================================================================
function AnchoredContainerShip({ position = [295, 0, -725], rotation = [0, -0.35, 0], isNight = false }) {
  const groupRef = useRef();
  const mastLightRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Stately, heavy vessel wave heave and gentle roll
    groupRef.current.position.y = position[1] + Math.sin(t * 0.72) * 0.09;
    groupRef.current.rotation.x = rotation[0] + Math.sin(t * 0.58) * 0.012;
    groupRef.current.rotation.z = rotation[2] + Math.cos(t * 0.65) * 0.016;

    if (mastLightRef.current) {
      mastLightRef.current.visible = isNight;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Ship Hull: Length 54m, Beam 11.5m, Height 6.2m */}
      {/* Red Anti-fouling Underbody (at/below waterline) */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[11.2, 1.8, 52]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
      </mesh>

      {/* Main Dark Navy Hull Body */}
      <mesh position={[0, 2.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[11.6, 2.6, 53]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} />
      </mesh>

      {/* Tapered Bulbous Bow Wedge */}
      <group position={[0, 2.4, -27]}>
        <mesh rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[5.8, 6.5, 4]} rotation={[-Math.PI / 2, Math.PI / 4, 0]} />
          <meshStandardMaterial color="#0f172a" roughness={0.45} />
        </mesh>
      </group>

      {/* Raised Forecastle Deck */}
      <mesh position={[0, 4.1, -23]} castShadow>
        <boxGeometry args={[10.6, 0.8, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      {/* Bow Jackstaff / Mast */}
      <mesh position={[0, 6.0, -26]}>
        <cylinderGeometry args={[0.08, 0.12, 3.8, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
      </mesh>

      {/* Heavy Iron Anchor Chain dropping from Port Hawsepipe into Water */}
      <group position={[-5.4, 2.6, -23]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.3, 10]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </mesh>
        {/* Slanted chain down to water */}
        <mesh position={[-0.8, -1.8, 0.5]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.1, 0.1, 4.2, 8]} />
          <meshStandardMaterial color="#27272a" metalness={0.9} roughness={0.8} />
        </mesh>
        {/* Floating Yellow Anchor Marker Buoy */}
        <mesh position={[-2.2, -2.6, 1.2]}>
          <sphereGeometry args={[0.55, 12, 12]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} />
        </mesh>
      </group>

      {/* Cargo Deck Beds (Low deck recess) */}
      <mesh position={[0, 3.8, -3]} receiveShadow>
        <boxGeometry args={[10.8, 0.3, 30]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Stacked Intermodal Shipping Containers (Vibrant authentic cargo colors) */}
      {/* Bay 1 (Forward) */}
      <group position={[0, 4.9, -13]}>
        <mesh position={[-2.6, 0, 0]} castShadow>
          <boxGeometry args={[4.8, 2.1, 10]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[2.6, 0, 0]} castShadow>
          <boxGeometry args={[4.8, 2.1, 10]} />
          <meshStandardMaterial color="#c2410c" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[-2.6, 2.1, 0]} castShadow>
          <boxGeometry args={[4.8, 2.1, 10]} />
          <meshStandardMaterial color="#15803d" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[2.6, 2.1, 0]} castShadow>
          <boxGeometry args={[4.8, 2.1, 10]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, 4.1, 0]} castShadow>
          <boxGeometry args={[4.8, 2.0, 9.8]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.4} metalness={0.2} />
        </mesh>
      </group>

      {/* Bay 2 (Midships) */}
      <group position={[0, 4.9, 0]}>
        <mesh position={[-2.6, 0, 0]} castShadow>
          <boxGeometry args={[4.8, 2.1, 11]} />
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[2.6, 0, 0]} castShadow>
          <boxGeometry args={[4.8, 2.1, 11]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[-2.6, 2.1, 0]} castShadow>
          <boxGeometry args={[4.8, 2.1, 11]} />
          <meshStandardMaterial color="#c2410c" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[2.6, 2.1, 0]} castShadow>
          <boxGeometry args={[4.8, 2.1, 11]} />
          <meshStandardMaterial color="#16a34a" roughness={0.4} metalness={0.2} />
        </mesh>
      </group>

      {/* Stern Superstructure / Multi-Deck Bridge */}
      <group position={[0, 4.0, 16]}>
        {/* Tier 1 Accommodation */}
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[9.8, 2.8, 9]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Tier 2 Cabin deck */}
        <mesh position={[0, 3.8, 0]} castShadow>
          <boxGeometry args={[9.2, 2.0, 8.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Navigation Bridge / Wheelhouse with Wing Cantilevers */}
        <mesh position={[0, 5.7, 0]} castShadow>
          <boxGeometry args={[11.8, 1.8, 7.2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Bridge Wrap-around Windows */}
        <mesh position={[0, 5.8, -3.65]}>
          <planeGeometry args={[10.8, 1.1]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.8} />
        </mesh>

        {/* Port & Starboard Navigation Wing Lights */}
        <mesh position={[-5.95, 6.0, 0]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[5.95, 6.0, 0]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>

        {/* Orange Davit Lifeboats */}
        <mesh position={[-5.1, 3.5, 0]} castShadow>
          <boxGeometry args={[1.0, 1.0, 3.6]} />
          <meshStandardMaterial color="#ea580c" roughness={0.5} />
        </mesh>
        <mesh position={[5.1, 3.5, 0]} castShadow>
          <boxGeometry args={[1.0, 1.0, 3.6]} />
          <meshStandardMaterial color="#ea580c" roughness={0.5} />
        </mesh>

        {/* Smokestack Funnel behind bridge */}
        <group position={[0, 6.8, 4.8]}>
          <mesh castShadow>
            <cylinderGeometry args={[1.1, 1.4, 4.6, 12]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <cylinderGeometry args={[1.12, 1.12, 0.8, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
        </group>

        {/* Rooftop Main Communication Radar Mast */}
        <group position={[0, 8.2, -1.0]}>
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.3, 5.2, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
          </mesh>
          {/* Radar Scanner Bar */}
          <mesh position={[0, 4.2, 0]}>
            <boxGeometry args={[2.4, 0.22, 0.3]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          {/* Masthead Night Beacon */}
          <mesh ref={mastLightRef} position={[0, 5.2, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// =============================================================================
// 2. ANCHORED COASTAL TANKER / BULK FREIGHTER
// =============================================================================
function AnchoredCoastalTanker({ position = [240, 0, -810], rotation = [0, 0.22, 0], isNight = false }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + 1.8;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.68) * 0.08;
    groupRef.current.rotation.x = rotation[0] + Math.sin(t * 0.52) * 0.01;
    groupRef.current.rotation.z = rotation[2] + Math.cos(t * 0.6) * 0.014;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Tanker Hull: Length 42m, Beam 9.2m */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.2, 3.4, 42]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      {/* Bow taper */}
      <mesh position={[0, 1.8, -22]}>
        <coneGeometry args={[4.6, 5.2, 4]} rotation={[-Math.PI / 2, Math.PI / 4, 0]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>

      {/* Cargo Piping & Catwalk Deck */}
      <mesh position={[0, 3.6, -4]} receiveShadow>
        <boxGeometry args={[8.4, 0.25, 26]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {/* Central Pipeline Catwalk */}
      <mesh position={[0, 4.2, -4]}>
        <boxGeometry args={[1.2, 0.8, 24]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Long Tanker Deck Manifold Pipes */}
      {[-2.2, 2.2].map((px, i) => (
        <mesh key={`pipe_${i}`} position={[px, 4.0, -4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 24, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
      ))}

      {/* Aft Wheelhouse & Accommodation */}
      <group position={[0, 3.6, 13]}>
        <mesh position={[0, 2.0, 0]} castShadow>
          <boxGeometry args={[8.0, 3.8, 7.5]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
        </mesh>
        {/* Navigation Windows */}
        <mesh position={[0, 3.0, -3.8]}>
          <planeGeometry args={[7.2, 1.0]} />
          <meshStandardMaterial color="#0369a1" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Funnel */}
        <mesh position={[0, 4.6, 2.2]} castShadow>
          <cylinderGeometry args={[0.8, 1.0, 3.2, 10]} />
          <meshStandardMaterial color="#e11d48" roughness={0.5} />
        </mesh>
        {/* Mast */}
        <mesh position={[0, 5.2, -1.2]}>
          <cylinderGeometry args={[0.08, 0.15, 3.6, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
      </group>

      {/* Bow Anchor Chain */}
      <mesh position={[-4.0, 1.2, -18]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.08, 0.08, 3.5, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} />
      </mesh>
    </group>
  );
}

// =============================================================================
// 3. ACTIVE OCEAN FISHING TRAWLER (BALIKÇI GEMİSİ)
// =============================================================================
function ActiveFishingTrawler({ position = [275, 0, -655], rotation = [0, 0.65, 0], isNight = false }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + 2.5;
    // Energetic fishing vessel wave swell
    groupRef.current.position.y = position[1] + Math.sin(t * 1.1) * 0.13;
    groupRef.current.rotation.x = rotation[0] + Math.sin(t * 0.95) * 0.035;
    groupRef.current.rotation.z = rotation[2] + Math.cos(t * 1.05) * 0.045;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Trawler Hull (Length 19m, Width 5.6m, Height 2.8m) */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.4, 2.4, 18]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
      </mesh>
      {/* High Flared Bow Wedge */}
      <mesh position={[0, 1.5, -9.5]} castShadow>
        <coneGeometry args={[2.7, 3.8, 4]} rotation={[-Math.PI / 2, Math.PI / 4, 0]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
      </mesh>
      {/* Orange Safety Gunwale Stripe */}
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[5.55, 0.25, 18.2]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} />
      </mesh>

      {/* Forward Wheelhouse / Cabin */}
      <group position={[0, 2.4, -3.2]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[4.2, 2.6, 5.2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Bridge Wrap-around Glass Windows */}
        <mesh position={[0, 2.0, -2.62]}>
          <planeGeometry args={[3.8, 0.9]} />
          <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.7} />
        </mesh>
        {/* Radar Mast & Searchlight */}
        <mesh position={[0, 3.6, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 2.2, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        {isNight && (
          <mesh position={[0, 4.4, -0.6]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        )}
      </group>

      {/* Aft Open Work Deck with Fishing Equipment */}
      <mesh position={[0, 2.2, 4.0]} receiveShadow>
        <boxGeometry args={[5.0, 0.3, 8.8]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Heavy Steel Stern Gantry (A-Frame Arch for Trailing Nets) */}
      <group position={[0, 2.4, 7.8]}>
        {/* Left Leg */}
        <mesh position={[-2.2, 2.2, 0]} rotation={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[0.3, 4.6, 0.3]} />
          <meshStandardMaterial color="#eab308" roughness={0.6} metalness={0.4} />
        </mesh>
        {/* Right Leg */}
        <mesh position={[2.2, 2.2, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.3, 4.6, 0.3]} />
          <meshStandardMaterial color="#eab308" roughness={0.6} metalness={0.4} />
        </mesh>
        {/* Top Crossbar */}
        <mesh position={[0, 4.4, 0]} castShadow>
          <boxGeometry args={[4.4, 0.3, 0.3]} />
          <meshStandardMaterial color="#eab308" roughness={0.6} metalness={0.4} />
        </mesh>
      </group>

      {/* Twin Outrigger Boom Arms */}
      <mesh position={[-3.2, 3.6, -1]} rotation={[0.2, 0, -0.55]}>
        <cylinderGeometry args={[0.07, 0.09, 6.5, 6]} />
        <meshStandardMaterial color="#ca8a04" metalness={0.5} />
      </mesh>
      <mesh position={[3.2, 3.6, -1]} rotation={[0.2, 0, 0.55]}>
        <cylinderGeometry args={[0.07, 0.09, 6.5, 6]} />
        <meshStandardMaterial color="#ca8a04" metalness={0.5} />
      </mesh>

      {/* Rolled Fishing Nets Stack on Deck */}
      <mesh position={[-1.2, 2.7, 4.5]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 2.4, 10]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#14532d" roughness={0.9} />
      </mesh>
      {/* Trawling Winch Drum */}
      <mesh position={[0, 2.8, 1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 1.6, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Blue & Orange Fish Crates */}
      <mesh position={[1.4, 2.6, 3.8]}>
        <boxGeometry args={[0.9, 0.6, 1.2]} />
        <meshStandardMaterial color="#0284c7" roughness={0.7} />
      </mesh>
      <mesh position={[1.4, 2.6, 5.2]}>
        <boxGeometry args={[0.9, 0.6, 1.2]} />
        <meshStandardMaterial color="#ea580c" roughness={0.7} />
      </mesh>
    </group>
  );
}

// =============================================================================
// 4. SMALL FISHING BOAT #1 WITH ANGLER (BALIK TUTAN SANDAL - BAY)
// =============================================================================
function SmallFishingBoatWithAngler({ position = [245, 0, -625], rotation = [0, 1.2, 0], isNight = false }) {
  const boatRef = useRef();
  const rodRef = useRef();

  useFrame(({ clock }) => {
    if (!boatRef.current) return;
    const t = clock.getElapsedTime() * 1.5;
    // Lively, gentle rowboat rocking on coastal waves
    boatRef.current.position.y = position[1] + Math.sin(t * 1.3) * 0.16;
    boatRef.current.rotation.x = rotation[0] + Math.sin(t * 1.1) * 0.06;
    boatRef.current.rotation.z = rotation[2] + Math.cos(t * 1.25) * 0.07;

    // Subtle rod twitch when fishing
    if (rodRef.current) {
      rodRef.current.rotation.z = -0.35 + Math.sin(t * 2.8) * 0.025;
    }
  });

  return (
    <group ref={boatRef} position={position} rotation={rotation}>
      {/* Wooden Clinker Rowboat Hull (Length 5.2m, Width 1.85m) */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.85, 5.2]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Pointed Bow Wedge */}
      <mesh position={[0, 0.52, -2.9]} castShadow>
        <coneGeometry args={[0.95, 1.5, 4]} rotation={[-Math.PI / 2, Math.PI / 4, 0]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Boat Interior Deck Floor */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.5, 0.1, 4.4]} />
        <meshStandardMaterial color="#92400e" roughness={0.9} />
      </mesh>
      {/* White Trim Gunwale */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[1.92, 0.12, 5.3]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>

      {/* Wooden Bench Thwarts */}
      <mesh position={[0, 0.6, -0.6]}>
        <boxGeometry args={[1.65, 0.1, 0.5]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.6, 1.2]}>
        <boxGeometry args={[1.65, 0.1, 0.5]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>

      {/* Pair of Wooden Oars Resting on Rowlocks */}
      <group position={[-1.0, 0.82, -0.4]} rotation={[0.2, 0, 0.4]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.6, 6]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.2, 0.5, 0.03]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>
      <group position={[1.0, 0.82, -0.4]} rotation={[0.2, 0, -0.4]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.6, 6]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.2, 0.5, 0.03]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>

      {/* SEATED LOW-POLY FISHERMAN */}
      <group position={[0, 0.65, 1.1]}>
        {/* Legs / Seated Thighs */}
        <mesh position={[0, 0.15, -0.2]}>
          <boxGeometry args={[0.5, 0.25, 0.5]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
        </mesh>
        {/* Torso in Yellow Foul-Weather Slicker Jacket */}
        <mesh position={[0, 0.58, 0]} castShadow>
          <boxGeometry args={[0.55, 0.6, 0.38]} />
          <meshStandardMaterial color="#eab308" roughness={0.6} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.02, 0]} castShadow>
          <sphereGeometry args={[0.18, 10, 10]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.7} />
        </mesh>
        {/* Yellow Sou'wester Fisherman Rain Hat */}
        <group position={[0, 1.14, 0]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.2, 0.16, 12]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.06, 0.05]} rotation={[-0.1, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.04, 12]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.5} />
          </mesh>
        </group>

        {/* Arms holding the fishing rod */}
        <group ref={rodRef} position={[0.25, 0.55, 0.1]}>
          {/* Extended Right Arm */}
          <mesh position={[0.15, 0, -0.1]} rotation={[0.4, 0.2, -0.3]}>
            <boxGeometry args={[0.12, 0.12, 0.42]} />
            <meshStandardMaterial color="#eab308" roughness={0.6} />
          </mesh>
          {/* Long Slender Fishing Rod */}
          <group position={[0.28, 0.1, -0.32]} rotation={[0.3, 0.2, -0.6]}>
            {/* Cork Handle */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color="#b45309" roughness={0.9} />
            </mesh>
            {/* Fishing Reel */}
            <mesh position={[0, 0.22, 0.06]}>
              <cylinderGeometry args={[0.06, 0.06, 0.06, 8]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            {/* Carbon Fiber Rod Blank extending out over the water */}
            <mesh position={[0, 1.6, 0]}>
              <cylinderGeometry args={[0.012, 0.025, 2.8, 8]} />
              <meshStandardMaterial color="#18181b" roughness={0.4} />
            </mesh>

            {/* Slender Fishing Line Angling Downwards to the Ocean Water */}
            <mesh position={[0.1, 2.2, 0.8]} rotation={[0.5, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 2.4, 4]} />
              <meshBasicMaterial color="#e2e8f0" transparent opacity={0.65} />
            </mesh>

            {/* Red & White Fishing Bobber Floating on Water Surface */}
            <group position={[0.15, 1.4, 1.8]}>
              <mesh position={[0, 0.04, 0]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
              <mesh position={[0, -0.04, 0]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color="#f8fafc" />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* Wooden Tackle Box & Metal Fish Bucket */}
      <mesh position={[-0.35, 0.48, 0.3]} castShadow>
        <boxGeometry args={[0.42, 0.24, 0.3]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>
      <mesh position={[0.4, 0.52, 0.2]}>
        <cylinderGeometry args={[0.18, 0.15, 0.32, 10]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Bow Brass Night Lantern */}
      <group position={[0, 1.0, -2.4]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.22, 8]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.7} />
        </mesh>
        {isNight && (
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        )}
      </group>
    </group>
  );
}

// =============================================================================
// 5. SMALL FISHING BOAT #2 (BALIK TUTAN SANDAL - CLIFF / DEEP WATER)
// =============================================================================
function CliffFishingBoatWithAngler({ position = [230, 0, -655], rotation = [0, -0.5, 0], isNight = false }) {
  const boatRef = useRef();

  useFrame(({ clock }) => {
    if (!boatRef.current) return;
    const t = clock.getElapsedTime() * 1.4 + 1.2;
    boatRef.current.position.y = position[1] + Math.sin(t * 1.25) * 0.15;
    boatRef.current.rotation.x = rotation[0] + Math.sin(t * 1.05) * 0.055;
    boatRef.current.rotation.z = rotation[2] + Math.cos(t * 1.2) * 0.065;
  });

  return (
    <group ref={boatRef} position={position} rotation={rotation}>
      {/* Forest Green & White Dory Boat (Length 4.8m, Width 1.7m) */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.8, 4.8]} />
        <meshStandardMaterial color="#166534" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, -2.6]} castShadow>
        <coneGeometry args={[0.85, 1.4, 4]} rotation={[-Math.PI / 2, Math.PI / 4, 0]} />
        <meshStandardMaterial color="#166534" roughness={0.7} />
      </mesh>
      {/* White Inner Deck */}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[1.35, 0.1, 4.0]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[1.78, 0.1, 4.9]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      {/* STANDING / CASTING ANGLER */}
      <group position={[0, 0.35, -0.4]}>
        {/* Legs in Navy Bib Pants */}
        <mesh position={[-0.14, 0.45, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.9, 8]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
        </mesh>
        <mesh position={[0.14, 0.45, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.9, 8]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
        </mesh>
        {/* Orange Marine Parka */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.52, 0.65, 0.35]} />
          <meshStandardMaterial color="#ea580c" roughness={0.7} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.68, 0]}>
          <sphereGeometry args={[0.17, 10, 10]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.7} />
        </mesh>
        {/* Knit Beanie */}
        <mesh position={[0, 1.82, 0]}>
          <sphereGeometry args={[0.18, 10, 10]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Fishing Rod cast out */}
        <group position={[-0.2, 1.3, -0.2]} rotation={[0.4, -0.3, 0.4]}>
          <mesh position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.015, 0.03, 2.7, 8]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          {/* Angled line to water */}
          <mesh position={[-0.1, 1.8, 0.9]} rotation={[0.6, 0, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 2.2, 4]} />
            <meshBasicMaterial color="#e2e8f0" transparent opacity={0.6} />
          </mesh>
          {/* Red/White Float */}
          <mesh position={[-0.1, 1.0, 1.8]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* Fresh Fish Basket & Spare Oars */}
      <mesh position={[0, 0.52, 1.4]}>
        <cylinderGeometry args={[0.26, 0.22, 0.35, 10]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {/* Caught Silver Fish in basket */}
      <mesh position={[0, 0.72, 1.4]} rotation={[0.3, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.08, 0.32]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

// =============================================================================
// 6. MODERN WHITE SAILING YACHT (YELKENLİ TEKNE)
// =============================================================================
function SailingYacht({ position = [330, 0, -640], rotation = [0, -0.28, 0], isNight = false }) {
  const yachtRef = useRef();

  useFrame(({ clock }) => {
    if (!yachtRef.current) return;
    const t = clock.getElapsedTime() + 0.8;
    // Sleek yacht sailing heel and buoyant wave heave
    yachtRef.current.position.y = position[1] + Math.sin(t * 0.95) * 0.12;
    yachtRef.current.rotation.x = rotation[0] + Math.sin(t * 0.8) * 0.03;
    // Natural sailboat heel leaning in the breeze
    yachtRef.current.rotation.z = rotation[2] - 0.1 + Math.cos(t * 0.9) * 0.035;
  });

  return (
    <group ref={yachtRef} position={position} rotation={rotation}>
      {/* Sleek Hull: Length 13.5m, Width 3.8m */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 1.8, 13.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Sharp Bow Entry */}
      <mesh position={[0, 0.95, -7.2]} castShadow>
        <coneGeometry args={[1.9, 2.8, 4]} rotation={[-Math.PI / 2, Math.PI / 4, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Navy Waterline Stripe */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[3.86, 0.22, 13.6]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
      </mesh>

      {/* Teak Wood Cockpit Deck */}
      <mesh position={[0, 1.82, 0]} receiveShadow>
        <boxGeometry args={[3.5, 0.15, 12.8]} />
        <meshStandardMaterial color="#d97706" roughness={0.7} />
      </mesh>
      {/* Low Coachroof Cabin with Tinted Windows */}
      <mesh position={[0, 2.3, -1.8]} castShadow>
        <boxGeometry args={[2.8, 0.85, 6.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.35, -1.8]}>
        <boxGeometry args={[2.88, 0.4, 4.8]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.15} />
      </mesh>

      {/* Tall Sailing Mast (Height 15m) */}
      <group position={[0, 2.4, -1.2]}>
        <mesh position={[0, 7.5, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.14, 15, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Horizontal Boom */}
        <mesh position={[0, 1.8, 3.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 6.4, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
        </mesh>

        {/* Billowing White Mainsail (Curved triangle in wind) */}
        <mesh position={[0.2, 7.2, 3.2]} rotation={[0, 0.08, 0]}>
          <coneGeometry args={[2.8, 11, 3]} rotation={[0, 0, Math.PI]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* Triangular Jib / Genoa Headsail */}
        <mesh position={[-0.15, 6.4, -3.2]} rotation={[0, -0.06, 0]}>
          <coneGeometry args={[2.2, 9.5, 3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>

        {/* Masthead Tri-color Light */}
        {isNight && (
          <mesh position={[0, 15.2, 0]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        )}
      </group>

      {/* Cockpit Helm Pedestal & Wheel */}
      <group position={[0, 2.1, 4.0]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.7, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.38, 0.03, 8, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// =============================================================================
// 7. MARITIME CHANNEL BUOYS (GREEN & RED WITH NIGHT FLASHING BEACONS)
// =============================================================================
function MaritimeChannelBuoy({ position = [245, 0, -608], color = '#16a34a', isNight = false, periodOffset = 0 }) {
  const buoyRef = useRef();
  const ledRef = useRef();

  useFrame(({ clock }) => {
    if (!buoyRef.current) return;
    const t = clock.getElapsedTime() + periodOffset;
    // Fast buoyant water oscillation
    buoyRef.current.position.y = position[1] + Math.sin(t * 1.8) * 0.14;
    buoyRef.current.rotation.x = Math.sin(t * 1.6) * 0.08;
    buoyRef.current.rotation.z = Math.cos(t * 1.5) * 0.08;

    // Blinking navigation flash
    if (ledRef.current) {
      const flash = Math.sin(t * 3.5) > 0.4;
      ledRef.current.visible = isNight && flash;
    }
  });

  return (
    <group ref={buoyRef} position={position}>
      {/* Cylindrical Float Hull */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 1.2, 12]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Reflective Band */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.25, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Steel Cage Tower */}
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.45, 0.75, 1.2, 8, 1, true]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Top Beacon Light */}
      <mesh ref={ledRef} position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshBasicMaterial color={color === '#16a34a' ? '#4ade80' : '#ef4444'} />
      </mesh>
    </group>
  );
}

// =============================================================================
// MAIN MARITIME FLEET COMPONENT EXPORT
// =============================================================================
export default function MaritimeFleet({ isNight = false }) {
  return (
    <group>
      {/* 1. Anchored Deep-Sea Container Ship */}
      <AnchoredContainerShip position={[295, 0, -725]} rotation={[0, -0.35, 0]} isNight={isNight} />

      {/* 2. Anchored Coastal Tanker / Bulk Freighter */}
      <AnchoredCoastalTanker position={[240, 0, -810]} rotation={[0, 0.22, 0]} isNight={isNight} />

      {/* 3. Active Ocean Fishing Trawler */}
      <ActiveFishingTrawler position={[275, 0, -655]} rotation={[0, 0.65, 0]} isNight={isNight} />

      {/* 4. Small Fishing Rowboat #1 with Angler (Bay Calm Water) */}
      <SmallFishingBoatWithAngler position={[245, 0, -625]} rotation={[0, 1.2, 0]} isNight={isNight} />

      {/* 5. Small Fishing Boat #2 with Standing Angler (Near Cape Rocks) */}
      <CliffFishingBoatWithAngler position={[230, 0, -655]} rotation={[0, -0.5, 0]} isNight={isNight} />

      {/* 6. Modern Sailing Yacht in the Bay Entrance */}
      <SailingYacht position={[330, 0, -640]} rotation={[0, -0.28, 0]} isNight={isNight} />

      {/* 7. Navigational Channel Buoys (Starboard Green & Port Red) */}
      <MaritimeChannelBuoy position={[245, 0, -608]} color="#16a34a" isNight={isNight} periodOffset={0} />
      <MaritimeChannelBuoy position={[295, 0, -608]} color="#dc2626" isNight={isNight} periodOffset={1.5} />
    </group>
  );
}
