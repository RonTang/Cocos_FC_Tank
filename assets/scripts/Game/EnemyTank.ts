import BaseTank from "./BaseTank"
import { Dir, Globals } from "../Globals"
import MapLayer from "./MapLayer";
import AudioMng from "../AudioMng";
import Game from "./Game";
import {
    _decorator,
    Vec3,
    v3,
    Animation,
    find,
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class EnemyTank extends BaseTank {
    readonly _maxDistance: number = 100;
    _curDistance: number = 0;
    

    onLoad(){
        super.onLoad()
        this.mapLayer = find("/Canvas/GameLayer/MapLayer").getComponent(MapLayer);
    }
    
    onUpdate(dt: number) {
        if (!this.canMove || this.mapLayer.isAIPaused()) return;
        let realStep = (36 + 6 * (this.level == 2 ? 1 : 0)) * dt;
        this._autoMoving(realStep);
    }
    
    init(pos: Vec3) {
        
        this._curDistance = 0;
        this.level =  Game.single().getRandInt(1,5)
        this.blood = this.level == 4 ? 3 : 1
        this.isProp = this.level >= 5 ? true : false
        this.isStar = true
        this.node.position = pos;
    
        this.getComponent(Animation).play("star");

        // 控制方向
        Game.single().scheduleForever(() => {
            if (this._curDistance >= this._maxDistance) {
                this._curDistance = 0;
                this.changeDir();
            }
        }, this,0.2);

        // 控制发射子弹
        Game.single().scheduleForever(() => {
            if (!this.canMove || this.mapLayer.isAIPaused())
                return;
            let choice = Game.single().getRandom()
            
            if (choice > 0.5){
                this.shoot();
            }
                
        }, this,0.5);
        Game.single().unscheduleCallBackForTarget(this.afterStar,this)
        Game.single().scheduleOne(this.afterStar,this,0.6)
    }

    afterStar() {
        this.isStar = false;
        this.setDir(Dir.DOWN);
        this.playAnimation('idle');
        if(!this.mapLayer.isAIPaused()){
            this.canMove = true;
        }
    }
    pause(){
        if(this.canMove && this.blood > 0) {
            this.playAnimation('idle')
        }
        this.canMove = false;
    }
    resume(){
        if(this.blood > 0){
            this.canMove = true;
            this.playAnimation('moving');
        }
    }

    setDir(dir: Dir) {
        if (this.dir == dir)
            return;

        let oldPosition = v3(this.node.position);
        // 调整位置为8的整数倍
        this._adjustPosition();

        // 如果产生碰撞，则回到之前的位置
        if (this._isCollisionWithMap() || this._isCollisionWithBlock() || this._isCollisionWithTank()) {
            this.node.position = oldPosition;

            // 变换方向
            this._curDistance = this._maxDistance;
        }

        this.dir = dir;
        this.node.angle = -90 * this.dir;
    }

    changeDir() {
        if(!this.canMove) return;
        let choice = Game.single().getRandom();
        if (choice < 0.4) {
            this.setDir(Dir.DOWN);
        } else if (choice < 0.6) {
            this.setDir(Dir.LEFT);
        } else if (choice < 0.8) {
            this.setDir(Dir.UP);
        } else {
            this.setDir(Dir.RIGHT);
        }

        this.playAnimation('moving');
    }

    shoot() {
        this.mapLayer.createBullet(this.dir, this.node.position, Math.min(4,this.level), this);
    }


    playAnimation(anim) {
        let animation = anim + "_0_" + this.level;

        if (this.level == 4) {
            animation = anim + "_0_" + this.level + "_" + (3 - this.blood);
        }

        this.getComponent(Animation).play(animation);
    }
    
    stopAnimation() {
        this.getComponent(Animation).stop();
    }

    disBlood(damage = 1) {
        if (this.blood <= 0)
            return;
        this.blood -= damage
        if (this.blood <= 0) {
            Game.single().unscheduleAllCallBacksForTarget(this);
            if(damage < Globals.TANK_MAX_HP)
            this._audioMng.playAudio("tank_bomb", false);
            this.stopAnimation();
            this.canMove = false;
            this.getComponent(Animation).play("blast");
        } else {
            this._audioMng.playAudio("bin_tank", false);
            // 刷新动画
            this.playAnimation('moving');
        }
        if(this.isProp && damage < Globals.TANK_MAX_HP){
            this.mapLayer.createProp()
        }

    }

    onDestroyed() {
        
        this.mapLayer.destoryEnemy(this.node);
        
    }

    _autoMoving(realStep: number) {
        // 记录移动前的位置
        let {x,y} = this.node.position
        let oldPosition = v3(x,y);
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
        this.node.setPosition(x,y);
        this._curDistance += realStep;

        // 如果产生碰撞，则回到之前的位置
        if (this._isCollisionWithMap() || this._isCollisionWithBlock() || this._isCollisionWithTank()) {
            this.node.position = oldPosition;
            // 变换方向
            this._curDistance = this._maxDistance;
           
        }

    }
}

