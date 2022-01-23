
import cup from './acosg';

let questions = cup.database();

let defaultGame = {
    state: {
        _qid: 0,
        _history: [],
        category: '',
        question: '',
        choices: [],
        round: 0,
        stage: 0
    },
    players: {},
    rules: {
        rounds: 10,
        maxplayers: 10
    },
    next: {},
    events: {}
}



class PopTrivia {

    onNewGame(action) {
        cup.setGame(defaultGame);
        this.startGame();
    }

    startGame() {
        let players = cup.players();
        for (var id in players)
            players[id].score = 0;

        this.nextRound();
    }

    onSkip(action) {

        let state = cup.state();
        let stage = state.stage || 0;

        switch (state.stage) {
            case 0:
                this.endOfRound();
                break;
            default:
                this.nextRound();
                break;
        }
        //if (cup.reachedTimelimit(action))

    }

    nextQuestion() {
        cup.next({
            id: '*',
        })
        this.processNextQuestion();

        cup.setTimelimit(20);
    }
    endOfRound() {
        let state = cup.state();
        state.stage += 1;
        this.processCorrectAnswers();
        cup.setTimelimit(6);

        let question = questions[state._qid];
        // cup.event('a', question.a);
        state.a = question.a;
    }

    nextRound() {
        let state = cup.state();
        let rules = cup.rules();
        if (state.round >= rules.rounds) {
            this.processWinners();
            return;
        }


        state.round += 1;
        state.stage = 0;

        cup.event('q', state.round);
        this.resetPlayerChoices();
        this.nextQuestion();
    }

    onJoin(action) {
        if (!action.user.id)
            return;

        let user = cup.players(action.user.id);
        if (!user)
            return;

        //new player defaults
        user.score = 0;

    }



    onLeave(action) {
        let id = action.user.id;
        let players = cup.players();
        // let playerList = cup.playerList();
        let player = players[id];
        if (player) {
            player.forfeit = true;
        }

        let activeCount = 0;
        for (var pid in players) {
            if (!players[pid].forfeit)
                activeCount++;
        }
        // if (players[id]) {
        //     delete players[id];
        // }
        if (activeCount <= 1) {
            this.processWinners();
        }
    }

    onPick(action) {

        // if (cup.reachedTimelimit(action)) {
        //     this.nextRound();
        //     cup.log("Pick passed timelimit, getting new round");
        //     return;
        // }

        let state = cup.state();
        let player = cup.players(action.user.id);

        //get the picked cell
        let choice = action.payload.choice;

        if (choice < 0 || choice > state.choices.length) {
            cup.ignore();
            return;
        }


        player.choice = choice;

        cup.event('picked');
        state.picked = player.id;

        let voted = 0;
        let playerList = cup.playerList();
        for (var id of playerList) {
            let player = cup.players(id);
            if (player.choice != -1 && typeof player.choice !== 'undefined' && player.choice != null) {
                voted++;
            }
        }

        //end round
        if (voted >= playerList.length) {
            this.onSkip();
        }
    }





    resetPlayerChoices() {
        let players = cup.players();
        for (var id in players) {
            let player = players[id];
            // player.choices = player.choices || [];
            // if (typeof player._choice !== 'undefined' && player._choice != null)
            //     player.choices.push(player._choice);
            // else
            //     player.choices.push(-1);
            player.choice = -1;
        }
    }

    processNextQuestion() {
        let state = cup.state();

        //find a random question not asked before
        let _qid = Math.floor(Math.random() * questions.length);
        if (state._history.includes(_qid)) {
            this.processNextQuestion();
            return;
        }

        //setup next question
        let question = questions[_qid];
        state._qid = _qid;
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
        //save this question in _history to avoid choosing again
        state._history.push(_qid);
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

        //sort all players by their score
        playerList.sort((a, b) => {
            return b.score - a.score;
        })

        //get the top 10 and rank them
        let lastscore = null;
        let winpos = 0;
        let winners = [];
        for (var i = 0; i < Math.min(playerList.length, 10); i++) {
            let player = playerList[i];
            if (lastscore != null && lastscore != player.score)
                winpos++;
            player.rank = winpos;
            lastscore = player.score;
            winners.push(player.id);
        }


        //remove id, so we don't send over network
        for (var id in players) {
            delete players[id]['id'];
        }

        let state = cup.state();
        state.winners = winners;
        cup.gameover(winners);
    }

    processCorrectAnswers() {
        let players = cup.players();
        let state = cup.state();
        if (state.round <= 0)
            return;

        //award score for correct choices, remove score for wrong choices
        for (var id in players) {
            let player = players[id];
            if (typeof player.choice == 'undefined' || player.choice == null || player.choice == -1)
                continue;

            let answer = questions[state._qid].a;
            let userChoice = state.choices[player.choice];
            if (answer == userChoice) {
                player.score += 10;
            }
            else {
                player.score -= 2;
            }
        }
    }


}

export default new PopTrivia();
