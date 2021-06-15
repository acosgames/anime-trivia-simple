
import React, { Component } from 'react';
import fs from 'flatstore';

class QuestionText extends Component {
    constructor(props) {
        super(props);
    }


    render() {
        let question = fs.get('state-question');
        return (
            <div className="question-choice" dangerouslySetInnerHTML={{ __html: question }}>
            </div>

        )
    }

}

export default fs.connect(['speakStage', ''])(QuestionText);