class AudioProcessor {
    private audioElement: HTMLAudioElement;
    private audioContext: AudioContext;
    private analyser: AnalyserNode;
    private track: MediaElementAudioSourceNode;
    private frequencyData: Uint8Array;
    private timeDomainData: Uint8Array;
    private bufferLength: number;



    constructor(audioElement: HTMLAudioElement) {
        this.audioElement = audioElement;
        this.audioContext = new AudioContext();
        if (!this.audioContext) {
            throw new Error('AudioContext not supported');
        }


        this.analyser = this.audioContext.createAnalyser();
        this.track = this.audioContext.createMediaElementSource(audioElement);
        this.track.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.analyser.fftSize = 2048;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.frequencyData = new Uint8Array(this.bufferLength);
        this.timeDomainData = new Uint8Array(this.bufferLength);
    }

    getBufferLength() {
        return this.bufferLength;
    }

    getFrequencyData(buffer: Uint8Array) {
        this.analyser.getByteFrequencyData(buffer);
    }
    getTimeDomainData() {
        this.analyser.getByteTimeDomainData(this.timeDomainData);
        return this.timeDomainData;
    }

    play() {
        this.audioElement.play();
    }
    pause() {
        this.audioElement.pause();
    }

    toggle() {
        if (this.audioElement.paused) {
            this.play();
        }
        else {
            this.pause();
        }
    }

}

export { AudioProcessor };
    