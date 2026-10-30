'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

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
  { x: -30, z: -22 },
  { x: 32, z: 24 },
  { x: 34, z: -28 },
  { x: -34, z: 30 },
  { x: 0, z: -44 },
  { x: 0, z: 44 },
  { x: -48, z: 0 },
  { x: 48, z: 0 }
];

// Animated 3D Wind Turbine with Slow Realistic Yaw Tracking & Spinning Rotor
function WindTurbine({ position, rotationY = 0, windSpeed = 8.5, onClick }) {
  const bladesRef = useRef();
  const beaconRef = useRef();
  const yawHeadRef = useRef();

  useFrame(({ clock }, delta) => {
    // 1. Aerodynamic Rotor rotation based on wind speed
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * (windSpeed * 0.42);
    }

    // 2. Pulsing aviation warning light (soft strobe pulse at 1Hz)
    if (beaconRef.current) {
      const t = clock.getElapsedTime();
      const flash = Math.sin(t * 3.5) > 0.2 ? 1.0 : 0.15;
      beaconRef.current.material.opacity = flash;
    }

    // 3. Realistic slow yaw motion (wind tracking oscillation, ~60-90s period)
    if (yawHeadRef.current) {
      const t = clock.getElapsedTime();
      const yawDrift =
        Math.sin(t * 0.065 + position[0] * 0.05) * 0.22 +
        Math.sin(t * 0.025 + position[2] * 0.05) * 0.08;
      yawHeadRef.current.rotation.y = (rotationY * Math.PI) / 180 + yawDrift;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Heavy Octagonal Reinforced Concrete Foundation Pad */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.6, 4.2, 0.8, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* Steel Base Collar */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.3, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Tapered White Steel Tower */}
      <mesh position={[0, 19.5, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.5, 37.0, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.2} />
      </mesh>

      {/* Top Yaw Ring Bearing */}
      <mesh position={[0, 38.0, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.4, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>

      {/* DYNAMIC YAWING HEAD ASSEMBLY: Nacelle, Hub & Blades */}
      <group position={[0, 38.2, 0]} ref={yawHeadRef}>
        {/* Nacelle (Generator Housing) */}
        <mesh position={[0, 0, 0.6]} castShadow>
          <boxGeometry args={[2.5, 2.5, 5.8]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.3} />
        </mesh>

        {/* Radiator Cooling Fins on Nacelle Back */}
        <mesh position={[0, 0, -2.4]}>
          <boxGeometry args={[2.1, 2.1, 0.5]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Pulsing Red Aviation Safety Beacon Light */}
        <mesh position={[0, 1.5, -1.2]} ref={beaconRef}>
          <sphereGeometry args={[0.35, 10, 10]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={1.0} />
        </mesh>

        {/* Rotating Rotor Hub & Aerodynamic Blades */}
        <group position={[0, 0, 3.6]} ref={bladesRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.05, 1.25, 1.5, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.4} />
          </mesh>

          {[0, 1, 2].map((i) => {
            const angle = (i * 2 * Math.PI) / 3;
            return (
              <group key={i} rotation={[0, 0, angle]}>
                <mesh position={[0, 10.5, 0]} castShadow>
                  <boxGeometry args={[0.75, 21.0, 0.16]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.2} />
                </mesh>
                <mesh position={[0, 20.2, 0]}>
                  <boxGeometry args={[0.76, 2.0, 0.17]} />
                  <meshStandardMaterial color="#ef4444" roughness={0.3} />
                </mesh>
              </group>
            );
          })}
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
    const fromY = getTerrainHeight(from[0], from[2]) + 4.5;
    const toY = getTerrainHeight(to[0], to[2]) + 4.5;
    const midX = (from[0] + to[0]) / 2;
    const midZ = (from[2] + to[2]) / 2;
    const midY = (fromY + toY) / 2 + 7;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(from[0], fromY, from[2]),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(to[0], toY, to[2])
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
function SiteMarker({ site, isOwned, isLeased, onSelect }) {
  const siteY = getTerrainHeight(site.center_x, site.center_z);

  const territoryRadius = useMemo(() => {
    const ha = Number(site.area_hectares || 50);
    return Math.max(52, Math.min(80, 42 + Math.sqrt(ha) * 2.8));
  }, [site.area_hectares]);

  const ringColor = isOwned
    ? '#10b981'
    : isLeased
    ? '#06b6d4'
    : site.region_type === 'wind'
    ? '#38bdf8'
    : site.region_type === 'solar'
    ? '#f59e0b'
    : '#c084fc';

  // Terrain-conforming wide perimeter line (never clips into hills)
  const boundaryLine = useMemo(() => {
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const px = site.center_x + Math.cos(theta) * territoryRadius;
      const pz = site.center_z + Math.sin(theta) * territoryRadius;
      // Sampling terrain height with +0.8m offset to glide cleanly over slopes
      const py = getTerrainHeight(px, pz) + 0.8;
      points.push(new THREE.Vector3(px, py, pz));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: isOwned || isLeased ? 0.95 : 0.7,
      depthTest: true
    });
    return new THREE.LineLoop(geo, mat);
  }, [site.center_x, site.center_z, territoryRadius, ringColor, isOwned, isLeased]);

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

      {/* Invisible Click Boundary */}
      <mesh
        position={[site.center_x, siteY + 2.0, site.center_z]}
        onClick={() => onSelect(site)}
      >
        <cylinderGeometry args={[territoryRadius, territoryRadius, 6.0, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Floating Native WebGL 3D Billboard Badge (Zero React DOM Root Overhead) */}
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
    </group>
  );
}

// Procedural 3D Island Terrain with Smooth Continuous Biome Gradient
function IslandTerrain() {
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

      let r = 0.18, g = 0.52, b = 0.22; // Lush spring green baseline

      if (falloff < 0.25 || y < 1.0) {
        // Shallow turquoise coastal reef & lagoon
        r = 0.05;
        g = 0.42;
        b = 0.58;
      } else if (falloff < 0.85 || y < 4.5) {
        // Sunny golden ocean beach
        const t = Math.max(0, Math.min(1, (y - 1.0) / 3.5));
        r = 0.88 - t * 0.35;
        g = 0.80 - t * 0.25;
        b = 0.46 - t * 0.20;
      } else if (distLake < ALPINE_LAKE_CENTER.radius + 10) {
        // Alpine Lake Shoreline & Banks
        if (y < ALPINE_LAKE_CENTER.waterLevel + 0.6) {
          // Soft golden pebble & sand lakeshore
          r = 0.78;
          g = 0.70;
          b = 0.50;
        } else {
          // Lush emerald mossy bank
          r = 0.14;
          g = 0.58;
          b = 0.24;
        }
      } else if (x > 120 && z > 60) {
        // Desert / Sunfire Solar Steppe (SE quadrant)
        if (x > 500 && z > 200) {
          // Radiant white/cream saltbed flats
          r = 0.85;
          g = 0.82;
          b = 0.74;
        } else if (x > 260) {
          // Golden sunbaked sand dunes
          r = 0.82;
          g = 0.64;
          b = 0.32;
        } else {
          // Arid terracotta savanna
          r = 0.62;
          g = 0.54;
          b = 0.32;
        }
      } else if (x < -60) {
        // Mountain & Highland Wind Zone (Western Ridge)
        if (y > 68) {
          // Alpine Snow & Summit Glaciers
          const t = Math.min(1, (y - 68) / 10);
          r = 0.94 + t * 0.04;
          g = 0.96 + t * 0.03;
          b = 0.98 + t * 0.02;
        } else if (y > 46) {
          // Slate & Granite Rock with frost dusting
          const t = (y - 46) / 22;
          r = 0.44 + t * 0.40;
          g = 0.47 + t * 0.40;
          b = 0.52 + t * 0.40;
        } else if (y > 24) {
          // Mountain Pine Forest slopes
          const t = (y - 24) / 22;
          r = 0.13 + t * 0.22;
          g = 0.36 + t * 0.10;
          b = 0.17 + t * 0.22;
        } else {
          // Highland Foothills
          r = 0.17;
          g = 0.46;
          b = 0.22;
        }
      } else {
        // Central Hybrid Valleys & River Plain
        r = 0.18;
        g = 0.54;
        b = 0.24;
      }

      // Natural organic noise variation
      const noise = (Math.sin(x * 0.05) * Math.cos(z * 0.05) + Math.sin(x * 0.11 + z * 0.09) * 0.5) * 0.03;
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

// Road ribbon geometry generator (creates 3D asphalt ribbon + dashed highway stripe)
function createRoadRibbon(points, width = 4.4) {
  const curve = new THREE.CatmullRomCurve3(points);
  const totalLength = curve.getLength();
  const segments = Math.max(30, Math.floor(totalLength / 5.0));
  const curvePoints = curve.getSpacedPoints(segments);

  const roadVertices = [];
  const roadIndices = [];
  const roadUVs = [];

  const stripeVertices = [];
  const stripeIndices = [];

  const halfW = width * 0.5;
  const stripeHalfW = 0.18;

  for (let i = 0; i < curvePoints.length; i++) {
    const curr = curvePoints[i];
    let tangent = new THREE.Vector3();

    if (i === 0) {
      tangent.subVectors(curvePoints[1], curr).normalize();
    } else if (i === curvePoints.length - 1) {
      tangent.subVectors(curr, curvePoints[i - 1]).normalize();
    } else {
      tangent.subVectors(curvePoints[i + 1], curvePoints[i - 1]).normalize();
    }

    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const leftP = curr.clone().addScaledVector(normal, halfW);
    const rightP = curr.clone().addScaledVector(normal, -halfW);

    const yLeft = getTerrainHeight(leftP.x, leftP.z) + 0.18;
    const yRight = getTerrainHeight(rightP.x, rightP.z) + 0.18;
    const yCenter = (yLeft + yRight) * 0.5;

    roadVertices.push(leftP.x, yLeft, leftP.z);
    roadVertices.push(rightP.x, yRight, rightP.z);

    const v = (i / segments) * (totalLength / 8);
    roadUVs.push(0, v);
    roadUVs.push(1, v);

    const stripeLeft = curr.clone().addScaledVector(normal, stripeHalfW);
    const stripeRight = curr.clone().addScaledVector(normal, -stripeHalfW);
    stripeVertices.push(stripeLeft.x, yCenter + 0.03, stripeLeft.z);
    stripeVertices.push(stripeRight.x, yCenter + 0.03, stripeRight.z);

    if (i < curvePoints.length - 1) {
      const baseIdx = i * 2;
      roadIndices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      roadIndices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);

      // Dashed highway striping: 2 segments on, 1 segment off
      if (i % 3 !== 2) {
        stripeIndices.push(baseIdx, baseIdx + 1, baseIdx + 2);
        stripeIndices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
      }
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const stripeGeo = new THREE.BufferGeometry();
  stripeGeo.setAttribute('position', new THREE.Float32BufferAttribute(stripeVertices, 3));
  stripeGeo.setIndex(stripeIndices);
  stripeGeo.computeVertexNormals();

  return { roadGeo, stripeGeo, curve };
}

// Pre-defined Highway Curves connecting key regions
const HIGHWAY_CURVES = [
  // Highway 1: West Mountain Energy Parkway
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-85, 0, -20),
    new THREE.Vector3(-190, 0, -65),
    new THREE.Vector3(-280, 0, -110),
    new THREE.Vector3(-395, 0, -150),
    new THREE.Vector3(-445, 0, -315),
    new THREE.Vector3(-575, 0, -415),
    new THREE.Vector3(-680, 0, -180)
  ]),
  // Highway 2: East Sunfire Solar Expressway
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(120, 0, 95),
    new THREE.Vector3(235, 0, 215),
    new THREE.Vector3(375, 0, 275),
    new THREE.Vector3(485, 0, 345),
    new THREE.Vector3(615, 0, 190),
    new THREE.Vector3(725, 0, 310)
  ]),
  // Highway 3: South Alpine Lake & Shoreline Loop
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-65, 0, 45),
    new THREE.Vector3(-118, 0, 78),
    new THREE.Vector3(-175, 0, 155),
    new THREE.Vector3(-215, 0, 235),
    new THREE.Vector3(-260, 0, 310)
  ]),
  // Highway 4: Northern Transmission Highway
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(28, 0, -95),
    new THREE.Vector3(48, 0, -175),
    new THREE.Vector3(-48, 0, -315),
    new THREE.Vector3(-130, 0, -360)
  ])
];

