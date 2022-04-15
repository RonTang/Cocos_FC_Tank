import { Globals, Dir } from "../Globals";
import { adjustNumber } from "./Utils";
import MapLayer from "./MapLayer";
import {
    _decorator,
    Component,
    Rect,
    math,
    UITransform,
    find,
    Animation
} from 'cc';
import AudioMng from "../AudioMng";
const { ccclass } = _decorator;

@ccclass
export default class BaseTank extends Component {
    bulletCount: number;
    isEnemy: boolean;
    level: number;
    dir: Dir;
    blood: number;
    life: number;
    canMove: boolean;
    autoMoving: boolean;
    mapLayer: MapLayer;
    uiCom: UITransform;
    isProp: boolean;
    isStar: boolean;
    _audioMng: AudioMng = null;
    _anim:Animation = null;
    private static offsetMap = new Map([
        [Dir.UP,[{lineOffset:1,colOffset:-1},{lineOffset:1,colOffset:0},{lineOffset:1,colOffset:1}]],
        [Dir.DOWN,[{lineOffset:-1,colOffset:-1},{lineOffset:-1,colOffset:0},{lineOffset:-1,colOffset:1}]],
        [Dir.LEFT,[{lineOffset:-1,colOffset:-1},{lineOffset:0,colOffset:-1},{lineOffset:1,colOffset:-1}]],
        [Dir.RIGHT,[{lineOffset:-1,colOffset:1},{lineOffset:0,colOffset:1},{lineOffset:1,colOffset:1}]]
    ])
    onLoad() {
       
        this.level = 0;
        this.dir = Dir.LEFT;
        this.blood = 1;
        this.canMove = false;
        this.autoMoving = false;
        this.isEnemy = true;
        this.isProp = false;
        this.isStar = false;
        this.bulletCount = 1;
        this.uiCom = this.getComponent(UITransform);
        this._audioMng = find("/Game/AudioMng").getComponent(AudioMng);
        this._anim = this.getComponent(Animation);
        
        
    }
    onUpdate(dt: number){
        
    }
    pause(){
        this.canMove = false
    }
    resume(){
        this.canMove = true
    }
    /* 地图碰撞检测 */
    _isCollisionWithMap() {
        let node = this.node;
        let offset = Globals.TANK_SIZE / 2;
        if (node.position.x - offset < 0 || node.position.x + offset > Globals.MAP_WIDTH ||
            node.position.y + offset > Globals.MAP_HEIGHT || node.position.y - offset < 0) {
                return true;
        }

        return false;
    }
    /* 优化算法检测坦克移动方向3宫格方块 */
    _fastIsDirCollisionWithBlock(dir: Dir){
        let col = Math.floor(this.node.position.x / Globals.BLOCK_SIZE)
        let line = Math.floor(this.node.position.y / Globals.BLOCK_SIZE)
        let rect = this.uiCom.getBoundingBox()
        for(let {lineOffset,colOffset} of BaseTank.offsetMap.get(dir)){
            let nl = math.clamp(line+lineOffset,0,25)
            let nc = math.clamp(col+colOffset,0,25)
            let blockTrans = this.mapLayer.blockTrans[nl][nc]
            if(blockTrans) {
                let blockRect = blockTrans.getBoundingBox()
                let block = blockTrans.node
                if (block.active && (block.name == "block_wall" ||
                block.name == "block_stone" ||
                block.name == "camp" ||
                block.name == "block_river") &&
                rect.intersects(blockRect)){
                        return true
                }
            }
        }
        return false
        
    }
    /* 优化算法检测坦克周边9宫格方块 */
    _fastIsCollisionWithBlock() {
        let col = Math.floor(this.node.position.x / Globals.BLOCK_SIZE)
        let line = Math.floor(this.node.position.y / Globals.BLOCK_SIZE)
        let rect = this.uiCom.getBoundingBox()
        for(let i=-1; i<=1; i++){
            for(let j=-1; j<=1; j++){
                let nl = math.clamp(line+i,0,25)
                let nc = math.clamp(col+j,0,25)
                let blockTrans = this.mapLayer.blockTrans[nl][nc]
                if(blockTrans) {
                    let blockRect = blockTrans.getBoundingBox()
                    let block = blockTrans.node
                    if (block.active && (block.name == "block_wall" ||
                    block.name == "block_stone" ||
                    block.name == "camp" ||
                    block.name == "block_river") &&
                    rect.intersects(blockRect)){
                            return true
                    }
                }
            }
        }
        return false
    }
    /* 坦克与方块碰撞检测 */
    _isCollisionWithBlock() {
       
        return this._fastIsDirCollisionWithBlock(this.dir)
        let blocks = this.mapLayer.blocks.children;
        let rect = this.uiCom.getBoundingBox();
        for (let i = 0; i != blocks.length; i++) {
            let block = blocks[i];
            let offsetX = Math.abs(this.node.position.x - block.position.x)
            let offsetY = Math.abs(this.node.position.y - block.position.y)
            if(offsetX > Globals.BLOCK_SIZE + Globals.TANK_SIZE) continue
            if(offsetY > Globals.BLOCK_SIZE + Globals.TANK_SIZE) continue
            if(!block.active) continue
            if ((block.name == "block_wall" ||
                block.name == "block_stone" ||
                block.name == "camp" ||
                block.name == "block_river") &&
                rect.intersects(block.getComponent(UITransform).getBoundingBox())) {
                return true;
            }
        }

        return false;
    }
    /* 坦克碰撞检测 */
    _isCollisionWithTank() {
        let box = this.uiCom.getBoundingBox();
        let enemies = this.mapLayer.enemies.children;
        let players = this.mapLayer.players.children;
        /* 调整包围盒避免，特殊情况下，坦克重叠无法移动 */
        switch (this.dir) {
            case Dir.LEFT:
                box = new Rect(box.xMin-1, box.yMin+1,
                    1, box.height-1);
                break;
            case Dir.RIGHT:
                box = new Rect(box.xMax, box.yMin+1,
                    1, box.height-1);
                break;
            case Dir.UP:
                box = new Rect(box.xMin+1, box.yMax,
                    box.width-1, 1);
                break
            case Dir.DOWN:
                box = new Rect(box.xMin+1, box.yMin-1,
                    box.width-1, 1);
                break;
            default:
                break;
        }


        for (const enemy of enemies) {
            let tank = enemy.getComponent(BaseTank)
            if (enemy != this.node && tank.blood > 0 && !tank.isStar 
                && box.intersects(enemy.getComponent(UITransform).getBoundingBox()))
                return true;
        }

        for (const player of players) {
            let tank = player.getComponent(BaseTank)
            if (player != this.node && tank.blood > 0 && !tank.isStar 
                &&box.intersects(player.getComponent(UITransform).getBoundingBox()))
                return true;
        }

        return false;
    }

    /*调整坦克位置为8的整数倍*/
    _adjustPosition() {
        let x = adjustNumber(this.node.position.x)
        let y = adjustNumber(this.node.position.y)
        this.node.setPosition(x,y)
    }
}
