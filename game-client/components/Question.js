
import React, { Component, useState } from 'react';
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
function Question(props) {

    let [state] = fs.useWatch('state');


    let [question, setQuestion] = useState('');

    let prevQuestion = null;
    let speakStage = 0;
    let choicesText = [];

    const onQuestionChange = () => {
        let question = fs.get('state-question');
        if (!question || question.length == 0)
            return;

        fs.set('choice', null);

        if (prevQuestion != question) {
            speechSynthesis.cancel();
            fs.set('speakText', question);
            fs.set('speakStage', 0);
        }
        else {
            return;
        }

        let choices = fs.get('state-choices');
        let choicesText = choices.map((choice, index) => {
            let alpha = + choiceTable[index] + ', ';
            alpha = '';
            return ((index == choices.length - 1) ? 'or ' : '') + alpha + choice;
        });

        prevQuestion = question;

        // this.setState({ question });
        setQuestion(question);

    }

    fs.subscribe('state-question', onQuestionChange);

    const onSpeakEnd = () => {
        let round = fs.get('state-round');
        let maxRounds = fs.get('rules-rounds');

        let choices = fs.get('state-choices');
        if (!choices || round > maxRounds) {
            return;
        }

        if (speakStage == 0) {
            fs.set('speakText', "Is it");
        }
        else if (choicesText && speakStage <= choicesText.length) {
            fs.set('speakText', hoicesText[speakStage - 1]);
        }

        fs.set('speakStage', speakStage);
        speakStage++;
    }

    let rules = fs.get('rules');

    let choices = state.choices;
    let round = state.round;
    let maxRounds = rules.rounds;
    speakStage = 0;

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

export default Question;