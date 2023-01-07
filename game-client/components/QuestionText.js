
import React, { Component } from 'react';
import fs from 'flatstore';

function QuestionText(props) {

    let [state] = fs.useWatch('state');

    let question = state?.question;
    return (
        <div
            className="question-text"
            dangerouslySetInnerHTML={{ __html: question }}>
        </div>
    )
}

export default QuestionText;