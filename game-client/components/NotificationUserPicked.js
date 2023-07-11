
import fs from 'flatstore';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function NotificationUserPicked(props) {

    let [events] = fs.useWatch('events');
    let picked = events.picked;

    useEffect(() => {
        let players = fs.get('players');
        if (!picked)
            return;
        let player = players[picked];
        toast(`${player.name} made their pick!`, { duration: 1200, position: 'bottom-center', })
    }, [picked])


    const renderUsers = () => {
        let elems = [];



        for (let i = 0; i < users.length; i++) {
            if (!(users[i] in players))
                continue;
            elems.push(<div key={'user-picked-' + users[i]} className="user-picked">{players[users[i]].name}</div>)
        }

        return elems;
    }

    return (
        <div><Toaster /></div>
    )
}