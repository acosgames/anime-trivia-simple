
import React, { Component } from 'react';
import fs from 'flatstore';

export default function RemainingTime(props) {


    let [state] = fs.useWatch('state');
    let [timeleft] = fs.useWatch('timeleft');
    let [room] = fs.useWatch('room');

    let timer = fs.get('timer');
    let seconds = timer?.seconds;

    let round = state?.round || 0;
    timeleft = Number(timeleft) || 0;
    timeleft = Math.ceil(timeleft / 1000);

    let stage = state?.stage || -1;
    if (stage == 1) {
        return (
            <div className="timeleft">
                <div className="center">
                    {/* <div className="round-text">Round {round}</div> */}
                    <span className="time-text">Next round in {timeleft}</span>
                </div>
            </div>

        )
    }

    let activeClass = '';
    if (typeof seconds !== 'undefined' && timeleft < seconds) {
        activeClass = 'active';
    }


    if (room?.status != 'gamestart') {
        return <></>
    }

    return (
        <div className="timeleft">
            <div className="center">

                {/* <span className="time-text">{timeleft}</span> */}

                <div className={`time-circle ${timeleft < 6 ? 'pulse_animation' : ''}`}>
                    {timeleft}
                    <svg className='countdown'>
                        <circle
                            className={`stroke-blue-500 transition-all duration-1000 ease-linear ${activeClass} ${timeleft < 6 ? ' stroke-red-500' : ''}`}
                            pathLength={'100'} r="48" cx="60" cy="60"
                            style={{
                                strokeDashoffset: (((timeleft / seconds) * 100)),
                                transition: `stroke-dashoffset ${activeClass == 'active' ? 1 : 0}s linear`
                            }}></circle>
                    </svg>
                </div>
            </div>
        </div>

    )

}
