import Phaser from 'phaser';
import type { VehicleSpec } from '../data/vehicles';

export function createVehicleDisplay(
  scene: Phaser.Scene,
  spec: VehicleSpec,
  x: number,
  y: number,
  scale = 1,
): Phaser.GameObjects.Container {
  const chassis = scene.add.image(0, 0, `vehicle-${spec.id}`).setScale(0.8 * scale);
  const wheelScale = 0.54 * scale * spec.wheelScale;
  const width = Math.min(350, 250 * spec.length) * scale;
  const wheelY = (40 + 11 * spec.height) * scale;
  const parts: Phaser.GameObjects.GameObject[] = [chassis];

  const wheelPositions = spec.category === 'SEMIS'
    ? [-width * 0.32, -width * 0.02, width * 0.22, width * 0.39]
    : spec.id === 'bus' || spec.id === 'dump'
      ? [-width * 0.3, 0, width * 0.3]
      : [-width * 0.3, width * 0.3];

  wheelPositions.forEach((wheelX) => {
    const wheel = scene.add.image(wheelX, wheelY, 'wheel').setScale(wheelScale);
    parts.push(wheel);
  });

  return scene.add.container(x, y, parts);
}
