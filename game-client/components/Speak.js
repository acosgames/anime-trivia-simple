
import React, { Component } from 'react';
import fs from 'flatstore';

//NOTE: I wanted to add speaking, but its not necessary for the demo

function Speak(props) {

    let button = null;
    let prevQuestion = null;
    let voicesExist = false;
    let voices = speechSynthesis.getVoices()
    speechSynthesis.onvoiceschanged = () => {
        voicesExist = true;
    }

    fs.subscribe('speakText', onSpeakText);

    let [speakText] = fs.useWatch('speakText');
    let [speakReady] = fs.useWatch('speakReady');

    const onSpeakText = () => {
        let curQuestion = fs.get('speakText');
        if (curQuestion == prevQuestion || curQuestion == '') {
            return;
        }
        prevQuestion = curQuestion;
        speak(curQuestion);
    }

    const speak = (text) => {
        if (!voicesExist) {
            setTimeout(() => { speak(text) }, 1000);
            return;
        }
        fs.set('speakDone', false);
        var msg = new SpeechSynthesisUtterance();
        if (!voices || voices.length == 0)
            voices = speechSynthesis.getVoices();

        var englishVoices = [];
        for (var i = 0; i < voices.length; i++) {
            let voice = voices[i];
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
            if (props.onEnd)
                props.onEnd(event)
        }

        speechSynthesis.speak(msg);
    }

    return (
        <React.Fragment></React.Fragment>
    )


}

export default Speak;