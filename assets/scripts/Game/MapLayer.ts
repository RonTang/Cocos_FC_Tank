import Game from "./Game";
import { Globals, Dir } from "../Globals";
import Bullet from "./Bullet";
import EnemyTank from "./EnemyTank";
import BlockWall from "./BlockWall";
import BaseTank from "./BaseTank";
import UpdateInformations from "./UpdateInformations";
import AudioMng from "../AudioMng";
import PlayerTank from "./PlayerTank";
import Prop from "./Prop";
import {
    _decorator,
    Component,
    Node,
    Prefab,
    NodePool,
    Vec3,
    Vec2,
    instantiate,
    assetManager,
    AssetManager,
    TextAsset,
    Animation,
    Rect,
    director,
    find,
    Label,
    UITransformComponent,
    UITransform,
    Sprite,
    SpriteFrame,
    CCString,
    tween,
    TweenAction,
    Tween
} from 'cc';

const { ccclass, property,executionOrder } = _decorator;
@ccclass('BlockData')
class BlockData{
    @property({tooltip:'块名',visible:true})
    blockName = ''
    @property({type:SpriteFrame,tooltip:'块帧',visible:true})
    blockFrame = null
}

@ccclass
export default class MapLayer extends Component {
    // 节点
    @property(Node)
    front_blocks: Node = null;
    @property(Node)
    players: Node = null;
    @property(Node)
    enemies: Node = null;
    @property(Node)
    blocks: Node = null;
    @property(Node)
    enemiesBullets: Node = null;
    @property(Node)
    playerBullets: Node = null;
    @property(Node)
    props: Node = null;

    // 预制资源
    @property(Prefab)
    blockWall: Prefab = null;
    @property(Prefab)
    blockStone: Prefab = null;
    @property(Prefab)
    blockForest: Prefab = null;
    @property(Prefab)
    blockIce: Prefab = null;
    @property(Prefab)
    blockRiver: Prefab = null;
    @property(Prefab)
    player1: Prefab = null;
    @property(Prefab)
    enemy: Prefab = null;
    @property(Prefab)
    bullet: Prefab = null;
    @property(Prefab)
    prop: Prefab = null;
   
    @property([BlockData])
    fenceBlockDatas: BlockData[] = [];
    blockTrans: Array<Array<UITransform>> = new Array<Array<UITransform>>();
    _game: Game;
    _audioMng: AudioMng;
    _bulletPool: NodePool;
    _enemiesPool: NodePool;
    _propPool: NodePool;
    _remainEnemiesCount: number;
    _pause: boolean = false;
    _revertAction :Tween<MapLayer> = null;
    createBullet(dir: Dir, pos: Vec3, step: number, tank: BaseTank ,level: number = 0) {
        if (tank.bulletCount <= 0)
            return;

        let bullet: Node;

        if (this._bulletPool.size() > 0) {
            bullet = this._bulletPool.get();
        } else {
            bullet = instantiate(this.bullet);
        }

        if (tank.isEnemy) {
            bullet.parent = this.enemiesBullets;
        } else {
            this._audioMng.playAudio("shoot", false);
            bullet.parent = this.playerBullets;
        }

        bullet.getComponent(Bullet).init(dir, pos, step, tank, level);
    }

    destoryBullet(bullet: Node) {
        this._bulletPool.put(bullet)
    }

    destoryEnemy(enemy: Node) {
        this._enemiesPool.put(enemy)
    }

    destoryProp(prop: Node){
        this._propPool.put(prop)
    }

    init() {
        this._pause = false;
        this._remainEnemiesCount = Globals.ENEMIES_COUNT;
        // 清理子节点
        this._cleanChildNode();
        // 加载地图
        this._loadMap();

        
    }
    spawn(){
        // 生成敌人
        this.spawnNewEnemy();

        // 初始化玩家
        for (const player of this.players.children) {
            player.getComponent(PlayerTank).reset();
        }

        // 每隔4.5秒生成一个敌人
        this._game.scheduleForever(this.spawnNewEnemy,this,0.5)
        // 检查游戏是否胜利
        this._game.scheduleForever(this.checkLevelUp, this, 0.1);
    }

    checkLevelUp(){
        //console.log(`${this.enemies.children.length},${this._remainEnemiesCount}`)
        if (this.enemies.children.length == 0 && this._remainEnemiesCount == 0) {
            //this.unscheduleAllCallbacks();
            // 两秒后跳转到下一关
            //this.scheduleOnce(this.toNextStage, 2);
            this._game.scheduleOne(this.toNextStage,this,2)
        }
    }

