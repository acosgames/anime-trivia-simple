import React from 'react';
import ReactDOM from 'react-dom';
import { GameLoader } from './acosg';
import './index.scss';

import Gamescreen from './components/gamescreen';

ReactDOM.render(
  <GameLoader component={Gamescreen} />,
  document.getElementById('root')
);