'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight } from './WorldCanvas';

/**
 * Procedural Seaside Campgrounds & Coastal Caravans
 * Authentic coastal campsites with retro campervans, aerodynamic caravans,
 * motorhomes, 4x4 overland roof tents, dome tents, flickering campfires,
 * picnic tables, surfboards, deck chairs, and warm night festoon fairy lights.
 *
 * 4 Scenic Beachside Campgrounds:
 * 1. Sunset Dunes Beach Camp (North Cape by the Inlet - [372, y, -835])
 * 2. South Sunshine Sands RV Beach (Golden South Shore - [75, y, 1030])
 * 3. Pine Cove Coastal Haven (Southwest Pine & Surf Beach - [-115, y, 1020])
 * 4. East Coast Dunes Caravan Park (East Sunrise Beach - [915, y, -590])
 */

// =============================================================================
// REUSABLE PROPS & VEHICLES FOR SEASIDE CAMPGROUNDS
// =============================================================================

// Animated Stone Ring Campfire with Flickering Embers & Night Glow
function Campfire({ position = [0, 0, 0], isNight = false }) {
  const flameRef = useRef();
  const lightRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (flameRef.current) {
      // Natural flame flicker wobble & pulsation
      const flicker = 1.0 + Math.sin(t * 9.5) * 0.12 + Math.cos(t * 14.2) * 0.08;
      flameRef.current.scale.set(flicker, 1.0 + Math.sin(t * 11.0) * 0.18, flicker);
    }
    if (lightRef.current && isNight) {
      lightRef.current.intensity = 1.4 + Math.sin(t * 12.0) * 0.35 + Math.cos(t * 7.0) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Circle of 8 River Cobblestones */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const rad = (i / 8) * Math.PI * 2;
        const rx = Math.cos(rad) * 0.75;
        const rz = Math.sin(rad) * 0.75;
        return (
          <mesh key={`stone_${i}`} position={[rx, 0.15, rz]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.95} />
          </mesh>
        );
      })}

      {/* Cross Driftwood Logs */}
      <mesh position={[0, 0.16, 0]} rotation={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 1.1, 6]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 1.0, 6]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>

      {/* Glowing Hot Ember Bed */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.15, 8]} />
        <meshBasicMaterial color="#ea580c" />
      </mesh>

      {/* Animated Low-Poly Campfire Flame */}
      <mesh ref={flameRef} position={[0, 0.52, 0]}>
        <coneGeometry args={[0.32, 0.75, 5]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>

      {/* Warm Night Ambient Campfire Light */}
      {isNight && (
        <pointLight
          ref={lightRef}
          position={[0, 0.65, 0]}
          color="#f97316"
          intensity={1.5}
          distance={18}
          decay={2}
        />
      )}
    </group>
  );
}