// Island Road Networks with 3D Asphalt Ribbon & Dashed Centerlines
function IslandRoads() {
  const roadData = useMemo(() => {
    return [
      createRoadRibbon(HIGHWAY_CURVES[0].points, 4.4),
      createRoadRibbon(HIGHWAY_CURVES[1].points, 4.4),
      createRoadRibbon(HIGHWAY_CURVES[2].points, 4.0),
      createRoadRibbon(HIGHWAY_CURVES[3].points, 4.0)
    ];
  }, []);

  return (
    <group>
      {roadData.map((rd, i) => (
        <group key={`road_net_${i}`}>
          {/* Asphalt Surface */}
          <mesh geometry={rd.roadGeo} receiveShadow>
            <meshStandardMaterial
              color="#262626"
              roughness={0.92}
              metalness={0.08}
            />
          </mesh>
          {/* Dashed Centerline */}
          <mesh geometry={rd.stripeGeo}>
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Active Living Traffic: Utility Service Vans, Battery Logistics Haulers & EVs
function TrafficVehicles() {
  const van1Ref = useRef();
  const truck1Ref = useRef();
  const haulerRef = useRef();
  const van2Ref = useRef();
  const pickup1Ref = useRef();
  const pickup2Ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    const updateCar = (ref, curve, speed, offset) => {
      if (!ref.current || !curve) return;
      const progress = (offset + t * speed) % 1.0;
      const p = curve.getPointAt(progress);
      const nextProgress = (progress + 0.006) % 1.0;
      const pNext = curve.getPointAt(nextProgress);
      const y = getTerrainHeight(p.x, p.z) + 0.2;
      ref.current.position.set(p.x, y, p.z);
      ref.current.lookAt(pNext.x, y, pNext.z);
    };

    updateCar(van1Ref, HIGHWAY_CURVES[0], 0.035, 0.08);
    updateCar(truck1Ref, HIGHWAY_CURVES[0], 0.024, 0.58);
    updateCar(haulerRef, HIGHWAY_CURVES[1], 0.026, 0.15);
    updateCar(van2Ref, HIGHWAY_CURVES[1], 0.038, 0.65);
    updateCar(pickup1Ref, HIGHWAY_CURVES[2], 0.032, 0.22);
    updateCar(pickup2Ref, HIGHWAY_CURVES[3], 0.034, 0.45);
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
        <mesh position={[-0.8, 0.7, 2.22]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh position={[0.8, 0.7, 2.22]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        {[-1.15, 1.15].map((x) =>
          [-1.3, 1.3].map((z, idx) => (
            <mesh key={`${x}_${z}_${idx}`} position={[x, 0.4, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.4, 0.4, 0.3, 10]} />
              <meshStandardMaterial color="#1e293b" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>

      {/* 2. Heavy Wind Maintenance Truck */}
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
      </group>

      {/* 3. Mega Battery Logistics Hauler with Glowing Battery Modules */}
      <group ref={haulerRef}>
        <mesh position={[0, 1.3, 1.8]} castShadow>
          <boxGeometry args={[2.6, 2.0, 2.8]} />
          <meshStandardMaterial color="#0369a1" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.6, -1.8]} castShadow>
          <boxGeometry args={[2.6, 0.5, 6.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        {/* Battery Container Cargo 1 */}
        <mesh position={[0, 1.5, -0.6]} castShadow>
          <boxGeometry args={[2.2, 1.3, 2.6]} />
          <meshStandardMaterial color="#0f766e" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Battery Container Cargo 2 */}
        <mesh position={[0, 1.5, -3.2]} castShadow>
          <boxGeometry args={[2.2, 1.3, 2.6]} />
          <meshStandardMaterial color="#0f766e" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Battery Green LED status strip */}
        <mesh position={[1.12, 1.5, -0.6]}>
          <boxGeometry args={[0.04, 0.15, 1.8]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
        <mesh position={[1.12, 1.5, -3.2]}>
          <boxGeometry args={[0.04, 0.15, 1.8]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
      </group>

      {/* 4. Solar Tech Rapid Response Van */}
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
      </group>

      {/* 5. Clean Energy Ranger SUV (Lake Loop) */}
      <group ref={pickup1Ref}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[2.1, 1.3, 4.2]} />
          <meshStandardMaterial color="#059669" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[0, 1.2, 0.4]}>
          <boxGeometry args={[1.9, 0.6, 1.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} />
        </mesh>
        <mesh position={[0, 1.6, -0.4]}>
          <boxGeometry args={[1.6, 0.12, 1.8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* 6. Northern Transmission Inspection Truck */}
      <group ref={pickup2Ref}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[2.2, 1.4, 4.4]} />
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.25, 0.8]}>
          <boxGeometry args={[2.0, 0.65, 1.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// Procedural Deterministic Vegetation Locations
function getVegetationLocations() {
  const locations = [];
  let seed = 1337;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let i = 0; i < 2800; i++) {
    const angle = random() * Math.PI * 2;
    const rad = Math.sqrt(random()) * 1020;
    const x = Math.cos(angle) * rad;
    const z = Math.sin(angle) * rad;

    const falloff = getIslandFalloff(x, z);
    if (falloff < 0.96) continue;

    if (Math.hypot(x, z) < 55) continue;

    const distLake = Math.hypot(x - ALPINE_LAKE_CENTER.x, z - ALPINE_LAKE_CENTER.z);
    if (distLake < ALPINE_LAKE_CENTER.radius + 6) continue;

    let tooCloseToSite = false;
    for (let s = 0; s < KNOWN_SITES.length; s++) {
      if (Math.hypot(x - KNOWN_SITES[s].x, z - KNOWN_SITES[s].z) < 44) {
        tooCloseToSite = true;
        break;
      }
    }
    if (tooCloseToSite) continue;

    const y = getTerrainHeight(x, z);
    if (y > 64) continue;

    let type = 'deciduous';
    if (x < -70 || distLake < 130 || y > 28) {
      type = random() > 0.25 ? 'pine' : 'deciduous';
    } else if (x > 140 && z > 60) {
      type = random() > 0.55 ? 'shrub' : 'deciduous';
    } else {
      type = random() > 0.4 ? 'deciduous' : 'shrub';
    }

    const scale = 0.82 + random() * 0.42;
    const rotY = random() * Math.PI * 2;

    locations.push({ x, y, z, scale, rotY, type });
    if (locations.length >= 950) break;
  }
  return locations;
}

// Lush 3D Nature: Highland Pines, Valley Deciduous Trees & Flowering Shrubs
function IslandVegetation() {
  const pineTrunkRef = useRef();
  const pineFoliageRef = useRef();
  const decTrunkRef = useRef();
  const decFoliageRef = useRef();
  const shrubRef = useRef();

  const vegData = useMemo(() => getVegetationLocations(), []);

  const pineTrunkGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.24, 0.38, 2.2, 5);
    geo.translate(0, 1.1, 0);
    return geo;
  }, []);

  const pineFoliageGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(2.2, 5.4, 6);
    geo.translate(0, 4.2, 0);
    return geo;
  }, []);

  const decTrunkGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.28, 0.42, 2.0, 5);
    geo.translate(0, 1.0, 0);
    return geo;
  }, []);

  const decFoliageGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(2.1, 1);
    geo.translate(0, 3.6, 0);
    return geo;
  }, []);

  const shrubGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1.3, 0);
    geo.scale(1.3, 0.75, 1.3);
    geo.translate(0, 0.65, 0);
    return geo;
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    let pineCount = 0;
    let decCount = 0;
    let shrubCount = 0;

    vegData.forEach((item) => {
      dummy.position.set(item.x, item.y, item.z);
      dummy.rotation.set(0, item.rotY, 0);
      dummy.scale.set(item.scale, item.scale, item.scale);
      dummy.updateMatrix();

      if (item.type === 'pine') {
        if (pineTrunkRef.current && pineFoliageRef.current) {
          pineTrunkRef.current.setMatrixAt(pineCount, dummy.matrix);
          pineFoliageRef.current.setMatrixAt(pineCount, dummy.matrix);
          pineCount++;
        }
      } else if (item.type === 'deciduous') {
        if (decTrunkRef.current && decFoliageRef.current) {
          decTrunkRef.current.setMatrixAt(decCount, dummy.matrix);
          decFoliageRef.current.setMatrixAt(decCount, dummy.matrix);
          decCount++;
        }
      } else if (item.type === 'shrub') {
        if (shrubRef.current) {
          shrubRef.current.setMatrixAt(shrubCount, dummy.matrix);
          shrubCount++;
        }
      }
    });

    if (pineTrunkRef.current) {
      pineTrunkRef.current.instanceMatrix.needsUpdate = true;
      pineTrunkRef.current.count = pineCount;
    }
    if (pineFoliageRef.current) {
      pineFoliageRef.current.instanceMatrix.needsUpdate = true;
      pineFoliageRef.current.count = pineCount;
    }
    if (decTrunkRef.current) {
      decTrunkRef.current.instanceMatrix.needsUpdate = true;
      decTrunkRef.current.count = decCount;
    }
    if (decFoliageRef.current) {
      decFoliageRef.current.instanceMatrix.needsUpdate = true;
      decFoliageRef.current.count = decCount;
    }
    if (shrubRef.current) {
      shrubRef.current.instanceMatrix.needsUpdate = true;
      shrubRef.current.count = shrubCount;
    }
  }, [vegData]);

  return (
    <group>
      {/* Pine Trees */}
      <instancedMesh
        ref={pineTrunkRef}
        args={[pineTrunkGeo, null, 650]}
        castShadow
      >
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </instancedMesh>
      <instancedMesh
        ref={pineFoliageRef}
        args={[pineFoliageGeo, null, 650]}
        castShadow
      >
        <meshStandardMaterial color="#14532d" roughness={0.82} />
      </instancedMesh>

      {/* Deciduous Trees */}
      <instancedMesh
        ref={decTrunkRef}
        args={[decTrunkGeo, null, 650]}
        castShadow
      >
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </instancedMesh>
      <instancedMesh
        ref={decFoliageRef}
        args={[decFoliageGeo, null, 650]}
        castShadow
      >
        <meshStandardMaterial color="#16a34a" roughness={0.76} />
      </instancedMesh>

      {/* Flowering Meadow Shrubs */}
      <instancedMesh
        ref={shrubRef}
        args={[shrubGeo, null, 400]}
        castShadow
      >
        <meshStandardMaterial color="#84cc16" roughness={0.8} />
      </instancedMesh>
    </group>
  );
}

