import Phaser from 'phaser';
import { CHALLENGES, type Challenge } from '../data/challenges';
import { getVehicle } from '../data/vehicles';
import { VehicleRig } from '../objects/VehicleRig';
import { SaveService } from '../services/SaveService';
import { HapticsService } from '../services/HapticsService';
import { playSfx, setEngineIntensity, startEngine, stopEngine } from '../services/AudioService';
import { createBackdrop } from '../ui/Backdrop';
import { createButton } from '../ui/Button';
import { COLORS, labelStyle } from '../ui/theme';

interface ResultPayload {
  score: number;
  distance: number;
  flips: number;
  blocks: number;
  stars: number;
  challenge: string;
  challengeComplete: boolean;
  vehicleId: string;
  newBest: boolean;
}

export class GameScene extends Phaser.Scene {
  private rig?: VehicleRig;
  private challenge!: Challenge;
  private launched = false;
  private charging = false;
  private charge = 0.08;
  private chargeDirection = 1;
  private runTime = 0;
  private settleTime = 0;
  private score = 0;
  private distance = 0;
  private flips = 0;
  private blocksBroken = 0;
  private rotationTotal = 0;
  private previousRotation = 0;
  private challengeComplete = false;
  private airDirection = 0;
  private ending = false;
  private lastImpactAt = 0;
  private startX = 260;
  private scoreLabel?: Phaser.GameObjects.Text;
  private bestLabel?: Phaser.GameObjects.Text;
  private challengeLabel?: Phaser.GameObjects.Text;
  private chargeFill?: Phaser.GameObjects.Graphics;
  private chargePanel?: Phaser.GameObjects.Container;
  private rotateControls: Phaser.GameObjects.Container[] = [];
  private blockBodies: Phaser.Physics.Matter.Image[] = [];

  constructor() {
    super('Game');
  }

  create(): void {
    this.resetState();
    createBackdrop(this);
    this.matter.world.setBounds(0, 0, 6200, 2280, 220, true, true, false, true);
    this.createTerrain();
    this.createTower(1740, 1694, 7, 5);
    this.createTower(2840, 1694, 5, 4);

    const save = SaveService.get();
    const spec = getVehicle(save.selectedVehicle);
    this.rig = new VehicleRig(this, this.startX, 1420, spec);
    this.previousRotation = this.rig.rotation;

    this.cameras.main.setBounds(0, 0, 6200, 1920);
    this.cameras.main.startFollow(this.rig.chassis, true, 0.075, 0.075, -180, 110);
    this.cameras.main.setZoom(1);

    this.challenge = Phaser.Utils.Array.GetRandom(CHALLENGES);
    this.buildHud();
    this.bindInput();
    this.bindCollisions();
    startEngine(this);
    setEngineIntensity(this, 0.05);
  }

  private resetState(): void {
    this.launched = false;
    this.charging = false;
    this.charge = 0.08;
    this.chargeDirection = 1;
    this.runTime = 0;
    this.settleTime = 0;
    this.score = 0;
    this.distance = 0;
    this.flips = 0;
    this.blocksBroken = 0;
    this.rotationTotal = 0;
    this.challengeComplete = false;
    this.airDirection = 0;
    this.ending = false;
    this.lastImpactAt = 0;
    this.blockBodies = [];
    this.rotateControls = [];
    this.matter.world.engine.timing.timeScale = 1;
  }

