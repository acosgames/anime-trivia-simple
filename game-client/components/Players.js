
import React, { Component } from 'react';

import fs from 'flatstore';

function Players(props) {

    let [players] = fs.useWatch('players');
    let [next] = fs.useWatch('next');
    let [room] = fs.useWatch('room');


    const createPlayer = (player, isLocal) => {
        return (
            <div className={`hstack-noh ${isLocal ? 'localPlayer' : ''}`} key={"player" + player.id}>
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
        for (var id in players) {
            let player = players[id];
            playerList.push(createPlayer(player, player.name == local?.name))
        }

        return playerList;
    }


    let roomStatus = room?.status;
    let isGameover = roomStatus == 'gameover';


    if (room?.status != 'gamestart' && room?.status != 'gameover') {
        return <></>
    }

    return (
        <div className={isGameover ? 'players-gameover' : 'player-panel'}>
            {renderPlayers()}
        </div>
    )


}

export default Players;