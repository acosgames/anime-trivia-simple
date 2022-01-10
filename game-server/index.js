import cup from './acosg';
import PopTrivia from './game';



cup.on('gamestart', (action) => PopTrivia.onNewGame(action));
cup.on('skip', (action) => PopTrivia.onSkip(action));
cup.on('join', (action) => PopTrivia.onJoin(action));
cup.on('leave', (action) => PopTrivia.onLeave(action));
cup.on('pick', (action) => PopTrivia.onPick(action));

cup.commit();