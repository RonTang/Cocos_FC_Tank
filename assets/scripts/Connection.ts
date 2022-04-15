import Game from "./Game/Game";
import Colyseus from 'db://colyseus-sdk/colyseus.js';
import { GameMode, Globals } from "./Globals";


import {
    _decorator,
    Component,
    PhysicsSystem2D,
    Scheduler,
    game,
    director,
    setDisplayStats,
    TweenSystem,
    EventTarget,
    tween,
    Tween,
    EPhysics2DDrawFlags,
    find,
    Label,
    EditBox,
    macro,
    CCString
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class Connection extends Component {
    userName: string = '';
    userId: string = '';
    roomId: string = '';
    client: Colyseus.Client = null;
    room: Colyseus.Room = null;
    @property()
    ip: string = 'ws://localhost'
    @property()
    port: string = '2567'
    onLoad() {
        game.addPersistRootNode(this.node);
        director.preloadScene('game');
        this.client = new Colyseus.Client(this.ip+':'+this.port)
        console.log('preload game scene....')
    }
    async connect() {
        
        try {
            this.room = await this.client.joinOrCreate("ShootingGalleryRoom",{name:this.userName})
            console.log("joined successfully", this.room);
            this.init()
          
        } catch (error) {
            console.error('join room failed...',error)
            return false
        }
        
        return true
    }
    async reconnect(){
        if(this.userId && this.roomId){
            try{
                this.room = await this.client.reconnect(this.roomId,this.userId)
                director.loadScene('game')
                return true
                
            }catch(error){
                console.error('重新连接失败...',error)
                this.userId=''
                this.roomId=''
                localStorage.removeItem('session')
                localStorage.removeItem('room')
                localStorage.removeItem('username')
                return false
                
            }
        }
        return false
    }
    init(){
        this.room.onMessage('init',(msg)=>{
            console.log(`客户端加入房间成功${msg.sessionId},${msg.name}`)
            this.userId = msg.sessionId
            this.userName = msg.name
            localStorage.setItem('session',this.userId)
            localStorage.setItem('room',this.room.id)
            localStorage.setItem('username',this.userName)
            /*加入成功,保存userid and name */
            director.loadScene('game')
           
        })

    }
}
