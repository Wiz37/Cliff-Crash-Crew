export type VehicleCategory = 'CLASSICS' | 'CONSTRUCTION' | 'SUPERCARS' | 'SEMIS';

export interface VehicleSpec {
  id: string;
  name: string;
  category: VehicleCategory;
  price: number;
  bodyColor: number;
  accentColor: number;
  power: number;
  spin: number;
  mass: number;
  length: number;
  height: number;
  wheelScale: number;
  description: string;
}

export const VEHICLES: VehicleSpec[] = [
  { id: 'buggy', name: 'BOUNCE BUGGY', category: 'CLASSICS', price: 0, bodyColor: 0xff5cab, accentColor: 0xffd43b, power: 1, spin: 1.14, mass: 1, length: 1, height: 1, wheelScale: 1, description: 'Easy flips and giant bounces.' },
  { id: 'bus', name: 'CHONKY BUS', category: 'CLASSICS', price: 90, bodyColor: 0xffd43b, accentColor: 0x58ddff, power: 0.94, spin: 0.72, mass: 1.35, length: 1.2, height: 1.14, wheelScale: 1.05, description: 'Heavy enough to flatten towers.' },
  { id: 'rocket', name: 'ROCKET VAN', category: 'CLASSICS', price: 180, bodyColor: 0x58ddff, accentColor: 0xff8a34, power: 1.18, spin: 1, mass: 1.05, length: 1.1, height: 1, wheelScale: 1, description: 'Fast launch with wild landings.' },
  { id: 'banana', name: 'BANANA BLASTER', category: 'CLASSICS', price: 320, bodyColor: 0xffe74a, accentColor: 0x6fdb66, power: 1.12, spin: 1.34, mass: 0.9, length: 1.05, height: 0.92, wheelScale: 0.94, description: 'A ridiculous flip machine.' },
  { id: 'dozer', name: 'DOZER DASHER', category: 'CONSTRUCTION', price: 450, bodyColor: 0xf7b731, accentColor: 0xffdd59, power: 1.02, spin: 0.76, mass: 1.55, length: 1.32, height: 1.08, wheelScale: 1.08, description: 'A giant blade built for destruction.' },
  { id: 'excavator', name: 'MEGA DIGGER', category: 'CONSTRUCTION', price: 620, bodyColor: 0xffa94d, accentColor: 0xdbe4ff, power: 0.99, spin: 0.88, mass: 1.45, length: 1.24, height: 1.15, wheelScale: 1.06, description: 'The boom arm makes every crash weird.' },
  { id: 'dump', name: 'DUMP CRUSHER', category: 'CONSTRUCTION', price: 820, bodyColor: 0xff922b, accentColor: 0x74c0fc, power: 1.08, spin: 0.67, mass: 1.75, length: 1.44, height: 1.2, wheelScale: 1.08, description: 'Huge dump bed. Huge impact bonus.' },
  { id: 'supercar', name: 'TURBO TIGER', category: 'SUPERCARS', price: 1050, bodyColor: 0xff4d6d, accentColor: 0xf8f9fa, power: 1.29, spin: 1.2, mass: 0.88, length: 1.28, height: 0.78, wheelScale: 0.92, description: 'Low, fast, flashy, and loud.' },
  { id: 'hypercar', name: 'NEON HYPER GT', category: 'SUPERCARS', price: 1380, bodyColor: 0x7b61ff, accentColor: 0x68f5ff, power: 1.37, spin: 1.3, mass: 0.82, length: 1.32, height: 0.74, wheelScale: 0.9, description: 'Maximum speed and ridiculous flips.' },
  { id: 'semi', name: 'BIG RIG BLAST', category: 'SEMIS', price: 1750, bodyColor: 0x3bc9db, accentColor: 0xf1f3f5, power: 1.14, spin: 0.56, mass: 2, length: 1.78, height: 1.08, wheelScale: 1.08, description: 'Monster momentum in a classic semi.' },
  { id: 'hauler', name: 'MEGA HAULER', category: 'SEMIS', price: 2200, bodyColor: 0x69db7c, accentColor: 0xffd43b, power: 1.22, spin: 0.48, mass: 2.35, length: 2.05, height: 1.14, wheelScale: 1.12, description: 'The longest, heaviest tower bulldozer.' },
];

export const VEHICLE_CATEGORIES: VehicleCategory[] = ['CLASSICS', 'CONSTRUCTION', 'SUPERCARS', 'SEMIS'];

export function getVehicle(id: string): VehicleSpec {
  return VEHICLES.find((vehicle) => vehicle.id === id) ?? VEHICLES[0];
}
