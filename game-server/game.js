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
        if (fsg.reachedTimeLimit())
            this.nextRound();
    }

    checkStartGame() {
        //if player count reached required limit, start the game
        let maxPlayers = fsg.rules('maxPlayers') || 2;
        let playerCount = fsg.playerCount();
        if (playerCount >= maxPlayers) {
            let players = fsg.players();
            for (var id in players)
                players[id].points = 0;

            this.nextRound();
        }
    }

    nextRound() {
        this.processCorrectAnswers();

        let state = fsg.state();
        state.round = state.round + 1;
        fsg.next({
            id: '*',
        })
        fsg.setTimeLimit(20);

        this.resetPlayerChoices();

        let rules = fsg.rules();
        if (state.round > rules.rounds) {
            this.processWinners();
            return;
        }

        this.processNextQuestion();

        // fsg.setTimeLimit(20);
    }

    resetPlayerChoices() {
        let players = fsg.players();
        for (var id in players) {
            let player = players[id];
            player.choice = null;
        }
    }

    processNextQuestion() {
        let state = fsg.state();

        //find a random question not asked before
        let qid = Math.floor(Math.random() * questions.length);
        if (state.history.includes(qid)) {
            this.processNextQuestion();
            return;
        }

        //setup next question
        let question = questions[qid];
        state.qid = qid;
        state.question = question.q;
        state.category = question.c;
        if (question.t == 'boolean') {
            //always True then False in the choices
            state.choices = ['True', 'False']
        }
        else {
            //sort the choices alphabetically
            state.choices = [];
            state.choices.push(question.a);
            for (let i = 0; i < question.i.length; i++) {
                state.choices.push(question.i[i]);
            }
            state.choices.sort();
        }
        //save this question in history to avoid choosing again
        state.history.push(qid);
    }

    processWinners() {
        let playerList = [];
        let playerIds = [];
        let players = fsg.players();

        //add player id into the player data
        for (var id in players) {
            players[id].id = id;
            playerList.push(players[id]);
        }

        //sort all players by their points
        playerList.sort((a, b) => {
            b.points - a.points;
        })

        //get the top 10
        let winners = [];
        for (var i = 0; i < Math.min(playerList.length, 10); i++) {
            let player = playerList[i];
            winners.push(player.id);
        }

        //remove id, so we don't send over network
        for (var id in players) {
            delete players[id]['id'];
        }

        let state = fsg.state();
        state.winners = winners;
        fsg.events('winner');

        fsg.killGame();
    }

    processCorrectAnswers() {
        let players = fsg.players();
        let state = fsg.state();
        if (state.round <= 0)
            return;

        //award points for correct choices, remove points for wrong choices
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

        //new player defaults
        user.points = 0;

        this.checkStartGame();
    }



    onLeave() {
        let players = fsg.players();
        if (players[id]) {
            delete players[id];
        }
    }

    onPick() {

        if (fsg.reachedTimeLimit()) {
            this.nextRound();
            fsg.log("Pick passed timelimit, getting new round");
            return;
        }

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

}

export default new PopTrivia();