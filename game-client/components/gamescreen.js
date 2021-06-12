
import React, { Component } from 'react';
import fs from 'flatstore';

import AlertPanel from './alertpanel';
import PlayerList from './playerlist';
import Question from './Question';

import Speech from 'react-speech';

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
        return (
            <div className="gamewrapper" ref={el => {
                if (!el) return;
                this.ref = el;
                setTimeout(this.updatePosition.bind(this), 2000);
            }}>
                {/* <AlertPanel /> */}

                <PlayerList />
                {/* <Speech stop={true}
                    pause={true}
                    resume={true}
                    text="Welcome to react speech"
                    voice="Microsoft Mark - English (United States)" /> */}
                <div className="gamescreen">

                    <div className="gamearea">
                        <Question></Question>
                    </div>

                </div>
            </div>

        )
    }

}

export default Gamescreen;