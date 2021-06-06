
import React, { Component } from 'react';
import fs from 'flatstore';

class Line extends Component {
    constructor(props) {
        super(props);
        this.state = { width: 0, height: 0 };
    }

    //set up defaults on page mount
    componentDidMount() {

        this.getDimensions();

        //add dimensions listener for window resizing
        window.addEventListener('resize', this.getDimensions);
        window.addEventListener('paint', this.getDimensions);
    }

    //remove listener on page exit
    componentWillUnmount() {
        window.removeEventListener('resize', this.getDimensions);
        window.removeEventListener('paint', this.getDimensions);
    }

    //actually set the state to the window dimensions
    getDimensions = () => {
        this.setState({ width: window.innerWidth, height: window.innerHeight });
        console.log(this.state);
    }

    isArrEqual(arr1, arr2) {
        let filtered = arr1.filter((v, i) => arr1[i] == arr2[i]);
        if (arr1.length != arr2.length)
            return false;
        if (arr1.length == 0)
            return false;
        if (filtered.length != arr1.length)
            return false;
        return true;
    }

    render() {
        let strip = [0, 1, 2];

        strip = this.props['prev-strip'];
        if (!strip) {
            return <React.Fragment></React.Fragment>
        }
        let gamearea = fs.get('gamearea');
        let start = fs.get('cell' + strip[0]);
        let end = fs.get('cell' + strip[2]);

        if (!start || !end || !this.props.events.winner)
            return (<React.Fragment></React.Fragment>)

        let x1 = start.left + (start.offsetWidth / 2);
        let y1 = start.top + (start.offsetHeight / 2);
        let x2 = end.left + (end.offsetWidth / 2);
        let y2 = end.top + (end.offsetHeight / 2);

        let celltype = fs.get('state-cells-' + strip[0]) || '';
        let color = 'color-' + celltype.toUpperCase();
        return (
            <svg className="line"><line className={color} id="line1" x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="6" ></line></svg>
        )
    }
}

export default fs.connect(['prev-strip', 'events'])(Line);