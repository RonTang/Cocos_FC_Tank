import { Globals, Dir } from "../Globals";
import BaseTank from "./BaseTank";
import MapLayer from "./MapLayer";
import EnemyTank from "./EnemyTank";
import BlockWall from "./BlockWall";
import BlockCamp from "./BlockCamp";
import PlayerTank from "./PlayerTank";
import AudioMng from "../AudioMng";
import {
    _decorator,
    Component,
    Vec3,
    v3,
    Animation,
    Node,
    math,
    Rect,
    director,
    find,
    Label,
    UITransformComponent,
    SpriteFrame,
    Sprite,
    UITransform
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class Bullet extends Component {
    @property([SpriteFrame])
    frames: SpriteFrame[] = [];

    tank: BaseTank;
    isEnemy: boolean;
    dir: number;
    step: number;
    stopMoving: boolean;
    mapLayer: MapLayer;
    uiCom: UITransform;
    level: number;
    audioMng: AudioMng;
   
    onLoad(){
        this.uiCom = this.getComponent(UITransform);
        this.audioMng = find("/Game/AudioMng").getComponent(AudioMng);
        this.mapLayer = find("/Canvas/GameLayer/MapLayer").getComponent(MapLayer);
    }

    init(dir: Dir, pos: Vec3, step: number, tank: BaseTank ,level:number = 0) {
        this.tank = tank;
        this.tank.bulletCount--;
        this.isEnemy = tank instanceof EnemyTank;
        this.dir = dir;
        this.step = step;
        this.stopMoving = false;
        this.level = level;
        pos = v3(pos)
        // 初始化位置
        switch (this.dir) {
            case Dir.LEFT:
                pos.x -= Globals.BULLET_SIZE;
                break;
            case Dir.UP:
                pos.y += Globals.BULLET_SIZE;
                break;
            case Dir.RIGHT:
                pos.x += Globals.BLOCK_SIZE;
                break;
            case Dir.DOWN:
                pos.y -= Globals.BLOCK_SIZE;
                break;
            default:
                break;
        }
        this.node.position = pos;
        this.getComponent(Sprite).spriteFrame = this.frames[this.dir];
    }

    onBulletDestory() {
        this.stopMoving = true;
        this.mapLayer.destoryBullet(this.node);
    }

    onUpdate(dt: number) {
        if (this.stopMoving)
            return;

        let realStep = (this.step * 50) * dt;
        let {x,y} = this.node.position
        switch (this.dir) {
            case Dir.LEFT:
                x -= realStep;
                break;
            case Dir.UP:
                y += realStep;
                break;
            case Dir.RIGHT:
                x += realStep;
                break;
            case Dir.DOWN:
                y -= realStep;
                break;
            default:
                break;
        }
        this.node.setPosition(x,y)
        if (this._isCollisionWithMap() || this._isCollisionWithBlock() ||
            this._isCollisionWithTank()) {
            this.stopMoving = true;
            this.tank.bulletCount++;
            this._playAnimation();
        } else if (this._isCollisionWithBullet()) {
            this.tank.bulletCount++;
            this.onBulletDestory();
           
        }
    }

    _playAnimation() {
        this.getComponent(Animation).play("bomb");
    }
    _stopAnimation(){
        this.getComponent(Animation).stop();
    }

    _isCollisionWithMap() {
        let node = this.node;
        let offset = Globals.BULLET_SIZE / 2;

        if (node.position.x - offset < 0 || node.position.x + offset > Globals.MAP_WIDTH ||
            node.position.y + offset > Globals.MAP_HEIGHT || node.position.y - offset < 0) {
            if (!this.isEnemy)
                this.audioMng.playAudio("bin", false);
            return true;
        }

        return false;
    }
    _fastIsCollisionWithBlock(rect) {
        let count = 0
        let col = Math.floor(this.node.position.x / Globals.BLOCK_SIZE)
        let line = Math.floor(this.node.position.y / Globals.BLOCK_SIZE)
       
        for(let i=-1; i<=1; i++){
            for(let j=-1; j<=1; j++){
                let nl = math.clamp(line+i,0,25)
                let nc = math.clamp(col+j,0,25)
                let blockTrans = this.mapLayer.blockTrans[nl][nc]
                if(blockTrans) {
                    let block = blockTrans.node
                    if(!block.active) continue
                    let blockRect = blockTrans.getBoundingBox()
                    if(rect.intersects(blockRect)){
                        if (block.name == "block_wall") {
                            if (this.level < Globals.TB_STONE_POWER) {
                                if(block.getComponent(BlockWall).tryDestory(rect)){
                                    count++;
                                }
                            }
                            else{
                                block.active = false
                                count++
                            }
                        }else if (block.name == "block_stone") {
                            if (!this.isEnemy){
                                if(this.level < Globals.TB_STONE_POWER ){
                                    this.audioMng.playAudio("bin", false);
                                }
                                else{
                                    block.active = false;
                                }
                            }
                            count++;
                            
                        } else if (block.name == "camp") {
                            block.getComponent(BlockCamp).tryDestory();
                            count++;
                        } else if(block.name == "block_forest"){
                            if(this.level >= Globals.TB_FOREST_POWER)
                                block.active = false;
                        }
                    }    
                }
            }
        }
        return count
    }

    
    _isCollisionWithBlock() {
        
        let count = 0;
        let blocks: Node[] = this.mapLayer.blocks.children;
        let box = this.uiCom.getBoundingBox();

        // 加宽子弹
        switch (this.dir) {
            case Dir.LEFT:
            case Dir.RIGHT:
                box = new Rect(box.xMin, box.yMin - Globals.BULLET_SIZE,
                    Globals.BULLET_SIZE, 3 * Globals.BULLET_SIZE);
                break;
            case Dir.UP:
            case Dir.DOWN:
                box = new Rect(box.xMin - Globals.BULLET_SIZE, box.yMin,
                    3 * Globals.BULLET_SIZE, Globals.BULLET_SIZE);
                break;
            default:
                break;
        }
        return this._fastIsCollisionWithBlock(box)
        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i];
            let offsetX = Math.abs(this.node.position.x - block.position.x)
            let offsetY = Math.abs(this.node.position.y - block.position.y)
            if(offsetX > Globals.BLOCK_SIZE + Globals.BULLET_SIZE) continue
            if(offsetY > Globals.BLOCK_SIZE + Globals.BULLET_SIZE) continue
            if(!block.active) continue
            if (box.intersects(block.getComponent(UITransform).getBoundingBox())) {
                // count++;

                if (block.name == "block_wall") {
                    // TODO
                    if (this.level < Globals.TB_STONE_POWER) {
                        if(block.getComponent(BlockWall).tryDestory(box)){
                            count++;
                            i--;
                        }
                    }
                    else{
                        block.active = false
                        count++
                        //block.destroyAllChildren()
                        //block.destroy()
                    }
                } else if (block.name == "block_stone") {
                    if (!this.isEnemy){
                        if(this.level < Globals.TB_STONE_POWER ){
                            find("/Game/AudioMng").getComponent(AudioMng).playAudio("bin", false);
                        }
                        else{
                            block.active = false;
                        }
                            
                    }
                    count++;
                    
                } else if (block.name == "camp") {
                    block.getComponent(BlockCamp).tryDestory();
                    count++;
                }
            }
        }

        return count;
    }

    _isCollisionWithTank() {
        let box = this.uiCom.getBoundingBox();
        if (this.isEnemy) {
            let players = this.mapLayer.players.children;
            for (const player of players) {
                let tank = player.getComponent(PlayerTank)
                if (box.intersects(tank.uiCom.getBoundingBox())) {
                    
                    if(tank.blood > 0 && !tank.isStar){
                        tank.disBlood();
                        return true;
                    } 
                    
                }
            }
        } else {
            let enemies = this.mapLayer.enemies.children;
            for (const enemy of enemies) {
                let tank =  enemy.getComponent(EnemyTank)
                if (box.intersects(tank.uiCom.getBoundingBox())) {
                    
                    if(tank.blood > 0 && !tank.isStar){
                        tank.disBlood();
                        return true;
                    }
                   
                }
            }
        }

        return false;
    }

    _isCollisionWithBullet() {
        let box = this.uiCom.getBoundingBox();
        let bullets: Node[];
        /* 修复神奇bug */
        // 只检测玩家
        if (!this.isEnemy) {
            bullets = this.mapLayer.enemiesBullets.children;

            for (let i = 0; i != bullets.length; i++) {
                let other = bullets[i].getComponent(Bullet)
                if (box.intersects(other.uiCom.getBoundingBox())) {
                    if(!other.stopMoving){
                        other.stopMoving = true;
                        other.onBulletDestory();
                        other.tank.bulletCount++;
                        return true;
                    }
                    
                }
            }

        }


        return false;
    }
}