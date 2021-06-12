
import React, { Component } from 'react';
import fs from 'flatstore';

class Speak extends Component {
    constructor(props) {
        super(props);
        this.button = null;
        this.prevQuestion = null;
    }

    speak(text) {

        var msg = new SpeechSynthesisUtterance();
        var voices = speechSynthesis.getVoices();
        console.log(voices);
        // msg.voice = voices[10];
        // msg.voiceURI = 'native';
        msg.volume = 1;
        msg.rate = 1;
        msg.pitch = 2;
        msg.text = text;
        msg.lang = 'en-US';

        speechSynthesis.speak(msg);
    }

    render() {
        // let speakReady = this.props.speakReady;
        // if (!speakReady) {
        //     return (<React.Fragment></React.Fragment>)
        // }
        let curQuestion = this.props['state-question'];
        if (curQuestion == this.prevQuestion) {
            return (<React.Fragment></React.Fragment>);
        }

        this.prevQuestion = curQuestion;
        setTimeout(() => {
            if (!this.button)
                return;
            this.button.click();
            this.speak(curQuestion);
        }, 1000)


        return (
            <div>
                <button
                    onClick={() => { }}
                    ref={el => {
                        this.button = el;
                    }}></button>
            </div>
        )
    }

}

export default fs.connect(['state-question', 'speakReady'])(Speak);