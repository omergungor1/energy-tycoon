'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * 360-Degree Analog Virtual Joystick for Mobile Touch Controls
 * Smooth drag navigation with deadzone, normalized outputs, and visual feedback.
 */
export default function VirtualJoystick({ onMove, color = 'cyan', className = '' }) {
  const containerRef = useRef(null);
  const activePointerId = useRef(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);

  // Maximum distance the knob center can travel from the base center (in pixels)
  const MAX_RADIUS = 36;
  const DEADZONE = 0.18;

  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    activePointerId.current = e.pointerId;
    setIsPressed(true);
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    updateKnob(e.clientX, e.clientY);
  };

  const resetKnob = () => {
    activePointerId.current = null;
    setIsPressed(false);
    setKnobPos({ x: 0, y: 0 });
    if (onMoveRef.current) {
      onMoveRef.current({
        forward: false,
        backward: false,
        left: false,
        right: false,
        steerAxis: 0,
        forwardAxis: 0,
        x: 0,
        y: 0
      });
    }
  };

  const handlePointerUp = (e) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    resetKnob();
  };

  const updateKnob = (clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let clampedX = dx;
    let clampedY = dy;
    if (dist > MAX_RADIUS) {
      clampedX = (dx / dist) * MAX_RADIUS;
      clampedY = (dy / dist) * MAX_RADIUS;
    }

    setKnobPos({ x: clampedX, y: clampedY });

    // Normalized values from -1.0 to 1.0
    const normX = clampedX / MAX_RADIUS;
    const normY = -clampedY / MAX_RADIUS; // Invert screen Y so upward is forward (+1.0)
    const normDist = Math.min(1, dist / MAX_RADIUS);

    if (normDist < DEADZONE) {
      if (onMoveRef.current) {
        onMoveRef.current({
          forward: false,
          backward: false,
          left: false,
          right: false,
          steerAxis: 0,
          forwardAxis: 0,
          x: 0,
          y: 0
        });
      }
      return;
    }

    const forward = normY > DEADZONE;
    const backward = normY < -DEADZONE;
    const left = normX < -DEADZONE;
    const right = normX > DEADZONE;

    if (onMoveRef.current) {
      onMoveRef.current({
        forward,
        backward,
        left,
        right,
        steerAxis: normX,
        forwardAxis: normY,
        x: normX,
        y: normY
      });
    }
  };

  // Safety cleanup only on unmount
  useEffect(() => {
    return () => {
      if (onMoveRef.current) {
        onMoveRef.current({
          forward: false,
          backward: false,
          left: false,
          right: false,
          steerAxis: 0,
          forwardAxis: 0,
          x: 0,
          y: 0
        });
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
      className={`relative w-[108px] h-[108px] rounded-full bg-slate-900/85 border-2 border-slate-700/80 backdrop-blur-xl shadow-2xl flex items-center justify-center touch-none select-none cursor-pointer transition-colors ${
        isPressed ? 'border-cyan-500/70 shadow-cyan-500/20' : ''
      } ${className}`}
    >
      {/* Outer Guide Markings (Direction crosshairs & arrows) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Subtle Crosshair Axis Lines */}
        <div className="w-full h-px bg-slate-800/80 absolute top-1/2 -translate-y-1/2" />
        <div className="h-full w-px bg-slate-800/80 absolute left-1/2 -translate-x-1/2" />

        {/* Directional Chevron Dots / Labels */}
        <span className="absolute top-1 text-[8px] font-bold text-slate-500">▲</span>
        <span className="absolute bottom-1 text-[8px] font-bold text-slate-500">▼</span>
        <span className="absolute left-1.5 text-[8px] font-bold text-slate-500">◀</span>
        <span className="absolute right-1.5 text-[8px] font-bold text-slate-500">▶</span>

        {/* Inner Deadzone Ring */}
        <div className="w-9 h-9 rounded-full border border-slate-700/50" />
      </div>

      {/* Draggable Analog Thumbstick Knob */}
      <div
        className={`w-11 h-11 rounded-full border-2 transition-transform duration-75 flex items-center justify-center pointer-events-none shadow-xl ${
          isPressed
            ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 border-cyan-200 text-white shadow-cyan-500/50 scale-105'
            : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-500 text-slate-300 shadow-slate-950/60'
        }`}
        style={{
          transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`
        }}
      >
        {/* Central Core Pip */}
        <div
          className={`w-3 h-3 rounded-full ${
            isPressed ? 'bg-white shadow-sm shadow-white' : 'bg-slate-400/80'
          }`}
        />
      </div>
    </div>
  );
}

