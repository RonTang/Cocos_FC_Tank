import { Globals } from "../Globals";
import {
    _decorator,
    Component,
    Prefab,
    instantiate,
    Node,
    director,
    find,
    Label,
    UITransformComponent
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class UpdateInformations extends Component {
    @property(Prefab)
    enemyIcon: Prefab = null;
    @property(Node)
    enemiesIcon: Node = null;

    deleteOneIcon() {
        this.enemiesIcon.children[this.enemiesIcon.children.length - 1].destroy();
    }

    updatePlayerBlood(blood: number) {
        this.node.getChildByName("player_blood").getComponent(Label).string = blood.toString();
    }

    init(level: number) {
        // 清理子节点
        this.enemiesIcon.removeAllChildren();

        const column = 2;
        const row = Globals.ENEMIES_COUNT / column;

        // 添加坦克图标
        for (let i = 0; i != row - 1; i++) {
            for (let j = 0; j != column; j++) {
                let node = instantiate(this.enemyIcon);
                node.name = "icon";
                node.parent = this.enemiesIcon;
            }
        }

        this.node.getChildByName("cur_level").getComponent(Label).string = level.toString();
    }
}
