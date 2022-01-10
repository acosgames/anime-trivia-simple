
import React, { Component } from 'react';
import fs from 'flatstore';

class QuestionText extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let question = this.props.question;
        return (
            <div
                className="question-text"
                dangerouslySetInnerHTML={{ __html: question }}>
            </div>
        )
    }
}

export default fs.connect([])(QuestionText);