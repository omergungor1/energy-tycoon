'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight } from './WorldCanvas';

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
        polygonOffset: true,
        polygonOffsetFactor: -1.0,
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
  const MARINA_HARBOR_POS = { x: 225, z: -375, y: getTerrainHeight(225, -375) };

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. PINE RIDGE ALPINE VILLAGE                              */}
      {/* ========================================================= */}
      <group position={[PINE_RIDGE_POS.x, PINE_RIDGE_POS.y, PINE_RIDGE_POS.z]}>
        {/* Village Center Cobblestone Plaza */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
          <circleGeometry args={[26, 24]} />
          <meshStandardMaterial color="#475569" roughness={0.94} />
        </mesh>

        {/* Historic Alpine Church & Clock Tower */}
        <group position={[0, 0, -8]}>
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
          <group key={`chalet_${i}`} position={[h.x, 0, h.z]} rotation={[0, h.rot, 0]}>
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
          <group key={`lamp_pr_${si}`} position={[sx, sy, sz]}>
            <mesh position={[0, 1.9, 0]} material={mats.stoneFoundation}>
              <cylinderGeometry args={[0.08, 0.12, 3.8, 6]} />
            </mesh>
            <mesh position={[0, 3.8, 0]} material={mats.streetLampGlow}>
              <sphereGeometry args={[0.26, 8, 8]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 2. SUNFIRE COASTAL CITY                                   */}
      {/* ========================================================= */}
      <group position={[SUNFIRE_CITY_POS.x, SUNFIRE_CITY_POS.y, SUNFIRE_CITY_POS.z]}>
        {/* City Asphalt Ground Grid & Sidewalks */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
          <planeGeometry args={[88, 76]} />
          <meshStandardMaterial color="#1e242d" roughness={0.9} />
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
          <group key={`city_b_${bi}`} position={[b.x, 0, b.z]} rotation={[0, b.rot, 0]}>
            {/* 1. Main Structural Tower Body */}
            <mesh position={[0, b.h * 0.5, 0]} castShadow receiveShadow material={mats.cityWallMat}>
              <boxGeometry args={[b.w, b.h, b.d]} />
            </mesh>

            {/* 2. Glass Curtain Façade Paneling (Clean non-intersecting planes on 4 faces with polygonOffset, 0 Z-fighting) */}
            {/* Front Window Façade (+Z) */}
            <mesh position={[0, b.h * 0.5, b.d * 0.5 + 0.05]} material={mats.cityGlassMat}>
              <planeGeometry args={[b.w * 0.84, b.h * 0.88]} />
            </mesh>
            {/* Back Window Façade (-Z) */}
            <mesh position={[0, b.h * 0.5, -b.d * 0.5 - 0.05]} rotation={[0, Math.PI, 0]} material={mats.cityGlassMat}>
              <planeGeometry args={[b.w * 0.84, b.h * 0.88]} />
            </mesh>
            {/* East Window Façade (+X) */}
            <mesh position={[b.w * 0.5 + 0.05, b.h * 0.5, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.cityGlassMat}>
              <planeGeometry args={[b.d * 0.84, b.h * 0.88]} />
            </mesh>
            {/* West Window Façade (-X) */}
            <mesh position={[-b.w * 0.5 - 0.05, b.h * 0.5, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.cityGlassMat}>
              <planeGeometry args={[b.d * 0.84, b.h * 0.88]} />
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
          <group key={`c_light_${li}`} position={[lx, 0, 0]}>
            <mesh position={[0, 3.2, 0]} material={mats.stoneFoundation}>
              <cylinderGeometry args={[0.1, 0.14, 6.4, 6]} />
            </mesh>
            <mesh position={[0, 6.4, 0]} material={mats.streetLampGlow}>
              <sphereGeometry args={[0.32, 8, 8]} />
            </mesh>
          </group>
        ))}
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

        {/* Textured Agricultural Crop & Golden Wheat Fields */}
        <group position={[0, 0.05, 38]}>
          {/* Golden Wheat Crop Field */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-18, 0, 0]} receiveShadow>
            <planeGeometry args={[32, 28]} />
            <primitive object={mats.wheatFieldMat} />
          </mesh>
          {/* Lush Green Vegetable Crop Field */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, 0, 0]} receiveShadow>
            <planeGeometry args={[32, 28]} />
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
            <mesh key={`hay_${hi}`} position={[hx, hy, hz]} castShadow>
              <cylinderGeometry args={[0.7, 0.7, 1.4, 12]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.9} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ========================================================= */}
      {/* 4. ENERGY LOGISTICS & INDUSTRIAL PARK                    */}
      {/* ========================================================= */}
      <group position={[INDUSTRIAL_PARK_POS.x, INDUSTRIAL_PARK_POS.y, INDUSTRIAL_PARK_POS.z]}>
        {/* Reinforced Heavy-Duty Industrial Concrete Slab */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
          <planeGeometry args={[75, 55]} />
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>

        {/* Large Industrial Distribution Warehouses */}
        <group position={[-18, 0, -8]}>
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
        <group position={[18, 0, -10]}>
          <mesh position={[0, 5.2, 0]} castShadow material={mats.siloMat}>
            <sphereGeometry args={[4.8, 16, 16]} />
          </mesh>
          <mesh position={[10, 4.5, 0]} castShadow material={mats.siloMat}>
            <cylinderGeometry args={[3.4, 3.4, 9, 16]} />
          </mesh>
        </group>

        {/* Stacked ISO Shipping Containers (Logistics Depot) */}
        <group position={[12, 0, 14]}>
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
          <group key={`flood_${fi}`} position={[fx, fy, fz]}>
            <mesh position={[0, 7.5, 0]} material={mats.stoneFoundation}>
              <cylinderGeometry args={[0.14, 0.22, 15, 6]} />
            </mesh>
            <mesh position={[0, 15.2, 0]}>
              <boxGeometry args={[1.4, 0.8, 0.4]} />
              <meshBasicMaterial color={isNight ? '#fef08a' : '#64748b'} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ========================================================= */}
      {/* 5. COASTAL MARINA & HARBOR PIER                           */}
      {/* ========================================================= */}
      <group position={[MARINA_HARBOR_POS.x, MARINA_HARBOR_POS.y, MARINA_HARBOR_POS.z]}>
        {/* Main Timber Harbor Pier extending into deep water */}
        <group position={[0, -0.4, 0]}>
          <mesh position={[0, 0, -18]} castShadow receiveShadow material={mats.dockWoodMat}>
            <boxGeometry args={[14, 0.8, 42]} />
          </mesh>
          {/* Wooden Mooring Pilings */}
          {[-6, 6].map((px) =>
            [-6, -16, -26, -36].map((pz, pzi) => (
              <mesh key={`piling_${px}_${pzi}`} position={[px, -2.4, pz]} material={mats.stoneFoundation}>
                <cylinderGeometry args={[0.3, 0.3, 5.0, 8]} />
              </mesh>
            ))
          )}
        </group>

        {/* Classic Coastal Lighthouse with Rotating Night Beam */}
        <group position={[-20, 0, 6]}>
          {/* White & Red Striped Tapered Tower */}
          <mesh position={[0, 7.5, 0]} castShadow material={mats.cityWallMat}>
            <cylinderGeometry args={[2.2, 3.8, 15, 16]} />
          </mesh>
          <mesh position={[0, 7.5, 0]} material={mats.redBarnMat}>
            <cylinderGeometry args={[2.25, 2.9, 3.8, 16]} />
          </mesh>
          {/* Lantern Room & Gallery */}
          <mesh position={[0, 15.5, 0]} material={mats.stoneFoundation}>
            <cylinderGeometry args={[2.8, 2.8, 0.6, 16]} />
          </mesh>
          <mesh position={[0, 17.0, 0]} material={mats.cityGlassMat}>
            <cylinderGeometry args={[2.0, 2.0, 2.4, 16]} />
          </mesh>
          <mesh position={[0, 19.0, 0]} material={mats.barnRoofMat}>
            <coneGeometry args={[2.4, 1.6, 16]} />
          </mesh>

          {/* Rotating High-Power Searchlight Beam at Night */}
          <group ref={lighthouseBeamRef} position={[0, 17.0, 0]}>
            <mesh position={[0, 0, 35]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[9.5, 0.3, 70, 16, 1, true]} />
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

        {/* Moored Cargo Freighter Ship at the Harbor Dock */}
        <group position={[18, -0.6, -20]} rotation={[0, -0.05, 0]}>
          {/* Ship Hull */}
          <mesh position={[0, 1.8, 0]} castShadow material={mats.shipHullMat}>
            <boxGeometry args={[8.5, 3.6, 34]} />
          </mesh>
          {/* Wheelhouse / Bridge */}
          <mesh position={[0, 4.6, 10]} castShadow material={mats.cityWallMat}>
            <boxGeometry args={[7.2, 3.2, 6.5]} />
          </mesh>
          {/* Cargo Deck Containers */}
          <mesh position={[0, 4.2, -6]} castShadow material={mats.containerBlue}>
            <boxGeometry args={[5.8, 2.5, 12]} />
          </mesh>
        </group>

        {/* Small Fishing Trawlers Bobbing in Marina */}
        <group position={[-16, -0.6, -26]} rotation={[0, 0.3, 0]}>
          <mesh position={[0, 0.9, 0]} castShadow material={mats.redBarnMat}>
            <boxGeometry args={[3.2, 1.8, 8.5]} />
          </mesh>
          <mesh position={[0, 2.4, 1.2]} material={mats.cityWallMat}>
            <boxGeometry args={[2.4, 1.4, 2.4]} />
          </mesh>
          <mesh position={[0, 3.6, -1.0]} material={mats.stoneFoundation}>
            <cylinderGeometry args={[0.06, 0.06, 3.2, 6]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

