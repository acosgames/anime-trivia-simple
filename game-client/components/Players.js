
import React, { Component } from 'react';

import fs from 'flatstore';

function Players(props) {

    let [players] = fs.useWatch('players');
    let [next] = fs.useWatch('next');
    let [room] = fs.useWatch('room');


    const createPlayer = (player) => {
        return (
            <div className="hstack-noh" key={"player" + player.id}>
                <span className="player">{player.name}</span>
                <span className="playerscore">{player.score || 0}</span>
            </div>
        )
    }

    const renderPlayers = () => {
        //not initialized yet
        //draw local player name
        let local = fs.get('local');

        if (!players) {
            return (<React.Fragment></React.Fragment>)
        }

        let playerList = [];

        playerList.push(createPlayer(local));

        for (var id in players) {
            let player = players[id];
            if (player.name == local.name)
                continue;
            playerList.push(createPlayer(player))
        }

        return playerList;
    }


    let roomStatus = room?.status;
    let isGameover = roomStatus == 'gameover';

    return (
        <div className={isGameover ? 'players-gameover' : 'player-panel'}>
            {renderPlayers()}
        </div>
    )


}

export default Players;