  private createTerrain(): void {
    const terrain = this.add.graphics().setDepth(4);
    terrain.fillStyle(COLORS.grassDark, 1);
    terrain.fillRect(-200, 1490, 980, 500);
    terrain.fillStyle(COLORS.grass, 1);
    terrain.fillRect(-200, 1480, 980, 34);

    terrain.fillStyle(COLORS.grassDark, 1);
    terrain.beginPath();
    terrain.moveTo(500, 1490);
    terrain.lineTo(890, 1035);
    terrain.lineTo(1018, 1055);
    terrain.lineTo(720, 1490);
    terrain.closePath();
    terrain.fillPath();
    terrain.lineStyle(18, COLORS.grass, 1);
    terrain.lineBetween(500, 1488, 900, 1030);
    terrain.lineBetween(900, 1030, 1025, 1054);

    terrain.fillStyle(0x3a8f4e, 1);
    terrain.fillRect(1030, 1730, 4650, 520);
    terrain.fillStyle(COLORS.grass, 1);
    terrain.fillRect(1030, 1704, 4650, 36);

    terrain.fillStyle(0x2e6d3d, 1);
    terrain.fillTriangle(2260, 1705, 2500, 1460, 2700, 1705);
    terrain.lineStyle(16, COLORS.grass, 1);
    terrain.lineBetween(2260, 1705, 2500, 1460);
    terrain.lineBetween(2500, 1460, 2700, 1705);

    terrain.fillStyle(0x285f38, 1);
    terrain.fillTriangle(3520, 1705, 3710, 1525, 3870, 1705);
    terrain.lineStyle(16, COLORS.grass, 1);
    terrain.lineBetween(3520, 1705, 3710, 1525);
    terrain.lineBetween(3710, 1525, 3870, 1705);

    terrain.fillStyle(0x203d31, 1);
    for (let x = 1180; x < 5600; x += 320) {
      terrain.fillCircle(x, 1748, 24);
      terrain.fillCircle(x + 45, 1753, 16);
    }

    const upperGround = this.matter.add.rectangle(260, 1620, 1050, 280, { isStatic: true, label: 'ground' });
    const ramp = this.matter.add.rectangle(748, 1275, 610, 82, { isStatic: true, angle: -0.86, label: 'ground' });
    const lip = this.matter.add.rectangle(970, 1072, 185, 68, { isStatic: true, angle: 0.08, label: 'ground' });
    const lowerGround = this.matter.add.rectangle(3300, 1840, 4850, 250, { isStatic: true, label: 'ground' });
    const bumpOne = this.matter.add.rectangle(2480, 1596, 350, 60, { isStatic: true, angle: -0.66, label: 'ground' });
    const bumpTwo = this.matter.add.rectangle(3700, 1620, 260, 54, { isStatic: true, angle: -0.62, label: 'ground' });
    [upperGround, ramp, lip, lowerGround, bumpOne, bumpTwo].forEach((body) => {
      body.friction = 0.92;
      body.restitution = 0.18;
    });

    const warning = this.add.text(1060, 960, 'MEGA DROP', labelStyle(38, '#ff4d86')).setRotation(-0.08).setDepth(5);
    warning.setStroke('#151629', 8);
  }

  private createTower(startX: number, floorY: number, rows: number, maxColumns: number): void {
    const colors = [0xff5cab, 0x58ddff, 0xffd43b, 0x7b61ff, 0x69db7c, 0xff922b];
    const blockWidth = 98;
    const blockHeight = 70;

    for (let row = 0; row < rows; row += 1) {
      const columns = Math.max(2, maxColumns - (row % 2));
      const rowWidth = columns * blockWidth;
      const offset = row % 2 === 0 ? 0 : blockWidth * 0.5;
      for (let column = 0; column < columns; column += 1) {
        const x = startX - rowWidth * 0.5 + column * blockWidth + blockWidth * 0.5 + offset;
        const y = floorY - blockHeight * 0.5 - row * (blockHeight - 2);
        const block = this.matter.add.image(x, y, 'block', undefined, {
          restitution: 0.3,
          friction: 0.72,
          frictionAir: 0.012,
          density: 0.0028,
          sleepThreshold: 42,
        });
        block.setDisplaySize(blockWidth, blockHeight);
        block.setRectangle(blockWidth - 8, blockHeight - 6, { chamfer: { radius: 8 } });
        block.setTint(colors[(row + column) % colors.length]);
        block.setDepth(20 + row);
        block.setData('breakable', true);
        block.setData('broken', false);
        block.setData('baseColor', block.tintTopLeft);
        (block.body as MatterJS.BodyType).label = 'breakable-block';
        this.blockBodies.push(block);
      }
    }
  }

