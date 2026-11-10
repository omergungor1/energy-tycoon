'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight, getMeshHeightAt } from './WorldCanvas';

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
// 1. DYNAMIC VISITING CONTAINER SHIP (BERTHING, DISCHARGING & DEPARTURE CYCLE)
// =============================================================================
function VisitingContainerShip({ isNight = false }) {
  const shipGroupRef = useRef();
  const wakeGroupRef = useRef();
  const mastLightRef = useRef();
  const mooringGroupRef = useRef();

  // Full 160s operational schedule:
  // 0  - 75s : Berthed at Quay (Crane unloads/loads containers, mooring lines tight)
  // 75 - 98s : Casting off, swaying into deep channel, accelerating north
  // 98 - 112s: Cruising full speed north into open ocean
  // 112- 136s: At Sea / Away (Port Berth is completely empty!)
  // 136- 160s: Inbound approach down channel, slowing down, berthing alongside fenders
  useFrame(({ clock }) => {
    if (!shipGroupRef.current) return;
    const t = clock.getElapsedTime();
    const cycle = t % 160;

    let posX = 308.2;
    let posZ = -710.0;
    let rotY = 0.0;
    let isBerthed = false;
    let isMoving = false;
    let isVisible = true;

    if (cycle < 75) {
      // 1. BERTHED AT QUAY (0 - 75s)
      isBerthed = true;
      posX = 308.2;
      posZ = -710.0;
      rotY = 0.0;
    } else if (cycle < 98) {
      // 2. CASTING OFF & DEPARTING (75 - 98s)
      const p = (cycle - 75) / 23;
      const smoothP = p * p * (3 - 2 * p);
      isMoving = true;
      posX = 308.2 - 26.2 * Math.min(1.0, p * 1.6);
      posZ = -710.0 - 240.0 * smoothP;
      rotY = Math.sin(p * Math.PI) * -0.06;
    } else if (cycle < 112) {
      // 3. FULL SPEED INTO OPEN OCEAN (98 - 112s)
      const p = (cycle - 98) / 14;
      isMoving = true;
      posX = 282.0;
      posZ = -950.0 - 350.0 * p;
      rotY = 0.0;
    } else if (cycle < 136) {
      // 4. AT SEA / AWAY (112 - 136s) - Quay Berth is Completely Empty!
      isVisible = false;
      posX = 282.0;
      posZ = -1800.0;
    } else {
      // 5. INBOUND CHANNEL APPROACH & BERTHING (136 - 160s)
      const p = (cycle - 136) / 24;
      const smoothP = p * p * (3 - 2 * p);
      isMoving = true;
      isVisible = true;
      posX = 282.0 + (308.2 - 282.0) * smoothP;
      posZ = -1100.0 + 390.0 * smoothP;
      rotY = Math.sin((1 - p) * Math.PI) * 0.08;
    }

    shipGroupRef.current.visible = isVisible;
    if (isVisible) {
      // Hydrodynamic heave, pitch and roll
      const heave = isBerthed
        ? Math.sin(t * 0.72) * 0.05
        : Math.sin(t * 1.2) * 0.12;
      const roll = isBerthed
        ? Math.cos(t * 0.65) * 0.008
        : Math.cos(t * 0.9) * 0.02;

      shipGroupRef.current.position.set(posX, heave, posZ);
      shipGroupRef.current.rotation.set(0, rotY, roll);
    }

    if (wakeGroupRef.current) {
      wakeGroupRef.current.visible = isMoving && isVisible;
    }
    if (mooringGroupRef.current) {
      mooringGroupRef.current.visible = isBerthed;
    }
    if (mastLightRef.current) {
      mastLightRef.current.visible = isNight && isVisible;
    }
  });

  return (
    <group>
      {/* Dynamic Mooring Lines (Tied from ship fairleads to concrete quay bollards at x = 315.6) */}
      <group ref={mooringGroupRef}>
        {/* Bow Head Line */}
        <mesh position={[314.6, 2.8, -739]} rotation={[0, 0.45, 0.35]}>
          <cylinderGeometry args={[0.04, 0.04, 9.2, 6]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.8} />
        </mesh>
        {/* Bow Spring Line */}
        <mesh position={[314.8, 2.7, -720]} rotation={[0, -0.65, 0.32]}>
          <cylinderGeometry args={[0.04, 0.04, 8.5, 6]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.8} />
        </mesh>
        {/* Stern Spring Line */}
        <mesh position={[314.8, 2.7, -698]} rotation={[0, 0.65, 0.32]}>
          <cylinderGeometry args={[0.04, 0.04, 8.5, 6]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.8} />
        </mesh>
        {/* Stern Line */}
        <mesh position={[314.6, 2.8, -681]} rotation={[0, -0.45, 0.35]}>
          <cylinderGeometry args={[0.04, 0.04, 9.2, 6]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.8} />
        </mesh>
      </group>

      {/* Main Visiting Container Ship Hull & Superstructure */}
      <group ref={shipGroupRef} position={[308.2, 0, -710]}>
        {/* Ship Hull: Length 54m, Beam 11.5m, Height 6.2m */}
        {/* Red Anti-fouling Underbody (at/below waterline) */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[11.2, 1.8, 52]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
        </mesh>

        {/* Main Dark Navy Hull Body */}
        <mesh position={[0, 2.4, 0]} receiveShadow>
          <boxGeometry args={[11.6, 2.6, 53]} />
          <meshStandardMaterial color="#0f172a" roughness={0.45} />
        </mesh>

        {/* Tapered Bulbous Bow Wedge */}
        <group position={[0, 2.4, -27]}>
          <mesh rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
            <coneGeometry args={[5.8, 6.5, 4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.45} />
          </mesh>
        </group>

        {/* Raised Forecastle Deck */}
        <mesh position={[0, 4.1, -23]}>
          <boxGeometry args={[10.6, 0.8, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        {/* Bow Jackstaff / Mast */}
        <mesh position={[0, 6.0, -26]}>
          <cylinderGeometry args={[0.08, 0.12, 3.8, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>

        {/* Cargo Deck Beds */}
        <mesh position={[0, 3.8, -3]} receiveShadow>
          <boxGeometry args={[10.8, 0.3, 30]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>

        {/* Stacked Intermodal Shipping Containers in Hold Bays */}
        {/* Bay 1 (Forward Cargo Hold) */}
        <group position={[0, 4.9, -13]}>
          <mesh position={[-2.6, 0, 0]}>
            <boxGeometry args={[4.8, 2.1, 10]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[2.6, 0, 0]}>
            <boxGeometry args={[4.8, 2.1, 10]} />
            <meshStandardMaterial color="#c2410c" roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[-2.6, 2.1, 0]}>
            <boxGeometry args={[4.8, 2.1, 10]} />
            <meshStandardMaterial color="#15803d" roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[2.6, 2.1, 0]}>
            <boxGeometry args={[4.8, 2.1, 10]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[0, 4.1, 0]}>
            <boxGeometry args={[4.8, 2.0, 9.8]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.4} metalness={0.2} />
          </mesh>
        </group>

        {/* Bay 2 (Midships Hold - Active Crane Target) */}
        <group position={[0, 4.9, 0]}>
          <mesh position={[-2.6, 0, 0]}>
            <boxGeometry args={[4.8, 2.1, 11]} />
            <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[2.6, 0, 0]}>
            <boxGeometry args={[4.8, 2.1, 11]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[-2.6, 2.1, 0]}>
            <boxGeometry args={[4.8, 2.1, 11]} />
            <meshStandardMaterial color="#c2410c" roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[2.6, 2.1, 0]}>
            <boxGeometry args={[4.8, 2.1, 11]} />
            <meshStandardMaterial color="#16a34a" roughness={0.4} metalness={0.2} />
          </mesh>
        </group>

        {/* Stern Superstructure / Multi-Deck Bridge */}
        <group position={[0, 4.0, 16]}>
          {/* Tier 1 Accommodation */}
          <mesh position={[0, 1.4, 0]} receiveShadow>
            <boxGeometry args={[9.8, 2.8, 9]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Tier 2 Cabin deck */}
          <mesh position={[0, 3.8, 0]}>
            <boxGeometry args={[9.2, 2.0, 8.4]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Navigation Bridge / Wheelhouse with Wing Cantilevers */}
          <mesh position={[0, 5.7, 0]}>
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
          <mesh position={[-5.1, 3.5, 0]}>
            <boxGeometry args={[1.0, 1.0, 3.6]} />
            <meshStandardMaterial color="#ea580c" roughness={0.5} />
          </mesh>
          <mesh position={[5.1, 3.5, 0]}>
            <boxGeometry args={[1.0, 1.0, 3.6]} />
            <meshStandardMaterial color="#ea580c" roughness={0.5} />
          </mesh>

          {/* Smokestack Funnel behind bridge */}
          <group position={[0, 6.8, 4.8]}>
            <mesh>
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
            <mesh position={[0, 2.5, 0]}>
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

        {/* Dynamic Propeller Wash & Bow Foam Wake when Moving */}
        <group ref={wakeGroupRef}>
          {/* Twin Stern Propeller Wash Trails */}
          <mesh position={[0, 0.05, 29]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
          </mesh>
          {/* Bow V-Wakes */}
          <mesh position={[-6.0, 0.05, -26]} rotation={[-Math.PI / 2, 0, 0.3]}>
            <planeGeometry args={[2.5, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
          </mesh>
          <mesh position={[6.0, 0.05, -26]} rotation={[-Math.PI / 2, 0, -0.3]}>
            <planeGeometry args={[2.5, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// =============================================================================
// ACTIVE REACH STACKER (KONTEYNER İSTİF VİNCİ - HAREKETLİ LİMAN VİNCİ)
// =============================================================================
function ActiveReachStacker({ mats, isNight }) {
  const stackerRef = useRef();
  const boomRef = useRef();
  const frontWheelsRef = useRef();
  const heldContainerRef = useRef();
  const beaconRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (beaconRef.current) {
      const flash = (t * 2.4) % 1.0;
      beaconRef.current.material.opacity = flash < 0.28 || (flash > 0.48 && flash < 0.72) ? 1.0 : 0.2;
    }

    if (!stackerRef.current || isNight) return;

    // 26-second complete container stacking cycle
    const cycle = 26.0;
    const p = (t % cycle) / cycle;

    let posX = 336.0;
    let posZ = -665.0;
    let yaw = 0.0;
    let boomPitch = -0.38;
    let hasContainer = false;
    let steerAngle = 0.0;

    if (p < 0.30) {
      // Step 1: Drive north along yard aisle from Bay 1 towards Bay 2 (z: -665 -> -715)
      const prog = p / 0.30;
      posZ = -665.0 - (715.0 - 665.0) * prog;
      yaw = Math.PI; // heading north (-Z)
      boomPitch = -0.38;
      hasContainer = false;
      steerAngle = 0.0;
    } else if (p < 0.45) {
      // Step 2: Stop at Bay 2, turn towards container stack, raise boom & lock onto container
      const prog = (p - 0.30) / 0.15;
      posZ = -715.0;
      steerAngle = 0.4;
      yaw = Math.PI - prog * 0.7;
      posX = 336.0 + prog * 1.6;
      boomPitch = -0.38 - Math.sin(prog * Math.PI) * 0.22;
      hasContainer = prog > 0.65;
    } else if (p < 0.75) {
      // Step 3: Reverse, turn and drive south towards Bay 1 carrying the container
      const prog = (p - 0.45) / 0.30;
      posZ = -715.0 + (715.0 - 670.0) * prog;
      yaw = 0.0; // heading south (+Z)
      posX = 336.0;
      boomPitch = -0.45;
      hasContainer = true;
      steerAngle = Math.sin(prog * Math.PI * 2) * 0.12;
    } else if (p < 0.90) {
      // Step 4: Stop at Bay 1, lower boom, release container onto stack
      const prog = (p - 0.75) / 0.15;
      posZ = -670.0;
      yaw = 0.35;
      posX = 336.0 + Math.sin(prog * Math.PI) * 1.3;
      boomPitch = -0.45 + Math.sin(prog * Math.PI) * 0.14;
      hasContainer = prog < 0.6;
    } else {
      // Step 5: Retract boom, back into ready position
      const prog = (p - 0.90) / 0.10;
      posZ = -670.0 + 5.0 * prog;
      yaw = 0.0;
      posX = 336.0;
      boomPitch = -0.38;
      hasContainer = false;
    }

    stackerRef.current.position.set(posX, 2.3, posZ);
    stackerRef.current.rotation.y = yaw;
    if (boomRef.current) boomRef.current.rotation.x = boomPitch;
    if (heldContainerRef.current) heldContainerRef.current.visible = hasContainer;
    if (frontWheelsRef.current) frontWheelsRef.current.rotation.y = steerAngle;
  });

  return (
    <group ref={stackerRef} position={[336.0, 2.3, -665]}>
      {/* Yellow Heavy Body */}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[3.2, 1.8, 5.5]} />
        <primitive attach="material" object={mats.spreaderYellow} />
      </mesh>
      {/* Operator Cab with Panoramic Windows */}
      <mesh position={[-1.0, 2.2, 0.4]}>
        <boxGeometry args={[1.2, 1.4, 2.0]} />
        <primitive attach="material" object={mats.cWhite} />
      </mesh>
      <mesh position={[-1.0, 2.3, -0.62]}>
        <planeGeometry args={[1.05, 1.0]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>
      {/* Flashing Amber Strobe Beacon on Cab */}
      <mesh position={[-1.0, 3.0, 0.4]} ref={beaconRef}>
        <cylinderGeometry args={[0.12, 0.12, 0.16, 8]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={isNight ? 0.15 : 0.9} transparent />
      </mesh>

      {/* Counterweight */}
      <mesh position={[0, 1.4, 2.6]}>
        <boxGeometry args={[3.0, 1.6, 1.2]} />
        <primitive attach="material" object={mats.craneDark} />
      </mesh>

      {/* Steerable Front Wheels */}
      <group ref={frontWheelsRef} position={[0, 0, -1.8]}>
        {[-1.65, 1.65].map((wx, wi) => (
          <mesh key={`sfw_${wi}`} position={[wx, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.65, 0.65, 0.5, 12]} />
            <primitive attach="material" object={mats.fenderRubber} />
          </mesh>
        ))}
      </group>

      {/* Rear Drive Wheels */}
      {[-1.65, 1.65].map((wx, wi) => (
        <mesh key={`srw_${wi}`} position={[wx, 0.65, 1.8]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.65, 0.65, 0.5, 12]} />
          <primitive attach="material" object={mats.fenderRubber} />
        </mesh>
      ))}

      {/* Dynamic Telescopic Boom Assembly */}
      <group position={[0, 2.4, 0.8]} ref={boomRef}>
        {/* Main Boom Arm */}
        <mesh position={[0, 1.8, -2.4]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.9, 0.9, 6.8]} />
          <primitive attach="material" object={mats.craneDark} />
        </mesh>
        {/* Hydraulic Lift Cylinder */}
        <mesh position={[0, 0.6, -1.0]} rotation={[-0.4, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 2.8, 8]} />
          <primitive attach="material" object={mats.railSteel} />
        </mesh>
        {/* Top Spreader Beam Assembly */}
        <mesh position={[0, 3.4, -5.4]}>
          <boxGeometry args={[2.4, 0.4, 6.2]} />
          <primitive attach="material" object={mats.spreaderYellow} />
        </mesh>

        {/* Gripped Shipping Container (Visible when lifting/transporting) */}
        <group ref={heldContainerRef} position={[0, 1.8, -5.4]} visible={false}>
          <mesh receiveShadow>
            <boxGeometry args={[2.44, 2.5, 6.0]} />
            <primitive attach="material" object={mats.cHapag} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// =============================================================================
// ACTIVE PORT CONTAINER TRUCK (LİMAN TIR - LİMANDAN YOLA ÇIKIP DOLAŞAN TIR)
// =============================================================================
function ActivePortContainerTruck({ mats, isNight, curve }) {
  const truckRef = useRef();
  const progressRef = useRef(0.08);

  useFrame((_, delta) => {
    if (!truckRef.current || !curve) return;
    const dt = Math.min(delta, 0.05);

    // Realistic cruising speed
    const speed = 0.015;
    progressRef.current = (progressRef.current + dt * speed) % 1.0;

    const prog = progressRef.current;
    const p = curve.getPointAt(prog);

    // Accurate elevation: on port concrete deck (Y=2.3) or on coastal road
    let y = 2.3;
    if (p.x > 355.0) {
      const gY = Math.max(getMeshHeightAt(p.x, p.z), getTerrainHeight(p.x, p.z));
      y = gY + 0.55;
    }

    const currentPos = new THREE.Vector3(p.x, y, p.z);
    truckRef.current.position.copy(currentPos);

    // Lookahead for orientation
    const nextProg = (prog + 0.005) % 1.0;
    const nextP = curve.getPointAt(nextProg);
    let nextY = 2.3;
    if (nextP.x > 355.0) {
      nextY = Math.max(getMeshHeightAt(nextP.x, nextP.z), getTerrainHeight(nextP.x, nextP.z)) + 0.55;
    }
    const lookTarget = new THREE.Vector3(nextP.x, nextY, nextP.z);
    truckRef.current.lookAt(lookTarget);
  });

  return (
    <group ref={truckRef}>
      {/* Tractor Cab (Modern Aerodynamic Long-Haul Cab) */}
      <mesh position={[0, 1.4, 4.8]}>
        <boxGeometry args={[2.5, 2.5, 3.2]} />
        <primitive attach="material" object={mats.cEvergreen} />
      </mesh>
      {/* Aerodynamic Wind Deflector Roof Cap */}
      <mesh position={[0, 2.8, 4.6]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[2.3, 0.45, 2.4]} />
        <primitive attach="material" object={mats.cEvergreen} />
      </mesh>
      {/* Front Windshield */}
      <mesh position={[0, 1.7, 6.42]}>
        <planeGeometry args={[2.2, 1.1]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>
      {/* Side Windows */}
      {[-1.26, 1.26].map((wx, wi) => (
        <mesh key={`cwin_${wi}`} position={[wx, 1.7, 4.8]} rotation={[0, wi === 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <planeGeometry args={[1.6, 0.9]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.8} />
        </mesh>
      ))}
      {/* Vertical Chrome Exhaust Stacks */}
      {[-1.2, 1.2].map((ex, ei) => (
        <mesh key={`ex_${ei}`} position={[ex, 2.4, 3.1]}>
          <cylinderGeometry args={[0.08, 0.08, 1.8, 8]} />
          <primitive attach="material" object={mats.railSteel} />
        </mesh>
      ))}

      {/* Headlights */}
      {[-0.9, 0.9].map((lx, li) => (
        <mesh key={`hl_${li}`} position={[lx, 0.8, 6.42]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      ))}
      {/* Taillights */}
      {[-1.0, 1.0].map((lx, li) => (
        <mesh key={`tl_${li}`} position={[lx, 0.8, -6.65]}>
          <boxGeometry args={[0.3, 0.18, 0.05]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      ))}

      {/* Semi-Trailer Chassis Frame */}
      <mesh position={[0, 0.7, -0.6]}>
        <boxGeometry args={[2.5, 0.6, 12.0]} />
        <primitive attach="material" object={mats.craneDark} />
      </mesh>

      {/* 40ft Intermodal Shipping Container (Maersk Sky Blue) */}
      <group position={[0, 2.3, -0.6]}>
        <mesh receiveShadow>
          <boxGeometry args={[2.44, 2.5, 11.2]} />
          <primitive attach="material" object={mats.cMaersk} />
        </mesh>
        {/* Container White Logo Band */}
        <mesh position={[1.23, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.5, 0.7]} />
          <primitive attach="material" object={mats.cWhite} />
        </mesh>
        <mesh position={[-1.23, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[4.5, 0.7]} />
          <primitive attach="material" object={mats.cWhite} />
        </mesh>
      </group>

      {/* Heavy Rubber Wheels (Steer + Dual Tandem Drive + Triple Trailer Axles) */}
      {[5.2, 2.6, 1.3, -3.8, -5.0, -6.2].map((wz, wi) => (
        <group key={`ptw_${wi}`}>
          <mesh position={[-1.22, 0.45, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.35, 10]} />
            <primitive attach="material" object={mats.fenderRubber} />
          </mesh>
          <mesh position={[1.22, 0.45, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.35, 10]} />
            <primitive attach="material" object={mats.fenderRubber} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// =============================================================================
// ACTIVE TERMINAL YARD MULE (LİMAN İÇİ ÇEKİCİ TRAKTÖR)
// =============================================================================
function ActiveTerminalYardMule({ mats, isNight }) {
  const muleRef = useRef();

  useFrame(({ clock }) => {
    if (!muleRef.current || isNight) return;
    const t = clock.getElapsedTime() * 0.35;
    const loopP = (t % 18.0) / 18.0;

    // Shuttles inside terminal between Bay 2 (z = -730) and Quay Apron (z = -680)
    let z = -680.0 - Math.sin(loopP * Math.PI * 2) * 25.0;
    let x = 328.0 + Math.cos(loopP * Math.PI * 2) * 3.5;
    let heading = Math.cos(loopP * Math.PI * 2) > 0 ? Math.PI : 0;

    muleRef.current.position.set(x, 2.3, z);
    muleRef.current.rotation.y = heading;
  });

  return (
    <group ref={muleRef} position={[328.0, 2.3, -700]}>
      {/* High-Vis Orange Yard Mule Cab */}
      <mesh position={[-0.4, 1.2, 1.4]}>
        <boxGeometry args={[1.4, 1.8, 1.8]} />
        <primitive attach="material" object={mats.cHapag} />
      </mesh>
      {/* Windshield */}
      <mesh position={[-0.4, 1.35, 2.32]}>
        <planeGeometry args={[1.2, 1.1]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>
      {/* Trailer Chassis */}
      <mesh position={[0, 0.6, -1.8]}>
        <boxGeometry args={[2.4, 0.4, 6.2]} />
        <primitive attach="material" object={mats.craneDark} />
      </mesh>
      {/* 20ft Green Container */}
      <mesh position={[0, 1.9, -1.8]}>
        <boxGeometry args={[2.4, 2.4, 5.8]} />
        <primitive attach="material" object={mats.cEvergreen} />
      </mesh>
      {/* Wheels */}
      {[-1.15, 1.15].map((wx, wi) =>
        [1.4, -0.6, -3.8].map((wz, wzi) => (
          <mesh key={`mw_${wi}_${wzi}`} position={[wx, 0.42, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.42, 0.42, 0.32, 10]} />
            <primitive attach="material" object={mats.fenderRubber} />
          </mesh>
        ))
      )}
    </group>
  );
}

// =============================================================================
// NORTH SEA CONTAINER PORT TERMINAL & STS GANTRY CRANE (LİMAN VE KONTEYNER VİNCİ)
// =============================================================================
function NorthHarborContainerPort({ isNight = false }) {
  const gantryGroupRef = useRef();
  const trolleyRef = useRef();
  const spreaderRef = useRef();
  const hoistCable1Ref = useRef();
  const hoistCable2Ref = useRef();
  const hoistCable3Ref = useRef();
  const hoistCable4Ref = useRef();
  const liftedContainerRef = useRef();
  const radarRef = useRef();

  // Port Container Truck Highway Driving Loop
  const portTruckCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(324.5, 2.3, -710.0), // Under STS Crane at Quay Apron (Loading)
      new THREE.Vector3(324.5, 2.3, -675.0), // Driving south along quay apron
      new THREE.Vector3(328.0, 2.3, -660.0), // Sweeping left curve towards port customs gate
      new THREE.Vector3(344.0, 2.3, -655.0), // Terminal customs security inspection lane
      new THREE.Vector3(356.0, 2.3, -658.0), // Exiting main port gate
      new THREE.Vector3(375.0, 2.0, -650.0), // Coastal Port Access Highway East
      new THREE.Vector3(398.0, 2.2, -620.0), // Scenic coastal bend
      new THREE.Vector3(415.0, 2.5, -560.0), // Coastal highway straight
      new THREE.Vector3(400.0, 2.8, -490.0), // Energy corridor transition
      new THREE.Vector3(365.0, 2.4, -435.0), // Sunfire North Highway junction
      new THREE.Vector3(345.0, 2.2, -455.0), // Highway return loop
      new THREE.Vector3(360.0, 2.1, -525.0), // Coastal road return
      new THREE.Vector3(382.0, 2.0, -595.0), // Approaching port sector
      new THREE.Vector3(370.0, 2.1, -648.0), // Port entrance road
      new THREE.Vector3(355.0, 2.3, -672.0), // Entering through port security gate
      new THREE.Vector3(340.0, 2.3, -680.0), // Terminal staging yard lane
      new THREE.Vector3(328.0, 2.3, -740.0), // Turning into quay crane lane
      new THREE.Vector3(324.5, 2.3, -735.0)  // Re-entering crane drop lane
    ], true);
  }, []);

  // Coastal road surface ribbon connecting Port Gate to Coastal Drive
  const coastalRoadGeo = useMemo(() => {
    const roadPoints = [
      new THREE.Vector3(355.0, 2.3, -658.0),
      new THREE.Vector3(375.0, 2.0, -650.0),
      new THREE.Vector3(398.0, 2.2, -620.0),
      new THREE.Vector3(415.0, 2.5, -560.0),
      new THREE.Vector3(400.0, 2.8, -490.0),
      new THREE.Vector3(365.0, 2.4, -435.0),
      new THREE.Vector3(345.0, 2.2, -455.0),
      new THREE.Vector3(360.0, 2.1, -525.0),
      new THREE.Vector3(382.0, 2.0, -595.0),
      new THREE.Vector3(370.0, 2.1, -648.0),
      new THREE.Vector3(355.0, 2.3, -672.0)
    ];
    const curve = new THREE.CatmullRomCurve3(roadPoints, false);
    const spaced = curve.getSpacedPoints(60);
    const vertices = [];
    const indices = [];
    const halfW = 3.6;

    for (let i = 0; i < spaced.length; i++) {
      const p = spaced[i];
      let tangent = new THREE.Vector3();
      if (i === 0) tangent.subVectors(spaced[1], p);
      else if (i === spaced.length - 1) tangent.subVectors(p, spaced[i - 1]);
      else tangent.subVectors(spaced[i + 1], spaced[i - 1]);
      tangent.normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const l = p.clone().addScaledVector(normal, halfW);
      const r = p.clone().addScaledVector(normal, -halfW);
      const ly = Math.max(getMeshHeightAt(l.x, l.z), getTerrainHeight(l.x, l.z)) + 0.15;
      const ry = Math.max(getMeshHeightAt(r.x, r.z), getTerrainHeight(r.x, r.z)) + 0.15;

      vertices.push(l.x, ly, l.z);
      vertices.push(r.x, ry, r.z);

      if (i < spaced.length - 1) {
        const b = i * 2;
        indices.push(b, b + 2, b + 1);
        indices.push(b + 1, b + 2, b + 3);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Active Ship-to-Shore (STS) Gantry Crane Hoisting, Traversing & Rail Travelling Animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const shipCycle = t % 160;

    // Spin harbor control radar
    if (radarRef.current) {
      radarRef.current.rotation.y = t * 2.5;
    }

    if (!trolleyRef.current || !spreaderRef.current) return;

    // Crane is active while the visiting ship is berthed (0 - 72s of the 160s loop)
    const isShipBerthed = shipCycle < 72;

    // Gantry crane moves along quay rails
    const gantryZ = isShipBerthed ? -710.0 + Math.sin(t * 0.06) * 5.5 : -710.0;
    if (gantryGroupRef.current) {
      gantryGroupRef.current.position.z = gantryZ + 710.0;
    }

    let trolleyX = 320.0;
    let spreaderY = 15.2;
    let hasContainer = false;

    if (isShipBerthed) {
      const craneT = t % 24; // 24-second continuous hoisting cycle
      if (craneT < 4.5) {
        // Phase 1: Lower empty spreader into ship's cargo hold (x = 307.2)
        const p = craneT / 4.5;
        trolleyX = 307.2;
        spreaderY = 15.5 - (15.5 - 5.4) * Math.sin(p * Math.PI * 0.5);
        hasContainer = false;
      } else if (craneT < 9.0) {
        // Phase 2: Lock onto container and hoist upward to clear height
        const p = (craneT - 4.5) / 4.5;
        trolleyX = 307.2;
        spreaderY = 5.4 + (15.5 - 5.4) * Math.sin(p * Math.PI * 0.5);
        hasContainer = true;
      } else if (craneT < 15.0) {
        // Phase 3: Traverse trolley across cantilever boom to quay apron (x: 307.2 -> 324.5)
        const p = (craneT - 9.0) / 6.0;
        const smoothP = 0.5 - 0.5 * Math.cos(p * Math.PI);
        trolleyX = 307.2 + (324.5 - 307.2) * smoothP;
        spreaderY = 15.5;
        hasContainer = true;
      } else if (craneT < 19.5) {
        // Phase 4: Lower container onto terminal apron / waiting truck (y: 15.5 -> 2.6)
        const p = (craneT - 15.0) / 4.5;
        trolleyX = 324.5;
        spreaderY = 15.5 - (15.5 - 2.6) * Math.sin(p * Math.PI * 0.5);
        hasContainer = true;
      } else if (craneT < 21.5) {
        // Phase 5: Release container and hoist empty spreader back up (y: 2.6 -> 15.5)
        const p = (craneT - 19.5) / 2.0;
        trolleyX = 324.5;
        spreaderY = 2.6 + (15.5 - 2.6) * Math.sin(p * Math.PI * 0.5);
        hasContainer = false;
      } else {
        // Phase 6: Return empty trolley along boom to ship hold (x: 324.5 -> 307.2)
        const p = (craneT - 21.5) / 2.5;
        const smoothP = 0.5 - 0.5 * Math.cos(p * Math.PI);
        trolleyX = 324.5 - (324.5 - 307.2) * smoothP;
        spreaderY = 15.5;
        hasContainer = false;
      }
    } else {
      // Standby park mode while ship is away
      trolleyX = 321.0;
      spreaderY = 15.2;
      hasContainer = false;
    }

    trolleyRef.current.position.x = trolleyX;
    spreaderRef.current.position.set(trolleyX, spreaderY, gantryZ);

    if (liftedContainerRef.current) {
      liftedContainerRef.current.visible = hasContainer;
    }

    // Update 4 hoist wire cables length and position
    const cableDrop = 18.2 - spreaderY;
    const cableMidY = (18.2 + spreaderY) * 0.5;
    [hoistCable1Ref, hoistCable2Ref, hoistCable3Ref, hoistCable4Ref].forEach((ref) => {
      if (ref.current) {
        ref.current.position.x = trolleyX;
        ref.current.position.y = cableMidY;
        ref.current.position.z = gantryZ;
        ref.current.scale.set(1, Math.max(0.1, cableDrop), 1);
      }
    });
  });

  // Reusable Materials
  const mats = useMemo(() => {
    return {
      quayConcrete: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 }),
      quayWall: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.85 }),
      hazardYellow: new THREE.MeshBasicMaterial({ color: '#facc15' }),
      hazardBlack: new THREE.MeshBasicMaterial({ color: '#0f172a' }),
      craneOrange: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.45, metalness: 0.5 }),
      craneDark: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6 }),
      spreaderYellow: new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.3 }),
      railSteel: new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.25 }),
      bollardIron: new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.8, roughness: 0.35 }),
      fenderRubber: new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.95 }),
      wireRope: new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.9, roughness: 0.4 }),
      // Containers
      cMaersk: new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 }),
      cEvergreen: new THREE.MeshStandardMaterial({ color: '#059669', roughness: 0.4 }),
      cHapag: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.4 }),
      cMSC: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 }),
      cONE: new THREE.MeshStandardMaterial({ color: '#9333ea', roughness: 0.4 }),
      cWhite: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 }),
      cGrey: new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.5 }),
      floodlightGlow: new THREE.MeshBasicMaterial({ color: '#fef08a' })
    };
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* ========================================================= */}
      {/* 1. REINFORCED CONCRETE QUAY APRON & BULKHEAD SEAWALL      */}
      {/* ========================================================= */}
      {/* Main Container Terminal Apron Deck (40m wide x 120m long) */}
      <mesh position={[335, 1.4, -710]} receiveShadow>
        <boxGeometry args={[40, 1.8, 120]} />
        <primitive attach="material" object={mats.quayConcrete} />
      </mesh>

      {/* Waterside Sheet-Pile Seawall dropping into water (x = 314.9, down to y = -6m) */}
      <mesh position={[314.9, -1.8, -710]}>
        <boxGeometry args={[0.3, 5.0, 120]} />
        <primitive attach="material" object={mats.quayWall} />
      </mesh>

      {/* Yellow / Black Hazard Safety Warning Stripes along Quay Edge (x = 315.2) */}
      <mesh position={[315.15, 2.32, -710]}>
        <boxGeometry args={[0.5, 0.04, 120]} />
        <primitive attach="material" object={mats.hazardYellow} />
      </mesh>
      {[-760, -740, -720, -700, -680, -660].map((sz, si) => (
        <mesh key={`hstripe_${si}`} position={[315.15, 2.33, sz]}>
          <boxGeometry args={[0.52, 0.05, 4]} />
          <primitive attach="material" object={mats.hazardBlack} />
        </mesh>
      ))}

      {/* Heavy Cast-Iron T-Head Mooring Bollards along Quay Edge (x = 315.6) */}
      {[-765, -750, -735, -720, -705, -690, -675, -660].map((bz, bi) => (
        <group key={`bollard_${bi}`} position={[315.6, 2.3, bz]}>
          {/* Base Post */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.22, 0.28, 0.7, 8]} />
            <primitive attach="material" object={mats.bollardIron} />
          </mesh>
          {/* T-Head Cross Cap */}
          <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.85, 8]} />
            <primitive attach="material" object={mats.bollardIron} />
          </mesh>
        </group>
      ))}

      {/* Cylindrical Yokohama Marine Rubber Fenders in the Water (x = 314.3) */}
      {[-760, -745, -730, -715, -700, -685, -670, -655].map((fz, fi) => (
        <group key={`fender_${fi}`} position={[314.3, 0.5, fz]}>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 2.4, 10]} />
            <primitive attach="material" object={mats.fenderRubber} />
          </mesh>
          {/* Steel Mounting Chains */}
          <mesh position={[0.4, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
            <primitive attach="material" object={mats.wireRope} />
          </mesh>
          <mesh position={[0.4, -0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
            <primitive attach="material" object={mats.wireRope} />
          </mesh>
        </group>
      ))}

      {/* Dual Crane Rail Tracks embedded in concrete (Waterside x = 318.0, Landside x = 328.0) */}
      {[318.0, 328.0].map((rx, ri) => (
        <group key={`rail_${ri}`} position={[rx, 2.32, -710]}>
          {/* Steel Rail Track */}
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.22, 0.12, 118]} />
            <primitive attach="material" object={mats.railSteel} />
          </mesh>
          {/* Concrete Sleeper Bed */}
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.9, 0.04, 118]} />
            <primitive attach="material" object={mats.quayWall} />
          </mesh>
        </group>
      ))}

      {/* ========================================================= */}
      {/* 2. ACTIVE SHIP-TO-SHORE (STS) CONTAINER GANTRY CRANE      */}
      {/* ========================================================= */}
      <group ref={gantryGroupRef} position={[0, 0, 0]}>
        {/* 4 Heavy Steel Gantry Portal Legs */}
        {/* Waterside Legs (x = 318.0) */}
        <mesh position={[318.0, 8.8, -715.5]} rotation={[0, 0, -0.06]}>
          <boxGeometry args={[1.2, 13.5, 1.2]} />
          <primitive attach="material" object={mats.craneOrange} />
        </mesh>
        <mesh position={[318.0, 8.8, -704.5]} rotation={[0, 0, -0.06]}>
          <boxGeometry args={[1.2, 13.5, 1.2]} />
          <primitive attach="material" object={mats.craneOrange} />
        </mesh>
        {/* Landside Legs (x = 328.0) */}
        <mesh position={[328.0, 8.8, -715.5]} rotation={[0, 0, 0.06]}>
          <boxGeometry args={[1.2, 13.5, 1.2]} />
          <primitive attach="material" object={mats.craneOrange} />
        </mesh>
        <mesh position={[328.0, 8.8, -704.5]} rotation={[0, 0, 0.06]}>
          <boxGeometry args={[1.2, 13.5, 1.2]} />
          <primitive attach="material" object={mats.craneOrange} />
        </mesh>

        {/* 4 Multi-Wheel Rail Bogies on Tracks */}
        {[
          [318.0, -715.5],
          [318.0, -704.5],
          [328.0, -715.5],
          [328.0, -704.5]
        ].map(([bx, bz], bi) => (
          <group key={`bogie_${bi}`} position={[bx, 2.7, bz]}>
            <mesh>
              <boxGeometry args={[1.4, 0.6, 3.2]} />
              <primitive attach="material" object={mats.craneDark} />
            </mesh>
            {[-1.1, 0, 1.1].map((wz, wi) => (
              <mesh key={`wheel_${wi}`} position={[0, -0.22, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.26, 0.26, 1.5, 8]} />
                <primitive attach="material" object={mats.railSteel} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Portal Horizontal Sills & Cross Girders */}
        <mesh position={[323.0, 15.2, -715.5]}>
          <boxGeometry args={[11.5, 1.0, 1.2]} />
          <primitive attach="material" object={mats.craneOrange} />
        </mesh>
        <mesh position={[323.0, 15.2, -704.5]}>
          <boxGeometry args={[11.5, 1.0, 1.2]} />
          <primitive attach="material" object={mats.craneOrange} />
        </mesh>
        {/* Machinery House on Portal Bridge */}
        <mesh position={[326.5, 16.8, -710.0]}>
          <boxGeometry args={[4.5, 2.2, 8.5]} />
          <primitive attach="material" object={mats.craneDark} />
        </mesh>

        {/* Long Horizontal Cantilever Boom Girder (Extends from x = 301 to x = 332 at y = 18.5) */}
        {/* Twin Box Girder Beams */}
        <mesh position={[316.5, 18.5, -711.2]}>
          <boxGeometry args={[31.0, 1.1, 0.45]} />
          <primitive attach="material" object={mats.craneOrange} />
        </mesh>
        <mesh position={[316.5, 18.5, -708.8]}>
          <boxGeometry args={[31.0, 1.1, 0.45]} />
          <primitive attach="material" object={mats.craneOrange} />
        </mesh>
        {/* Boom Cross Ties */}
        {[-14, -10, -6, -2, 2, 6, 10, 14].map((ox, oi) => (
          <mesh key={`boom_tie_${oi}`} position={[316.5 + ox, 18.9, -710.0]}>
            <boxGeometry args={[0.3, 0.25, 2.5]} />
            <primitive attach="material" object={mats.craneOrange} />
          </mesh>
        ))}

        {/* Central A-Frame Apex Tower (Rises up to y = 28m) */}
        <mesh position={[320.0, 23.2, -710.0]} rotation={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.3, 0.5, 9.8, 6]} />
          <primitive attach="material" object={mats.craneOrange} />
        </mesh>
        <mesh position={[326.0, 23.2, -710.0]} rotation={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.3, 0.5, 9.8, 6]} />
          <primitive attach="material" object={mats.craneOrange} />
        </mesh>
        {/* Forestay Tension Cables from Apex to Waterside Boom Tip */}
        <mesh position={[312.5, 23.0, -710.0]} rotation={[0, 0, 0.55]}>
          <cylinderGeometry args={[0.05, 0.05, 19.5, 6]} />
          <primitive attach="material" object={mats.wireRope} />
        </mesh>
        {/* Backstay Tension Cables from Apex to Landside Boom Tip */}
        <mesh position={[327.5, 23.5, -710.0]} rotation={[0, 0, -0.65]}>
          <cylinderGeometry args={[0.05, 0.05, 13.5, 6]} />
          <primitive attach="material" object={mats.wireRope} />
        </mesh>
        {/* Aircraft Warning Red Flashing Beacon on Apex */}
        <mesh position={[323.0, 28.2, -710.0]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>

        {/* Active Animated Crane Trolley Carriage (Moves along X axis on boom) */}
        <group ref={trolleyRef} position={[320.0, 18.6, -710.0]}>
          <mesh>
            <boxGeometry args={[2.8, 0.7, 2.6]} />
            <primitive attach="material" object={mats.craneDark} />
          </mesh>
          {/* Glass Operator Control Cab suspended under trolley */}
          <mesh position={[0, -1.2, 0.8]}>
            <boxGeometry args={[1.5, 1.4, 1.1]} />
            <primitive attach="material" object={mats.cMaersk} />
          </mesh>
          <mesh position={[0, -1.2, 1.36]}>
            <planeGeometry args={[1.2, 0.9]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
          </mesh>
        </group>

        {/* 4 Active Hoist Wire Cables (Dynamically stretch and translate) */}
        <mesh ref={hoistCable1Ref} position={[320.0, 16.5, -710.8]}>
          <cylinderGeometry args={[0.035, 0.035, 1.0, 6]} />
          <primitive attach="material" object={mats.wireRope} />
        </mesh>
        <mesh ref={hoistCable2Ref} position={[320.0, 16.5, -709.2]}>
          <cylinderGeometry args={[0.035, 0.035, 1.0, 6]} />
          <primitive attach="material" object={mats.wireRope} />
        </mesh>
        <mesh ref={hoistCable3Ref} position={[321.2, 16.5, -710.8]}>
          <cylinderGeometry args={[0.035, 0.035, 1.0, 6]} />
          <primitive attach="material" object={mats.wireRope} />
        </mesh>
        <mesh ref={hoistCable4Ref} position={[321.2, 16.5, -709.2]}>
          <cylinderGeometry args={[0.035, 0.035, 1.0, 6]} />
          <primitive attach="material" object={mats.wireRope} />
        </mesh>

        {/* Active Animated 40ft Container Spreader Frame */}
        <group ref={spreaderRef} position={[320.0, 15.0, -710.0]}>
          {/* Spreader Main Telescopic Beam */}
          <mesh>
            <boxGeometry args={[2.5, 0.45, 11.2]} />
            <primitive attach="material" object={mats.spreaderYellow} />
          </mesh>
          {/* Corner Twistlock Castings */}
          {[-1.15, 1.15].map((cx, ci) =>
            [-5.4, 5.4].map((cz, czi) => (
              <mesh key={`lock_${ci}_${czi}`} position={[cx, -0.3, cz]}>
                <boxGeometry args={[0.3, 0.35, 0.3]} />
                <primitive attach="material" object={mats.craneDark} />
              </mesh>
            ))
          )}

          {/* Gripped 40ft ISO Shipping Container (Shown during hoist & transport phases) */}
          <group ref={liftedContainerRef} position={[0, -1.45, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[2.44, 2.45, 11.0]} />
              <primitive attach="material" object={mats.cHapag} />
            </mesh>
            {/* White Shipping Line Logo Stripe */}
            <mesh position={[1.23, 0, 0]}>
              <planeGeometry args={[0.8, 8.0]} />
              <primitive attach="material" object={mats.cWhite} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ========================================================= */}
      {/* 3. CONTAINER STACKING YARD & INTERMODAL DEPOT             */}
      {/* ========================================================= */}
      {/* Bay 1: Multi-Tier Stacks along x = 336 (z = -670 to -750) */}
      <group position={[336.0, 2.3, 0]}>
        {[
          { z: -745, h: 2, c1: mats.cMaersk, c2: mats.cEvergreen },
          { z: -732, h: 2, c1: mats.cMSC, c2: mats.cHapag },
          { z: -719, h: 1, c1: mats.cONE, c2: null },
          { z: -706, h: 2, c1: mats.cEvergreen, c2: mats.cWhite },
          { z: -693, h: 2, c1: mats.cMaersk, c2: mats.cMSC },
          { z: -680, h: 1, c1: mats.cHapag, c2: null }
        ].map((item, idx) => (
          <group key={`bay1_${idx}`} position={[0, 0, item.z]}>
            <mesh position={[0, 1.25, 0]} receiveShadow material={item.c1}>
              <boxGeometry args={[2.44, 2.5, 11.0]} />
            </mesh>
            {item.h >= 2 && item.c2 && (
              <mesh position={[0, 3.75, 0]} receiveShadow material={item.c2}>
                <boxGeometry args={[2.44, 2.5, 11.0]} />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* Bay 2: High 3-Tier Stacks along x = 343 (z = -670 to -750) */}
      <group position={[343.0, 2.3, 0]}>
        {[
          { z: -745, h: 3, c1: mats.cEvergreen, c2: mats.cMaersk, c3: mats.cHapag },
          { z: -732, h: 2, c1: mats.cONE, c2: mats.cMSC, c3: null },
          { z: -719, h: 3, c1: mats.cMSC, c2: mats.cEvergreen, c3: mats.cWhite },
          { z: -706, h: 3, c1: mats.cHapag, c2: mats.cMaersk, c3: mats.cONE },
          { z: -693, h: 2, c1: mats.cWhite, c2: mats.cEvergreen, c3: null },
          { z: -680, h: 2, c1: mats.cMaersk, c2: mats.cMSC, c3: null }
        ].map((item, idx) => (
          <group key={`bay2_${idx}`} position={[0, 0, item.z]}>
            <mesh position={[0, 1.25, 0]} receiveShadow material={item.c1}>
              <boxGeometry args={[2.44, 2.5, 11.0]} />
            </mesh>
            {item.h >= 2 && item.c2 && (
              <mesh position={[0, 3.75, 0]} receiveShadow material={item.c2}>
                <boxGeometry args={[2.44, 2.5, 11.0]} />
              </mesh>
            )}
            {item.h >= 3 && item.c3 && (
              <mesh position={[0, 6.25, 0]} receiveShadow material={item.c3}>
                <boxGeometry args={[2.44, 2.5, 11.0]} />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* Bay 3: Buffer Stacks along x = 349.5 */}
      <group position={[349.5, 2.3, 0]}>
        {[
          { z: -740, c: mats.cGrey },
          { z: -720, c: mats.cMaersk },
          { z: -700, c: mats.cHapag },
          { z: -680, c: mats.cEvergreen }
        ].map((item, idx) => (
          <mesh key={`bay3_${idx}`} position={[0, 1.25, item.z]} receiveShadow material={item.c}>
            <boxGeometry args={[2.44, 2.5, 11.0]} />
          </mesh>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 4. ACTIVE PORT VEHICLES (REACH STACKER, YARD MULE & TRUCK) */}
      {/* ========================================================= */}
      {/* Animated 18-Wheeler Container Truck driving in/out of the port */}
      {portTruckCurve && (
        <ActivePortContainerTruck mats={mats} isNight={isNight} curve={portTruckCurve} />
      )}

      {/* Animated Terminal Yard Mule shuttling containers to quay apron */}
      <ActiveTerminalYardMule mats={mats} isNight={isNight} />

      {/* Animated Heavy Reach Stacker Crane handling containers in yard */}
      <ActiveReachStacker mats={mats} isNight={isNight} />

      {/* Port Security Gatehouse & Checkpoint at x = 356, z = -665 */}
      <group position={[356.0, 2.3, -665.0]}>
        {/* Guard Booth */}
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[3.2, 2.8, 3.8]} />
          <primitive attach="material" object={mats.quayConcrete} />
        </mesh>
        <mesh position={[0, 2.8, 0]}>
          <boxGeometry args={[3.6, 0.3, 4.2]} />
          <primitive attach="material" object={mats.craneDark} />
        </mesh>
        {/* Window */}
        <mesh position={[-1.62, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[2.8, 1.2]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
        </mesh>
        {/* Boom Barriers (North & South Lanes) */}
        <mesh position={[-1.7, 1.0, 3.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 4.5, 8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh position={[-1.7, 1.0, -3.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 4.5, 8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Coastal Road Connector linking port gate to island highway */}
      {coastalRoadGeo && (
        <mesh geometry={coastalRoadGeo} receiveShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.88} />
        </mesh>
      )}

      {/* ========================================================= */}
      {/* 5. PORT OPERATIONS CONTROL TOWER & RADAR (x = 353, z = -665) */}
      {/* ========================================================= */}
      <group position={[353.0, 2.3, -665]}>
        {/* Tower Concrete Shaft */}
        <mesh position={[0, 5.5, 0]}>
          <boxGeometry args={[5.0, 11.0, 5.0]} />
          <primitive attach="material" object={mats.quayConcrete} />
        </mesh>
        {/* Observation Control Level with Panoramic Glass Windows */}
        <mesh position={[0, 12.0, 0]}>
          <boxGeometry args={[6.8, 2.8, 6.8]} />
          <primitive attach="material" object={mats.cWhite} />
        </mesh>
        <mesh position={[0, 12.0, -3.42]}>
          <planeGeometry args={[6.2, 1.8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
        </mesh>
        <mesh position={[-3.42, 12.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[6.2, 1.8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
        </mesh>
        {/* Roof Canopy */}
        <mesh position={[0, 13.6, 0]}>
          <boxGeometry args={[7.4, 0.4, 7.4]} />
          <primitive attach="material" object={mats.craneDark} />
        </mesh>
        {/* Rooftop Rotating Marine Radar Scanner */}
        <group ref={radarRef} position={[0, 14.8, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 1.0, 8]} />
            <primitive attach="material" object={mats.railSteel} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[2.8, 0.22, 0.3]} />
            <primitive attach="material" object={mats.cWhite} />
          </mesh>
        </group>
        {/* Night Beacon */}
        <mesh position={[0, 16.5, 0]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color={isNight ? '#fef08a' : '#1e293b'} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 6. HIGH-MAST FLOODLIGHT TOWERS (NIGHT ILLUMINATION)       */}
      {/* ========================================================= */}
      {[
        [317.0, -765],
        [353.0, -765],
        [317.0, -655],
        [353.0, -655]
      ].map(([tx, tz], ti) => (
        <group key={`light_tower_${ti}`} position={[tx, 2.3, tz]}>
          {/* Concrete Footing */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.6, 0.8, 1.6]} />
            <primitive attach="material" object={mats.quayConcrete} />
          </mesh>
          {/* Lattice Steel Mast */}
          <mesh position={[0, 8.5, 0]}>
            <cylinderGeometry args={[0.2, 0.45, 16.0, 6]} />
            <primitive attach="material" object={mats.craneDark} />
          </mesh>
          {/* Top Crossbar with 6 Floodlights */}
          <mesh position={[0, 16.6, 0]}>
            <boxGeometry args={[3.2, 0.35, 0.8]} />
            <primitive attach="material" object={mats.craneDark} />
          </mesh>
          {[-1.2, -0.4, 0.4, 1.2].map((lx, li) => (
            <mesh key={`fl_${li}`} position={[lx, 16.3, 0]}>
              <boxGeometry args={[0.45, 0.35, 0.25]} />
              <primitive attach="material" object={isNight ? mats.floodlightGlow : mats.quayWall} />
            </mesh>
          ))}
          {/* Optional Night Point Light */}
          {isNight && (
            <pointLight position={[0, 16.2, 0]} color="#fef08a" intensity={0.8} distance={65} decay={2} />
          )}
        </group>
      ))}
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
      <mesh position={[0, 1.8, 0]} receiveShadow>
        <boxGeometry args={[9.2, 3.4, 42]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      {/* Bow taper */}
      <mesh position={[0, 1.8, -22]} rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
        <coneGeometry args={[4.6, 5.2, 4]} />
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
        <mesh position={[0, 2.0, 0]}>
          <boxGeometry args={[8.0, 3.8, 7.5]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
        </mesh>
        {/* Navigation Windows */}
        <mesh position={[0, 3.0, -3.8]}>
          <planeGeometry args={[7.2, 1.0]} />
          <meshStandardMaterial color="#0369a1" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Funnel */}
        <mesh position={[0, 4.6, 2.2]}>
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
      <mesh position={[0, 1.2, 0]} receiveShadow>
        <boxGeometry args={[5.4, 2.4, 18]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
      </mesh>
      {/* High Flared Bow Wedge */}
      <mesh position={[0, 1.5, -9.5]} rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
        <coneGeometry args={[2.7, 3.8, 4]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
      </mesh>
      {/* Orange Safety Gunwale Stripe */}
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[5.55, 0.25, 18.2]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} />
      </mesh>

      {/* Forward Wheelhouse / Cabin */}
      <group position={[0, 2.4, -3.2]}>
        <mesh position={[0, 1.5, 0]}>
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
        <mesh position={[-2.2, 2.2, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.3, 4.6, 0.3]} />
          <meshStandardMaterial color="#eab308" roughness={0.6} metalness={0.4} />
        </mesh>
        {/* Right Leg */}
        <mesh position={[2.2, 2.2, 0]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.3, 4.6, 0.3]} />
          <meshStandardMaterial color="#eab308" roughness={0.6} metalness={0.4} />
        </mesh>
        {/* Top Crossbar */}
        <mesh position={[0, 4.4, 0]}>
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
      <mesh position={[-1.2, 2.7, 4.5]}>
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
      <mesh position={[0, 0.45, 0]} receiveShadow>
        <boxGeometry args={[1.85, 0.85, 5.2]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Pointed Bow Wedge */}
      <mesh position={[0, 0.52, -2.9]} rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
        <coneGeometry args={[0.95, 1.5, 4]} />
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
        <mesh position={[0, 0.58, 0]}>
          <boxGeometry args={[0.55, 0.6, 0.38]} />
          <meshStandardMaterial color="#eab308" roughness={0.6} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.02, 0]}>
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
      <mesh position={[-0.35, 0.48, 0.3]}>
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
      <mesh position={[0, 0.42, 0]} receiveShadow>
        <boxGeometry args={[1.7, 0.8, 4.8]} />
        <meshStandardMaterial color="#166534" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, -2.6]} rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
        <coneGeometry args={[0.85, 1.4, 4]} />
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
        <mesh position={[0, 1.2, 0]}>
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
      <mesh position={[0, 0.9, 0]} receiveShadow>
        <boxGeometry args={[3.8, 1.8, 13.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Sharp Bow Entry */}
      <mesh position={[0, 0.95, -7.2]} rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
        <coneGeometry args={[1.9, 2.8, 4]} />
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
      <mesh position={[0, 2.3, -1.8]}>
        <boxGeometry args={[2.8, 0.85, 6.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.35, -1.8]}>
        <boxGeometry args={[2.88, 0.4, 4.8]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.15} />
      </mesh>

      {/* Tall Sailing Mast (Height 15m) */}
      <group position={[0, 2.4, -1.2]}>
        <mesh position={[0, 7.5, 0]}>
          <cylinderGeometry args={[0.09, 0.14, 15, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Horizontal Boom */}
        <mesh position={[0, 1.8, 3.2]} rotation={[Math.PI / 2, 0, 0]}>
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
      <mesh position={[0, 0.4, 0]}>
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
      {/* 1. North Sea Container Port Terminal & Active STS Crane */}
      <NorthHarborContainerPort isNight={isNight} />

      {/* 2. Dynamic Visiting Container Ship (Berthing, Loading & Sailing Cycle) */}
      <VisitingContainerShip isNight={isNight} />

      {/* 3. Anchored Coastal Tanker / Bulk Freighter */}
      <AnchoredCoastalTanker position={[240, 0, -810]} rotation={[0, 0.22, 0]} isNight={isNight} />

      {/* 4. Active Ocean Fishing Trawler */}
      <ActiveFishingTrawler position={[275, 0, -655]} rotation={[0, 0.65, 0]} isNight={isNight} />

      {/* 5. Small Fishing Rowboat #1 with Angler (Bay Calm Water) */}
      <SmallFishingBoatWithAngler position={[245, 0, -625]} rotation={[0, 1.2, 0]} isNight={isNight} />

      {/* 6. Small Fishing Boat #2 with Standing Angler (Near Cape Rocks) */}
      <CliffFishingBoatWithAngler position={[230, 0, -655]} rotation={[0, -0.5, 0]} isNight={isNight} />

      {/* 7. Modern Sailing Yacht in the Bay Entrance */}
      <SailingYacht position={[270, 0, -615]} rotation={[0, -0.28, 0]} isNight={isNight} />

      {/* 8. Navigational Channel Buoys (Starboard Green & Port Red) */}
      <MaritimeChannelBuoy position={[245, 0, -608]} color="#16a34a" isNight={isNight} periodOffset={0} />
      <MaritimeChannelBuoy position={[295, 0, -608]} color="#dc2626" isNight={isNight} periodOffset={1.5} />
    </group>
  );
}
