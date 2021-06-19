import fsg from './fsg';
import PopTrivia from './game';



fsg.on('newgame', (action) => PopTrivia.onNewGame(action));
fsg.on('skip', (action) => PopTrivia.onSkip(action));
fsg.on('join', (action) => PopTrivia.onJoin(action));
fsg.on('leave', (action) => PopTrivia.onLeave(action));
fsg.on('pick', (action) => PopTrivia.onPick(action));

fsg.submit();