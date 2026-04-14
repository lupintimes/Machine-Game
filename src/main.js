import GameState from './data/gameState.js'
import UI from './ui.js'
import HubScene from './scenes/HubScene.js'
import WorkshopScene from './scenes/WorkshopScene.js'
import JunkyardScene from './scenes/JunkyardScene.js'

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [HubScene, WorkshopScene, JunkyardScene]
}

// Make GameState accessible everywhere
window.GameState = GameState

const game = new Phaser.Game(config)