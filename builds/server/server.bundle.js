/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./game-server/fsg.js":
/*!****************************!*\
  !*** ./game-server/fsg.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });

class FSG {
    constructor() { 
        try {
            this.actions = JSON.parse(JSON.stringify(globals.action()));
        }
        catch(e) {this.error('Failed to load actions'); return}
        try {
            this.originalGame = JSON.parse(JSON.stringify(globals.game()));
        }
        catch(e) {this.error('Failed to load originalGame'); return}
        try {
            this.nextGame = JSON.parse(JSON.stringify(globals.game()));
        }
        catch(e) {this.error('Failed to load nextGame'); return}
        
        
       
        this.isNewGame = false;
        this.markedForDelete = false;
        this.defaultSeconds = 15;
        // this.nextTimeLimit = -1;
        this.kickedPlayers = [];

        if (!this.nextGame || Object.keys(this.nextGame.rules).length == 0) {
            this.isNewGame = true;
            this.error('Missing Rules');
        }

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

            //if (!('events' in this.nextGame)) {
            this.nextGame.events = [];
            //}
        }



    }

    on(type, cb) {
        if( this.actions.length == 1 ) {
            if (this.actions[0].type != type) {
                if (type == 'newgame' && this.isNewGame) {
                    cb(this.actions[0]);

                    // this.nextGame = Object.assign({}, defaultGame, { players: this.nextGame.players })
                }
                return;
            }
        }

        for( var i=0; i<this.actions.length; i++) {
            cb(this.actions[i]);
        }
        
    }

    setGame(game) {
        for (var id in this.nextGame.players) {
            let player = this.nextGame.players[id];
            game.players[id] = { name: player.name }
        }
        //game.players = Object.assign({}, game.players, this.nextGame.players)
        this.nextGame = game;
    }

    submit() {
        // if (this.nextGame.timer && this.nextTimeLimit > -1) {
        //     this.nextGame.timer.timelimit = this.nextTimeLimit;
        //     // if (this.markedForDelete)
        //     //     delete this.nextGame.next['timelimit'];
        // }

        //if next info has been updated, we force a new timer
        // let prevNextUser = JSON.stringify(this.originalGame.next);
        // let curNextUser = JSON.stringify(this.nextGame.next);
        // if (prevNextUser != curNextUser && typeof this.nextGame.timer.set == 'undefined') {
        //     this.setTimelimit()
        // }

        if (this.kickedPlayers.length > 0)
            this.nextGame.kick = this.kickedPlayers;

        globals.finish(this.nextGame);
    }

    killGame() {
        this.markedForDelete = true;
        globals.killGame();
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

    // action() {
    //     return this.msg;
    // }

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
        this.nextGame.timer.set = Math.min(60, Math.max(10, seconds));
    }

    reachedTimelimit(action) {
        if (typeof action.timeleft == 'undefined')
            return false;
        return action.timeleft <= 0;
    }

    event(name) {
        this.nextGame.events.push(name);
    }

    clearEvents() {
        this.nextGame.events = [];
    }
    events(name) {
        if (typeof name === 'undefined')
            return this.nextGame.events;
        this.nextGame.events.push(name);
    }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (new FSG());

/***/ }),

/***/ "./game-server/game.js":
/*!*****************************!*\
  !*** ./game-server/game.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _fsg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./fsg */ "./game-server/fsg.js");


