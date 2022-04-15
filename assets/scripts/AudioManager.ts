import { AudioClip, AudioSource, assert, warn, clamp01, resources } from "cc";
export class AudioManager {

    private static _instance: AudioManager;
    private static _audioSource?: AudioSource;

    static get instance () {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new AudioManager();
        return this._instance;
    }

    /**管理器初始化*/
    init (audioSource: AudioSource) {
        AudioManager._audioSource = audioSource;
    }

      /**
     * 播放音乐
     * @param {Boolean} loop 是否循环播放
     */
    playMusic (loop: boolean) {
        const audioSource = AudioManager._audioSource!;
        assert(audioSource, 'AudioManager not inited!');

        audioSource.loop = loop;
        if (!audioSource.playing) {
            audioSource.play();
        }
    }
    stopMusic(){
        const audioSource = AudioManager._audioSource!;
        assert(audioSource, 'AudioManager not inited!');
        if(audioSource.playing){
            audioSource.stop();
        }
           
    }

     /**
     * 播放音效
     * @param {AudioClip} audioClip 音效名称
     * @param {Number} volumeScale 播放音量倍数
     */
    playSound (audioClip: AudioClip, volumeScale: number = 1 ) {
        const audioSource = AudioManager._audioSource!;
        assert(audioSource, 'AudioManager not inited!');

        // 注意：第二个参数 “volumeScale” 是指播放音量的倍数，最终播放的音量为 “audioSource.volume * volumeScale”
        audioSource.playOneShot(audioClip, volumeScale);

    }
    // 设置音乐音量
    setMusicVolume (flag: number) {
        const audioSource = AudioManager._audioSource!;
        assert(audioSource, 'AudioManager not inited!');

        flag = clamp01(flag);
        audioSource.volume = flag;
    }

}