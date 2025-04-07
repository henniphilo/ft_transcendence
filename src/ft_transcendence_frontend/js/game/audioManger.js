import * as THREE from 'three';

export class AudioManager {
    constructor(listener) {
        this.listener = listener;  // Der Listener, an den alle Sounds gebunden sind
        this.sounds = {};          // Speichert alle geladenen Sounds
    }

    loadSound(name, path, options = {}) {
        return new Promise((resolve, reject) => {
            const sound = new THREE.PositionalAudio(this.listener);
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load(path, (buffer) => {
                sound.setBuffer(buffer);
                sound.setRefDistance(options.refDistance || 20);  // Standardwert
                sound.setLoop(options.loop || false);
                this.sounds[name] = sound;  // Speichern des Sounds unter dem Namen
                resolve(sound);
            }, undefined, (error) => {
                reject(error);
            });
        });
    }

    playSound(name) {
        const sound = this.sounds[name];
        if (sound && !sound.isPlaying) {
            sound.play();
        }
    }

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
