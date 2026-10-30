'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Cinematic Auto-Camera Tour System:
 * Smooth Spline Camera Director offering 3 Atmospheric Tours:
 * 1. Grand Island Panorama (Mountains, Lakes, Towns, Harbor & Oceans)
 * 2. Energy Facility Close-Up (Wind Turbines, Solar Fields & Substations)
 * 3. Scenic Life & Transport (Railroad Train, Rivers, Farm & Lighthouse)
 */
export default function CinematicCameraTour({
  isActive = false,
  tourType = 'grand', // 'grand' | 'plants' | 'scenic'
  speedMultiplier = 1.0,
  onExit = () => {}
}) {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const currentPos = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());
  const isFirstActivation = useRef(true);

  // 1. Grand Island Tour (Panoramic sweeping flight around the entire island)
  const grandTour = useMemo(() => {
    const camPoints = [
      new THREE.Vector3(-450, 140, -420), // High Western Peaks
      new THREE.Vector3(-280, 85, -260),  // Gliding above Mountain Waterfall & Reservoir
      new THREE.Vector3(-150, 52, -75),   // Over Alpine Lake & Pier
      new THREE.Vector3(-80, 38, -145),   // Pine Ridge Village Church Spire
      new THREE.Vector3(0, 48, -25),      // Central Substation Interchange
      new THREE.Vector3(120, 65, 80),     // Gliding above Valley River Bridge
      new THREE.Vector3(280, 75, 160),    // Approaching Sunfire Coastal City
      new THREE.Vector3(410, 80, 95),     // Skimming Downtown Highrises
      new THREE.Vector3(340, 55, -210),   // Coastal Steppe towards the Bay
      new THREE.Vector3(220, 42, -340),   // Low swoop above Harbor Pier & Lighthouse
      new THREE.Vector3(-120, 110, -460)  // Ocean Ascent back to peaks
    ];

    const lookPoints = [
      new THREE.Vector3(-350, 40, -320),
      new THREE.Vector3(-240, 20, -60),
      new THREE.Vector3(-140, 14, -30),
      new THREE.Vector3(-75, 10, -170),
      new THREE.Vector3(0, 12, 0),
      new THREE.Vector3(60, 10, 210),
      new THREE.Vector3(360, 20, 100),
      new THREE.Vector3(380, 10, 80),
      new THREE.Vector3(280, 5, -240),
      new THREE.Vector3(210, 2, -380),
      new THREE.Vector3(-200, 30, -300)
    ];

    return {
      camCurve: new THREE.CatmullRomCurve3(camPoints, true),
      lookCurve: new THREE.CatmullRomCurve3(lookPoints, true)
    };
  }, []);

  // 2. Energy Facility Tour (Close gliding passes over power plants)
  const plantsTour = useMemo(() => {
    const camPoints = [
      new THREE.Vector3(-460, 95, -340),  // Wind Turbine Nacelle Height
      new THREE.Vector3(-320, 78, -480),  // Skimming across Wind Park Ridge
      new THREE.Vector3(-60, 42, -310),   // Low valley wind generator line
      new THREE.Vector3(0, 32, 0),        // Central Substation Transformers & Busbars
      new THREE.Vector3(140, 26, 80),     // Megawatt Battery Storage Containers
      new THREE.Vector3(360, 38, 260),    // Gliding low over Sun-Tracking Solar Arrays
      new THREE.Vector3(560, 48, 440),    // High-capacity Eastern Solar Steppe
      new THREE.Vector3(720, 62, 320),    // Ocean-facing Solar Meadow
      new THREE.Vector3(240, 75, -120)    // High-voltage Transmission Line Run
    ];

    const lookPoints = [
      new THREE.Vector3(-450, 65, -320),
      new THREE.Vector3(-330, 45, -510),
      new THREE.Vector3(-50, 15, -320),
      new THREE.Vector3(0, 14, 0),
      new THREE.Vector3(120, 14, 150),
      new THREE.Vector3(380, 14, 280),
      new THREE.Vector3(540, 15, 480),
      new THREE.Vector3(730, 16, 310),
      new THREE.Vector3(180, 14, -90)
    ];

    return {
      camCurve: new THREE.CatmullRomCurve3(camPoints, true),
      lookCurve: new THREE.CatmullRomCurve3(lookPoints, true)
    };
  }, []);

  // 3. Scenic Life & Transport Tour (Moving Train, River, Farm & Lighthouse)
  const scenicTour = useMemo(() => {
    const camPoints = [
      new THREE.Vector3(85, 24, -30),     // Following Train at Industrial Siding
      new THREE.Vector3(20, 28, 65),      // River Crossing Trestle Bridge
      new THREE.Vector3(-25, 26, 190),    // Agri-Valley Farm Barn & Hay Bales
      new THREE.Vector3(120, 34, 340),    // Following Grand Valley River downstream
      new THREE.Vector3(260, 38, 460),    // River Estuary opening into Ocean
      new THREE.Vector3(380, 36, 110),    // Sunfire City Boulevard & Traffic
      new THREE.Vector3(260, 28, -290),   // Approaching Harbor Waters
      new THREE.Vector3(225, 22, -370),   // Circling Classic Harbor Lighthouse
      new THREE.Vector3(160, 25, -200)    // Low pass along Railroad Tracks
    ];

    const lookPoints = [
      new THREE.Vector3(75, 12, -40),
      new THREE.Vector3(30, 12, 100),
      new THREE.Vector3(-35, 14, 230),
      new THREE.Vector3(135, 10, 385),
      new THREE.Vector3(290, 4, 560),
      new THREE.Vector3(375, 16, 90),
      new THREE.Vector3(230, 2, -350),
      new THREE.Vector3(205, 16, -375),
      new THREE.Vector3(120, 12, -110)
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
    return grandTour;
  }, [tourType, grandTour, plantsTour, scenicTour]);

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
    // Smooth cinematic progression rate
    const tourDuration = tourType === 'plants' ? 65 : tourType === 'scenic' ? 55 : 85;
    const progressRate = (1.0 / tourDuration) * speedMultiplier;

    progressRef.current = (progressRef.current + dt * progressRate) % 1.0;
    const u = progressRef.current;

    const targetCamPos = activeCurves.camCurve.getPointAt(u);
    const targetLookAt = activeCurves.lookCurve.getPointAt(u);

    if (isFirstActivation.current) {
      currentPos.current.copy(targetCamPos);
      currentLookAt.current.copy(targetLookAt);
      isFirstActivation.current = false;
    } else {
      currentPos.current.lerp(targetCamPos, dt * 3.5);
      currentLookAt.current.lerp(targetLookAt, dt * 4.0);
    }

    camera.position.copy(currentPos.current);
    camera.up.set(0, 1, 0);
    camera.lookAt(currentLookAt.current);
    camera.fov = 54;
    camera.updateProjectionMatrix();
  });

  return null;
}

