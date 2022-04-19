import { Globals } from "../Globals";
import {
    _decorator,
    Component,
    Prefab,
    instantiate,
    Node,
    Label
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class UpdateInformations extends Component {
    @property(Prefab)
    enemyIcon: Prefab = null;
    @property(Node)
    enemiesIcon: Node = null;

    enemiesCount: number = 0;
    deleteOneIcon() {
        this.enemiesIcon.children[this.enemiesCount - 1].destroy();
        this.enemiesCount--;
    }

    updatePlayerBlood(blood: number) {
        this.node.getChildByName("player_blood").getComponent(Label).string = blood.toString();
    }

    init(level: number) {
        // 清理子节点
        this.enemiesIcon.removeAllChildren();

        const column = 2;
        const row = Globals.ENEMIES_COUNT / column;
        this.enemiesCount = Globals.ENEMIES_COUNT;
        // 添加坦克图标
        for (let i = 0; i != row; i++) {
            for (let j = 0; j != column; j++) {
                let node = instantiate(this.enemyIcon);
                node.name = "icon";
                node.parent = this.enemiesIcon;
            }
        }

        this.node.getChildByName("cur_level").getComponent(Label).string = level.toString();
    }
}
