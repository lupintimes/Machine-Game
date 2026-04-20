import DialogBox from '../dialog.js'
import UI from '../ui.js'

export default class EnemyScene extends Phaser.Scene {
    constructor() {
        super('EnemyScene')
    }

    preload() {
        this.load.image('enemy-bg', 'assets/images/enemy-bg.png')
    }

    create() {
        const W = this.cameras.main.width
        const H = this.cameras.main.height

        // ─── Background ────────────────────────────────
        this.bg = this.add.image(0, 0, 'enemy-bg').setOrigin(0, 0)
        const bgScale = H / this.bg.height
        this.bg.setScale(bgScale)
        const worldWidth = this.bg.width * bgScale
        this.bg.setDepth(-1)

        // ─── World Bounds ──────────────────────────────
        this.physics.world.setBounds(0, 0, worldWidth, H)

        // ─── UI ────────────────────────────────────────
        this.ui = new UI(this)
        this.ui.create()

        // ─── Dialog ────────────────────────────────────
        this.dialog = new DialogBox(this)
        this.spaceKey = this.input.keyboard.addKey('SPACE')

        // ─── Ground ────────────────────────────────────
        this.ground = this.physics.add.staticGroup()
        const groundTile = this.add.rectangle(worldWidth / 2, H - 10, worldWidth, 20, 0x333333)
        this.physics.add.existing(groundTile, true)
        this.ground.add(groundTile)

        // ─── Platforms ─────────────────────────────────
        this.platforms = this.physics.add.staticGroup()
        this.createPlatform(400, H - 150, 200, 20)
        this.createPlatform(800, H - 250, 200, 20)
        this.createPlatform(1200, H - 200, 250, 20)
        this.createPlatform(1700, H - 300, 200, 20)
        this.createPlatform(2200, H - 180, 300, 20)
        this.createPlatform(2700, H - 280, 200, 20)
        this.createPlatform(3200, H - 220, 250, 20)

        // ─── Player ────────────────────────────────────
        this.player = this.add.rectangle(100, H - 100, 32, 48, 0x00ff88)
        this.player.setDepth(10)
        this.physics.add.existing(this.player)
        this.player.body.setCollideWorldBounds(true)
        this.player.body.setGravityY(600)
        this.player.facing = 1

        // ─── Player Stats ──────────────────────────────
        this.playerHP = 3
        this.maxHP = 3
        this.isInvincible = false
        this.invincibleDuration = 1000
        this.isDead = false

        // ─── Dash ──────────────────────────────────────
        this.canDash = true
        this.isDashing = false
        this.dashSpeed = 800
        this.dashDuration = 150
        this.dashCooldown = 800
        this.shiftKey = this.input.keyboard.addKey('SHIFT')

        // ─── Shooting ──────────────────────────────────
        this.bullets = this.physics.add.group()
        this.canShoot = true
        this.shootCooldown = 250
        this.fireKey = this.input.keyboard.addKey('X')

        // ─── Enemies ───────────────────────────────────
        this.enemies = this.physics.add.group()
        this.enemyBullets = this.physics.add.group()

        this.createEnemy(600, H - 80, 'patrol', 200)
        this.createEnemy(1100, H - 80, 'patrol', 300)
        this.createEnemy(1600, H - 80, 'shooter', 0)
        this.createEnemy(2100, H - 80, 'patrol', 250)
        this.createEnemy(2600, H - 80, 'shooter', 0)
        this.createEnemy(3100, H - 80, 'patrol', 200)

        // ─── Spike Traps ───────────────────────────────
        this.spikes = this.physics.add.staticGroup()
        this.createSpikes(500, H - 30, 100, 20)
        this.createSpikes(1400, H - 30, 150, 20)
        this.createSpikes(2400, H - 30, 120, 20)
        this.createSpikes(3000, H - 30, 100, 20)

        // ─── Checkpoints ───────────────────────────────
        this.checkpoints = []
        this.lastCheckpoint = { x: 100, y: H - 100 }
        this.createCheckpoint(900, H - 60)
        this.createCheckpoint(1800, H - 60)
        this.createCheckpoint(2800, H - 60)

        // ─── Health Bar ────────────────────────────────
        this.healthBarBg = this.add.rectangle(120, 90, 154, 24, 0x333333)
            .setScrollFactor(0).setDepth(100)
        this.healthBar = this.add.rectangle(120, 90, 150, 20, 0x00ff88)
            .setScrollFactor(0).setDepth(101)
        this.healthText = this.add.text(120, 90, `${this.playerHP}/${this.maxHP}`, {
            fontSize: '14px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102)

        // ─── Dash Indicator ────────────────────────────
        this.dashIndicator = this.add.text(120, 115, '⚡ DASH READY', {
            fontSize: '12px',
            fill: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

        // ─── Controls ──────────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys()
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        })

        // ─── Collisions ────────────────────────────────
        this.physics.add.collider(this.player, this.ground)
        this.physics.add.collider(this.player, this.platforms)
        this.physics.add.collider(this.enemies, this.ground)
        this.physics.add.collider(this.enemies, this.platforms)

        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this)
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHit, null, this)
        this.physics.add.overlap(this.player, this.enemies, this.playerTouchEnemy, null, this)
        this.physics.add.overlap(this.player, this.spikes, this.playerHitSpikes, null, this)

        // ─── Camera ────────────────────────────────────
        this.cameras.main.setBounds(0, 0, worldWidth, H)
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

        // ─── Exit Zone ─────────────────────────────────
        this.exitZone = this.add.rectangle(worldWidth - 80, H - 100, 60, 100, 0x00ff88, 0.3)
            .setStrokeStyle(2, 0x00ff88).setDepth(5)
        this.physics.add.existing(this.exitZone, true)

        this.add.text(worldWidth - 80, H - 160, '🚪 EXIT', {
            fontSize: '16px',
            fill: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5)

        this.physics.add.overlap(this.player, this.exitZone, this.reachExit, null, this)

        // ─── Controls Hint ─────────────────────────────
        this.add.text(W / 2, H - 20, 'WASD/Arrows: Move  |  X: Shoot  |  SHIFT: Dash  |  SPACE: Dialog', {
            fontSize: '14px',
            fill: '#666666'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100)

        // ─── Intro Dialog ──────────────────────────────
        if (!GameState.getFlag('enemyIntroSeen')) {
            this.time.delayedCall(100, () => {
                this.dialog.show([
                    { name: 'You', text: 'This is enemy territory...' },
                    { name: 'You', text: 'I need to be careful.' },
                    { name: 'You', text: 'The armor should protect me, but I\'m not invincible.' },
                    { name: '', text: 'WASD to move, X to shoot, SHIFT to dash.' },
                    { name: '', text: 'Get to the exit alive.' }
                ], () => {
                    GameState.setFlag('enemyIntroSeen')
                })
            })
        }
    }

    update() {
        if (this.isDead) return

        if (this.dialog && this.dialog.isActive) {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.dialog.next()
            }
            this.player.body.setVelocityX(0)
            return
        }

        if (this.isDashing) {
            this.updateEnemies()
            this.cleanupBullets()
            return
        }

        if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
            this.dash()
            return
        }

        const speed = 300
        this.player.body.setVelocityX(0)

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.body.setVelocityX(-speed)
            this.player.facing = -1
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.body.setVelocityX(speed)
            this.player.facing = 1
        }

