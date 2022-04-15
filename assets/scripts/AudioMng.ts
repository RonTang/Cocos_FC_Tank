import {
    _decorator,
    Component,
    AudioClip,
    AudioSource,
    CCBoolean,

} from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export default class AudioMng extends Component {
    @property({type:AudioSource})
    audioSource: AudioSource = null;
    @property({ type: AudioClip })
    binAudio: AudioClip = null;
    @property({ type: AudioClip })
    shootAudio: AudioClip = null;
    @property({ type: AudioClip })
    playerMoveAudio: AudioClip = null;
    @property({ type: AudioClip })
    tankBombAudio: AudioClip = null;
    @property({ type: AudioClip })
    campBombAudio: AudioClip = null;
    @property({ type: AudioClip })
    gameOverAudio: AudioClip = null;
    @property({ type: AudioClip })
    gameStartAudio: AudioClip = null;
    @property({ type: AudioClip})
    binTankAudio : AudioClip = null;
    @property({ type: AudioClip})
    addLifeAudio : AudioClip = null;
    @property({ type: AudioClip})
    propOutAudio : AudioClip = null;
    @property({ type: AudioClip})
    getPropAudio : AudioClip = null;
    @property(CCBoolean)
    enableAudio: boolean = true;
    
    playerMoveID: number;

    playAudio(name: string, loop = false) {
        if (!this.enableAudio) return;

        if (name == "bin") {
            this.audioSource.playOneShot(this.binAudio);
        } else if(name == "bin_tank"){
            this.audioSource.playOneShot(this.binTankAudio);
        }
        else if (name == "shoot") {
            this.audioSource.playOneShot(this.shootAudio);
        } else if (name == "player_move") {
            this.audioSource.clip = this.playerMoveAudio;
            this.audioSource.loop = true;
            this.audioSource.volume = 0.8;
            if(!this.audioSource.playing)
                this.audioSource.play();   
        } else if (name == "tank_bomb") {
            this.audioSource.playOneShot(this.tankBombAudio);
        } else if (name == "game_over") {
            this.audioSource.playOneShot(this.gameOverAudio);
        } else if (name == "game_start") {
            this.audioSource.playOneShot(this.gameStartAudio);
        } else if (name == "camp_bomb") {
            this.audioSource.playOneShot(this.campBombAudio);
        } else if(name == "add_life") {
            this.audioSource.playOneShot(this.addLifeAudio);
        } else if(name == "get_prop") {
            this.audioSource.playOneShot(this.getPropAudio);
        } else if(name == "prop_out") {
            this.audioSource.playOneShot(this.propOutAudio);
        }
    }

    stopAudio(name: string) {
        if (!this.enableAudio) return;

        if (name == "player_move") {
            this.audioSource.stop()
        }
    }
}
