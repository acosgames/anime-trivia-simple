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

        if (type == 'newgame') {
            if (this.isNewGame) {
                cb(this.actions[0]);
                this.isNewGame = false;
            }

            return;
            //return;
            // this.nextGame = Object.assign({}, defaultGame, { players: this.nextGame.players })
        }

        for (var i = 0; i < this.actions.length; i++) {
            if (this.actions[i].type == type)
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

        user._choice = choice;

        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.event('picked');
        state.picked = user.id;
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
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.setTimelimit(5);

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
            player.choices = player.choices || [];
            if (typeof player._choice !== 'undefined' && player._choice != null)
                player.choices.push(player._choice);
            delete player._choice;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4vZ2FtZS1zZXJ2ZXIvZnNnLmpzIiwiLi4vLi4vLi9nYW1lLXNlcnZlci9nYW1lLmpzIiwiLi4vLi4vd2VicGFjay9ib290c3RyYXAiLCIuLi8uLi93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCIuLi8uLi93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwiLi4vLi4vLi9nYW1lLXNlcnZlci9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsc0NBQXNDO0FBQ3pEO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQiwyQ0FBMkM7QUFDOUQ7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLHVDQUF1Qzs7OztBQUkxRDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLCtDQUErQyxnQkFBZ0IsaUNBQWlDO0FBQ2hHOztBQUVBLHVCQUF1Qix5QkFBeUI7QUFDaEQ7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBLHlDQUF5QztBQUN6QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7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Q3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHdDQUF3Qyx5Q0FBeUM7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEEsd0Y7Ozs7Ozs7Ozs7OztBQ0F3QjtBQUNPOzs7O0FBSS9CLDRDQUFNLHdCQUF3QixvREFBbUI7QUFDakQsNENBQU0scUJBQXFCLGlEQUFnQjtBQUMzQyw0Q0FBTSxxQkFBcUIsaURBQWdCO0FBQzNDLDRDQUFNLHNCQUFzQixrREFBaUI7QUFDN0MsNENBQU0scUJBQXFCLGlEQUFnQjs7QUFFM0MsZ0RBQVUsRyIsImZpbGUiOiJzZXJ2ZXIuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmNsYXNzIEZTRyB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGdsb2JhbHMuYWN0aW9ucygpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7IHRoaXMuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIGFjdGlvbnMnKTsgcmV0dXJuIH1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLm9yaWdpbmFsR2FtZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5nYW1lKCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgdGhpcy5lcnJvcignRmFpbGVkIHRvIGxvYWQgb3JpZ2luYWxHYW1lJyk7IHJldHVybiB9XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5nYW1lKCkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHsgdGhpcy5lcnJvcignRmFpbGVkIHRvIGxvYWQgbmV4dEdhbWUnKTsgcmV0dXJuIH1cclxuXHJcblxyXG5cclxuICAgICAgICB0aGlzLmlzTmV3R2FtZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMubWFya2VkRm9yRGVsZXRlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kZWZhdWx0U2Vjb25kcyA9IDE1O1xyXG4gICAgICAgIC8vIHRoaXMubmV4dFRpbWVMaW1pdCA9IC0xO1xyXG4gICAgICAgIHRoaXMua2lja2VkUGxheWVycyA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMubmV4dEdhbWUgfHwgT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5ydWxlcykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5pc05ld0dhbWUgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmVycm9yKCdNaXNzaW5nIFJ1bGVzJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5uZXh0R2FtZSkge1xyXG4gICAgICAgICAgICBpZiAoISgndGltZXInIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyID0ge307XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCEoJ3N0YXRlJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5zdGF0ZSA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoISgncGxheWVycycgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUucGxheWVycyA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICghKCdwcmV2JyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnByZXYgPSB7fTtcclxuICAgICAgICAgICAgLy99XHJcblxyXG4gICAgICAgICAgICBpZiAoISgnbmV4dCcgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUubmV4dCA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoISgncnVsZXMnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnJ1bGVzID0ge307XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCEoJ2V2ZW50cycgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMgPSBbXTtcclxuICAgICAgICAgICAgLy99XHJcbiAgICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9uKHR5cGUsIGNiKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlID09ICduZXdnYW1lJykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc05ld0dhbWUpIHtcclxuICAgICAgICAgICAgICAgIGNiKHRoaXMuYWN0aW9uc1swXSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzTmV3R2FtZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIC8vcmV0dXJuO1xyXG4gICAgICAgICAgICAvLyB0aGlzLm5leHRHYW1lID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdEdhbWUsIHsgcGxheWVyczogdGhpcy5uZXh0R2FtZS5wbGF5ZXJzIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYWN0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25zW2ldLnR5cGUgPT0gdHlwZSlcclxuICAgICAgICAgICAgICAgIGNiKHRoaXMuYWN0aW9uc1tpXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXRHYW1lKGdhbWUpIHtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLm5leHRHYW1lLnBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IHRoaXMubmV4dEdhbWUucGxheWVyc1tpZF07XHJcbiAgICAgICAgICAgIGdhbWUucGxheWVyc1tpZF0gPSB7IG5hbWU6IHBsYXllci5uYW1lIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy9nYW1lLnBsYXllcnMgPSBPYmplY3QuYXNzaWduKHt9LCBnYW1lLnBsYXllcnMsIHRoaXMubmV4dEdhbWUucGxheWVycylcclxuICAgICAgICB0aGlzLm5leHRHYW1lID0gZ2FtZTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJtaXQoKSB7XHJcbiAgICAgICAgLy8gaWYgKHRoaXMubmV4dEdhbWUudGltZXIgJiYgdGhpcy5uZXh0VGltZUxpbWl0ID4gLTEpIHtcclxuICAgICAgICAvLyAgICAgdGhpcy5uZXh0R2FtZS50aW1lci50aW1lbGltaXQgPSB0aGlzLm5leHRUaW1lTGltaXQ7XHJcbiAgICAgICAgLy8gICAgIC8vIGlmICh0aGlzLm1hcmtlZEZvckRlbGV0ZSlcclxuICAgICAgICAvLyAgICAgLy8gICAgIGRlbGV0ZSB0aGlzLm5leHRHYW1lLm5leHRbJ3RpbWVsaW1pdCddO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgLy9pZiBuZXh0IGluZm8gaGFzIGJlZW4gdXBkYXRlZCwgd2UgZm9yY2UgYSBuZXcgdGltZXJcclxuICAgICAgICAvLyBsZXQgcHJldk5leHRVc2VyID0gSlNPTi5zdHJpbmdpZnkodGhpcy5vcmlnaW5hbEdhbWUubmV4dCk7XHJcbiAgICAgICAgLy8gbGV0IGN1ck5leHRVc2VyID0gSlNPTi5zdHJpbmdpZnkodGhpcy5uZXh0R2FtZS5uZXh0KTtcclxuICAgICAgICAvLyBpZiAocHJldk5leHRVc2VyICE9IGN1ck5leHRVc2VyICYmIHR5cGVvZiB0aGlzLm5leHRHYW1lLnRpbWVyLnNldCA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIC8vICAgICB0aGlzLnNldFRpbWVsaW1pdCgpXHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5raWNrZWRQbGF5ZXJzLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUua2ljayA9IHRoaXMua2lja2VkUGxheWVycztcclxuXHJcbiAgICAgICAgZ2xvYmFscy5maW5pc2godGhpcy5uZXh0R2FtZSk7XHJcbiAgICB9XHJcblxyXG4gICAga2lsbEdhbWUoKSB7XHJcbiAgICAgICAgdGhpcy5tYXJrZWRGb3JEZWxldGUgPSB0cnVlO1xyXG4gICAgICAgIGdsb2JhbHMua2lsbEdhbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBsb2cobXNnKSB7XHJcbiAgICAgICAgZ2xvYmFscy5sb2cobXNnKTtcclxuICAgIH1cclxuICAgIGVycm9yKG1zZykge1xyXG4gICAgICAgIGdsb2JhbHMuZXJyb3IobXNnKTtcclxuICAgIH1cclxuXHJcbiAgICBraWNrUGxheWVyKGlkKSB7XHJcbiAgICAgICAgdGhpcy5raWNrZWRQbGF5ZXJzLnB1c2goaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGRhdGFiYXNlKCkge1xyXG4gICAgICAgIHJldHVybiBnbG9iYWxzLmRhdGFiYXNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWN0aW9uKCkge1xyXG4gICAgLy8gICAgIHJldHVybiB0aGlzLm1zZztcclxuICAgIC8vIH1cclxuXHJcbiAgICBzdGF0ZShrZXksIHZhbHVlKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuc3RhdGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnN0YXRlW2tleV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGVba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHBsYXllckxpc3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucGxheWVycyk7XHJcbiAgICB9XHJcbiAgICBwbGF5ZXJDb3VudCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5wbGF5ZXJzKS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheWVycyh1c2VyaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB1c2VyaWQgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW3VzZXJpZF07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucGxheWVyc1t1c2VyaWRdID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcnVsZXMocnVsZSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHJ1bGUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ydWxlcztcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcmV2KG9iaikge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnByZXYgPSBvYmo7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnByZXY7XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dChvYmopIHtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5uZXh0ID0gb2JqO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5uZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRpbWVsaW1pdChzZWNvbmRzKSB7XHJcbiAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgfHwgdGhpcy5kZWZhdWx0U2Vjb25kcztcclxuICAgICAgICBpZiAoIXRoaXMubmV4dEdhbWUudGltZXIpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUudGltZXIgPSB7fTtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyLnNldCA9IE1hdGgubWluKDYwLCBNYXRoLm1heCgxMCwgc2Vjb25kcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWNoZWRUaW1lbGltaXQoYWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBhY3Rpb24udGltZWxlZnQgPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICByZXR1cm4gYWN0aW9uLnRpbWVsZWZ0IDw9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZXZlbnQobmFtZSkge1xyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJFdmVudHMoKSB7XHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMgPSBbXTtcclxuICAgIH1cclxuICAgIGV2ZW50cyhuYW1lKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuZXZlbnRzO1xyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBGU0coKTsiLCJpbXBvcnQgZnNnIGZyb20gJy4vZnNnJztcclxuXHJcbmxldCBxdWVzdGlvbnMgPSBmc2cuZGF0YWJhc2UoKTtcclxuXHJcbmxldCBkZWZhdWx0R2FtZSA9IHtcclxuICAgIHN0YXRlOiB7XHJcbiAgICAgICAgcWlkOiAwLFxyXG4gICAgICAgIGhpc3Rvcnk6IFtdLFxyXG4gICAgICAgIGNhdGVnb3J5OiAnJyxcclxuICAgICAgICBxdWVzdGlvbjogJycsXHJcbiAgICAgICAgY2hvaWNlczogW10sXHJcbiAgICAgICAgcm91bmQ6IDBcclxuICAgIH0sXHJcbiAgICBwbGF5ZXJzOiB7fSxcclxuICAgIHJ1bGVzOiB7XHJcbiAgICAgICAgcm91bmRzOiAyLFxyXG4gICAgICAgIG1heHBsYXllcnM6IDJcclxuICAgIH0sXHJcbiAgICBuZXh0OiB7fSxcclxuICAgIGV2ZW50czogW11cclxufVxyXG5cclxuXHJcblxyXG5jbGFzcyBQb3BUcml2aWEge1xyXG5cclxuICAgIG9uTmV3R2FtZShhY3Rpb24pIHtcclxuICAgICAgICBmc2cuc2V0R2FtZShkZWZhdWx0R2FtZSk7XHJcbiAgICAgICAgdGhpcy5jaGVja1N0YXJ0R2FtZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2tpcChhY3Rpb24pIHtcclxuICAgICAgICAvL2lmIChmc2cucmVhY2hlZFRpbWVsaW1pdChhY3Rpb24pKVxyXG4gICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25Kb2luKGFjdGlvbikge1xyXG4gICAgICAgIGlmICghYWN0aW9uLnVzZXIuaWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHVzZXIgPSBmc2cucGxheWVycyhhY3Rpb24udXNlci5pZCk7XHJcbiAgICAgICAgaWYgKCF1c2VyKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vbmV3IHBsYXllciBkZWZhdWx0c1xyXG4gICAgICAgIHVzZXIucG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5jaGVja1N0YXJ0R2FtZSgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgb25MZWF2ZShhY3Rpb24pIHtcclxuICAgICAgICBsZXQgaWQgPSBhY3Rpb24udXNlci5pZDtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGZzZy5wbGF5ZXJzKCk7XHJcbiAgICAgICAgaWYgKHBsYXllcnNbaWRdKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25QaWNrKGFjdGlvbikge1xyXG5cclxuICAgICAgICAvLyBpZiAoZnNnLnJlYWNoZWRUaW1lbGltaXQoYWN0aW9uKSkge1xyXG4gICAgICAgIC8vICAgICB0aGlzLm5leHRSb3VuZCgpO1xyXG4gICAgICAgIC8vICAgICBmc2cubG9nKFwiUGljayBwYXNzZWQgdGltZWxpbWl0LCBnZXR0aW5nIG5ldyByb3VuZFwiKTtcclxuICAgICAgICAvLyAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgbGV0IHN0YXRlID0gZnNnLnN0YXRlKCk7XHJcbiAgICAgICAgbGV0IHVzZXIgPSBmc2cucGxheWVycyhhY3Rpb24udXNlci5pZCk7XHJcblxyXG4gICAgICAgIC8vZ2V0IHRoZSBwaWNrZWQgY2VsbFxyXG4gICAgICAgIGxldCBjaG9pY2UgPSBhY3Rpb24ucGF5bG9hZC5jaG9pY2U7XHJcblxyXG4gICAgICAgIGlmIChjaG9pY2UgPCAwIHx8IGNob2ljZSA+IHN0YXRlLmNob2ljZXMubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHVzZXIuX2Nob2ljZSA9IGNob2ljZTtcclxuXHJcbiAgICAgICAgZnNnLmV2ZW50KCdwaWNrZWQnKTtcclxuICAgICAgICBzdGF0ZS5waWNrZWQgPSB1c2VyLmlkO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjaGVja1N0YXJ0R2FtZSgpIHtcclxuICAgICAgICAvL2lmIHBsYXllciBjb3VudCByZWFjaGVkIHJlcXVpcmVkIGxpbWl0LCBzdGFydCB0aGUgZ2FtZVxyXG4gICAgICAgIGxldCBtYXhQbGF5ZXJzID0gZnNnLnJ1bGVzKCdtYXhQbGF5ZXJzJykgfHwgMjtcclxuICAgICAgICBsZXQgcGxheWVyQ291bnQgPSBmc2cucGxheWVyQ291bnQoKTtcclxuICAgICAgICBpZiAocGxheWVyQ291bnQgPj0gbWF4UGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVycyA9IGZzZy5wbGF5ZXJzKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpXHJcbiAgICAgICAgICAgICAgICBwbGF5ZXJzW2lkXS5wb2ludHMgPSAwO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5uZXh0Um91bmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dFJvdW5kKCkge1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc0NvcnJlY3RBbnN3ZXJzKCk7XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG4gICAgICAgIHN0YXRlLnJvdW5kID0gc3RhdGUucm91bmQgKyAxO1xyXG4gICAgICAgIGZzZy5uZXh0KHtcclxuICAgICAgICAgICAgaWQ6ICcqJyxcclxuICAgICAgICB9KVxyXG4gICAgICAgIGZzZy5zZXRUaW1lbGltaXQoNSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVzZXRQbGF5ZXJDaG9pY2VzKCk7XHJcblxyXG4gICAgICAgIGxldCBydWxlcyA9IGZzZy5ydWxlcygpO1xyXG4gICAgICAgIGlmIChzdGF0ZS5yb3VuZCA+IHJ1bGVzLnJvdW5kcykge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NXaW5uZXJzKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHJvY2Vzc05leHRRdWVzdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc2V0UGxheWVyQ2hvaWNlcygpIHtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGZzZy5wbGF5ZXJzKCk7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyc1tpZF07XHJcbiAgICAgICAgICAgIHBsYXllci5jaG9pY2VzID0gcGxheWVyLmNob2ljZXMgfHwgW107XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGxheWVyLl9jaG9pY2UgIT09ICd1bmRlZmluZWQnICYmIHBsYXllci5fY2hvaWNlICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIuY2hvaWNlcy5wdXNoKHBsYXllci5fY2hvaWNlKTtcclxuICAgICAgICAgICAgZGVsZXRlIHBsYXllci5fY2hvaWNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzTmV4dFF1ZXN0aW9uKCkge1xyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG5cclxuICAgICAgICAvL2ZpbmQgYSByYW5kb20gcXVlc3Rpb24gbm90IGFza2VkIGJlZm9yZVxyXG4gICAgICAgIGxldCBxaWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBxdWVzdGlvbnMubGVuZ3RoKTtcclxuICAgICAgICBpZiAoc3RhdGUuaGlzdG9yeS5pbmNsdWRlcyhxaWQpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc05leHRRdWVzdGlvbigpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldHVwIG5leHQgcXVlc3Rpb25cclxuICAgICAgICBsZXQgcXVlc3Rpb24gPSBxdWVzdGlvbnNbcWlkXTtcclxuICAgICAgICBzdGF0ZS5xaWQgPSBxaWQ7XHJcbiAgICAgICAgc3RhdGUucXVlc3Rpb24gPSBxdWVzdGlvbi5xO1xyXG4gICAgICAgIHN0YXRlLmNhdGVnb3J5ID0gcXVlc3Rpb24uYztcclxuICAgICAgICBpZiAocXVlc3Rpb24udCA9PSAnYm9vbGVhbicpIHtcclxuICAgICAgICAgICAgLy9hbHdheXMgVHJ1ZSB0aGVuIEZhbHNlIGluIHRoZSBjaG9pY2VzXHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMgPSBbJ1RydWUnLCAnRmFsc2UnXVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy9zb3J0IHRoZSBjaG9pY2VzIGFscGhhYmV0aWNhbGx5XHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMgPSBbXTtcclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcy5wdXNoKHF1ZXN0aW9uLmEpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXN0aW9uLmkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHN0YXRlLmNob2ljZXMucHVzaChxdWVzdGlvbi5pW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzLnNvcnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9zYXZlIHRoaXMgcXVlc3Rpb24gaW4gaGlzdG9yeSB0byBhdm9pZCBjaG9vc2luZyBhZ2FpblxyXG4gICAgICAgIHN0YXRlLmhpc3RvcnkucHVzaChxaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NXaW5uZXJzKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJMaXN0ID0gW107XHJcbiAgICAgICAgbGV0IHBsYXllcklkcyA9IFtdO1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gZnNnLnBsYXllcnMoKTtcclxuXHJcbiAgICAgICAgLy9hZGQgcGxheWVyIGlkIGludG8gdGhlIHBsYXllciBkYXRhXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBwbGF5ZXJzW2lkXS5pZCA9IGlkO1xyXG4gICAgICAgICAgICBwbGF5ZXJMaXN0LnB1c2gocGxheWVyc1tpZF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zb3J0IGFsbCBwbGF5ZXJzIGJ5IHRoZWlyIHBvaW50c1xyXG4gICAgICAgIHBsYXllckxpc3Quc29ydCgoYSwgYikgPT4ge1xyXG4gICAgICAgICAgICBhLnBvaW50cyAtIGIucG9pbnRzO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIC8vZ2V0IHRoZSB0b3AgMTBcclxuICAgICAgICBsZXQgd2lubmVycyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTWF0aC5taW4ocGxheWVyTGlzdC5sZW5ndGgsIDEwKTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBwbGF5ZXJMaXN0W2ldO1xyXG4gICAgICAgICAgICB3aW5uZXJzLnB1c2gocGxheWVyLmlkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vcmVtb3ZlIGlkLCBzbyB3ZSBkb24ndCBzZW5kIG92ZXIgbmV0d29ya1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgZGVsZXRlIHBsYXllcnNbaWRdWydpZCddO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN0YXRlID0gZnNnLnN0YXRlKCk7XHJcbiAgICAgICAgc3RhdGUud2lubmVycyA9IHdpbm5lcnM7XHJcbiAgICAgICAgZnNnLmV2ZW50cygnd2lubmVyJyk7XHJcblxyXG4gICAgICAgIGZzZy5raWxsR2FtZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NDb3JyZWN0QW5zd2VycygpIHtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGZzZy5wbGF5ZXJzKCk7XHJcbiAgICAgICAgbGV0IHN0YXRlID0gZnNnLnN0YXRlKCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLnJvdW5kIDw9IDApXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy9hd2FyZCBwb2ludHMgZm9yIGNvcnJlY3QgY2hvaWNlcywgcmVtb3ZlIHBvaW50cyBmb3Igd3JvbmcgY2hvaWNlc1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IHBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBsYXllci5fY2hvaWNlID09ICd1bmRlZmluZWQnIHx8IHBsYXllci5fY2hvaWNlID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhbnN3ZXIgPSBxdWVzdGlvbnNbc3RhdGUucWlkXS5hO1xyXG4gICAgICAgICAgICBsZXQgdXNlckNob2ljZSA9IHN0YXRlLmNob2ljZXNbcGxheWVyLl9jaG9pY2VdO1xyXG4gICAgICAgICAgICBpZiAoYW5zd2VyID09IHVzZXJDaG9pY2UpIHtcclxuICAgICAgICAgICAgICAgIHBsYXllci5wb2ludHMgKz0gMTA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIucG9pbnRzIC09IDI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IFBvcFRyaXZpYSgpOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiaW1wb3J0IGZzZyBmcm9tICcuL2ZzZyc7XHJcbmltcG9ydCBQb3BUcml2aWEgZnJvbSAnLi9nYW1lJztcclxuXHJcblxyXG5cclxuZnNnLm9uKCduZXdnYW1lJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uTmV3R2FtZShhY3Rpb24pKTtcclxuZnNnLm9uKCdza2lwJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uU2tpcChhY3Rpb24pKTtcclxuZnNnLm9uKCdqb2luJywgKGFjdGlvbikgPT4gUG9wVHJpdmlhLm9uSm9pbihhY3Rpb24pKTtcclxuZnNnLm9uKCdsZWF2ZScsIChhY3Rpb24pID0+IFBvcFRyaXZpYS5vbkxlYXZlKGFjdGlvbikpO1xyXG5mc2cub24oJ3BpY2snLCAoYWN0aW9uKSA9PiBQb3BUcml2aWEub25QaWNrKGFjdGlvbikpO1xyXG5cclxuZnNnLnN1Ym1pdCgpOyJdLCJzb3VyY2VSb290IjoiIn0=