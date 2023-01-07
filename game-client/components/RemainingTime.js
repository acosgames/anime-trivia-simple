
import React, { Component } from 'react';
import fs from 'flatstore';

function RemainingTime(props) {


    let [state] = fs.useWatch('state');
    let [timeleft] = fs.useWatch('timeleft');

    let round = state?.round || 0;
    timeleft = Number(timeleft) || 0;
    timeleft = Math.ceil(timeleft / 1000);

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

export default RemainingTime;