  private buildHud(): void {
    const save = SaveService.get();
    const panel = this.add.graphics().setScrollFactor(0).setDepth(200);
    panel.fillStyle(COLORS.ink, 0.9);
    panel.fillRoundedRect(34, 34, 1012, 154, 42);
    panel.lineStyle(6, COLORS.cream, 0.85);
    panel.strokeRoundedRect(34, 34, 1012, 154, 42);

    this.scoreLabel = this.add.text(194, 108, 'SCORE\n0', labelStyle(28)).setOrigin(0.5).setScrollFactor(0).setDepth(201).setLineSpacing(5);
    this.bestLabel = this.add.text(540, 108, `BEST\n${save.bestScore.toLocaleString()}`, labelStyle(28)).setOrigin(0.5).setScrollFactor(0).setDepth(201).setLineSpacing(5);
    this.add.text(880, 108, `STARS\n★ ${save.stars.toLocaleString()}`, labelStyle(28, '#ffd43b')).setOrigin(0.5).setScrollFactor(0).setDepth(201).setLineSpacing(5);

    const challengePanel = this.add.graphics().setScrollFactor(0).setDepth(200);
    challengePanel.fillStyle(COLORS.ink, 0.84);
    challengePanel.fillRoundedRect(190, 214, 700, 82, 38);
    challengePanel.lineStyle(5, COLORS.cyan, 1);
    challengePanel.strokeRoundedRect(190, 214, 700, 82, 38);
    this.challengeLabel = this.add.text(540, 255, this.challenge.label, labelStyle(31)).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    const chargeBackground = this.add.graphics();
    chargeBackground.fillStyle(COLORS.ink, 0.9);
    chargeBackground.fillRoundedRect(-390, -64, 780, 128, 45);
    chargeBackground.lineStyle(7, COLORS.cream, 0.9);
    chargeBackground.strokeRoundedRect(-390, -64, 780, 128, 45);
    const chargeTitle = this.add.text(0, -112, 'HOLD TO CHARGE • RELEASE TO LAUNCH', labelStyle(30)).setOrigin(0.5);
    this.chargeFill = this.add.graphics();
    this.chargePanel = this.add.container(540, 1640, [chargeBackground, this.chargeFill, chargeTitle]).setScrollFactor(0).setDepth(205);
    this.drawChargeBar();

    const left = createButton(this, 170, 1700, '↶', () => undefined, { width: 250, height: 170, color: COLORS.cyan, fontSize: 92 });
    const right = createButton(this, 910, 1700, '↷', () => undefined, { width: 250, height: 170, color: COLORS.pink, fontSize: 92 });
    [left, right].forEach((button) => button.setScrollFactor(0).setDepth(205).setVisible(false));
    left.on('pointerdown', () => { this.airDirection = -1; });
    left.on('pointerup', () => { if (this.airDirection < 0) this.airDirection = 0; });
    left.on('pointerout', () => { if (this.airDirection < 0) this.airDirection = 0; });
    right.on('pointerdown', () => { this.airDirection = 1; });
    right.on('pointerup', () => { if (this.airDirection > 0) this.airDirection = 0; });
    right.on('pointerout', () => { if (this.airDirection > 0) this.airDirection = 0; });
    this.rotateControls = [left, right];
  }

