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
        round: 0
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
        // this.checkStartGame();

        let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();
        for (var id in players)
            players[id].points = 0;

        this.nextRound();
    }

    onSkip(action) {
        //if (cup.reachedTimelimit(action))
        this.nextRound();
    }

    onJoin(action) {
        if (!action.user.id)
            return;

        let user = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players(action.user.id);
        if (!user)
            return;

        //new player defaults
        user.points = 0;

        // this.checkStartGame();
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
    }


    checkStartGame() {
        //if player count reached required limit, start the game
        let maxPlayers = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].rules('maxPlayers') || 2;
        let playerCount = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].playerCount();
        if (playerCount >= maxPlayers) {
            let players = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].players();
            for (var id in players)
                players[id].points = 0;

            this.nextRound();
        }
    }

    nextRound() {
        this.processCorrectAnswers();

        let state = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].state();
        state.round = state.round + 1;
        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].next({
            id: '*',
        })
        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].setTimelimit(5);

        this.resetPlayerChoices();

        let rules = _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].rules();
        if (state.round > rules.rounds) {
            this.processWinners();
            return;
        }

        this.processNextQuestion();
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
        _acosg__WEBPACK_IMPORTED_MODULE_0__["default"].events('winner');

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





_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].on('newgame', (action) => _game__WEBPACK_IMPORTED_MODULE_1__["default"].onNewGame(action));
_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].on('skip', (action) => _game__WEBPACK_IMPORTED_MODULE_1__["default"].onSkip(action));
_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].on('join', (action) => _game__WEBPACK_IMPORTED_MODULE_1__["default"].onJoin(action));
_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].on('leave', (action) => _game__WEBPACK_IMPORTED_MODULE_1__["default"].onLeave(action));
_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].on('pick', (action) => _game__WEBPACK_IMPORTED_MODULE_1__["default"].onPick(action));

