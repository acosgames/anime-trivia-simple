
import React, { Component } from 'react';
import fs from 'flatstore';

import AlertPanel from './alertpanel';
import Players from './Players';
import Question from './Question';

import WinScreen from './WinScreen';
import PlayButton from './PlayButton';
import RemainingTime from './RemainingTime';

fs.set('userActivation', false);

class Gamescreen extends Component {
    constructor(props) {
        super(props);
        this.ref = null;
    }

    updatePosition() {
        if (!this.ref)
            return;

        let rect = JSON.stringify(this.ref.getBoundingClientRect());
        rect = JSON.parse(rect);
        rect.offsetWidth = this.ref.offsetWidth;
        rect.offsetHeight = this.ref.offsetHeight;

        fs.set('gamearea', rect);
    }


    render() {
        // let userActivation = fs.get('userActivation');
        // if (!userActivation) {
        //     return <PlayButton />
        // }

        let events = fs.get('events');
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
            <div className="vstack vcenter relative" ref={el => {
                if (!el) return;
                this.ref = el;
                setTimeout(this.updatePosition.bind(this), 2000);
            }}>


                <Players />
                <RemainingTime />
                <Question></Question>


            </div>

        )
    }

}

export default fs.connect(['userActivation', 'events-gameover'])(Gamescreen);