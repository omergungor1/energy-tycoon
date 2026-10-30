'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight } from './WorldCanvas';

/**
 * Procedural River Ribbon Generator
 * Creates realistic curved water ribbons that naturally hug island topography.
 */
function createRiverRibbon(points, width = 8.0) {
  const curve = new THREE.CatmullRomCurve3(points, false);
  const sampleCount = Math.max(30, points.length * 15);
  const curvePoints = curve.getPoints(sampleCount);

  const waterVertices = [];
  const waterUVs = [];
  const waterIndices = [];

  const bankVertices = [];
  const bankIndices = [];

  const halfW = width * 0.5;

  for (let i = 0; i < curvePoints.length; i++) {
    const curr = curvePoints[i];
    const u = i / (curvePoints.length - 1);

    const tangent = curve.getTangentAt(u).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // River centerline and edge coordinates
    const leftPt = curr.clone().addScaledVector(normal, halfW);
    const rightPt = curr.clone().addScaledVector(normal, -halfW);

    const outerLeft = curr.clone().addScaledVector(normal, halfW + 2.5);
    const outerRight = curr.clone().addScaledVector(normal, -(halfW + 2.5));

    // Sample terrain elevation
    const yCenter = getTerrainHeight(curr.x, curr.z);
    const yLeft = getTerrainHeight(leftPt.x, leftPt.z);
    const yRight = getTerrainHeight(rightPt.x, rightPt.z);
    const waterY = Math.min(yCenter, (yLeft + yRight) * 0.5) + 0.15;

    // 1. Water Surface (Quad strip)
    waterVertices.push(leftPt.x, waterY, leftPt.z);
    waterVertices.push(rightPt.x, waterY, rightPt.z);
    waterUVs.push(0, u * 8);
    waterUVs.push(1, u * 8);

    // 2. Natural Riverbank Embankments (Sand/Pebble/Stone)
    bankVertices.push(outerLeft.x, yLeft + 0.35, outerLeft.z);
    bankVertices.push(leftPt.x, waterY - 0.1, leftPt.z);
    bankVertices.push(rightPt.x, waterY - 0.1, rightPt.z);
    bankVertices.push(outerRight.x, yRight + 0.35, outerRight.z);

    if (i < curvePoints.length - 1) {
      const bIdx = i * 2;
      waterIndices.push(bIdx, bIdx + 1, bIdx + 2);
      waterIndices.push(bIdx + 1, bIdx + 3, bIdx + 2);

      const sIdx = i * 4;
      // Left bank quad
      bankIndices.push(sIdx, sIdx + 1, sIdx + 4);
      bankIndices.push(sIdx + 1, sIdx + 5, sIdx + 4);
      // Right bank quad
      bankIndices.push(sIdx + 2, sIdx + 3, sIdx + 6);
      bankIndices.push(sIdx + 3, sIdx + 7, sIdx + 6);
    }
  }

  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterVertices, 3));
  waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(waterUVs, 2));
  waterGeo.setIndex(waterIndices);
  waterGeo.computeVertexNormals();

  const bankGeo = new THREE.BufferGeometry();
  bankGeo.setAttribute('position', new THREE.Float32BufferAttribute(bankVertices, 3));
  bankGeo.setIndex(bankIndices);
  bankGeo.computeVertexNormals();

  return { waterGeo, bankGeo, curve };
}

