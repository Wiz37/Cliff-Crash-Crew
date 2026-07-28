import Phaser from 'phaser';
import { VEHICLES, VEHICLE_CATEGORIES, getVehicle, type VehicleCategory, type VehicleSpec } from '../data/vehicles';
import { SaveService } from '../services/SaveService';
import { ensureMusic, playSfx } from '../services/AudioService';
import { HapticsService } from '../services/HapticsService';
import { createBackdrop } from '../ui/Backdrop';
import { createButton } from '../ui/Button';
import { createVehicleDisplay } from '../ui/VehicleDisplay';
import { COLORS, labelStyle, titleStyle } from '../ui/theme';

export class GarageScene extends Phaser.Scene {
  private category: VehicleCategory = 'CLASSICS';
  private index = 0;
  private detailLayer?: Phaser.GameObjects.Container;
  private starsLabel?: Phaser.GameObjects.Text;
  private categoryLayer?: Phaser.GameObjects.Container;

  constructor() {
    super('Garage');
  }

  create(): void {
    createBackdrop(this);
    ensureMusic(this);

    const save = SaveService.get();
    const selected = getVehicle(save.selectedVehicle);
    this.category = selected.category;
    this.index = Math.max(0, this.filteredVehicles.findIndex((vehicle) => vehicle.id === selected.id));

    const header = this.add.graphics();
    header.fillStyle(COLORS.ink, 0.91);
    header.fillRoundedRect(46, 52, 988, 214, 48);
    header.lineStyle(7, COLORS.cream, 0.9);
    header.strokeRoundedRect(46, 52, 988, 214, 48);
    this.add.text(540, 124, 'CRASH GARAGE', titleStyle(74)).setOrigin(0.5);
    this.starsLabel = this.add.text(540, 220, `★ ${save.stars.toLocaleString()}`, labelStyle(38, '#ffd43b')).setOrigin(0.5);

    this.buildCategoryTabs();

    createButton(this, 120, 1788, '‹', () => this.previousVehicle(), { width: 145, height: 112, color: COLORS.cyan, fontSize: 72 });
    createButton(this, 960, 1788, '›', () => this.nextVehicle(), { width: 145, height: 112, color: COLORS.cyan, fontSize: 72 });
    createButton(this, 540, 1832, 'HOME', () => {
      playSfx(this, 'click', { volume: 0.6 });
      this.scene.start('Menu');
    }, { width: 430, height: 104, color: COLORS.purple, fontSize: 38 });

    this.input.keyboard?.on('keydown-LEFT', () => this.previousVehicle());
    this.input.keyboard?.on('keydown-RIGHT', () => this.nextVehicle());
    this.rebuildDetails();
  }

  private buildCategoryTabs(): void {
    this.categoryLayer?.destroy(true);
    const layer = this.add.container(0, 0).setDepth(20);
    this.categoryLayer = layer;
    VEHICLE_CATEGORIES.forEach((category, categoryIndex) => {
      const x = 156 + categoryIndex * 256;
      const color = category === this.category ? COLORS.pink : COLORS.ink;
      const button = createButton(this, x, 340, category, () => {
        if (this.category === category) return;
        this.category = category;
        this.index = 0;
        playSfx(this, 'click', { volume: 0.55 });
        HapticsService.selection();
        this.buildCategoryTabs();
        this.rebuildDetails();
      }, { width: 230, height: 82, color, fontSize: 24 });
      button.setScale(0.96);
      layer.add(button);
    });
  }

  private get filteredVehicles(): VehicleSpec[] {
    return VEHICLES.filter((vehicle) => vehicle.category === this.category);
  }

  private previousVehicle(): void {
    this.index = Phaser.Math.Wrap(this.index - 1, 0, this.filteredVehicles.length);
    playSfx(this, 'click', { volume: 0.45, rate: 0.92 });
    HapticsService.selection();
    this.rebuildDetails();
  }

  private nextVehicle(): void {
    this.index = Phaser.Math.Wrap(this.index + 1, 0, this.filteredVehicles.length);
    playSfx(this, 'click', { volume: 0.45, rate: 1.08 });
    HapticsService.selection();
    this.rebuildDetails();
  }