  private bindInput(): void {
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (this.launched || this.ending || currentlyOver.length > 0) return;
      this.charging = true;
      setEngineIntensity(this, this.charge);
    });

    this.input.on('pointerup', () => {
      if (!this.charging || this.launched || this.ending) return;
      this.launchVehicle();
    });

    const keyboard = this.input.keyboard;
    keyboard?.on('keydown-SPACE', (event: KeyboardEvent) => {
      event.preventDefault();
      if (!event.repeat && !this.launched) this.charging = true;
    });
    keyboard?.on('keyup-SPACE', (event: KeyboardEvent) => {
      event.preventDefault();
      if (this.charging && !this.launched) this.launchVehicle();
    });
    keyboard?.on('keydown-LEFT', () => { this.airDirection = -1; });
    keyboard?.on('keyup-LEFT', () => { if (this.airDirection < 0) this.airDirection = 0; });
    keyboard?.on('keydown-RIGHT', () => { this.airDirection = 1; });
    keyboard?.on('keyup-RIGHT', () => { if (this.airDirection > 0) this.airDirection = 0; });
  }

  private launchVehicle(): void {
    if (!this.rig || this.launched) return;
    this.launched = true;
    this.charging = false;
    const power = (0.7 + this.charge * 0.62) * this.rig.spec.power;
    this.rig.launch(19.5 * power, -21.5 * power);
    this.chargePanel?.setVisible(false);
    this.rotateControls.forEach((control) => control.setVisible(true));
    playSfx(this, 'launch', { volume: 0.92, rate: 0.9 + this.charge * 0.28 });
    HapticsService.impact();
    this.explodeParticles(this.rig.x - 100, this.rig.y + 35, 'dust', 28, 0xfff6d5, 2.1);
    this.cameras.main.flash(140, 255, 246, 213, false, undefined, this);
  }

  private bindCollisions(): void {
    this.matter.world.on('collisionstart', (event: any) => {
      event.pairs.forEach((pair: any) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        const objectA = bodyA.gameObject as Phaser.Physics.Matter.Image | undefined;
        const objectB = bodyB.gameObject as Phaser.Physics.Matter.Image | undefined;
        const rigA = objectA?.getData('rig') as VehicleRig | undefined;
        const rigB = objectB?.getData('rig') as VehicleRig | undefined;
        const rig = rigA ?? rigB;
        if (!rig) return;

        const block = objectA?.getData('breakable') ? objectA : objectB?.getData('breakable') ? objectB : undefined;
        const impactSpeed = Math.max(bodyA.speed, bodyB.speed, rig.speed);

        if (block && impactSpeed > 5.5) this.breakBlock(block, impactSpeed, rig);

        const otherBody = rigA ? bodyB : bodyA;
        if ((otherBody.label === 'ground' || otherBody.label === 'breakable-block') && impactSpeed > 6.8) {
          this.handleImpact(impactSpeed, pair.collision.supports[0] ?? { x: rig.x, y: rig.y });
        }
      });
    });
  }

  private breakBlock(block: Phaser.Physics.Matter.Image, speed: number, rig: VehicleRig): void {
    if (block.getData('broken')) return;
    block.setData('broken', true);
    this.blocksBroken += 1;
    this.score += Math.round(170 + speed * 36 * rig.spec.mass);
    block.setTint(0xffffff);
    block.setAngularVelocity(Phaser.Math.FloatBetween(-0.28, 0.28));
    block.applyForce(new Phaser.Math.Vector2(Phaser.Math.FloatBetween(0.006, 0.014), Phaser.Math.FloatBetween(-0.02, -0.008)));
    playSfx(this, 'break', { volume: 0.48, rate: Phaser.Math.FloatBetween(0.84, 1.18) });
    this.explodeParticles(block.x, block.y, 'spark', 14, block.getData('baseColor') as number, 1.1);
    this.tweens.add({ targets: block, scaleX: 0.84, scaleY: 0.84, duration: 90, yoyo: true });
    this.checkChallenge();
  }

  private handleImpact(speed: number, point: { x: number; y: number }): void {
    const now = this.time.now;
    if (now - this.lastImpactAt < 170) return;
    this.lastImpactAt = now;
    const strength = Phaser.Math.Clamp((speed - 5) / 18, 0.15, 1);
    this.score += Math.round(speed * 28);
    this.cameras.main.shake(120 + 160 * strength, 0.004 + 0.011 * strength);
    this.explodeParticles(point.x, point.y, strength > 0.55 ? 'spark' : 'dust', 9 + Math.round(20 * strength), strength > 0.55 ? 0xffd43b : 0xfff6d5, 1 + strength);
    const impactKey = speed > 15 ? 'impact3' : speed > 10 ? 'impact2' : 'impact1';
    playSfx(this, impactKey, { volume: 0.45 + strength * 0.45, rate: Phaser.Math.FloatBetween(0.88, 1.08) });
    HapticsService.impact();

    if (speed > 14 && this.rig && Math.random() < 0.5) {
      const detached = this.rig.detachWheel(Math.random() < 0.5 ? 'left' : 'right');
      if (detached) {
        this.score += 650;
        this.explodeParticles(this.rig.x, this.rig.y, 'spark', 22, 0xff8a34, 1.6);
      }
    }

    if (speed > 12) {
      this.matter.world.engine.timing.timeScale = 0.42;
      this.tweens.addCounter({
        from: 0.42,
        to: 1,
        duration: 520,
        ease: 'Sine.out',
        onUpdate: (tween) => {
          this.matter.world.engine.timing.timeScale = tween.getValue() ?? 1;
        },
      });
    }
  }

  private explodeParticles(x: number, y: number, texture: string, quantity: number, tint: number, scale: number): void {
    const emitter = this.add.particles(x, y, texture, {
      speed: { min: 80 * scale, max: 270 * scale },
      angle: { min: 190, max: 350 },
      lifespan: { min: 340, max: 900 },
      scale: { start: 0.85 * scale, end: 0 },
      alpha: { start: 0.9, end: 0 },
      gravityY: 500,
      tint,
      quantity,
      emitting: false,
      blendMode: texture === 'spark' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
    }).setDepth(80);
    emitter.explode(quantity);
    this.time.delayedCall(1000, () => emitter.destroy());
  }

  private drawChargeBar(): void {
    if (!this.chargeFill) return;
    this.chargeFill.clear();
    this.chargeFill.fillStyle(0x050611, 0.78);
    this.chargeFill.fillRoundedRect(-350, -28, 700, 56, 28);
    const color = this.charge > 0.78 ? COLORS.pink : this.charge > 0.46 ? COLORS.yellow : COLORS.cyan;
    this.chargeFill.fillStyle(color, 1);
    this.chargeFill.fillRoundedRect(-338, -16, 676 * this.charge, 32, 16);
    this.chargeFill.fillStyle(0xffffff, 0.2);
    this.chargeFill.fillRoundedRect(-330, -11, Math.max(0, 660 * this.charge - 16), 8, 4);
  }

  update(_time: number, delta: number): void {
    if (!this.rig || this.ending) return;
    const dt = Math.min(0.034, delta / 1000);

    if (!this.launched) {
      if (this.charging) {
        this.charge += this.chargeDirection * dt * 0.84;
        if (this.charge >= 1) {
          this.charge = 1;
          this.chargeDirection = -1;
        } else if (this.charge <= 0.08) {
          this.charge = 0.08;
          this.chargeDirection = 1;
        }
        setEngineIntensity(this, this.charge);
        this.drawChargeBar();
      }
      return;
    }

    this.runTime += dt;
    this.rig.applyAirControl(this.airDirection, dt);
    setEngineIntensity(this, Phaser.Math.Clamp(this.rig.speed / 32, 0.25, 1));

    const rotation = this.rig.rotation;
    let deltaRotation = Phaser.Math.Angle.Wrap(rotation - this.previousRotation);
    if (Math.abs(deltaRotation) > Math.PI) deltaRotation = 0;
    this.rotationTotal += deltaRotation;
    this.previousRotation = rotation;
    const currentFlips = Math.floor(Math.abs(this.rotationTotal) / (Math.PI * 2));
    if (currentFlips > this.flips) {
      this.flips = currentFlips;
      this.score += 700;
      playSfx(this, 'star', { volume: 0.62, rate: 1.08 + this.flips * 0.04 });
      this.explodeParticles(this.rig.x, this.rig.y - 80, 'spark', 20, COLORS.cyan, 1.3);
      HapticsService.selection();
    }

    this.distance = Math.max(0, (this.rig.x - this.startX) / 6.2);
    const chassisBody = this.rig.chassis.body as MatterJS.BodyType;
    this.score += Math.max(0, chassisBody.velocity.x) * dt * 11;
    this.score += Math.abs(chassisBody.angularVelocity) * dt * 170;
    this.checkChallenge();
    this.updateHud();

    const targetZoom = this.rig.speed > 22 ? 0.82 : this.rig.speed > 12 ? 0.9 : 1;
    this.cameras.main.zoom += (targetZoom - this.cameras.main.zoom) * Math.min(1, dt * 2.5);

    const settled = this.rig.speed < 0.72 && this.rig.y > 1480;
    this.settleTime = settled ? this.settleTime + dt : 0;
    if ((this.runTime > 4 && this.settleTime > 1.45) || this.runTime > 20 || this.rig.x > 5850 || this.rig.y > 2200) {
      this.finishRun();
    }
  }

  private checkChallenge(): void {
    if (this.challengeComplete) return;
    switch (this.challenge.type) {
      case 'blocks': this.challengeComplete = this.blocksBroken >= this.challenge.target; break;
      case 'flips': this.challengeComplete = this.flips >= this.challenge.target; break;
      case 'distance': this.challengeComplete = this.distance >= this.challenge.target; break;
      case 'score': this.challengeComplete = this.score >= this.challenge.target; break;
    }
    if (this.challengeComplete) {
      playSfx(this, 'star', { volume: 0.9, rate: 1.18 });
      HapticsService.success();
      this.cameras.main.flash(250, 255, 212, 59, false, undefined, this);
    }
  }

  private updateHud(): void {
    this.scoreLabel?.setText(`SCORE\n${Math.round(this.score).toLocaleString()}`);
    this.challengeLabel?.setText(`${this.challengeComplete ? '✓ ' : ''}${this.challenge.label}`);
    if (this.challengeComplete) this.challengeLabel?.setColor('#ffd43b');
  }

  private finishRun(): void {
    if (this.ending || !this.rig) return;
    this.ending = true;
    stopEngine(this);
    this.rotateControls.forEach((control) => control.disableInteractive());
    this.checkChallenge();

    const saveBefore = SaveService.get();
    const challengeBonus = this.challengeComplete ? this.challenge.bonus : 0;
    const earnedStars = Math.max(4, Math.floor(this.score / 720) + this.blocksBroken * 2 + this.flips * 3 + challengeBonus);
    const finalScore = Math.round(this.score);
    const newBest = finalScore > saveBefore.bestScore;
    SaveService.update({
      stars: saveBefore.stars + earnedStars,
      bestScore: Math.max(saveBefore.bestScore, finalScore),
    });

    const payload: ResultPayload = {
      score: finalScore,
      distance: Math.round(this.distance),
      flips: this.flips,
      blocks: this.blocksBroken,
      stars: earnedStars,
      challenge: this.challenge.label,
      challengeComplete: this.challengeComplete,
      vehicleId: this.rig.spec.id,
      newBest,
    };

    this.time.delayedCall(420, () => this.scene.start('Results', payload));
  }
}
