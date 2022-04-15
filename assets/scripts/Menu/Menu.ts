
import {
    _decorator,
    Component,
    director,
    find,
    Label
} from 'cc';

const { ccclass } = _decorator;

// TODO 添加菜单
@ccclass
export default class Menu extends Component {
    onLoad() {
        director.preloadScene("game");
        
    }

    onBtnOne() {
        director.loadScene("game");
    }

    onBtnMore() {
        //自动匹配玩家,加入房间
    }
}
