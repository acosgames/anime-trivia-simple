
import React, { Component } from 'react';
import fs from 'flatstore';

class Speak extends Component {
    constructor(props) {
        super(props);
        this.button = null;
        this.prevQuestion = null;
        this.voicesExist = false;
        this.voices = speechSynthesis.getVoices()
        speechSynthesis.onvoiceschanged = () => {
            this.voicesExist = true;
        }

        fs.subscribe('speakText', this.onSpeakText);
    }

    onSpeakText = () => {
        let curQuestion = fs.get('speakText');
        if (curQuestion == this.prevQuestion || curQuestion == '') {
            return;
        }
        this.prevQuestion = curQuestion;
        this.speak(curQuestion);
    }

    speak(text) {
        if (!this.voicesExist) {
            setTimeout(() => { this.speak(text) }, 1000);
            return;
        }
        fs.set('speakDone', false);
        var msg = new SpeechSynthesisUtterance();
        if (!this.voices || this.voices.length == 0)
            this.voices = speechSynthesis.getVoices();

        var englishVoices = [];
        for (var i = 0; i < this.voices.length; i++) {
            let voice = this.voices[i];
            if (voice.lang == 'en-US')
                englishVoices.push(voice);
        }
        console.log(englishVoices);
        msg.voice = englishVoices[1];

        text = text.replace(/\&[^;]*;/ig, "");
        //msg.voiceURI = englishVoices[0].voiceURI;
        msg.volume = 1;
        msg.rate = 1;
        msg.pitch = 1;
        msg.text = text;
        msg.lang = msg.voice.lang;
        msg.onend = (event) => {
            fs.set('speakDone', true);
            if (this.props.onEnd)
                this.props.onEnd(event)
        }

        speechSynthesis.speak(msg);
    }

    render() {
        return (
            <React.Fragment></React.Fragment>
        )
    }

}

export default fs.connect(['speakText', 'speakReady'])(Speak);