
import React, { Component } from 'react';
import fs from 'flatstore';

export default function QuestionText(props) {

    let [state] = fs.useWatch('state');

    let question = state?.question;
    return (
        <div className="question-text">{question}</div>
    )
}
