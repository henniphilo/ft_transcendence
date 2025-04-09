import * as THREE from 'three';

export class AudioManager {
    constructor(listener) {
        this.listener = listener;
        this.sounds = {}; // Hält alle geladenen Sounds
        this.isMuted = false; // Wenn der Sound ausgeschaltet ist
    }

    // Sound laden
    loadSound(name, path, options = {}) {
        return new Promise((resolve, reject) => {
            const sound = new THREE.PositionalAudio(this.listener);
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load(path, (buffer) => {
                sound.setBuffer(buffer);
                sound.setRefDistance(options.refDistance || 20);
                sound.setLoop(options.loop || false);
                sound.originalVolume = sound.getVolume(); // Speichern der ursprünglichen Lautstärke
                this.sounds[name] = sound;
                resolve(sound);
            }, undefined, (error) => {
                reject(error);
            });
        });
    }

    // Alle Sounds stoppen (Lautstärke auf 0 setzen, um stummzuschalten)
    stopAllSounds() {
        Object.keys(this.sounds).forEach(name => {
            const sound = this.sounds[name];
            sound.setVolume(0); // Lautstärke auf 0 setzen, um "stumm" zu schalten
        });
    }

    // Alle Sounds abspielen
    playAllSounds() {
        Object.keys(this.sounds).forEach(name => {
            const sound = this.sounds[name];
            if (!sound.isPlaying && !this.isMuted) {
                sound.play();
                sound.setVolume(sound.originalVolume); // Wieder die ursprüngliche Lautstärke setzen
            }
        });
    }

    // Pausiere alle Sounds
    pauseAllSounds() {
        Object.keys(this.sounds).forEach(name => {
            const sound = this.sounds[name];
            if (sound.isPlaying) {
                sound.pause();
            }
        });
    }

    // Toggle-Logik: Stummschalten oder Wiederherstellen der Lautstärke
    toggleAllSounds(enable) {
        this.isMuted = !enable; // Schaltet zwischen mute und unmute um
        if (enable) {
            this.playAllSounds(); // Wenn aktiv, spiele alle Sounds mit ursprünglicher Lautstärke ab
        } else {
            this.stopAllSounds(); // Wenn deaktiviert, setze Lautstärke auf 0
        }
    }

    // Einzelnen Sound abspielen
    playSound(name) {
        const sound = this.sounds[name];
        if (sound && !this.isMuted && !sound.isPlaying) {
            sound.play();
            sound.setVolume(sound.originalVolume); // Lautstärke wiederherstellen
        }
    }

    // Einzelnen Sound stoppen
    stopSound(name) {
        const sound = this.sounds[name];
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    isPlaying(soundName) {
        return this.sounds[soundName] && this.sounds[soundName].isPlaying;
    }

    getSound(name) {
        return this.sounds[name];
    }
}

let globalAudioManager = null;

export function setGlobalAudioManager(manager) {
    globalAudioManager = manager;
}

export function getGlobalAudioManager() {
    return globalAudioManager;
}
