import fsg from './fsg';

import questions from './questions';

let defaultGame = {
    state: {
        qid: 0,
        history: [],
        category: '',
        question: '',
        choices: [],
        round: 0
    },
    players: {},
    rules: {
        rounds: 10,
        maxplayers: 2
    },
    next: {},
    events: []
}

class PopTrivia {

    onNewGame() {
        fsg.setGame(defaultGame);
        this.checkStartGame();
    }

    onSkip() {
        let action = fsg.action();
        let next = fsg.next();
        let players = fsg.players();
        let state = fsg.state();

        state.round = state.round + 1;
        fsg.next({
            id: '*',
            timelimit: 60
        })

        this.processCorrectAnswers();
        this.nextRound();
    }

    nextRound() {
        let state = fsg.state();
        state.round = state.round + 1;


        fsg.next({
            id: '*',
            timelimit: 60
        })

        if (state.round > 10) {
            this.processWinners();
            return;
        }

        this.processNextQuestion();
    }

    processNextQuestion() {
        let state = fsg.state();

        let qid = Math.floor(Math.random() * questions.length);
        if (state.history.includes(qid)) {
            this.processNextQuestion();
            return;
        }
        let question = questions[qid];
        state.qid = qid;
        state.question = question.q;
        state.category = question.c;
        if (question.t == 'boolean') {
            state.choices = ['True', 'False']
        }
        else {
            state.choices = [];
            state.choices.push(question.a);
            for (let i = 0; i < question.i.length; i++) {
                state.choices.push(question.i[i]);
            }
            state.choices.sort();
        }
    }

    processWinners() {
        let playerList = [];
        let playerIds = [];
        let players = fsg.players();

        for (var id in players) {
            players[id].id = id;
            playerList.push(players[id]);
        }

        playerList.sort((a, b) => {
            b.points - a.points;
        })

        let winners = [];
        for (var i = 0; i < Math.min(playerList.length, 10); i++) {
            let id = playerIds[i];
            winners.push(id);
        }

        //don't let this get sent over network
        for (var id in players) {
            delete players[id]['id'];
        }

        state.winners = winners;
        fsg.events('winner');

        fsg.killGame();
    }

    processCorrectAnswers() {
        let players = fsg.players();
        let state = fsg.state();

        for (var id in players) {
            let player = players[id];
            if (typeof player.choice == 'undefined' || player.choice == null)
                continue;

            let answer = questions[state.qid].a;
            let userChoice = state.choices[player.choice];
            if (answer == userChoice) {
                player.points += 10;
            }
            else {
                player.points -= 2;
            }
        }
    }

    onJoin() {
        let action = fsg.action();
        if (!action.user.id)
            return;

        let user = fsg.players(action.user.id);
        if (!user)
            return;
        user.points = 0;
        // if (fsg.players(action.user.id).type)
        //     return;

        this.checkStartGame();
    }

    checkStartGame() {
        //if player count reached required limit, start the game
        let maxPlayers = fsg.rules('maxPlayers') || 2;
        let playerCount = fsg.playerCount();
        if (playerCount >= maxPlayers) {
            this.startGame();
        }
    }

    startGame() {
        //set points to 0
        let players = fsg.players();
        for (var id in players)
            players[id].points = 0;

        this.nextRound();
        // players[state.startPlayer].type = 'X';
    }

    onLeave() {
        let action = fsg.action();
        this.playerLeave(action.user.id);
    }

    playerLeave(id) {
        let players = fsg.players();
        // let otherPlayerId = null;
        if (players[id]) {
            delete players[id];
        }
    }

    onPick() {
        let state = fsg.state();
        let action = fsg.action();
        let user = fsg.players(action.user.id);

        //get the picked cell
        let choice = action.payload.choice;

        if (choice < 0 || choice > state.choices.length)
            return;

        user.choice = choice;

        fsg.event('picked');
        state.picked = user.id;
    }


    findWinners() {
        let playerList = [];
        let players = fsg.players();
        for (var id in players) {
            let player = players[id];
            playerList.push(player);
        }

        playerList.sort((a, b) => {
            return b.points - a.points;
        })

        return playerList;
    }

    // set the winner event and data
    setWinner() {
        //find user who matches the win type
        let players = this.findWinners();
        if (!players) {
            log.error('Winning Players not found???');
            return;
        }
        fsg.clearEvents();
        fsg.event('winner')
        let state = fsg.state();
        state.winner = player.id;

        fsg.killGame();
    }
}

export default new PopTrivia();