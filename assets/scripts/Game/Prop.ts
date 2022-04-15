import Game from './Game';
import MapLayer from "./MapLayer";
const { ccclass, property } = _decorator;
import {
    _decorator,
    Node,
    SpriteFrame,
    Component,
    find,
    Sprite,
    tween,
    Tween,
    UITransform,
    UIOpacity,
    Rect,
} from 'cc';
import { Globals } from '../Globals';
import AudioMng from '../AudioMng';
@ccclass
export default class Prop extends Component {
    @property([SpriteFrame])
    frames: SpriteFrame[] = [];
    mapLayer: MapLayer;
    action: Tween<UIOpacity>
    events: string[] = ['life','power','pause','bomb','fence','invincible']
    eventId: string
    init() {
        this.mapLayer = find("/Canvas/GameLayer/MapLayer").getComponent(MapLayer);
        find("/Game/AudioMng").getComponent(AudioMng).playAudio("prop_out", false);
        let sprite = this.getComponent(Sprite)
        // 随机变成一种道具
        let idx = Game.single().getRandInt(0,this.frames.length - 1)
        sprite.spriteFrame = this.frames[idx]
        this.eventId = this.events[idx]
        // 随机放在一个地点
        let x = Game.single().getRandInt(Globals.BLOCK_SIZE,Globals.MAP_WIDTH-Globals.BLOCK_SIZE)
        let y = Game.single().getRandInt(Globals.BLOCK_SIZE,Globals.MAP_HEIGHT-Globals.BLOCK_SIZE)
        this.node.setPosition(x,y)
        // 闪烁动画
        let opacity = this.getComponent(UIOpacity)
        let ac = tween().to(0.8,{opacity:0}).to(0.8,{opacity:255})
        this.action = tween(opacity).repeatForever(ac)
        Game.single().runAction(this.action)
        // 10秒后消失
        Game.single().scheduleOne(this.onPropDestory,this,10)
    }
    onUpdate(dt: number){
        this.check()
    }
    _isCollisionWithPlayer(player: Node){
        let box = this.getComponent(UITransform).getBoundingBox()
        box = new Rect(box.xMin+2,box.yMin+2,box.width-4,box.height-4)
        let playerBox = player.getComponent(UITransform).getBoundingBox()
        if(box.intersects(playerBox))
            return true
        return false
    }
    // 检查玩家是否拾取
    check() {
        for (let player of this.mapLayer.players.children){
            if(this._isCollisionWithPlayer(player)){
                this.effective(player)
                break
            }
        }
    }

    onPropDestory() {
        Game.single().stopAction(this.action)
        Game.single().unscheduleAllCallBacksForTarget(this)
        this.mapLayer.destoryProp(this.node)
    }

    // 产生效果
    effective(player: Node) {
        
        if(this.eventId != 'life') 
        find("/Game/AudioMng").getComponent(AudioMng).playAudio("get_prop", false);
        console.log(`${this.eventId}`)
        Game.single().gameEvent.emit(this.eventId,player)
        this.onPropDestory()
    }
}
