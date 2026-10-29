'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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

// Procedural Harmonic Noise for Island Topography
function getRawTerrainHeight(x, z) {
  const falloff = getIslandFalloff(x, z);

  // Western mountain influence (dominates west of x = -50)
  const westDist = Math.max(0, -x - 50);
  const mtnWeight = Math.min(1, westDist / 340);

  // Multi-harmonic ridged mountain noise (sharp ridges & peaks)
  const r1 = Math.abs(Math.sin(x * 0.0075 + z * 0.0055));
  const r2 = Math.abs(Math.cos(x * 0.015 - z * 0.012));
  const r3 = Math.sin(x * 0.03 + z * 0.025) * 0.5 + 0.5;
  const ridge = Math.pow(r1 * 0.6 + r2 * 0.3 + r3 * 0.1, 1.6);

  // Mountain elevation up to 78m at far west ridges
  const mountainMass = mtnWeight * (18.0 + (westDist / 320) * 18.0 + ridge * 36.0);

  // Central rolling hills
  const hills =
    Math.sin(x * 0.012) * Math.cos(z * 0.012) * 5.5 +
    Math.sin(x * 0.024 + 0.8) * Math.cos(z * 0.02 + 0.4) * 2.8;

  // Eastern solar steppe & gentle dunes
  const eastDist = Math.max(0, x - 120);
  const eastWeight = Math.min(1, eastDist / 300);
  const dunes = eastWeight * (Math.sin(x * 0.018 - z * 0.01) * 2.2 + Math.cos(z * 0.015) * 1.6);

  // Lake depression near SW (Osprey Shoreline area: x ~ -220, z ~ 240)
  const distLake = Math.hypot(x - (-220), z - 240);
  const lakeDepth = distLake < 130 ? (1.0 - distLake / 130) * 6.5 : 0;

  const baseElevation = 6.0;
  const rawLandH = baseElevation + mountainMass + (1 - mtnWeight * 0.6) * hills + dunes - lakeDepth;

  // Modulate land elevation with island mask; exterior becomes ocean floor (-10m)
  const seaFloorH = -10.0;
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
    const geo = new THREE.PlaneGeometry(2800, 2800, 160, 160);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      // Biome blending based on height (y) and coordinates (x, z)
      let r = 0.2,
        g = 0.44,
        b = 0.2; // Default lush green

      if (y < 0.2) {
        // Deep seabed / Shallow coral coast
        r = 0.06;
        g = 0.28;
        b = 0.45;
      } else if (y < 3.2) {
        // Warm golden beach coastline
        const t = (y - 0.2) / 3.0;
        r = 0.82 - t * 0.4;
        g = 0.72 - t * 0.22;
        b = 0.42 - t * 0.18;
      } else if (x > 120 && z > 80) {
        // Desert / Sunfire Solar Steppe (SE quadrant)
        if (x > 500 && z > 200) {
          // Radiant white/cream saltbed flats
          r = 0.82;
          g = 0.78;
          b = 0.68;
        } else if (x > 260) {
          // Golden sunbaked sand dunes
          r = 0.76;
          g = 0.58;
          b = 0.28;
        } else {
          // Arid clay steppe
          r = 0.54;
          g = 0.46;
          b = 0.26;
        }
      } else if (x < -60) {
        // Mountain & Highland Wind Zone (Western Ridge)
        if (y > 70) {
          // Alpine Snow & Summit Glaciers
          const t = Math.min(1, (y - 70) / 10);
          r = 0.88 + t * 0.08;
          g = 0.92 + t * 0.06;
          b = 0.96 + t * 0.04;
        } else if (y > 48) {
          // Cold Slate & Granite Rock with smooth frost dusting
          const t = (y - 48) / 22;
          r = 0.38 + t * 0.45;
          g = 0.42 + t * 0.45;
          b = 0.48 + t * 0.45;
        } else if (y > 22) {
          // Mountain Pine Slopes
          const t = (y - 22) / 26;
          r = 0.14 + t * 0.2;
          g = 0.28 + t * 0.12;
          b = 0.16 + t * 0.25;
        } else {
          // Highland Foothills
          r = 0.18;
          g = 0.38;
          b = 0.22;
        }
      } else {
        // Central Hybrid Valleys & River Plain
        if (y < 4.5) {
          // Low riverbed / alluvial plain
          r = 0.16;
          g = 0.38;
          b = 0.25;
        } else {
          // Vibrant rolling grassland
          r = 0.22;
          g = 0.46;
          b = 0.22;
        }
      }

      // Natural organic noise variation
      const noise = Math.sin(x * 0.06) * Math.cos(z * 0.06) * 0.02;
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

      {/* Shimmering Azure Mountain Lake near Osprey Shoreline */}
      <mesh position={[-220, 3.2, 240]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[82, 48]} />
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.12}
          metalness={0.4}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

