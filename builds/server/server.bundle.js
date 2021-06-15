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

    setTimelimit(seconds) {
        seconds = seconds || this.defaultSeconds;
        if (!this.nextGame.timer)
            this.nextGame.timer = {};
        this.nextGame.timer.set = Math.min(60, Math.max(10, seconds));
    }

    reachedTimelimit() {
        if (typeof this.msg.timeleft == 'undefined')
            return false;
        return this.msg.timeleft <= 0;
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
        rounds: 2,
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
        if (_fsg__WEBPACK_IMPORTED_MODULE_0__.default.reachedTimelimit())
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
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.setTimelimit(60);

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
        let qid = Math.floor(Math.random() * _questions__WEBPACK_IMPORTED_MODULE_1__.default.length);
        if (state.history.includes(qid)) {
            this.processNextQuestion();
            return;
        }

        //setup next question
        let question = _questions__WEBPACK_IMPORTED_MODULE_1__.default[qid];
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

        //new player defaults
        user.points = 0;

        this.checkStartGame();
    }



    onLeave() {
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
        if (players[id]) {
            delete players[id];
        }
    }

    onPick() {

        if (_fsg__WEBPACK_IMPORTED_MODULE_0__.default.reachedTimelimit()) {
            this.nextRound();
            _fsg__WEBPACK_IMPORTED_MODULE_0__.default.log("Pick passed timelimit, getting new round");
            return;
        }

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





_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('newgame', () => _game__WEBPACK_IMPORTED_MODULE_1__.default.onNewGame());
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('skip', () => _game__WEBPACK_IMPORTED_MODULE_1__.default.onSkip());
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('join', () => _game__WEBPACK_IMPORTED_MODULE_1__.default.onJoin());
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('leave', () => _game__WEBPACK_IMPORTED_MODULE_1__.default.onLeave());
_fsg__WEBPACK_IMPORTED_MODULE_0__.default.on('pick', () => _game__WEBPACK_IMPORTED_MODULE_1__.default.onPick());

_fsg__WEBPACK_IMPORTED_MODULE_0__.default.submit();
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vRzpcXEdpdEh1YlxcZnNnLXBsYXRmb3JtXFx0ZW1wbGF0ZXNcXHBvcHRyaXZpYVxcZ2FtZS1zZXJ2ZXJcXGZzZy5qcyIsImZpbGU6Ly8vRzpcXEdpdEh1YlxcZnNnLXBsYXRmb3JtXFx0ZW1wbGF0ZXNcXHBvcHRyaXZpYVxcZ2FtZS1zZXJ2ZXJcXGdhbWUuanMiLCJmaWxlOi8vL0c6XFxHaXRIdWJcXGZzZy1wbGF0Zm9ybVxcdGVtcGxhdGVzXFxwb3B0cml2aWFcXGdhbWUtc2VydmVyXFxxdWVzdGlvbnMuanMiLCJmaWxlOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwiZmlsZTovLy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJmaWxlOi8vL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJmaWxlOi8vL0c6XFxHaXRIdWJcXGZzZy1wbGF0Zm9ybVxcdGVtcGxhdGVzXFxwb3B0cml2aWFcXGdhbWUtc2VydmVyXFxpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1EQUFtRCxnQkFBZ0IsaUNBQWlDO0FBQ3BHO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBLHlDQUF5QztBQUN6QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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O0FBQ0E7QUFDQSxDOzs7Ozs7VUN6a0JBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esd0NBQXdDLHlDQUF5QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7Ozs7Ozs7O0FDQXdCO0FBQ087Ozs7QUFJL0IsNENBQU0sa0JBQWtCLG9EQUFtQjtBQUMzQyw0Q0FBTSxlQUFlLGlEQUFnQjtBQUNyQyw0Q0FBTSxlQUFlLGlEQUFnQjtBQUNyQyw0Q0FBTSxnQkFBZ0Isa0RBQWlCO0FBQ3ZDLDRDQUFNLGVBQWUsaURBQWdCOztBQUVyQyxnREFBVSxHIiwiZmlsZSI6InNlcnZlci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuY2xhc3MgRlNHIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubXNnID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmFjdGlvbigpKSk7XHJcbiAgICAgICAgdGhpcy5vcmlnaW5hbEdhbWUgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGdsb2JhbHMuZ2FtZSgpKSk7XHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5nYW1lKCkpKTtcclxuICAgICAgICB0aGlzLmlzTmV3R2FtZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMubWFya2VkRm9yRGVsZXRlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kZWZhdWx0U2Vjb25kcyA9IDE1O1xyXG4gICAgICAgIC8vIHRoaXMubmV4dFRpbWVMaW1pdCA9IC0xO1xyXG4gICAgICAgIHRoaXMua2lja2VkUGxheWVycyA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMubmV4dEdhbWUgfHwgT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5ydWxlcykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5pc05ld0dhbWUgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmVycm9yKCdNaXNzaW5nIFJ1bGVzJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5uZXh0R2FtZSkge1xyXG4gICAgICAgICAgICBpZiAoISgndGltZXInIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyID0ge307XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCEoJ3N0YXRlJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5zdGF0ZSA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoISgncGxheWVycycgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUucGxheWVycyA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICghKCdwcmV2JyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnByZXYgPSB7fTtcclxuICAgICAgICAgICAgLy99XHJcblxyXG4gICAgICAgICAgICBpZiAoISgnbmV4dCcgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUubmV4dCA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoISgncnVsZXMnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnJ1bGVzID0ge307XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCEoJ2V2ZW50cycgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMgPSBbXTtcclxuICAgICAgICAgICAgLy99XHJcbiAgICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9uKHR5cGUsIGNiKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubXNnLnR5cGUgIT0gdHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSAnbmV3Z2FtZScgJiYgdGhpcy5pc05ld0dhbWUpIHtcclxuICAgICAgICAgICAgICAgIGNiKHRoaXMubXNnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzLm5leHRHYW1lID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdEdhbWUsIHsgcGxheWVyczogdGhpcy5uZXh0R2FtZS5wbGF5ZXJzIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2IodGhpcy5tc2cpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEdhbWUoZ2FtZSkge1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMubmV4dEdhbWUucGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgZ2FtZS5wbGF5ZXJzW2lkXSA9IHsgbmFtZTogcGxheWVyLm5hbWUgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL2dhbWUucGxheWVycyA9IE9iamVjdC5hc3NpZ24oe30sIGdhbWUucGxheWVycywgdGhpcy5uZXh0R2FtZS5wbGF5ZXJzKVxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUgPSBnYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHN1Ym1pdCgpIHtcclxuICAgICAgICAvLyBpZiAodGhpcy5uZXh0R2FtZS50aW1lciAmJiB0aGlzLm5leHRUaW1lTGltaXQgPiAtMSkge1xyXG4gICAgICAgIC8vICAgICB0aGlzLm5leHRHYW1lLnRpbWVyLnRpbWVsaW1pdCA9IHRoaXMubmV4dFRpbWVMaW1pdDtcclxuICAgICAgICAvLyAgICAgLy8gaWYgKHRoaXMubWFya2VkRm9yRGVsZXRlKVxyXG4gICAgICAgIC8vICAgICAvLyAgICAgZGVsZXRlIHRoaXMubmV4dEdhbWUubmV4dFsndGltZWxpbWl0J107XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAvL2lmIG5leHQgaW5mbyBoYXMgYmVlbiB1cGRhdGVkLCB3ZSBmb3JjZSBhIG5ldyB0aW1lclxyXG4gICAgICAgIC8vIGxldCBwcmV2TmV4dFVzZXIgPSBKU09OLnN0cmluZ2lmeSh0aGlzLm9yaWdpbmFsR2FtZS5uZXh0KTtcclxuICAgICAgICAvLyBsZXQgY3VyTmV4dFVzZXIgPSBKU09OLnN0cmluZ2lmeSh0aGlzLm5leHRHYW1lLm5leHQpO1xyXG4gICAgICAgIC8vIGlmIChwcmV2TmV4dFVzZXIgIT0gY3VyTmV4dFVzZXIgJiYgdHlwZW9mIHRoaXMubmV4dEdhbWUudGltZXIuc2V0ID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuc2V0VGltZWxpbWl0KClcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmtpY2tlZFBsYXllcnMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5raWNrID0gdGhpcy5raWNrZWRQbGF5ZXJzO1xyXG5cclxuICAgICAgICBnbG9iYWxzLmZpbmlzaCh0aGlzLm5leHRHYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBraWxsR2FtZSgpIHtcclxuICAgICAgICB0aGlzLm1hcmtlZEZvckRlbGV0ZSA9IHRydWU7XHJcbiAgICAgICAgZ2xvYmFscy5raWxsR2FtZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGxvZyhtc2cpIHtcclxuICAgICAgICBnbG9iYWxzLmxvZyhtc2cpO1xyXG4gICAgfVxyXG4gICAgZXJyb3IobXNnKSB7XHJcbiAgICAgICAgZ2xvYmFscy5lcnJvcihtc2cpO1xyXG4gICAgfVxyXG5cclxuICAgIGtpY2tQbGF5ZXIoaWQpIHtcclxuICAgICAgICB0aGlzLmtpY2tlZFBsYXllcnMucHVzaChpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1zZztcclxuICAgIH1cclxuXHJcbiAgICBzdGF0ZShrZXksIHZhbHVlKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuc3RhdGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnN0YXRlW2tleV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGVba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHBsYXllckxpc3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucGxheWVycyk7XHJcbiAgICB9XHJcbiAgICBwbGF5ZXJDb3VudCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5wbGF5ZXJzKS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheWVycyh1c2VyaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB1c2VyaWQgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW3VzZXJpZF07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucGxheWVyc1t1c2VyaWRdID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcnVsZXMocnVsZSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHJ1bGUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ydWxlcztcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcmV2KG9iaikge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnByZXYgPSBvYmo7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnByZXY7XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dChvYmopIHtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5uZXh0ID0gb2JqO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5uZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRpbWVsaW1pdChzZWNvbmRzKSB7XHJcbiAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgfHwgdGhpcy5kZWZhdWx0U2Vjb25kcztcclxuICAgICAgICBpZiAoIXRoaXMubmV4dEdhbWUudGltZXIpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUudGltZXIgPSB7fTtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyLnNldCA9IE1hdGgubWluKDYwLCBNYXRoLm1heCgxMCwgc2Vjb25kcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWNoZWRUaW1lbGltaXQoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm1zZy50aW1lbGVmdCA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1zZy50aW1lbGVmdCA8PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIGV2ZW50KG5hbWUpIHtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cy5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyRXZlbnRzKCkge1xyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzID0gW107XHJcbiAgICB9XHJcbiAgICBldmVudHMobmFtZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLmV2ZW50cztcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cy5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuZXcgRlNHKCk7IiwiaW1wb3J0IGZzZyBmcm9tICcuL2ZzZyc7XHJcblxyXG5pbXBvcnQgcXVlc3Rpb25zIGZyb20gJy4vcXVlc3Rpb25zJztcclxuXHJcbmxldCBkZWZhdWx0R2FtZSA9IHtcclxuICAgIHN0YXRlOiB7XHJcbiAgICAgICAgcWlkOiAwLFxyXG4gICAgICAgIGhpc3Rvcnk6IFtdLFxyXG4gICAgICAgIGNhdGVnb3J5OiAnJyxcclxuICAgICAgICBxdWVzdGlvbjogJycsXHJcbiAgICAgICAgY2hvaWNlczogW10sXHJcbiAgICAgICAgcm91bmQ6IDBcclxuICAgIH0sXHJcbiAgICBwbGF5ZXJzOiB7fSxcclxuICAgIHJ1bGVzOiB7XHJcbiAgICAgICAgcm91bmRzOiAyLFxyXG4gICAgICAgIG1heHBsYXllcnM6IDJcclxuICAgIH0sXHJcbiAgICBuZXh0OiB7fSxcclxuICAgIGV2ZW50czogW11cclxufVxyXG5cclxuY2xhc3MgUG9wVHJpdmlhIHtcclxuXHJcbiAgICBvbk5ld0dhbWUoKSB7XHJcbiAgICAgICAgZnNnLnNldEdhbWUoZGVmYXVsdEdhbWUpO1xyXG4gICAgICAgIHRoaXMuY2hlY2tTdGFydEdhbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBvblNraXAoKSB7XHJcbiAgICAgICAgaWYgKGZzZy5yZWFjaGVkVGltZWxpbWl0KCkpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tTdGFydEdhbWUoKSB7XHJcbiAgICAgICAgLy9pZiBwbGF5ZXIgY291bnQgcmVhY2hlZCByZXF1aXJlZCBsaW1pdCwgc3RhcnQgdGhlIGdhbWVcclxuICAgICAgICBsZXQgbWF4UGxheWVycyA9IGZzZy5ydWxlcygnbWF4UGxheWVycycpIHx8IDI7XHJcbiAgICAgICAgbGV0IHBsYXllckNvdW50ID0gZnNnLnBsYXllckNvdW50KCk7XHJcbiAgICAgICAgaWYgKHBsYXllckNvdW50ID49IG1heFBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKVxyXG4gICAgICAgICAgICAgICAgcGxheWVyc1tpZF0ucG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG5leHRSb3VuZCgpIHtcclxuICAgICAgICB0aGlzLnByb2Nlc3NDb3JyZWN0QW5zd2VycygpO1xyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuICAgICAgICBzdGF0ZS5yb3VuZCA9IHN0YXRlLnJvdW5kICsgMTtcclxuICAgICAgICBmc2cubmV4dCh7XHJcbiAgICAgICAgICAgIGlkOiAnKicsXHJcbiAgICAgICAgfSlcclxuICAgICAgICBmc2cuc2V0VGltZWxpbWl0KDYwKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZXNldFBsYXllckNob2ljZXMoKTtcclxuXHJcbiAgICAgICAgbGV0IHJ1bGVzID0gZnNnLnJ1bGVzKCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLnJvdW5kID4gcnVsZXMucm91bmRzKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1dpbm5lcnMoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wcm9jZXNzTmV4dFF1ZXN0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzZXRQbGF5ZXJDaG9pY2VzKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gZnNnLnBsYXllcnMoKTtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgcGxheWVyLmNob2ljZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NOZXh0UXVlc3Rpb24oKSB7XHJcbiAgICAgICAgbGV0IHN0YXRlID0gZnNnLnN0YXRlKCk7XHJcblxyXG4gICAgICAgIC8vZmluZCBhIHJhbmRvbSBxdWVzdGlvbiBub3QgYXNrZWQgYmVmb3JlXHJcbiAgICAgICAgbGV0IHFpZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHF1ZXN0aW9ucy5sZW5ndGgpO1xyXG4gICAgICAgIGlmIChzdGF0ZS5oaXN0b3J5LmluY2x1ZGVzKHFpZCkpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzTmV4dFF1ZXN0aW9uKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc2V0dXAgbmV4dCBxdWVzdGlvblxyXG4gICAgICAgIGxldCBxdWVzdGlvbiA9IHF1ZXN0aW9uc1txaWRdO1xyXG4gICAgICAgIHN0YXRlLnFpZCA9IHFpZDtcclxuICAgICAgICBzdGF0ZS5xdWVzdGlvbiA9IHF1ZXN0aW9uLnE7XHJcbiAgICAgICAgc3RhdGUuY2F0ZWdvcnkgPSBxdWVzdGlvbi5jO1xyXG4gICAgICAgIGlmIChxdWVzdGlvbi50ID09ICdib29sZWFuJykge1xyXG4gICAgICAgICAgICAvL2Fsd2F5cyBUcnVlIHRoZW4gRmFsc2UgaW4gdGhlIGNob2ljZXNcclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcyA9IFsnVHJ1ZScsICdGYWxzZSddXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvL3NvcnQgdGhlIGNob2ljZXMgYWxwaGFiZXRpY2FsbHlcclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcyA9IFtdO1xyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzLnB1c2gocXVlc3Rpb24uYSk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcXVlc3Rpb24uaS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgc3RhdGUuY2hvaWNlcy5wdXNoKHF1ZXN0aW9uLmlbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMuc29ydCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL3NhdmUgdGhpcyBxdWVzdGlvbiBpbiBoaXN0b3J5IHRvIGF2b2lkIGNob29zaW5nIGFnYWluXHJcbiAgICAgICAgc3RhdGUuaGlzdG9yeS5wdXNoKHFpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc1dpbm5lcnMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllckxpc3QgPSBbXTtcclxuICAgICAgICBsZXQgcGxheWVySWRzID0gW107XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG5cclxuICAgICAgICAvL2FkZCBwbGF5ZXIgaWQgaW50byB0aGUgcGxheWVyIGRhdGFcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIHBsYXllcnNbaWRdLmlkID0gaWQ7XHJcbiAgICAgICAgICAgIHBsYXllckxpc3QucHVzaChwbGF5ZXJzW2lkXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NvcnQgYWxsIHBsYXllcnMgYnkgdGhlaXIgcG9pbnRzXHJcbiAgICAgICAgcGxheWVyTGlzdC5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgIGIucG9pbnRzIC0gYS5wb2ludHM7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgLy9nZXQgdGhlIHRvcCAxMFxyXG4gICAgICAgIGxldCB3aW5uZXJzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBNYXRoLm1pbihwbGF5ZXJMaXN0Lmxlbmd0aCwgMTApOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IHBsYXllckxpc3RbaV07XHJcbiAgICAgICAgICAgIHdpbm5lcnMucHVzaChwbGF5ZXIuaWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9yZW1vdmUgaWQsIHNvIHdlIGRvbid0IHNlbmQgb3ZlciBuZXR3b3JrXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBkZWxldGUgcGxheWVyc1tpZF1bJ2lkJ107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuICAgICAgICBzdGF0ZS53aW5uZXJzID0gd2lubmVycztcclxuICAgICAgICBmc2cuZXZlbnRzKCd3aW5uZXInKTtcclxuXHJcbiAgICAgICAgZnNnLmtpbGxHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc0NvcnJlY3RBbnN3ZXJzKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gZnNnLnBsYXllcnMoKTtcclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuICAgICAgICBpZiAoc3RhdGUucm91bmQgPD0gMClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvL2F3YXJkIHBvaW50cyBmb3IgY29ycmVjdCBjaG9pY2VzLCByZW1vdmUgcG9pbnRzIGZvciB3cm9uZyBjaG9pY2VzXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyc1tpZF07XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGxheWVyLmNob2ljZSA9PSAndW5kZWZpbmVkJyB8fCBwbGF5ZXIuY2hvaWNlID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhbnN3ZXIgPSBxdWVzdGlvbnNbc3RhdGUucWlkXS5hO1xyXG4gICAgICAgICAgICBsZXQgdXNlckNob2ljZSA9IHN0YXRlLmNob2ljZXNbcGxheWVyLmNob2ljZV07XHJcbiAgICAgICAgICAgIGlmIChhbnN3ZXIgPT0gdXNlckNob2ljZSkge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnBvaW50cyArPSAxMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBsYXllci5wb2ludHMgLT0gMjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvbkpvaW4oKSB7XHJcbiAgICAgICAgbGV0IGFjdGlvbiA9IGZzZy5hY3Rpb24oKTtcclxuICAgICAgICBpZiAoIWFjdGlvbi51c2VyLmlkKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCB1c2VyID0gZnNnLnBsYXllcnMoYWN0aW9uLnVzZXIuaWQpO1xyXG4gICAgICAgIGlmICghdXNlcilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvL25ldyBwbGF5ZXIgZGVmYXVsdHNcclxuICAgICAgICB1c2VyLnBvaW50cyA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuY2hlY2tTdGFydEdhbWUoKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIG9uTGVhdmUoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG4gICAgICAgIGlmIChwbGF5ZXJzW2lkXSkge1xyXG4gICAgICAgICAgICBkZWxldGUgcGxheWVyc1tpZF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uUGljaygpIHtcclxuXHJcbiAgICAgICAgaWYgKGZzZy5yZWFjaGVkVGltZWxpbWl0KCkpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0Um91bmQoKTtcclxuICAgICAgICAgICAgZnNnLmxvZyhcIlBpY2sgcGFzc2VkIHRpbWVsaW1pdCwgZ2V0dGluZyBuZXcgcm91bmRcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG4gICAgICAgIGxldCBhY3Rpb24gPSBmc2cuYWN0aW9uKCk7XHJcbiAgICAgICAgbGV0IHVzZXIgPSBmc2cucGxheWVycyhhY3Rpb24udXNlci5pZCk7XHJcblxyXG4gICAgICAgIC8vZ2V0IHRoZSBwaWNrZWQgY2VsbFxyXG4gICAgICAgIGxldCBjaG9pY2UgPSBhY3Rpb24ucGF5bG9hZC5jaG9pY2U7XHJcblxyXG4gICAgICAgIGlmIChjaG9pY2UgPCAwIHx8IGNob2ljZSA+IHN0YXRlLmNob2ljZXMubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHVzZXIuY2hvaWNlID0gY2hvaWNlO1xyXG5cclxuICAgICAgICBmc2cuZXZlbnQoJ3BpY2tlZCcpO1xyXG4gICAgICAgIHN0YXRlLnBpY2tlZCA9IHVzZXIuaWQ7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuZXcgUG9wVHJpdmlhKCk7IiwiZXhwb3J0IGRlZmF1bHQgW1xyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEphcGFuZXNlIEFuaW1lICYgTWFuZ2FcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSAxOTg4IGZpbG0gJnF1b3Q7QWtpcmEmcXVvdDssIFRldHN1byBlbmRzIHVwIGRlc3Ryb3lpbmcgVG9reW8uXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VvZ3JhcGh5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGJvZHkgb2YgdGhlIEVneXB0aWFuIFNwaGlueCB3YXMgYmFzZWQgb24gd2hpY2ggYW5pbWFsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJ1bGxcIixcclxuICAgICAgICAgICAgXCJIb3JzZVwiLFxyXG4gICAgICAgICAgICBcIkRvZ1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiByZWxhdGlvbiB0byB0aGUgQnJpdGlzaCBPY2N1cGF0aW9uIGluIElyZWxhbmQsIHdoYXQgZG9lcyB0aGUgSVJBIHN0YW5kIGZvci5cIixcclxuICAgICAgICBcImFcIjogXCJJcmlzaCBSZXB1YmxpY2FuIEFybXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIklyaXNoIFJlYmVsIEFsbGlhbmNlXCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmVmb3JtYXRpb24gQXJteVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoLVJveWFsIEFsbGlhbmNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHJvYm90IGluIHRoZSAxOTUxIHNjaWVuY2UgZmljdGlvbiBmaWxtIGNsYXNzaWMgJiMwMzk7VGhlIERheSB0aGUgRWFydGggU3Rvb2QgU3RpbGwmIzAzOTs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR29ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUm9iYnlcIixcclxuICAgICAgICAgICAgXCJDb2xvc3N1c1wiLFxyXG4gICAgICAgICAgICBcIkJveFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgUm9tYW4gbnVtZXJhbCBmb3IgNTAwP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxcIixcclxuICAgICAgICAgICAgXCJDXCIsXHJcbiAgICAgICAgICAgIFwiWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIG1haW4gaGVhbGluZyBpdGVtIGluIERhcmsgU291bHM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRXN0dXMgRmxhc2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhlYWx0aCBQb3Rpb25cIixcclxuICAgICAgICAgICAgXCJPcmFuZ2UgSnVpY2VcIixcclxuICAgICAgICAgICAgXCJBc2hlbiBGbGFza1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIk9uIHdoaWNoIGNvbXB1dGVyIGhhcmR3YXJlIGRldmljZSBpcyB0aGUgQklPUyBjaGlwIGxvY2F0ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTW90aGVyYm9hcmRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcmQgRGlzayBEcml2ZVwiLFxyXG4gICAgICAgICAgICBcIkNlbnRyYWwgUHJvY2Vzc2luZyBVbml0XCIsXHJcbiAgICAgICAgICAgIFwiR3JhcGhpY3MgUHJvY2Vzc2luZyBVbml0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJBIHVuaXZlcnNhbCBzZXQsIG9yIGEgc2V0IHRoYXQgY29udGFpbnMgYWxsIHNldHMsIGV4aXN0cy5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQWNlIEF0dG9ybmV5IHRyaWxvZ3kgd2FzIHN1cHBvc2UgdG8gZW5kIHdpdGggJnF1b3Q7UGhvZW5peCBXcmlnaHQ6IEFjZSBBdHRvcm5leSAmbWludXM7IFRyaWFscyBhbmQgVHJpYnVsYXRpb25zJnF1b3Q7IGFzIGl0cyBmaW5hbCBnYW1lLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgaGlnaGVzdCBiZWx0IHlvdSBjYW4gZ2V0IGluIFRhZWt3b25kbz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiV2hpdGVcIixcclxuICAgICAgICAgICAgXCJSZWRcIixcclxuICAgICAgICAgICAgXCJHcmVlblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgVW5pdGVkIFN0YXRlcyBEZXBhcnRtZW50IG9mIEhvbWVsYW5kIFNlY3VyaXR5IHdhcyBmb3JtZWQgaW4gcmVzcG9uc2UgdG8gdGhlIFNlcHRlbWJlciAxMXRoIGF0dGFja3MuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQXBvbGxvIG1pc3Npb24gd2FzIHRoZSBsYXN0IG9uZSBpbiBOQVNBJiMwMzk7cyBBcG9sbG8gcHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJBcG9sbG8gMTdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwb2xsbyAxM1wiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxMVwiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgaXMgYW4gZXhpc3RpbmcgZmFtaWx5IGluICZxdW90O1RoZSBTaW1zJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBHb3RoIEZhbWlseVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBTaW1vbGVvbiBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgUHJvdWQgRmFtaWx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgTnVjbGVhciBUaHJvbmUsIHdoYXQgb3JnYW5pemF0aW9uIGNoYXNlcyB0aGUgcGxheWVyIGNoYXJhY3RlciB0aHJvdWdob3V0IHRoZSBnYW1lP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBJLkQuUC5EXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmlzaG1lblwiLFxyXG4gICAgICAgICAgICBcIlRoZSBCYW5kaXRzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFkuVi5HLkdcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lICZxdW90O0NhdmUgU3RvcnksJnF1b3Q7IHdoYXQgaXMgdGhlIGNoYXJhY3RlciBCYWxyb2cmIzAzOTtzIGNhdGNocGhyYXNlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkh1enphaCFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlllcyFcIixcclxuICAgICAgICAgICAgXCJXaG9hIHRoZXJlIVwiLFxyXG4gICAgICAgICAgICBcIk55ZWggaGVoIGhlaCFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiVmVoaWNsZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvbmUgb2YgdGhlc2UgY2hhc3NpcyBjb2RlcyBhcmUgdXNlZCBieSBCTVcgMy1zZXJpZXM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRTQ2XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFMzlcIixcclxuICAgICAgICAgICAgXCJFODVcIixcclxuICAgICAgICAgICAgXCJGMTBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ29taWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gd2hhdCBIb21lc3R1Y2sgVXBkYXRlIHdhcyBbU10gR2FtZSBPdmVyIHJlbGVhc2VkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk9jdG9iZXIgMjV0aCwgMjAxNFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXByaWwgMTN0aCwgMjAwOVwiLFxyXG4gICAgICAgICAgICBcIkFwcmlsIDh0aCwgMjAxMlwiLFxyXG4gICAgICAgICAgICBcIkF1Z3VzdCAyOHRoLCAyMDAzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgYmFuZCBtZW1iZXJzIG9mIEFtZXJpY2FuIHJvY2sgYmFuZCBLaW5nIG9mIExlb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQnJvdGhlcnMgJmFtcDsgY291c2luc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hpbGRob29kIGZyaWVuZHNcIixcclxuICAgICAgICAgICAgXCJGb3JtZXIgY2xhc3NtYXRlc1wiLFxyXG4gICAgICAgICAgICBcIkZyYXRlcm5pdHkgaG91c2UgbWVtYmVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZnJhbmNoaXNlIGhhZCBhIHNwZWNpYWwgZXZlbnQgaG9zdGVkIGluIHRoZSBwb3B1bGFyIE1NT1JQRyBGaW5hbCBGYW50YXN5IFhJVjogQSBSZWFsbSBSZWJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiWW8ta2FpIFdhdGNoXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJQb2smZWFjdXRlO21vblwiLFxyXG4gICAgICAgICAgICBcIll1LWdpLW9oXCIsXHJcbiAgICAgICAgICAgIFwiQnVkZHlmaWdodFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEtpbmdkb20gSGVhcnRzIGdhbWUgZmVhdHVyZWQgdGhlIGNhc3Qgb2YgJnF1b3Q7VGhlIFdvcmxkIEVuZHMgV2l0aCBZb3UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRHJlYW0gRHJvcCBEaXN0YW5jZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQmlydGggQnkgU2xlZXBcIixcclxuICAgICAgICAgICAgXCIzNjUvMiBEYXlzXCIsXHJcbiAgICAgICAgICAgIFwiUmU6Q2hhaW4gb2YgTWVtb3JpZXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBsYXJnZXN0IHBsYW5ldCBpbiBLZXJiYWwgU3BhY2UgUHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJKb29sXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFZWxvb1wiLFxyXG4gICAgICAgICAgICBcIktlcmJvbFwiLFxyXG4gICAgICAgICAgICBcIk1pbm11c1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFuaW1hbCBDcm9zc2luZyBnYW1lIHdhcyBmb3IgdGhlIE5pbnRlbmRvIFdpaT9cIixcclxuICAgICAgICBcImFcIjogXCJBbmltYWwgQ3Jvc3Npbmc6IENpdHkgRm9sa1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBOZXcgTGVhZlwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogV2lsZCBXb3JsZFwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogUG9wdWxhdGlvbiBHcm93aW5nIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJHZW9yZ2UgTHVjYXMgZGlyZWN0ZWQgdGhlIGVudGlyZSBvcmlnaW5hbCBTdGFyIFdhcnMgdHJpbG9neS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIGNpdHkgb2YgUm9tZSwgSXRhbHkgZm91bmRlZD9cIixcclxuICAgICAgICBcImFcIjogXCI3NTMgQkNFXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCI5MDIgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNTI0IEJDRVwiLFxyXG4gICAgICAgICAgICBcIjY5NyBCQ0VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZGF0YSBzdHJ1Y3R1cmUgZG9lcyBGSUxPIGFwcGx5IHRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlN0YWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJRdWV1ZVwiLFxyXG4gICAgICAgICAgICBcIkhlYXBcIixcclxuICAgICAgICAgICAgXCJUcmVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEJhdHRsZXN0YXIgR2FsYWN0aWNhICgyMDA0KSwgQ3lsb25zIHdlcmUgY3JlYXRlZCBieSBtYW4gYXMgY3liZXJuZXRpYyB3b3JrZXJzIGFuZCBzb2xkaWVycy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIDIwMTYgRGlzbmV5IGFuaW1hdGVkIGZpbG0gJiMwMzk7TW9hbmEmIzAzOTsgaXMgYmFzZWQgb24gd2hpY2ggY3VsdHVyZT9cIixcclxuICAgICAgICBcImFcIjogXCJQb2x5bmVzaWFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJOYXRpdmUgQW1lcmljYW5cIixcclxuICAgICAgICAgICAgXCJKYXBhbmVzZVwiLFxyXG4gICAgICAgICAgICBcIk5vcmRpY1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNha2UgZGVwaWN0ZWQgaW4gVmFsdmUmIzAzOTtzICZxdW90O1BvcnRhbCZxdW90OyBmcmFuY2hpc2UgbW9zdCBjbG9zZWx5IHJlc2VtYmxlcyB3aGljaCByZWFsLXdvcmxkIHR5cGUgb2YgY2FrZT9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFjayBGb3Jlc3RcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkRldmlsJiMwMzk7cyBGb29kXCIsXHJcbiAgICAgICAgICAgIFwiTW9sdGVuIENob2NvbGF0ZVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbiBDaG9jb2xhdGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZSAmIE5hdHVyZVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNoZW1pY2FsIGVsZW1lbnQgTGl0aGl1bSBpcyBuYW1lZCBhZnRlciB0aGUgY291bnRyeSBvZiBMaXRodWFuaWEuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogR2FkZ2V0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBEVkQgaW52ZW50ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk5NVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAwMFwiLFxyXG4gICAgICAgICAgICBcIjE5OTBcIixcclxuICAgICAgICAgICAgXCIxOTgwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGZ1bGwgbmFtZSBvZiB0aGUgZm9vdGJhbGxlciAmcXVvdDtDcmlzdGlhbm8gUm9uYWxkbyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJDcmlzdGlhbm8gUm9uYWxkbyBkb3MgU2FudG9zIEF2ZWlyb1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIFJvbmFsZG8gbG9zIFNhbnRvcyBEaWVnb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBBcm1hbmRvIERpZWdvIFJvbmFsZG9cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gTHVpcyBBcm1hbmRvIFJvbmFsZG9cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZXNlIHR3byBjb3VudHJpZXMgaGVsZCBhIGNvbW1vbndlYWx0aCBmcm9tIHRoZSAxNnRoIHRvIDE4dGggY2VudHVyeS5cIixcclxuICAgICAgICBcImFcIjogXCJQb2xhbmQgYW5kIExpdGh1YW5pYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSHV0dSBhbmQgUndhbmRhXCIsXHJcbiAgICAgICAgICAgIFwiTm9ydGggS29yZWEgYW5kIFNvdXRoIEtvcmVhXCIsXHJcbiAgICAgICAgICAgIFwiQmFuZ2xhZGVzaCBhbmQgQmh1dGFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtDYWxsIE9mIER1dHk6IFpvbWJpZXMmcXVvdDssIGNvbXBsZXRpbmcgd2hpY2ggbWFwJiMwMzk7cyBtYWluIGVhc3RlciBlZ2cgd2lsbCByZXdhcmQgeW91IHdpdGggdGhlIGFjaGlldmVtZW50LCAmcXVvdDtIaWdoIE1haW50ZW5hbmNlJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRpZSBSaXNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNb2IgT2YgVGhlIERlYWRcIixcclxuICAgICAgICAgICAgXCJPcmlnaW5zXCIsXHJcbiAgICAgICAgICAgIFwiQXNjZW5zaW9uXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENhcnRvb24gJiBBbmltYXRpb25zXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7R3Jhdml0eSBGYWxscyZxdW90OywgaG93IG11Y2ggZG9lcyBXYWRkbGVzIHdlaWdoIHdoZW4gTWFibGUgd2lucyBoaW0gaW4gJnF1b3Q7VGhlIFRpbWUgVHJhdmVsZXImIzAzOTtzIFBpZyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCIxNSBwb3VuZHNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjEwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjMwIHBvdW5kc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIGdpdmVuIHRvIGxheWVyIDQgb2YgdGhlIE9wZW4gU3lzdGVtcyBJbnRlcmNvbm5lY3Rpb24gKElTTykgbW9kZWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJhbnNwb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJTZXNzaW9uXCIsXHJcbiAgICAgICAgICAgIFwiRGF0YSBsaW5rXCIsXHJcbiAgICAgICAgICAgIFwiTmV0d29ya1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgeWVhciB3YXMgaG9ja2V5IGxlZ2VuZCBXYXluZSBHcmV0emt5IGJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk2MVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMTk2NVwiLFxyXG4gICAgICAgICAgICBcIjE5NTlcIixcclxuICAgICAgICAgICAgXCIxOTYzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJIb3cgbWFueSBnYW1lcyBhcmUgdGhlcmUgaW4gdGhlICZxdW90O0NvbG9ueSBXYXJzJnF1b3Q7IHNlcmllcyBmb3IgdGhlIFBsYXlTdGF0aW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjJcIixcclxuICAgICAgICAgICAgXCI0XCIsXHJcbiAgICAgICAgICAgIFwiNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIFdvcmxkIG9mIFdhcmNyYWZ0LCB3aGljaCByYWlkIGluc3RhbmNlIGZlYXR1cmVzIGEgY2hlc3MgZXZlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiS2FyYXpoYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlp1bCYjMDM5O0FtYW5cIixcclxuICAgICAgICAgICAgXCJCbGFja3dpbmcgTGFpclwiLFxyXG4gICAgICAgICAgICBcIlRlbXBsZSBvZiBBaG4mIzAzOTtRaXJhalwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggY291bnRyeSB3YXMgSm9zZWYgU3RhbGluIGJvcm4gaW4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR2VvcmdpYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUnVzc2lhXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFueVwiLFxyXG4gICAgICAgICAgICBcIlBvbGFuZFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG9mZmljaWFsIG5hbWUgb2YgUHJpbmNlJiMwMzk7cyBiYWNraW5nIGJhbmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIFJldm9sdXRpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBQYXVwZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFdhaWxlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgSGVhcnRicmVha2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiBHYW1lIG9mIFRocm9uZXMgd2hhdCBpcyB0aGUgbmFtZSBvZiBKb24gU25vdyYjMDM5O3Mgc3dvcmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9uZ2NsYXdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk9hdGhrZWVwZXJcIixcclxuICAgICAgICAgICAgXCJXaWRvdyYjMDM5O3MgV2FpbFwiLFxyXG4gICAgICAgICAgICBcIk5lZWRsZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBpbnNwZWN0b3IgaW4gdGhlIHNlcmllcyAmcXVvdDtPbiB0aGUgQnVzZXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxha2V5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJwZXJcIixcclxuICAgICAgICAgICAgXCJOYWlseVwiLFxyXG4gICAgICAgICAgICBcIkdhbGx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBhcnRpc3QgY3VyYXRlZCB0aGUgb2ZmaWNpYWwgc291bmR0cmFjayBmb3IgJnF1b3Q7VGhlIEh1bmdlciBHYW1lczogTW9ja2luZ2pheSAtIFBhcnQgMSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJMb3JkZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiS2FueWUgV2VzdFwiLFxyXG4gICAgICAgICAgICBcIlRvdmUgTG9cIixcclxuICAgICAgICAgICAgXCJDaGFybGkgWENYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIENhbmFkaWFuICQxIGNvaW4gaXMgY29sbG9xdWlhbGx5IGtub3duIGFzIGEgd2hhdD9cIixcclxuICAgICAgICBcImFcIjogXCJMb29uaWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIkZvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIk1vb2RpZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGVzZSBmb3VuZGluZyBmYXRoZXJzIG9mIHRoZSBVbml0ZWQgU3RhdGVzIG9mIEFtZXJpY2EgbGF0ZXIgYmVjYW1lIHByZXNpZGVudD9cIixcclxuICAgICAgICBcImFcIjogXCJKYW1lcyBNb25yb2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFsZXhhbmRlciBIYW1pbHRvblwiLFxyXG4gICAgICAgICAgICBcIlNhbXVlbCBBZGFtc1wiLFxyXG4gICAgICAgICAgICBcIlJvZ2VyIFNoZXJtYW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBEaXZpbml0eTogT3JpZ2luYWwgU2luIElJLCB3aGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxvaHNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFJlZCBQcmluY2VcIixcclxuICAgICAgICAgICAgXCJUaGVyZSBhcmUgbm8gc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3RlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaG8gaXMgdGhlIG1haW4gcHJvdGFnb25pc3QgaW4gdGhlIGdhbWUgTGlmZSBpcyBTdHJhbmdlOiBCZWZvcmUgVGhlIFN0b3JtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNobG9lIFByaWNlIFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTWF4IENhdWxmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlJhY2hlbCBBbWJlclwiLFxyXG4gICAgICAgICAgICBcIkZyYW5rIEJvd2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJKb2hubnkgRGVwcCBtYWRlIGhpcyBiaWctc2NyZWVuIGFjdGluZyBkZWJ1dCBpbiB3aGljaCBmaWxtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkEgTmlnaHRtYXJlIG9uIEVsbSBTdHJlZXRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk15IEJsb29keSBWYWxlbnRpbmVcIixcclxuICAgICAgICAgICAgXCJIYWxsb3dlZW5cIixcclxuICAgICAgICAgICAgXCJGcmlkYXkgdGhlIDEzdGhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCZxdW90Oywgb25seSBDaHJpcyBoYXMgYWNjZXNzIHRvIHRoZSBncmVuYWRlIGxhdW5jaGVyLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcnMgaXMgTk9UIHBsYXlhYmxlIGluICZxdW90O1Jlc2lkZW50IEV2aWwgNiZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJKaWxsIFZhbGVudGluZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hyaXMgUmVkZmllbGRcIixcclxuICAgICAgICAgICAgXCJTaGVycnkgQmlya2luXCIsXHJcbiAgICAgICAgICAgIFwiSGVsZW5hIEhhcnBlclwiXHJcbiAgICAgICAgXVxyXG4gICAgfVxyXG5dIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCJpbXBvcnQgZnNnIGZyb20gJy4vZnNnJztcclxuaW1wb3J0IFBvcFRyaXZpYSBmcm9tICcuL2dhbWUnO1xyXG5cclxuXHJcblxyXG5mc2cub24oJ25ld2dhbWUnLCAoKSA9PiBQb3BUcml2aWEub25OZXdHYW1lKCkpO1xyXG5mc2cub24oJ3NraXAnLCAoKSA9PiBQb3BUcml2aWEub25Ta2lwKCkpO1xyXG5mc2cub24oJ2pvaW4nLCAoKSA9PiBQb3BUcml2aWEub25Kb2luKCkpO1xyXG5mc2cub24oJ2xlYXZlJywgKCkgPT4gUG9wVHJpdmlhLm9uTGVhdmUoKSk7XHJcbmZzZy5vbigncGljaycsICgpID0+IFBvcFRyaXZpYS5vblBpY2soKSk7XHJcblxyXG5mc2cuc3VibWl0KCk7Il0sInNvdXJjZVJvb3QiOiIifQ==