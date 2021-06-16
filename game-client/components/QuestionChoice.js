
import React, { Component } from 'react';
import fs from 'flatstore';

import { send } from '../fsg';

class QuestionChoice extends Component {
    constructor(props) {
        super(props);
    }

    selectChoice(id) {
        console.log("Selected: ", id);
        send('pick', { choice: id })

    }

    render() {
        let timeleft = fs.get('timeleft');
        let timer = fs.get('timer');
        let maxTime = timer[1];
        let speakStage = this.props.speakStage - 1;
        if (speakStage < this.props.id && timeleft > maxTime - 15)
            return <React.Fragment></React.Fragment>
        let id = 'q' + this.props.id;
        return (
            <div key={id} id={id} className="question-choice">

                <button
                    dangerouslySetInnerHTML={{ __html: this.props.choiceText }}
                    onClick={() => {
                        this.selectChoice(this.props.id)
                    }}>
                </button>

            </div>
        )
    }

}

export default fs.connect(['speakStage', ''])(QuestionChoice);