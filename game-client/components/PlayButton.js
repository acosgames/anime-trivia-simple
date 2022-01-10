
import fs from 'flatstore';
import { send } from '../acosg';

function PlayButton(props) {

    const onClick = () => {
        fs.set('userActivation', true);

        send('ready', true);
    }
    return (
        <div className="vstack vcenter hcenter">
            <button className="playButton" onClick={onClick}>
                I'm Ready
            </button>
        </div>
    )
}

export default PlayButton;