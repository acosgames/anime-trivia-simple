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
        this.msg = JSON.parse(JSON.stringify(globals.action()));
        this.originalGame = JSON.parse(JSON.stringify(globals.game()));
        this.nextGame = JSON.parse(JSON.stringify(globals.game()));
        this.isNewGame = false;
        this.markedForDelete = false;
        this.nextTimeLimit = 0;
        this.kickedPlayers = [];

        if (!this.nextGame || Object.keys(this.nextGame.rules).length == 0) {
            this.isNewGame = true;
            this.error('Missing Rules');
        }

        if (this.nextGame) {
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
        if (this.msg.type != type) {
            if (type == 'newgame' && this.isNewGame) {
                cb(this.msg);

                // this.nextGame = Object.assign({}, defaultGame, { players: this.nextGame.players })
            }
            return;
        }

        cb(this.msg);
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
        if (this.nextGame.next) {
            this.nextGame.next.timelimit = this.nextTimeLimit;
            if (this.markedForDelete)
                delete this.nextGame.next['timelimit'];
        }

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

    action() {
        return this.msg;
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

    setTimeLimit(seconds) {
        this.nextTimeLimit = Math.min(60, Math.max(10, seconds));
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
/* harmony import */ var _questions__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./questions */ "./game-server/questions.js");




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
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.setGame(defaultGame);
        this.checkStartGame();
    }

    onSkip() {
        let action = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.action();
        let next = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.next();
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();

        state.round = state.round + 1;
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.next({
            id: '*',
            timelimit: 60
        })

        this.processCorrectAnswers();
        this.nextRound();
    }

    nextRound() {
        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();
        state.round = state.round + 1;


        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.next({
            id: '*',
            timelimit: 60
        })

        if (state.round > 10) {
            this.processWinners();
            return;
        }

        this.processNextQuestion();
    }

    processNextQuestion() {
        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();

        let qid = Math.floor(Math.random() * _questions__WEBPACK_IMPORTED_MODULE_1__.default.length);
        if (state.history.includes(qid)) {
            this.processNextQuestion();
            return;
        }
        let question = _questions__WEBPACK_IMPORTED_MODULE_1__.default[qid];
        state.qid = qid;
        state.question = question.q;
        state.category = question.c;
        if (question.t == 'boolean') {
            state.choices = ['True', 'False']
        }
        else {
            state.choices = [];
            state.choices.push(question.a);
            for (let i = 0; i < question.i.length; i++) {
                state.choices.push(question.i[i]);
            }
            state.choices.sort();
        }
    }

    processWinners() {
        let playerList = [];
        let playerIds = [];
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();

        for (var id in players) {
            players[id].id = id;
            playerList.push(players[id]);
        }

        playerList.sort((a, b) => {
            b.points - a.points;
        })

        let winners = [];
        for (var i = 0; i < Math.min(playerList.length, 10); i++) {
            let id = playerIds[i];
            winners.push(id);
        }

        //don't let this get sent over network
        for (var id in players) {
            delete players[id]['id'];
        }

        state.winners = winners;
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.events('winner');

        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.killGame();
    }

    processCorrectAnswers() {
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();

        for (var id in players) {
            let player = players[id];
            if (typeof player.choice == 'undefined' || player.choice == null)
                continue;

            let answer = _questions__WEBPACK_IMPORTED_MODULE_1__.default[state.qid].a;
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
        let action = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.action();
        if (!action.user.id)
            return;

        let user = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players(action.user.id);
        if (!user)
            return;
        user.points = 0;
        // if (fsg.players(action.user.id).type)
        //     return;

        this.checkStartGame();
    }

    checkStartGame() {
        //if player count reached required limit, start the game
        let maxPlayers = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.rules('maxPlayers') || 2;
        let playerCount = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.playerCount();
        if (playerCount >= maxPlayers) {
            this.startGame();
        }
    }

    startGame() {
        //set points to 0
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
        for (var id in players)
            players[id].points = 0;

        this.nextRound();
        // players[state.startPlayer].type = 'X';
    }

    onLeave() {
        let action = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.action();
        this.playerLeave(action.user.id);
    }

    playerLeave(id) {
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
        // let otherPlayerId = null;
        if (players[id]) {
            delete players[id];
        }
    }

    onPick() {
        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();
        let action = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.action();
        let user = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players(action.user.id);

        //get the picked cell
        let choice = action.payload.choice;

        if (choice < 0 || choice > state.choices.length)
            return;

        user.choice = choice;

        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.event('picked');
        state.picked = user.id;
    }


    findWinners() {
        let playerList = [];
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
        for (var id in players) {
            let player = players[id];
            playerList.push(player);
        }

        playerList.sort((a, b) => {
            return b.points - a.points;
        })

        return playerList;
    }

    // set the winner event and data
    setWinner() {
        //find user who matches the win type
        let players = this.findWinners();
        if (!players) {
            log.error('Winning Players not found???');
            return;
        }
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.clearEvents();
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.event('winner')
        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();
        state.winner = player.id;

        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.killGame();
    }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (new PopTrivia());

/***/ }),

