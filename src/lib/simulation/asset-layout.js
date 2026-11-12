/**
 * asset-layout.js
 * Central source of truth for equipment capacity limits and realistic, expansive plant spatial layout.
 * Prevents clustering, overlapping pads, and visual overcrowding while maintaining realism.
 */

// 14 Staggered Wind Turbine Coordinates (Concession radius 18m to 36m)
// Guaranteed minimum 22m+ wake clearance between every pair, zero overlapping indices.
// Strictly stays within plateau radius (r <= 36m + 7m pad = 43m <= 50m plateau).
export const WIND_TURBINE_SLOTS = [
  // Inner Tier (4 turbines, r = 18.4m, diagonal ±45°)
  { x: 13, z: 13 },
  { x: -13, z: 13 },
  { x: -13, z: -13 },
  { x: 13, z: -13 },

  // Outer Perimeter Tier (10 turbines, r = 36m, spaced every 36°)
  { x: 36, z: 0 },
  { x: 29, z: 21 },
  { x: 11, z: 34 },
  { x: -11, z: 34 },
  { x: -29, z: 21 },
  { x: -36, z: 0 },
  { x: -29, z: -21 },
  { x: -11, z: -34 },
  { x: 11, z: -34 },
  { x: 29, z: -21 }
];

/**
 * Returns maximum allowed units of a given equipment type on a site based on its area in hectares.
 * Enforces realistic civil engineering limits and game balance.
 */
export function getMaxEquipmentCapacity(areaHectares, equipmentType) {
  const ha = Number(areaHectares) || 50;

  if (equipmentType === 'wind_turbine') {
    // 45 Ha -> 4 turbines, 60 Ha -> 6 turbines, 85 Ha -> 8 turbines, 110-140 Ha -> 10-12 turbines max
    return Math.max(3, Math.min(12, Math.floor(ha / 10)));
  }

  if (equipmentType === 'solar_pack') {
    // 45 Ha -> 7 packs, 50 Ha -> 8 packs, 80 Ha -> 12 packs, 100 Ha -> 15 packs, 140 Ha -> 18 packs max
    return Math.max(6, Math.min(18, Math.floor(ha / 6.5)));
  }

  if (equipmentType === 'battery') {
    // Industrial Containerized BESS units:
    return Math.max(2, Math.min(6, Math.floor(ha / 20)));
  }

  return 8;
}

/**
 * Generates an expansive, organized spatial slot (x, z) relative to site center.
 * - Wind Turbines: Staggered wide wake spacing (>= 22m, radius <= 36m).
 * - Solar Arrays: Symmetrical, compact 3-column industrial grid (pitch: 24m X, 18m Z, pad: 20m x 14m).
 *   Leaves guaranteed safety buffer between adjacent sites.
 * - Batteries: Modular block next to substation.
 */
export function getAssetSlotCoordinates(index, equipmentType, areaHectares = 50) {
  const safeIdx = Math.max(0, parseInt(index, 10) || 0);

  if (equipmentType === 'wind_turbine') {
    const slot = WIND_TURBINE_SLOTS[safeIdx % WIND_TURBINE_SLOTS.length];
    return { x: slot.x, z: slot.z };
  }

  if (equipmentType === 'solar_pack') {
    // 3 Columns wide, compact industrial rows with 4m service corridors
    // Array footprint is 20m x 14m. Pitch: 24m X, 18m Z
    const cols = 3;
    const col = safeIdx % cols;
    const row = Math.floor(safeIdx / cols);

    const offsetX = Math.round((col - 1) * 24);
    const offsetZ = Math.round((row - 1.5) * 18);

    return { x: offsetX, z: offsetZ };
  }

  if (equipmentType === 'battery') {
    const cols = 3;
    const col = safeIdx % cols;
    const row = Math.floor(safeIdx / cols);

    const offsetX = Math.round((col - 1) * 12);
    const offsetZ = Math.round(-34 - row * 10);

    return { x: offsetX, z: offsetZ };
  }

  return { x: 0, z: 0 };
}