let questions = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.database();

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
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.setGame(defaultGame);
        this.checkStartGame();
    }

    onSkip(action) {
        //if (fsg.reachedTimelimit(action))
            this.nextRound();
    }

    checkStartGame() {
        //if player count reached required limit, start the game
        let maxPlayers = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.rules('maxPlayers') || 2;
        let playerCount = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.playerCount();
        if (playerCount >= maxPlayers) {
            let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
            for (var id in players)
                players[id].points = 0;

            this.nextRound();
        }
    }

    nextRound() {
        this.processCorrectAnswers();

        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();
        state.round = state.round + 1;
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.next({
            id: '*',
        })
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.setTimelimit(20);

        this.resetPlayerChoices();

        let rules = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.rules();
        if (state.round > rules.rounds) {
            this.processWinners();
            return;
        }

        this.processNextQuestion();
    }

    resetPlayerChoices() {
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
        for (var id in players) {
            let player = players[id];
            player.choice = null;
        }
    }

    processNextQuestion() {
        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();

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
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();

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

        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();
        state.winners = winners;
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.events('winner');

        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.killGame();
    }

    processCorrectAnswers() {
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();
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

    onJoin(action) {
        if (!action.user.id)
            return;

        let user = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players(action.user.id);
        if (!user)
            return;

        //new player defaults
        user.points = 0;

        this.checkStartGame();
    }



    onLeave(action) {
        let id = action.user.id;
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
        if (players[id]) {
            delete players[id];
        }
    }

    onPick(action) {

        // if (fsg.reachedTimelimit(action)) {
        //     this.nextRound();
        //     fsg.log("Pick passed timelimit, getting new round");
        //     return;
        // }

        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();
        let user = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players(action.user.id);

        //get the picked cell
        let choice = action.payload.choice;

        if (choice < 0 || choice > state.choices.length)
            return;

        user.choice = choice;

        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.event('picked');
        state.picked = user.id;
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
/* harmony import */ var _fsg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./fsg */ "./game-server/fsg.js");
/* harmony import */ var _game__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./game */ "./game-server/game.js");





_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('newgame', (action) => _game__WEBPACK_IMPORTED_MODULE_1__.default.onNewGame(action));
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('skip', (action) => _game__WEBPACK_IMPORTED_MODULE_1__.default.onSkip(action));
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('join', (action) => _game__WEBPACK_IMPORTED_MODULE_1__.default.onJoin(action));
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('leave', (action) => _game__WEBPACK_IMPORTED_MODULE_1__.default.onLeave(action));
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('pick', (action) => _game__WEBPACK_IMPORTED_MODULE_1__.default.onPick(action));

