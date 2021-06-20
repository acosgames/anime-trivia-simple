
import React, { Component } from 'react';

import fs from 'flatstore';
import Timeleft from './timeleft';

class PlayerList extends Component {
    constructor(props) {
        super(props);
    }

    createPlayer(player) {
        return (
            <li key={player.id}>
                <h2><span className="username">{player.name}</span> {player.points || 0}</h2>
            </li>
        )
    }

    renderPlayers() {
        //not initialized yet


        //draw local player name
        let local = fs.get('local');
        let players = fs.get('players');

        if (!players) {
            return (<React.Fragment></React.Fragment>)
        }

        let playerList = [];

        playerList.push(this.createPlayer(local));

        for (var id in players) {
            let player = players[id];
            if (player.name == local.name)
                continue;
            playerList.push(this.createPlayer(player))
        }

        return playerList;
    }

    render() {
        return (
            <div className="player-panel">
                <ul className="playerlist">
                    {this.renderPlayers()}
                </ul>
                <Timeleft></Timeleft>
            </div>
        )
    }

}

export default fs.connect(['players', 'next-id'])(PlayerList);;