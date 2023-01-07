
import React, { Component } from 'react';
import fs from 'flatstore';

import AlertPanel from './alertpanel';
import Players from './Players';
import Question from './Question';

import WinScreen from './WinScreen';
import PlayButton from './PlayButton';
import RemainingTime from './RemainingTime';

fs.set('userActivation', false);

function Gamescreen(props) {

    let [events] = fs.useWatch('events');

    if (events?.gameover) {
        return (
            <div className="vstack vcenter relative">
                <h3 className="gameover-text">Game Over</h3>
                <WinScreen></WinScreen>

                <h3 className="thanks-text">Thanks for playing!</h3>
            </div>
        )
    }

    return (
        <div className="vstack vcenter relative">
            <Players />
            <RemainingTime />
            <Question></Question>
        </div>

    )

}

export default Gamescreen;