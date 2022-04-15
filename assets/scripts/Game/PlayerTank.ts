import BaseTank from "./BaseTank";
import { Dir, Globals } from "../Globals";
import MapLayer from "./MapLayer";
import UpdateInformations from "./UpdateInformations";
import Game from "./Game";

import {
    _decorator,
    Node,
    Animation,
    view,
    tween,
    macro,
    EventKeyboard,
    KeyCode,
    Component,
    director,
    find,
    Label,
    UITransform,
    v3,
    input,
    Input,
    math,
    TERRAIN_SOUTH_INDEX
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class PlayerTank extends BaseTank {
    @property(Node)
    ring: Node = null;
    _isInvincible: boolean;
    _memDirs:Dir[] = [];
    _ui:UpdateInformations = null;
    _autoShooting :boolean;
    control(dir: Dir) {
        if (!this.canMove) return;

        if (!this.autoMoving)
            this._audioMng.playAudio("player_move", true);

        this._setDir(dir);
        this._playAnimation('moving');
        this.autoMoving = true;
    }

    controlStop() {
        if (!this.canMove) return;
        this.autoMoving = false;
        this._audioMng.stopAudio("player_move");
        this._playAnimation('idle');
    }

    shoot() {
        if (!this.canMove)
            return;
        
        this.mapLayer.createBullet(this.dir, this.node.position, Math.min(5,(this.level + 1) * 2), this, this.level);
        
    }

    disBlood() {
        if (this._isInvincible)
            return;
        if (this.level >= Globals.TB_STONE_POWER){
            //this.changeLevel(this.node, Globals.TB_DOUBLE_POWER - this.level)
            return;
        }
        this.blood = 0;
        this.life--;

        if (this.life >= 0) {
            this._audioMng.playAudio("tank_bomb", false);
            this.controlStop();
            this.canMove = false;
            this._isInvincible = true;
            //this.changeLevel(this.node,-this.level)
            this.getComponent(Animation).play("blast");
        }

        if (this.life != 0) {
            /*先播放爆炸动画然后重置坦克*/
            Game.single().unscheduleCallBackForTarget(this.reset,this)
            Game.single().scheduleOne(this.reset, this, 0.6)
        } else {
            this.gameOver();
        }

        // 更新剩余生命值
        if (this.life > 0)
            this._ui.updatePlayerBlood(this.life - 1);
    }

    /**
     * 播放一个从左到右的game over动画，然后播放游戏失败流程动画
     */
    gameOver() {
        this.node.active = false;
        this._audioMng.stopAudio("player_move");
        let visableSize = view.getVisibleSize();

        let gameOverNode = find("/Canvas/External/gameover_left");
        gameOverNode.active = true;
        gameOverNode.setPosition(-visableSize.width / 2 - gameOverNode.getComponent(UITransform).width / 2, -94);

        // 播放右移动画
        tween(gameOverNode)
            .to(1.5, { position:v3(-35,-94) })
            .delay(1)
            .call(() => {
                // 播放上升动画
                find("/Game").getComponent(Game).gameOver();
            })
            .start();
    }

    /* 回到起始位置，并播放出生动画 */
    reset() {   
        //this.changeLevel(this.node,2)
        this.isStar = true;
        this.getComponent(Animation).play("star");
        this.canMove = false;
        this.blood = 1;
        this._isInvincible = true;
        this._setDir(Dir.UP);
        this.node.setPosition(80, 8);
        this._ui.updatePlayerBlood(this.life - 1);
        Game.single().unscheduleCallBackForTarget(this.afterStar,this)
        Game.single().scheduleOne(this.afterStar,this,0.6);
    }
    /* 初始化玩家逻辑，注意这个方法只调用一次 */
    onLoad() {
        super.onLoad()
        this.life = 60;
        this.isEnemy = false;
        this._ui = find("/Canvas/GameLayer/Informations").getComponent(UpdateInformations)
        this.mapLayer = find("/Canvas/GameLayer/MapLayer").getComponent(MapLayer);
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this._onKeyUp, this);
        Game.single().gameEvent.on('power',this.changeLevel,this);
        Game.single().gameEvent.on('life',this.addLife,this);
        Game.single().gameEvent.on('invincible',this.invicible,this);
        //this.reset();
    }
    /* 设置无敌 */
    invicible(player){
        if(player != this.node) 
            return
        this._isInvincible = true;
        this.ring.active = true;
        let animation = this.ring.getComponent(Animation);
        animation.play("ring");
        Game.single().unscheduleCallBackForTarget(this.normal,this)
        Game.single().scheduleOne(this.normal,this, 10);

    }
    /* 取消无敌 */
    normal(){
        let animation = this.ring.getComponent(Animation)
        animation.stop()
        this._isInvincible = false
        this.ring.active = false
    }
    /* 加命 */
    addLife(){
        this.life++
        this._audioMng.playAudio("add_life", false)
        this._ui.updatePlayerBlood(this.life - 1)
    }
    /* 更新坦克等级、更新子弹数 */
    changeLevel(player,value = 1){
        if(player != this.node) 
            return
        let oldLevel = this.level
        this.level += value
        this._playAnimation('idle');
        if(value > 0 && this.level >= Globals.TB_DOUBLE_POWER
            && oldLevel < Globals.TB_DOUBLE_POWER) 
            this.bulletCount++
        if(value < 0 && this.level < Globals.TB_DOUBLE_POWER 
            && oldLevel >= Globals.TB_DOUBLE_POWER )
            this.bulletCount--
    }

    /* 播放完star动画后调用 */
    protected afterStar() {
        
        this.isStar = false;
        this.canMove = true;
        this._playAnimation('idle');
        if(this._memDirs.length > 0){
            this.control(this._memDirs[this._memDirs.length - 1])
        }
        
        this.ring.active = true;
        let animation = this.ring.getComponent(Animation);
        animation.play("ring");

        // 3秒后取消无敌状态
        Game.single().unscheduleCallBackForTarget(this.normal, this)
        Game.single().scheduleOne(this.normal, this,3);
    }

    onUpdate(dt: number) {
        if (!this.canMove)
            return;

        if (this.autoMoving) {
            let realStep = (this.level * 0.1 + 1) * 40 * dt;
            this._autoMoving(realStep);
        }
        if (this._autoShooting){
            this.shoot()
        }
       
    }
    _clearMemDir(){
        this._memDirs = []
    }
    _addMemDir(dir : Dir){
        if(!this._memDirs.includes(dir))
            this._memDirs.push(dir)
    }
    _onKeyDown(event: EventKeyboard ) {
        switch (event.keyCode) {
            case KeyCode.KEY_A:
                this.control(Dir.LEFT)
                this._addMemDir(Dir.LEFT)
                break;
            case KeyCode.KEY_W:
                this.control(Dir.UP);
                this._addMemDir(Dir.UP)
                break;
            case KeyCode.KEY_D:
                this.control(Dir.RIGHT);
                this._addMemDir(Dir.RIGHT)
                break;
            case KeyCode.KEY_S:
                this.control(Dir.DOWN);
                this._addMemDir(Dir.DOWN)
                break;
            case KeyCode.KEY_J:
                this.shoot();
                break;
            case KeyCode.KEY_L:
                this.mapLayer.createProp()
                break;
            case KeyCode.KEY_K:
                this._autoShooting = true
            default:
                break;
        }
       
    }

    _onKeyUp(event: EventKeyboard) {
        let idx = - 1;
        switch (event.keyCode) {
            case KeyCode.KEY_A:
                idx = this._memDirs.indexOf(Dir.LEFT)
                break;
            case KeyCode.KEY_W:
                idx = this._memDirs.indexOf(Dir.UP)
                break;
            case KeyCode.KEY_D:
                idx = this._memDirs.indexOf(Dir.RIGHT)
                break;
            case KeyCode.KEY_S:
                idx = this._memDirs.indexOf(Dir.DOWN)
                break;
            case KeyCode.KEY_K:
                this._autoShooting = false;
            default:
                break;
        }
        if(idx >= 0){
            this._memDirs.splice(idx,1)
            if(this._memDirs.length == 0){
                this.controlStop()
            }else{
                let dir = this._memDirs.pop()
                this._addMemDir(dir)
                this.control(dir)
            }
        }
        
    }
    _playAnimation(anim){
        anim = anim + '_' + Math.min(Globals.TB_STONE_POWER,this.level)
        this._anim.play(anim);
    }
  
    _setDir(dir: Dir) {
      

        if (this.dir == dir)
            return;
        
        let oldPosition = v3(this.node.position);

        // 调整位置为8的整数倍
        this._adjustPosition();

        // 如果产生碰撞，则回到之前的位置
        if (this._isCollisionWithMap() || this._isCollisionWithBlock() || this._isCollisionWithTank()) {
            this.node.position = oldPosition;
        }

        this.dir = dir;
        this.node.angle = -90 * this.dir;
        
        // 产生贴图
        // this._playAnimation('idle');
    }

    _autoMoving(realStep) {
        // 记录移动前的位置
        let {x,y} = this.node.position;
        let oldPosition = v3(x,y)
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
        // 如果产生碰撞，则回到之前的位置
        if (this._isCollisionWithMap() || this._isCollisionWithBlock() || this._isCollisionWithTank()) {
            this.node.position = oldPosition;
        }
    }
}