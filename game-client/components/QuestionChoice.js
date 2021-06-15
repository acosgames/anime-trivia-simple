
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
        let speakStage = this.props.speakStage - 1;
        if (speakStage < this.props.id)
            return <React.Fragment></React.Fragment>
        return (
            <div id={'q' + this.props.id} className="question-choice">

                <button
                    dangerouslySetInnerHTML={{ __html: this.props.choiceText }}
                    onClick={() => {
                        this.selectChoice(index)
                    }}>
                </button>

            </div>
        )
    }

}

export default fs.connect(['speakStage', ''])(QuestionChoice);