
import React, { Component } from 'react';
import fs from 'flatstore';

import { send } from '../fsg';
import Skip from './skip';

fs.set('state-question', null);
fs.set('state-choices', null);
fs.set('state-category', null);

let choiceTable = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'
]
class Question extends Component {
    constructor(props) {
        super(props);

        this.ref = null;
    }

    selectChoice(id) {
        console.log("Selected: ", id);
        send('pick', { choice: id })

    }

    speak(text) {
        var msg = new SpeechSynthesisUtterance();
        var voices = speechSynthesis.getVoices();
        msg.voice = voices[10];
        msg.voiceURI = 'native';
        msg.volume = 1;
        msg.rate = 1;
        msg.pitch = 2;
        msg.text = text;
        msg.lang = 'en-US';

        speechSynthesis.speak(msg);
    }


    render() {
        let question = this.props['state-question'];
        let state = fs.get('state');
        let choices = state.choices;
        if (!choices) {
            return (<React.Fragment></React.Fragment>)
        }

        setTimeout(() => { this.speak(question); }, 1000)

        return (
            <div className="question">
                <Skip></Skip>
                <button
                    onClick={() => { this.speak(question); }}
                    ref={el => {
                        this.ref = el;
                        setTimeout(() => {
                            el.click();
                        }, 1000)
                    }}></button>
                <h5 dangerouslySetInnerHTML={{ __html: question }}></h5>
                {choices.map((choice, index) =>
                (
                    <div>
                        <button
                            dangerouslySetInnerHTML={{ __html: choiceTable[index] + ') ' + choice }}
                            onClick={() => {
                                this.selectChoice(index)
                            }}>
                        </button>
                    </div>
                )
                )}

            </div>

        )
    }

}

export default fs.connect(['state-question'])(Question);