_fsg__WEBPACK_IMPORTED_MODULE_0__.default.submit();
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4vZ2FtZS1zZXJ2ZXIvZnNnLmpzIiwiLi4vLi4vLi9nYW1lLXNlcnZlci9nYW1lLmpzIiwiLi4vLi4vd2VicGFjay9ib290c3RyYXAiLCIuLi8uLi93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCIuLi8uLi93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwiLi4vLi4vLi9nYW1lLXNlcnZlci9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBO0FBQ0EsbUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IscUNBQXFDO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQiwwQ0FBMEM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLHNDQUFzQzs7OztBQUl4RDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsdURBQXVELGdCQUFnQixpQ0FBaUM7QUFDeEc7QUFDQTtBQUNBO0FBQ0E7O0FBRUEscUJBQXFCLHVCQUF1QjtBQUM1QztBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBLHlDQUF5QztBQUN6QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFD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Q0Esd0NBQXdDLHlDQUF5QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7Ozs7Ozs7O0FDQXdCO0FBQ087Ozs7QUFJL0IsNENBQU0sd0JBQXdCLG9EQUFtQjtBQUNqRCw0Q0FBTSxxQkFBcUIsaURBQWdCO0FBQzNDLDRDQUFNLHFCQUFxQixpREFBZ0I7QUFDM0MsNENBQU0sc0JBQXNCLGtEQUFpQjtBQUM3Qyw0Q0FBTSxxQkFBcUIsaURBQWdCOztBQUUzQyxnREFBVSxHIiwiZmlsZSI6InNlcnZlci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuY2xhc3MgRlNHIHtcclxuICAgIGNvbnN0cnVjdG9yKCkgeyBcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGdsb2JhbHMuYWN0aW9uKCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2goZSkge3RoaXMuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIGFjdGlvbnMnKTsgcmV0dXJufVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxHYW1lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmdhbWUoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaChlKSB7dGhpcy5lcnJvcignRmFpbGVkIHRvIGxvYWQgb3JpZ2luYWxHYW1lJyk7IHJldHVybn1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmdhbWUoKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaChlKSB7dGhpcy5lcnJvcignRmFpbGVkIHRvIGxvYWQgbmV4dEdhbWUnKTsgcmV0dXJufVxyXG4gICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgXHJcbiAgICAgICAgdGhpcy5pc05ld0dhbWUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLm1hcmtlZEZvckRlbGV0ZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFNlY29uZHMgPSAxNTtcclxuICAgICAgICAvLyB0aGlzLm5leHRUaW1lTGltaXQgPSAtMTtcclxuICAgICAgICB0aGlzLmtpY2tlZFBsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLm5leHRHYW1lIHx8IE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucnVsZXMpLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaXNOZXdHYW1lID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5lcnJvcignTWlzc2luZyBSdWxlcycpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMubmV4dEdhbWUpIHtcclxuICAgICAgICAgICAgaWYgKCEoJ3RpbWVyJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS50aW1lciA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghKCdzdGF0ZScgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGUgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ3BsYXllcnMnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnBsYXllcnMgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9pZiAoISgncHJldicgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5wcmV2ID0ge307XHJcbiAgICAgICAgICAgIC8vfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ25leHQnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLm5leHQgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCEoJ3J1bGVzJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5ydWxlcyA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICghKCdldmVudHMnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzID0gW107XHJcbiAgICAgICAgICAgIC8vfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBvbih0eXBlLCBjYikge1xyXG4gICAgICAgIGlmKCB0aGlzLmFjdGlvbnMubGVuZ3RoID09IDEgKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvbnNbMF0udHlwZSAhPSB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PSAnbmV3Z2FtZScgJiYgdGhpcy5pc05ld0dhbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYih0aGlzLmFjdGlvbnNbMF0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLm5leHRHYW1lID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdEdhbWUsIHsgcGxheWVyczogdGhpcy5uZXh0R2FtZS5wbGF5ZXJzIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciggdmFyIGk9MDsgaTx0aGlzLmFjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY2IodGhpcy5hY3Rpb25zW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgc2V0R2FtZShnYW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSB0aGlzLm5leHRHYW1lLnBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBnYW1lLnBsYXllcnNbaWRdID0geyBuYW1lOiBwbGF5ZXIubmFtZSB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vZ2FtZS5wbGF5ZXJzID0gT2JqZWN0LmFzc2lnbih7fSwgZ2FtZS5wbGF5ZXJzLCB0aGlzLm5leHRHYW1lLnBsYXllcnMpXHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZSA9IGdhbWU7XHJcbiAgICB9XHJcblxyXG4gICAgc3VibWl0KCkge1xyXG4gICAgICAgIC8vIGlmICh0aGlzLm5leHRHYW1lLnRpbWVyICYmIHRoaXMubmV4dFRpbWVMaW1pdCA+IC0xKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMubmV4dEdhbWUudGltZXIudGltZWxpbWl0ID0gdGhpcy5uZXh0VGltZUxpbWl0O1xyXG4gICAgICAgIC8vICAgICAvLyBpZiAodGhpcy5tYXJrZWRGb3JEZWxldGUpXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBkZWxldGUgdGhpcy5uZXh0R2FtZS5uZXh0Wyd0aW1lbGltaXQnXTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIC8vaWYgbmV4dCBpbmZvIGhhcyBiZWVuIHVwZGF0ZWQsIHdlIGZvcmNlIGEgbmV3IHRpbWVyXHJcbiAgICAgICAgLy8gbGV0IHByZXZOZXh0VXNlciA9IEpTT04uc3RyaW5naWZ5KHRoaXMub3JpZ2luYWxHYW1lLm5leHQpO1xyXG4gICAgICAgIC8vIGxldCBjdXJOZXh0VXNlciA9IEpTT04uc3RyaW5naWZ5KHRoaXMubmV4dEdhbWUubmV4dCk7XHJcbiAgICAgICAgLy8gaWYgKHByZXZOZXh0VXNlciAhPSBjdXJOZXh0VXNlciAmJiB0eXBlb2YgdGhpcy5uZXh0R2FtZS50aW1lci5zZXQgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAvLyAgICAgdGhpcy5zZXRUaW1lbGltaXQoKVxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMua2lja2VkUGxheWVycy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLmtpY2sgPSB0aGlzLmtpY2tlZFBsYXllcnM7XHJcblxyXG4gICAgICAgIGdsb2JhbHMuZmluaXNoKHRoaXMubmV4dEdhbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGtpbGxHYW1lKCkge1xyXG4gICAgICAgIHRoaXMubWFya2VkRm9yRGVsZXRlID0gdHJ1ZTtcclxuICAgICAgICBnbG9iYWxzLmtpbGxHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgbG9nKG1zZykge1xyXG4gICAgICAgIGdsb2JhbHMubG9nKG1zZyk7XHJcbiAgICB9XHJcbiAgICBlcnJvcihtc2cpIHtcclxuICAgICAgICBnbG9iYWxzLmVycm9yKG1zZyk7XHJcbiAgICB9XHJcblxyXG4gICAga2lja1BsYXllcihpZCkge1xyXG4gICAgICAgIHRoaXMua2lja2VkUGxheWVycy5wdXNoKGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBkYXRhYmFzZSgpIHtcclxuICAgICAgICByZXR1cm4gZ2xvYmFscy5kYXRhYmFzZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGFjdGlvbigpIHtcclxuICAgIC8vICAgICByZXR1cm4gdGhpcy5tc2c7XHJcbiAgICAvLyB9XHJcblxyXG4gICAgc3RhdGUoa2V5LCB2YWx1ZSkge1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnN0YXRlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5zdGF0ZVtrZXldO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRHYW1lLnN0YXRlW2tleV0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwbGF5ZXJMaXN0KCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLm5leHRHYW1lLnBsYXllcnMpO1xyXG4gICAgfVxyXG4gICAgcGxheWVyQ291bnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucGxheWVycykubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHBsYXllcnModXNlcmlkLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdXNlcmlkID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucGxheWVycztcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucGxheWVyc1t1c2VyaWRdO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRHYW1lLnBsYXllcnNbdXNlcmlkXSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJ1bGVzKHJ1bGUsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBydWxlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucnVsZXM7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnJ1bGVzW3J1bGVdO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRHYW1lLnJ1bGVzW3J1bGVdID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcHJldihvYmopIHtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5wcmV2ID0gb2JqO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wcmV2O1xyXG4gICAgfVxyXG5cclxuICAgIG5leHQob2JqKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUubmV4dCA9IG9iajtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUubmV4dDtcclxuICAgIH1cclxuXHJcbiAgICBzZXRUaW1lbGltaXQoc2Vjb25kcykge1xyXG4gICAgICAgIHNlY29uZHMgPSBzZWNvbmRzIHx8IHRoaXMuZGVmYXVsdFNlY29uZHM7XHJcbiAgICAgICAgaWYgKCF0aGlzLm5leHRHYW1lLnRpbWVyKVxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyID0ge307XHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS50aW1lci5zZXQgPSBNYXRoLm1pbig2MCwgTWF0aC5tYXgoMTAsIHNlY29uZHMpKTtcclxuICAgIH1cclxuXHJcbiAgICByZWFjaGVkVGltZWxpbWl0KGFjdGlvbikge1xyXG4gICAgICAgIGlmICh0eXBlb2YgYWN0aW9uLnRpbWVsZWZ0ID09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuIGFjdGlvbi50aW1lbGVmdCA8PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIGV2ZW50KG5hbWUpIHtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cy5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyRXZlbnRzKCkge1xyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzID0gW107XHJcbiAgICB9XHJcbiAgICBldmVudHMobmFtZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLmV2ZW50cztcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cy5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuZXcgRlNHKCk7IiwiaW1wb3J0IGZzZyBmcm9tICcuL2ZzZyc7XHJcblxyXG5sZXQgcXVlc3Rpb25zID0gZnNnLmRhdGFiYXNlKCk7XHJcblxyXG5sZXQgZGVmYXVsdEdhbWUgPSB7XHJcbiAgICBzdGF0ZToge1xyXG4gICAgICAgIHFpZDogMCxcclxuICAgICAgICBoaXN0b3J5OiBbXSxcclxuICAgICAgICBjYXRlZ29yeTogJycsXHJcbiAgICAgICAgcXVlc3Rpb246ICcnLFxyXG4gICAgICAgIGNob2ljZXM6IFtdLFxyXG4gICAgICAgIHJvdW5kOiAwXHJcbiAgICB9LFxyXG4gICAgcGxheWVyczoge30sXHJcbiAgICBydWxlczoge1xyXG4gICAgICAgIHJvdW5kczogMixcclxuICAgICAgICBtYXhwbGF5ZXJzOiAyXHJcbiAgICB9LFxyXG4gICAgbmV4dDoge30sXHJcbiAgICBldmVudHM6IFtdXHJcbn1cclxuXHJcbmNsYXNzIFBvcFRyaXZpYSB7XHJcblxyXG4gICAgb25OZXdHYW1lKGFjdGlvbikge1xyXG4gICAgICAgIGZzZy5zZXRHYW1lKGRlZmF1bHRHYW1lKTtcclxuICAgICAgICB0aGlzLmNoZWNrU3RhcnRHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25Ta2lwKGFjdGlvbikge1xyXG4gICAgICAgIC8vaWYgKGZzZy5yZWFjaGVkVGltZWxpbWl0KGFjdGlvbikpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tTdGFydEdhbWUoKSB7XHJcbiAgICAgICAgLy9pZiBwbGF5ZXIgY291bnQgcmVhY2hlZCByZXF1aXJlZCBsaW1pdCwgc3RhcnQgdGhlIGdhbWVcclxuICAgICAgICBsZXQgbWF4UGxheWVycyA9IGZzZy5ydWxlcygnbWF4UGxheWVycycpIHx8IDI7XHJcbiAgICAgICAgbGV0IHBsYXllckNvdW50ID0gZnNnLnBsYXllckNvdW50KCk7XHJcbiAgICAgICAgaWYgKHBsYXllckNvdW50ID49IG1heFBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKVxyXG4gICAgICAgICAgICAgICAgcGxheWVyc1tpZF0ucG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG5leHRSb3VuZCgpIHtcclxuICAgICAgICB0aGlzLnByb2Nlc3NDb3JyZWN0QW5zd2VycygpO1xyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuICAgICAgICBzdGF0ZS5yb3VuZCA9IHN0YXRlLnJvdW5kICsgMTtcclxuICAgICAgICBmc2cubmV4dCh7XHJcbiAgICAgICAgICAgIGlkOiAnKicsXHJcbiAgICAgICAgfSlcclxuICAgICAgICBmc2cuc2V0VGltZWxpbWl0KDIwKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZXNldFBsYXllckNob2ljZXMoKTtcclxuXHJcbiAgICAgICAgbGV0IHJ1bGVzID0gZnNnLnJ1bGVzKCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLnJvdW5kID4gcnVsZXMucm91bmRzKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1dpbm5lcnMoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wcm9jZXNzTmV4dFF1ZXN0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzZXRQbGF5ZXJDaG9pY2VzKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gZnNnLnBsYXllcnMoKTtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgcGxheWVyLmNob2ljZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NOZXh0UXVlc3Rpb24oKSB7XHJcbiAgICAgICAgbGV0IHN0YXRlID0gZnNnLnN0YXRlKCk7XHJcblxyXG4gICAgICAgIC8vZmluZCBhIHJhbmRvbSBxdWVzdGlvbiBub3QgYXNrZWQgYmVmb3JlXHJcbiAgICAgICAgbGV0IHFpZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHF1ZXN0aW9ucy5sZW5ndGgpO1xyXG4gICAgICAgIGlmIChzdGF0ZS5oaXN0b3J5LmluY2x1ZGVzKHFpZCkpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzTmV4dFF1ZXN0aW9uKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc2V0dXAgbmV4dCBxdWVzdGlvblxyXG4gICAgICAgIGxldCBxdWVzdGlvbiA9IHF1ZXN0aW9uc1txaWRdO1xyXG4gICAgICAgIHN0YXRlLnFpZCA9IHFpZDtcclxuICAgICAgICBzdGF0ZS5xdWVzdGlvbiA9IHF1ZXN0aW9uLnE7XHJcbiAgICAgICAgc3RhdGUuY2F0ZWdvcnkgPSBxdWVzdGlvbi5jO1xyXG4gICAgICAgIGlmIChxdWVzdGlvbi50ID09ICdib29sZWFuJykge1xyXG4gICAgICAgICAgICAvL2Fsd2F5cyBUcnVlIHRoZW4gRmFsc2UgaW4gdGhlIGNob2ljZXNcclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcyA9IFsnVHJ1ZScsICdGYWxzZSddXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvL3NvcnQgdGhlIGNob2ljZXMgYWxwaGFiZXRpY2FsbHlcclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcyA9IFtdO1xyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzLnB1c2gocXVlc3Rpb24uYSk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcXVlc3Rpb24uaS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgc3RhdGUuY2hvaWNlcy5wdXNoKHF1ZXN0aW9uLmlbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMuc29ydCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL3NhdmUgdGhpcyBxdWVzdGlvbiBpbiBoaXN0b3J5IHRvIGF2b2lkIGNob29zaW5nIGFnYWluXHJcbiAgICAgICAgc3RhdGUuaGlzdG9yeS5wdXNoKHFpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc1dpbm5lcnMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllckxpc3QgPSBbXTtcclxuICAgICAgICBsZXQgcGxheWVySWRzID0gW107XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG5cclxuICAgICAgICAvL2FkZCBwbGF5ZXIgaWQgaW50byB0aGUgcGxheWVyIGRhdGFcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIHBsYXllcnNbaWRdLmlkID0gaWQ7XHJcbiAgICAgICAgICAgIHBsYXllckxpc3QucHVzaChwbGF5ZXJzW2lkXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NvcnQgYWxsIHBsYXllcnMgYnkgdGhlaXIgcG9pbnRzXHJcbiAgICAgICAgcGxheWVyTGlzdC5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgIGIucG9pbnRzIC0gYS5wb2ludHM7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgLy9nZXQgdGhlIHRvcCAxMFxyXG4gICAgICAgIGxldCB3aW5uZXJzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBNYXRoLm1pbihwbGF5ZXJMaXN0Lmxlbmd0aCwgMTApOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IHBsYXllckxpc3RbaV07XHJcbiAgICAgICAgICAgIHdpbm5lcnMucHVzaChwbGF5ZXIuaWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9yZW1vdmUgaWQsIHNvIHdlIGRvbid0IHNlbmQgb3ZlciBuZXR3b3JrXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBkZWxldGUgcGxheWVyc1tpZF1bJ2lkJ107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuICAgICAgICBzdGF0ZS53aW5uZXJzID0gd2lubmVycztcclxuICAgICAgICBmc2cuZXZlbnRzKCd3aW5uZXInKTtcclxuXHJcbiAgICAgICAgZnNnLmtpbGxHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc0NvcnJlY3RBbnN3ZXJzKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gZnNnLnBsYXllcnMoKTtcclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuICAgICAgICBpZiAoc3RhdGUucm91bmQgPD0gMClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvL2F3YXJkIHBvaW50cyBmb3IgY29ycmVjdCBjaG9pY2VzLCByZW1vdmUgcG9pbnRzIGZvciB3cm9uZyBjaG9pY2VzXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyc1tpZF07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGxheWVyLmNob2ljZSA9PSAndW5kZWZpbmVkJyB8fCBwbGF5ZXIuY2hvaWNlID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhbnN3ZXIgPSBxdWVzdGlvbnNbc3RhdGUucWlkXS5hO1xyXG4gICAgICAgICAgICBsZXQgdXNlckNob2ljZSA9IHN0YXRlLmNob2ljZXNbcGxheWVyLmNob2ljZV07XHJcbiAgICAgICAgICAgIGlmIChhbnN3ZXIgPT0gdXNlckNob2ljZSkge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnBvaW50cyArPSAxMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBsYXllci5wb2ludHMgLT0gMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvbkpvaW4oYWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKCFhY3Rpb24udXNlci5pZClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgdXNlciA9IGZzZy5wbGF5ZXJzKGFjdGlvbi51c2VyLmlkKTtcclxuICAgICAgICBpZiAoIXVzZXIpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy9uZXcgcGxheWVyIGRlZmF1bHRzXHJcbiAgICAgICAgdXNlci5wb2ludHMgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLmNoZWNrU3RhcnRHYW1lKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBvbkxlYXZlKGFjdGlvbikge1xyXG4gICAgICAgIGxldCBpZCA9IGFjdGlvbi51c2VyLmlkO1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gZnNnLnBsYXllcnMoKTtcclxuICAgICAgICBpZiAocGxheWVyc1tpZF0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIHBsYXllcnNbaWRdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvblBpY2soYWN0aW9uKSB7XHJcblxyXG4gICAgICAgIC8vIGlmIChmc2cucmVhY2hlZFRpbWVsaW1pdChhY3Rpb24pKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICAgICAgLy8gICAgIGZzZy5sb2coXCJQaWNrIHBhc3NlZCB0aW1lbGltaXQsIGdldHRpbmcgbmV3IHJvdW5kXCIpO1xyXG4gICAgICAgIC8vICAgICByZXR1cm47XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuICAgICAgICBsZXQgdXNlciA9IGZzZy5wbGF5ZXJzKGFjdGlvbi51c2VyLmlkKTtcclxuXHJcbiAgICAgICAgLy9nZXQgdGhlIHBpY2tlZCBjZWxsXHJcbiAgICAgICAgbGV0IGNob2ljZSA9IGFjdGlvbi5wYXlsb2FkLmNob2ljZTtcclxuXHJcbiAgICAgICAgaWYgKGNob2ljZSA8IDAgfHwgY2hvaWNlID4gc3RhdGUuY2hvaWNlcy5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdXNlci5jaG9pY2UgPSBjaG9pY2U7XHJcblxyXG4gICAgICAgIGZzZy5ldmVudCgncGlja2VkJyk7XHJcbiAgICAgICAgc3RhdGUucGlja2VkID0gdXNlci5pZDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBQb3BUcml2aWEoKTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsImltcG9ydCBmc2cgZnJvbSAnLi9mc2cnO1xyXG5pbXBvcnQgUG9wVHJpdmlhIGZyb20gJy4vZ2FtZSc7XHJcblxyXG5cclxuXHJcbmZzZy5vbignbmV3Z2FtZScsIChhY3Rpb24pID0+IFBvcFRyaXZpYS5vbk5ld0dhbWUoYWN0aW9uKSk7XHJcbmZzZy5vbignc2tpcCcsIChhY3Rpb24pID0+IFBvcFRyaXZpYS5vblNraXAoYWN0aW9uKSk7XHJcbmZzZy5vbignam9pbicsIChhY3Rpb24pID0+IFBvcFRyaXZpYS5vbkpvaW4oYWN0aW9uKSk7XHJcbmZzZy5vbignbGVhdmUnLCAoYWN0aW9uKSA9PiBQb3BUcml2aWEub25MZWF2ZShhY3Rpb24pKTtcclxuZnNnLm9uKCdwaWNrJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uUGljayhhY3Rpb24pKTtcclxuXHJcbmZzZy5zdWJtaXQoKTsiXSwic291cmNlUm9vdCI6IiJ9