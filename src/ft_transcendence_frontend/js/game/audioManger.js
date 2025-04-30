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

    // Alle Sounds muten (nur Lautstärke auf 0 setzen, nicht stoppen)
    stopAllSounds() {
        Object.keys(this.sounds).forEach(name => {
            const sound = this.sounds[name];
            if (sound.isPlaying) {
                sound.setVolume(0);
                // console.log(`🔇 Muted sound "${name}"`);
            }
        });
    }


    // Alle Sounds abspielen (nur Lautstärke wiederherstellen bei bereits laufenden Sounds)
    playAllSounds() {
        Object.keys(this.sounds).forEach(name => {
            const sound = this.sounds[name];
            const volume = sound.originalVolume ?? 1;

            if (sound.isPlaying) {
                sound.setVolume(volume);
                // console.log(`🔊 Unmuted sound "${name}" – volume restored to ${volume}`);
            } else {
                console.log(`⏸️ Sound "${name}" is not playing – volume remains muted`);
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

    mute() {
        this.isMuted = true;
        this.stopAllSounds();
    }

    unmute() {
        this.isMuted = false;
        this.playAllSounds();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopAllSounds();
        } else {
            this.playAllSounds();
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
