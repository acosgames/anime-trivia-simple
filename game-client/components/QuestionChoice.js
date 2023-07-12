
import React, { Component, useEffect } from 'react';
import fs from 'flatstore';

import { send } from '../acosg';

let choiceTable = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'
]

function ChoiceText(props) {
    let className = 'choice ';
    className += props.isSelected ? 'selected ' : ' ';
    className += (props.status == 'correct') ? 'correct ' : (props.status == 'incorrect' ? 'incorrect ' : ' ');

    return (
        <div className={className} onClick={props.onClick} >
            <div className="choice-box">
                <div className="choice-hover">
                    <span className="choice-alpha">{choiceTable[props.id]}</span>
                    <span className="choice-text" dangerouslySetInnerHTML={{ __html: props.choiceText }}></span>
                </div>

            </div>
        </ div>
    )
}


export default function QuestionChoice(props) {
    let [localChoice] = fs.useWatch('local-_choice');
    let [state] = fs.useWatch('state');

    const selectChoice = (id) => {
        if (state.stage != 0)
            return;

        console.log("Selected: ", id);
        send('pick', { choice: id })
        //fs.set('choice', id);
    }

    useEffect(() => {
        //fs.set('choice', -1);
    }, [state.round])

    // let local = fs.get('local');
    let isSelected = localChoice == props.id;
    // if (local) {
    //     isSelected = local._choice == props.id;
    // }
    let status = 'none';
    let correctClass = '';

    if (state?.stage == 1) {
        if (state?.a == props.choiceText) {
            status = 'correct';
            correctClass = 'correct';
        } else {
            status = 'incorrect';
        }
    }

    return (
        <div className={"hstack-zero fullwidth vcenter hcenter " + correctClass}>
            <ChoiceText isSelected={isSelected} status={status} choiceText={props.choiceText} id={props.id} onClick={() => {
                selectChoice(props.id)
            }} />
        </div>
    )
}