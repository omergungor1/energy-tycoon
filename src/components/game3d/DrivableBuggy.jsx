'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { getTerrainHeight } from './WorldCanvas';

const WHEEL_RADIUS = 0.44;
const WHEEL_BASE = 2.3;
const TRACK_WIDTH = 1.7;
const MAX_SPEED = 28.0; // ~101 km/h standard cruising
const MAX_BOOST_SPEED = 48.0; // ~173 km/h Shift Turbo Boost
const MAX_REVERSE = 10.0; // ~36 km/h
const ACCEL = 18.0;
const BOOST_ACCEL = 38.0;
const BRAKE_DECEL = 32.0;
const DRAG = 5.2;
const MAX_STEER = 0.58; // ~33 deg

export default function DrivableBuggy({
  spawnPosition = [0, 0],
  initialYaw = 0,
  cameraMode = 'chase', // 'chase' | 'cockpit' | 'hood'
  onCameraModeChange = () => {},
  isNight = false,
  touchInput = {},
  onStatsUpdate = () => {},
  onExit = () => {},
  controlsRef = null
}) {
  const { camera } = useThree();

  const safeSpawnX = Number.isFinite(spawnPosition?.[0]) ? spawnPosition[0] : 0;
  const safeSpawnZ = Number.isFinite(spawnPosition?.[1]) ? spawnPosition[1] : 0;
  const safeYaw = Number.isFinite(initialYaw) ? initialYaw : 0;

  // Vehicle transform state
  const stateRef = useRef({
    x: safeSpawnX,
    z: safeSpawnZ,
    y: 0,
    velocity: 0,
    yaw: safeYaw,
    steerAngle: 0,
    wheelSpin: 0
  });

  // True 3D Quaternion for exact terrain surface normal orientation
  const vehicleQuat = useRef(
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), safeYaw)
  );

  // Keyboard input state
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    boost: false
  });

  // Scene references
  const vehicleGroupRef = useRef();
  const frontLeftSuspRef = useRef();
  const frontRightSuspRef = useRef();
  const rearLeftSuspRef = useRef();
  const rearRightSuspRef = useRef();
  const frontLeftWheelGroupRef = useRef();
  const frontRightWheelGroupRef = useRef();
  const frontLeftWheelMeshRef = useRef();
  const frontRightWheelMeshRef = useRef();
  const rearLeftWheelMeshRef = useRef();
  const rearRightWheelMeshRef = useRef();
  const steeringWheelRef = useRef();
  const headlightTargetRef = useRef();
  const headlightRef = useRef();

  // Smooth camera trailing values for chase view
  const smoothCamPos = useRef(new THREE.Vector3());
  const isFirstFrame = useRef(true);

  // Initialize altitude & orientation at spawn
  useEffect(() => {
    const s = stateRef.current;
    s.x = Number.isFinite(spawnPosition?.[0]) ? spawnPosition[0] : 0;
    s.z = Number.isFinite(spawnPosition?.[1]) ? spawnPosition[1] : 0;
    s.yaw = Number.isFinite(initialYaw) ? initialYaw : 0;
    s.velocity = 0;
    s.steerAngle = 0;

    const halfBase = WHEEL_BASE / 2;
    const halfTrack = TRACK_WIDTH / 2;
    const fwdX = Math.sin(s.yaw);
    const fwdZ = Math.cos(s.yaw);
    const rgtX = Math.cos(s.yaw);
    const rgtZ = -Math.sin(s.yaw);

    const yFL = getTerrainHeight(s.x - rgtX * halfTrack + fwdX * halfBase, s.z - rgtZ * halfTrack + fwdZ * halfBase);
    const yFR = getTerrainHeight(s.x + rgtX * halfTrack + fwdX * halfBase, s.z + rgtZ * halfTrack + fwdZ * halfBase);
    const yRL = getTerrainHeight(s.x - rgtX * halfTrack - fwdX * halfBase, s.z - rgtZ * halfTrack - fwdZ * halfBase);
    const yRR = getTerrainHeight(s.x + rgtX * halfTrack - fwdX * halfBase, s.z + rgtZ * halfTrack - fwdZ * halfBase);

    const frontY = (yFL + yFR) * 0.5;
    const rearY = (yRL + yRR) * 0.5;
    const rightY = (yFR + yRR) * 0.5;
    const leftY = (yFL + yRL) * 0.5;

    const terrainPitch = -Math.atan2(frontY - rearY, WHEEL_BASE);
    const terrainRoll = Math.atan2(rightY - leftY, TRACK_WIDTH);

    vehicleQuat.current.setFromEuler(new THREE.Euler(terrainPitch, s.yaw, terrainRoll, 'YXZ'));
    s.y = (yFL + yFR + yRL + yRR) * 0.25 + WHEEL_RADIUS;
    isFirstFrame.current = true;
  }, [spawnPosition, initialYaw]);

  // Keyboard listeners
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't capture inputs if typing in an input element
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keysRef.current.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') keysRef.current.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.right = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') keysRef.current.boost = true;
      if (code === 'Space') {
        e.preventDefault();
        keysRef.current.brake = true;
      }

      // Camera view toggle (C or V)
      if (code === 'KeyC' || code === 'KeyV') {
        e.preventDefault();
        const modes = ['cockpit', 'chase', 'hood'];
        const nextIdx = (modes.indexOf(cameraMode) + 1) % modes.length;
        onCameraModeChange(modes[nextIdx]);
      }

      // ESC to exit
      if (code === 'Escape') {
        onExit();
      }
    }

    function handleKeyUp(e) {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keysRef.current.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') keysRef.current.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') keysRef.current.boost = false;
      if (code === 'Space') keysRef.current.brake = false;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cameraMode, onCameraModeChange, onExit]);

  // Materials & Geometries memoized for high-performance rendering
  const materials = useMemo(() => {
    return {
      bodyMat: new THREE.MeshStandardMaterial({
        color: '#10b981', // Energetic Emerald
        roughness: 0.28,
        metalness: 0.65
      }),
      hoodStripeMat: new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.35,
        metalness: 0.2
      }),
      chassisMat: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.6,
        metalness: 0.7
      }),
      cageMat: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.45,
        metalness: 0.8
      }),
      tireMat: new THREE.MeshStandardMaterial({
        color: '#18181b',
        roughness: 0.92,
        metalness: 0.08
      }),
      rimMat: new THREE.MeshStandardMaterial({
        color: '#64748b',
        roughness: 0.3,
        metalness: 0.85
      }),
      caliperMat: new THREE.MeshStandardMaterial({
        color: '#ef4444',
        roughness: 0.4,
        metalness: 0.4
      }),
      windshieldMat: new THREE.MeshStandardMaterial({
        color: '#0f172a',
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        metalness: 0.1
      }),
      headlightOffMat: new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        roughness: 0.2
      }),
      headlightOnMat: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#f0fdf4',
        emissiveIntensity: 2.8,
        roughness: 0.1
      }),
      taillightNormalMat: new THREE.MeshStandardMaterial({
        color: '#991b1b',
        emissive: '#ef4444',
        emissiveIntensity: 1.2
      }),
      taillightBrakingMat: new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#ef4444',
        emissiveIntensity: 4.5
      }),
      dashMat: new THREE.MeshStandardMaterial({
        color: '#0284c7',
        emissive: '#06b6d4',
        emissiveIntensity: 1.1
      }),
      seatMat: new THREE.MeshStandardMaterial({
        color: '#090d16',
        roughness: 0.75
      }),
      springMat: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.35,
        metalness: 0.7
      })
    };
  }, []);

  // Frame simulation loop
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = stateRef.current;
    const k = keysRef.current;
    const t = touchInput || {};

    const isForward = k.forward || t.forward;
    const isBackward = k.backward || t.backward;
    const isLeft = k.left || t.left;
    const isRight = k.right || t.right;
    const isBrake = k.brake || t.brake;
    const isBoost = k.boost || t.boost;

    // Speeds & Acceleration with Shift Key Turbo Boost
    const maxForwardSpeed = isBoost ? MAX_BOOST_SPEED : MAX_SPEED; // Shift Boost ~173 km/h!
    const forwardAccel = isBoost ? BOOST_ACCEL : ACCEL;

    // 1. Acceleration & Velocity calculation
    if (isBrake) {
      if (s.velocity > 0) {
        s.velocity = Math.max(0, s.velocity - BRAKE_DECEL * 1.6 * dt);
      } else if (s.velocity < 0) {
        s.velocity = Math.min(0, s.velocity + BRAKE_DECEL * 1.6 * dt);
      }
    } else if (isForward) {
      if (s.velocity < -0.4) {
        s.velocity += BRAKE_DECEL * dt; // Braking out of reverse
      } else {
        s.velocity = Math.min(maxForwardSpeed, s.velocity + forwardAccel * dt);
      }
    } else if (isBackward) {
      if (s.velocity > 0.4) {
        s.velocity = Math.max(0, s.velocity - BRAKE_DECEL * dt); // Braking while moving forward
      } else {
        s.velocity = Math.max(-MAX_REVERSE, s.velocity - ACCEL * 0.7 * dt); // Reverse gear
      }
    } else {
      // Natural rolling drag
      if (s.velocity > 0) {
        s.velocity = Math.max(0, s.velocity - DRAG * dt);
      } else if (s.velocity < 0) {
        s.velocity = Math.min(0, s.velocity + DRAG * dt);
      }
    }

    // Coast down smoothly if boost released above standard top speed
    if (!isBoost && s.velocity > MAX_SPEED) {
      s.velocity = Math.max(MAX_SPEED, s.velocity - DRAG * 2.2 * dt);
    }

    // Defensive check on velocity
    if (!Number.isFinite(s.velocity)) s.velocity = 0;

    // 2. Steering dynamics (speed-sensitive steering)
    const speedRatio = Math.min(1, Math.abs(s.velocity) / maxForwardSpeed);
    const steerLimit = MAX_STEER * Math.max(0.35, 1 - speedRatio * 0.52);
    let targetSteer = 0;
    if (isLeft) targetSteer += steerLimit;
    if (isRight) targetSteer -= steerLimit;
    s.steerAngle = THREE.MathUtils.lerp(s.steerAngle, targetSteer, dt * 12);

    // 3. Heading (Yaw) updates based on Ackermann geometry
    if (Math.abs(s.velocity) > 0.05) {
      const angularVel = (s.velocity / WHEEL_BASE) * Math.sin(s.steerAngle);
      s.yaw += angularVel * dt;
    }
    if (!Number.isFinite(s.yaw)) s.yaw = 0;

    // 4. Horizontal displacement (X, Z)
    const vx = Math.sin(s.yaw) * s.velocity;
    const vz = Math.cos(s.yaw) * s.velocity;
    s.x += vx * dt;
    s.z += vz * dt;

    // Island boundary clamp (keep within [-1360, 1360])
    if (s.x > 1360 || s.x < -1360 || s.z > 1360 || s.z < -1360) {
      s.x = THREE.MathUtils.clamp(s.x, -1360, 1360);
      s.z = THREE.MathUtils.clamp(s.z, -1360, 1360);
      s.velocity *= -0.3; // gentle bounce off ocean edge
    }

    // 5. Precise 4-Wheel Contact Patch Terrain Alignment
    const halfBase = WHEEL_BASE / 2; // 1.15m
    const halfTrack = TRACK_WIDTH / 2; // 0.85m

    const fwdX = Math.sin(s.yaw);
    const fwdZ = Math.cos(s.yaw);
    const rgtX = Math.cos(s.yaw);
    const rgtZ = -Math.sin(s.yaw);

    // 4 Wheel world positions
    const xFL = s.x - rgtX * halfTrack + fwdX * halfBase;
    const zFL = s.z - rgtZ * halfTrack + fwdZ * halfBase;

    const xFR = s.x + rgtX * halfTrack + fwdX * halfBase;
    const zFR = s.z + rgtZ * halfTrack + fwdZ * halfBase;

    const xRL = s.x - rgtX * halfTrack - fwdX * halfBase;
    const zRL = s.z - rgtZ * halfTrack - fwdZ * halfBase;

    const xRR = s.x + rgtX * halfTrack - fwdX * halfBase;
    const zRR = s.z + rgtZ * halfTrack - fwdZ * halfBase;

    // Terrain elevation under each of the 4 tires
    const yFL = getTerrainHeight(xFL, zFL);
    const yFR = getTerrainHeight(xFR, zFR);
    const yRL = getTerrainHeight(xRL, zRL);
    const yRR = getTerrainHeight(xRR, zRR);

    // Vehicle center elevation (average of 4 tire contact patches + tire radius)
    const groundElevation = (yFL + yFR + yRL + yRR) * 0.25;
    s.y = groundElevation + WHEEL_RADIUS;

    // 3D Terrain slope pitch & roll matching
    const frontY = (yFL + yFR) * 0.5;
    const rearY = (yRL + yRR) * 0.5;
    const rightY = (yFR + yRR) * 0.5;
    const leftY = (yFL + yRL) * 0.5;

    const terrainPitch = -Math.atan2(frontY - rearY, WHEEL_BASE);
    const terrainRoll = Math.atan2(rightY - leftY, TRACK_WIDTH);

    // Dynamic suspension weight transfer on accel, brake & turning
    const accelPitch = (isForward ? -0.04 : 0) + (isBackward && s.velocity > 1 ? 0.06 : 0) + (isBrake ? 0.07 : 0);
    const rollLean = (s.velocity / maxForwardSpeed) * (s.steerAngle * 0.12);

    const targetPitch = terrainPitch + accelPitch;
    const targetRoll = terrainRoll + rollLean;

    const targetQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(targetPitch, s.yaw, targetRoll, 'YXZ')
    );

    // Smoothly interpolate vehicle orientation to hug terrain without jitter
    vehicleQuat.current.slerp(targetQuat, Math.min(1, dt * 16));

    // Update 3D vehicle root transform
    if (vehicleGroupRef.current) {
      vehicleGroupRef.current.position.set(s.x, s.y, s.z);
      vehicleGroupRef.current.quaternion.copy(vehicleQuat.current);
    }

    // Active 4-Wheel Terrain Grounding & Suspension travel
    // Guarantees all 4 wheels remain 100% grounded on non-planar terrain slopes
    const hubPosFL = new THREE.Vector3(-halfTrack, 0, halfBase).applyQuaternion(vehicleQuat.current).add(new THREE.Vector3(s.x, s.y, s.z));
    const hubPosFR = new THREE.Vector3(halfTrack, 0, halfBase).applyQuaternion(vehicleQuat.current).add(new THREE.Vector3(s.x, s.y, s.z));
    const hubPosRL = new THREE.Vector3(-halfTrack, 0, -halfBase).applyQuaternion(vehicleQuat.current).add(new THREE.Vector3(s.x, s.y, s.z));
    const hubPosRR = new THREE.Vector3(halfTrack, 0, -halfBase).applyQuaternion(vehicleQuat.current).add(new THREE.Vector3(s.x, s.y, s.z));

    const dispFL = THREE.MathUtils.clamp((yFL + WHEEL_RADIUS) - hubPosFL.y, -0.45, 0.45);
    const dispFR = THREE.MathUtils.clamp((yFR + WHEEL_RADIUS) - hubPosFR.y, -0.45, 0.45);
    const dispRL = THREE.MathUtils.clamp((yRL + WHEEL_RADIUS) - hubPosRL.y, -0.45, 0.45);
    const dispRR = THREE.MathUtils.clamp((yRR + WHEEL_RADIUS) - hubPosRR.y, -0.45, 0.45);

    if (frontLeftSuspRef.current) frontLeftSuspRef.current.position.y = dispFL;
    if (frontRightSuspRef.current) frontRightSuspRef.current.position.y = dispFR;
    if (rearLeftSuspRef.current) rearLeftSuspRef.current.position.y = dispRL;
    if (rearRightSuspRef.current) rearRightSuspRef.current.position.y = dispRR;

    // 6. Wheel spin rotation
    s.wheelSpin += (s.velocity / WHEEL_RADIUS) * dt;

    // Animate front wheel steering & spinning
    if (frontLeftWheelGroupRef.current) frontLeftWheelGroupRef.current.rotation.y = s.steerAngle;
    if (frontRightWheelGroupRef.current) frontRightWheelGroupRef.current.rotation.y = s.steerAngle;
    if (frontLeftWheelMeshRef.current) frontLeftWheelMeshRef.current.rotation.x = s.wheelSpin;
    if (frontRightWheelMeshRef.current) frontRightWheelMeshRef.current.rotation.x = s.wheelSpin;
    if (rearLeftWheelMeshRef.current) rearLeftWheelMeshRef.current.rotation.x = s.wheelSpin;
    if (rearRightWheelMeshRef.current) rearRightWheelMeshRef.current.rotation.x = s.wheelSpin;

    // Animate steering wheel rotation in cockpit
    if (steeringWheelRef.current) {
      steeringWheelRef.current.rotation.z = -s.steerAngle * 2.8;
    }

    // Update forward headlight spotlight target
    if (headlightRef.current && headlightTargetRef.current) {
      const forwardDir = new THREE.Vector3(0, -0.04, 1).applyQuaternion(vehicleQuat.current);
      headlightTargetRef.current.position.set(
        s.x + forwardDir.x * 30,
        s.y + forwardDir.y * 30,
        s.z + forwardDir.z * 30
      );
    }

    // 7. Dynamic Camera Positioning based on Camera Mode
    const boostFov = isBoost && isForward && Math.abs(s.velocity) > 10 ? 10 : 0;

    if (cameraMode === 'cockpit') {
      // First-person cockpit view (driver's seat)
      camera.fov = 68 + boostFov;
      camera.near = 0.08;
      camera.updateProjectionMatrix();

      // Driver's eye local offset: left of center console, elevated inside roll cage
      const localEye = new THREE.Vector3(-0.28, 1.08, 0.12).applyQuaternion(vehicleQuat.current);
      camera.position.set(s.x + localEye.x, s.y + localEye.y, s.z + localEye.z);

      const fwd3D = new THREE.Vector3(0, 0, 1).applyQuaternion(vehicleQuat.current);
      const up3D = new THREE.Vector3(0, 1, 0).applyQuaternion(vehicleQuat.current);
      const steerLook = new THREE.Vector3(-s.steerAngle * 0.22, 0, 0).applyQuaternion(vehicleQuat.current);

      camera.up.copy(up3D);
      camera.lookAt(camera.position.clone().add(fwd3D.multiplyScalar(30)).add(steerLook));
    } else if (cameraMode === 'hood') {
      // Action Bumper / Hood View
      camera.fov = 74 + boostFov;
      camera.near = 0.2;
      camera.updateProjectionMatrix();

      const localBumper = new THREE.Vector3(0, 0.72, 1.45).applyQuaternion(vehicleQuat.current);
      camera.position.set(s.x + localBumper.x, s.y + localBumper.y, s.z + localBumper.z);

      const fwd3D = new THREE.Vector3(0, 0, 1).applyQuaternion(vehicleQuat.current);
      const up3D = new THREE.Vector3(0, 1, 0).applyQuaternion(vehicleQuat.current);
      camera.up.copy(up3D);
      camera.lookAt(camera.position.clone().add(fwd3D.multiplyScalar(35)));
    } else {
      // Third-person Chase View ('chase')
      camera.fov = 54 + boostFov;
      camera.near = 0.5;
      camera.updateProjectionMatrix();

      // Camera trailing 6.0m behind and 2.4m above vehicle oriented with vehicle horizontal yaw
      const camYawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw);
      const localOffset = new THREE.Vector3(0, 2.4, -6.2).applyQuaternion(camYawQuat);
      const targetCamPos = new THREE.Vector3(s.x + localOffset.x, s.y + localOffset.y, s.z + localOffset.z);

      // Prevent camera from clipping through terrain slopes behind the car
      const groundAtCam = getTerrainHeight(targetCamPos.x, targetCamPos.z) + 1.25;
      if (targetCamPos.y < groundAtCam) targetCamPos.y = groundAtCam;

      if (isFirstFrame.current) {
        smoothCamPos.current.copy(targetCamPos);
        isFirstFrame.current = false;
      } else {
        smoothCamPos.current.lerp(targetCamPos, dt * 8.5);
      }

      camera.position.copy(smoothCamPos.current);
      camera.up.set(0, 1, 0); // Keep world upright so the player clearly sees the buggy tilted on slopes!
      camera.lookAt(s.x, s.y + 0.85, s.z);
    }

    // 8. Export live stats for 2D UI overlay (throttled)
    const speedKmh = Math.abs(Math.round(s.velocity * 3.6));
    const gear = s.velocity < -0.4 ? 'R' : Math.abs(s.velocity) < 0.2 ? 'P' : 'D';
    const headingDeg = Math.round((((s.yaw * 180) / Math.PI) % 360 + 360) % 360);

    onStatsUpdate({
      speedKmh,
      velocity: s.velocity,
      gear,
      headingDeg,
      x: Math.round(s.x),
      z: Math.round(s.z),
      altitude: Math.round(s.y),
      isBraking: isBrake || (isBackward && s.velocity > 0.4),
      isBoost: isBoost && isForward && Math.abs(s.velocity) > 2
    });
  });

  return (
    <>
      {/* Headlight Target node in world space */}
      <object3D ref={headlightTargetRef} position={[0, 0, 10]} />

      {/* Main Buggy Root Group */}
      <group ref={vehicleGroupRef}>
        {/* 1. Chassis Belly Pan & Rocker Skirts */}
        <mesh position={[0, 0.12, 0]} material={materials.chassisMat} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.16, 2.9]} />
        </mesh>

        {/* 2. Main Body Hood (Sloping Aerodynamic Emerald Nose) */}
        <group position={[0, 0.38, 0.4]}>
          <mesh material={materials.bodyMat} rotation={[-0.14, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.28, 0.22, 1.4]} />
          </mesh>
          {/* White Center Racing Stripe */}
          <mesh position={[0, 0.12, 0]} rotation={[-0.14, 0, 0]} material={materials.hoodStripeMat}>
            <boxGeometry args={[0.26, 0.02, 1.42]} />
          </mesh>
        </group>

        {/* 3. Rear Engine Deck & Battery Pack */}
        <group position={[0, 0.42, -0.9]}>
          <mesh material={materials.bodyMat} castShadow receiveShadow>
            <boxGeometry args={[1.36, 0.28, 0.95]} />
          </mesh>
          {/* Cyberpunk Battery Cooling Ribs */}
          <mesh position={[0, 0.16, 0]} material={materials.dashMat}>
            <boxGeometry args={[0.9, 0.06, 0.7]} />
          </mesh>
        </group>

        {/* 4. Tubular Roll Cage (Exoskeleton) */}
        <group position={[0, 0.82, -0.15]}>
          {/* Roof halo panel */}
          <mesh position={[0, 0.52, 0]} material={materials.cageMat}>
            <boxGeometry args={[1.08, 0.05, 1.2]} />
          </mesh>
          {/* A-Pillars (Front roll cage struts) */}
          <mesh position={[-0.52, 0.1, 0.55]} rotation={[-0.32, 0, 0.12]} material={materials.cageMat}>
            <cylinderGeometry args={[0.032, 0.032, 1.05, 8]} />
          </mesh>
          <mesh position={[0.52, 0.1, 0.55]} rotation={[-0.32, 0, -0.12]} material={materials.cageMat}>
            <cylinderGeometry args={[0.032, 0.032, 1.05, 8]} />
          </mesh>
          {/* B-Pillars (Middle roll cage struts) */}
          <mesh position={[-0.54, 0.05, -0.1]} material={materials.cageMat}>
            <cylinderGeometry args={[0.032, 0.032, 0.95, 8]} />
          </mesh>
          <mesh position={[0.54, 0.05, -0.1]} material={materials.cageMat}>
            <cylinderGeometry args={[0.032, 0.032, 0.95, 8]} />
          </mesh>
          {/* C-Pillars (Rear roll cage diagonal struts) */}
          <mesh position={[-0.52, -0.05, -0.65]} rotation={[0.42, 0, 0.1]} material={materials.cageMat}>
            <cylinderGeometry args={[0.032, 0.032, 1.15, 8]} />
          </mesh>
          <mesh position={[0.52, -0.05, -0.65]} rotation={[0.42, 0, -0.1]} material={materials.cageMat}>
            <cylinderGeometry args={[0.032, 0.032, 1.15, 8]} />
          </mesh>
          {/* Windshield Glass */}
          <mesh position={[0, 0.08, 0.52]} rotation={[-0.32, 0, 0]} material={materials.windshieldMat}>
            <boxGeometry args={[1.02, 0.85, 0.02]} />
          </mesh>
        </group>

        {/* 5. Cockpit Interior (Seats, Dashboard, Steering Wheel) */}
        <group position={[0, 0.28, 0]}>
          {/* Left Racing Bucket Seat (Driver) */}
          <group position={[-0.28, 0.18, -0.05]}>
            <mesh material={materials.seatMat} castShadow>
              <boxGeometry args={[0.42, 0.12, 0.45]} />
            </mesh>
            <mesh position={[0, 0.32, -0.2]} rotation={[0.18, 0, 0]} material={materials.seatMat} castShadow>
              <boxGeometry args={[0.4, 0.58, 0.12]} />
            </mesh>
            {/* Emerald Racing Harness */}
            <mesh position={[0, 0.32, -0.13]} rotation={[0.18, 0, 0]} material={materials.bodyMat}>
              <boxGeometry args={[0.16, 0.52, 0.03]} />
            </mesh>
          </group>

          {/* Right Racing Bucket Seat (Passenger) */}
          <group position={[0.28, 0.18, -0.05]}>
            <mesh material={materials.seatMat} castShadow>
              <boxGeometry args={[0.42, 0.12, 0.45]} />
            </mesh>
            <mesh position={[0, 0.32, -0.2]} rotation={[0.18, 0, 0]} material={materials.seatMat} castShadow>
              <boxGeometry args={[0.4, 0.58, 0.12]} />
            </mesh>
          </group>

          {/* Angled Center Dashboard */}
          <group position={[0, 0.48, 0.55]}>
            <mesh material={materials.chassisMat}>
              <boxGeometry args={[1.05, 0.18, 0.32]} />
            </mesh>
            {/* Digital Speedometer & Battery HUD Screen */}
            <mesh position={[-0.28, 0.08, -0.08]} rotation={[-0.45, 0, 0]} material={materials.dashMat}>
              <planeGeometry args={[0.22, 0.11]} />
            </mesh>
          </group>

          {/* Animated Cockpit Steering Wheel */}
          <group position={[-0.28, 0.54, 0.38]} rotation={[-0.45, 0, 0]}>
            <mesh material={materials.chassisMat} position={[0, 0, 0.06]}>
              <cylinderGeometry args={[0.02, 0.02, 0.14, 8]} />
            </mesh>
            <group ref={steeringWheelRef} position={[0, 0, 0.12]}>
              <mesh material={materials.cageMat}>
                <torusGeometry args={[0.16, 0.022, 8, 20]} />
              </mesh>
              {/* Wheel Spokes */}
              <mesh material={materials.chassisMat}>
                <boxGeometry args={[0.28, 0.024, 0.02]} />
              </mesh>
              <mesh position={[0, -0.06, 0]} material={materials.chassisMat}>
                <boxGeometry args={[0.024, 0.12, 0.02]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* 6. Front Bullbar, High-Beam LED Lights & Lightbar */}
        <group position={[0, 0.22, 1.48]}>
          {/* Heavy-duty steel bullbar */}
          <mesh material={materials.cageMat}>
            <boxGeometry args={[1.35, 0.15, 0.12]} />
          </mesh>
          <mesh position={[0, 0.18, -0.04]} material={materials.cageMat}>
            <boxGeometry args={[0.85, 0.08, 0.08]} />
          </mesh>

          {/* Dual Main Headlight Pods */}
          <mesh position={[-0.42, 0.1, 0.06]} material={materials.headlightOnMat}>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 16]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          <mesh position={[0.42, 0.1, 0.06]} material={materials.headlightOnMat}>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 16]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>

          {/* Active 3D Forward Spotlight */}
          <spotLight
            ref={headlightRef}
            target={headlightTargetRef.current}
            position={[0, 0.15, 0.2]}
            color="#fef3c7"
            intensity={isNight ? 3.8 : 1.4}
            distance={55}
            angle={Math.PI / 4.2}
            penumbra={0.4}
            castShadow
          />
        </group>

        {/* Roof LED Lightbar (4 Off-Road Pods) */}
        <group position={[0, 1.38, 0.35]}>
          <mesh material={materials.cageMat}>
            <boxGeometry args={[0.88, 0.06, 0.08]} />
          </mesh>
          {[-0.32, -0.11, 0.11, 0.32].map((xOffset, i) => (
            <mesh key={i} position={[xOffset, 0, 0.05]} material={materials.headlightOnMat}>
              <boxGeometry args={[0.12, 0.05, 0.04]} />
            </mesh>
          ))}
        </group>

        {/* 7. Rear Bumper, Taillights & Spare Wheel */}
        <group position={[0, 0.38, -1.48]}>
          {/* Rear bumper bar */}
          <mesh material={materials.cageMat}>
            <boxGeometry args={[1.35, 0.12, 0.1]} />
          </mesh>
          {/* Dual Red LED Taillights */}
          <mesh position={[-0.46, 0.02, -0.06]} material={materials.taillightBrakingMat}>
            <boxGeometry args={[0.22, 0.06, 0.04]} />
          </mesh>
          <mesh position={[0.46, 0.02, -0.06]} material={materials.taillightBrakingMat}>
            <boxGeometry args={[0.22, 0.06, 0.04]} />
          </mesh>
          {/* Angled Rear Spare Tire */}
          <group position={[0, 0.45, 0.18]} rotation={[-0.45, 0, 0]}>
            <mesh material={materials.tireMat} castShadow>
              <torusGeometry args={[0.34, 0.13, 10, 20]} />
            </mesh>
            <mesh material={materials.rimMat}>
              <cylinderGeometry args={[0.22, 0.22, 0.16, 12]} rotation={[Math.PI / 2, 0, 0]} />
            </mesh>
          </group>
          {/* Whip Antenna with Orange Safety Flag */}
          <group position={[0.55, 0.2, 0.1]}>
            <mesh material={materials.cageMat}>
              <cylinderGeometry args={[0.008, 0.008, 1.2, 6]} position={[0, 0.6, 0]} />
            </mesh>
            <mesh position={[0.08, 1.15, 0]} rotation={[0, 0, 0.1]}>
              <boxGeometry args={[0.16, 0.1, 0.01]} />
              <meshBasicMaterial color="#f97316" />
            </mesh>
          </group>
        </group>

        {/* 8. Four Off-Road Wheels & Coilover Suspensions */}

        {/* FRONT LEFT WHEEL */}
        <group ref={frontLeftSuspRef} position={[-TRACK_WIDTH / 2, 0, 1.15]}>
          {/* Exposed Coilover Spring */}
          <mesh position={[0.18, 0.24, 0]} material={materials.springMat}>
            <cylinderGeometry args={[0.05, 0.05, 0.42, 8]} />
          </mesh>
          {/* Steering Pivot Group */}
          <group ref={frontLeftWheelGroupRef}>
            <group ref={frontLeftWheelMeshRef}>
              {/* Outer Knobby Rubber Tire */}
              <mesh material={materials.tireMat} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
                <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.36, 24]} />
              </mesh>
              {/* Inner Alloy Wheel Rim */}
              <mesh material={materials.rimMat} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.26, 0.26, 0.37, 16]} />
              </mesh>
              {/* Red Brake Caliper */}
              <mesh position={[0, 0.16, 0.04]} material={materials.caliperMat}>
                <boxGeometry args={[0.08, 0.14, 0.1]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* FRONT RIGHT WHEEL */}
        <group ref={frontRightSuspRef} position={[TRACK_WIDTH / 2, 0, 1.15]}>
          <mesh position={[-0.18, 0.24, 0]} material={materials.springMat}>
            <cylinderGeometry args={[0.05, 0.05, 0.42, 8]} />
          </mesh>
          <group ref={frontRightWheelGroupRef}>
            <group ref={frontRightWheelMeshRef}>
              <mesh material={materials.tireMat} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
                <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.36, 24]} />
              </mesh>
              <mesh material={materials.rimMat} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.26, 0.26, 0.37, 16]} />
              </mesh>
              <mesh position={[0, 0.16, 0.04]} material={materials.caliperMat}>
                <boxGeometry args={[0.08, 0.14, 0.1]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* REAR LEFT WHEEL */}
        <group ref={rearLeftSuspRef} position={[-TRACK_WIDTH / 2, 0, -1.15]}>
          <mesh position={[0.18, 0.26, 0]} material={materials.springMat}>
            <cylinderGeometry args={[0.055, 0.055, 0.46, 8]} />
          </mesh>
          <group ref={rearLeftWheelMeshRef}>
            <mesh material={materials.tireMat} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[WHEEL_RADIUS + 0.02, WHEEL_RADIUS + 0.02, 0.4, 24]} />
            </mesh>
            <mesh material={materials.rimMat} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.26, 0.26, 0.41, 16]} />
            </mesh>
          </group>
        </group>

        {/* REAR RIGHT WHEEL */}
        <group ref={rearRightSuspRef} position={[TRACK_WIDTH / 2, 0, -1.15]}>
          <mesh position={[-0.18, 0.26, 0]} material={materials.springMat}>
            <cylinderGeometry args={[0.055, 0.055, 0.46, 8]} />
          </mesh>
          <group ref={rearRightWheelMeshRef}>
            <mesh material={materials.tireMat} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[WHEEL_RADIUS + 0.02, WHEEL_RADIUS + 0.02, 0.4, 24]} />
            </mesh>
            <mesh material={materials.rimMat} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.26, 0.26, 0.41, 16]} />
            </mesh>
          </group>
        </group>
      </group>
    </>
  );
}

