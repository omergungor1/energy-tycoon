'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { getTerrainHeight } from './WorldCanvas';

/**
 * Cinematic Auto-Camera Tour System:
 * Smooth Spline Camera Director offering 4 Atmospheric Tours:
 * 1. Grand Island Panorama (Mountains, Lakes, Towns, Harbor & Oceans)
 * 2. Energy Facility Close-Up (Wind Turbines, Solar Fields & Substations)
 * 3. Scenic Life & Transport (Railroad Train, Rivers, Farm & Lighthouse)
 * 4. Firewatch Wilderness (Slow, atmospheric glide across Western Pine Forests, Lookout Tower & Sunset Ridge)
 *
 * All camera paths maintain near-horizontal angles (parallel to the ground/horizon)
 * and dynamically enforce strict ground clearance so the camera is ALWAYS above the terrain.
 */
export default function CinematicCameraTour({
  isActive = false,
  tourType = 'grand', // 'grand' | 'plants' | 'scenic' | 'firewatch'
  speedMultiplier = 1.0,
  onExit = () => {}
}) {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const currentPos = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const isFirstActivation = useRef(true);

  // 1. Grand Island Tour (Panoramic sweeping flight around the entire island, horizon-aligned)
  const grandTour = useMemo(() => {
    const camPoints = [
      new THREE.Vector3(-420, 86, -380), // Western Mountain Ridge
      new THREE.Vector3(-260, 70, -220), // Skimming above Alpine Reservoir & Waterfall
      new THREE.Vector3(-150, 48, -90),  // Over Alpine Lake looking toward Pine Ridge
      new THREE.Vector3(-50, 42, -70),   // North of Pine Ridge towards Central Substation
      new THREE.Vector3(30, 36, 10),     // Central Substation Interchange
      new THREE.Vector3(160, 40, 110),   // Grand Valley River Crossing
      new THREE.Vector3(310, 44, 115),   // Approaching Sunfire City Downtown Skyline
      new THREE.Vector3(430, 46, -40),   // Skimming East Coastal Plain along ocean
      new THREE.Vector3(330, 40, -230),  // Scenic Coastal Steppe towards Marina Bay
      new THREE.Vector3(220, 34, -350),  // Swoop past Harbor Ships & Lighthouse
      new THREE.Vector3(-160, 65, -440)  // Ocean flight returning to Western Peaks
    ];

    // LookAt targets projected far ahead towards the horizon, y-level parallel to cam
    const lookPoints = [
      new THREE.Vector3(-260, 83, -260),
      new THREE.Vector3(-120, 67, -90),
      new THREE.Vector3(-40, 45, -130),
      new THREE.Vector3(90, 39, -10),
      new THREE.Vector3(190, 33, 90),
      new THREE.Vector3(340, 37, 110),
      new THREE.Vector3(480, 41, 90),
      new THREE.Vector3(380, 43, -220),
      new THREE.Vector3(220, 37, -360),
      new THREE.Vector3(30, 32, -430),
      new THREE.Vector3(-380, 62, -400)
    ];

    return {
      camCurve: new THREE.CatmullRomCurve3(camPoints, true),
      lookCurve: new THREE.CatmullRomCurve3(lookPoints, true)
    };
  }, []);

  // 2. Energy Facility Tour (Close gliding passes over wind parks, solar fields & substations)
  const plantsTour = useMemo(() => {
    const camPoints = [
      new THREE.Vector3(-480, 90, -340), // Wind Turbine Nacelle Line
      new THREE.Vector3(-340, 80, -460), // Skimming across Northern Wind Ridge
      new THREE.Vector3(-160, 52, -260), // High-voltage Transmission Line Run
      new THREE.Vector3(-40, 34, -30),   // Central Substation Transformers & Busbars
      new THREE.Vector3(90, 32, 45),     // Megawatt Battery Storage Containers
      new THREE.Vector3(320, 36, 220),   // Sun-Tracking Solar Arrays
      new THREE.Vector3(520, 38, 380),   // High-capacity Eastern Solar Steppe
      new THREE.Vector3(640, 40, 240),   // Ocean-facing Solar Meadow
      new THREE.Vector3(320, 46, -50)    // High-voltage Transmission Return
    ];

    const lookPoints = [
      new THREE.Vector3(-320, 87, -420),
      new THREE.Vector3(-180, 77, -420),
      new THREE.Vector3(0, 49, -90),
      new THREE.Vector3(120, 32, 40),
      new THREE.Vector3(260, 30, 140),
      new THREE.Vector3(490, 34, 320),
      new THREE.Vector3(680, 36, 280),
      new THREE.Vector3(420, 38, 40),
      new THREE.Vector3(-120, 43, -180)
    ];

    return {
      camCurve: new THREE.CatmullRomCurve3(camPoints, true),
      lookCurve: new THREE.CatmullRomCurve3(lookPoints, true)
    };
  }, []);

  // 3. Scenic Life & Transport Tour (Moving Train, River, Farm & Lighthouse)
  const scenicTour = useMemo(() => {
    const camPoints = [
      new THREE.Vector3(95, 28, -45),    // Following Freight Train at Industrial Siding
      new THREE.Vector3(35, 28, 50),     // Gliding along tracks toward River Trestle
      new THREE.Vector3(95, 30, 150),    // Crossing River Trestle Bridge
      new THREE.Vector3(-30, 32, 210),   // Agri-Valley Farm Barn & Hay Bales
      new THREE.Vector3(115, 30, 320),   // Following Grand Valley River downstream
      new THREE.Vector3(340, 32, 95),    // Sunfire City Boulevard & Traffic
      new THREE.Vector3(380, 30, -130),  // Eastern Coastal Railway Plain
      new THREE.Vector3(250, 26, -320),  // Marina Harbor Dock & Freight Terminal
      new THREE.Vector3(195, 26, -390)   // Circling Coastal Lighthouse
    ];

    const lookPoints = [
      new THREE.Vector3(40, 26, 35),
      new THREE.Vector3(85, 26, 160),
      new THREE.Vector3(170, 28, 210),
      new THREE.Vector3(80, 29, 300),
      new THREE.Vector3(240, 28, 420),
      new THREE.Vector3(420, 30, -20),
      new THREE.Vector3(290, 28, -280),
      new THREE.Vector3(170, 24, -380),
      new THREE.Vector3(130, 24, -240)
    ];

    return {
      camCurve: new THREE.CatmullRomCurve3(camPoints, true),
      lookCurve: new THREE.CatmullRomCurve3(lookPoints, true)
    };
  }, []);

  // 4. Firewatch Wilderness Tour (Gliding above Western Pine Forests, Lookout Tower & Sunset Mountain Ridges)
  const firewatchTour = useMemo(() => {
    const camPoints = [
      new THREE.Vector3(-100, 44, -180), // Pine Ridge Coniferous Valley
      new THREE.Vector3(-160, 46, -90),  // Alpine Lake & Mirror Reservoir
      new THREE.Vector3(-210, 58, -55),  // Ascending Western Granite Ridge
      new THREE.Vector3(-250, 66, -10),  // Beside Firewatch Lookout Tower
      new THREE.Vector3(-265, 68, 25),   // Ridge Crest overlooking Sunset Horizon
      new THREE.Vector3(-310, 72, -40),  // Mountain Waterfall Gorge & Crags
      new THREE.Vector3(-350, 80, -180), // High Timber Ridge overlooking Valley
      new THREE.Vector3(-220, 54, -260)  // Descending through Spruce Forest Canopy
    ];

    const lookPoints = [
      new THREE.Vector3(-180, 42, -110),
      new THREE.Vector3(-220, 44, -30),
      new THREE.Vector3(-230, 55, -15), // Tracking the Firewatch Tower cabin
      new THREE.Vector3(-230, 63, -15), // Tracking the Firewatch Tower observation deck
      new THREE.Vector3(-210, 65, 80),  // Gazing out to distant mountain silhouettes
      new THREE.Vector3(-360, 69, -150),
      new THREE.Vector3(-260, 76, -240),
      new THREE.Vector3(-120, 51, -210)
    ];

    return {
      camCurve: new THREE.CatmullRomCurve3(camPoints, true),
      lookCurve: new THREE.CatmullRomCurve3(lookPoints, true)
    };
  }, []);

  // Active tour curves based on selected tour
  const activeCurves = useMemo(() => {
    if (tourType === 'plants') return plantsTour;
    if (tourType === 'scenic') return scenicTour;
    if (tourType === 'firewatch') return firewatchTour;
    return grandTour;
  }, [tourType, grandTour, plantsTour, scenicTour, firewatchTour]);

  // Reset progress when tour changes
  useEffect(() => {
    if (isActive) {
      isFirstActivation.current = true;
    }
  }, [isActive, tourType]);

  // Frame simulation loop for smooth cinematic camera director
  useFrame((state, delta) => {
    if (!isActive) return;

    const dt = Math.min(delta, 0.05);
    // Smooth cinematic progression rate (Firewatch is slower and more contemplative)
    const tourDuration =
      tourType === 'plants' ? 65 :
      tourType === 'scenic' ? 55 :
      tourType === 'firewatch' ? 115 : // Slow, relaxing, atmospheric Firewatch tour
      85;

    const progressRate = (1.0 / tourDuration) * speedMultiplier;

    progressRef.current = (progressRef.current + dt * progressRate) % 1.0;
    const u = progressRef.current;

    const targetCamPos = activeCurves.camCurve.getPointAt(u);
    const targetLookAt = activeCurves.lookCurve.getPointAt(u);

    // Dynamic ground clearance guarantee (minimum 14m above terrain)
    const MIN_CLEARANCE = 14.0;
    const targetGroundY = getTerrainHeight(targetCamPos.x, targetCamPos.z);

    if (targetCamPos.y < targetGroundY + MIN_CLEARANCE) {
      targetCamPos.y = targetGroundY + MIN_CLEARANCE;
    }

    // Ensure targetLookAt is also above ground at its coordinates
    const targetLookGroundY = getTerrainHeight(targetLookAt.x, targetLookAt.z);
    if (targetLookAt.y < targetLookGroundY + 5.0) {
      targetLookAt.y = targetLookGroundY + 5.0;
    }

    if (isFirstActivation.current) {
      currentPos.current.copy(targetCamPos);
      currentLookAt.current.copy(targetLookAt);
      isFirstActivation.current = false;
    } else {
      // Gentle, cinematic damping interpolation
      const lerpSpeed = tourType === 'firewatch' ? 2.2 : 3.5;
      currentPos.current.lerp(targetCamPos, dt * lerpSpeed);
      currentLookAt.current.lerp(targetLookAt, dt * (lerpSpeed + 0.5));
    }

    // Absolute hard safety floor on currentPos to guarantee it never penetrates any hill or terrain
    const currentGroundY = getTerrainHeight(currentPos.current.x, currentPos.current.z);

    if (currentPos.current.y < currentGroundY + MIN_CLEARANCE) {
      currentPos.current.y = currentGroundY + MIN_CLEARANCE;
    }

    // Ensure current lookAt is strictly above ground and aligned parallel to horizon
    const currentLookGroundY = getTerrainHeight(currentLookAt.current.x, currentLookAt.current.z);
    const horizonParallelY = currentPos.current.y - 2.5;
    const minLookY = Math.max(currentLookGroundY + 5.0, horizonParallelY);

    if (currentLookAt.current.y < minLookY) {
      currentLookAt.current.y = minLookY;
    }

    camera.position.copy(currentPos.current);
    camera.up.set(0, 1, 0);
    camera.lookAt(currentLookAt.current);
    camera.fov = 52; // Wide-angle cinematic anamorphic FOV
    camera.updateProjectionMatrix();
  });

  return null;
}
