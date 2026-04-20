import GameState from './data/gameState.js'
import PreloadScene from './scenes/PreloadScene.js' 
import HubScene from './scenes/HubScene.js'
import WorkshopScene from './scenes/WorkshopScene.js'
import JunkyardScene from './scenes/JunkyardScene.js'
import SecretBaseScene from './scenes/SecretBaseScene.js'
import PalaceScene from './scenes/PalaceScene.js'
import TownCenterScene from './scenes/TownCenterScene.js'
import ParkScene from './scenes/ParkScene.js'
import WireConnectGame from './scenes/minigames/WireConnectGame.js'
import PressureValveGame from './scenes/minigames/PressureValveGame.js'
import CutsceneScene from './scenes/CutsceneScene.js'
import EnemyScene from './scenes/EnemyScene.js'
import EnergyCalibrationGame from './scenes/minigames/EnergyCalibrationGame.js'
import Level3PalaceScene from './scenes/Level3PalaceScene.js'

window.GameState = GameState

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    backgroundColor: '#000000',
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
    scene: [
        PreloadScene,
        HubScene,
        WorkshopScene,
        JunkyardScene,
        SecretBaseScene,
        PalaceScene,
        TownCenterScene,
        ParkScene,
        CutsceneScene,
        Level3PalaceScene,
        EnemyScene,
        WireConnectGame,
        PressureValveGame,
        EnergyCalibrationGame,
    ]
}

const game = new Phaser.Game(config)