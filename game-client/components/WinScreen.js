
import React, { Component } from 'react';
import fs from 'flatstore';

let winnerTable = [
    '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'
]

export default function WinScreen(props) {


    let [events] = fs.useWatch('events');

    const createWinner = (winpos, player) => {
        return (
            <div className={"hstack-noh player-gameover player-" + winpos} key={"player" + player.name}>
                <span className="winpos">{winnerTable[winpos]}</span>
                <span className="player">{player.name}</span>
                <span className="playerscore">{player.score || 0}</span>
            </div>
        )
    }

    const processWinners = () => {
        let winners = events?.gameover;
        let players = fs.get('players');

        let winnerList = [];
        let winpos = 0;
        let lastscore = null;
        for (var i = 0; i < winners.length; i++) {
            let id = winners[i];
            let player = players[id];
            if (lastscore != null && lastscore != player.score)
                winpos++;
            winnerList.push(createWinner(winpos, player))

            lastscore = player.score;
        }
        return winnerList;
    }


    speechSynthesis.cancel();
    let winnerList = processWinners();

    return (
        <div className="players-gameover">
            <ul>{winnerList}</ul>
        </div>

    )


}
