import Game from "./Game";
import AudioMng from "../AudioMng";
import {
    _decorator,
    Component,
    director,
    find,
    Label,
    UITransformComponent,
    SpriteFrame,
    Sprite
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class BlockCamp extends Component {
    @property(SpriteFrame)
    destoryed: SpriteFrame = null;

    tryDestory() {
        this.getComponent(Sprite).spriteFrame = this.destoryed;

        // 播放爆炸音效
        find("/Game/AudioMng").getComponent(AudioMng).playAudio("camp_bomb");

        // 摧毁后播放上升的game over动画
        find("/Game").getComponent(Game).gameOver();
        Game.single().gameover = true
    }
}