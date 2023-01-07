
import React, { Component } from 'react';
import fs from 'flatstore';

import { send } from '../acosg';

let choiceTable = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'
]

function ChoiceText(props) {



    return (
        <div>
            <span className="choice-alpha">{choiceTable[props.id] + ') '}</span>
            <span className="choice-text" dangerouslySetInnerHTML={{ __html: props.choiceText }}></span>
        </div>
    )
}

function IncorrectAnswer(props) {

    return (
        <div className="incorrect-text">
            <svg width="24px" height="24px" viewBox="0 0 24 24">

                <rect width="24" height="24" transform="rotate(180 12 12)" opacity="0" />
                <path d="M13.41 12l4.3-4.29a1 1 0 1 0-1.42-1.42L12 10.59l-4.29-4.3a1 1 0 0 0-1.42 1.42l4.3 4.29-4.3 4.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4.29-4.3 4.29 4.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z" />

            </svg>
        </div >
    )
}

function CorrectAnswer(props) {

    return (
        <div className="correct-text">
            <svg id="Capa_1" x="0px" y="0px"
                width="22px" height="22px" viewBox="0 0 78.369 78.369"
            >
                <path d="M78.049,19.015L29.458,67.606c-0.428,0.428-1.121,0.428-1.548,0L0.32,40.015c-0.427-0.426-0.427-1.119,0-1.547l6.704-6.704
		c0.428-0.427,1.121-0.427,1.548,0l20.113,20.112l41.113-41.113c0.429-0.427,1.12-0.427,1.548,0l6.703,6.704
		C78.477,17.894,78.477,18.586,78.049,19.015z"/>

            </svg>
        </div>
    )
}

function QuestionChoice(props) {


    let [choice] = fs.useWatch('choice');
    let [state] = fs.useWatch('state');

    const selectChoice = (id) => {

        if (state.stage != 0)
            return;

        console.log("Selected: ", id);
        //for (var i = 0; i < 1000; i++) {
        send('pick', { choice: id })
        //}
        fs.set('choice', id);

    }

    // let timeleft = fs.get('timeleft');
    let timer = fs.get('timer');
    let local = fs.get('local');
    // let events = fs.get('events');
    // let round = state?.round || 0;
    let maxTime = timer[1];
    // let speakStage = this.props.speakStage - 1;
    // if (speakStage < this.props.id && timeleft > maxTime - 15)
    //     return <React.Fragment></React.Fragment>
    let id = 'q' + props.id;
    let isSelected = local.choice == props.id;
    let classSelected = isSelected ? 'selected' : '';



    let status;
    let correctClass = '';

    if (state?.stage == 1) {

        if (state?.a == props.choiceText) {
            status = <CorrectAnswer id={props.id} />
            correctClass = 'correct';
        } else {
            status = <IncorrectAnswer id={props.id} />
        }

    }

    return (
        <div className={"hstack-zero choice vcenter hcenter " + correctClass}>
            <button key={id} id={id} className={"choice-button " + classSelected}
                onClick={() => {
                    selectChoice(props.id)
                }}>
                <ChoiceText choiceText={props.choiceText} id={props.id} />
            </button>
            {status}
        </div>

    )

}

export default QuestionChoice;