// Atmospheric Drifting Sky Clouds
function AtmosphericClouds() {
  const cloudsGroupRef = useRef();

  const clouds = useMemo(() => {
    const list = [];
    for (let i = 0; i < 10; i++) {
      list.push({
        x: (Math.random() - 0.5) * 2200,
        y: 200 + Math.random() * 60,
        z: (Math.random() - 0.5) * 2200,
        scale: 1.2 + Math.random() * 1.5,
        speed: 2.5 + Math.random() * 3.5
      });
    }
    return list;
  }, []);

  useFrame((_, delta) => {
    if (!cloudsGroupRef.current) return;
    cloudsGroupRef.current.children.forEach((cloudMesh, i) => {
      const c = clouds[i];
      cloudMesh.position.x += delta * c.speed;
      // Seamless wrap-around island sky
      if (cloudMesh.position.x > 1300) {
        cloudMesh.position.x = -1300;
      }
    });
  });

  return (
    <group ref={cloudsGroupRef}>
      {clouds.map((c, idx) => (
        <group key={idx} position={[c.x, c.y, c.z]} scale={c.scale}>
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[26, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.88} />
          </mesh>
          <mesh position={[20, -4, 5]}>
            <sphereGeometry args={[18, 8, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.9} transparent opacity={0.85} />
          </mesh>
          <mesh position={[-18, -3, -4]}>
            <sphereGeometry args={[20, 8, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.9} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Flocks of Soaring Birds in Thermal Orbits
function BirdFlock() {
  const birdsGroupRef = useRef();

  const birds = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      angleOffset: (i * Math.PI * 2) / 6,
      radius: 220 + i * 25,
      yOffset: 120 + i * 8,
      speed: 0.18 + i * 0.02
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!birdsGroupRef.current) return;
    const t = clock.getElapsedTime();
    birdsGroupRef.current.children.forEach((birdMesh, i) => {
      const b = birds[i];
      const theta = t * b.speed + b.angleOffset;
      const x = Math.cos(theta) * b.radius - 120;
      const z = Math.sin(theta) * b.radius - 80;
      const y = b.yOffset + Math.sin(t * 1.5 + i) * 12;
      birdMesh.position.set(x, y, z);
      birdMesh.rotation.y = -theta + Math.PI / 2;
    });
  });

  return (
    <group ref={birdsGroupRef}>
      {birds.map((_, idx) => (
        <group key={idx}>
          {/* Stylized Low-Poly Bird V-Shape */}
          <mesh position={[-2.2, 0, 0]} rotation={[0, 0, 0.25]}>
            <boxGeometry args={[4.2, 0.15, 1.2]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh position={[2.2, 0, 0]} rotation={[0, 0, -0.25]}>
            <boxGeometry args={[4.2, 0.15, 1.2]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Camera Controller for Smooth Plant Focus & Auto-Zoom
function CameraController({ focusedSite, worldSites, controlsRef }) {
  const { camera } = useThree();
  const targetLookAt = useRef(null);
  const targetCamPos = useRef(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (!focusedSite?.siteId) return;
    const site = worldSites.find((s) => s.id === focusedSite.siteId);
    if (!site) return;

    const siteY = getTerrainHeight(site.center_x, site.center_z);
    // Focus slightly elevated above facility ground level
    targetLookAt.current = new THREE.Vector3(site.center_x, siteY + 8, site.center_z);
    // Cinematic vantage point positioned ~48m away, overlooking turbines & solar arrays
    targetCamPos.current = new THREE.Vector3(site.center_x - 30, siteY + 18, site.center_z + 36);
    isAnimating.current = true;
  }, [focusedSite, worldSites]);

  // Cancel auto-animation if user manually drags or touches the orbit controls
  useEffect(() => {
    const controls = controlsRef?.current;
    if (!controls) return;
    const onStart = () => {
      isAnimating.current = false;
    };
    controls.addEventListener('start', onStart);
    return () => controls.removeEventListener('start', onStart);
  }, [controlsRef]);

  useFrame((_, delta) => {
    if (!isAnimating.current || !targetLookAt.current || !targetCamPos.current) return;
    // Smooth lerp interpolation factor
    const t = Math.min(1, delta * 3.2);

    if (controlsRef?.current) {
      controlsRef.current.target.lerp(targetLookAt.current, t);
    }
    camera.position.lerp(targetCamPos.current, t);

    const distCam = camera.position.distanceTo(targetCamPos.current);
    const distTarget = controlsRef?.current
      ? controlsRef.current.target.distanceTo(targetLookAt.current)
      : 0;

    if (distCam < 0.5 && distTarget < 0.25) {
      if (controlsRef?.current) {
        controlsRef.current.target.copy(targetLookAt.current);
      }
      camera.position.copy(targetCamPos.current);
      isAnimating.current = false;
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
  onSelectSite
}) {
  const controlsRef = useRef();
  const isNight = clock?.isNight ?? false;

  // Settings with defaults
  const showInfrastructure = settings.showInfrastructure ?? true;
  const graphicQuality = settings.graphicQuality || 'high';
  const showClouds = settings.showClouds ?? true;
  const showTraffic = settings.showTraffic ?? true;
  const showWildlife = settings.showWildlife ?? true;

  const isLowGraphics = graphicQuality === 'low';
  const isUltraGraphics = graphicQuality === 'ultra';

  const dpr = useMemo(() => {
    if (isLowGraphics) return 1;
    if (isUltraGraphics) return [1, 2];
    return [1, 1.5];
  }, [isLowGraphics, isUltraGraphics]);

  const shadowMapSize = useMemo(() => {
    if (isLowGraphics) return 512;
    if (isUltraGraphics) return 4096;
    return 2048;
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
        />

        {/* Sky, Fog & Lighting */}
        {isNight ? (
          <>
            <color attach="background" args={['#020617']} />
            <fog attach="fog" args={['#020617', 500, 2600]} />
            <ambientLight intensity={0.28} color="#334155" />
            <directionalLight
              position={[-180, 380, -140]}
              intensity={0.6}
              color="#7dd3fc"
            />
          </>
        ) : (
          <>
            <color attach="background" args={['#0f172a']} />
            <fog attach="fog" args={['#0f172a', 800, 3200]} />
            <ambientLight intensity={0.42} color="#f1f5f9" />
            <hemisphereLight args={['#7dd3fc', '#1e293b', 0.45]} />
            <directionalLight
              position={[320, 520, 220]}
              intensity={1.85}
              color="#fffbeb"
              castShadow={!isLowGraphics}
              shadow-mapSize-width={shadowMapSize}
              shadow-mapSize-height={shadowMapSize}
              shadow-camera-near={50}
              shadow-camera-far={1400}
              shadow-camera-left={-750}
              shadow-camera-right={750}
              shadow-camera-top={750}
              shadow-camera-bottom={-750}
              shadow-bias={-0.0003}
            />
          </>
        )}

        {/* Expansive Animated Ocean */}
        <AnimatedOcean />

        {/* Cohesive Island 3D Terrain */}
        <IslandTerrain />

        {/* Crystal Shimmering Alpine Lake in the Western Mountain Valley */}
        <AlpineLake />

        {/* Living World Nature: Procedural Highland Pines, Valley Trees & Meadow Shrubs */}
        <IslandVegetation />

        {/* Central High-Voltage Substation */}
        <SubstationNode position={[0, 0, 0]} showLabels={showInfrastructure} />

        {/* Living World: 3D Ribbon Roads & Active Utility/Transport Traffic */}
        {showTraffic && (
          <>
            <IslandRoads />
            <TrafficVehicles />
          </>
        )}

        {/* Living World: Clouds */}
        {showClouds && <AtmosphericClouds />}

        {/* Living World: Wildlife Birds */}
        {showWildlife && <BirdFlock />}

        {/* Power Grid Lines from Central Substation to key sites (Toggled via Settings) */}
        {showInfrastructure &&
          worldSites.slice(0, 10).map((site) => (
            <PowerLine
              key={`line_${site.id}`}
              from={[0, 0, 0]}
              to={[site.center_x, 0, site.center_z]}
            />
          ))}

        {/* 24 Sites Markers with Concession Boundaries & Surveyor Pylons */}
        {worldSites.map((site) => (
          <SiteMarker
            key={site.id}
            site={site}
            isOwned={ownedSiteIds.has(site.id)}
            isLeased={leasedSiteIds.has(site.id)}
            onSelect={onSelectSite}
          />
        ))}

        {/* Installed Player Assets */}
        {installedAssets.map((asset, idx) => {
          const cSite = companySites.find((cs) => cs.id === asset.company_site_id);
          const worldSite = worldSites.find((ws) => ws.id === cSite?.site_id);

          const rawX = Number(asset.position_x || 0);
          const rawZ = Number(asset.position_z || 0);
          const slot = TURBINE_SLOTS[idx % TURBINE_SLOTS.length];
          const offsetDistX = rawX !== 0 ? rawX : slot.x;
          const offsetDistZ = rawZ !== 0 ? rawZ : slot.z;

          const posX = (worldSite?.center_x || 0) + offsetDistX;
          const posZ = (worldSite?.center_z || 0) + offsetDistZ;
          const posY = getTerrainHeight(posX, posZ);

          if (asset.equipment_catalog?.equipment_type === 'wind_turbine') {
            return (
              <WindTurbine
                key={asset.id}
                position={[posX, posY, posZ]}
                rotationY={Number(asset.rotation_y || (idx * 45))}
                windSpeed={9.0}
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

        {/* Orbit Camera Controls with Extreme Zoom-In & Ground Angle */}
        <OrbitControls
          ref={controlsRef}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={2.0}
          maxDistance={1500}
          enablePan={true}
          panSpeed={0.8}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}