// Retro Two-Tone Camper Van (VW T2/T3 Style) with Pop-Up Roof Tent & Sun Awning
function RetroCamperVan({ position = [0, 0, 0], rotation = [0, 0, 0], bodyColor = '#0d9488', popUp = true, hasAwning = true }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Lower Main Van Body */}
      <mesh position={[0, 0.85, 0]} receiveShadow>
        <boxGeometry args={[2.0, 1.0, 4.6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} />
      </mesh>

      {/* Cream Upper Body / Cab Roof */}
      <mesh position={[0, 1.55, 0]} receiveShadow>
        <boxGeometry args={[1.96, 0.65, 4.5]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </mesh>

      {/* Split-Screen Windshield & Side Windows */}
      <mesh position={[0, 1.58, 2.27]}>
        <planeGeometry args={[1.75, 0.52]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.7} />
      </mesh>
      {/* Side Tinted Camping Windows */}
      <mesh position={[0.99, 1.58, 0]}>
        <planeGeometry args={[3.2, 0.45]} />
        <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[-0.99, 1.58, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.2, 0.45]} />
        <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Front Chrome Bumper & Round Headlights */}
      <mesh position={[0, 0.48, 2.34]}>
        <boxGeometry args={[1.95, 0.22, 0.15]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
      </mesh>
      {[-0.65, 0.65].map((lx, li) => (
        <mesh key={`headlight_${li}`} position={[lx, 0.85, 2.32]}>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      ))}

      {/* Front Mounted Spare Tire with Vinyl Cover */}
      <mesh position={[0, 0.95, 2.38]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.18, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>

      {/* Pop-Up Roof Tent (Angular canvas wedge popped open) */}
      {popUp && (
        <group position={[0, 1.9, -0.2]}>
          {/* Tilted Roof Fiberglass Lid */}
          <mesh position={[0, 0.72, 0]} rotation={[0.26, 0, 0]}>
            <boxGeometry args={[1.85, 0.12, 3.2]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
          {/* Orange Canvas Tent Side Walls */}
          <mesh position={[0, 0.35, -0.1]} rotation={[0.13, 0, 0]}>
            <boxGeometry args={[1.75, 0.65, 2.9]} />
            <meshStandardMaterial color="#ea580c" roughness={0.8} />
          </mesh>
          {/* Small Canvas Mesh Vent */}
          <mesh position={[0, 0.45, 1.36]} rotation={[0.26, 0, 0]}>
            <planeGeometry args={[0.9, 0.4]} />
            <meshBasicMaterial color="#0f172a" transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {/* Extended Fabric Side Awning on Aluminum Telescopic Poles */}
      {hasAwning && (
        <group position={[1.0, 1.85, 0]}>
          {/* Striped Sun Canopy Roof */}
          <mesh position={[1.4, -0.15, 0]} rotation={[0, 0, -0.12]}>
            <boxGeometry args={[2.8, 0.04, 3.8]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.7} />
          </mesh>
          {/* Two Aluminum Support Poles down to the sand */}
          {[1.8, -1.8].map((pz, pi) => (
            <mesh key={`pole_${pi}`} position={[2.75, -0.9, pz]}>
              <cylinderGeometry args={[0.03, 0.03, 1.8, 6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          ))}
        </group>
      )}

      {/* Two Beach Surfboards Leaning against Rear Van Corner */}
      <group position={[-1.15, 0.8, -1.8]} rotation={[0.18, 0.35, -0.15]}>
        {/* Pink/Coral Surfboard */}
        <mesh>
          <boxGeometry args={[0.42, 2.1, 0.06]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.3} />
        </mesh>
        {/* Yellow Stripe */}
        <mesh position={[0, 0, 0.032]}>
          <boxGeometry args={[0.12, 1.9, 0.01]} />
          <meshBasicMaterial color="#fde047" />
        </mesh>
      </group>
      <group position={[-1.12, 0.75, -1.4]} rotation={[0.15, 0.25, -0.18]}>
        {/* Aqua Surfboard */}
        <mesh>
          <boxGeometry args={[0.38, 1.9, 0.06]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.3} />
        </mesh>
      </group>

      {/* 4 Rubber Tires with Chrome Hubcaps */}
      {[
        [-0.95, 0.36, 1.4],
        [0.95, 0.36, 1.4],
        [-0.95, 0.36, -1.4],
        [0.95, 0.36, -1.4]
      ].map(([wx, wy, wz], wi) => (
        <group key={`van_wheel_${wi}`} position={[wx, wy, wz]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.36, 0.36, 0.24, 12]} />
            <meshStandardMaterial color="#18181b" roughness={0.9} />
          </mesh>
          <mesh position={[wx > 0 ? 0.13 : -0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 10]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Aerodynamic Streamline Aluminum Caravan Trailer (Airstream / Silver Bullet Style)
function SilverAirstreamCaravan({ position = [0, 0, 0], rotation = [0, 0, 0], hasAwning = true }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Polished Silver Aluminum Shell with Rounded Shoulders */}
      <mesh position={[0, 1.4, 0]} receiveShadow>
        <boxGeometry args={[2.3, 1.7, 5.8]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.22} />
      </mesh>

      {/* Curved Front & Rear Rounded End Caps */}
      <mesh position={[0, 1.4, 2.9]}>
        <cylinderGeometry args={[1.15, 1.15, 1.7, 12, 1, false, 0, Math.PI]} rotation={[0, 0, 0]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0, 1.4, -2.9]}>
        <cylinderGeometry args={[1.15, 1.15, 1.7, 12, 1, false, Math.PI, Math.PI]} rotation={[0, 0, 0]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.22} />
      </mesh>

      {/* Blue Nautical Midline Stripe */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[2.32, 0.12, 5.82]} />
        <meshStandardMaterial color="#0284c7" roughness={0.4} />
      </mesh>

      {/* Panoramic Tinted Acrylic Front Window */}
      <mesh position={[0, 1.48, 3.42]}>
        <planeGeometry args={[1.6, 0.65]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Side Windows */}
      <mesh position={[1.16, 1.5, 0.8]}>
        <planeGeometry args={[1.5, 0.55]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[1.16, 1.5, -1.2]}>
        <planeGeometry args={[1.2, 0.55]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Rooftop Air Conditioner Dome & Chimney Vent */}
      <mesh position={[0, 2.36, -0.4]}>
        <boxGeometry args={[0.8, 0.22, 1.1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.4, 1.2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.35, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>

      {/* A-Frame Tow Hitch Tongue with Dual Propane Bottles & Jockey Wheel */}
      <group position={[0, 0.45, 3.6]}>
        {/* Steel Drawbar */}
        <mesh position={[0, 0, 0.6]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.12, 1.4]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        {/* Twin Silver Propane Gas Tanks */}
        {[-0.22, 0.22].map((tx, ti) => (
          <mesh key={`tank_${ti}`} position={[tx, 0.35, 0.3]}>
            <cylinderGeometry args={[0.16, 0.16, 0.55, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
          </mesh>
        ))}
        {/* Jockey Stand Wheel */}
        <mesh position={[0, -0.22, 1.1]}>
          <cylinderGeometry args={[0.08, 0.08, 0.35, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Dual Axle Chrome Wheels */}
      {[-0.4, 0.4].map((wz, wi) => (
        <group key={`airstream_w_${wi}`}>
          <mesh position={[-1.12, 0.4, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.22, 12]} />
            <meshStandardMaterial color="#18181b" roughness={0.9} />
          </mesh>
          <mesh position={[1.12, 0.4, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.22, 12]} />
            <meshStandardMaterial color="#18181b" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Extended Retractable Fabric Awning */}
      {hasAwning && (
        <group position={[1.16, 2.1, 0]}>
          <mesh position={[1.5, -0.25, 0]} rotation={[0, 0, -0.15]}>
            <boxGeometry args={[3.0, 0.04, 4.4]} />
            <meshStandardMaterial color="#0284c7" roughness={0.7} />
          </mesh>
          {/* White Accent Stripes */}
          {[-1.5, 0, 1.5].map((sz, si) => (
            <mesh key={`awn_s_${si}`} position={[1.5, -0.23, sz]} rotation={[0, 0, -0.15]}>
              <boxGeometry args={[3.02, 0.045, 0.25]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
          ))}
          {/* Aluminum Awning Stems */}
          {[2.1, -2.1].map((pz, pi) => (
            <mesh key={`astem_${pi}`} position={[2.9, -1.0, pz]}>
              <cylinderGeometry args={[0.035, 0.035, 2.0, 6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// Modern Class-C Motorhome with Over-Cab Sleeper & Rear Bike Rack
function ModernClassCMotorhome({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Driver Cab */}
      <mesh position={[0, 1.0, 2.4]}>
        <boxGeometry args={[2.3, 1.3, 1.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </mesh>
      {/* Cab Windshield */}
      <mesh position={[0, 1.25, 3.32]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[1.9, 0.7]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.7} />
      </mesh>

      {/* Over-Cab Sleeper Alcove (Signature Class-C Feature) */}
      <mesh position={[0, 2.4, 2.0]}>
        <boxGeometry args={[2.42, 1.0, 2.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </mesh>

      {/* Main Living Coach Body */}
      <mesh position={[0, 1.7, -0.6]} receiveShadow>
        <boxGeometry args={[2.45, 2.2, 4.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} />
      </mesh>

      {/* Burgundy & Charcoal Accent Dynamic Graphics */}
      <mesh position={[0, 1.4, -0.6]}>
        <boxGeometry args={[2.47, 0.25, 4.82]} />
        <meshStandardMaterial color="#881337" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.8, -0.6]}>
        <boxGeometry args={[2.47, 0.15, 3.6]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Rooftop Solar Panels & AC Unit */}
      <mesh position={[0, 2.88, -0.8]}>
        <boxGeometry args={[1.8, 0.05, 1.4]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 2.95, 0.6]}>
        <boxGeometry args={[0.9, 0.22, 1.0]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>

      {/* Rear Bike Rack with 2 Mountain Bikes */}
      <group position={[0, 1.2, -3.1]}>
        {/* Steel Carrier Frame */}
        <mesh>
          <boxGeometry args={[1.8, 0.08, 0.35]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Mountain Bike 1 (Red frame) */}
        <group position={[0, 0.35, 0.1]}>
          <mesh position={[-0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.26, 0.26, 0.06, 10]} />
            <meshStandardMaterial color="#18181b" />
          </mesh>
          <mesh position={[0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.26, 0.26, 0.06, 10]} />
            <meshStandardMaterial color="#18181b" />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.8, 0.3, 0.04]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>
      </group>

      {/* Heavy Chassis Wheels */}
      {[
        [-1.05, 0.4, 2.3],
        [1.05, 0.4, 2.3],
        [-1.05, 0.4, -1.5],
        [1.05, 0.4, -1.5]
      ].map(([wx, wy, wz], wi) => (
        <mesh key={`rv_w_${wi}`} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.28, 12]} />
          <meshStandardMaterial color="#18181b" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// Rugged 4x4 Overland Expedition Camper Truck with Deployed Rooftop Tent
function Overland4x4Camper({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Matte Olive Heavy Duty Pickup Body */}
      <mesh position={[0, 1.1, 0]} receiveShadow>
        <boxGeometry args={[2.2, 1.1, 4.8]} />
        <meshStandardMaterial color="#3f6212" roughness={0.7} />
      </mesh>

      {/* Black Mud-Terrain Fender Flares */}
      {[-1.12, 1.12].map((fx, fi) => (
        <group key={`flare_${fi}`} position={[fx, 0.9, 0]}>
          <mesh position={[0, 0, 1.4]}>
            <boxGeometry args={[0.12, 0.35, 1.1]} />
            <meshStandardMaterial color="#18181b" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0, -1.4]}>
            <boxGeometry args={[0.12, 0.35, 1.1]} />
            <meshStandardMaterial color="#18181b" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* Front Bullbar Winch & Off-road Snorkel */}
      <mesh position={[0, 0.65, 2.5]}>
        <boxGeometry args={[2.1, 0.4, 0.25]} />
        <meshStandardMaterial color="#18181b" metalness={0.8} />
      </mesh>
      <mesh position={[1.15, 1.6, 1.2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>

      {/* Rear Overland Bed Canopy Shell */}
      <mesh position={[0, 1.85, -0.9]}>
        <boxGeometry args={[2.15, 0.85, 2.6]} />
        <meshStandardMaterial color="#1c1917" roughness={0.8} />
      </mesh>

      {/* Deployed Roof-Top Fold-Out Canvas Tent (Folded Open with Ladder) */}
      <group position={[0, 2.3, -0.9]}>
        {/* Hard Base Plate */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[2.1, 0.12, 2.4]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* A-Frame Safari Tan Canvas Tent */}
        <mesh position={[0, 0.7, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[1.3, 1.2, 4]} />
          <meshStandardMaterial color="#d97706" roughness={0.85} />
        </mesh>
        {/* Rain Fly Canopy */}
        <mesh position={[0, 1.35, 0]}>
          <boxGeometry args={[2.2, 0.05, 2.5]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} />
        </mesh>
        {/* Aluminum Telescopic Ladder descending to the ground on the right */}
        <mesh position={[1.4, -1.0, 0]} rotation={[0, 0, 0.32]}>
          <boxGeometry args={[0.1, 2.4, 0.45]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
      </group>

      {/* Orange Sand Recovery Traction Boards on Side */}
      <mesh position={[-1.12, 1.8, -0.9]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.3, 0.04, 1.1]} />
        <meshStandardMaterial color="#ea580c" roughness={0.5} />
      </mesh>

      {/* 4 Oversized Knobby Off-Road Tires */}
      {[
        [-1.0, 0.5, 1.4],
        [1.0, 0.5, 1.4],
        [-1.0, 0.5, -1.4],
        [1.0, 0.5, -1.4]
      ].map(([wx, wy, wz], wi) => (
        <mesh key={`mud_w_${wi}`} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.35, 12]} />
          <meshStandardMaterial color="#18181b" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// Compact Geodesic Dome Camping Tent
function DomeCampingTent({ position = [0, 0, 0], color = '#f97316', rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Geodesic Half-Dome Fabric */}
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[1.35, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Ground Sheet Border */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[1.4, 1.4, 0.08, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Tent Entrance Zipper Flap */}
      <mesh position={[0, 0.65, 1.25]} rotation={[0.45, 0, 0]}>
        <planeGeometry args={[0.75, 0.9]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      {/* Rolled Sleeping Mat outside */}
      <mesh position={[-1.2, 0.12, 0.6]} rotation={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.65, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>
    </group>
  );
}

// Beach Parasol (Umbrella) & Sun Lounge Towels
function BeachParasolAndLoungers({ position = [0, 0, 0], umbrellaColor = '#ef4444' }) {
  return (
    <group position={position}>
      {/* Tilted Beach Parasol in the Sand */}
      <group position={[0, 0, 0]} rotation={[0.15, 0.2, 0.1]}>
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 2.6, 6]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        {/* Fabric Canopy Dome */}
        <mesh position={[0, 2.4, 0]}>
          <coneGeometry args={[1.5, 0.65, 8]} />
          <meshStandardMaterial color={umbrellaColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Colorful Striped Beach Towel on Sand */}
      <mesh position={[0.9, 0.03, 0.4]} rotation={[-Math.PI / 2, 0, 0.35]}>
        <planeGeometry args={[1.1, 2.0]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.8} />
      </mesh>

      {/* Blue Hard Cooler Box with White Lid */}
      <group position={[-0.8, 0.22, 0.6]} rotation={[0, 0.25, 0]}>
        <mesh>
          <boxGeometry args={[0.6, 0.4, 0.4]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.62, 0.08, 0.42]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

// Rustic Picnic Table, Mugs & Camp Folding Chairs
function CampDiningArea({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Heavy Timber Picnic Table */}
      <mesh position={[0, 0.72, 0]} receiveShadow>
        <boxGeometry args={[1.1, 0.1, 2.1]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Table Legs */}
      {[-0.42, 0.42].map((lx, li) =>
        [-0.75, 0.75].map((lz, lzi) => (
          <mesh key={`tbl_${li}_${lzi}`} position={[lx, 0.35, lz]}>
            <boxGeometry args={[0.1, 0.7, 0.1]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
        ))
      )}

      {/* Two Attached Bench Planks */}
      {[-0.75, 0.75].map((bx, bi) => (
        <mesh key={`bench_${bi}`} position={[bx, 0.42, 0]}>
          <boxGeometry args={[0.35, 0.08, 2.1]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
      ))}

      {/* Tabletop Items: Coffee Mugs & Acoustic Guitar */}
      <mesh position={[0.2, 0.82, 0.4]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[-0.15, 0.82, -0.3]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 8]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
      {/* Acoustic Guitar resting on table */}
      <group position={[0.1, 0.85, -0.5]} rotation={[0, 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.35, 0.08, 0.65]} />
          <meshStandardMaterial color="#b45309" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.5]}>
          <boxGeometry args={[0.08, 0.04, 0.5]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>

      {/* Fold-Out Canvas Deck Chairs around table */}
      {[
        [-1.35, 0, 0.5, 0.4, '#15803d'],
        [1.35, 0, -0.5, -0.4, '#ea580c']
      ].map(([cx, cy, cz, crot, ccolor], ci) => (
        <group key={`dchair_${ci}`} position={[cx, cy, cz]} rotation={[0, crot, 0]}>
          {/* Chair Frame */}
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.55, 0.55, 0.55]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          {/* Canvas Seat & Back */}
          <mesh position={[0, 0.48, -0.05]} rotation={[-0.25, 0, 0]}>
            <boxGeometry args={[0.5, 0.04, 0.55]} />
            <meshStandardMaterial color={ccolor} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.72, -0.25]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.04]} />
            <meshStandardMaterial color={ccolor} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Low-Poly Camper Character Relaxing
function RelaxingCamperFigure({ position = [0, 0, 0], rotation = [0, 0, 0], shirtColor = '#0284c7' }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Legs Sitting */}
      <mesh position={[0, 0.35, 0.2]}>
        <boxGeometry args={[0.32, 0.15, 0.42]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.36, 0.45, 0.22]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      {/* Head with Summer Straw Hat */}
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.05, 8]} />
        <meshStandardMaterial color="#fef08a" />
      </mesh>
      {/* Mug in Hand */}
      <mesh position={[0.22, 0.65, 0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// Warm Festoon Fairy Light String between Posts (Glows at Night)
function FestoonFairyLights({ start = [0, 2, 0], end = [4, 2, 0], isNight = false }) {
  const bulbs = useMemo(() => {
    const pts = [];
    const count = 5;
    for (let i = 1; i < count; i++) {
      const frac = i / count;
      const x = start[0] + (end[0] - start[0]) * frac;
      const z = start[2] + (end[2] - start[2]) * frac;
      // Catenary sag curve
      const sag = Math.sin(frac * Math.PI) * 0.35;
      const y = start[1] + (end[1] - start[1]) * frac - sag;
      pts.push([x, y, z]);
    }
    return pts;
  }, [start, end]);

  return (
    <group>
      {bulbs.map(([bx, by, bz], bi) => (
        <group key={`bulb_${bi}`} position={[bx, by, bz]}>
          <mesh>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshBasicMaterial color={isNight ? '#fef08a' : '#64748b'} />
          </mesh>
          {isNight && bi === 2 && (
            <pointLight color="#fef08a" intensity={0.65} distance={12} decay={2} />
          )}
        </group>
      ))}
    </group>
  );
}

// =============================================================================
// MAIN COMPONENT: 4 DIVERSE PROCEDURAL SEASIDE CAMPGROUNDS
// =============================================================================
export default function SeasideCampgrounds({ isNight = false }) {
  // Pre-calculate exact terrain heights for all 4 coastal campsites
  const CAMP_1 = { x: 372, z: -835, y: getTerrainHeight(372, -835) }; // North Cape Sunset Beach
  const CAMP_2 = { x: 75, z: 1030, y: getTerrainHeight(75, 1030) };   // South Sunshine Sands
  const CAMP_3 = { x: -115, z: 1020, y: getTerrainHeight(-115, 1020) }; // Southwest Pine Cove
  const CAMP_4 = { x: 915, z: -590, y: getTerrainHeight(915, -590) };  // East Coast Sunrise Dunes

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. SUNSET DUNES RV & CARAVAN BEACH CAMP (NORTH CAPE)      */}
      {/* Overlooking the inlet channel & ocean where ships sail by */}
      {/* ========================================================= */}
      <group position={[CAMP_1.x, CAMP_1.y, CAMP_1.z]} rotation={[0, -0.35, 0]}>
        {/* Retro Turquoise VW Camper Van with Pop-Up Roof Tent & Awning */}
        <RetroCamperVan
          position={[-4.5, 0, 2.5]}
          rotation={[0, 0.45, 0]}
          bodyColor="#0d9488"
          popUp={true}
          hasAwning={true}
        />

        {/* Polished Silver Airstream Caravan Trailer */}
        <SilverAirstreamCaravan
          position={[4.5, 0, -1.0]}
          rotation={[0, -0.65, 0]}
          hasAwning={true}
        />

        {/* Central Campfire on the Beach Sand */}
        <Campfire position={[0, 0, 0.5]} isNight={isNight} />

        {/* Relaxing Campers around the Fire */}
        <RelaxingCamperFigure position={[-1.2, 0, -0.6]} rotation={[0, 0.8, 0]} shirtColor="#0284c7" />
        <RelaxingCamperFigure position={[1.4, 0, 1.2]} rotation={[0, -2.4, 0]} shirtColor="#ea580c" />

        {/* Timber Picnic Table with Mugs & Acoustic Guitar */}
        <CampDiningArea position={[-1.2, 0, 6.2]} rotation={[0, 0.2, 0]} />

        {/* Beach Towels, Parasol & Cooler Box near the Waterline */}
        <BeachParasolAndLoungers position={[6.5, 0, 4.2]} umbrellaColor="#ef4444" />

        {/* Festoon Night Fairy Lights strung between Caravan & Van Awning */}
        <FestoonFairyLights
          start={[-2.2, 2.3, 2.5]}
          end={[2.8, 2.3, 0.2]}
          isNight={isNight}
        />
      </group>

      {/* ========================================================= */}
      {/* 2. SOUTH SUNSHINE SANDS RV BEACH (GOLDEN SOUTH COAST)     */}
      {/* Wide golden sand beach facing the sparkling southern sea */}
      {/* ========================================================= */}
      <group position={[CAMP_2.x, CAMP_2.y, CAMP_2.z]} rotation={[0, 0.15, 0]}>
        {/* Modern Class-C Family Motorhome */}
        <ModernClassCMotorhome
          position={[-5.2, 0, 1.0]}
          rotation={[0, 0.35, 0]}
        />

        {/* Retro Orange Camper Van */}
        <RetroCamperVan
          position={[4.8, 0, -2.2]}
          rotation={[0, -0.55, 0]}
          bodyColor="#ea580c"
          popUp={true}
          hasAwning={true}
        />

        {/* Dome Camping Tent pitched on the beach verge */}
        <DomeCampingTent
          position={[6.8, 0, 3.5]}
          rotation={[0, -0.4, 0]}
          color="#3b82f6"
        />

        {/* Central Beach Driftwood Campfire */}
        <Campfire position={[0, 0, 1.5]} isNight={isNight} />

        {/* Relaxing Camper */}
        <RelaxingCamperFigure position={[-0.8, 0, 2.6]} rotation={[0, -0.2, 0]} shirtColor="#15803d" />

        {/* Beach Sunbed & Parasol on Golden Sand */}
        <BeachParasolAndLoungers position={[-5.5, 0, 6.5]} umbrellaColor="#eab308" />

        {/* Dining Table Area */}
        <CampDiningArea position={[1.2, 0, -4.5]} rotation={[0, 0.45, 0]} />

        {/* Festoon Fairy Lights */}
        <FestoonFairyLights
          start={[-3.2, 2.4, 1.5]}
          end={[2.8, 2.2, -1.5]}
          isNight={isNight}
        />
      </group>

      {/* ========================================================= */}
      {/* 3. PINE COVE COASTAL HAVEN (SOUTHWEST SURF & PINE COVE)   */}
      {/* Where lush mountain pine forests slope down into the sea  */}
      {/* ========================================================= */}
      <group position={[CAMP_3.x, CAMP_3.y, CAMP_3.z]} rotation={[0, 0.85, 0]}>
        {/* Rugged 4x4 Overland Expedition Truck with Rooftop Tent */}
        <Overland4x4Camper
          position={[-3.8, 0, 1.2]}
          rotation={[0, 0.28, 0]}
        />

        {/* Pair of Dome Camping Tents */}
        <DomeCampingTent
          position={[3.8, 0, 1.8]}
          rotation={[0, -0.6, 0]}
          color="#f97316"
        />
        <DomeCampingTent
          position={[5.5, 0, -1.5]}
          rotation={[0, -1.2, 0]}
          color="#10b981"
        />

        {/* Campfire with Sitting Logs */}
        <Campfire position={[0, 0, 0]} isNight={isNight} />

        {/* Camper Figure sitting by fire */}
        <RelaxingCamperFigure position={[1.2, 0, -0.8]} rotation={[0, -2.1, 0]} shirtColor="#f43f5e" />

        {/* Camp Dining Bench with Coffee Pot & Lantern */}
        <CampDiningArea position={[-2.2, 0, -4.2]} rotation={[0, -0.15, 0]} />

        {/* Beach Surfboard & Kayak propped on sand near water */}
        <BeachParasolAndLoungers position={[2.5, 0, 5.2]} umbrellaColor="#06b6d4" />
      </group>

      {/* ========================================================= */}
      {/* 4. EAST COAST DUNES CARAVAN PARK (EAST SUNRISE DUNES)     */}
      {/* High dune coastal overlook with vast horizon sunrise views*/}
      {/* ========================================================= */}
      <group position={[CAMP_4.x, CAMP_4.y, CAMP_4.z]} rotation={[0, -0.65, 0]}>
        {/* Polished Silver Airstream Caravan */}
        <SilverAirstreamCaravan
          position={[-4.2, 0, -0.5]}
          rotation={[0, 0.35, 0]}
          hasAwning={true}
        />

        {/* Modern Class-C Motorhome */}
        <ModernClassCMotorhome
          position={[4.6, 0, 1.5]}
          rotation={[0, -0.45, 0]}
        />

        {/* Cozy Night Campfire */}
        <Campfire position={[0, 0, 2.2]} isNight={isNight} />

        {/* Relaxing Camper */}
        <RelaxingCamperFigure position={[-1.2, 0, 3.2]} rotation={[0, 0.6, 0]} shirtColor="#9333ea" />

        {/* Wooden Dining Area */}
        <CampDiningArea position={[0.5, 0, -3.8]} rotation={[0, 0.1, 0]} />

        {/* Sun Parasol & Deck Loungers */}
        <BeachParasolAndLoungers position={[-5.2, 0, 4.5]} umbrellaColor="#f97316" />

        {/* Festoon Fairy Lights */}
        <FestoonFairyLights
          start={[-2.4, 2.2, 0]}
          end={[2.6, 2.3, 1.8]}
          isNight={isNight}
        />
      </group>
    </group>
  );
}
