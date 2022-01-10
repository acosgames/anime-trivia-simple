
import React, { Component } from 'react';

import fs from 'flatstore';

class Players extends Component {
    constructor(props) {
        super(props);
    }

    createPlayer(player) {
        return (
            <div className="hstack-noh" key={"player" + player.id}>
                <span className="player">{player.name}</span>
                <span className="playerscore">{player.score || 0}</span>
            </div>
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

        let events = fs.get('events');
        let isGameover = events?.gameover;

        return (
            <div className={isGameover ? 'players-gameover' : 'player-panel'}>
                {this.renderPlayers()}
            </div>
        )
    }

}

export default fs.connect(['players', 'next-id', 'events-gameover'])(Players);;