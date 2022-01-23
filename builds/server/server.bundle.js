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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IscUNBQXFDO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0Isb0RBQVM7QUFDN0I7QUFDQSxRQUFRLHVEQUFZO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQixzREFBVztBQUNqQyxvQkFBb0Isb0RBQVM7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFlLGVBQWUsRUFBQzs7Ozs7OztVQzlSL0I7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7Ozs7Ozs7O0FDQTBCO0FBQ0s7QUFDL0I7QUFDQTtBQUNBO0FBQ0EsaURBQU0sMEJBQTBCLHVEQUFtQjtBQUNuRCxpREFBTSxxQkFBcUIsb0RBQWdCO0FBQzNDLGlEQUFNLHFCQUFxQixvREFBZ0I7QUFDM0MsaURBQU0sc0JBQXNCLHFEQUFpQjtBQUM3QyxpREFBTSxxQkFBcUIsb0RBQWdCO0FBQzNDO0FBQ0EscURBQVUsRyIsInNvdXJjZXMiOlsiLi4vLi4vLi9nYW1lLXNlcnZlci9hY29zZy5qcyIsIi4uLy4uLy4vZ2FtZS1zZXJ2ZXIvZ2FtZS5qcyIsIi4uLy4uL3dlYnBhY2svYm9vdHN0cmFwIiwiLi4vLi4vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwiLi4vLi4vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIi4uLy4uLy4vZ2FtZS1zZXJ2ZXIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXHJcbmNsYXNzIEFDT1NHIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5hY3Rpb25zKCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgdGhpcy5lcnJvcignRmFpbGVkIHRvIGxvYWQgYWN0aW9ucycpOyByZXR1cm4gfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxHYW1lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmdhbWUoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkgeyB0aGlzLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBvcmlnaW5hbEdhbWUnKTsgcmV0dXJuIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmdhbWUoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkgeyB0aGlzLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBuZXh0R2FtZScpOyByZXR1cm4gfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5pc05ld0dhbWUgPSBmYWxzZTtcclxuICAgICAgICAvLyB0aGlzLm1hcmtlZEZvckRlbGV0ZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFNlY29uZHMgPSAxNTtcclxuICAgICAgICAvLyB0aGlzLm5leHRUaW1lTGltaXQgPSAtMTtcclxuICAgICAgICB0aGlzLmtpY2tlZFBsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCF0aGlzLm5leHRHYW1lIHx8ICF0aGlzLm5leHRHYW1lLnJ1bGVzIHx8IE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucnVsZXMpLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuaXNOZXdHYW1lID0gdHJ1ZTtcclxuICAgICAgICAvLyAgICAgdGhpcy5lcnJvcignTWlzc2luZyBSdWxlcycpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMubmV4dEdhbWUpIHtcclxuICAgICAgICAgICAgaWYgKCEoJ3RpbWVyJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS50aW1lciA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghKCdzdGF0ZScgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGUgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ3BsYXllcnMnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnBsYXllcnMgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9pZiAoISgncHJldicgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5wcmV2ID0ge307XHJcbiAgICAgICAgICAgIC8vfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ25leHQnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLm5leHQgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ3J1bGVzJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5ydWxlcyA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cyA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBvbih0eXBlLCBjYikge1xyXG5cclxuICAgICAgICAvLyBpZiAodHlwZSA9PSAnbmV3Z2FtZScpIHtcclxuICAgICAgICAvLyAgICAgLy9pZiAodGhpcy5pc05ld0dhbWUpIHtcclxuICAgICAgICAvLyAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gdGhpcy5hY3Rpb25zWzBdO1xyXG4gICAgICAgIC8vICAgICBpZiAodGhpcy5jdXJyZW50QWN0aW9uLnR5cGUgPT0gJycpXHJcbiAgICAgICAgLy8gICAgICAgICBjYih0aGlzLmFjdGlvbnNbMF0pO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmlzTmV3R2FtZSA9IGZhbHNlO1xyXG4gICAgICAgIC8vICAgICAvL31cclxuXHJcbiAgICAgICAgLy8gICAgIHJldHVybjtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvbnNbaV0udHlwZSA9PSB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSB0aGlzLmFjdGlvbnNbaV07XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gY2IodGhpcy5jdXJyZW50QWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09IFwiYm9vbGVhblwiICYmICFyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlnbm9yZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaWdub3JlKCkge1xyXG4gICAgICAgIGdsb2JhbHMuaWdub3JlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0R2FtZShnYW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSB0aGlzLm5leHRHYW1lLnBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBnYW1lLnBsYXllcnNbaWRdID0gcGxheWVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm5leHRHYW1lID0gZ2FtZTtcclxuICAgIH1cclxuXHJcbiAgICBjb21taXQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMua2lja2VkUGxheWVycy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLmtpY2sgPSB0aGlzLmtpY2tlZFBsYXllcnM7XHJcblxyXG4gICAgICAgIGdsb2JhbHMuZmluaXNoKHRoaXMubmV4dEdhbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdhbWVvdmVyKHBheWxvYWQpIHtcclxuICAgICAgICB0aGlzLmV2ZW50KCdnYW1lb3ZlcicsIHBheWxvYWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGxvZyhtc2cpIHtcclxuICAgICAgICBnbG9iYWxzLmxvZyhtc2cpO1xyXG4gICAgfVxyXG4gICAgZXJyb3IobXNnKSB7XHJcbiAgICAgICAgZ2xvYmFscy5lcnJvcihtc2cpO1xyXG4gICAgfVxyXG5cclxuICAgIGtpY2tQbGF5ZXIoaWQpIHtcclxuICAgICAgICB0aGlzLmtpY2tlZFBsYXllcnMucHVzaChpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGF0YWJhc2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIGdsb2JhbHMuZGF0YWJhc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEFjdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0ZShrZXksIHZhbHVlKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuc3RhdGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnN0YXRlW2tleV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGVba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHBsYXllckxpc3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucGxheWVycyk7XHJcbiAgICB9XHJcbiAgICBwbGF5ZXJDb3VudCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5wbGF5ZXJzKS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheWVycyh1c2VyaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB1c2VyaWQgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW3VzZXJpZF07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucGxheWVyc1t1c2VyaWRdID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcnVsZXMocnVsZSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHJ1bGUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ydWxlcztcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcmV2KG9iaikge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnByZXYgPSBvYmo7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnByZXY7XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dChvYmopIHtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5uZXh0ID0gb2JqO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5uZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRpbWVsaW1pdChzZWNvbmRzKSB7XHJcbiAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgfHwgdGhpcy5kZWZhdWx0U2Vjb25kcztcclxuICAgICAgICBpZiAoIXRoaXMubmV4dEdhbWUudGltZXIpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUudGltZXIgPSB7fTtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyLnNldCA9IHNlY29uZHM7Ly8gTWF0aC5taW4oNjAsIE1hdGgubWF4KDEwLCBzZWNvbmRzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVhY2hlZFRpbWVsaW1pdChhY3Rpb24pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGFjdGlvbi50aW1lbGVmdCA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiBhY3Rpb24udGltZWxlZnQgPD0gMDtcclxuICAgIH1cclxuXHJcbiAgICBldmVudChuYW1lLCBwYXlsb2FkKSB7XHJcbiAgICAgICAgaWYgKCFwYXlsb2FkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ldmVudHNbbmFtZV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzW25hbWVdID0gcGF5bG9hZCB8fCB7fTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhckV2ZW50cygpIHtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cyA9IHt9O1xyXG4gICAgfVxyXG4gICAgLy8gZXZlbnRzKG5hbWUpIHtcclxuICAgIC8vICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ldmVudHM7XHJcbiAgICAvLyAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMucHVzaChuYW1lKTtcclxuICAgIC8vIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IEFDT1NHKCk7IiwiXHJcbmltcG9ydCBjdXAgZnJvbSAnLi9hY29zZyc7XHJcblxyXG5sZXQgcXVlc3Rpb25zID0gY3VwLmRhdGFiYXNlKCk7XHJcblxyXG5sZXQgZGVmYXVsdEdhbWUgPSB7XHJcbiAgICBzdGF0ZToge1xyXG4gICAgICAgIF9xaWQ6IDAsXHJcbiAgICAgICAgX2hpc3Rvcnk6IFtdLFxyXG4gICAgICAgIGNhdGVnb3J5OiAnJyxcclxuICAgICAgICBxdWVzdGlvbjogJycsXHJcbiAgICAgICAgY2hvaWNlczogW10sXHJcbiAgICAgICAgcm91bmQ6IDAsXHJcbiAgICAgICAgc3RhZ2U6IDBcclxuICAgIH0sXHJcbiAgICBwbGF5ZXJzOiB7fSxcclxuICAgIHJ1bGVzOiB7XHJcbiAgICAgICAgcm91bmRzOiAxMCxcclxuICAgICAgICBtYXhwbGF5ZXJzOiAxMFxyXG4gICAgfSxcclxuICAgIG5leHQ6IHt9LFxyXG4gICAgZXZlbnRzOiB7fVxyXG59XHJcblxyXG5cclxuXHJcbmNsYXNzIFBvcFRyaXZpYSB7XHJcblxyXG4gICAgb25OZXdHYW1lKGFjdGlvbikge1xyXG4gICAgICAgIGN1cC5zZXRHYW1lKGRlZmF1bHRHYW1lKTtcclxuICAgICAgICB0aGlzLnN0YXJ0R2FtZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXJ0R2FtZSgpIHtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGN1cC5wbGF5ZXJzKCk7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycylcclxuICAgICAgICAgICAgcGxheWVyc1tpZF0uc2NvcmUgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRSb3VuZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2tpcChhY3Rpb24pIHtcclxuXHJcbiAgICAgICAgbGV0IHN0YXRlID0gY3VwLnN0YXRlKCk7XHJcbiAgICAgICAgbGV0IHN0YWdlID0gc3RhdGUuc3RhZ2UgfHwgMDtcclxuXHJcbiAgICAgICAgc3dpdGNoIChzdGF0ZS5zdGFnZSkge1xyXG4gICAgICAgICAgICBjYXNlIDA6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVuZE9mUm91bmQoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0Um91bmQoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2lmIChjdXAucmVhY2hlZFRpbWVsaW1pdChhY3Rpb24pKVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBuZXh0UXVlc3Rpb24oKSB7XHJcbiAgICAgICAgY3VwLm5leHQoe1xyXG4gICAgICAgICAgICBpZDogJyonLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5wcm9jZXNzTmV4dFF1ZXN0aW9uKCk7XHJcblxyXG4gICAgICAgIGN1cC5zZXRUaW1lbGltaXQoMjApO1xyXG4gICAgfVxyXG4gICAgZW5kT2ZSb3VuZCgpIHtcclxuICAgICAgICBsZXQgc3RhdGUgPSBjdXAuc3RhdGUoKTtcclxuICAgICAgICBzdGF0ZS5zdGFnZSArPSAxO1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc0NvcnJlY3RBbnN3ZXJzKCk7XHJcbiAgICAgICAgY3VwLnNldFRpbWVsaW1pdCg2KTtcclxuXHJcbiAgICAgICAgbGV0IHF1ZXN0aW9uID0gcXVlc3Rpb25zW3N0YXRlLl9xaWRdO1xyXG4gICAgICAgIC8vIGN1cC5ldmVudCgnYScsIHF1ZXN0aW9uLmEpO1xyXG4gICAgICAgIHN0YXRlLmEgPSBxdWVzdGlvbi5hO1xyXG4gICAgfVxyXG5cclxuICAgIG5leHRSb3VuZCgpIHtcclxuICAgICAgICBsZXQgc3RhdGUgPSBjdXAuc3RhdGUoKTtcclxuICAgICAgICBsZXQgcnVsZXMgPSBjdXAucnVsZXMoKTtcclxuICAgICAgICBpZiAoc3RhdGUucm91bmQgPj0gcnVsZXMucm91bmRzKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1dpbm5lcnMoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIHN0YXRlLnJvdW5kICs9IDE7XHJcbiAgICAgICAgc3RhdGUuc3RhZ2UgPSAwO1xyXG5cclxuICAgICAgICBjdXAuZXZlbnQoJ3EnLCBzdGF0ZS5yb3VuZCk7XHJcbiAgICAgICAgdGhpcy5yZXNldFBsYXllckNob2ljZXMoKTtcclxuICAgICAgICB0aGlzLm5leHRRdWVzdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uSm9pbihhY3Rpb24pIHtcclxuICAgICAgICBpZiAoIWFjdGlvbi51c2VyLmlkKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCB1c2VyID0gY3VwLnBsYXllcnMoYWN0aW9uLnVzZXIuaWQpO1xyXG4gICAgICAgIGlmICghdXNlcilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvL25ldyBwbGF5ZXIgZGVmYXVsdHNcclxuICAgICAgICB1c2VyLnNjb3JlID0gMDtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBvbkxlYXZlKGFjdGlvbikge1xyXG4gICAgICAgIGxldCBpZCA9IGFjdGlvbi51c2VyLmlkO1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gY3VwLnBsYXllcnMoKTtcclxuICAgICAgICAvLyBsZXQgcGxheWVyTGlzdCA9IGN1cC5wbGF5ZXJMaXN0KCk7XHJcbiAgICAgICAgbGV0IHBsYXllciA9IHBsYXllcnNbaWRdO1xyXG4gICAgICAgIGlmIChwbGF5ZXIpIHtcclxuICAgICAgICAgICAgcGxheWVyLmZvcmZlaXQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGFjdGl2ZUNvdW50ID0gMDtcclxuICAgICAgICBmb3IgKHZhciBwaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBpZiAoIXBsYXllcnNbcGlkXS5mb3JmZWl0KVxyXG4gICAgICAgICAgICAgICAgYWN0aXZlQ291bnQrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gaWYgKHBsYXllcnNbaWRdKSB7XHJcbiAgICAgICAgLy8gICAgIGRlbGV0ZSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICAvLyB9XHJcbiAgICAgICAgaWYgKGFjdGl2ZUNvdW50IDw9IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzV2lubmVycygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvblBpY2soYWN0aW9uKSB7XHJcblxyXG4gICAgICAgIC8vIGlmIChjdXAucmVhY2hlZFRpbWVsaW1pdChhY3Rpb24pKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICAgICAgLy8gICAgIGN1cC5sb2coXCJQaWNrIHBhc3NlZCB0aW1lbGltaXQsIGdldHRpbmcgbmV3IHJvdW5kXCIpO1xyXG4gICAgICAgIC8vICAgICByZXR1cm47XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBjdXAuc3RhdGUoKTtcclxuICAgICAgICBsZXQgcGxheWVyID0gY3VwLnBsYXllcnMoYWN0aW9uLnVzZXIuaWQpO1xyXG5cclxuICAgICAgICAvL2dldCB0aGUgcGlja2VkIGNlbGxcclxuICAgICAgICBsZXQgY2hvaWNlID0gYWN0aW9uLnBheWxvYWQuY2hvaWNlO1xyXG5cclxuICAgICAgICBpZiAoY2hvaWNlIDwgMCB8fCBjaG9pY2UgPiBzdGF0ZS5jaG9pY2VzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjdXAuaWdub3JlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBwbGF5ZXIuY2hvaWNlID0gY2hvaWNlO1xyXG5cclxuICAgICAgICBjdXAuZXZlbnQoJ3BpY2tlZCcpO1xyXG4gICAgICAgIHN0YXRlLnBpY2tlZCA9IHBsYXllci5pZDtcclxuXHJcbiAgICAgICAgbGV0IHZvdGVkID0gMDtcclxuICAgICAgICBsZXQgcGxheWVyTGlzdCA9IGN1cC5wbGF5ZXJMaXN0KCk7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgb2YgcGxheWVyTGlzdCkge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gY3VwLnBsYXllcnMoaWQpO1xyXG4gICAgICAgICAgICBpZiAocGxheWVyLmNob2ljZSAhPSAtMSAmJiB0eXBlb2YgcGxheWVyLmNob2ljZSAhPT0gJ3VuZGVmaW5lZCcgJiYgcGxheWVyLmNob2ljZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB2b3RlZCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL2VuZCByb3VuZFxyXG4gICAgICAgIGlmICh2b3RlZCA+PSBwbGF5ZXJMaXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICB0aGlzLm9uU2tpcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuXHJcblxyXG4gICAgcmVzZXRQbGF5ZXJDaG9pY2VzKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gY3VwLnBsYXllcnMoKTtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgLy8gcGxheWVyLmNob2ljZXMgPSBwbGF5ZXIuY2hvaWNlcyB8fCBbXTtcclxuICAgICAgICAgICAgLy8gaWYgKHR5cGVvZiBwbGF5ZXIuX2Nob2ljZSAhPT0gJ3VuZGVmaW5lZCcgJiYgcGxheWVyLl9jaG9pY2UgIT0gbnVsbClcclxuICAgICAgICAgICAgLy8gICAgIHBsYXllci5jaG9pY2VzLnB1c2gocGxheWVyLl9jaG9pY2UpO1xyXG4gICAgICAgICAgICAvLyBlbHNlXHJcbiAgICAgICAgICAgIC8vICAgICBwbGF5ZXIuY2hvaWNlcy5wdXNoKC0xKTtcclxuICAgICAgICAgICAgcGxheWVyLmNob2ljZSA9IC0xO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzTmV4dFF1ZXN0aW9uKCkge1xyXG4gICAgICAgIGxldCBzdGF0ZSA9IGN1cC5zdGF0ZSgpO1xyXG5cclxuICAgICAgICAvL2ZpbmQgYSByYW5kb20gcXVlc3Rpb24gbm90IGFza2VkIGJlZm9yZVxyXG4gICAgICAgIGxldCBfcWlkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcXVlc3Rpb25zLmxlbmd0aCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLl9oaXN0b3J5LmluY2x1ZGVzKF9xaWQpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc05leHRRdWVzdGlvbigpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldHVwIG5leHQgcXVlc3Rpb25cclxuICAgICAgICBsZXQgcXVlc3Rpb24gPSBxdWVzdGlvbnNbX3FpZF07XHJcbiAgICAgICAgc3RhdGUuX3FpZCA9IF9xaWQ7XHJcbiAgICAgICAgc3RhdGUucXVlc3Rpb24gPSBxdWVzdGlvbi5xO1xyXG4gICAgICAgIHN0YXRlLmNhdGVnb3J5ID0gcXVlc3Rpb24uYztcclxuICAgICAgICBpZiAocXVlc3Rpb24udCA9PSAnYm9vbGVhbicpIHtcclxuICAgICAgICAgICAgLy9hbHdheXMgVHJ1ZSB0aGVuIEZhbHNlIGluIHRoZSBjaG9pY2VzXHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMgPSBbJ1RydWUnLCAnRmFsc2UnXVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy9zb3J0IHRoZSBjaG9pY2VzIGFscGhhYmV0aWNhbGx5XHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMgPSBbXTtcclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcy5wdXNoKHF1ZXN0aW9uLmEpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXN0aW9uLmkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHN0YXRlLmNob2ljZXMucHVzaChxdWVzdGlvbi5pW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzLnNvcnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9zYXZlIHRoaXMgcXVlc3Rpb24gaW4gX2hpc3RvcnkgdG8gYXZvaWQgY2hvb3NpbmcgYWdhaW5cclxuICAgICAgICBzdGF0ZS5faGlzdG9yeS5wdXNoKF9xaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NXaW5uZXJzKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJMaXN0ID0gW107XHJcbiAgICAgICAgbGV0IHBsYXllcklkcyA9IFtdO1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gY3VwLnBsYXllcnMoKTtcclxuXHJcbiAgICAgICAgLy9hZGQgcGxheWVyIGlkIGludG8gdGhlIHBsYXllciBkYXRhXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBwbGF5ZXJzW2lkXS5pZCA9IGlkO1xyXG4gICAgICAgICAgICBwbGF5ZXJMaXN0LnB1c2gocGxheWVyc1tpZF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zb3J0IGFsbCBwbGF5ZXJzIGJ5IHRoZWlyIHNjb3JlXHJcbiAgICAgICAgcGxheWVyTGlzdC5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBiLnNjb3JlIC0gYS5zY29yZTtcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICAvL2dldCB0aGUgdG9wIDEwIGFuZCByYW5rIHRoZW1cclxuICAgICAgICBsZXQgbGFzdHNjb3JlID0gbnVsbDtcclxuICAgICAgICBsZXQgd2lucG9zID0gMDtcclxuICAgICAgICBsZXQgd2lubmVycyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTWF0aC5taW4ocGxheWVyTGlzdC5sZW5ndGgsIDEwKTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBwbGF5ZXJMaXN0W2ldO1xyXG4gICAgICAgICAgICBpZiAobGFzdHNjb3JlICE9IG51bGwgJiYgbGFzdHNjb3JlICE9IHBsYXllci5zY29yZSlcclxuICAgICAgICAgICAgICAgIHdpbnBvcysrO1xyXG4gICAgICAgICAgICBwbGF5ZXIucmFuayA9IHdpbnBvcztcclxuICAgICAgICAgICAgbGFzdHNjb3JlID0gcGxheWVyLnNjb3JlO1xyXG4gICAgICAgICAgICB3aW5uZXJzLnB1c2gocGxheWVyLmlkKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvL3JlbW92ZSBpZCwgc28gd2UgZG9uJ3Qgc2VuZCBvdmVyIG5ldHdvcmtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXJzW2lkXVsnaWQnXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGN1cC5zdGF0ZSgpO1xyXG4gICAgICAgIHN0YXRlLndpbm5lcnMgPSB3aW5uZXJzO1xyXG4gICAgICAgIGN1cC5nYW1lb3Zlcih3aW5uZXJzKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzQ29ycmVjdEFuc3dlcnMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBjdXAucGxheWVycygpO1xyXG4gICAgICAgIGxldCBzdGF0ZSA9IGN1cC5zdGF0ZSgpO1xyXG4gICAgICAgIGlmIChzdGF0ZS5yb3VuZCA8PSAwKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vYXdhcmQgc2NvcmUgZm9yIGNvcnJlY3QgY2hvaWNlcywgcmVtb3ZlIHNjb3JlIGZvciB3cm9uZyBjaG9pY2VzXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyc1tpZF07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGxheWVyLmNob2ljZSA9PSAndW5kZWZpbmVkJyB8fCBwbGF5ZXIuY2hvaWNlID09IG51bGwgfHwgcGxheWVyLmNob2ljZSA9PSAtMSlcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgbGV0IGFuc3dlciA9IHF1ZXN0aW9uc1tzdGF0ZS5fcWlkXS5hO1xyXG4gICAgICAgICAgICBsZXQgdXNlckNob2ljZSA9IHN0YXRlLmNob2ljZXNbcGxheWVyLmNob2ljZV07XHJcbiAgICAgICAgICAgIGlmIChhbnN3ZXIgPT0gdXNlckNob2ljZSkge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnNjb3JlICs9IDEwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnNjb3JlIC09IDI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IFBvcFRyaXZpYSgpO1xyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsImltcG9ydCBjdXAgZnJvbSAnLi9hY29zZyc7XHJcbmltcG9ydCBQb3BUcml2aWEgZnJvbSAnLi9nYW1lJztcclxuXHJcblxyXG5cclxuY3VwLm9uKCdnYW1lc3RhcnQnLCAoYWN0aW9uKSA9PiBQb3BUcml2aWEub25OZXdHYW1lKGFjdGlvbikpO1xyXG5jdXAub24oJ3NraXAnLCAoYWN0aW9uKSA9PiBQb3BUcml2aWEub25Ta2lwKGFjdGlvbikpO1xyXG5jdXAub24oJ2pvaW4nLCAoYWN0aW9uKSA9PiBQb3BUcml2aWEub25Kb2luKGFjdGlvbikpO1xyXG5jdXAub24oJ2xlYXZlJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uTGVhdmUoYWN0aW9uKSk7XHJcbmN1cC5vbigncGljaycsIChhY3Rpb24pID0+IFBvcFRyaXZpYS5vblBpY2soYWN0aW9uKSk7XHJcblxyXG5jdXAuY29tbWl0KCk7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9