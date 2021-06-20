
import React, { Component } from 'react';
import fs from 'flatstore';

let winnerTable = [
    '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'
]

class WinScreen extends Component {
    constructor(props) {
        super(props);
    }

    createWinner(index, name) {
        return (<li key={index + name}><span>{winnerTable[index]}</span> {name}</li>)
    }

    processWinners() {
        let winners = fs.get('state-winners');
        let players = fs.get('players');

        let winnerList = [];
        let winpos = 0;
        let lastPoints = null;
        for (var i = 0; i < winners.length; i++) {
            let id = winners[i];
            let player = players[id];
            if (lastPoints != null && lastPoints != player.points)
                winpos++;
            winnerList.push(this.createWinner(winpos, player.name))

            lastPoints = player.points;
        }
        return winnerList;
    }

    render() {

        if (!this.props.events || !this.props.events['winner']) {
            return <React.Fragment></React.Fragment>
        }

        speechSynthesis.cancel();
        let winnerList = this.processWinners();

        return (
            <div className="winner">
                <ul>{winnerList}</ul>
            </div>

        )
    }

}

export default fs.connect(['events'])(WinScreen);