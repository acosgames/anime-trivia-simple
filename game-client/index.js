import React from 'react';
import ReactDOM from 'react-dom';
import { GameLoader } from './acosg';
import './index.scss';

import GameDisplay from './components/GameDisplay';

ReactDOM.render(
  <GameLoader component={GameDisplay} />,
  document.getElementById('root')
);