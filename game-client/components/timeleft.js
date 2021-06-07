
import React, { Component } from 'react';
import fs from 'flatstore';

class Timeleft extends Component {
    constructor(props) {
        super(props);
    }

    getTimeFormatted() {
        let timeleft = fs.get('nextTimeLeft') || 0;

        try {
            if (typeof timeleft != 'number')
                timeleft = Number.parseInt(timeleft);

            timeleft = Math.ceil(timeleft / 1000);
        }
        catch (e) {
            timeleft = 0;
        }


        return (<div><div>{this.props['state-round']}</div><span>{timeleft}</span></div>)
    }

    render() {
        return (
            <div className="timeleft">
                {this.getTimeFormatted()}
            </div>

        )
    }

}

export default fs.connect(['nextTimeLeft', 'state-round'])(Timeleft);