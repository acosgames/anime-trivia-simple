
import React, { Component } from 'react';
import fs from 'flatstore';

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

        fs.subscribe('state-question', this.onQuestionChange.bind(this));
        let question = fs.get('state-question') || '';
        //fs.set('state-question', question);
        this.state = { question };
    }

    onQuestionChange() {
        let question = fs.get('state-question');
        if (!question || question.length == 0)
            return;

        fs.set('choice', null);

        if (this.prevQuestion != question) {
            speechSynthesis.cancel();
            fs.set('speakText', question);
            fs.set('speakStage', 0);
        }
        else {
            return;
        }

        let choices = fs.get('state-choices');
        this.choicesText = choices.map((choice, index) => {
            let alpha = + choiceTable[index] + ', ';
            alpha = '';
            return ((index == choices.length - 1) ? 'or ' : '') + alpha + choice;
        });

        this.prevQuestion = question;

        this.setState({ question });

    }

    onSpeakEnd() {
        let round = fs.get('state-round');
        let maxRounds = fs.get('rules-rounds');

        let choices = fs.get('state-choices');
        if (!choices || round > maxRounds) {
            return;
        }

        if (this.speakStage == 0) {
            fs.set('speakText', "Is it");
        }
        else if (this.choicesText && this.speakStage <= this.choicesText.length) {
            fs.set('speakText', this.choicesText[this.speakStage - 1]);
        }

        fs.set('speakStage', this.speakStage);
        this.speakStage++;
    }

    render() {
        let state = fs.get('state');
        let rules = fs.get('rules');

        let choices = state.choices;
        let round = state.round;
        let maxRounds = rules.rounds;
        let question = state.question;
        this.speakStage = 0;

        if (!choices || round > maxRounds) {
            return (<React.Fragment></React.Fragment>)
        }


        return (
            <div className="question vstack-noh  hcenter">
                {/* <Speak onEnd={this.onSpeakEnd.bind(this)}></Speak> */}
                <QuestionText question={question}></QuestionText>
                <div className="choices vstack-zero vcenter hcenter">
                    {choices.map((choice, index) => (
                        <QuestionChoice key={'qc-' + index} id={index} choiceText={choice}></QuestionChoice>
                    ))}
                </div>
            </div>
        )
    }
}

export default fs.connect(['state-question'])(Question);