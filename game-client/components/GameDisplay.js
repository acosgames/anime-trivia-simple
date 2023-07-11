
import React, { Component, useEffect, useState } from 'react';
import fs from 'flatstore';

import Players from './Players';
import Question from './Question';

import WinScreen from './WinScreen';
import RemainingTime from './RemainingTime';
import RoundText from './RoundText';
import GameTitle from './GameTitle';
import NotificationUserPicked from './NotificationUserPicked';

fs.set('userActivation', false);

export default function GameDisplay(props) {

    let [events] = fs.useWatch('events');

    if (events?.gameover) {
        return (
            <div id="rays" className="gameover vstack vcenter relative">
                <h3 className="gameover-text">Game Over</h3>
                <WinScreen></WinScreen>

                <h3 className="thanks-text">Thanks for playing!</h3>
            </div>
        )
    }

    let room = fs.get('room');

    if (room?.status != 'gamestart') {
        return (
            <div id="rays" className="starting">
                <GameTitle />
            </div>
        )
    }

    return (
        <div id="rays" className="vstack vcenter relative ">
            <Players />
            <RoundText></RoundText>
            <RemainingTime />
            <Question></Question>
            <NotificationUserPicked></NotificationUserPicked>
        </div>

    )

}


