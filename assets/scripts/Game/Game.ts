import UpdateInformations from "./UpdateInformations";
import MapLayer from "./MapLayer";
import AudioMng from "../AudioMng";
import { GameMode } from "../Globals";
import { Random } from "../Math/Math";

import {
    _decorator,
    Component,
    Prefab,
    Camera,
    Color,
    tween,
    instantiate,
    EventTarget,
    director,
    find,
    view,
    v3,
    Label,
    UITransformComponent,
    CCInteger,
    UITransform,
    TweenSystem,
    Scheduler,
    Tween,
    game,
    macro,
    Node,
    AnimationManager,
    PhysicsSystem2D,
} from 'cc';
const { ccclass, property,executionOrder} = _decorator;

@ccclass
@executionOrder(-1)
export default class Game extends Component {
    @property(Prefab)
    black: Prefab = null;
    @property(CCInteger)
    _level: number = 1;
    _gameMode: GameMode = GameMode.ONE;
    actionManager = new TweenSystem().ActionManager
    scheduler = new Scheduler()
    gameEvent = new EventTarget()
    @property(MapLayer)
    mapLayer: MapLayer = null
    gameLayer: Node = null
    stageArea: Node = null
    gameover: boolean = false
    /* 帧同步 */
    frameIndex = 0
    frameList = []
    room: Colyseus.Room = null

    private static instance = null
    static single(){
        return Game.instance;
    }
    @property({
        type: CCInteger,
        min: 1,
        max: 35
    })
    get level(): number {
        return this._level;
    }

    set level(v: number) {
        if (v > 35) v -= 35;
        this._level = v;
    }
  
    gameStart() {
        // 播放开始游戏音效
        find("/Game/AudioMng").getComponent(AudioMng).playAudio("game_start");

        // 隐藏GameLayer和Stage
        find("/Canvas/GameLayer").active = false;
        find("/Canvas/StageArea").active = false;

        // 设置相机背景色
        find("/Canvas/Camera").getComponent(Camera).clearColor
            = new Color(100, 100, 100);

        // 展示开场动画
        this.showAnimation();
    }

    gameOver() {
        this.gameover = true;
        this.scheduler.unscheduleAll()
        
        let visableSize = view.getVisibleSize();

        let gameOverNode = find("/Canvas/External/gameover_up");
        gameOverNode.setPosition(0, -visableSize.height / 2 - gameOverNode.getComponent(UITransformComponent).height / 2);

        let ac = tween(gameOverNode)
            .to(1.5, { position: v3(0, 0) })
            .delay(0.5)
            .call(() => {
                // 播放失败音效
                find("/Game/AudioMng").getComponent(AudioMng).playAudio("game_over");

                // 禁用其他节点
                find("/Canvas/GameLayer").active = false;
                find("/Canvas/External/gameover_left").active = false;
                find("/Canvas/External/gameover_up").active = false;
                this.mapLayer._cleanChildNode()
                // 切换到Game Over
                find("/Canvas/Camera").getComponent(Camera).clearColor
                    = new Color(0, 0, 0);
                let bigGameOVer = find("/Canvas/External/big_gameover");
                bigGameOVer.setPosition(0, 0);

                // TODO 2秒后回到主界面
                // cc.director.preloadScene("Menu");
                // this.scheduleOnce(() => {
                //     cc.director.loadScene("Menu");
                // }, 2);
            })
            //.start();
        this.runAction(ac)
         
    }

    onLoad() {
        //this.room = find("/Connection").getComponent(Connection).room;
        Random.setSeed(10265016)
        if(!Game.instance){
            Game.instance = this
            game.addPersistRootNode(this.node)
        }else{
            this.node.destroy()
        }
        this.gameLayer =  find("/Canvas/GameLayer");
        this.mapLayer = this.gameLayer.getChildByName("MapLayer").getComponent(MapLayer);
        this.stageArea = find("/Canvas/StageArea");

        
    }
    start(){
        this.gameStart();
    }
    
    runAction(tween) {
        if(!tween || !tween._target) 
            return tween
        if (tween?._finalAction) {
            this.actionManager.removeAction(tween._finalAction)
        }
        tween._finalAction = tween._union();
        tween._finalAction.setTag(tween._tag);
        this.actionManager.addAction(tween._finalAction, tween._target, false)
    }
    stopAction(tween) {
        if (tween?._finalAction) {
            this.actionManager.removeAction(tween._finalAction)
        }
    }
    gameLoop(){
        let dt = 0.018
        this.actionManager.update(dt)
        this.scheduler.update(dt)
        this.frameIndex++
        this.mapLayer.onUpdate(0.02)
        
    }
    scheduleOne(callback,target,delay){
        Scheduler.enableForTarget(target)
        this.scheduler.schedule(callback,target,0,0,delay,false)
    }
    scheduleForever(callback,target,interval,delay = 0){
        Scheduler.enableForTarget(target)
        this.scheduler.schedule(callback,target,interval,macro.REPEAT_FOREVER,delay,false)
    }
    unscheduleCallBackForTarget(callback,target){
        this.scheduler.unschedule(callback,target)
    }
    unscheduleAllCallBacksForTarget(target){
        this.scheduler.unscheduleAllForTarget(target)
    }
    getRandInt(min,max){
        return Random.getUniformInt(min,max)
    }
    getRandom(){
        return Random.getUniform()
    }
    onUpdate(idx,data){

    }
    update(){
        this.gameLoop()
    }
    showAnimation() {
        let visableSize = view.getVisibleSize();

        // 展示动画
        let blackUp = instantiate(this.black);
        blackUp.getComponent(UITransform).width = visableSize.width;
        blackUp.setPosition(0, visableSize.height / 2 + blackUp.getComponent(UITransform).height / 2);

        let blackDown = instantiate(this.black);
        blackDown.getComponent(UITransform).width = visableSize.width;
        blackDown.setPosition(0, -(visableSize.height / 2 + blackDown.getComponent(UITransform).height / 2));

        let canvas = find("/Canvas");

        blackUp.parent = canvas;
        blackDown.parent = canvas;
        let ac1 = tween(blackUp)
            .to(0.5, { position: v3(0, visableSize.height / 4) })
            .call(() => {
                blackUp.destroy();
            })
            //.start();

        let ac2 = tween(blackDown)
            .to(0.5, { position: v3(0, -visableSize.height / 4) })
            .call(() => {
                blackDown.destroy();

                // 展示stage
                this.showStage();
            })
            //.delay(1)
            //.start();
        this.runAction(ac1)
        this.runAction(ac2)
    }

    showStage() {
        //let stageArea = find("/Canvas/StageArea");

        // 激活Stage
        this.stageArea.active = true;
        this.stageArea.getChildByName("level").getComponent(Label).string = this._level.toString();
        //let gameLayer = find("/Canvas/GameLayer");
        //let mapLayer = gameLayer.getChildByName("MapLayer").getComponent(MapLayer);
        //预加载地图 
        this.mapLayer.init()
        // 一秒后切换到游戏界面
        
        this.scheduleOne(() => {
            // 关闭Stage
            console.log(this.frameIndex)
            this.stageArea.active = false;

            // 开启GameLayer
            this.gameLayer.active = true;
            let informations = this.gameLayer.getChildByName("Informations").getComponent(UpdateInformations);
            // 初始化信息区域
            informations.init(this._level);
            // 启动生成逻辑
            this.mapLayer.spawn();
        }, this,0.5);
        
    }
}
