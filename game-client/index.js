import React from 'react';
import ReactDOM from 'react-dom';
import { GameLoader } from './fsg';
import './index.css';

import Gamescreen from './components/gamescreen';

ReactDOM.render(
  <GameLoader component={Gamescreen} />,
  document.getElementById('root')
);