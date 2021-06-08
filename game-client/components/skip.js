
import React, { Component } from 'react';
import fs from 'flatstore';
import { send } from '../fsg';

class Skip extends Component {
    constructor(props) {
        super(props);
    }

    getTimeFormatted() {
        let timeleft = fs.get('timeleft') || 0;

        try {
            if (typeof timeleft != 'number')
                timeleft = Number.parseInt(timeleft);

            timeleft = Math.ceil(timeleft / 1000);
        }
        catch (e) {
            timeleft = 0;
        }


        return (<span>{timeleft}</span>)
    }

    skipPlayer() {
        // let id = this.props['next-id'];
        send('skip')
        send('skip')
        send('skip')
        send('skip')
        send('skip')
        send('skip')
        send('skip')
    }

    render() {

        let id = this.props['next-id'];
        if (id != '*') {
            return (<React.Fragment></React.Fragment>);
        }


        let timeleft = this.props.timeleft;
        if (timeleft <= 0) {
            return (
                <button onClick={this.skipPlayer.bind(this)}>Continue</button>
            )
        }

        return (<React.Fragment></React.Fragment>);

    }

}

export default fs.connect(['timeleft', 'next-id'])(Skip);