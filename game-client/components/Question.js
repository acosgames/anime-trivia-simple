
import React, { Component } from 'react';
import fs from 'flatstore';

import Skip from './skip';
import Speak from './Speak';
import QuestionText from './QuestionText';
import QuestionChoice from './QuestionChoice';

fs.set('state-question', null);
fs.set('state-choices', null);
fs.set('state-category', null);

fs.set('speakStage', 0);

let choiceTable = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'
]
class Question extends Component {
    constructor(props) {
        super(props);

        this.prevQuestion = null;
        this.speakStage = 0;
    }

    render() {
        let question = this.props['state-question'];

        // if (this.prevQuestion == question)
        //     return <React.Fragment></React.Fragment>;

        this.speakStage = 0;

        let state = fs.get('state');
        let choices = state.choices;
        if (!choices) {
            return (<React.Fragment></React.Fragment>)
        }


        let choicesText = choices.map((choice, index) => {
            let alpha = + choiceTable[index] + ', ';
            alpha = '';
            return ((index == choices.length - 1) ? 'or ' : '') + alpha + choice;
        });

        // setTimeout(() => { this.speak(question); }, 1000)
        if (this.prevQuestion != question) {
            speechSynthesis.cancel();
            fs.set('speakText', question);
            fs.set('speakStage', 0);
        }

        this.prevQuestion = question;


        return (
            <div className="question">
                <Skip></Skip>
                <Speak
                    onEnd={() => {
                        if (this.speakStage == 0) {
                            fs.set('speakText', "Is it");
                        }
                        else if (this.speakStage <= choicesText.length) {
                            fs.set('speakText', choicesText[this.speakStage - 1]);
                        }

                        fs.set('speakStage', this.speakStage);
                        this.speakStage++;

                    }}>
                </Speak>
                <QuestionText></QuestionText>

                {choices.map((choice, index) =>
                (
                    <QuestionChoice key={'qc-' + index} id={index} choiceText={choiceTable[index] + ') ' + choice}></QuestionChoice>

                )
                )}

            </div>

        )
    }

}

export default fs.connect(['state-question'])(Question);