/***/ "./game-server/questions.js":
/*!**********************************!*\
  !*** ./game-server/questions.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ([
    {
        "c": "Entertainment: Japanese Anime & Manga",
        "t": "boolean",
        "d": "easy",
        "q": "In the 1988 film &quot;Akira&quot;, Tetsuo ends up destroying Tokyo.",
        "a": "True",
        "i": [
            "False"
        ]
    },
    {
        "c": "Geography",
        "t": "multiple",
        "d": "easy",
        "q": "The body of the Egyptian Sphinx was based on which animal?",
        "a": "Lion",
        "i": [
            "Bull",
            "Horse",
            "Dog"
        ]
    },
    {
        "c": "History",
        "t": "multiple",
        "d": "medium",
        "q": "In relation to the British Occupation in Ireland, what does the IRA stand for.",
        "a": "Irish Republican Army",
        "i": [
            "Irish Rebel Alliance",
            "Irish Reformation Army",
            "Irish-Royal Alliance"
        ]
    },
    {
        "c": "Entertainment: Film",
        "t": "multiple",
        "d": "medium",
        "q": "What is the name of the robot in the 1951 science fiction film classic &#039;The Day the Earth Stood Still&#039;?",
        "a": "Gort",
        "i": [
            "Robby",
            "Colossus",
            "Box"
        ]
    },
    {
        "c": "Science: Mathematics",
        "t": "multiple",
        "d": "medium",
        "q": "What is the Roman numeral for 500?",
        "a": "D",
        "i": [
            "L",
            "C",
            "X"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "easy",
        "q": "What is the name of the main healing item in Dark Souls?",
        "a": "Estus Flask",
        "i": [
            "Health Potion",
            "Orange Juice",
            "Ashen Flask"
        ]
    },
    {
        "c": "Science: Computers",
        "t": "multiple",
        "d": "medium",
        "q": "On which computer hardware device is the BIOS chip located?",
        "a": "Motherboard",
        "i": [
            "Hard Disk Drive",
            "Central Processing Unit",
            "Graphics Processing Unit"
        ]
    },
    {
        "c": "Science: Mathematics",
        "t": "boolean",
        "d": "easy",
        "q": "A universal set, or a set that contains all sets, exists.",
        "a": "False",
        "i": [
            "True"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "boolean",
        "d": "medium",
        "q": "The Ace Attorney trilogy was suppose to end with &quot;Phoenix Wright: Ace Attorney &minus; Trials and Tribulations&quot; as its final game.",
        "a": "True",
        "i": [
            "False"
        ]
    },
    {
        "c": "Sports",
        "t": "multiple",
        "d": "medium",
        "q": "What is the highest belt you can get in Taekwondo?",
        "a": "Black",
        "i": [
            "White",
            "Red",
            "Green"
        ]
    },
    {
        "c": "History",
        "t": "boolean",
        "d": "easy",
        "q": "The United States Department of Homeland Security was formed in response to the September 11th attacks.",
        "a": "True",
        "i": [
            "False"
        ]
    },
    {
        "c": "History",
        "t": "multiple",
        "d": "medium",
        "q": "Which Apollo mission was the last one in NASA&#039;s Apollo program?",
        "a": "Apollo 17",
        "i": [
            "Apollo 13",
            "Apollo 11",
            "Apollo 15"
        ]
    },
    {
        "c": "General Knowledge",
        "t": "multiple",
        "d": "hard",
        "q": "Which of the following is an existing family in &quot;The Sims&quot;?",
        "a": "The Goth Family",
        "i": [
            "The Family",
            "The Simoleon Family",
            "The Proud Family"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "hard",
        "q": "In the game Nuclear Throne, what organization chases the player character throughout the game?",
        "a": "The I.D.P.D",
        "i": [
            "The Fishmen",
            "The Bandits",
            "The Y.V.G.G"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "medium",
        "q": "In the game &quot;Cave Story,&quot; what is the character Balrog&#039;s catchphrase?",
        "a": "Huzzah!",
        "i": [
            "Yes!",
            "Whoa there!",
            "Nyeh heh heh!"
        ]
    },
    {
        "c": "Vehicles",
        "t": "multiple",
        "d": "hard",
        "q": "Which one of these chassis codes are used by BMW 3-series?",
        "a": "E46",
        "i": [
            "E39",
            "E85",
            "F10"
        ]
    },
    {
        "c": "Entertainment: Comics",
        "t": "multiple",
        "d": "hard",
        "q": "In what Homestuck Update was [S] Game Over released?",
        "a": "October 25th, 2014",
        "i": [
            "April 13th, 2009",
            "April 8th, 2012",
            "August 28th, 2003"
        ]
    },
    {
        "c": "Entertainment: Music",
        "t": "multiple",
        "d": "medium",
        "q": "What is the relationship between the band members of American rock band King of Leon?",
        "a": "Brothers &amp; cousins",
        "i": [
            "Childhood friends",
            "Former classmates",
            "Fraternity house members"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "medium",
        "q": "Which franchise had a special event hosted in the popular MMORPG Final Fantasy XIV: A Realm Reborn?",
        "a": "Yo-kai Watch",
        "i": [
            "Pok&eacute;mon",
            "Yu-gi-oh",
            "Buddyfight"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "hard",
        "q": "Which Kingdom Hearts game featured the cast of &quot;The World Ends With You&quot;?",
        "a": "Dream Drop Distance",
        "i": [
            "Birth By Sleep",
            "365/2 Days",
            "Re:Chain of Memories"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "easy",
        "q": "What is the name of the largest planet in Kerbal Space Program?",
        "a": "Jool",
        "i": [
            "Eeloo",
            "Kerbol",
            "Minmus"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "easy",
        "q": "Which Animal Crossing game was for the Nintendo Wii?",
        "a": "Animal Crossing: City Folk",
        "i": [
            "Animal Crossing: New Leaf",
            "Animal Crossing: Wild World",
            "Animal Crossing: Population Growing!"
        ]
    },
    {
        "c": "Entertainment: Film",
        "t": "boolean",
        "d": "easy",
        "q": "George Lucas directed the entire original Star Wars trilogy.",
        "a": "False",
        "i": [
            "True"
        ]
    },
    {
        "c": "History",
        "t": "multiple",
        "d": "hard",
        "q": "When was the city of Rome, Italy founded?",
        "a": "753 BCE",
        "i": [
            "902 BCE",
            "524 BCE",
            "697 BCE"
        ]
    },
    {
        "c": "Science: Computers",
        "t": "multiple",
        "d": "hard",
        "q": "Which data structure does FILO apply to?",
        "a": "Stack",
        "i": [
            "Queue",
            "Heap",
            "Tree"
        ]
    },
    {
        "c": "Entertainment: Television",
        "t": "boolean",
        "d": "easy",
        "q": "In Battlestar Galactica (2004), Cylons were created by man as cybernetic workers and soldiers.",
        "a": "True",
        "i": [
            "False"
        ]
    },
    {
        "c": "Entertainment: Film",
        "t": "multiple",
        "d": "easy",
        "q": "The 2016 Disney animated film &#039;Moana&#039; is based on which culture?",
        "a": "Polynesian",
        "i": [
            "Native American",
            "Japanese",
            "Nordic"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "medium",
        "q": "The cake depicted in Valve&#039;s &quot;Portal&quot; franchise most closely resembles which real-world type of cake?",
        "a": "Black Forest",
        "i": [
            "Devil&#039;s Food",
            "Molten Chocolate",
            "German Chocolate"
        ]
    },
    {
        "c": "Science & Nature",
        "t": "boolean",
        "d": "hard",
        "q": "The chemical element Lithium is named after the country of Lithuania.",
        "a": "False",
        "i": [
            "True"
        ]
    },
    {
        "c": "Science: Gadgets",
        "t": "multiple",
        "d": "easy",
        "q": "When was the DVD invented?",
        "a": "1995",
        "i": [
            "2000",
            "1990",
            "1980"
        ]
    },
    {
        "c": "Sports",
        "t": "multiple",
        "d": "hard",
        "q": "What is the full name of the footballer &quot;Cristiano Ronaldo&quot;?",
        "a": "Cristiano Ronaldo dos Santos Aveiro",
        "i": [
            "Cristiano Ronaldo los Santos Diego",
            "Cristiano Armando Diego Ronaldo",
            "Cristiano Luis Armando Ronaldo"
        ]
    },
    {
        "c": "History",
        "t": "multiple",
        "d": "easy",
        "q": "These two countries held a commonwealth from the 16th to 18th century.",
        "a": "Poland and Lithuania",
        "i": [
            "Hutu and Rwanda",
            "North Korea and South Korea",
            "Bangladesh and Bhutan"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "medium",
        "q": "In &quot;Call Of Duty: Zombies&quot;, completing which map&#039;s main easter egg will reward you with the achievement, &quot;High Maintenance&quot;?",
        "a": "Die Rise",
        "i": [
            "Mob Of The Dead",
            "Origins",
            "Ascension"
        ]
    },
    {
        "c": "Entertainment: Cartoon & Animations",
        "t": "multiple",
        "d": "hard",
        "q": "In &quot;Gravity Falls&quot;, how much does Waddles weigh when Mable wins him in &quot;The Time Traveler&#039;s Pig&quot;?",
        "a": "15 pounds",
        "i": [
            "20 pounds",
            "10 pounds",
            "30 pounds"
        ]
    },
    {
        "c": "Science: Computers",
        "t": "multiple",
        "d": "hard",
        "q": "What is the name given to layer 4 of the Open Systems Interconnection (ISO) model?",
        "a": "Transport",
        "i": [
            "Session",
            "Data link",
            "Network"
        ]
    },
    {
        "c": "Sports",
        "t": "multiple",
        "d": "medium",
        "q": "What year was hockey legend Wayne Gretzky born?",
        "a": "1961",
        "i": [
            "1965",
            "1959",
            "1963"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "medium",
        "q": "How many games are there in the &quot;Colony Wars&quot; series for the PlayStation?",
        "a": "3",
        "i": [
            "2",
            "4",
            "5"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "hard",
        "q": "In World of Warcraft, which raid instance features a chess event?",
        "a": "Karazhan",
        "i": [
            "Zul&#039;Aman",
            "Blackwing Lair",
            "Temple of Ahn&#039;Qiraj"
        ]
    },
    {
        "c": "History",
        "t": "multiple",
        "d": "easy",
        "q": "Which country was Josef Stalin born in?",
        "a": "Georgia",
        "i": [
            "Russia",
            "Germany",
            "Poland"
        ]
    },
    {
        "c": "Entertainment: Music",
        "t": "multiple",
        "d": "hard",
        "q": "What is the official name of Prince&#039;s backing band?",
        "a": "The Revolution",
        "i": [
            "The Paupers",
            "The Wailers",
            "The Heartbreakers"
        ]
    },
    {
        "c": "Entertainment: Television",
        "t": "multiple",
        "d": "medium",
        "q": "In Game of Thrones what is the name of Jon Snow&#039;s sword?",
        "a": "Longclaw",
        "i": [
            "Oathkeeper",
            "Widow&#039;s Wail",
            "Needle"
        ]
    },
    {
        "c": "Entertainment: Television",
        "t": "multiple",
        "d": "medium",
        "q": "What is the name of the inspector in the series &quot;On the Buses&quot;?",
        "a": "Blakey",
        "i": [
            "Harper",
            "Naily",
            "Gally"
        ]
    },
    {
        "c": "Entertainment: Music",
        "t": "multiple",
        "d": "medium",
        "q": "Which artist curated the official soundtrack for &quot;The Hunger Games: Mockingjay - Part 1&quot;?",
        "a": "Lorde",
        "i": [
            "Kanye West",
            "Tove Lo",
            "Charli XCX"
        ]
    },
    {
        "c": "General Knowledge",
        "t": "multiple",
        "d": "easy",
        "q": "The Canadian $1 coin is colloquially known as a what?",
        "a": "Loonie",
        "i": [
            "Boolie",
            "Foolie",
            "Moodie"
        ]
    },
    {
        "c": "History",
        "t": "multiple",
        "d": "medium",
        "q": "Which of these founding fathers of the United States of America later became president?",
        "a": "James Monroe",
        "i": [
            "Alexander Hamilton",
            "Samuel Adams",
            "Roger Sherman"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "easy",
        "q": "In Divinity: Original Sin II, what is the name of the skeletal origin character?",
        "a": "Fane",
        "i": [
            "Lohse",
            "The Red Prince",
            "There are no skeletal origin characters"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "easy",
        "q": "Who is the main protagonist in the game Life is Strange: Before The Storm?",
        "a": "Chloe Price ",
        "i": [
            "Max Caulfield",
            "Rachel Amber",
            "Frank Bowers"
        ]
    },
    {
        "c": "Entertainment: Film",
        "t": "multiple",
        "d": "medium",
        "q": "Johnny Depp made his big-screen acting debut in which film?",
        "a": "A Nightmare on Elm Street",
        "i": [
            "My Bloody Valentine",
            "Halloween",
            "Friday the 13th"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "boolean",
        "d": "medium",
        "q": "In &quot;Resident Evil&quot;, only Chris has access to the grenade launcher.",
        "a": "False",
        "i": [
            "True"
        ]
    },
    {
        "c": "Entertainment: Video Games",
        "t": "multiple",
        "d": "medium",
        "q": "Which of the following characters is NOT playable in &quot;Resident Evil 6&quot;?",
        "a": "Jill Valentine",
        "i": [
            "Chris Redfield",
            "Sherry Birkin",
            "Helena Harper"
        ]
    }
]);

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



_fsg__WEBPACK_IMPORTED_MODULE_0__.default.setTimeLimit(20);

_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('newgame', () => _game__WEBPACK_IMPORTED_MODULE_1__.default.onNewGame());
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('skip', () => _game__WEBPACK_IMPORTED_MODULE_1__.default.onSkip());
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('join', () => _game__WEBPACK_IMPORTED_MODULE_1__.default.onJoin());
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('leave', () => _game__WEBPACK_IMPORTED_MODULE_1__.default.onLeave());
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('pick', () => _game__WEBPACK_IMPORTED_MODULE_1__.default.onPick());

_fsg__WEBPACK_IMPORTED_MODULE_0__.default.submit();
})();

/******/ })()
;
//# sourceMappingURL=server.bundle.js.map