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
    events: []
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

        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].setTimelimit(15);
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
        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].playerList();
        // if (players[id]) {
        //     delete players[id];
        // }
        if (players.length <= 1) {
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
        let user = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players(action.user.id);

        //get the picked cell
        let choice = action.payload.choice;

        if (choice < 0 || choice > state.choices.length)
            return;

        user._choice = choice;

        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].event('picked');
        state.picked = user.id;

        let voted = 0;
        let playerList = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].playerList();
        for (var id of playerList) {
            let player = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players(id);
            if (player._choice) {
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
            player.choices = player.choices || [];
            if (typeof player._choice !== 'undefined' && player._choice != null)
                player.choices.push(player._choice);
            delete player._choice;
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
            a.score - b.score;
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
            if (typeof player._choice == 'undefined' || player._choice == null)
                continue;

            let answer = questions[state._qid].a;
            let userChoice = state.choices[player._choice];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0Isb0RBQVM7QUFDN0I7QUFDQSxRQUFRLHVEQUFZO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQixzREFBVztBQUNqQyxvQkFBb0Isb0RBQVM7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFlLGVBQWU7Ozs7OztVQzdROUI7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7Ozs7Ozs7O0FDQTBCO0FBQ0s7QUFDL0I7QUFDQTtBQUNBO0FBQ0EsaURBQU0sMEJBQTBCLHVEQUFtQjtBQUNuRCxpREFBTSxxQkFBcUIsb0RBQWdCO0FBQzNDLGlEQUFNLHFCQUFxQixvREFBZ0I7QUFDM0MsaURBQU0sc0JBQXNCLHFEQUFpQjtBQUM3QyxpREFBTSxxQkFBcUIsb0RBQWdCO0FBQzNDO0FBQ0EscURBQVUsRyIsInNvdXJjZXMiOlsiLi4vLi4vLi9nYW1lLXNlcnZlci9hY29zZy5qcyIsIi4uLy4uLy4vZ2FtZS1zZXJ2ZXIvZ2FtZS5qcyIsIi4uLy4uL3dlYnBhY2svYm9vdHN0cmFwIiwiLi4vLi4vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwiLi4vLi4vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIi4uLy4uLy4vZ2FtZS1zZXJ2ZXIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXHJcbmNsYXNzIEFDT1NHIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5hY3Rpb25zKCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgdGhpcy5lcnJvcignRmFpbGVkIHRvIGxvYWQgYWN0aW9ucycpOyByZXR1cm4gfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxHYW1lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmdhbWUoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkgeyB0aGlzLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBvcmlnaW5hbEdhbWUnKTsgcmV0dXJuIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmdhbWUoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkgeyB0aGlzLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBuZXh0R2FtZScpOyByZXR1cm4gfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5pc05ld0dhbWUgPSBmYWxzZTtcclxuICAgICAgICAvLyB0aGlzLm1hcmtlZEZvckRlbGV0ZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFNlY29uZHMgPSAxNTtcclxuICAgICAgICAvLyB0aGlzLm5leHRUaW1lTGltaXQgPSAtMTtcclxuICAgICAgICB0aGlzLmtpY2tlZFBsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCF0aGlzLm5leHRHYW1lIHx8ICF0aGlzLm5leHRHYW1lLnJ1bGVzIHx8IE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucnVsZXMpLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuaXNOZXdHYW1lID0gdHJ1ZTtcclxuICAgICAgICAvLyAgICAgdGhpcy5lcnJvcignTWlzc2luZyBSdWxlcycpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMubmV4dEdhbWUpIHtcclxuICAgICAgICAgICAgaWYgKCEoJ3RpbWVyJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS50aW1lciA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghKCdzdGF0ZScgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGUgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ3BsYXllcnMnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnBsYXllcnMgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9pZiAoISgncHJldicgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5wcmV2ID0ge307XHJcbiAgICAgICAgICAgIC8vfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ25leHQnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLm5leHQgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ3J1bGVzJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5ydWxlcyA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cyA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBvbih0eXBlLCBjYikge1xyXG5cclxuICAgICAgICAvLyBpZiAodHlwZSA9PSAnbmV3Z2FtZScpIHtcclxuICAgICAgICAvLyAgICAgLy9pZiAodGhpcy5pc05ld0dhbWUpIHtcclxuICAgICAgICAvLyAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gdGhpcy5hY3Rpb25zWzBdO1xyXG4gICAgICAgIC8vICAgICBpZiAodGhpcy5jdXJyZW50QWN0aW9uLnR5cGUgPT0gJycpXHJcbiAgICAgICAgLy8gICAgICAgICBjYih0aGlzLmFjdGlvbnNbMF0pO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmlzTmV3R2FtZSA9IGZhbHNlO1xyXG4gICAgICAgIC8vICAgICAvL31cclxuXHJcbiAgICAgICAgLy8gICAgIHJldHVybjtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvbnNbaV0udHlwZSA9PSB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSB0aGlzLmFjdGlvbnNbaV07XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gY2IodGhpcy5jdXJyZW50QWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09IFwiYm9vbGVhblwiICYmICFyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlnbm9yZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaWdub3JlKCkge1xyXG4gICAgICAgIGdsb2JhbHMuaWdub3JlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0R2FtZShnYW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSB0aGlzLm5leHRHYW1lLnBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBnYW1lLnBsYXllcnNbaWRdID0gcGxheWVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm5leHRHYW1lID0gZ2FtZTtcclxuICAgIH1cclxuXHJcbiAgICBjb21taXQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMua2lja2VkUGxheWVycy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLmtpY2sgPSB0aGlzLmtpY2tlZFBsYXllcnM7XHJcblxyXG4gICAgICAgIGdsb2JhbHMuZmluaXNoKHRoaXMubmV4dEdhbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdhbWVvdmVyKHBheWxvYWQpIHtcclxuICAgICAgICB0aGlzLmV2ZW50KCdnYW1lb3ZlcicsIHBheWxvYWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGxvZyhtc2cpIHtcclxuICAgICAgICBnbG9iYWxzLmxvZyhtc2cpO1xyXG4gICAgfVxyXG4gICAgZXJyb3IobXNnKSB7XHJcbiAgICAgICAgZ2xvYmFscy5lcnJvcihtc2cpO1xyXG4gICAgfVxyXG5cclxuICAgIGtpY2tQbGF5ZXIoaWQpIHtcclxuICAgICAgICB0aGlzLmtpY2tlZFBsYXllcnMucHVzaChpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGF0YWJhc2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIGdsb2JhbHMuZGF0YWJhc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEFjdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0ZShrZXksIHZhbHVlKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuc3RhdGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnN0YXRlW2tleV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGVba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHBsYXllckxpc3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucGxheWVycyk7XHJcbiAgICB9XHJcbiAgICBwbGF5ZXJDb3VudCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5wbGF5ZXJzKS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheWVycyh1c2VyaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB1c2VyaWQgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW3VzZXJpZF07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucGxheWVyc1t1c2VyaWRdID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcnVsZXMocnVsZSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHJ1bGUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ydWxlcztcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcmV2KG9iaikge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnByZXYgPSBvYmo7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnByZXY7XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dChvYmopIHtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5uZXh0ID0gb2JqO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5uZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRpbWVsaW1pdChzZWNvbmRzKSB7XHJcbiAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgfHwgdGhpcy5kZWZhdWx0U2Vjb25kcztcclxuICAgICAgICBpZiAoIXRoaXMubmV4dEdhbWUudGltZXIpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUudGltZXIgPSB7fTtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyLnNldCA9IHNlY29uZHM7Ly8gTWF0aC5taW4oNjAsIE1hdGgubWF4KDEwLCBzZWNvbmRzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVhY2hlZFRpbWVsaW1pdChhY3Rpb24pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGFjdGlvbi50aW1lbGVmdCA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiBhY3Rpb24udGltZWxlZnQgPD0gMDtcclxuICAgIH1cclxuXHJcbiAgICBldmVudChuYW1lLCBwYXlsb2FkKSB7XHJcbiAgICAgICAgaWYgKCFwYXlsb2FkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ldmVudHNbbmFtZV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzW25hbWVdID0gcGF5bG9hZCB8fCB7fTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhckV2ZW50cygpIHtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cyA9IHt9O1xyXG4gICAgfVxyXG4gICAgLy8gZXZlbnRzKG5hbWUpIHtcclxuICAgIC8vICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ldmVudHM7XHJcbiAgICAvLyAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMucHVzaChuYW1lKTtcclxuICAgIC8vIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IEFDT1NHKCk7IiwiaW1wb3J0IGN1cCBmcm9tICcuL2Fjb3NnJztcclxuXHJcbmxldCBxdWVzdGlvbnMgPSBjdXAuZGF0YWJhc2UoKTtcclxuXHJcbmxldCBkZWZhdWx0R2FtZSA9IHtcclxuICAgIHN0YXRlOiB7XHJcbiAgICAgICAgX3FpZDogMCxcclxuICAgICAgICBfaGlzdG9yeTogW10sXHJcbiAgICAgICAgY2F0ZWdvcnk6ICcnLFxyXG4gICAgICAgIHF1ZXN0aW9uOiAnJyxcclxuICAgICAgICBjaG9pY2VzOiBbXSxcclxuICAgICAgICByb3VuZDogMCxcclxuICAgICAgICBzdGFnZTogMFxyXG4gICAgfSxcclxuICAgIHBsYXllcnM6IHt9LFxyXG4gICAgcnVsZXM6IHtcclxuICAgICAgICByb3VuZHM6IDEwLFxyXG4gICAgICAgIG1heHBsYXllcnM6IDEwXHJcbiAgICB9LFxyXG4gICAgbmV4dDoge30sXHJcbiAgICBldmVudHM6IFtdXHJcbn1cclxuXHJcblxyXG5cclxuY2xhc3MgUG9wVHJpdmlhIHtcclxuXHJcbiAgICBvbk5ld0dhbWUoYWN0aW9uKSB7XHJcbiAgICAgICAgY3VwLnNldEdhbWUoZGVmYXVsdEdhbWUpO1xyXG4gICAgICAgIHRoaXMuc3RhcnRHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnRHYW1lKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gY3VwLnBsYXllcnMoKTtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKVxyXG4gICAgICAgICAgICBwbGF5ZXJzW2lkXS5zY29yZSA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25Ta2lwKGFjdGlvbikge1xyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBjdXAuc3RhdGUoKTtcclxuICAgICAgICBsZXQgc3RhZ2UgPSBzdGF0ZS5zdGFnZSB8fCAwO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKHN0YXRlLnN0YWdlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICAgIHRoaXMuZW5kT2ZSb3VuZCgpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRSb3VuZCgpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vaWYgKGN1cC5yZWFjaGVkVGltZWxpbWl0KGFjdGlvbikpXHJcblxyXG4gICAgfVxyXG5cclxuICAgIG5leHRRdWVzdGlvbigpIHtcclxuICAgICAgICBjdXAubmV4dCh7XHJcbiAgICAgICAgICAgIGlkOiAnKicsXHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLnByb2Nlc3NOZXh0UXVlc3Rpb24oKTtcclxuXHJcbiAgICAgICAgY3VwLnNldFRpbWVsaW1pdCgxNSk7XHJcbiAgICB9XHJcbiAgICBlbmRPZlJvdW5kKCkge1xyXG4gICAgICAgIGxldCBzdGF0ZSA9IGN1cC5zdGF0ZSgpO1xyXG4gICAgICAgIHN0YXRlLnN0YWdlICs9IDE7XHJcbiAgICAgICAgdGhpcy5wcm9jZXNzQ29ycmVjdEFuc3dlcnMoKTtcclxuICAgICAgICBjdXAuc2V0VGltZWxpbWl0KDYpO1xyXG5cclxuICAgICAgICBsZXQgcXVlc3Rpb24gPSBxdWVzdGlvbnNbc3RhdGUuX3FpZF07XHJcbiAgICAgICAgLy8gY3VwLmV2ZW50KCdhJywgcXVlc3Rpb24uYSk7XHJcbiAgICAgICAgc3RhdGUuYSA9IHF1ZXN0aW9uLmE7XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dFJvdW5kKCkge1xyXG4gICAgICAgIGxldCBzdGF0ZSA9IGN1cC5zdGF0ZSgpO1xyXG4gICAgICAgIGxldCBydWxlcyA9IGN1cC5ydWxlcygpO1xyXG4gICAgICAgIGlmIChzdGF0ZS5yb3VuZCA+PSBydWxlcy5yb3VuZHMpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzV2lubmVycygpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgc3RhdGUucm91bmQgKz0gMTtcclxuICAgICAgICBzdGF0ZS5zdGFnZSA9IDA7XHJcblxyXG4gICAgICAgIGN1cC5ldmVudCgncScsIHN0YXRlLnJvdW5kKTtcclxuICAgICAgICB0aGlzLnJlc2V0UGxheWVyQ2hvaWNlcygpO1xyXG4gICAgICAgIHRoaXMubmV4dFF1ZXN0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25Kb2luKGFjdGlvbikge1xyXG4gICAgICAgIGlmICghYWN0aW9uLnVzZXIuaWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHVzZXIgPSBjdXAucGxheWVycyhhY3Rpb24udXNlci5pZCk7XHJcbiAgICAgICAgaWYgKCF1c2VyKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vbmV3IHBsYXllciBkZWZhdWx0c1xyXG4gICAgICAgIHVzZXIuc2NvcmUgPSAwO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIG9uTGVhdmUoYWN0aW9uKSB7XHJcbiAgICAgICAgbGV0IGlkID0gYWN0aW9uLnVzZXIuaWQ7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBjdXAucGxheWVyTGlzdCgpO1xyXG4gICAgICAgIC8vIGlmIChwbGF5ZXJzW2lkXSkge1xyXG4gICAgICAgIC8vICAgICBkZWxldGUgcGxheWVyc1tpZF07XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIGlmIChwbGF5ZXJzLmxlbmd0aCA8PSAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1dpbm5lcnMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25QaWNrKGFjdGlvbikge1xyXG5cclxuICAgICAgICAvLyBpZiAoY3VwLnJlYWNoZWRUaW1lbGltaXQoYWN0aW9uKSkge1xyXG4gICAgICAgIC8vICAgICB0aGlzLm5leHRSb3VuZCgpO1xyXG4gICAgICAgIC8vICAgICBjdXAubG9nKFwiUGljayBwYXNzZWQgdGltZWxpbWl0LCBnZXR0aW5nIG5ldyByb3VuZFwiKTtcclxuICAgICAgICAvLyAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgbGV0IHN0YXRlID0gY3VwLnN0YXRlKCk7XHJcbiAgICAgICAgbGV0IHVzZXIgPSBjdXAucGxheWVycyhhY3Rpb24udXNlci5pZCk7XHJcblxyXG4gICAgICAgIC8vZ2V0IHRoZSBwaWNrZWQgY2VsbFxyXG4gICAgICAgIGxldCBjaG9pY2UgPSBhY3Rpb24ucGF5bG9hZC5jaG9pY2U7XHJcblxyXG4gICAgICAgIGlmIChjaG9pY2UgPCAwIHx8IGNob2ljZSA+IHN0YXRlLmNob2ljZXMubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHVzZXIuX2Nob2ljZSA9IGNob2ljZTtcclxuXHJcbiAgICAgICAgY3VwLmV2ZW50KCdwaWNrZWQnKTtcclxuICAgICAgICBzdGF0ZS5waWNrZWQgPSB1c2VyLmlkO1xyXG5cclxuICAgICAgICBsZXQgdm90ZWQgPSAwO1xyXG4gICAgICAgIGxldCBwbGF5ZXJMaXN0ID0gY3VwLnBsYXllckxpc3QoKTtcclxuICAgICAgICBmb3IgKHZhciBpZCBvZiBwbGF5ZXJMaXN0KSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBjdXAucGxheWVycyhpZCk7XHJcbiAgICAgICAgICAgIGlmIChwbGF5ZXIuX2Nob2ljZSkge1xyXG4gICAgICAgICAgICAgICAgdm90ZWQrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9lbmQgcm91bmRcclxuICAgICAgICBpZiAodm90ZWQgPj0gcGxheWVyTGlzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhpcy5vblNraXAoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG5cclxuICAgIHJlc2V0UGxheWVyQ2hvaWNlcygpIHtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGN1cC5wbGF5ZXJzKCk7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyc1tpZF07XHJcbiAgICAgICAgICAgIHBsYXllci5jaG9pY2VzID0gcGxheWVyLmNob2ljZXMgfHwgW107XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGxheWVyLl9jaG9pY2UgIT09ICd1bmRlZmluZWQnICYmIHBsYXllci5fY2hvaWNlICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIuY2hvaWNlcy5wdXNoKHBsYXllci5fY2hvaWNlKTtcclxuICAgICAgICAgICAgZGVsZXRlIHBsYXllci5fY2hvaWNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzTmV4dFF1ZXN0aW9uKCkge1xyXG4gICAgICAgIGxldCBzdGF0ZSA9IGN1cC5zdGF0ZSgpO1xyXG5cclxuICAgICAgICAvL2ZpbmQgYSByYW5kb20gcXVlc3Rpb24gbm90IGFza2VkIGJlZm9yZVxyXG4gICAgICAgIGxldCBfcWlkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcXVlc3Rpb25zLmxlbmd0aCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLl9oaXN0b3J5LmluY2x1ZGVzKF9xaWQpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc05leHRRdWVzdGlvbigpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldHVwIG5leHQgcXVlc3Rpb25cclxuICAgICAgICBsZXQgcXVlc3Rpb24gPSBxdWVzdGlvbnNbX3FpZF07XHJcbiAgICAgICAgc3RhdGUuX3FpZCA9IF9xaWQ7XHJcbiAgICAgICAgc3RhdGUucXVlc3Rpb24gPSBxdWVzdGlvbi5xO1xyXG4gICAgICAgIHN0YXRlLmNhdGVnb3J5ID0gcXVlc3Rpb24uYztcclxuICAgICAgICBpZiAocXVlc3Rpb24udCA9PSAnYm9vbGVhbicpIHtcclxuICAgICAgICAgICAgLy9hbHdheXMgVHJ1ZSB0aGVuIEZhbHNlIGluIHRoZSBjaG9pY2VzXHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMgPSBbJ1RydWUnLCAnRmFsc2UnXVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy9zb3J0IHRoZSBjaG9pY2VzIGFscGhhYmV0aWNhbGx5XHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMgPSBbXTtcclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcy5wdXNoKHF1ZXN0aW9uLmEpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXN0aW9uLmkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHN0YXRlLmNob2ljZXMucHVzaChxdWVzdGlvbi5pW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzLnNvcnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9zYXZlIHRoaXMgcXVlc3Rpb24gaW4gX2hpc3RvcnkgdG8gYXZvaWQgY2hvb3NpbmcgYWdhaW5cclxuICAgICAgICBzdGF0ZS5faGlzdG9yeS5wdXNoKF9xaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NXaW5uZXJzKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJMaXN0ID0gW107XHJcbiAgICAgICAgbGV0IHBsYXllcklkcyA9IFtdO1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gY3VwLnBsYXllcnMoKTtcclxuXHJcbiAgICAgICAgLy9hZGQgcGxheWVyIGlkIGludG8gdGhlIHBsYXllciBkYXRhXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBwbGF5ZXJzW2lkXS5pZCA9IGlkO1xyXG4gICAgICAgICAgICBwbGF5ZXJMaXN0LnB1c2gocGxheWVyc1tpZF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zb3J0IGFsbCBwbGF5ZXJzIGJ5IHRoZWlyIHNjb3JlXHJcbiAgICAgICAgcGxheWVyTGlzdC5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgIGEuc2NvcmUgLSBiLnNjb3JlO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIC8vZ2V0IHRoZSB0b3AgMTAgYW5kIHJhbmsgdGhlbVxyXG4gICAgICAgIGxldCBsYXN0c2NvcmUgPSBudWxsO1xyXG4gICAgICAgIGxldCB3aW5wb3MgPSAwO1xyXG4gICAgICAgIGxldCB3aW5uZXJzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBNYXRoLm1pbihwbGF5ZXJMaXN0Lmxlbmd0aCwgMTApOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IHBsYXllckxpc3RbaV07XHJcbiAgICAgICAgICAgIGlmIChsYXN0c2NvcmUgIT0gbnVsbCAmJiBsYXN0c2NvcmUgIT0gcGxheWVyLnNjb3JlKVxyXG4gICAgICAgICAgICAgICAgd2lucG9zKys7XHJcbiAgICAgICAgICAgIHBsYXllci5yYW5rID0gd2lucG9zO1xyXG4gICAgICAgICAgICBsYXN0c2NvcmUgPSBwbGF5ZXIuc2NvcmU7XHJcbiAgICAgICAgICAgIHdpbm5lcnMucHVzaChwbGF5ZXIuaWQpO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8vcmVtb3ZlIGlkLCBzbyB3ZSBkb24ndCBzZW5kIG92ZXIgbmV0d29ya1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgZGVsZXRlIHBsYXllcnNbaWRdWydpZCddO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN0YXRlID0gY3VwLnN0YXRlKCk7XHJcbiAgICAgICAgc3RhdGUud2lubmVycyA9IHdpbm5lcnM7XHJcbiAgICAgICAgY3VwLmdhbWVvdmVyKHdpbm5lcnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NDb3JyZWN0QW5zd2VycygpIHtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGN1cC5wbGF5ZXJzKCk7XHJcbiAgICAgICAgbGV0IHN0YXRlID0gY3VwLnN0YXRlKCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLnJvdW5kIDw9IDApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy9hd2FyZCBzY29yZSBmb3IgY29ycmVjdCBjaG9pY2VzLCByZW1vdmUgc2NvcmUgZm9yIHdyb25nIGNob2ljZXNcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbGF5ZXIuX2Nob2ljZSA9PSAndW5kZWZpbmVkJyB8fCBwbGF5ZXIuX2Nob2ljZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBsZXQgYW5zd2VyID0gcXVlc3Rpb25zW3N0YXRlLl9xaWRdLmE7XHJcbiAgICAgICAgICAgIGxldCB1c2VyQ2hvaWNlID0gc3RhdGUuY2hvaWNlc1twbGF5ZXIuX2Nob2ljZV07XHJcbiAgICAgICAgICAgIGlmIChhbnN3ZXIgPT0gdXNlckNob2ljZSkge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnNjb3JlICs9IDEwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnNjb3JlIC09IDI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IFBvcFRyaXZpYSgpOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiaW1wb3J0IGN1cCBmcm9tICcuL2Fjb3NnJztcclxuaW1wb3J0IFBvcFRyaXZpYSBmcm9tICcuL2dhbWUnO1xyXG5cclxuXHJcblxyXG5jdXAub24oJ2dhbWVzdGFydCcsIChhY3Rpb24pID0+IFBvcFRyaXZpYS5vbk5ld0dhbWUoYWN0aW9uKSk7XHJcbmN1cC5vbignc2tpcCcsIChhY3Rpb24pID0+IFBvcFRyaXZpYS5vblNraXAoYWN0aW9uKSk7XHJcbmN1cC5vbignam9pbicsIChhY3Rpb24pID0+IFBvcFRyaXZpYS5vbkpvaW4oYWN0aW9uKSk7XHJcbmN1cC5vbignbGVhdmUnLCAoYWN0aW9uKSA9PiBQb3BUcml2aWEub25MZWF2ZShhY3Rpb24pKTtcclxuY3VwLm9uKCdwaWNrJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uUGljayhhY3Rpb24pKTtcclxuXHJcbmN1cC5jb21taXQoKTsiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=