// Expansive Animated Ocean with Gentle Wave Swell
function AnimatedOcean() {
  const meshRef = useRef();

  const oceanGeo = useMemo(() => {
    // 4400x4400 expansive ocean extending to the horizon
    const geo = new THREE.PlaneGeometry(4400, 4400, 48, 48);
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
      // Gentle ocean rolling wave swell
      const wave =
        Math.sin(x * 0.012 + t * 0.9) * Math.cos(z * 0.012 + t * 0.7) * 0.45 +
        Math.sin(x * 0.025 - t * 1.3) * 0.2;
      pos.setY(i, wave + 0.6);
    }
    pos.needsUpdate = true;
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={oceanGeo}>
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.12}
          metalness={0.35}
          transparent
          opacity={0.82}
          flatShading
        />
      </mesh>

      {/* Coastal Surf Foam Ring around Island Periphery */}
      <mesh position={[0, 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1040, 1260, 64]} />
        <meshBasicMaterial
          color="#e0f2fe"
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Island Road Network connecting Central Substation to Regional Hubs
function IslandRoads() {
  const roadMeshes = useMemo(() => {
    const paths = [
      // 1. Mountain Ridge Road (North-West)
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-180, 0, -80),
        new THREE.Vector3(-400, 0, -150),
        new THREE.Vector3(-450, 0, -320),
        new THREE.Vector3(-580, 0, -420)
      ],
      // 2. Solar Steppe Highway (East & South-East)
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(120, 0, 100),
        new THREE.Vector3(240, 0, 220),
        new THREE.Vector3(380, 0, 280),
        new THREE.Vector3(490, 0, 350),
        new THREE.Vector3(620, 0, 190)
      ],
      // 3. Shoreline Scenic Byway (South-West to Lake)
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-60, 0, 50),
        new THREE.Vector3(-120, 0, 80),
        new THREE.Vector3(-220, 0, 240)
      ]
    ];

    return paths.map((pts) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const sampled = curve.getPoints(80);
      const roadPoints = sampled.map((p) => {
        const y = getTerrainHeight(p.x, p.z) + 0.15;
        return new THREE.Vector3(p.x, y, p.z);
      });
      const geo = new THREE.BufferGeometry().setFromPoints(roadPoints);
      const mat = new THREE.LineBasicMaterial({
        color: '#475569',
        linewidth: 3,
        transparent: true,
        opacity: 0.8
      });
      return new THREE.Line(geo, mat);
    });
  }, []);

  return (
    <group>
      {roadMeshes.map((road, idx) => (
        <primitive key={idx} object={road} />
      ))}
    </group>
  );
}

// Animated Utility Maintenance Service Trucks moving along roads
function ServiceTrucks() {
  const truck1Ref = useRef();
  const truck2Ref = useRef();

  const curve1 = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-180, 0, -80),
      new THREE.Vector3(-400, 0, -150),
      new THREE.Vector3(-450, 0, -320),
      new THREE.Vector3(-580, 0, -420)
    ]);
  }, []);

  const curve2 = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(120, 0, 100),
      new THREE.Vector3(240, 0, 220),
      new THREE.Vector3(380, 0, 280),
      new THREE.Vector3(490, 0, 350)
    ]);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.04;

    // Truck 1: Mountain maintenance truck
    if (truck1Ref.current) {
      const progress1 = (Math.sin(t) + 1) * 0.5; // Ping-pong along route
      const p1 = curve1.getPointAt(progress1);
      const p1Next = curve1.getPointAt(Math.min(1, progress1 + 0.02));
      const y1 = getTerrainHeight(p1.x, p1.z) + 0.4;
      truck1Ref.current.position.set(p1.x, y1, p1.z);
      truck1Ref.current.lookAt(p1Next.x, y1, p1Next.z);
    }

    // Truck 2: Solar service truck
    if (truck2Ref.current) {
      const progress2 = (Math.cos(t * 1.2) + 1) * 0.5;
      const p2 = curve2.getPointAt(progress2);
      const p2Next = curve2.getPointAt(Math.min(1, progress2 + 0.02));
      const y2 = getTerrainHeight(p2.x, p2.z) + 0.4;
      truck2Ref.current.position.set(p2.x, y2, p2.z);
      truck2Ref.current.lookAt(p2Next.x, y2, p2Next.z);
    }
  });

  return (
    <group>
      {/* Mountain Utility Van */}
      <group ref={truck1Ref}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[2.4, 1.8, 4.8]} />
          <meshStandardMaterial color="#0284c7" metalness={0.4} />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* Solar Utility Truck */}
      <group ref={truck2Ref}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[2.5, 1.8, 5.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.3} />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>
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

// Main 3D World Canvas
export default function WorldCanvas({
  worldSites = [],
  companySites = [],
  installedAssets = [],
  clock,
  settings = {},
  onSelectSite
}) {
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
        camera={{ position: [-180, 280, 420], fov: 46, far: 5000 }}
        shadows={!isLowGraphics}
        dpr={dpr}
        className="w-full h-full"
      >
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

        {/* Central High-Voltage Substation */}
        <SubstationNode position={[0, 0, 0]} showLabels={showInfrastructure} />

        {/* Living World: Roads & Vehicles */}
        {showTraffic && (
          <>
            <IslandRoads />
            <ServiceTrucks />
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

        {/* Orbit Camera Controls */}
        <OrbitControls
          maxPolarAngle={Math.PI / 2.15}
          minDistance={35}
          maxDistance={1400}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}