    onUpdate(dt: number){
        for(let playerNode of this.players.children){
            let tank = playerNode.getComponent(PlayerTank)
            tank.onUpdate(dt)
        }
        for(let i = this.enemies.children.length - 1; i >= 0; i--){
            let tank = this.enemies.children[i].getComponent(EnemyTank)
            tank.onUpdate(dt)
        }
        for(let i = this.playerBullets.children.length - 1; i >= 0; i--){
            let bullet = this.playerBullets.children[i].getComponent(Bullet)
            bullet.onUpdate(dt)
        }
        for(let i = this.enemiesBullets.children.length - 1; i >= 0; i--){
            let bullet = this.enemiesBullets.children[i].getComponent(Bullet)
            bullet.onUpdate(dt)
        }
        for(let i = this.props.children.length - 1; i >= 0; i--){
            let prop = this.props.children[i].getComponent(Prop)
            prop.onUpdate(dt)
        }
    }
    onLoad() {
        this._game = Game.single()
        this._audioMng = find("/Game/AudioMng").getComponent(AudioMng);

        this._bulletPool = new NodePool();
        this._enemiesPool = new NodePool();
        this._propPool = new NodePool();
        // 生成玩家
        this.spawnPlayer();

        this._game.gameEvent.on('bomb',this.killAllEnemy,this)
        this._game.gameEvent.on('pause',this.pauseAllEnemy,this)
        this._game.gameEvent.on('fence',this.reinforceFence,this)

    }
    isAIPaused(){
        return this._pause
    }
    pauseAllEnemy(player){
        this._pause = true;
        for(let enemy of this.enemies.children){
            enemy.getComponent(EnemyTank).pause()
        }
        this._game.unscheduleCallBackForTarget(this.resumeAllEnemy,this)
        this._game.scheduleOne(this.resumeAllEnemy, this, 8)
        //TODO: use  player to add score or any other function.
    }
    resumeAllEnemy(){
        for(let enemy of this.enemies.children){
            enemy.getComponent(EnemyTank).resume()
        }
        this._pause = false;
    }

    killAllEnemy(player){
        find("/Game/AudioMng").getComponent(AudioMng).playAudio("tank_bomb", false);
        for(let enemy of this.enemies.children){
            let tank = enemy.getComponent(EnemyTank)
            if(!tank.isStar)
                tank.disBlood(Globals.TANK_MAX_HP)
        }
        //TODO: use  player to add score or any other function.
    }
    reinforceFence(player){
        this.changeFence(Globals.FENCE_STONE)
        Game.single().stopAction(this._revertAction)
        Game.single().unscheduleCallBackForTarget(this.revertFence,this)
        Game.single().scheduleOne(this.revertFence,this,5)
        //TODO: use  player to add score or any other function.
    }
    revertFence(){
        this._revertAction = tween(this)
        for(let i = 0;i < 7; i++){
            this._revertAction.delay(0.3)
            .call(()=>this.changeFence(i % 2 + 1))
        }
        Game.single().runAction(this._revertAction)
    }
    changeFence(fenceType){
        let fencePos = [{line:0,col:11},{line:1,col:11},{line:2,col:11},
                        {line:2,col:12},{line:2,col:13},
                        {line:0,col:14},{line:1,col:14},{line:2,col:14}]

        for(let {line,col} of fencePos){
            let block = this.blockTrans[line][col]?.node
            if(block){
                block.getComponent(BlockWall)?.init()
                block.name = this.fenceBlockDatas[fenceType].blockName
                block.getComponent(Sprite).spriteFrame = this.fenceBlockDatas[fenceType].blockFrame
            
            }
        }
    }
    
    spawnNewEnemy() {
       
        if (this.enemies.children.length >= 100)
            return;

        if (this._remainEnemiesCount <= 0)
            return;
        
        if (this._remainEnemiesCount == Globals.ENEMIES_COUNT) {
            this.createEnemy(Globals.ENEMY1);
            this.createEnemy(Globals.ENEMY2);
            this.createEnemy(Globals.ENEMY3);
            
        } else if (this._remainEnemiesCount > 0) {
            let choice = Math.floor(this._game.getRandInt(0,2));
            //console.log(`Map spawn enemy ${choice}`)
            let pos: Vec2;

            if (choice == 0) {
                pos = Globals.ENEMY1;
            } else if (choice == 1) {
                pos = Globals.ENEMY2;
            } else {
                pos = Globals.ENEMY3;
            }

            if (true || this._canSpawnTank(pos)) {
                this.createEnemy(pos);
            }
        } 
    }

    spawnPlayer() {
        let player = instantiate(this.player1);
        player.parent = this.players;
    }

    createEnemy(pos: Vec2) {
        let enemy: Node;

        if (this._enemiesPool.size() > 0) {
            enemy = this._enemiesPool.get();
        } else {
            enemy = instantiate(this.enemy);
        }

        enemy.parent = this.enemies;
        enemy.getComponent(EnemyTank).init(new Vec3(pos.x, pos.y));

        // 更新信息区域
        find("/Canvas/GameLayer/Informations").getComponent(UpdateInformations).deleteOneIcon();

        this._remainEnemiesCount--;
    }
    createProp(){
        let prop: Node;
        if (this._propPool.size() > 0) {
            prop = this._propPool.get();
        } else {
            prop = instantiate(this.prop);
        }
        prop.parent = this.props;
        prop.getComponent(Prop).init()
    }