_acosg__WEBPACK_IMPORTED_MODULE_0__["default"].submit();
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFlLGVBQWU7Ozs7OztVQ3BPOUI7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7Ozs7Ozs7O0FDQTBCO0FBQ0s7QUFDL0I7QUFDQTtBQUNBO0FBQ0EsaURBQU0sd0JBQXdCLHVEQUFtQjtBQUNqRCxpREFBTSxxQkFBcUIsb0RBQWdCO0FBQzNDLGlEQUFNLHFCQUFxQixvREFBZ0I7QUFDM0MsaURBQU0sc0JBQXNCLHFEQUFpQjtBQUM3QyxpREFBTSxxQkFBcUIsb0RBQWdCO0FBQzNDO0FBQ0EscURBQVUsRyIsInNvdXJjZXMiOlsiLi4vLi4vLi9nYW1lLXNlcnZlci9hY29zZy5qcyIsIi4uLy4uLy4vZ2FtZS1zZXJ2ZXIvZ2FtZS5qcyIsIi4uLy4uL3dlYnBhY2svYm9vdHN0cmFwIiwiLi4vLi4vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwiLi4vLi4vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIi4uLy4uLy4vZ2FtZS1zZXJ2ZXIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXHJcbmNsYXNzIEFDT1NHIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5hY3Rpb25zKCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgdGhpcy5lcnJvcignRmFpbGVkIHRvIGxvYWQgYWN0aW9ucycpOyByZXR1cm4gfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxHYW1lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmdhbWUoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkgeyB0aGlzLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBvcmlnaW5hbEdhbWUnKTsgcmV0dXJuIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmdhbWUoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkgeyB0aGlzLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBuZXh0R2FtZScpOyByZXR1cm4gfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5pc05ld0dhbWUgPSBmYWxzZTtcclxuICAgICAgICAvLyB0aGlzLm1hcmtlZEZvckRlbGV0ZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFNlY29uZHMgPSAxNTtcclxuICAgICAgICAvLyB0aGlzLm5leHRUaW1lTGltaXQgPSAtMTtcclxuICAgICAgICB0aGlzLmtpY2tlZFBsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCF0aGlzLm5leHRHYW1lIHx8ICF0aGlzLm5leHRHYW1lLnJ1bGVzIHx8IE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucnVsZXMpLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuaXNOZXdHYW1lID0gdHJ1ZTtcclxuICAgICAgICAvLyAgICAgdGhpcy5lcnJvcignTWlzc2luZyBSdWxlcycpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMubmV4dEdhbWUpIHtcclxuICAgICAgICAgICAgaWYgKCEoJ3RpbWVyJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS50aW1lciA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghKCdzdGF0ZScgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGUgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ3BsYXllcnMnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnBsYXllcnMgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9pZiAoISgncHJldicgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5wcmV2ID0ge307XHJcbiAgICAgICAgICAgIC8vfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ25leHQnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLm5leHQgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ3J1bGVzJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5ydWxlcyA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cyA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBvbih0eXBlLCBjYikge1xyXG5cclxuICAgICAgICAvLyBpZiAodHlwZSA9PSAnbmV3Z2FtZScpIHtcclxuICAgICAgICAvLyAgICAgLy9pZiAodGhpcy5pc05ld0dhbWUpIHtcclxuICAgICAgICAvLyAgICAgdGhpcy5jdXJyZW50QWN0aW9uID0gdGhpcy5hY3Rpb25zWzBdO1xyXG4gICAgICAgIC8vICAgICBpZiAodGhpcy5jdXJyZW50QWN0aW9uLnR5cGUgPT0gJycpXHJcbiAgICAgICAgLy8gICAgICAgICBjYih0aGlzLmFjdGlvbnNbMF0pO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmlzTmV3R2FtZSA9IGZhbHNlO1xyXG4gICAgICAgIC8vICAgICAvL31cclxuXHJcbiAgICAgICAgLy8gICAgIHJldHVybjtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvbnNbaV0udHlwZSA9PSB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSB0aGlzLmFjdGlvbnNbaV07XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gY2IodGhpcy5jdXJyZW50QWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09IFwiYm9vbGVhblwiICYmICFyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlnbm9yZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaWdub3JlKCkge1xyXG4gICAgICAgIGdsb2JhbHMuaWdub3JlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0R2FtZShnYW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSB0aGlzLm5leHRHYW1lLnBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBnYW1lLnBsYXllcnNbaWRdID0gcGxheWVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm5leHRHYW1lID0gZ2FtZTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJtaXQoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMua2lja2VkUGxheWVycy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLmtpY2sgPSB0aGlzLmtpY2tlZFBsYXllcnM7XHJcblxyXG4gICAgICAgIGdsb2JhbHMuZmluaXNoKHRoaXMubmV4dEdhbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdhbWVvdmVyKHBheWxvYWQpIHtcclxuICAgICAgICB0aGlzLmV2ZW50KCdnYW1lb3ZlcicsIHBheWxvYWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGxvZyhtc2cpIHtcclxuICAgICAgICBnbG9iYWxzLmxvZyhtc2cpO1xyXG4gICAgfVxyXG4gICAgZXJyb3IobXNnKSB7XHJcbiAgICAgICAgZ2xvYmFscy5lcnJvcihtc2cpO1xyXG4gICAgfVxyXG5cclxuICAgIGtpY2tQbGF5ZXIoaWQpIHtcclxuICAgICAgICB0aGlzLmtpY2tlZFBsYXllcnMucHVzaChpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGF0YWJhc2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIGdsb2JhbHMuZGF0YWJhc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEFjdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0ZShrZXksIHZhbHVlKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuc3RhdGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnN0YXRlW2tleV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGVba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHBsYXllckxpc3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucGxheWVycyk7XHJcbiAgICB9XHJcbiAgICBwbGF5ZXJDb3VudCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5wbGF5ZXJzKS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheWVycyh1c2VyaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB1c2VyaWQgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW3VzZXJpZF07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucGxheWVyc1t1c2VyaWRdID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcnVsZXMocnVsZSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHJ1bGUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ydWxlcztcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcmV2KG9iaikge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnByZXYgPSBvYmo7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnByZXY7XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dChvYmopIHtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5uZXh0ID0gb2JqO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5uZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRpbWVsaW1pdChzZWNvbmRzKSB7XHJcbiAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgfHwgdGhpcy5kZWZhdWx0U2Vjb25kcztcclxuICAgICAgICBpZiAoIXRoaXMubmV4dEdhbWUudGltZXIpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUudGltZXIgPSB7fTtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyLnNldCA9IHNlY29uZHM7Ly8gTWF0aC5taW4oNjAsIE1hdGgubWF4KDEwLCBzZWNvbmRzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVhY2hlZFRpbWVsaW1pdChhY3Rpb24pIHtcclxuICAgICAgICBpZiAodHlwZW9mIGFjdGlvbi50aW1lbGVmdCA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiBhY3Rpb24udGltZWxlZnQgPD0gMDtcclxuICAgIH1cclxuXHJcbiAgICBldmVudChuYW1lLCBwYXlsb2FkKSB7XHJcbiAgICAgICAgaWYgKCFwYXlsb2FkKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ldmVudHNbbmFtZV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzW25hbWVdID0gcGF5bG9hZCB8fCB7fTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhckV2ZW50cygpIHtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cyA9IHt9O1xyXG4gICAgfVxyXG4gICAgLy8gZXZlbnRzKG5hbWUpIHtcclxuICAgIC8vICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ldmVudHM7XHJcbiAgICAvLyAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMucHVzaChuYW1lKTtcclxuICAgIC8vIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IEFDT1NHKCk7IiwiaW1wb3J0IGN1cCBmcm9tICcuL2Fjb3NnJztcclxuXHJcbmxldCBxdWVzdGlvbnMgPSBjdXAuZGF0YWJhc2UoKTtcclxuXHJcbmxldCBkZWZhdWx0R2FtZSA9IHtcclxuICAgIHN0YXRlOiB7XHJcbiAgICAgICAgcWlkOiAwLFxyXG4gICAgICAgIGhpc3Rvcnk6IFtdLFxyXG4gICAgICAgIGNhdGVnb3J5OiAnJyxcclxuICAgICAgICBxdWVzdGlvbjogJycsXHJcbiAgICAgICAgY2hvaWNlczogW10sXHJcbiAgICAgICAgcm91bmQ6IDBcclxuICAgIH0sXHJcbiAgICBwbGF5ZXJzOiB7fSxcclxuICAgIHJ1bGVzOiB7XHJcbiAgICAgICAgcm91bmRzOiAyLFxyXG4gICAgICAgIG1heHBsYXllcnM6IDJcclxuICAgIH0sXHJcbiAgICBuZXh0OiB7fSxcclxuICAgIGV2ZW50czogW11cclxufVxyXG5cclxuXHJcblxyXG5jbGFzcyBQb3BUcml2aWEge1xyXG5cclxuICAgIG9uTmV3R2FtZShhY3Rpb24pIHtcclxuICAgICAgICBjdXAuc2V0R2FtZShkZWZhdWx0R2FtZSk7XHJcbiAgICAgICAgLy8gdGhpcy5jaGVja1N0YXJ0R2FtZSgpO1xyXG5cclxuICAgICAgICBsZXQgcGxheWVycyA9IGN1cC5wbGF5ZXJzKCk7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycylcclxuICAgICAgICAgICAgcGxheWVyc1tpZF0ucG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0Um91bmQoKTtcclxuICAgIH1cclxuXHJcbiAgICBvblNraXAoYWN0aW9uKSB7XHJcbiAgICAgICAgLy9pZiAoY3VwLnJlYWNoZWRUaW1lbGltaXQoYWN0aW9uKSlcclxuICAgICAgICB0aGlzLm5leHRSb3VuZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uSm9pbihhY3Rpb24pIHtcclxuICAgICAgICBpZiAoIWFjdGlvbi51c2VyLmlkKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCB1c2VyID0gY3VwLnBsYXllcnMoYWN0aW9uLnVzZXIuaWQpO1xyXG4gICAgICAgIGlmICghdXNlcilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvL25ldyBwbGF5ZXIgZGVmYXVsdHNcclxuICAgICAgICB1c2VyLnBvaW50cyA9IDA7XHJcblxyXG4gICAgICAgIC8vIHRoaXMuY2hlY2tTdGFydEdhbWUoKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIG9uTGVhdmUoYWN0aW9uKSB7XHJcbiAgICAgICAgbGV0IGlkID0gYWN0aW9uLnVzZXIuaWQ7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBjdXAucGxheWVycygpO1xyXG4gICAgICAgIGlmIChwbGF5ZXJzW2lkXSkge1xyXG4gICAgICAgICAgICBkZWxldGUgcGxheWVyc1tpZF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uUGljayhhY3Rpb24pIHtcclxuXHJcbiAgICAgICAgLy8gaWYgKGN1cC5yZWFjaGVkVGltZWxpbWl0KGFjdGlvbikpIHtcclxuICAgICAgICAvLyAgICAgdGhpcy5uZXh0Um91bmQoKTtcclxuICAgICAgICAvLyAgICAgY3VwLmxvZyhcIlBpY2sgcGFzc2VkIHRpbWVsaW1pdCwgZ2V0dGluZyBuZXcgcm91bmRcIik7XHJcbiAgICAgICAgLy8gICAgIHJldHVybjtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGN1cC5zdGF0ZSgpO1xyXG4gICAgICAgIGxldCB1c2VyID0gY3VwLnBsYXllcnMoYWN0aW9uLnVzZXIuaWQpO1xyXG5cclxuICAgICAgICAvL2dldCB0aGUgcGlja2VkIGNlbGxcclxuICAgICAgICBsZXQgY2hvaWNlID0gYWN0aW9uLnBheWxvYWQuY2hvaWNlO1xyXG5cclxuICAgICAgICBpZiAoY2hvaWNlIDwgMCB8fCBjaG9pY2UgPiBzdGF0ZS5jaG9pY2VzLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB1c2VyLl9jaG9pY2UgPSBjaG9pY2U7XHJcblxyXG4gICAgICAgIGN1cC5ldmVudCgncGlja2VkJyk7XHJcbiAgICAgICAgc3RhdGUucGlja2VkID0gdXNlci5pZDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgY2hlY2tTdGFydEdhbWUoKSB7XHJcbiAgICAgICAgLy9pZiBwbGF5ZXIgY291bnQgcmVhY2hlZCByZXF1aXJlZCBsaW1pdCwgc3RhcnQgdGhlIGdhbWVcclxuICAgICAgICBsZXQgbWF4UGxheWVycyA9IGN1cC5ydWxlcygnbWF4UGxheWVycycpIHx8IDI7XHJcbiAgICAgICAgbGV0IHBsYXllckNvdW50ID0gY3VwLnBsYXllckNvdW50KCk7XHJcbiAgICAgICAgaWYgKHBsYXllckNvdW50ID49IG1heFBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllcnMgPSBjdXAucGxheWVycygpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKVxyXG4gICAgICAgICAgICAgICAgcGxheWVyc1tpZF0ucG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG5leHRSb3VuZCgpIHtcclxuICAgICAgICB0aGlzLnByb2Nlc3NDb3JyZWN0QW5zd2VycygpO1xyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBjdXAuc3RhdGUoKTtcclxuICAgICAgICBzdGF0ZS5yb3VuZCA9IHN0YXRlLnJvdW5kICsgMTtcclxuICAgICAgICBjdXAubmV4dCh7XHJcbiAgICAgICAgICAgIGlkOiAnKicsXHJcbiAgICAgICAgfSlcclxuICAgICAgICBjdXAuc2V0VGltZWxpbWl0KDUpO1xyXG5cclxuICAgICAgICB0aGlzLnJlc2V0UGxheWVyQ2hvaWNlcygpO1xyXG5cclxuICAgICAgICBsZXQgcnVsZXMgPSBjdXAucnVsZXMoKTtcclxuICAgICAgICBpZiAoc3RhdGUucm91bmQgPiBydWxlcy5yb3VuZHMpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzV2lubmVycygpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnByb2Nlc3NOZXh0UXVlc3Rpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICByZXNldFBsYXllckNob2ljZXMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBjdXAucGxheWVycygpO1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IHBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBwbGF5ZXIuY2hvaWNlcyA9IHBsYXllci5jaG9pY2VzIHx8IFtdO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsYXllci5fY2hvaWNlICE9PSAndW5kZWZpbmVkJyAmJiBwbGF5ZXIuX2Nob2ljZSAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgcGxheWVyLmNob2ljZXMucHVzaChwbGF5ZXIuX2Nob2ljZSk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXIuX2Nob2ljZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc05leHRRdWVzdGlvbigpIHtcclxuICAgICAgICBsZXQgc3RhdGUgPSBjdXAuc3RhdGUoKTtcclxuXHJcbiAgICAgICAgLy9maW5kIGEgcmFuZG9tIHF1ZXN0aW9uIG5vdCBhc2tlZCBiZWZvcmVcclxuICAgICAgICBsZXQgcWlkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcXVlc3Rpb25zLmxlbmd0aCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLmhpc3RvcnkuaW5jbHVkZXMocWlkKSkge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NOZXh0UXVlc3Rpb24oKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zZXR1cCBuZXh0IHF1ZXN0aW9uXHJcbiAgICAgICAgbGV0IHF1ZXN0aW9uID0gcXVlc3Rpb25zW3FpZF07XHJcbiAgICAgICAgc3RhdGUucWlkID0gcWlkO1xyXG4gICAgICAgIHN0YXRlLnF1ZXN0aW9uID0gcXVlc3Rpb24ucTtcclxuICAgICAgICBzdGF0ZS5jYXRlZ29yeSA9IHF1ZXN0aW9uLmM7XHJcbiAgICAgICAgaWYgKHF1ZXN0aW9uLnQgPT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgICAgIC8vYWx3YXlzIFRydWUgdGhlbiBGYWxzZSBpbiB0aGUgY2hvaWNlc1xyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzID0gWydUcnVlJywgJ0ZhbHNlJ11cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vc29ydCB0aGUgY2hvaWNlcyBhbHBoYWJldGljYWxseVxyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzID0gW107XHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMucHVzaChxdWVzdGlvbi5hKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWVzdGlvbi5pLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5jaG9pY2VzLnB1c2gocXVlc3Rpb24uaVtpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcy5zb3J0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vc2F2ZSB0aGlzIHF1ZXN0aW9uIGluIGhpc3RvcnkgdG8gYXZvaWQgY2hvb3NpbmcgYWdhaW5cclxuICAgICAgICBzdGF0ZS5oaXN0b3J5LnB1c2gocWlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzV2lubmVycygpIHtcclxuICAgICAgICBsZXQgcGxheWVyTGlzdCA9IFtdO1xyXG4gICAgICAgIGxldCBwbGF5ZXJJZHMgPSBbXTtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGN1cC5wbGF5ZXJzKCk7XHJcblxyXG4gICAgICAgIC8vYWRkIHBsYXllciBpZCBpbnRvIHRoZSBwbGF5ZXIgZGF0YVxyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgcGxheWVyc1tpZF0uaWQgPSBpZDtcclxuICAgICAgICAgICAgcGxheWVyTGlzdC5wdXNoKHBsYXllcnNbaWRdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc29ydCBhbGwgcGxheWVycyBieSB0aGVpciBwb2ludHNcclxuICAgICAgICBwbGF5ZXJMaXN0LnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgYS5wb2ludHMgLSBiLnBvaW50cztcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICAvL2dldCB0aGUgdG9wIDEwXHJcbiAgICAgICAgbGV0IHdpbm5lcnMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE1hdGgubWluKHBsYXllckxpc3QubGVuZ3RoLCAxMCk7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyTGlzdFtpXTtcclxuICAgICAgICAgICAgd2lubmVycy5wdXNoKHBsYXllci5pZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3JlbW92ZSBpZCwgc28gd2UgZG9uJ3Qgc2VuZCBvdmVyIG5ldHdvcmtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXJzW2lkXVsnaWQnXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGN1cC5zdGF0ZSgpO1xyXG4gICAgICAgIHN0YXRlLndpbm5lcnMgPSB3aW5uZXJzO1xyXG4gICAgICAgIGN1cC5ldmVudHMoJ3dpbm5lcicpO1xyXG5cclxuICAgICAgICBjdXAua2lsbEdhbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzQ29ycmVjdEFuc3dlcnMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBjdXAucGxheWVycygpO1xyXG4gICAgICAgIGxldCBzdGF0ZSA9IGN1cC5zdGF0ZSgpO1xyXG4gICAgICAgIGlmIChzdGF0ZS5yb3VuZCA8PSAwKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vYXdhcmQgcG9pbnRzIGZvciBjb3JyZWN0IGNob2ljZXMsIHJlbW92ZSBwb2ludHMgZm9yIHdyb25nIGNob2ljZXNcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbGF5ZXIuX2Nob2ljZSA9PSAndW5kZWZpbmVkJyB8fCBwbGF5ZXIuX2Nob2ljZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICBsZXQgYW5zd2VyID0gcXVlc3Rpb25zW3N0YXRlLnFpZF0uYTtcclxuICAgICAgICAgICAgbGV0IHVzZXJDaG9pY2UgPSBzdGF0ZS5jaG9pY2VzW3BsYXllci5fY2hvaWNlXTtcclxuICAgICAgICAgICAgaWYgKGFuc3dlciA9PSB1c2VyQ2hvaWNlKSB7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIucG9pbnRzICs9IDEwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnBvaW50cyAtPSAyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBQb3BUcml2aWEoKTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsImltcG9ydCBjdXAgZnJvbSAnLi9hY29zZyc7XHJcbmltcG9ydCBQb3BUcml2aWEgZnJvbSAnLi9nYW1lJztcclxuXHJcblxyXG5cclxuY3VwLm9uKCduZXdnYW1lJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uTmV3R2FtZShhY3Rpb24pKTtcclxuY3VwLm9uKCdza2lwJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uU2tpcChhY3Rpb24pKTtcclxuY3VwLm9uKCdqb2luJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uSm9pbihhY3Rpb24pKTtcclxuY3VwLm9uKCdsZWF2ZScsIChhY3Rpb24pID0+IFBvcFRyaXZpYS5vbkxlYXZlKGFjdGlvbikpO1xyXG5jdXAub24oJ3BpY2snLCAoYWN0aW9uKSA9PiBQb3BUcml2aWEub25QaWNrKGFjdGlvbikpO1xyXG5cclxuY3VwLnN1Ym1pdCgpOyJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==