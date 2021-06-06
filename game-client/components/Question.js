
import React, { Component } from 'react';
import fs from 'flatstore';

import { send } from '../fsg';

fs.set('state-question', null);
fs.set('state-choices', null);
fs.set('state-category', null);

let choiceTable = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'
]
class Question extends Component {
    constructor(props) {
        super(props);
    }

    selectChoice(id) {
        console.log("Selected: ", id);
        send('pick', { choice: id })

    }

    render() {
        let question = this.props['state-question'];
        let state = fs.get('state');
        let choices = state.choices;
        if (!choices) {
            return (<React.Fragment></React.Fragment>)
        }

        return (
            <div className="question">
                <h5 dangerouslySetInnerHTML={{ __html: question }}></h5>
                {choices.map((choice, index) =>
                (
                    <div>
                        <button
                            dangerouslySetInnerHTML={{ __html: choiceTable[index] + ') ' + choice }}
                            onClick={() => {
                                this.selectChoice(index)
                            }}>
                        </button>
                    </div>
                )
                )}
            </div>

        )
    }

}

export default fs.connect(['state-question'])(Question);