        if ((this.cursors.up.isDown || this.wasd.up.isDown) && this.player.body.onFloor()) {
            this.player.body.setVelocityY(-500)
        }

        if (this.fireKey.isDown && this.canShoot) {
            this.shoot()
        }

        this.updateEnemies()
        this.cleanupBullets()
        this.updateHealthBar()
    }

    // ═══════════════════════════════════════════════════
    // ─── DASH ──────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    dash() {
        if (!this.canDash || this.isDashing) return

        this.isDashing = true
        this.canDash = false
        this.isInvincible = true

        const direction = this.player.facing
        this.player.body.setVelocityX(direction * this.dashSpeed)
        this.player.body.setVelocityY(0)

        this.player.setFillStyle(0x00ffff)
        this.player.setAlpha(0.7)

        this.dashIndicator.setText('⚡ COOLDOWN')
        this.dashIndicator.setFill('#666666')

        const trail = this.add.rectangle(
            this.player.x,
            this.player.y,
            32,
            48,
            0x00ffff,
            0.3
        ).setDepth(this.player.depth - 1)

        this.tweens.add({
            targets: trail,
            alpha: 0,
            scaleX: 2,
            duration: 300,
            onComplete: () => trail.destroy()
        })

        this.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false
            this.isInvincible = false
            this.player.setFillStyle(0x00ff88)
            this.player.setAlpha(1)
        })

        this.time.delayedCall(this.dashCooldown, () => {
            this.canDash = true
            this.dashIndicator.setText('⚡ DASH READY')
            this.dashIndicator.setFill('#00ffff')
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── SHOOTING ──────────────────────────────────────
    // ═══════════════════════════════════════════════════

    shoot() {
        this.canShoot = false

        const direction = this.player.facing
        const bullet = this.add.rectangle(
            this.player.x + (direction * 25),
            this.player.y,
            12,
            6,
            0xffff00
        )
        this.physics.add.existing(bullet)
        bullet.body.setVelocityX(direction * 600)
        bullet.body.setAllowGravity(false)
        this.bullets.add(bullet)

        const flash = this.add.circle(
            this.player.x + (direction * 30),
            this.player.y,
            8,
            0xffff00,
            0.8
        ).setDepth(11)

        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 100,
            onComplete: () => flash.destroy()
        })

        this.time.delayedCall(this.shootCooldown, () => {
            this.canShoot = true
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── PLAYER DAMAGE ─────────────────────────────────
    // ═══════════════════════════════════════════════════

    playerHit(player, bullet) {
        if (this.isInvincible || this.isDead) return
        bullet.destroy()
        this.takeDamage()
    }

    playerTouchEnemy(player, enemy) {
        if (this.isInvincible || this.isDead) return
        this.takeDamage()
    }

    playerHitSpikes(player, spike) {
        if (this.isInvincible || this.isDead) return
        this.takeDamage()
    }

    takeDamage() {
        this.playerHP--
        this.isInvincible = true

        this.player.setFillStyle(0xff0000)
        this.cameras.main.shake(100, 0.01)

        const screenFlash = this.add.rectangle(
            this.cameras.main.scrollX + this.cameras.main.width / 2,
            this.cameras.main.scrollY + this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0xff0000,
            0.3
        ).setDepth(999).setScrollFactor(0)

        this.tweens.add({
            targets: screenFlash,
            alpha: 0,
            duration: 200,
            onComplete: () => screenFlash.destroy()
        })

        const knockDir = this.player.facing === -1 ? 1 : -1
        this.player.body.setVelocityX(knockDir * 300)
        this.player.body.setVelocityY(-200)

        if (this.playerHP <= 0) {
            this.playerDie()
            return
        }

        let blinkCount = 0
        this.time.addEvent({
            delay: 100,
            repeat: 9,
            callback: () => {
                blinkCount++
                this.player.setAlpha(blinkCount % 2 === 0 ? 1 : 0.3)
            }
        })

        this.time.delayedCall(this.invincibleDuration, () => {
            this.isInvincible = false
            this.player.setFillStyle(0x00ff88)
            this.player.setAlpha(1)
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── PLAYER DEATH / RESPAWN ────────────────────────
    // ═══════════════════════════════════════════════════

    playerDie() {
        this.isDead = true
        this.player.setFillStyle(0x444444)
        this.player.setAlpha(0.5)
        this.player.body.setVelocity(0, 0)

        this.cameras.main.shake(300, 0.02)

        const deathText = this.add.text(
            this.cameras.main.scrollX + this.cameras.main.width / 2,
            this.cameras.main.scrollY + this.cameras.main.height / 2,
            '💀 DEFEATED',
            {
                fontSize: '48px',
                fill: '#ff0000',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5).setDepth(999)

        this.time.delayedCall(2000, () => {
            deathText.destroy()
            this.respawn()
        })
    }

    respawn() {
        this.isDead = false
        this.playerHP = this.maxHP
        this.isInvincible = false
        this.player.setPosition(this.lastCheckpoint.x, this.lastCheckpoint.y)
        this.player.setFillStyle(0x00ff88)
        this.player.setAlpha(1)
        this.player.body.setVelocity(0, 0)
        this.updateHealthBar()
    }

    // ═══════════════════════════════════════════════════
    // ─── HEALTH BAR ────────────────────────────────────
    // ═══════════════════════════════════════════════════

    updateHealthBar() {
        const ratio = this.playerHP / this.maxHP
        this.healthBar.width = 150 * ratio

        if (ratio > 0.6) {
            this.healthBar.setFillStyle(0x00ff88)
        } else if (ratio > 0.3) {
            this.healthBar.setFillStyle(0xffaa00)
        } else {
            this.healthBar.setFillStyle(0xff4444)
        }

        this.healthText.setText(`${this.playerHP}/${this.maxHP}`)
    }

    // ═══════════════════════════════════════════════════
    // ─── ENEMIES ───────────────────────────────────────
    // ═══════════════════════════════════════════════════

    createEnemy(x, y, type, patrolRange) {
        const enemy = this.add.rectangle(
            x,
            y,
            30,
            40,
            type === 'shooter' ? 0xff4444 : 0xff8800
        )
        this.physics.add.existing(enemy)
        enemy.body.setCollideWorldBounds(true)
        enemy.body.setGravityY(600)
        this.enemies.add(enemy)

        enemy.enemyType = type
        enemy.startX = x
        enemy.patrolRange = patrolRange
        enemy.hp = 2
        enemy.direction = 1
        enemy.shootTimer = 0
        enemy.shootInterval = 2000

        return enemy
    }

    updateEnemies() {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return

            if (enemy.enemyType === 'patrol') {
                enemy.body.setVelocityX(enemy.direction * 100)

                if (enemy.x > enemy.startX + enemy.patrolRange) {
                    enemy.direction = -1
                } else if (enemy.x < enemy.startX - enemy.patrolRange) {
                    enemy.direction = 1
                }

            } else if (enemy.enemyType === 'shooter') {
                enemy.body.setVelocityX(0)
                enemy.shootTimer += this.game.loop.delta

                if (enemy.shootTimer >= enemy.shootInterval) {
                    enemy.shootTimer = 0
                    this.enemyShoot(enemy)
                }
            }
        })
    }

    enemyShoot(enemy) {
        const dx = this.player.x - enemy.x
        const dy = this.player.y - enemy.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 500) return

        const speed = 300
        const vx = (dx / dist) * speed
        const vy = (dy / dist) * speed

        const bullet = this.add.circle(enemy.x, enemy.y, 5, 0xff0000)
        this.physics.add.existing(bullet)
        bullet.body.setVelocity(vx, vy)
        bullet.body.setAllowGravity(false)
        this.enemyBullets.add(bullet)
    }

    bulletHitEnemy(bullet, enemy) {
        bullet.destroy()
        enemy.hp--

        enemy.setFillStyle(0xffffff)

        this.time.delayedCall(100, () => {
            if (enemy.active) {
                enemy.setFillStyle(enemy.enemyType === 'shooter' ? 0xff4444 : 0xff8800)
            }
        })

        if (enemy.hp <= 0) {
            for (let i = 0; i < 6; i++) {
                const particle = this.add.rectangle(
                    enemy.x + Phaser.Math.Between(-10, 10),
                    enemy.y + Phaser.Math.Between(-10, 10),
                    6,
                    6,
                    0xff8800
                ).setDepth(15)

                this.tweens.add({
                    targets: particle,
                    x: particle.x + Phaser.Math.Between(-50, 50),
                    y: particle.y + Phaser.Math.Between(-80, -20),
                    alpha: 0,
                    duration: 400,
                    onComplete: () => particle.destroy()
                })
            }

            enemy.destroy()
        }
    }

    // ═══════════════════════════════════════════════════
    // ─── HAZARDS ───────────────────────────────────────
    // ═══════════════════════════════════════════════════

    createSpikes(x, y, width, height) {
        const spike = this.add.rectangle(x, y, width, height, 0xff0000, 0.6)
            .setStrokeStyle(1, 0xff0000)
        this.physics.add.existing(spike, true)
        this.spikes.add(spike)

        const triangleCount = Math.floor(width / 15)
        for (let i = 0; i < triangleCount; i++) {
            const tx = x - width / 2 + (i * 15) + 7
            this.add.triangle(tx, y - 12, 0, 12, 6, 0, 12, 12, 0xff0000, 0.8)
                .setDepth(1)
        }

        return spike
    }

    // ═══════════════════════════════════════════════════
    // ─── CHECKPOINTS ───────────────────────────────────
    // ═══════════════════════════════════════════════════

    createCheckpoint(x, y) {
        const cp = this.add.rectangle(x, y, 20, 60, 0x00ff88, 0.3)
            .setStrokeStyle(2, 0x00ff88)
            .setDepth(3)
        this.physics.add.existing(cp, true)

        const flag = this.add.text(x, y - 40, '🏁', {
            fontSize: '24px'
        }).setOrigin(0.5).setDepth(4)

        this.physics.add.overlap(this.player, cp, () => {
            if (this.lastCheckpoint.x !== x) {
                this.lastCheckpoint = { x, y }
                cp.setFillStyle(0x00ff88, 0.8)
                flag.setScale(1.3)

                const saved = this.add.text(x, y - 70, '✅ Saved!', {
                    fontSize: '16px',
                    fill: '#00ff88'
                }).setOrigin(0.5).setDepth(20)

                this.tweens.add({
                    targets: saved,
                    y: y - 100,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => saved.destroy()
                })
            }
        })

        this.checkpoints.push({ cp, flag, x, y })
    }

    // ═══════════════════════════════════════════════════
    // ─── PLATFORMS ─────────────────────────────────────
    // ═══════════════════════════════════════════════════

    createPlatform(x, y, w, h) {
        const platform = this.add.rectangle(x, y, w, h, 0x555555)
            .setStrokeStyle(1, 0x777777)
        this.physics.add.existing(platform, true)
        this.platforms.add(platform)
        return platform
    }

    // ═══════════════════════════════════════════════════
    // ─── CLEANUP ───────────────────────────────────────
    // ═══════════════════════════════════════════════════

    cleanupBullets() {
        const bounds = this.physics.world.bounds

        this.bullets.getChildren().forEach(bullet => {
            if (
                bullet.x < bounds.x - 50 ||
                bullet.x > bounds.right + 50 ||
                bullet.y < bounds.y - 50 ||
                bullet.y > bounds.bottom + 50
            ) {
                bullet.destroy()
            }
        })

        this.enemyBullets.getChildren().forEach(bullet => {
            if (
                bullet.x < bounds.x - 50 ||
                bullet.x > bounds.right + 50 ||
                bullet.y < bounds.y - 50 ||
                bullet.y > bounds.bottom + 50
            ) {
                bullet.destroy()
            }
        })
    }

    // ═══════════════════════════════════════════════════
    // ─── EXIT ──────────────────────────────────────────
    // ═══════════════════════════════════════════════════

    reachExit() {
        if (this.isDead) return

        this.physics.pause()

        this.dialog.show([
            { name: 'You', text: 'I made it through...' },
            { name: 'You', text: 'Now I know what we\'re up against.' },
            { name: '', text: '✅ Enemy Territory cleared!' }
        ], () => {
            GameState.setFlag('enemyTerritoryCleared')
            this.cameras.main.fade(500, 0, 0, 0)
            this.time.delayedCall(500, () => {
                this.scene.start('HubScene')
            })
        })
    }
}