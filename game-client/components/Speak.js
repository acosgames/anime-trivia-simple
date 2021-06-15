
import React, { Component } from 'react';
import fs from 'flatstore';

class Speak extends Component {
    constructor(props) {
        super(props);
        this.button = null;
        this.prevQuestion = null;
        speechSynthesis.getVoices()
    }

    speak(text) {

        fs.set('speakDone', false);
        var msg = new SpeechSynthesisUtterance();
        var voices = speechSynthesis.getVoices();

        var englishVoices = [];
        for (var i = 0; i < voices.length; i++) {
            let voice = voices[i];
            if (voice.lang == 'en-US')
                englishVoices.push(voice);
        }
        console.log(englishVoices);
        msg.voice = englishVoices[0];

        text = text.replace(/\&[^;]*;/ig, "");
        //msg.voiceURI = englishVoices[0].voiceURI;
        msg.volume = 1;
        msg.rate = 1;
        msg.pitch = 1;
        msg.text = text;
        // msg.lang = 'en-US';
        msg.onend = (event) => {
            fs.set('speakDone', true);
            if (this.props.onEnd)
                this.props.onEnd(event)
        }

        speechSynthesis.speak(msg);
    }

    render() {
        // let speakReady = this.props.speakReady;
        // if (!speakReady) {
        //     return (<React.Fragment></React.Fragment>)
        // }
        let curQuestion = this.props['speakText'];
        if (curQuestion == this.prevQuestion) {
            return (<div>
                <button
                    onClick={() => { }}
                    ref={el => {
                        this.button = el;
                    }}></button>
            </div >);
        }

        this.prevQuestion = curQuestion;

        this.speak(curQuestion);



        return (
            <div>
                <button
                    onClick={() => { }}
                    ref={el => {
                        this.button = el;
                    }}></button>
            </div >
        )
    }

}

export default fs.connect(['speakText', 'speakReady'])(Speak);