export default function WaterFeatures({ isNight = false, season = 'summer' }) {
  const riverMatRef = useRef();
  const waterfallMatRef = useRef();
  const lakeRef = useRef();
  const mistGroupRef = useRef();

  // Natural River Paths across the island
  const rivers = useMemo(() => {
    // 1. Alpine Mountain River: From Western Waterfalls down into the Alpine Lake
    const alpineStreamPoints = [
      new THREE.Vector3(-245, 0, -42),
      new THREE.Vector3(-220, 0, -43),
      new THREE.Vector3(-195, 0, -41),
      new THREE.Vector3(-175, 0, -40),
      new THREE.Vector3(-150, 0, -40)
    ];

    // 2. Grand Valley River: Flowing from Alpine Lake South-East toward the ocean estuary
    const valleyRiverPoints = [
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
    ];

    // 3. East Steppe Creek: Meandering through the solar plains into a scenic pond
    const eastCreekPoints = [
      new THREE.Vector3(180, 0, -90),
      new THREE.Vector3(240, 0, -40),
      new THREE.Vector3(320, 0, 25),
      new THREE.Vector3(410, 0, 110),
      new THREE.Vector3(490, 0, 190),
      new THREE.Vector3(580, 0, 250)
    ];

    return [
      createRiverRibbon(alpineStreamPoints, 5.0),
      createRiverRibbon(valleyRiverPoints, 10.5),
      createRiverRibbon(eastCreekPoints, 6.5)
    ];
  }, []);

  // Water Colors adapting to Season
  const waterColor = useMemo(() => {
    if (season === 'winter') return '#1e40af'; // Deep frosty winter blue
    if (season === 'autumn') return '#0284c7'; // Rich clear autumn azure
    if (season === 'spring') return '#06b6d4'; // Vibrant spring cyan-turquoise
    return '#0284c7'; // Summer crystalline blue
  }, [season]);

  // Waterfall Cascade Geometry (3-stage tiered drop down western granite cliffs)
  const waterfallTiers = useMemo(() => {
    return [
      { from: [-270, 54, -42], to: [-260, 38, -42], width: 7.2 },
      { from: [-260, 38, -42], to: [-252, 24, -42], width: 8.5 },
      { from: [-252, 24, -42], to: [-245, 14.5, -42], width: 9.6 }
    ];
  }, []);

  // Animate water flow UVs, waterfall foam shimmering, and rising mist particles
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (riverMatRef.current?.map) {
      riverMatRef.current.map.offset.y = -t * 0.18;
    }
    if (waterfallMatRef.current) {
      waterfallMatRef.current.opacity = 0.82 + Math.sin(t * 12) * 0.08;
    }
    if (mistGroupRef.current) {
      mistGroupRef.current.rotation.y = t * 0.2;
      const s = 1.0 + Math.sin(t * 3) * 0.12;
      mistGroupRef.current.scale.set(s, s * 1.1, s);
    }
  });

  return (
    <group>
      {/* 1. Rivers & Riverbanks */}
      {rivers.map((r, idx) => (
        <group key={`river_${idx}`}>
          {/* Riverbank Pebble & Grass Embankment */}
          <mesh geometry={r.bankGeo} receiveShadow>
            <meshStandardMaterial
              color={season === 'winter' ? '#cbd5e1' : '#475569'}
              roughness={0.92}
              metalness={0.08}
            />
          </mesh>

          {/* Shimmering Animated River Water Surface */}
          <mesh geometry={r.waterGeo} receiveShadow>
            <meshStandardMaterial
              ref={idx === 0 ? riverMatRef : null}
              color={waterColor}
              roughness={0.06}
              metalness={0.35}
              transparent
              opacity={0.88}
              polygonOffset
              polygonOffsetFactor={-3}
              polygonOffsetUnits={-3}
            />
          </mesh>
        </group>
      ))}

      {/* 2. Scenic Mountain Waterfalls (Western Granite Cliffs) */}
      <group position={[0, 0, 0]}>
        {waterfallTiers.map((tier, i) => {
          const dy = tier.from[1] - tier.to[1];
          const dz = tier.from[2] - tier.to[2];
          const dx = tier.from[0] - tier.to[0];
          const len = Math.hypot(dx, dy, dz);
          const midX = (tier.from[0] + tier.to[0]) * 0.5;
          const midY = (tier.from[1] + tier.to[1]) * 0.5;
          const midZ = (tier.from[2] + tier.to[2]) * 0.5;
          const pitch = Math.atan2(dx, dy);

          return (
            <group key={`waterfall_tier_${i}`} position={[midX, midY, midZ]}>
              {/* Torrential Water Sheet */}
              <mesh rotation={[0, 0, -pitch]}>
                <planeGeometry args={[tier.width, len, 6, 12]} />
                <meshStandardMaterial
                  ref={i === 0 ? waterfallMatRef : null}
                  color="#e0f2fe"
                  emissive="#38bdf8"
                  emissiveIntensity={0.25}
                  roughness={0.08}
                  metalness={0.1}
                  transparent
                  opacity={0.88}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* White Frothing Foam Ribs */}
              <mesh rotation={[0, 0, -pitch]} position={[0, 0, 0.08]}>
                <planeGeometry args={[tier.width * 0.9, len * 0.96, 4, 8]} />
                <meshBasicMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.72}
                  wireframe
                />
              </mesh>

              {/* Granite Splash Boulders at Tier Base */}
              {[-tier.width * 0.4, 0, tier.width * 0.4].map((bx, bi) => (
                <mesh
                  key={bi}
                  position={[bx, -len * 0.45, 0.4]}
                  rotation={[bi * 0.8, bi * 0.4, 0]}
                  castShadow
                  receiveShadow
                >
                  <dodecahedronGeometry args={[0.9 + bi * 0.25, 0]} />
                  <meshStandardMaterial color="#334155" roughness={0.9} />
                </mesh>
              ))}
            </group>
          );
        })}

        {/* Dynamic Foam Mist & Splash Pool at the Base of the Waterfall */}
        <group ref={mistGroupRef} position={[-245, 14.8, -42]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[7.5, 24]} />
            <meshStandardMaterial
              color="#e0f2fe"
              emissive="#7dd3fc"
              emissiveIntensity={0.3}
              transparent
              opacity={0.75}
            />
          </mesh>
          {/* Billowing Mist Particles */}
          {[0, 1.2, 2.4, 3.6].map((rot, mi) => (
            <mesh key={mi} position={[Math.cos(rot) * 2.2, 0.8 + mi * 0.3, Math.sin(rot) * 2.2]}>
              <sphereGeometry args={[1.6 + mi * 0.2, 8, 8]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.28}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* 3. Highland Emerald Reservoir Lake (High Mountain Valley) */}
      <group position={[-380, 36.5, -340]}>
        {/* Reservoir Water Body */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[42, 36]} />
          <meshStandardMaterial
            color="#0d9488"
            roughness={0.08}
            metalness={0.4}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Curved Hydroelectric Spillway Dam Wall */}
        <group position={[0, -2.5, 38]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[44, 46, 7.5, 32, 1, false, Math.PI * 0.75, Math.PI * 0.5]} />
            <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.2} />
          </mesh>
          {/* Spillway Road Crest */}
          <mesh position={[0, 4.0, 0]}>
            <cylinderGeometry args={[45.2, 45.2, 0.6, 32, 1, false, Math.PI * 0.75, Math.PI * 0.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          {/* Dam Control Tower & Warning Lights */}
          <mesh position={[0, 6.2, 0]} castShadow>
            <boxGeometry args={[4.2, 3.8, 3.5]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
          </mesh>
          <mesh position={[0, 8.4, 0]}>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshBasicMaterial color={isNight ? '#ef4444' : '#64748b'} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

