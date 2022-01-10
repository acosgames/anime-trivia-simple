
import React, { Component } from 'react';
import fs from 'flatstore';

class RemainingTime extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let round = this.props['state-round'] || 0;
        let timeleft = fs.get('timeleft') || 0;
        timeleft = Number(timeleft) || 0;
        timeleft = Math.ceil(timeleft / 1000);

        let state = fs.get('state');
        let stage = state?.stage || -1;
        if (stage == 1) {
            return (
                <div className="timeleft">
                    <div className="center">
                        <div className="round-text">Round {round}</div>
                        <span className="time-text">Next round in {timeleft}</span>
                    </div>
                </div>

            )
        }


        return (
            <div className="timeleft">
                <div className="center">
                    <div className="round-text">Round {round}</div>
                    <span className="time-text">{timeleft}</span>
                </div>
            </div>

        )
    }

}

export default fs.connect(['timeleft', 'state-round'])(RemainingTime);