    toNextStage() {
        this._game.level = this._game.level + 1;
        this._game.unscheduleAllCallBacksForTarget(this)
        this._game.stopAction(this._revertAction)
        //fix bug that can shoot bullet when level up
        for(let player of this.players.children){
            player.getComponent(PlayerTank).controlStop() 
            player.getComponent(PlayerTank).canMove = false
        }
        //check gameover
        if(!this._game.gameover)
            this._game.gameStart();
       
    }

    _loadMap() {
       
        this.blockTrans = new Array<Array<UITransform>>(26)
        assetManager.loadBundle("maps", (err: Error, bundle: AssetManager.Bundle) => {
            bundle.load(this._game.level.toString(), TextAsset,  (err: Error, file: TextAsset) => {
                let data = file.text;
                let index = 0;

                for (let i = 0; i != 26; i++) {
                    
                    this.blockTrans[25 - i] = new Array<UITransform>(26)
                    for (let j = 0; j != 26; j++) {
                        let block: Node;

                        switch (data[index++]) {
                            case '3':
                                block = instantiate(this.blockWall);
                                block.name = "block_wall";
                                block.getComponent(BlockWall).init();
                                break;
                            case '5':
                                block = instantiate(this.blockStone);
                                block.name = "block_stone";
                                break;
                            case '1':
                                block = instantiate(this.blockForest);
                                block.name = "block_forest"
                                break;
                            case '2':
                                block = instantiate(this.blockIce);
                                break;
                            case '4':
                                block = instantiate(this.blockRiver);
                                block.name = "block_river";
                                break;
                            default:
                                break;
                        }

                        if (block) {
                            if(block.name != "block_forest")
                                block.parent = this.blocks;
                            else
                                block.parent = this.front_blocks;
                            block.getComponent(UITransform).setAnchorPoint(0, 0);
                            block.setPosition(j * Globals.BLOCK_SIZE, (25 - i) * Globals.BLOCK_SIZE);
                            this.blockTrans[25 - i][j] = block.getComponent(UITransform)
                        }else{
                            this.blockTrans[25 - i][j] = null
                        }
                    }
                }
                let home = this.blocks.children[0].getComponent(UITransform)
                this.blockTrans[0][12] = home
                this.blockTrans[0][13] = home
                this.blockTrans[1][12] = home
                this.blockTrans[1][13] = home
            });
        });
    }

    _canSpawnTank(pos: Vec2) {
        let box = new Rect(
            pos.x - Globals.TANK_SIZE / 2,
            pos.y - Globals.TANK_SIZE / 2,
            Globals.TANK_SIZE,
            Globals.TANK_SIZE
        );

        let enemies = this.enemies.children;
        let players = this.players.children;

        for (const enemy of enemies) {
            if (box.intersects(enemy.getComponent(UITransform).getBoundingBox()))
                return false;
        }

        for (const player of players) {
            if (box.intersects(player.getComponent(UITransform).getBoundingBox()))
                return false;
        }

        return true;
    }

    _cleanChildNode() {
        /*fix bug that game object don't clear! */
        for(let i = this.enemies.children.length - 1; i >= 0; i--){
            this.destoryEnemy(this.enemies.children[i])
        }

        for(let i = this.playerBullets.children.length - 1; i >= 0; i--){
            let playerBullet = this.playerBullets.children[i]
            playerBullet.getComponent(Bullet)._stopAnimation()
            if(!playerBullet.getComponent(Bullet).stopMoving){
                playerBullet.getComponent(Bullet).tank.bulletCount++      
            }
            this.destoryBullet(playerBullet)
        }

        for(let i = this.enemiesBullets.children.length - 1; i >= 0; i--){
            let enemyBullet = this.enemiesBullets.children[i]
            enemyBullet.getComponent(Bullet)._stopAnimation()
            if(!enemyBullet.getComponent(Bullet).stopMoving){
                enemyBullet.getComponent(Bullet).tank.bulletCount++      
            }
            this.destoryBullet(enemyBullet)
        }

        for(let i = this.blocks.children.length - 1; i >= 0; i--){
            if(this.blocks.children[i].name != "camp")
                this.blocks.children[i].destroy()
        }

        for(let i = this.front_blocks.children.length - 1; i >= 0; i--){
            this.front_blocks.children[i].destroy()
        }

        for(let i = this.props.children.length - 1; i >= 0; i--){
            this.destoryProp(this.props.children[i])
        }

    }

}
