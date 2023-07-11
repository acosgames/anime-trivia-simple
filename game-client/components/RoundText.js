import fs from 'flatstore';

export default function RoundText(props) {

    let [state] = fs.useWatch('state');
    let [room] = fs.useWatch('room');
    if (room?.status != 'gamestart') {
        return <></>
    }

    return <div className="round-text">Round {state?.round}</div>
}