import cup from './acosg';

let questions = cup.database();

let defaultGame = {
    state: {
        qid: 0,
        history: [],
        category: '',
        question: '',
        choices: [],
        round: 0,
        stage: 0
    },
    players: {},
    rules: {
        rounds: 2,
        maxplayers: 2
    },
    next: {},
    events: []
}



class PopTrivia {

    onNewGame(action) {
        cup.setGame(defaultGame);
        this.startGame();
    }

    startGame() {
        let players = cup.players();
        for (var id in players)
            players[id].points = 0;

        this.nextRound();
    }

    onSkip(action) {

        let state = cup.state();
        let stage = state.stage || 0;

        switch (state.stage) {
            case 0:
                stage += 1;
                cup.next({
                    id: '*',
                })
                this.processNextQuestion();
                cup.setTimelimit(60);
                break;
            case 1:
                stage += 1;
                cup.setTimelimit(15);
                break;
            default:
                this.nextRound();
                break;
        }
        //if (cup.reachedTimelimit(action))

    }

    onJoin(action) {
        if (!action.user.id)
            return;

        let user = cup.players(action.user.id);
        if (!user)
            return;

        //new player defaults
        user.points = 0;

    }



    onLeave(action) {
        let id = action.user.id;
        let players = cup.players();
        if (players[id]) {
            delete players[id];
        }
    }

    onPick(action) {

        // if (cup.reachedTimelimit(action)) {
        //     this.nextRound();
        //     cup.log("Pick passed timelimit, getting new round");
        //     return;
        // }

        let state = cup.state();
        let user = cup.players(action.user.id);

        //get the picked cell
        let choice = action.payload.choice;

        if (choice < 0 || choice > state.choices.length)
            return;

        user._choice = choice;

        cup.event('picked');
        state.picked = user.id;

        let voted = 0;
        let playerList = cup.playerList();
        for (var id of playerList) {
            let player = cup.players(id);
            if (player._choice) {
                voted++;
            }
        }

        //end round
        if (voted >= playerList.length) {
            this.onSkip();
        }
    }



    nextRound() {
        this.processCorrectAnswers();

        let state = cup.state();
        state.round = state.round + 1;
        state.stage = 0;

        let rules = cup.rules();
        if (state.round > rules.rounds) {
            this.processWinners();
            return;
        }

        cup.event('q', state.round);
        cup.setTimelimit(5);

        this.resetPlayerChoices();

    }

    resetPlayerChoices() {
        let players = cup.players();
        for (var id in players) {
            let player = players[id];
            player.choices = player.choices || [];
            if (typeof player._choice !== 'undefined' && player._choice != null)
                player.choices.push(player._choice);
            delete player._choice;
        }
    }

    processNextQuestion() {
        let state = cup.state();

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
        let players = cup.players();

        //add player id into the player data
        for (var id in players) {
            players[id].id = id;
            playerList.push(players[id]);
        }

        //sort all players by their points
        playerList.sort((a, b) => {
            a.points - b.points;
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

        let state = cup.state();
        state.winners = winners;
        cup.gameover(winners);

        cup.killGame();
    }

    processCorrectAnswers() {
        let players = cup.players();
        let state = cup.state();
        if (state.round <= 0)
            return;

        //award points for correct choices, remove points for wrong choices
        for (var id in players) {
            let player = players[id];
            if (typeof player._choice == 'undefined' || player._choice == null)
                continue;

            let answer = questions[state.qid].a;
            let userChoice = state.choices[player._choice];
            if (answer == userChoice) {
                player.points += 10;
            }
            else {
                player.points -= 2;
            }
        }
    }


}

export default new PopTrivia();