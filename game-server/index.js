import fsg from './fsg';
import PopTrivia from './game';



fsg.on('newgame', () => PopTrivia.onNewGame());
fsg.on('skip', () => PopTrivia.onSkip());
fsg.on('join', () => PopTrivia.onJoin());
fsg.on('leave', () => PopTrivia.onLeave());
fsg.on('pick', () => PopTrivia.onPick());

fsg.submit();