  private rebuildDetails(): void {
    this.detailLayer?.destroy(true);
    const vehicle = this.filteredVehicles[this.index] ?? this.filteredVehicles[0];
    const save = SaveService.get();
    const unlocked = save.unlockedVehicles.includes(vehicle.id);
    const selected = save.selectedVehicle === vehicle.id;
    const layer = this.add.container(0, 0);
    this.detailLayer = layer;

    const card = this.add.graphics();
    card.fillStyle(COLORS.ink, 0.9);
    card.fillRoundedRect(84, 430, 912, 1230, 56);
    card.lineStyle(8, vehicle.accentColor, 1);
    card.strokeRoundedRect(84, 430, 912, 1230, 56);
    card.fillStyle(vehicle.bodyColor, 0.22);
    card.fillRoundedRect(112, 458, 856, 430, 44);
    layer.add(card);

    const spotlight = this.add.ellipse(540, 730, 710, 250, vehicle.accentColor, 0.2);
    spotlight.setBlendMode(Phaser.BlendModes.ADD);
    layer.add(spotlight);
    const preview = createVehicleDisplay(this, vehicle, 540, 690, 1.55);
    layer.add(preview);
    this.tweens.add({ targets: preview, y: 668, angle: -2, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const name = this.add.text(540, 960, vehicle.name, titleStyle(58)).setOrigin(0.5);
    const category = this.add.text(540, 1026, vehicle.category, labelStyle(28, Phaser.Display.Color.IntegerToColor(vehicle.accentColor).rgba)).setOrigin(0.5);
    const description = this.add.text(540, 1108, vehicle.description, {
      ...labelStyle(31),
      wordWrap: { width: 740 },
      lineSpacing: 12,
    }).setOrigin(0.5);
    layer.add([name, category, description]);

    const stats = [
      ['SPEED', Phaser.Math.Clamp(vehicle.power / 1.4, 0, 1), COLORS.pink],
      ['FLIPS', Phaser.Math.Clamp(vehicle.spin / 1.4, 0, 1), COLORS.cyan],
      ['SMASH', Phaser.Math.Clamp(vehicle.mass / 2.4, 0, 1), COLORS.orange],
    ] as const;
    stats.forEach(([label, value, color], row) => {
      const y = 1226 + row * 98;
      const statLabel = this.add.text(178, y, label, labelStyle(29)).setOrigin(0, 0.5);
      const track = this.add.graphics();
      track.fillStyle(0x050611, 0.68);
      track.fillRoundedRect(360, y - 22, 510, 44, 22);
      track.fillStyle(color, 1);
      track.fillRoundedRect(370, y - 12, 490 * value, 24, 12);
      track.lineStyle(4, COLORS.cream, 0.75);
      track.strokeRoundedRect(360, y - 22, 510, 44, 22);
      layer.add([statLabel, track]);
    });

    const actionLabel = unlocked ? (selected ? 'SELECTED' : 'USE VEHICLE') : `UNLOCK  ★ ${vehicle.price}`;
    const actionColor = selected ? COLORS.purple : unlocked ? COLORS.pink : COLORS.yellow;
    const action = createButton(this, 540, 1550, actionLabel, () => {
      if (selected) return;
      if (unlocked) {
        SaveService.update({ selectedVehicle: vehicle.id });
        playSfx(this, 'click', { volume: 0.7 });
        HapticsService.success();
        this.rebuildDetails();
        return;
      }
      if (!SaveService.spendStars(vehicle.price)) {
        const text = action.getData('label') as Phaser.GameObjects.Text;
        text.setText('NEED MORE STARS');
        this.tweens.add({ targets: action, x: { from: 526, to: 554 }, duration: 50, yoyo: true, repeat: 4 });
        HapticsService.impact();
        return;
      }
      SaveService.unlockVehicle(vehicle.id);
      playSfx(this, 'star', { volume: 0.85 });
      HapticsService.success();
      this.starsLabel?.setText(`★ ${SaveService.get().stars.toLocaleString()}`);
      this.rebuildDetails();
    }, { width: 690, height: 126, color: actionColor, fontSize: 43 });
    layer.add(action);

    const counter = this.add.text(540, 1710, `${this.index + 1} / ${this.filteredVehicles.length}`, labelStyle(28, '#151629')).setOrigin(0.5).setStroke('#fff6d5', 4);
    layer.add(counter);
    layer.setDepth(10);
  }
}
