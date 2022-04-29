/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./game-server/acosg.js":
/*!******************************!*\
  !*** ./game-server/acosg.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });

class ACOSG {
    constructor() {
        try {
            this.actions = JSON.parse(JSON.stringify(globals.actions()));
        }
        catch (e) { this.error('Failed to load actions'); return }
        try {
            this.originalGame = JSON.parse(JSON.stringify(globals.game()));
        }
        catch (e) { this.error('Failed to load originalGame'); return }
        try {
            this.nextGame = JSON.parse(JSON.stringify(globals.game()));
        }
        catch (e) { this.error('Failed to load nextGame'); return }


        this.currentAction = null;

        this.isNewGame = false;
        // this.markedForDelete = false;
        this.defaultSeconds = 15;
        // this.nextTimeLimit = -1;
        this.kickedPlayers = [];

        // if (!this.nextGame || !this.nextGame.rules || Object.keys(this.nextGame.rules).length == 0) {
        //     this.isNewGame = true;
        //     this.error('Missing Rules');
        // }

        if (this.nextGame) {
            if (!('timer' in this.nextGame)) {
                this.nextGame.timer = {};
            }
            if (!('state' in this.nextGame)) {
                this.nextGame.state = {};
            }

            if (!('players' in this.nextGame)) {
                this.nextGame.players = {};
            }

            //if (!('prev' in this.nextGame)) {
            this.nextGame.prev = {};
            //}

            if (!('next' in this.nextGame)) {
                this.nextGame.next = {};
            }

            if (!('rules' in this.nextGame)) {
                this.nextGame.rules = {};
            }

            this.nextGame.events = {};
        }



    }

    on(type, cb) {

        // if (type == 'newgame') {
        //     //if (this.isNewGame) {
        //     this.currentAction = this.actions[0];
        //     if (this.currentAction.type == '')
        //         cb(this.actions[0]);
        //     this.isNewGame = false;
        //     //}

        //     return;
        // }

        for (var i = 0; i < this.actions.length; i++) {
            if (this.actions[i].type == type) {
                this.currentAction = this.actions[i];
                let result = cb(this.currentAction);
                if (typeof result == "boolean" && !result) {
                    this.ignore();
                    break;
                }
            }

        }

    }

    ignore() {
        globals.ignore();
    }

    setGame(game) {
        for (var id in this.nextGame.players) {
            let player = this.nextGame.players[id];
            game.players[id] = player;
        }
        this.nextGame = game;
    }

    commit() {
        if (this.kickedPlayers.length > 0)
            this.nextGame.kick = this.kickedPlayers;

        globals.finish(this.nextGame);
    }

    gameover(payload) {
        this.event('gameover', payload);
    }

    log(msg) {
        globals.log(msg);
    }
    error(msg) {
        globals.error(msg);
    }

    kickPlayer(id) {
        this.kickedPlayers.push(id);
    }

    database() {
        return globals.database();
    }

    action() {
        return this.currentAction;
    }

    state(key, value) {

        if (typeof key === 'undefined')
            return this.nextGame.state;
        if (typeof value === 'undefined')
            return this.nextGame.state[key];

        this.nextGame.state[key] = value;
    }

    playerList() {
        return Object.keys(this.nextGame.players);
    }
    playerCount() {
        return Object.keys(this.nextGame.players).length;
    }

    players(userid, value) {
        if (typeof userid === 'undefined')
            return this.nextGame.players;
        if (typeof value === 'undefined')
            return this.nextGame.players[userid];

        this.nextGame.players[userid] = value;
    }

    rules(rule, value) {
        if (typeof rule === 'undefined')
            return this.nextGame.rules;
        if (typeof value === 'undefined')
            return this.nextGame.rules[rule];

        this.nextGame.rules[rule] = value;
    }

    prev(obj) {
        if (typeof obj === 'object') {
            this.nextGame.prev = obj;
        }
        return this.nextGame.prev;
    }

    next(obj) {
        if (typeof obj === 'object') {
            this.nextGame.next = obj;
        }
        return this.nextGame.next;
    }

    setTimelimit(seconds) {
        seconds = seconds || this.defaultSeconds;
        if (!this.nextGame.timer)
            this.nextGame.timer = {};
        this.nextGame.timer.set = seconds;// Math.min(60, Math.max(10, seconds));
    }

    reachedTimelimit(action) {
        if (typeof action.timeleft == 'undefined')
            return false;
        return action.timeleft <= 0;
    }

    event(name, payload) {
        if (!payload)
            return this.nextGame.events[name];

        this.nextGame.events[name] = payload || {};
    }

    clearEvents() {
        this.nextGame.events = {};
    }
    // events(name) {
    //     if (typeof name === 'undefined')
    //         return this.nextGame.events;
    //     this.nextGame.events.push(name);
    // }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (new ACOSG());

/***/ }),

/***/ "./game-server/game.js":
/*!*****************************!*\
  !*** ./game-server/game.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _acosg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./acosg */ "./game-server/acosg.js");



let questions = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].database();

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
        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].setGame(defaultGame);
        this.startGame();
    }

    startGame() {
        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();
        for (var id in players)
            players[id].score = 0;

        this.nextRound();
    }

    onSkip(action) {

        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
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
        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].next({
            id: '*',
        })
        this.processNextQuestion();

        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].setTimelimit(20);
    }
    endOfRound() {
        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
        state.stage += 1;
        this.processCorrectAnswers();
        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].setTimelimit(6);

        let question = questions[state._qid];
        // cup.event('a', question.a);
        state.a = question.a;
    }

    nextRound() {
        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
        let rules = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].rules();
        if (state.round >= rules.rounds) {
            this.processWinners();
            return;
        }


        state.round += 1;
        state.stage = 0;

        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].event('q', state.round);
        this.resetPlayerChoices();
        this.nextQuestion();
    }

    onJoin(action) {
        if (!action.user.id)
            return;

        let user = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players(action.user.id);
        if (!user)
            return;

        //new player defaults
        user.score = 0;

    }



    onLeave(action) {
        let id = action.user.id;
        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();
        // let playerList = cup.playerList();
        let player = players[id];
        if (player) {
            player.score -= 1000;
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

        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
        let player = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players(action.user.id);

        //get the picked cell
        let choice = action.payload.choice;

        if (choice < 0 || choice > state.choices.length) {
            _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].ignore();
            return;
        }


        player.choice = choice;

        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].event('picked');
        state.picked = player.id;

        let voted = 0;
        let playerList = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].playerList();
        for (var id of playerList) {
            let player = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players(id);
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
        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();
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
        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();

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
        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();

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

        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
        state.winners = winners;
        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].gameover(winners);
    }

    processCorrectAnswers() {
        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();
        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (new PopTrivia());


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!******************************!*\
  !*** ./game-server/index.js ***!
  \******************************/
/* harmony import */ var _acosg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./acosg */ "./game-server/acosg.js");
/* harmony import */ var _game__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./game */ "./game-server/game.js");





_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].on('gamestart', (action) => _game__WEBPACK_IMPORTED_MODULE_1__["default"].onNewGame(action));
_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].on('skip', (action) => _game__WEBPACK_IMPORTED_MODULE_1__["default"].onSkip(action));
_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].on('join', (action) => _game__WEBPACK_IMPORTED_MODULE_1__["default"].onJoin(action));
_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].on('leave', (action) => _game__WEBPACK_IMPORTED_MODULE_1__["default"].onLeave(action));
_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].on('pick', (action) => _game__WEBPACK_IMPORTED_MODULE_1__["default"].onPick(action));

_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].commit();
})();

/******/ })()
;
//# sourceMappingURL=server.bundle.js.map