'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { getTerrainHeight } from './WorldCanvas';

const WALK_SPEED = 1.6; // ~5.8 km/h brisk walking
const RUN_SPEED = 4.6; // ~16.5 km/h athletic sprint
const ACCEL = 14.0;
const DECEL = 16.0;
const ROT_SPEED = 3.6; // radians / sec
const JUMP_POWER = 5.8;
const GRAVITY = -18.0;

// Reusable scratch objects to eliminate per-frame GC allocations
const _walkLookTarget = new THREE.Vector3();
const _walkTargetCamPos = new THREE.Vector3();

export default function WalkableCharacter({
  spawnPosition = [0, 0],
  initialYaw = 0,
  cameraMode = 'chase', // 'chase' | 'fps'
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

  // Character Kinematics State
  const stateRef = useRef({
    x: safeSpawnX,
    z: safeSpawnZ,
    y: 0,
    vy: 0,
    velocity: 0,
    yaw: safeYaw,
    isGrounded: true,
    walkCycle: 0,
    totalDistance: 0
  });

  // Smooth Chase Camera Position Buffer
  const smoothCamPos = useRef(new THREE.Vector3());
  const isFirstFrame = useRef(true);
  const lastStatsEmit = useRef(0);
  const prevStats = useRef({});

  // Keyboard input state
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    jump: false
  });

  // Scene references for procedural bone/joint animation
  const rootGroupRef = useRef();
  const characterMeshGroupRef = useRef();
  const torsoRef = useRef();
  const headRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const headlampRef = useRef();
  const headlampTargetRef = useRef();

  // Initialize altitude at spawn
  useEffect(() => {
    const s = stateRef.current;
    s.x = Number.isFinite(spawnPosition?.[0]) ? spawnPosition[0] : 0;
    s.z = Number.isFinite(spawnPosition?.[1]) ? spawnPosition[1] : 0;
    s.yaw = Number.isFinite(initialYaw) ? initialYaw : 0;
    s.y = getTerrainHeight(s.x, s.z);
    s.vy = 0;
    s.velocity = 0;
    s.isGrounded = true;
    isFirstFrame.current = true;
  }, [spawnPosition, initialYaw]);

  // Keyboard Event Listeners
  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const code = e.code;

      if (code === 'KeyW' || code === 'ArrowUp') keysRef.current.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') keysRef.current.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') keysRef.current.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') keysRef.current.right = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') keysRef.current.run = true;
      if (code === 'Space') {
        keysRef.current.jump = true;
        e.preventDefault();
      }

      // Camera switch shortcut
      if (code === 'KeyC' || code === 'KeyV') {
        onCameraModeChange(cameraMode === 'chase' ? 'fps' : 'chase');
      }

      // Exit walking mode
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
      if (code === 'ShiftLeft' || code === 'ShiftRight') keysRef.current.run = false;
      if (code === 'Space') keysRef.current.jump = false;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cameraMode, onCameraModeChange, onExit]);

  // Materials for the Stylized Energy Engineer Avatar
  const mats = useMemo(() => {
    return {
      helmetMat: new THREE.MeshStandardMaterial({
        color: '#facc15', // Vibrant safety yellow
        roughness: 0.35,
        metalness: 0.2
      }),
      vestMat: new THREE.MeshStandardMaterial({
        color: '#10b981', // Hi-Vis Emerald Green
        roughness: 0.5,
        metalness: 0.1
      }),
      reflectiveStripeMat: new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.2,
        metalness: 0.8
      }),
      skinMat: new THREE.MeshStandardMaterial({
        color: '#e0a97c',
        roughness: 0.7
      }),
      pantsMat: new THREE.MeshStandardMaterial({
        color: '#1e293b', // Slate navy work pants
        roughness: 0.8
      }),
      bootsMat: new THREE.MeshStandardMaterial({
        color: '#0f172a', // Heavy dark work boots
        roughness: 0.85
      }),
      beltMat: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.6
      }),
      visorMat: new THREE.MeshStandardMaterial({
        color: '#090d16',
        roughness: 0.1,
        metalness: 0.9
      }),
      lampMat: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#ffffff',
        emissiveIntensity: 2.5
      })
    };
  }, []);

  // Frame Simulation Loop
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = stateRef.current;
    const k = keysRef.current;
    const t = touchInput || {};

    const isFwd = k.forward || t.forward;
    const isBwd = k.backward || t.backward;
    const isLft = k.left || t.left;
    const isRgt = k.right || t.right;
    const isRun = (k.run || t.run || t.boost) && (isFwd || isBwd || isLft || isRgt);
    const isJump = k.jump || t.jump;

    // 1. Steering & Heading update
    let steerDir = 0;
    if (typeof t.steerAxis === 'number' && Math.abs(t.steerAxis) > 0.05) {
      steerDir = -t.steerAxis;
    } else {
      if (isLft) steerDir += 1;
      if (isRgt) steerDir -= 1;
    }
    s.yaw += steerDir * ROT_SPEED * dt;
    if (!Number.isFinite(s.yaw)) s.yaw = 0;

    // 2. Velocity computation (Walk vs Run)
    const targetMaxSpeed = isRun ? RUN_SPEED : WALK_SPEED;
    let targetVel = 0;
    if (isFwd) targetVel = targetMaxSpeed;
    else if (isBwd) targetVel = -targetMaxSpeed * 0.65; // Backpedal slower

    if (Math.abs(targetVel) > 0.01) {
      s.velocity = THREE.MathUtils.lerp(s.velocity, targetVel, dt * ACCEL);
    } else {
      s.velocity = THREE.MathUtils.lerp(s.velocity, 0, dt * DECEL);
      if (Math.abs(s.velocity) < 0.05) s.velocity = 0;
    }

    // 3. Horizontal position integration
    const vx = Math.sin(s.yaw) * s.velocity;
    const vz = Math.cos(s.yaw) * s.velocity;
    s.x += vx * dt;
    s.z += vz * dt;

    // Accumulate walked distance
    s.totalDistance += Math.abs(s.velocity) * dt;

    // Island boundary clamp (keep within [-1360, 1360])
    s.x = THREE.MathUtils.clamp(s.x, -1360, 1360);
    s.z = THREE.MathUtils.clamp(s.z, -1360, 1360);

    // 4. Vertical Dynamics & Terrain Height matching (single fast call)
    const groundH = getTerrainHeight(s.x, s.z);
    const groundedY = groundH;

    // Jumping trigger
    if (isJump && s.isGrounded) {
      s.vy = JUMP_POWER;
      s.isGrounded = false;
    }

    if (!s.isGrounded) {
      s.vy += GRAVITY * dt;
      s.y += s.vy * dt;
      if (s.y <= groundedY) {
        s.y = groundedY;
        s.vy = 0;
        s.isGrounded = true;
      }
    } else {
      s.y = groundedY;
      s.vy = 0;
    }

    // 5. Update Root Group position & yaw
    if (rootGroupRef.current) {
      rootGroupRef.current.position.set(s.x, s.y, s.z);
      rootGroupRef.current.rotation.y = s.yaw;
    }

    // 6. Procedural Walking / Running Animation Cycles
    const speedRatio = Math.abs(s.velocity) / (RUN_SPEED || 1);
    const isMoving = Math.abs(s.velocity) > 0.1 && s.isGrounded;

    if (isMoving) {
      const stepFreq = isRun ? 13.5 : 8.5; // Faster cadence when sprinting
      s.walkCycle += dt * stepFreq * (s.velocity >= 0 ? 1 : -1);
    }

    const cycle = s.walkCycle;
    const armSwingAmp = isRun ? 0.85 : 0.45;
    const legStrideAmp = isRun ? 0.95 : 0.55;

    if (leftArmRef.current && rightArmRef.current) {
      if (isMoving) {
        leftArmRef.current.rotation.x = Math.sin(cycle) * armSwingAmp;
        rightArmRef.current.rotation.x = -Math.sin(cycle) * armSwingAmp;
        leftArmRef.current.rotation.z = 0.08 + (isRun ? 0.2 : 0.05);
        rightArmRef.current.rotation.z = -0.08 - (isRun ? 0.2 : 0.05);
      } else {
        // Idle arm breathing
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, dt * 8);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, dt * 8);
        leftArmRef.current.rotation.z = 0.06;
        rightArmRef.current.rotation.z = -0.06;
      }
    }

    if (leftLegRef.current && rightLegRef.current) {
      if (isMoving) {
        leftLegRef.current.rotation.x = -Math.sin(cycle) * legStrideAmp;
        rightLegRef.current.rotation.x = Math.sin(cycle) * legStrideAmp;
      } else {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, dt * 10);
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, dt * 10);
      }
    }

    // Subtle Torso Bobbing (Hip step bounce & idle breathing)
    if (torsoRef.current) {
      if (isMoving) {
        torsoRef.current.position.y = 0.88 + Math.abs(Math.sin(cycle * 2)) * (isRun ? 0.07 : 0.035);
        torsoRef.current.rotation.y = Math.sin(cycle) * (isRun ? 0.12 : 0.06);
      } else {
        torsoRef.current.position.y = 0.88 + Math.sin(state.clock.elapsedTime * 2.5) * 0.012;
        torsoRef.current.rotation.y = 0;
      }
    }

    // Update forward headlamp target for night exploration
    if (headlampRef.current && headlampTargetRef.current) {
      const fwdX = Math.sin(s.yaw);
      const fwdZ = Math.cos(s.yaw);
      headlampTargetRef.current.position.set(s.x + fwdX * 20, s.y + 0.8, s.z + fwdZ * 20);
    }

    // 7. Dynamic Camera Positioning based on Camera Mode
    if (cameraMode === 'fps') {
      // First-person view (eyes of the engineer)
      if (characterMeshGroupRef.current) characterMeshGroupRef.current.visible = false; // Hide body in FPS

      camera.fov = isRun ? 76 : 70;
      camera.near = 0.05;
      camera.updateProjectionMatrix();

      // Eye height at ~1.65m with subtle walking head bob
      const headBobY = isMoving ? Math.sin(cycle * 2) * (isRun ? 0.05 : 0.025) : 0;
      const eyeY = s.y + 1.62 + headBobY;

      camera.position.set(s.x, eyeY, s.z);
      camera.up.set(0, 1, 0);

      _walkLookTarget.set(
        s.x + Math.sin(s.yaw) * 10,
        eyeY - 0.2,
        s.z + Math.cos(s.yaw) * 10
      );
      camera.lookAt(_walkLookTarget);
    } else {
      // Third-person chase camera (trailing behind engineer's shoulders)
      if (characterMeshGroupRef.current) characterMeshGroupRef.current.visible = true;

      camera.fov = isRun ? 68 : 62;
      camera.near = 0.15;
      camera.updateProjectionMatrix();

      _walkLookTarget.set(s.x, s.y + 1.25, s.z);

      const idealDist = 3.6;
      const idealHeight = 1.95;

      _walkTargetCamPos.set(
        s.x - Math.sin(s.yaw) * idealDist,
        s.y + idealHeight,
        s.z - Math.cos(s.yaw) * idealDist
      );

      const groundAtCam = getTerrainHeight(_walkTargetCamPos.x, _walkTargetCamPos.z) + 0.6;
      if (_walkTargetCamPos.y < groundAtCam) _walkTargetCamPos.y = groundAtCam;

      if (isFirstFrame.current) {
        smoothCamPos.current.copy(_walkTargetCamPos);
        isFirstFrame.current = false;
      } else {
        smoothCamPos.current.lerp(_walkTargetCamPos, dt * 10.0);
      }

      camera.position.copy(smoothCamPos.current);
      camera.up.set(0, 1, 0);
      camera.lookAt(_walkLookTarget);
    }

    // 8. Export live stats for 2D Walk HUD Overlay (throttled to 20Hz / ~50ms)
    const now = state.clock.getElapsedTime();
    if (now - lastStatsEmit.current >= 0.05) {
      lastStatsEmit.current = now;
      const speedKmh = Math.abs(Math.round(s.velocity * 3.6));
      const headingDeg = Math.round((((s.yaw * 180) / Math.PI) % 360 + 360) % 360);
      const roundX = Math.round(s.x);
      const roundZ = Math.round(s.z);
      const roundY = Math.round(s.y);
      const distanceMeters = Math.round(s.totalDistance);

      const ps = prevStats.current;
      if (
        ps.speedKmh !== speedKmh ||
        ps.headingDeg !== headingDeg ||
        ps.x !== roundX ||
        ps.z !== roundZ ||
        ps.altitude !== roundY ||
        ps.isRunning !== isRun ||
        ps.distanceMeters !== distanceMeters
      ) {
        prevStats.current = {
          speedKmh,
          headingDeg,
          x: roundX,
          z: roundZ,
          altitude: roundY,
          isRunning: isRun,
          distanceMeters
        };

        onStatsUpdate({
          speedKmh,
          velocity: s.velocity,
          isRunning: isRun,
          isGrounded: s.isGrounded,
          headingDeg,
          x: roundX,
          z: roundZ,
          altitude: roundY,
          distanceMeters
        });
      }
    }
  });

  return (
    <>
      {/* Headlamp Spotlight Target */}
      <object3D ref={headlampTargetRef} position={[0, 0, 10]} />

      {/* Main Character Root Node */}
      <group ref={rootGroupRef}>
        <group ref={characterMeshGroupRef}>
          {/* Torso & Upper Body Group */}
          <group ref={torsoRef} position={[0, 0.88, 0]}>
            {/* Hi-Vis Safety Jacket / Torso */}
            <mesh material={mats.vestMat} castShadow receiveShadow>
              <boxGeometry args={[0.42, 0.52, 0.24]} />
            </mesh>

            {/* Horizontal Silver Reflective Stripe */}
            <mesh position={[0, 0.04, 0]} material={mats.reflectiveStripeMat}>
              <boxGeometry args={[0.43, 0.08, 0.25]} />
            </mesh>

            {/* Vertical Silver Reflective Harness Stripes */}
            <mesh position={[-0.11, 0.12, 0]} material={mats.reflectiveStripeMat}>
              <boxGeometry args={[0.06, 0.28, 0.25]} />
            </mesh>
            <mesh position={[0.11, 0.12, 0]} material={mats.reflectiveStripeMat}>
              <boxGeometry args={[0.06, 0.28, 0.25]} />
            </mesh>

            {/* Heavy-duty Utility Belt */}
            <group position={[0, -0.24, 0]}>
              <mesh material={mats.beltMat}>
                <boxGeometry args={[0.44, 0.07, 0.26]} />
              </mesh>
              {/* Radio pouch */}
              <mesh position={[0.16, 0.04, 0.12]} material={mats.visorMat}>
                <boxGeometry args={[0.08, 0.12, 0.06]} />
              </mesh>
            </group>

            {/* Neck & Head Group */}
            <group ref={headRef} position={[0, 0.38, 0]}>
              {/* Neck */}
              <mesh position={[0, -0.06, 0]} material={mats.skinMat}>
                <cylinderGeometry args={[0.08, 0.09, 0.08, 12]} />
              </mesh>

              {/* Stylized Head */}
              <mesh material={mats.skinMat} castShadow>
                <boxGeometry args={[0.22, 0.24, 0.22]} />
              </mesh>

              {/* Polarized Sunglasses / Visor */}
              <mesh position={[0, 0.02, 0.12]} material={mats.visorMat}>
                <boxGeometry args={[0.21, 0.08, 0.03]} />
              </mesh>

              {/* Industrial Safety Hard Hat */}
              <group position={[0, 0.13, 0]}>
                {/* Helmet Dome */}
                <mesh material={mats.helmetMat} castShadow>
                  <sphereGeometry args={[0.16, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                </mesh>
                {/* Helmet Brim */}
                <mesh position={[0, 0, 0.02]} rotation={[0.05, 0, 0]} material={mats.helmetMat}>
                  <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
                </mesh>
                {/* Front Headlamp Pod */}
                <mesh position={[0, 0.05, 0.16]} material={mats.lampMat}>
                  <boxGeometry args={[0.06, 0.04, 0.03]} />
                </mesh>

                {/* Night-time Active Headlamp Spotlight */}
                <spotLight
                  ref={headlampRef}
                  target={headlampTargetRef.current}
                  position={[0, 0.06, 0.18]}
                  color="#fef08a"
                  intensity={isNight ? 2.8 : 0.6}
                  distance={35}
                  angle={Math.PI / 4.5}
                  penumbra={0.35}
                  castShadow
                />
              </group>
            </group>

            {/* LEFT ARM */}
            <group ref={leftArmRef} position={[-0.26, 0.18, 0]}>
              <mesh position={[0, -0.22, 0]} material={mats.vestMat} castShadow>
                <boxGeometry args={[0.11, 0.44, 0.12]} />
              </mesh>
              {/* Hand / Glove */}
              <mesh position={[0, -0.47, 0]} material={mats.skinMat}>
                <boxGeometry args={[0.09, 0.1, 0.1]} />
              </mesh>
            </group>

            {/* RIGHT ARM */}
            <group ref={rightArmRef} position={[0.26, 0.18, 0]}>
              <mesh position={[0, -0.22, 0]} material={mats.vestMat} castShadow>
                <boxGeometry args={[0.11, 0.44, 0.12]} />
              </mesh>
              {/* Hand / Glove */}
              <mesh position={[0, -0.47, 0]} material={mats.skinMat}>
                <boxGeometry args={[0.09, 0.1, 0.1]} />
              </mesh>
            </group>
          </group>

          {/* Hips & Legs Group */}
          {/* LEFT LEG */}
          <group ref={leftLegRef} position={[-0.12, 0.58, 0]}>
            {/* Work Pants Leg */}
            <mesh position={[0, -0.24, 0]} material={mats.pantsMat} castShadow>
              <boxGeometry args={[0.15, 0.48, 0.16]} />
            </mesh>
            {/* Heavy Work Boot */}
            <group position={[0, -0.52, 0.03]}>
              <mesh material={mats.bootsMat} castShadow receiveShadow>
                <boxGeometry args={[0.16, 0.12, 0.22]} />
              </mesh>
              {/* Boot Cap */}
              <mesh position={[0, -0.02, 0.05]} material={mats.beltMat}>
                <boxGeometry args={[0.162, 0.08, 0.12]} />
              </mesh>
            </group>
          </group>

          {/* RIGHT LEG */}
          <group ref={rightLegRef} position={[0.12, 0.58, 0]}>
            <mesh position={[0, -0.24, 0]} material={mats.pantsMat} castShadow>
              <boxGeometry args={[0.15, 0.48, 0.16]} />
            </mesh>
            <group position={[0, -0.52, 0.03]}>
              <mesh material={mats.bootsMat} castShadow receiveShadow>
                <boxGeometry args={[0.16, 0.12, 0.22]} />
              </mesh>
              <mesh position={[0, -0.02, 0.05]} material={mats.beltMat}>
                <boxGeometry args={[0.162, 0.08, 0.12]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </>
  );
}

