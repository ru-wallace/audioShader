class AudioProcessor {
    private audioContext: AudioContext;
    private analyser: AnalyserNode;
    private track: MediaElementAudioSourceNode;
    private frequencyData: Uint8Array;
    private timeDomainData: Uint8Array;
    private bufferLength: number;



    constructor(audioElement: HTMLAudioElement) {
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
}

export { AudioProcessor };
    