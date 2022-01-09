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

    submit() {
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
        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].setGame(defaultGame);
        this.startGame();
    }

    startGame() {
        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();
        for (var id in players)
            players[id].points = 0;

        this.nextRound();
    }

    onSkip(action) {

        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
        let stage = state.stage || 0;

        switch (state.stage) {
            case 0:
                stage += 1;
                _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].next({
                    id: '*',
                })
                this.processNextQuestion();
                _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].setTimelimit(60);
                break;
            case 1:
                stage += 1;
                _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].setTimelimit(15);
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

        let user = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players(action.user.id);
        if (!user)
            return;

        //new player defaults
        user.points = 0;

    }



    onLeave(action) {
        let id = action.user.id;
        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();
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



    nextRound() {
        this.processCorrectAnswers();

        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
        state.round = state.round + 1;
        state.stage = 0;

        let rules = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].rules();
        if (state.round > rules.rounds) {
            this.processWinners();
            return;
        }

        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].event('q', state.round);
        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].setTimelimit(5);

        this.resetPlayerChoices();

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
        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();

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

        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
        state.winners = winners;
        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].gameover(winners);

        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].killGame();
    }

    processCorrectAnswers() {
        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();
        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
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

_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].submit();
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0EsUUFBUSx1REFBWTtBQUNwQjtBQUNBO0FBQ0E7QUFDQSxzQkFBc0Isc0RBQVc7QUFDakMsb0JBQW9CLG9EQUFTO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpRUFBZSxlQUFlOzs7Ozs7VUM1UDlCO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7Ozs7Ozs7OztBQ0EwQjtBQUNLO0FBQy9CO0FBQ0E7QUFDQTtBQUNBLGlEQUFNLDBCQUEwQix1REFBbUI7QUFDbkQsaURBQU0scUJBQXFCLG9EQUFnQjtBQUMzQyxpREFBTSxxQkFBcUIsb0RBQWdCO0FBQzNDLGlEQUFNLHNCQUFzQixxREFBaUI7QUFDN0MsaURBQU0scUJBQXFCLG9EQUFnQjtBQUMzQztBQUNBLHFEQUFVLEciLCJzb3VyY2VzIjpbIi4uLy4uLy4vZ2FtZS1zZXJ2ZXIvYWNvc2cuanMiLCIuLi8uLi8uL2dhbWUtc2VydmVyL2dhbWUuanMiLCIuLi8uLi93ZWJwYWNrL2Jvb3RzdHJhcCIsIi4uLy4uL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIi4uLy4uL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCIuLi8uLi8uL2dhbWUtc2VydmVyL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxyXG5jbGFzcyBBQ09TRyB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGdsb2JhbHMuYWN0aW9ucygpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7IHRoaXMuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIGFjdGlvbnMnKTsgcmV0dXJuIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsR2FtZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5nYW1lKCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgdGhpcy5lcnJvcignRmFpbGVkIHRvIGxvYWQgb3JpZ2luYWxHYW1lJyk7IHJldHVybiB9XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5nYW1lKCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgdGhpcy5lcnJvcignRmFpbGVkIHRvIGxvYWQgbmV4dEdhbWUnKTsgcmV0dXJuIH1cclxuXHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMuaXNOZXdHYW1lID0gZmFsc2U7XHJcbiAgICAgICAgLy8gdGhpcy5tYXJrZWRGb3JEZWxldGUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRlZmF1bHRTZWNvbmRzID0gMTU7XHJcbiAgICAgICAgLy8gdGhpcy5uZXh0VGltZUxpbWl0ID0gLTE7XHJcbiAgICAgICAgdGhpcy5raWNrZWRQbGF5ZXJzID0gW107XHJcblxyXG4gICAgICAgIC8vIGlmICghdGhpcy5uZXh0R2FtZSB8fCAhdGhpcy5uZXh0R2FtZS5ydWxlcyB8fCBPYmplY3Qua2V5cyh0aGlzLm5leHRHYW1lLnJ1bGVzKS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIC8vICAgICB0aGlzLmlzTmV3R2FtZSA9IHRydWU7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuZXJyb3IoJ01pc3NpbmcgUnVsZXMnKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm5leHRHYW1lKSB7XHJcbiAgICAgICAgICAgIGlmICghKCd0aW1lcicgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUudGltZXIgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoISgnc3RhdGUnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnN0YXRlID0ge307XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghKCdwbGF5ZXJzJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5wbGF5ZXJzID0ge307XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCEoJ3ByZXYnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUucHJldiA9IHt9O1xyXG4gICAgICAgICAgICAvL31cclxuXHJcbiAgICAgICAgICAgIGlmICghKCduZXh0JyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5uZXh0ID0ge307XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghKCdydWxlcycgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUucnVsZXMgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMgPSB7fTtcclxuICAgICAgICB9XHJcblxyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgb24odHlwZSwgY2IpIHtcclxuXHJcbiAgICAgICAgLy8gaWYgKHR5cGUgPT0gJ25ld2dhbWUnKSB7XHJcbiAgICAgICAgLy8gICAgIC8vaWYgKHRoaXMuaXNOZXdHYW1lKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY3VycmVudEFjdGlvbiA9IHRoaXMuYWN0aW9uc1swXTtcclxuICAgICAgICAvLyAgICAgaWYgKHRoaXMuY3VycmVudEFjdGlvbi50eXBlID09ICcnKVxyXG4gICAgICAgIC8vICAgICAgICAgY2IodGhpcy5hY3Rpb25zWzBdKTtcclxuICAgICAgICAvLyAgICAgdGhpcy5pc05ld0dhbWUgPSBmYWxzZTtcclxuICAgICAgICAvLyAgICAgLy99XHJcblxyXG4gICAgICAgIC8vICAgICByZXR1cm47XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYWN0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25zW2ldLnR5cGUgPT0gdHlwZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gdGhpcy5hY3Rpb25zW2ldO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdCA9IGNiKHRoaXMuY3VycmVudEFjdGlvbik7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PSBcImJvb2xlYW5cIiAmJiAhcmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pZ25vcmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGlnbm9yZSgpIHtcclxuICAgICAgICBnbG9iYWxzLmlnbm9yZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEdhbWUoZ2FtZSkge1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMubmV4dEdhbWUucGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgZ2FtZS5wbGF5ZXJzW2lkXSA9IHBsYXllcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZSA9IGdhbWU7XHJcbiAgICB9XHJcblxyXG4gICAgc3VibWl0KCkge1xyXG4gICAgICAgIGlmICh0aGlzLmtpY2tlZFBsYXllcnMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5raWNrID0gdGhpcy5raWNrZWRQbGF5ZXJzO1xyXG5cclxuICAgICAgICBnbG9iYWxzLmZpbmlzaCh0aGlzLm5leHRHYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBnYW1lb3ZlcihwYXlsb2FkKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudCgnZ2FtZW92ZXInLCBwYXlsb2FkKTtcclxuICAgIH1cclxuXHJcbiAgICBsb2cobXNnKSB7XHJcbiAgICAgICAgZ2xvYmFscy5sb2cobXNnKTtcclxuICAgIH1cclxuICAgIGVycm9yKG1zZykge1xyXG4gICAgICAgIGdsb2JhbHMuZXJyb3IobXNnKTtcclxuICAgIH1cclxuXHJcbiAgICBraWNrUGxheWVyKGlkKSB7XHJcbiAgICAgICAgdGhpcy5raWNrZWRQbGF5ZXJzLnB1c2goaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGRhdGFiYXNlKCkge1xyXG4gICAgICAgIHJldHVybiBnbG9iYWxzLmRhdGFiYXNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRBY3Rpb247XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGUoa2V5LCB2YWx1ZSkge1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnN0YXRlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5zdGF0ZVtrZXldO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRHYW1lLnN0YXRlW2tleV0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwbGF5ZXJMaXN0KCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLm5leHRHYW1lLnBsYXllcnMpO1xyXG4gICAgfVxyXG4gICAgcGxheWVyQ291bnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucGxheWVycykubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHBsYXllcnModXNlcmlkLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdXNlcmlkID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucGxheWVycztcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucGxheWVyc1t1c2VyaWRdO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRHYW1lLnBsYXllcnNbdXNlcmlkXSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJ1bGVzKHJ1bGUsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBydWxlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucnVsZXM7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnJ1bGVzW3J1bGVdO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRHYW1lLnJ1bGVzW3J1bGVdID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJldihvYmopIHtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5wcmV2ID0gb2JqO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wcmV2O1xyXG4gICAgfVxyXG5cclxuICAgIG5leHQob2JqKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUubmV4dCA9IG9iajtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUubmV4dDtcclxuICAgIH1cclxuXHJcbiAgICBzZXRUaW1lbGltaXQoc2Vjb25kcykge1xyXG4gICAgICAgIHNlY29uZHMgPSBzZWNvbmRzIHx8IHRoaXMuZGVmYXVsdFNlY29uZHM7XHJcbiAgICAgICAgaWYgKCF0aGlzLm5leHRHYW1lLnRpbWVyKVxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyID0ge307XHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS50aW1lci5zZXQgPSBzZWNvbmRzOy8vIE1hdGgubWluKDYwLCBNYXRoLm1heCgxMCwgc2Vjb25kcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWNoZWRUaW1lbGltaXQoYWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhY3Rpb24udGltZWxlZnQgPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICByZXR1cm4gYWN0aW9uLnRpbWVsZWZ0IDw9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZXZlbnQobmFtZSwgcGF5bG9hZCkge1xyXG4gICAgICAgIGlmICghcGF5bG9hZClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuZXZlbnRzW25hbWVdO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50c1tuYW1lXSA9IHBheWxvYWQgfHwge307XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJFdmVudHMoKSB7XHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMgPSB7fTtcclxuICAgIH1cclxuICAgIC8vIGV2ZW50cyhuYW1lKSB7XHJcbiAgICAvLyAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAndW5kZWZpbmVkJylcclxuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuZXZlbnRzO1xyXG4gICAgLy8gICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzLnB1c2gobmFtZSk7XHJcbiAgICAvLyB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBBQ09TRygpOyIsImltcG9ydCBjdXAgZnJvbSAnLi9hY29zZyc7XHJcblxyXG5sZXQgcXVlc3Rpb25zID0gY3VwLmRhdGFiYXNlKCk7XHJcblxyXG5sZXQgZGVmYXVsdEdhbWUgPSB7XHJcbiAgICBzdGF0ZToge1xyXG4gICAgICAgIHFpZDogMCxcclxuICAgICAgICBoaXN0b3J5OiBbXSxcclxuICAgICAgICBjYXRlZ29yeTogJycsXHJcbiAgICAgICAgcXVlc3Rpb246ICcnLFxyXG4gICAgICAgIGNob2ljZXM6IFtdLFxyXG4gICAgICAgIHJvdW5kOiAwLFxyXG4gICAgICAgIHN0YWdlOiAwXHJcbiAgICB9LFxyXG4gICAgcGxheWVyczoge30sXHJcbiAgICBydWxlczoge1xyXG4gICAgICAgIHJvdW5kczogMixcclxuICAgICAgICBtYXhwbGF5ZXJzOiAyXHJcbiAgICB9LFxyXG4gICAgbmV4dDoge30sXHJcbiAgICBldmVudHM6IFtdXHJcbn1cclxuXHJcblxyXG5cclxuY2xhc3MgUG9wVHJpdmlhIHtcclxuXHJcbiAgICBvbk5ld0dhbWUoYWN0aW9uKSB7XHJcbiAgICAgICAgY3VwLnNldEdhbWUoZGVmYXVsdEdhbWUpO1xyXG4gICAgICAgIHRoaXMuc3RhcnRHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnRHYW1lKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gY3VwLnBsYXllcnMoKTtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKVxyXG4gICAgICAgICAgICBwbGF5ZXJzW2lkXS5wb2ludHMgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRSb3VuZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2tpcChhY3Rpb24pIHtcclxuXHJcbiAgICAgICAgbGV0IHN0YXRlID0gY3VwLnN0YXRlKCk7XHJcbiAgICAgICAgbGV0IHN0YWdlID0gc3RhdGUuc3RhZ2UgfHwgMDtcclxuXHJcbiAgICAgICAgc3dpdGNoIChzdGF0ZS5zdGFnZSkge1xyXG4gICAgICAgICAgICBjYXNlIDA6XHJcbiAgICAgICAgICAgICAgICBzdGFnZSArPSAxO1xyXG4gICAgICAgICAgICAgICAgY3VwLm5leHQoe1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiAnKicsXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzTmV4dFF1ZXN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBjdXAuc2V0VGltZWxpbWl0KDYwKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICAgICAgICBzdGFnZSArPSAxO1xyXG4gICAgICAgICAgICAgICAgY3VwLnNldFRpbWVsaW1pdCgxNSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9pZiAoY3VwLnJlYWNoZWRUaW1lbGltaXQoYWN0aW9uKSlcclxuXHJcbiAgICB9XHJcblxyXG4gICAgb25Kb2luKGFjdGlvbikge1xyXG4gICAgICAgIGlmICghYWN0aW9uLnVzZXIuaWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHVzZXIgPSBjdXAucGxheWVycyhhY3Rpb24udXNlci5pZCk7XHJcbiAgICAgICAgaWYgKCF1c2VyKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vbmV3IHBsYXllciBkZWZhdWx0c1xyXG4gICAgICAgIHVzZXIucG9pbnRzID0gMDtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBvbkxlYXZlKGFjdGlvbikge1xyXG4gICAgICAgIGxldCBpZCA9IGFjdGlvbi51c2VyLmlkO1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gY3VwLnBsYXllcnMoKTtcclxuICAgICAgICBpZiAocGxheWVyc1tpZF0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIHBsYXllcnNbaWRdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvblBpY2soYWN0aW9uKSB7XHJcblxyXG4gICAgICAgIC8vIGlmIChjdXAucmVhY2hlZFRpbWVsaW1pdChhY3Rpb24pKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICAgICAgLy8gICAgIGN1cC5sb2coXCJQaWNrIHBhc3NlZCB0aW1lbGltaXQsIGdldHRpbmcgbmV3IHJvdW5kXCIpO1xyXG4gICAgICAgIC8vICAgICByZXR1cm47XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBjdXAuc3RhdGUoKTtcclxuICAgICAgICBsZXQgdXNlciA9IGN1cC5wbGF5ZXJzKGFjdGlvbi51c2VyLmlkKTtcclxuXHJcbiAgICAgICAgLy9nZXQgdGhlIHBpY2tlZCBjZWxsXHJcbiAgICAgICAgbGV0IGNob2ljZSA9IGFjdGlvbi5wYXlsb2FkLmNob2ljZTtcclxuXHJcbiAgICAgICAgaWYgKGNob2ljZSA8IDAgfHwgY2hvaWNlID4gc3RhdGUuY2hvaWNlcy5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdXNlci5fY2hvaWNlID0gY2hvaWNlO1xyXG5cclxuICAgICAgICBjdXAuZXZlbnQoJ3BpY2tlZCcpO1xyXG4gICAgICAgIHN0YXRlLnBpY2tlZCA9IHVzZXIuaWQ7XHJcblxyXG4gICAgICAgIGxldCB2b3RlZCA9IDA7XHJcbiAgICAgICAgbGV0IHBsYXllckxpc3QgPSBjdXAucGxheWVyTGlzdCgpO1xyXG4gICAgICAgIGZvciAodmFyIGlkIG9mIHBsYXllckxpc3QpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IGN1cC5wbGF5ZXJzKGlkKTtcclxuICAgICAgICAgICAgaWYgKHBsYXllci5fY2hvaWNlKSB7XHJcbiAgICAgICAgICAgICAgICB2b3RlZCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL2VuZCByb3VuZFxyXG4gICAgICAgIGlmICh2b3RlZCA+PSBwbGF5ZXJMaXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICB0aGlzLm9uU2tpcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIG5leHRSb3VuZCgpIHtcclxuICAgICAgICB0aGlzLnByb2Nlc3NDb3JyZWN0QW5zd2VycygpO1xyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBjdXAuc3RhdGUoKTtcclxuICAgICAgICBzdGF0ZS5yb3VuZCA9IHN0YXRlLnJvdW5kICsgMTtcclxuICAgICAgICBzdGF0ZS5zdGFnZSA9IDA7XHJcblxyXG4gICAgICAgIGxldCBydWxlcyA9IGN1cC5ydWxlcygpO1xyXG4gICAgICAgIGlmIChzdGF0ZS5yb3VuZCA+IHJ1bGVzLnJvdW5kcykge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NXaW5uZXJzKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN1cC5ldmVudCgncScsIHN0YXRlLnJvdW5kKTtcclxuICAgICAgICBjdXAuc2V0VGltZWxpbWl0KDUpO1xyXG5cclxuICAgICAgICB0aGlzLnJlc2V0UGxheWVyQ2hvaWNlcygpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXNldFBsYXllckNob2ljZXMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBjdXAucGxheWVycygpO1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IHBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBwbGF5ZXIuY2hvaWNlcyA9IHBsYXllci5jaG9pY2VzIHx8IFtdO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsYXllci5fY2hvaWNlICE9PSAndW5kZWZpbmVkJyAmJiBwbGF5ZXIuX2Nob2ljZSAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgcGxheWVyLmNob2ljZXMucHVzaChwbGF5ZXIuX2Nob2ljZSk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXIuX2Nob2ljZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc05leHRRdWVzdGlvbigpIHtcclxuICAgICAgICBsZXQgc3RhdGUgPSBjdXAuc3RhdGUoKTtcclxuXHJcbiAgICAgICAgLy9maW5kIGEgcmFuZG9tIHF1ZXN0aW9uIG5vdCBhc2tlZCBiZWZvcmVcclxuICAgICAgICBsZXQgcWlkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcXVlc3Rpb25zLmxlbmd0aCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLmhpc3RvcnkuaW5jbHVkZXMocWlkKSkge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NOZXh0UXVlc3Rpb24oKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zZXR1cCBuZXh0IHF1ZXN0aW9uXHJcbiAgICAgICAgbGV0IHF1ZXN0aW9uID0gcXVlc3Rpb25zW3FpZF07XHJcbiAgICAgICAgc3RhdGUucWlkID0gcWlkO1xyXG4gICAgICAgIHN0YXRlLnF1ZXN0aW9uID0gcXVlc3Rpb24ucTtcclxuICAgICAgICBzdGF0ZS5jYXRlZ29yeSA9IHF1ZXN0aW9uLmM7XHJcbiAgICAgICAgaWYgKHF1ZXN0aW9uLnQgPT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgICAgIC8vYWx3YXlzIFRydWUgdGhlbiBGYWxzZSBpbiB0aGUgY2hvaWNlc1xyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzID0gWydUcnVlJywgJ0ZhbHNlJ11cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vc29ydCB0aGUgY2hvaWNlcyBhbHBoYWJldGljYWxseVxyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzID0gW107XHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMucHVzaChxdWVzdGlvbi5hKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWVzdGlvbi5pLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5jaG9pY2VzLnB1c2gocXVlc3Rpb24uaVtpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcy5zb3J0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vc2F2ZSB0aGlzIHF1ZXN0aW9uIGluIGhpc3RvcnkgdG8gYXZvaWQgY2hvb3NpbmcgYWdhaW5cclxuICAgICAgICBzdGF0ZS5oaXN0b3J5LnB1c2gocWlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzV2lubmVycygpIHtcclxuICAgICAgICBsZXQgcGxheWVyTGlzdCA9IFtdO1xyXG4gICAgICAgIGxldCBwbGF5ZXJJZHMgPSBbXTtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGN1cC5wbGF5ZXJzKCk7XHJcblxyXG4gICAgICAgIC8vYWRkIHBsYXllciBpZCBpbnRvIHRoZSBwbGF5ZXIgZGF0YVxyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgcGxheWVyc1tpZF0uaWQgPSBpZDtcclxuICAgICAgICAgICAgcGxheWVyTGlzdC5wdXNoKHBsYXllcnNbaWRdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc29ydCBhbGwgcGxheWVycyBieSB0aGVpciBwb2ludHNcclxuICAgICAgICBwbGF5ZXJMaXN0LnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgYS5wb2ludHMgLSBiLnBvaW50cztcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICAvL2dldCB0aGUgdG9wIDEwXHJcbiAgICAgICAgbGV0IHdpbm5lcnMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE1hdGgubWluKHBsYXllckxpc3QubGVuZ3RoLCAxMCk7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyTGlzdFtpXTtcclxuICAgICAgICAgICAgd2lubmVycy5wdXNoKHBsYXllci5pZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3JlbW92ZSBpZCwgc28gd2UgZG9uJ3Qgc2VuZCBvdmVyIG5ldHdvcmtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXJzW2lkXVsnaWQnXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGN1cC5zdGF0ZSgpO1xyXG4gICAgICAgIHN0YXRlLndpbm5lcnMgPSB3aW5uZXJzO1xyXG4gICAgICAgIGN1cC5nYW1lb3Zlcih3aW5uZXJzKTtcclxuXHJcbiAgICAgICAgY3VwLmtpbGxHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc0NvcnJlY3RBbnN3ZXJzKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gY3VwLnBsYXllcnMoKTtcclxuICAgICAgICBsZXQgc3RhdGUgPSBjdXAuc3RhdGUoKTtcclxuICAgICAgICBpZiAoc3RhdGUucm91bmQgPD0gMClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvL2F3YXJkIHBvaW50cyBmb3IgY29ycmVjdCBjaG9pY2VzLCByZW1vdmUgcG9pbnRzIGZvciB3cm9uZyBjaG9pY2VzXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyc1tpZF07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGxheWVyLl9jaG9pY2UgPT0gJ3VuZGVmaW5lZCcgfHwgcGxheWVyLl9jaG9pY2UgPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgbGV0IGFuc3dlciA9IHF1ZXN0aW9uc1tzdGF0ZS5xaWRdLmE7XHJcbiAgICAgICAgICAgIGxldCB1c2VyQ2hvaWNlID0gc3RhdGUuY2hvaWNlc1twbGF5ZXIuX2Nob2ljZV07XHJcbiAgICAgICAgICAgIGlmIChhbnN3ZXIgPT0gdXNlckNob2ljZSkge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnBvaW50cyArPSAxMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBsYXllci5wb2ludHMgLT0gMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuZXcgUG9wVHJpdmlhKCk7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCJpbXBvcnQgY3VwIGZyb20gJy4vYWNvc2cnO1xyXG5pbXBvcnQgUG9wVHJpdmlhIGZyb20gJy4vZ2FtZSc7XHJcblxyXG5cclxuXHJcbmN1cC5vbignZ2FtZXN0YXJ0JywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uTmV3R2FtZShhY3Rpb24pKTtcclxuY3VwLm9uKCdza2lwJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uU2tpcChhY3Rpb24pKTtcclxuY3VwLm9uKCdqb2luJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uSm9pbihhY3Rpb24pKTtcclxuY3VwLm9uKCdsZWF2ZScsIChhY3Rpb24pID0+IFBvcFRyaXZpYS5vbkxlYXZlKGFjdGlvbikpO1xyXG5jdXAub24oJ3BpY2snLCAoYWN0aW9uKSA9PiBQb3BUcml2aWEub25QaWNrKGFjdGlvbikpO1xyXG5cclxuY3VwLnN1Ym1pdCgpOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==