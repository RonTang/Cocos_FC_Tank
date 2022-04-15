import PlayerTank from "./PlayerTank";
import { Dir } from "../Globals";
import {
    _decorator,
    Node,
    sys,
    EventTouch,
    SpriteFrame,
    Vec3,
    v2,
    v3,
    Animation,
    Component,
    director,
    find,
    Label,
    UITransform
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class TouchControl extends Component {
    @property([Node])
    buttons: Node[] = [];

    _player: PlayerTank = null;
    _node: Node = null;

    onLoad() {
        this._node = find("/Canvas");
        this._player = find("/Canvas/GameLayer/MapLayer/players").children[0].getComponent(PlayerTank);

        if (sys.isMobile) {
            this.node.active = true;
        } else {
            this.node.active = false;
        }
        /*
        if (CC_DEBUG) {
            this.node.active = true;
        }*/
    }

    onEnable() {
        this._node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
        this._node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
    }

    onDisable() {
        this._node.off(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
        this._node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
    }

    onTouchStart(event: EventTouch) {
        let globalPos = this._node.getComponent(UITransform).convertToNodeSpaceAR(v3(event.getUILocation().x,event.getUILocation().y));
       
        if (this.node.getComponent(UITransform).getBoundingBox().contains(v2(globalPos.x,globalPos.y))) {
            let pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(event.getUILocation().x,event.getUILocation().y));
            let pos2d = v2(pos.x,pos.y)
            if (this.buttons[0].getComponent(UITransform).getBoundingBox().contains(pos2d)) {
                this._player.control(Dir.LEFT);
            } else if (this.buttons[1].getComponent(UITransform).getBoundingBox().contains(pos2d)) {
                this._player.control(Dir.UP);
            } else if (this.buttons[2].getComponent(UITransform).getBoundingBox().contains(pos2d)) {
                this._player.control(Dir.RIGHT);
            } else if (this.buttons[3].getComponent(UITransform).getBoundingBox().contains(pos2d)) {
                this._player.control(Dir.DOWN);
            }
        } else {
            this._player.shoot();
        }
    }

    onTouchEnd(event: EventTouch) {
        let pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(event.getUILocation().x,event.getUILocation().y));
        let pos2d = v2(pos.x,pos.y)
        if (this.buttons[0].getComponent(UITransform).getBoundingBox().contains(pos2d) ||
            this.buttons[1].getComponent(UITransform).getBoundingBox().contains(pos2d) ||
            this.buttons[2].getComponent(UITransform).getBoundingBox().contains(pos2d) ||
            this.buttons[3].getComponent(UITransform).getBoundingBox().contains(pos2d)) {
            this._player.controlStop();
        }
    }

}
