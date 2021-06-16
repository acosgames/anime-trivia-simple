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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vRzpcXEdpdEh1YlxcZnNnLXBsYXRmb3JtXFx0ZW1wbGF0ZXNcXHBvcHRyaXZpYVxcZ2FtZS1zZXJ2ZXJcXGZzZy5qcyIsImZpbGU6Ly8vRzpcXEdpdEh1YlxcZnNnLXBsYXRmb3JtXFx0ZW1wbGF0ZXNcXHBvcHRyaXZpYVxcZ2FtZS1zZXJ2ZXJcXGdhbWUuanMiLCJmaWxlOi8vL0c6XFxHaXRIdWJcXGZzZy1wbGF0Zm9ybVxcdGVtcGxhdGVzXFxwb3B0cml2aWFcXGdhbWUtc2VydmVyXFxxdWVzdGlvbnMuanMiLCJmaWxlOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwiZmlsZTovLy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJmaWxlOi8vL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJmaWxlOi8vL0c6XFxHaXRIdWJcXGZzZy1wbGF0Zm9ybVxcdGVtcGxhdGVzXFxwb3B0cml2aWFcXGdhbWUtc2VydmVyXFxpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1EQUFtRCxnQkFBZ0IsaUNBQWlDO0FBQ3BHO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBLHlDQUF5QztBQUN6QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyRkFBMkYsbUNBQW1DO0FBQzlIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRUFBcUUsb0NBQW9DLDhCQUE4QjtBQUN2STtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFpRTtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRUFBb0UsY0FBYztBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7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S0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FLDZCQUE2QjtBQUNoRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELFdBQVc7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLFFBQVEsWUFBWTtBQUNsRTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBLEtBQUs7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QUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRUFBbUUsNkJBQTZCO0FBQ2hHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsV0FBVztBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsUUFBUSxZQUFZO0FBQ2xFO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNERBQTRELHVCQUF1QjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QiwyQkFBMkIsNEJBQTRCLDhEQUE4RCxzQkFBc0I7QUFDbEs7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLG1CQUFtQiwyREFBMkQsdUJBQXVCLFdBQVc7QUFDdkk7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9EQUFvRCxpQkFBaUI7QUFDckU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0EsZ0NBQWdDO0FBQ2hDO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FO0FBQ25FO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0VBQW9FLGtCQUFrQjtBQUN0RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRUFBcUUsMkNBQTJDO0FBQ2hIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsbUJBQW1CO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUVBQXlFLHFCQUFxQjtBQUM5RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsV0FBVztBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyRkFBMkYsbUNBQW1DO0FBQzlIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRUFBcUUsb0NBQW9DLDhCQUE4QjtBQUN2STtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlFQUFpRTtBQUNqRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRUFBb0UsY0FBYztBQUNsRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQyxpQkFBaUIsbUNBQW1DO0FBQ3BGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRSw2QkFBNkI7QUFDaEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtEQUFrRCxXQUFXO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxRQUFRLFlBQVk7QUFDbEU7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0REFBNEQsdUJBQXVCO0FBQ25GO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLDJCQUEyQiw0QkFBNEIsOERBQThELHNCQUFzQjtBQUNsSztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsbUJBQW1CLDJEQUEyRCx1QkFBdUIsV0FBVztBQUN2STtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0RBQW9ELGlCQUFpQjtBQUNyRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQSxnQ0FBZ0M7QUFDaEM7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVEQUF1RDtBQUN2RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRUFBbUU7QUFDbkU7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvRUFBb0Usa0JBQWtCO0FBQ3RGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFFQUFxRSwyQ0FBMkM7QUFDaEg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixtQkFBbUI7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5RUFBeUUscUJBQXFCO0FBQzlGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQyxXQUFXO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJGQUEyRixtQ0FBbUM7QUFDOUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFFQUFxRSxvQ0FBb0MsOEJBQThCO0FBQ3ZJO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFO0FBQ2pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9FQUFvRSxjQUFjO0FBQ2xGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLGlCQUFpQixtQ0FBbUM7QUFDcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FLDZCQUE2QjtBQUNoRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELFdBQVc7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLFFBQVEsWUFBWTtBQUNsRTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RCx1QkFBdUI7QUFDbkY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsMkJBQTJCLDRCQUE0Qiw4REFBOEQsc0JBQXNCO0FBQ2xLO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixtQkFBbUIsMkRBQTJELHVCQUF1QixXQUFXO0FBQ3ZJO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvREFBb0QsaUJBQWlCO0FBQ3JFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBLGdDQUFnQztBQUNoQztBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdURBQXVEO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRTtBQUNuRTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9FQUFvRSxrQkFBa0I7QUFDdEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUVBQXFFLDJDQUEyQztBQUNoSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLG1CQUFtQjtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlFQUF5RSxxQkFBcUI7QUFDOUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDLFdBQVc7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkZBQTJGLG1DQUFtQztBQUM5SDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUVBQXFFLG9DQUFvQyw4QkFBOEI7QUFDdkk7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpRUFBaUU7QUFDakU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0VBQW9FLGNBQWM7QUFDbEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQ0FBZ0MsaUJBQWlCLG1DQUFtQztBQUNwRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRUFBbUUsNkJBQTZCO0FBQ2hHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsV0FBVztBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsUUFBUSxZQUFZO0FBQ2xFO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNERBQTRELHVCQUF1QjtBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QiwyQkFBMkIsNEJBQTRCLDhEQUE4RCxzQkFBc0I7QUFDbEs7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLG1CQUFtQiwyREFBMkQsdUJBQXVCLFdBQVc7QUFDdkk7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9EQUFvRCxpQkFBaUI7QUFDckU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0EsZ0NBQWdDO0FBQ2hDO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FO0FBQ25FO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0VBQW9FLGtCQUFrQjtBQUN0RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRUFBcUUsMkNBQTJDO0FBQ2hIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsbUJBQW1CO0FBQzFDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUVBQXlFLHFCQUFxQjtBQUM5RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsV0FBVztBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyRkFBMkYsbUNBQW1DO0FBQzlIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixtQkFBbUI7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5RUFBeUUscUJBQXFCO0FBQzlGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQyxXQUFXO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJGQUEyRixtQ0FBbUM7QUFDOUg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFFQUFxRSxvQ0FBb0MsOEJBQThCO0FBQ3ZJO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUVBQWlFO0FBQ2pFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9FQUFvRSxjQUFjO0FBQ2xGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQWdDLGlCQUFpQixtQ0FBbUM7QUFDcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FLDZCQUE2QjtBQUNoRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELFdBQVc7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLFFBQVEsWUFBWTtBQUNsRTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RCx1QkFBdUI7QUFDbkY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsMkJBQTJCLDRCQUE0Qiw4REFBOEQsc0JBQXNCO0FBQ2xLO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixtQkFB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O0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQyxpQkFBaUIsbUNBQW1DO0FBQ3BGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRSw2QkFBNkI7QUFDaEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRUFBbUUsNkJBQTZCO0FBQ2hHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsV0FBVztBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsUUFBUSxZQUFZO0FBQ2xFO0FBQ0E7QUFDQSx3QkFB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FLDZCQUE2QjtBQUNoRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0RBQWtELFdBQVc7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLFFBQVEsWUFBWTtBQUNsRTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFDNUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRUFBbUUsNkJBQTZCO0FBQ2hHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsV0FBVztBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4Q0FBOEMsUUFBUSxZQUFZO0FBQ2xFO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNERBQTRELHVCQUF1QjtBQUNuRjtBQUNBO0FB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dmVyLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5jbGFzcyBGU0cge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5tc2cgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGdsb2JhbHMuYWN0aW9uKCkpKTtcclxuICAgICAgICB0aGlzLm9yaWdpbmFsR2FtZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5nYW1lKCkpKTtcclxuICAgICAgICB0aGlzLm5leHRHYW1lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmdhbWUoKSkpO1xyXG4gICAgICAgIHRoaXMuaXNOZXdHYW1lID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5tYXJrZWRGb3JEZWxldGUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRlZmF1bHRTZWNvbmRzID0gMTU7XHJcbiAgICAgICAgLy8gdGhpcy5uZXh0VGltZUxpbWl0ID0gLTE7XHJcbiAgICAgICAgdGhpcy5raWNrZWRQbGF5ZXJzID0gW107XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5uZXh0R2FtZSB8fCBPYmplY3Qua2V5cyh0aGlzLm5leHRHYW1lLnJ1bGVzKS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmlzTmV3R2FtZSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3IoJ01pc3NpbmcgUnVsZXMnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm5leHRHYW1lKSB7XHJcbiAgICAgICAgICAgIGlmICghKCd0aW1lcicgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUudGltZXIgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoISgnc3RhdGUnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnN0YXRlID0ge307XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghKCdwbGF5ZXJzJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5wbGF5ZXJzID0ge307XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCEoJ3ByZXYnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUucHJldiA9IHt9O1xyXG4gICAgICAgICAgICAvL31cclxuXHJcbiAgICAgICAgICAgIGlmICghKCduZXh0JyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5uZXh0ID0ge307XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghKCdydWxlcycgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUucnVsZXMgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9pZiAoISgnZXZlbnRzJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cyA9IFtdO1xyXG4gICAgICAgICAgICAvL31cclxuICAgICAgICB9XHJcblxyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgb24odHlwZSwgY2IpIHtcclxuICAgICAgICBpZiAodGhpcy5tc2cudHlwZSAhPSB0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09ICduZXdnYW1lJyAmJiB0aGlzLmlzTmV3R2FtZSkge1xyXG4gICAgICAgICAgICAgICAgY2IodGhpcy5tc2cpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHRoaXMubmV4dEdhbWUgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0R2FtZSwgeyBwbGF5ZXJzOiB0aGlzLm5leHRHYW1lLnBsYXllcnMgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjYih0aGlzLm1zZyk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0R2FtZShnYW1lKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSB0aGlzLm5leHRHYW1lLnBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBnYW1lLnBsYXllcnNbaWRdID0geyBuYW1lOiBwbGF5ZXIubmFtZSB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vZ2FtZS5wbGF5ZXJzID0gT2JqZWN0LmFzc2lnbih7fSwgZ2FtZS5wbGF5ZXJzLCB0aGlzLm5leHRHYW1lLnBsYXllcnMpXHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZSA9IGdhbWU7XHJcbiAgICB9XHJcblxyXG4gICAgc3VibWl0KCkge1xyXG4gICAgICAgIC8vIGlmICh0aGlzLm5leHRHYW1lLnRpbWVyICYmIHRoaXMubmV4dFRpbWVMaW1pdCA+IC0xKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMubmV4dEdhbWUudGltZXIudGltZWxpbWl0ID0gdGhpcy5uZXh0VGltZUxpbWl0O1xyXG4gICAgICAgIC8vICAgICAvLyBpZiAodGhpcy5tYXJrZWRGb3JEZWxldGUpXHJcbiAgICAgICAgLy8gICAgIC8vICAgICBkZWxldGUgdGhpcy5uZXh0R2FtZS5uZXh0Wyd0aW1lbGltaXQnXTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIC8vaWYgbmV4dCBpbmZvIGhhcyBiZWVuIHVwZGF0ZWQsIHdlIGZvcmNlIGEgbmV3IHRpbWVyXHJcbiAgICAgICAgLy8gbGV0IHByZXZOZXh0VXNlciA9IEpTT04uc3RyaW5naWZ5KHRoaXMub3JpZ2luYWxHYW1lLm5leHQpO1xyXG4gICAgICAgIC8vIGxldCBjdXJOZXh0VXNlciA9IEpTT04uc3RyaW5naWZ5KHRoaXMubmV4dEdhbWUubmV4dCk7XHJcbiAgICAgICAgLy8gaWYgKHByZXZOZXh0VXNlciAhPSBjdXJOZXh0VXNlciAmJiB0eXBlb2YgdGhpcy5uZXh0R2FtZS50aW1lci5zZXQgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAvLyAgICAgdGhpcy5zZXRUaW1lbGltaXQoKVxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMua2lja2VkUGxheWVycy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLmtpY2sgPSB0aGlzLmtpY2tlZFBsYXllcnM7XHJcblxyXG4gICAgICAgIGdsb2JhbHMuZmluaXNoKHRoaXMubmV4dEdhbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGtpbGxHYW1lKCkge1xyXG4gICAgICAgIHRoaXMubWFya2VkRm9yRGVsZXRlID0gdHJ1ZTtcclxuICAgICAgICBnbG9iYWxzLmtpbGxHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgbG9nKG1zZykge1xyXG4gICAgICAgIGdsb2JhbHMubG9nKG1zZyk7XHJcbiAgICB9XHJcbiAgICBlcnJvcihtc2cpIHtcclxuICAgICAgICBnbG9iYWxzLmVycm9yKG1zZyk7XHJcbiAgICB9XHJcblxyXG4gICAga2lja1BsYXllcihpZCkge1xyXG4gICAgICAgIHRoaXMua2lja2VkUGxheWVycy5wdXNoKGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubXNnO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRlKGtleSwgdmFsdWUpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5zdGF0ZTtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuc3RhdGVba2V5XTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS5zdGF0ZVtrZXldID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheWVyTGlzdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5wbGF5ZXJzKTtcclxuICAgIH1cclxuICAgIHBsYXllckNvdW50KCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLm5leHRHYW1lLnBsYXllcnMpLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwbGF5ZXJzKHVzZXJpZCwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHVzZXJpZCA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnBsYXllcnM7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnBsYXllcnNbdXNlcmlkXTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW3VzZXJpZF0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBydWxlcyhydWxlLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgcnVsZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnJ1bGVzO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ydWxlc1tydWxlXTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS5ydWxlc1tydWxlXSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByZXYob2JqKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUucHJldiA9IG9iajtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucHJldjtcclxuICAgIH1cclxuXHJcbiAgICBuZXh0KG9iaikge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLm5leHQgPSBvYmo7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLm5leHQ7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZWxpbWl0KHNlY29uZHMpIHtcclxuICAgICAgICBzZWNvbmRzID0gc2Vjb25kcyB8fCB0aGlzLmRlZmF1bHRTZWNvbmRzO1xyXG4gICAgICAgIGlmICghdGhpcy5uZXh0R2FtZS50aW1lcilcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS50aW1lciA9IHt9O1xyXG4gICAgICAgIHRoaXMubmV4dEdhbWUudGltZXIuc2V0ID0gTWF0aC5taW4oNjAsIE1hdGgubWF4KDEwLCBzZWNvbmRzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVhY2hlZFRpbWVsaW1pdCgpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHRoaXMubXNnLnRpbWVsZWZ0ID09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubXNnLnRpbWVsZWZ0IDw9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZXZlbnQobmFtZSkge1xyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJFdmVudHMoKSB7XHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMgPSBbXTtcclxuICAgIH1cclxuICAgIGV2ZW50cyhuYW1lKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuZXZlbnRzO1xyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBGU0coKTsiLCJpbXBvcnQgZnNnIGZyb20gJy4vZnNnJztcclxuXHJcbmltcG9ydCBxdWVzdGlvbnMgZnJvbSAnLi9xdWVzdGlvbnMnO1xyXG5cclxubGV0IGRlZmF1bHRHYW1lID0ge1xyXG4gICAgc3RhdGU6IHtcclxuICAgICAgICBxaWQ6IDAsXHJcbiAgICAgICAgaGlzdG9yeTogW10sXHJcbiAgICAgICAgY2F0ZWdvcnk6ICcnLFxyXG4gICAgICAgIHF1ZXN0aW9uOiAnJyxcclxuICAgICAgICBjaG9pY2VzOiBbXSxcclxuICAgICAgICByb3VuZDogMFxyXG4gICAgfSxcclxuICAgIHBsYXllcnM6IHt9LFxyXG4gICAgcnVsZXM6IHtcclxuICAgICAgICByb3VuZHM6IDIsXHJcbiAgICAgICAgbWF4cGxheWVyczogMlxyXG4gICAgfSxcclxuICAgIG5leHQ6IHt9LFxyXG4gICAgZXZlbnRzOiBbXVxyXG59XHJcblxyXG5jbGFzcyBQb3BUcml2aWEge1xyXG5cclxuICAgIG9uTmV3R2FtZSgpIHtcclxuICAgICAgICBmc2cuc2V0R2FtZShkZWZhdWx0R2FtZSk7XHJcbiAgICAgICAgdGhpcy5jaGVja1N0YXJ0R2FtZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2tpcCgpIHtcclxuICAgICAgICBpZiAoZnNnLnJlYWNoZWRUaW1lbGltaXQoKSlcclxuICAgICAgICAgICAgdGhpcy5uZXh0Um91bmQoKTtcclxuICAgIH1cclxuXHJcbiAgICBjaGVja1N0YXJ0R2FtZSgpIHtcclxuICAgICAgICAvL2lmIHBsYXllciBjb3VudCByZWFjaGVkIHJlcXVpcmVkIGxpbWl0LCBzdGFydCB0aGUgZ2FtZVxyXG4gICAgICAgIGxldCBtYXhQbGF5ZXJzID0gZnNnLnJ1bGVzKCdtYXhQbGF5ZXJzJykgfHwgMjtcclxuICAgICAgICBsZXQgcGxheWVyQ291bnQgPSBmc2cucGxheWVyQ291bnQoKTtcclxuICAgICAgICBpZiAocGxheWVyQ291bnQgPj0gbWF4UGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVycyA9IGZzZy5wbGF5ZXJzKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpXHJcbiAgICAgICAgICAgICAgICBwbGF5ZXJzW2lkXS5wb2ludHMgPSAwO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5uZXh0Um91bmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dFJvdW5kKCkge1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc0NvcnJlY3RBbnN3ZXJzKCk7XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG4gICAgICAgIHN0YXRlLnJvdW5kID0gc3RhdGUucm91bmQgKyAxO1xyXG4gICAgICAgIGZzZy5uZXh0KHtcclxuICAgICAgICAgICAgaWQ6ICcqJyxcclxuICAgICAgICB9KVxyXG4gICAgICAgIGZzZy5zZXRUaW1lbGltaXQoNjApO1xyXG5cclxuICAgICAgICB0aGlzLnJlc2V0UGxheWVyQ2hvaWNlcygpO1xyXG5cclxuICAgICAgICBsZXQgcnVsZXMgPSBmc2cucnVsZXMoKTtcclxuICAgICAgICBpZiAoc3RhdGUucm91bmQgPiBydWxlcy5yb3VuZHMpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzV2lubmVycygpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnByb2Nlc3NOZXh0UXVlc3Rpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICByZXNldFBsYXllckNob2ljZXMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IHBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBwbGF5ZXIuY2hvaWNlID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc05leHRRdWVzdGlvbigpIHtcclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuXHJcbiAgICAgICAgLy9maW5kIGEgcmFuZG9tIHF1ZXN0aW9uIG5vdCBhc2tlZCBiZWZvcmVcclxuICAgICAgICBsZXQgcWlkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcXVlc3Rpb25zLmxlbmd0aCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLmhpc3RvcnkuaW5jbHVkZXMocWlkKSkge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NOZXh0UXVlc3Rpb24oKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zZXR1cCBuZXh0IHF1ZXN0aW9uXHJcbiAgICAgICAgbGV0IHF1ZXN0aW9uID0gcXVlc3Rpb25zW3FpZF07XHJcbiAgICAgICAgc3RhdGUucWlkID0gcWlkO1xyXG4gICAgICAgIHN0YXRlLnF1ZXN0aW9uID0gcXVlc3Rpb24ucTtcclxuICAgICAgICBzdGF0ZS5jYXRlZ29yeSA9IHF1ZXN0aW9uLmM7XHJcbiAgICAgICAgaWYgKHF1ZXN0aW9uLnQgPT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgICAgIC8vYWx3YXlzIFRydWUgdGhlbiBGYWxzZSBpbiB0aGUgY2hvaWNlc1xyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzID0gWydUcnVlJywgJ0ZhbHNlJ11cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vc29ydCB0aGUgY2hvaWNlcyBhbHBoYWJldGljYWxseVxyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzID0gW107XHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMucHVzaChxdWVzdGlvbi5hKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWVzdGlvbi5pLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5jaG9pY2VzLnB1c2gocXVlc3Rpb24uaVtpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcy5zb3J0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vc2F2ZSB0aGlzIHF1ZXN0aW9uIGluIGhpc3RvcnkgdG8gYXZvaWQgY2hvb3NpbmcgYWdhaW5cclxuICAgICAgICBzdGF0ZS5oaXN0b3J5LnB1c2gocWlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzV2lubmVycygpIHtcclxuICAgICAgICBsZXQgcGxheWVyTGlzdCA9IFtdO1xyXG4gICAgICAgIGxldCBwbGF5ZXJJZHMgPSBbXTtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGZzZy5wbGF5ZXJzKCk7XHJcblxyXG4gICAgICAgIC8vYWRkIHBsYXllciBpZCBpbnRvIHRoZSBwbGF5ZXIgZGF0YVxyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgcGxheWVyc1tpZF0uaWQgPSBpZDtcclxuICAgICAgICAgICAgcGxheWVyTGlzdC5wdXNoKHBsYXllcnNbaWRdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc29ydCBhbGwgcGxheWVycyBieSB0aGVpciBwb2ludHNcclxuICAgICAgICBwbGF5ZXJMaXN0LnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgYi5wb2ludHMgLSBhLnBvaW50cztcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICAvL2dldCB0aGUgdG9wIDEwXHJcbiAgICAgICAgbGV0IHdpbm5lcnMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE1hdGgubWluKHBsYXllckxpc3QubGVuZ3RoLCAxMCk7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyTGlzdFtpXTtcclxuICAgICAgICAgICAgd2lubmVycy5wdXNoKHBsYXllci5pZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3JlbW92ZSBpZCwgc28gd2UgZG9uJ3Qgc2VuZCBvdmVyIG5ldHdvcmtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXJzW2lkXVsnaWQnXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG4gICAgICAgIHN0YXRlLndpbm5lcnMgPSB3aW5uZXJzO1xyXG4gICAgICAgIGZzZy5ldmVudHMoJ3dpbm5lcicpO1xyXG5cclxuICAgICAgICBmc2cua2lsbEdhbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzQ29ycmVjdEFuc3dlcnMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG4gICAgICAgIGlmIChzdGF0ZS5yb3VuZCA8PSAwKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vYXdhcmQgcG9pbnRzIGZvciBjb3JyZWN0IGNob2ljZXMsIHJlbW92ZSBwb2ludHMgZm9yIHdyb25nIGNob2ljZXNcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbGF5ZXIuY2hvaWNlID09ICd1bmRlZmluZWQnIHx8IHBsYXllci5jaG9pY2UgPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgbGV0IGFuc3dlciA9IHF1ZXN0aW9uc1tzdGF0ZS5xaWRdLmE7XHJcbiAgICAgICAgICAgIGxldCB1c2VyQ2hvaWNlID0gc3RhdGUuY2hvaWNlc1twbGF5ZXIuY2hvaWNlXTtcclxuICAgICAgICAgICAgaWYgKGFuc3dlciA9PSB1c2VyQ2hvaWNlKSB7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIucG9pbnRzICs9IDEwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnBvaW50cyAtPSAyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uSm9pbigpIHtcclxuICAgICAgICBsZXQgYWN0aW9uID0gZnNnLmFjdGlvbigpO1xyXG4gICAgICAgIGlmICghYWN0aW9uLnVzZXIuaWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHVzZXIgPSBmc2cucGxheWVycyhhY3Rpb24udXNlci5pZCk7XHJcbiAgICAgICAgaWYgKCF1c2VyKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vbmV3IHBsYXllciBkZWZhdWx0c1xyXG4gICAgICAgIHVzZXIucG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5jaGVja1N0YXJ0R2FtZSgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgb25MZWF2ZSgpIHtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGZzZy5wbGF5ZXJzKCk7XHJcbiAgICAgICAgaWYgKHBsYXllcnNbaWRdKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25QaWNrKCkge1xyXG5cclxuICAgICAgICBpZiAoZnNnLnJlYWNoZWRUaW1lbGltaXQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRSb3VuZCgpO1xyXG4gICAgICAgICAgICBmc2cubG9nKFwiUGljayBwYXNzZWQgdGltZWxpbWl0LCBnZXR0aW5nIG5ldyByb3VuZFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN0YXRlID0gZnNnLnN0YXRlKCk7XHJcbiAgICAgICAgbGV0IGFjdGlvbiA9IGZzZy5hY3Rpb24oKTtcclxuICAgICAgICBsZXQgdXNlciA9IGZzZy5wbGF5ZXJzKGFjdGlvbi51c2VyLmlkKTtcclxuXHJcbiAgICAgICAgLy9nZXQgdGhlIHBpY2tlZCBjZWxsXHJcbiAgICAgICAgbGV0IGNob2ljZSA9IGFjdGlvbi5wYXlsb2FkLmNob2ljZTtcclxuXHJcbiAgICAgICAgaWYgKGNob2ljZSA8IDAgfHwgY2hvaWNlID4gc3RhdGUuY2hvaWNlcy5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdXNlci5jaG9pY2UgPSBjaG9pY2U7XHJcblxyXG4gICAgICAgIGZzZy5ldmVudCgncGlja2VkJyk7XHJcbiAgICAgICAgc3RhdGUucGlja2VkID0gdXNlci5pZDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBQb3BUcml2aWEoKTsiLCJleHBvcnQgZGVmYXVsdCBbXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogSmFwYW5lc2UgQW5pbWUgJiBNYW5nYVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIDE5ODggZmlsbSAmcXVvdDtBa2lyYSZxdW90OywgVGV0c3VvIGVuZHMgdXAgZGVzdHJveWluZyBUb2t5by5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW9ncmFwaHlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgYm9keSBvZiB0aGUgRWd5cHRpYW4gU3BoaW54IHdhcyBiYXNlZCBvbiB3aGljaCBhbmltYWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQnVsbFwiLFxyXG4gICAgICAgICAgICBcIkhvcnNlXCIsXHJcbiAgICAgICAgICAgIFwiRG9nXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHJlbGF0aW9uIHRvIHRoZSBCcml0aXNoIE9jY3VwYXRpb24gaW4gSXJlbGFuZCwgd2hhdCBkb2VzIHRoZSBJUkEgc3RhbmQgZm9yLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIklyaXNoIFJlcHVibGljYW4gQXJteVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmViZWwgQWxsaWFuY2VcIixcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWZvcm1hdGlvbiBBcm15XCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2gtUm95YWwgQWxsaWFuY2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgcm9ib3QgaW4gdGhlIDE5NTEgc2NpZW5jZSBmaWN0aW9uIGZpbG0gY2xhc3NpYyAmIzAzOTtUaGUgRGF5IHRoZSBFYXJ0aCBTdG9vZCBTdGlsbCYjMDM5Oz9cIixcclxuICAgICAgICBcImFcIjogXCJHb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSb2JieVwiLFxyXG4gICAgICAgICAgICBcIkNvbG9zc3VzXCIsXHJcbiAgICAgICAgICAgIFwiQm94XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBSb21hbiBudW1lcmFsIGZvciA1MDA/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTFwiLFxyXG4gICAgICAgICAgICBcIkNcIixcclxuICAgICAgICAgICAgXCJYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbWFpbiBoZWFsaW5nIGl0ZW0gaW4gRGFyayBTb3Vscz9cIixcclxuICAgICAgICBcImFcIjogXCJFc3R1cyBGbGFza1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGVhbHRoIFBvdGlvblwiLFxyXG4gICAgICAgICAgICBcIk9yYW5nZSBKdWljZVwiLFxyXG4gICAgICAgICAgICBcIkFzaGVuIEZsYXNrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiT24gd2hpY2ggY29tcHV0ZXIgaGFyZHdhcmUgZGV2aWNlIGlzIHRoZSBCSU9TIGNoaXAgbG9jYXRlZD9cIixcclxuICAgICAgICBcImFcIjogXCJNb3RoZXJib2FyZFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFyZCBEaXNrIERyaXZlXCIsXHJcbiAgICAgICAgICAgIFwiQ2VudHJhbCBQcm9jZXNzaW5nIFVuaXRcIixcclxuICAgICAgICAgICAgXCJHcmFwaGljcyBQcm9jZXNzaW5nIFVuaXRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkEgdW5pdmVyc2FsIHNldCwgb3IgYSBzZXQgdGhhdCBjb250YWlucyBhbGwgc2V0cywgZXhpc3RzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBBY2UgQXR0b3JuZXkgdHJpbG9neSB3YXMgc3VwcG9zZSB0byBlbmQgd2l0aCAmcXVvdDtQaG9lbml4IFdyaWdodDogQWNlIEF0dG9ybmV5ICZtaW51czsgVHJpYWxzIGFuZCBUcmlidWxhdGlvbnMmcXVvdDsgYXMgaXRzIGZpbmFsIGdhbWUuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBoaWdoZXN0IGJlbHQgeW91IGNhbiBnZXQgaW4gVGFla3dvbmRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJXaGl0ZVwiLFxyXG4gICAgICAgICAgICBcIlJlZFwiLFxyXG4gICAgICAgICAgICBcIkdyZWVuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBVbml0ZWQgU3RhdGVzIERlcGFydG1lbnQgb2YgSG9tZWxhbmQgU2VjdXJpdHkgd2FzIGZvcm1lZCBpbiByZXNwb25zZSB0byB0aGUgU2VwdGVtYmVyIDExdGggYXR0YWNrcy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBcG9sbG8gbWlzc2lvbiB3YXMgdGhlIGxhc3Qgb25lIGluIE5BU0EmIzAzOTtzIEFwb2xsbyBwcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFwb2xsbyAxN1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDEzXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDExXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDE1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBpcyBhbiBleGlzdGluZyBmYW1pbHkgaW4gJnF1b3Q7VGhlIFNpbXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEdvdGggRmFtaWx5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFNpbW9sZW9uIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBQcm91ZCBGYW1pbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSBOdWNsZWFyIFRocm9uZSwgd2hhdCBvcmdhbml6YXRpb24gY2hhc2VzIHRoZSBwbGF5ZXIgY2hhcmFjdGVyIHRocm91Z2hvdXQgdGhlIGdhbWU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEkuRC5QLkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGaXNobWVuXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEJhbmRpdHNcIixcclxuICAgICAgICAgICAgXCJUaGUgWS5WLkcuR1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgJnF1b3Q7Q2F2ZSBTdG9yeSwmcXVvdDsgd2hhdCBpcyB0aGUgY2hhcmFjdGVyIEJhbHJvZyYjMDM5O3MgY2F0Y2hwaHJhc2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSHV6emFoIVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWWVzIVwiLFxyXG4gICAgICAgICAgICBcIldob2EgdGhlcmUhXCIsXHJcbiAgICAgICAgICAgIFwiTnllaCBoZWggaGVoIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJWZWhpY2xlc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9uZSBvZiB0aGVzZSBjaGFzc2lzIGNvZGVzIGFyZSB1c2VkIGJ5IEJNVyAzLXNlcmllcz9cIixcclxuICAgICAgICBcImFcIjogXCJFNDZcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkUzOVwiLFxyXG4gICAgICAgICAgICBcIkU4NVwiLFxyXG4gICAgICAgICAgICBcIkYxMFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDb21pY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB3aGF0IEhvbWVzdHVjayBVcGRhdGUgd2FzIFtTXSBHYW1lIE92ZXIgcmVsZWFzZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiT2N0b2JlciAyNXRoLCAyMDE0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcHJpbCAxM3RoLCAyMDA5XCIsXHJcbiAgICAgICAgICAgIFwiQXByaWwgOHRoLCAyMDEyXCIsXHJcbiAgICAgICAgICAgIFwiQXVndXN0IDI4dGgsIDIwMDNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBiYW5kIG1lbWJlcnMgb2YgQW1lcmljYW4gcm9jayBiYW5kIEtpbmcgb2YgTGVvbj9cIixcclxuICAgICAgICBcImFcIjogXCJCcm90aGVycyAmYW1wOyBjb3VzaW5zXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaGlsZGhvb2QgZnJpZW5kc1wiLFxyXG4gICAgICAgICAgICBcIkZvcm1lciBjbGFzc21hdGVzXCIsXHJcbiAgICAgICAgICAgIFwiRnJhdGVybml0eSBob3VzZSBtZW1iZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBmcmFuY2hpc2UgaGFkIGEgc3BlY2lhbCBldmVudCBob3N0ZWQgaW4gdGhlIHBvcHVsYXIgTU1PUlBHIEZpbmFsIEZhbnRhc3kgWElWOiBBIFJlYWxtIFJlYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCJZby1rYWkgV2F0Y2hcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlBvayZlYWN1dGU7bW9uXCIsXHJcbiAgICAgICAgICAgIFwiWXUtZ2ktb2hcIixcclxuICAgICAgICAgICAgXCJCdWRkeWZpZ2h0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggS2luZ2RvbSBIZWFydHMgZ2FtZSBmZWF0dXJlZCB0aGUgY2FzdCBvZiAmcXVvdDtUaGUgV29ybGQgRW5kcyBXaXRoIFlvdSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEcmVhbSBEcm9wIERpc3RhbmNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCaXJ0aCBCeSBTbGVlcFwiLFxyXG4gICAgICAgICAgICBcIjM2NS8yIERheXNcIixcclxuICAgICAgICAgICAgXCJSZTpDaGFpbiBvZiBNZW1vcmllc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGxhcmdlc3QgcGxhbmV0IGluIEtlcmJhbCBTcGFjZSBQcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkpvb2xcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkVlbG9vXCIsXHJcbiAgICAgICAgICAgIFwiS2VyYm9sXCIsXHJcbiAgICAgICAgICAgIFwiTWlubXVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQW5pbWFsIENyb3NzaW5nIGdhbWUgd2FzIGZvciB0aGUgTmludGVuZG8gV2lpP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFuaW1hbCBDcm9zc2luZzogQ2l0eSBGb2xrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IE5ldyBMZWFmXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBXaWxkIFdvcmxkXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBQb3B1bGF0aW9uIEdyb3dpbmchXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkdlb3JnZSBMdWNhcyBkaXJlY3RlZCB0aGUgZW50aXJlIG9yaWdpbmFsIFN0YXIgV2FycyB0cmlsb2d5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgY2l0eSBvZiBSb21lLCBJdGFseSBmb3VuZGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjc1MyBCQ0VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjkwMiBCQ0VcIixcclxuICAgICAgICAgICAgXCI1MjQgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNjk3IEJDRVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBkYXRhIHN0cnVjdHVyZSBkb2VzIEZJTE8gYXBwbHkgdG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiU3RhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlF1ZXVlXCIsXHJcbiAgICAgICAgICAgIFwiSGVhcFwiLFxyXG4gICAgICAgICAgICBcIlRyZWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gQmF0dGxlc3RhciBHYWxhY3RpY2EgKDIwMDQpLCBDeWxvbnMgd2VyZSBjcmVhdGVkIGJ5IG1hbiBhcyBjeWJlcm5ldGljIHdvcmtlcnMgYW5kIHNvbGRpZXJzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgMjAxNiBEaXNuZXkgYW5pbWF0ZWQgZmlsbSAmIzAzOTtNb2FuYSYjMDM5OyBpcyBiYXNlZCBvbiB3aGljaCBjdWx0dXJlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbHluZXNpYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk5hdGl2ZSBBbWVyaWNhblwiLFxyXG4gICAgICAgICAgICBcIkphcGFuZXNlXCIsXHJcbiAgICAgICAgICAgIFwiTm9yZGljXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2FrZSBkZXBpY3RlZCBpbiBWYWx2ZSYjMDM5O3MgJnF1b3Q7UG9ydGFsJnF1b3Q7IGZyYW5jaGlzZSBtb3N0IGNsb3NlbHkgcmVzZW1ibGVzIHdoaWNoIHJlYWwtd29ybGQgdHlwZSBvZiBjYWtlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrIEZvcmVzdFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRGV2aWwmIzAzOTtzIEZvb2RcIixcclxuICAgICAgICAgICAgXCJNb2x0ZW4gQ2hvY29sYXRlXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFuIENob2NvbGF0ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlICYgTmF0dXJlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2hlbWljYWwgZWxlbWVudCBMaXRoaXVtIGlzIG5hbWVkIGFmdGVyIHRoZSBjb3VudHJ5IG9mIExpdGh1YW5pYS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBHYWRnZXRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIERWRCBpbnZlbnRlZD9cIixcclxuICAgICAgICBcImFcIjogXCIxOTk1XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMDAwXCIsXHJcbiAgICAgICAgICAgIFwiMTk5MFwiLFxyXG4gICAgICAgICAgICBcIjE5ODBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgZnVsbCBuYW1lIG9mIHRoZSBmb290YmFsbGVyICZxdW90O0NyaXN0aWFubyBSb25hbGRvJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNyaXN0aWFubyBSb25hbGRvIGRvcyBTYW50b3MgQXZlaXJvXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gUm9uYWxkbyBsb3MgU2FudG9zIERpZWdvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEFybWFuZG8gRGllZ28gUm9uYWxkb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBMdWlzIEFybWFuZG8gUm9uYWxkb1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlc2UgdHdvIGNvdW50cmllcyBoZWxkIGEgY29tbW9ud2VhbHRoIGZyb20gdGhlIDE2dGggdG8gMTh0aCBjZW50dXJ5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbGFuZCBhbmQgTGl0aHVhbmlhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIdXR1IGFuZCBSd2FuZGFcIixcclxuICAgICAgICAgICAgXCJOb3J0aCBLb3JlYSBhbmQgU291dGggS29yZWFcIixcclxuICAgICAgICAgICAgXCJCYW5nbGFkZXNoIGFuZCBCaHV0YW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0NhbGwgT2YgRHV0eTogWm9tYmllcyZxdW90OywgY29tcGxldGluZyB3aGljaCBtYXAmIzAzOTtzIG1haW4gZWFzdGVyIGVnZyB3aWxsIHJld2FyZCB5b3Ugd2l0aCB0aGUgYWNoaWV2ZW1lbnQsICZxdW90O0hpZ2ggTWFpbnRlbmFuY2UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRGllIFJpc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1vYiBPZiBUaGUgRGVhZFwiLFxyXG4gICAgICAgICAgICBcIk9yaWdpbnNcIixcclxuICAgICAgICAgICAgXCJBc2NlbnNpb25cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ2FydG9vbiAmIEFuaW1hdGlvbnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtHcmF2aXR5IEZhbGxzJnF1b3Q7LCBob3cgbXVjaCBkb2VzIFdhZGRsZXMgd2VpZ2ggd2hlbiBNYWJsZSB3aW5zIGhpbSBpbiAmcXVvdDtUaGUgVGltZSBUcmF2ZWxlciYjMDM5O3MgUGlnJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE1IHBvdW5kc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMTAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMzAgcG91bmRzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgZ2l2ZW4gdG8gbGF5ZXIgNCBvZiB0aGUgT3BlbiBTeXN0ZW1zIEludGVyY29ubmVjdGlvbiAoSVNPKSBtb2RlbD9cIixcclxuICAgICAgICBcImFcIjogXCJUcmFuc3BvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlNlc3Npb25cIixcclxuICAgICAgICAgICAgXCJEYXRhIGxpbmtcIixcclxuICAgICAgICAgICAgXCJOZXR3b3JrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCB5ZWFyIHdhcyBob2NrZXkgbGVnZW5kIFdheW5lIEdyZXR6a3kgYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCIxOTYxXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIxOTY1XCIsXHJcbiAgICAgICAgICAgIFwiMTk1OVwiLFxyXG4gICAgICAgICAgICBcIjE5NjNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkhvdyBtYW55IGdhbWVzIGFyZSB0aGVyZSBpbiB0aGUgJnF1b3Q7Q29sb255IFdhcnMmcXVvdDsgc2VyaWVzIGZvciB0aGUgUGxheVN0YXRpb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiM1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMlwiLFxyXG4gICAgICAgICAgICBcIjRcIixcclxuICAgICAgICAgICAgXCI1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gV29ybGQgb2YgV2FyY3JhZnQsIHdoaWNoIHJhaWQgaW5zdGFuY2UgZmVhdHVyZXMgYSBjaGVzcyBldmVudD9cIixcclxuICAgICAgICBcImFcIjogXCJLYXJhemhhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWnVsJiMwMzk7QW1hblwiLFxyXG4gICAgICAgICAgICBcIkJsYWNrd2luZyBMYWlyXCIsXHJcbiAgICAgICAgICAgIFwiVGVtcGxlIG9mIEFobiYjMDM5O1FpcmFqXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBjb3VudHJ5IHdhcyBKb3NlZiBTdGFsaW4gYm9ybiBpbj9cIixcclxuICAgICAgICBcImFcIjogXCJHZW9yZ2lhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSdXNzaWFcIixcclxuICAgICAgICAgICAgXCJHZXJtYW55XCIsXHJcbiAgICAgICAgICAgIFwiUG9sYW5kXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgb2ZmaWNpYWwgbmFtZSBvZiBQcmluY2UmIzAzOTtzIGJhY2tpbmcgYmFuZD9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgUmV2b2x1dGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIFBhdXBlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgV2FpbGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBIZWFydGJyZWFrZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEdhbWUgb2YgVGhyb25lcyB3aGF0IGlzIHRoZSBuYW1lIG9mIEpvbiBTbm93JiMwMzk7cyBzd29yZD9cIixcclxuICAgICAgICBcImFcIjogXCJMb25nY2xhd1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiT2F0aGtlZXBlclwiLFxyXG4gICAgICAgICAgICBcIldpZG93JiMwMzk7cyBXYWlsXCIsXHJcbiAgICAgICAgICAgIFwiTmVlZGxlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGluc3BlY3RvciBpbiB0aGUgc2VyaWVzICZxdW90O09uIHRoZSBCdXNlcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFrZXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcnBlclwiLFxyXG4gICAgICAgICAgICBcIk5haWx5XCIsXHJcbiAgICAgICAgICAgIFwiR2FsbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGFydGlzdCBjdXJhdGVkIHRoZSBvZmZpY2lhbCBzb3VuZHRyYWNrIGZvciAmcXVvdDtUaGUgSHVuZ2VyIEdhbWVzOiBNb2NraW5namF5IC0gUGFydCAxJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvcmRlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJLYW55ZSBXZXN0XCIsXHJcbiAgICAgICAgICAgIFwiVG92ZSBMb1wiLFxyXG4gICAgICAgICAgICBcIkNoYXJsaSBYQ1hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQ2FuYWRpYW4gJDEgY29pbiBpcyBjb2xsb3F1aWFsbHkga25vd24gYXMgYSB3aGF0P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvb25pZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiRm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiTW9vZGllXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZXNlIGZvdW5kaW5nIGZhdGhlcnMgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgb2YgQW1lcmljYSBsYXRlciBiZWNhbWUgcHJlc2lkZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkphbWVzIE1vbnJvZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQWxleGFuZGVyIEhhbWlsdG9uXCIsXHJcbiAgICAgICAgICAgIFwiU2FtdWVsIEFkYW1zXCIsXHJcbiAgICAgICAgICAgIFwiUm9nZXIgU2hlcm1hblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIERpdmluaXR5OiBPcmlnaW5hbCBTaW4gSUksIHdoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXI/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFuZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTG9oc2VcIixcclxuICAgICAgICAgICAgXCJUaGUgUmVkIFByaW5jZVwiLFxyXG4gICAgICAgICAgICBcIlRoZXJlIGFyZSBubyBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldobyBpcyB0aGUgbWFpbiBwcm90YWdvbmlzdCBpbiB0aGUgZ2FtZSBMaWZlIGlzIFN0cmFuZ2U6IEJlZm9yZSBUaGUgU3Rvcm0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ2hsb2UgUHJpY2UgXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNYXggQ2F1bGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiUmFjaGVsIEFtYmVyXCIsXHJcbiAgICAgICAgICAgIFwiRnJhbmsgQm93ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkpvaG5ueSBEZXBwIG1hZGUgaGlzIGJpZy1zY3JlZW4gYWN0aW5nIGRlYnV0IGluIHdoaWNoIGZpbG0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQSBOaWdodG1hcmUgb24gRWxtIFN0cmVldFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTXkgQmxvb2R5IFZhbGVudGluZVwiLFxyXG4gICAgICAgICAgICBcIkhhbGxvd2VlblwiLFxyXG4gICAgICAgICAgICBcIkZyaWRheSB0aGUgMTN0aFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtSZXNpZGVudCBFdmlsJnF1b3Q7LCBvbmx5IENocmlzIGhhcyBhY2Nlc3MgdG8gdGhlIGdyZW5hZGUgbGF1bmNoZXIuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVycyBpcyBOT1QgcGxheWFibGUgaW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCA2JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkppbGwgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaHJpcyBSZWRmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlNoZXJyeSBCaXJraW5cIixcclxuICAgICAgICAgICAgXCJIZWxlbmEgSGFycGVyXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEphcGFuZXNlIEFuaW1lICYgTWFuZ2FcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSAxOTg4IGZpbG0gJnF1b3Q7QWtpcmEmcXVvdDssIFRldHN1byBlbmRzIHVwIGRlc3Ryb3lpbmcgVG9reW8uXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VvZ3JhcGh5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGJvZHkgb2YgdGhlIEVneXB0aWFuIFNwaGlueCB3YXMgYmFzZWQgb24gd2hpY2ggYW5pbWFsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJ1bGxcIixcclxuICAgICAgICAgICAgXCJIb3JzZVwiLFxyXG4gICAgICAgICAgICBcIkRvZ1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiByZWxhdGlvbiB0byB0aGUgQnJpdGlzaCBPY2N1cGF0aW9uIGluIElyZWxhbmQsIHdoYXQgZG9lcyB0aGUgSVJBIHN0YW5kIGZvci5cIixcclxuICAgICAgICBcImFcIjogXCJJcmlzaCBSZXB1YmxpY2FuIEFybXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIklyaXNoIFJlYmVsIEFsbGlhbmNlXCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmVmb3JtYXRpb24gQXJteVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoLVJveWFsIEFsbGlhbmNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHJvYm90IGluIHRoZSAxOTUxIHNjaWVuY2UgZmljdGlvbiBmaWxtIGNsYXNzaWMgJiMwMzk7VGhlIERheSB0aGUgRWFydGggU3Rvb2QgU3RpbGwmIzAzOTs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR29ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUm9iYnlcIixcclxuICAgICAgICAgICAgXCJDb2xvc3N1c1wiLFxyXG4gICAgICAgICAgICBcIkJveFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgUm9tYW4gbnVtZXJhbCBmb3IgNTAwP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxcIixcclxuICAgICAgICAgICAgXCJDXCIsXHJcbiAgICAgICAgICAgIFwiWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIG1haW4gaGVhbGluZyBpdGVtIGluIERhcmsgU291bHM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRXN0dXMgRmxhc2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhlYWx0aCBQb3Rpb25cIixcclxuICAgICAgICAgICAgXCJPcmFuZ2UgSnVpY2VcIixcclxuICAgICAgICAgICAgXCJBc2hlbiBGbGFza1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIk9uIHdoaWNoIGNvbXB1dGVyIGhhcmR3YXJlIGRldmljZSBpcyB0aGUgQklPUyBjaGlwIGxvY2F0ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTW90aGVyYm9hcmRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcmQgRGlzayBEcml2ZVwiLFxyXG4gICAgICAgICAgICBcIkNlbnRyYWwgUHJvY2Vzc2luZyBVbml0XCIsXHJcbiAgICAgICAgICAgIFwiR3JhcGhpY3MgUHJvY2Vzc2luZyBVbml0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJBIHVuaXZlcnNhbCBzZXQsIG9yIGEgc2V0IHRoYXQgY29udGFpbnMgYWxsIHNldHMsIGV4aXN0cy5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQWNlIEF0dG9ybmV5IHRyaWxvZ3kgd2FzIHN1cHBvc2UgdG8gZW5kIHdpdGggJnF1b3Q7UGhvZW5peCBXcmlnaHQ6IEFjZSBBdHRvcm5leSAmbWludXM7IFRyaWFscyBhbmQgVHJpYnVsYXRpb25zJnF1b3Q7IGFzIGl0cyBmaW5hbCBnYW1lLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgaGlnaGVzdCBiZWx0IHlvdSBjYW4gZ2V0IGluIFRhZWt3b25kbz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiV2hpdGVcIixcclxuICAgICAgICAgICAgXCJSZWRcIixcclxuICAgICAgICAgICAgXCJHcmVlblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgVW5pdGVkIFN0YXRlcyBEZXBhcnRtZW50IG9mIEhvbWVsYW5kIFNlY3VyaXR5IHdhcyBmb3JtZWQgaW4gcmVzcG9uc2UgdG8gdGhlIFNlcHRlbWJlciAxMXRoIGF0dGFja3MuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQXBvbGxvIG1pc3Npb24gd2FzIHRoZSBsYXN0IG9uZSBpbiBOQVNBJiMwMzk7cyBBcG9sbG8gcHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJBcG9sbG8gMTdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwb2xsbyAxM1wiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxMVwiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgaXMgYW4gZXhpc3RpbmcgZmFtaWx5IGluICZxdW90O1RoZSBTaW1zJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBHb3RoIEZhbWlseVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBTaW1vbGVvbiBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgUHJvdWQgRmFtaWx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgTnVjbGVhciBUaHJvbmUsIHdoYXQgb3JnYW5pemF0aW9uIGNoYXNlcyB0aGUgcGxheWVyIGNoYXJhY3RlciB0aHJvdWdob3V0IHRoZSBnYW1lP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBJLkQuUC5EXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmlzaG1lblwiLFxyXG4gICAgICAgICAgICBcIlRoZSBCYW5kaXRzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFkuVi5HLkdcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lICZxdW90O0NhdmUgU3RvcnksJnF1b3Q7IHdoYXQgaXMgdGhlIGNoYXJhY3RlciBCYWxyb2cmIzAzOTtzIGNhdGNocGhyYXNlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkh1enphaCFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlllcyFcIixcclxuICAgICAgICAgICAgXCJXaG9hIHRoZXJlIVwiLFxyXG4gICAgICAgICAgICBcIk55ZWggaGVoIGhlaCFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiVmVoaWNsZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvbmUgb2YgdGhlc2UgY2hhc3NpcyBjb2RlcyBhcmUgdXNlZCBieSBCTVcgMy1zZXJpZXM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRTQ2XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFMzlcIixcclxuICAgICAgICAgICAgXCJFODVcIixcclxuICAgICAgICAgICAgXCJGMTBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ29taWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gd2hhdCBIb21lc3R1Y2sgVXBkYXRlIHdhcyBbU10gR2FtZSBPdmVyIHJlbGVhc2VkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk9jdG9iZXIgMjV0aCwgMjAxNFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXByaWwgMTN0aCwgMjAwOVwiLFxyXG4gICAgICAgICAgICBcIkFwcmlsIDh0aCwgMjAxMlwiLFxyXG4gICAgICAgICAgICBcIkF1Z3VzdCAyOHRoLCAyMDAzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgYmFuZCBtZW1iZXJzIG9mIEFtZXJpY2FuIHJvY2sgYmFuZCBLaW5nIG9mIExlb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQnJvdGhlcnMgJmFtcDsgY291c2luc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hpbGRob29kIGZyaWVuZHNcIixcclxuICAgICAgICAgICAgXCJGb3JtZXIgY2xhc3NtYXRlc1wiLFxyXG4gICAgICAgICAgICBcIkZyYXRlcm5pdHkgaG91c2UgbWVtYmVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZnJhbmNoaXNlIGhhZCBhIHNwZWNpYWwgZXZlbnQgaG9zdGVkIGluIHRoZSBwb3B1bGFyIE1NT1JQRyBGaW5hbCBGYW50YXN5IFhJVjogQSBSZWFsbSBSZWJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiWW8ta2FpIFdhdGNoXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJQb2smZWFjdXRlO21vblwiLFxyXG4gICAgICAgICAgICBcIll1LWdpLW9oXCIsXHJcbiAgICAgICAgICAgIFwiQnVkZHlmaWdodFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEtpbmdkb20gSGVhcnRzIGdhbWUgZmVhdHVyZWQgdGhlIGNhc3Qgb2YgJnF1b3Q7VGhlIFdvcmxkIEVuZHMgV2l0aCBZb3UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRHJlYW0gRHJvcCBEaXN0YW5jZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQmlydGggQnkgU2xlZXBcIixcclxuICAgICAgICAgICAgXCIzNjUvMiBEYXlzXCIsXHJcbiAgICAgICAgICAgIFwiUmU6Q2hhaW4gb2YgTWVtb3JpZXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBsYXJnZXN0IHBsYW5ldCBpbiBLZXJiYWwgU3BhY2UgUHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJKb29sXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFZWxvb1wiLFxyXG4gICAgICAgICAgICBcIktlcmJvbFwiLFxyXG4gICAgICAgICAgICBcIk1pbm11c1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFuaW1hbCBDcm9zc2luZyBnYW1lIHdhcyBmb3IgdGhlIE5pbnRlbmRvIFdpaT9cIixcclxuICAgICAgICBcImFcIjogXCJBbmltYWwgQ3Jvc3Npbmc6IENpdHkgRm9sa1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBOZXcgTGVhZlwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogV2lsZCBXb3JsZFwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogUG9wdWxhdGlvbiBHcm93aW5nIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJHZW9yZ2UgTHVjYXMgZGlyZWN0ZWQgdGhlIGVudGlyZSBvcmlnaW5hbCBTdGFyIFdhcnMgdHJpbG9neS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIGNpdHkgb2YgUm9tZSwgSXRhbHkgZm91bmRlZD9cIixcclxuICAgICAgICBcImFcIjogXCI3NTMgQkNFXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCI5MDIgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNTI0IEJDRVwiLFxyXG4gICAgICAgICAgICBcIjY5NyBCQ0VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZGF0YSBzdHJ1Y3R1cmUgZG9lcyBGSUxPIGFwcGx5IHRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlN0YWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJRdWV1ZVwiLFxyXG4gICAgICAgICAgICBcIkhlYXBcIixcclxuICAgICAgICAgICAgXCJUcmVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEJhdHRsZXN0YXIgR2FsYWN0aWNhICgyMDA0KSwgQ3lsb25zIHdlcmUgY3JlYXRlZCBieSBtYW4gYXMgY3liZXJuZXRpYyB3b3JrZXJzIGFuZCBzb2xkaWVycy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIDIwMTYgRGlzbmV5IGFuaW1hdGVkIGZpbG0gJiMwMzk7TW9hbmEmIzAzOTsgaXMgYmFzZWQgb24gd2hpY2ggY3VsdHVyZT9cIixcclxuICAgICAgICBcImFcIjogXCJQb2x5bmVzaWFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJOYXRpdmUgQW1lcmljYW5cIixcclxuICAgICAgICAgICAgXCJKYXBhbmVzZVwiLFxyXG4gICAgICAgICAgICBcIk5vcmRpY1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNha2UgZGVwaWN0ZWQgaW4gVmFsdmUmIzAzOTtzICZxdW90O1BvcnRhbCZxdW90OyBmcmFuY2hpc2UgbW9zdCBjbG9zZWx5IHJlc2VtYmxlcyB3aGljaCByZWFsLXdvcmxkIHR5cGUgb2YgY2FrZT9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFjayBGb3Jlc3RcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkRldmlsJiMwMzk7cyBGb29kXCIsXHJcbiAgICAgICAgICAgIFwiTW9sdGVuIENob2NvbGF0ZVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbiBDaG9jb2xhdGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZSAmIE5hdHVyZVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNoZW1pY2FsIGVsZW1lbnQgTGl0aGl1bSBpcyBuYW1lZCBhZnRlciB0aGUgY291bnRyeSBvZiBMaXRodWFuaWEuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogR2FkZ2V0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBEVkQgaW52ZW50ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk5NVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAwMFwiLFxyXG4gICAgICAgICAgICBcIjE5OTBcIixcclxuICAgICAgICAgICAgXCIxOTgwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGZ1bGwgbmFtZSBvZiB0aGUgZm9vdGJhbGxlciAmcXVvdDtDcmlzdGlhbm8gUm9uYWxkbyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJDcmlzdGlhbm8gUm9uYWxkbyBkb3MgU2FudG9zIEF2ZWlyb1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIFJvbmFsZG8gbG9zIFNhbnRvcyBEaWVnb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBBcm1hbmRvIERpZWdvIFJvbmFsZG9cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gTHVpcyBBcm1hbmRvIFJvbmFsZG9cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZXNlIHR3byBjb3VudHJpZXMgaGVsZCBhIGNvbW1vbndlYWx0aCBmcm9tIHRoZSAxNnRoIHRvIDE4dGggY2VudHVyeS5cIixcclxuICAgICAgICBcImFcIjogXCJQb2xhbmQgYW5kIExpdGh1YW5pYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSHV0dSBhbmQgUndhbmRhXCIsXHJcbiAgICAgICAgICAgIFwiTm9ydGggS29yZWEgYW5kIFNvdXRoIEtvcmVhXCIsXHJcbiAgICAgICAgICAgIFwiQmFuZ2xhZGVzaCBhbmQgQmh1dGFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtDYWxsIE9mIER1dHk6IFpvbWJpZXMmcXVvdDssIGNvbXBsZXRpbmcgd2hpY2ggbWFwJiMwMzk7cyBtYWluIGVhc3RlciBlZ2cgd2lsbCByZXdhcmQgeW91IHdpdGggdGhlIGFjaGlldmVtZW50LCAmcXVvdDtIaWdoIE1haW50ZW5hbmNlJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRpZSBSaXNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNb2IgT2YgVGhlIERlYWRcIixcclxuICAgICAgICAgICAgXCJPcmlnaW5zXCIsXHJcbiAgICAgICAgICAgIFwiQXNjZW5zaW9uXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENhcnRvb24gJiBBbmltYXRpb25zXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7R3Jhdml0eSBGYWxscyZxdW90OywgaG93IG11Y2ggZG9lcyBXYWRkbGVzIHdlaWdoIHdoZW4gTWFibGUgd2lucyBoaW0gaW4gJnF1b3Q7VGhlIFRpbWUgVHJhdmVsZXImIzAzOTtzIFBpZyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCIxNSBwb3VuZHNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjEwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjMwIHBvdW5kc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIGdpdmVuIHRvIGxheWVyIDQgb2YgdGhlIE9wZW4gU3lzdGVtcyBJbnRlcmNvbm5lY3Rpb24gKElTTykgbW9kZWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJhbnNwb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJTZXNzaW9uXCIsXHJcbiAgICAgICAgICAgIFwiRGF0YSBsaW5rXCIsXHJcbiAgICAgICAgICAgIFwiTmV0d29ya1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgeWVhciB3YXMgaG9ja2V5IGxlZ2VuZCBXYXluZSBHcmV0emt5IGJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk2MVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMTk2NVwiLFxyXG4gICAgICAgICAgICBcIjE5NTlcIixcclxuICAgICAgICAgICAgXCIxOTYzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJIb3cgbWFueSBnYW1lcyBhcmUgdGhlcmUgaW4gdGhlICZxdW90O0NvbG9ueSBXYXJzJnF1b3Q7IHNlcmllcyBmb3IgdGhlIFBsYXlTdGF0aW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjJcIixcclxuICAgICAgICAgICAgXCI0XCIsXHJcbiAgICAgICAgICAgIFwiNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIFdvcmxkIG9mIFdhcmNyYWZ0LCB3aGljaCByYWlkIGluc3RhbmNlIGZlYXR1cmVzIGEgY2hlc3MgZXZlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiS2FyYXpoYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlp1bCYjMDM5O0FtYW5cIixcclxuICAgICAgICAgICAgXCJCbGFja3dpbmcgTGFpclwiLFxyXG4gICAgICAgICAgICBcIlRlbXBsZSBvZiBBaG4mIzAzOTtRaXJhalwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggY291bnRyeSB3YXMgSm9zZWYgU3RhbGluIGJvcm4gaW4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR2VvcmdpYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUnVzc2lhXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFueVwiLFxyXG4gICAgICAgICAgICBcIlBvbGFuZFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG9mZmljaWFsIG5hbWUgb2YgUHJpbmNlJiMwMzk7cyBiYWNraW5nIGJhbmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIFJldm9sdXRpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBQYXVwZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFdhaWxlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgSGVhcnRicmVha2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiBHYW1lIG9mIFRocm9uZXMgd2hhdCBpcyB0aGUgbmFtZSBvZiBKb24gU25vdyYjMDM5O3Mgc3dvcmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9uZ2NsYXdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk9hdGhrZWVwZXJcIixcclxuICAgICAgICAgICAgXCJXaWRvdyYjMDM5O3MgV2FpbFwiLFxyXG4gICAgICAgICAgICBcIk5lZWRsZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBpbnNwZWN0b3IgaW4gdGhlIHNlcmllcyAmcXVvdDtPbiB0aGUgQnVzZXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxha2V5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJwZXJcIixcclxuICAgICAgICAgICAgXCJOYWlseVwiLFxyXG4gICAgICAgICAgICBcIkdhbGx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBhcnRpc3QgY3VyYXRlZCB0aGUgb2ZmaWNpYWwgc291bmR0cmFjayBmb3IgJnF1b3Q7VGhlIEh1bmdlciBHYW1lczogTW9ja2luZ2pheSAtIFBhcnQgMSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJMb3JkZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiS2FueWUgV2VzdFwiLFxyXG4gICAgICAgICAgICBcIlRvdmUgTG9cIixcclxuICAgICAgICAgICAgXCJDaGFybGkgWENYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIENhbmFkaWFuICQxIGNvaW4gaXMgY29sbG9xdWlhbGx5IGtub3duIGFzIGEgd2hhdD9cIixcclxuICAgICAgICBcImFcIjogXCJMb29uaWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIkZvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIk1vb2RpZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGVzZSBmb3VuZGluZyBmYXRoZXJzIG9mIHRoZSBVbml0ZWQgU3RhdGVzIG9mIEFtZXJpY2EgbGF0ZXIgYmVjYW1lIHByZXNpZGVudD9cIixcclxuICAgICAgICBcImFcIjogXCJKYW1lcyBNb25yb2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFsZXhhbmRlciBIYW1pbHRvblwiLFxyXG4gICAgICAgICAgICBcIlNhbXVlbCBBZGFtc1wiLFxyXG4gICAgICAgICAgICBcIlJvZ2VyIFNoZXJtYW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBEaXZpbml0eTogT3JpZ2luYWwgU2luIElJLCB3aGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxvaHNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFJlZCBQcmluY2VcIixcclxuICAgICAgICAgICAgXCJUaGVyZSBhcmUgbm8gc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3RlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaG8gaXMgdGhlIG1haW4gcHJvdGFnb25pc3QgaW4gdGhlIGdhbWUgTGlmZSBpcyBTdHJhbmdlOiBCZWZvcmUgVGhlIFN0b3JtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNobG9lIFByaWNlIFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTWF4IENhdWxmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlJhY2hlbCBBbWJlclwiLFxyXG4gICAgICAgICAgICBcIkZyYW5rIEJvd2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJKb2hubnkgRGVwcCBtYWRlIGhpcyBiaWctc2NyZWVuIGFjdGluZyBkZWJ1dCBpbiB3aGljaCBmaWxtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkEgTmlnaHRtYXJlIG9uIEVsbSBTdHJlZXRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk15IEJsb29keSBWYWxlbnRpbmVcIixcclxuICAgICAgICAgICAgXCJIYWxsb3dlZW5cIixcclxuICAgICAgICAgICAgXCJGcmlkYXkgdGhlIDEzdGhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCZxdW90Oywgb25seSBDaHJpcyBoYXMgYWNjZXNzIHRvIHRoZSBncmVuYWRlIGxhdW5jaGVyLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcnMgaXMgTk9UIHBsYXlhYmxlIGluICZxdW90O1Jlc2lkZW50IEV2aWwgNiZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJKaWxsIFZhbGVudGluZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hyaXMgUmVkZmllbGRcIixcclxuICAgICAgICAgICAgXCJTaGVycnkgQmlya2luXCIsXHJcbiAgICAgICAgICAgIFwiSGVsZW5hIEhhcnBlclwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBKYXBhbmVzZSBBbmltZSAmIE1hbmdhXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgMTk4OCBmaWxtICZxdW90O0FraXJhJnF1b3Q7LCBUZXRzdW8gZW5kcyB1cCBkZXN0cm95aW5nIFRva3lvLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlb2dyYXBoeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBib2R5IG9mIHRoZSBFZ3lwdGlhbiBTcGhpbnggd2FzIGJhc2VkIG9uIHdoaWNoIGFuaW1hbD9cIixcclxuICAgICAgICBcImFcIjogXCJMaW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCdWxsXCIsXHJcbiAgICAgICAgICAgIFwiSG9yc2VcIixcclxuICAgICAgICAgICAgXCJEb2dcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gcmVsYXRpb24gdG8gdGhlIEJyaXRpc2ggT2NjdXBhdGlvbiBpbiBJcmVsYW5kLCB3aGF0IGRvZXMgdGhlIElSQSBzdGFuZCBmb3IuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSXJpc2ggUmVwdWJsaWNhbiBBcm15XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWJlbCBBbGxpYW5jZVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoIFJlZm9ybWF0aW9uIEFybXlcIixcclxuICAgICAgICAgICAgXCJJcmlzaC1Sb3lhbCBBbGxpYW5jZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSByb2JvdCBpbiB0aGUgMTk1MSBzY2llbmNlIGZpY3Rpb24gZmlsbSBjbGFzc2ljICYjMDM5O1RoZSBEYXkgdGhlIEVhcnRoIFN0b29kIFN0aWxsJiMwMzk7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJvYmJ5XCIsXHJcbiAgICAgICAgICAgIFwiQ29sb3NzdXNcIixcclxuICAgICAgICAgICAgXCJCb3hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIFJvbWFuIG51bWVyYWwgZm9yIDUwMD9cIixcclxuICAgICAgICBcImFcIjogXCJEXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMXCIsXHJcbiAgICAgICAgICAgIFwiQ1wiLFxyXG4gICAgICAgICAgICBcIlhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBtYWluIGhlYWxpbmcgaXRlbSBpbiBEYXJrIFNvdWxzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkVzdHVzIEZsYXNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIZWFsdGggUG90aW9uXCIsXHJcbiAgICAgICAgICAgIFwiT3JhbmdlIEp1aWNlXCIsXHJcbiAgICAgICAgICAgIFwiQXNoZW4gRmxhc2tcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJPbiB3aGljaCBjb21wdXRlciBoYXJkd2FyZSBkZXZpY2UgaXMgdGhlIEJJT1MgY2hpcCBsb2NhdGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk1vdGhlcmJvYXJkXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJkIERpc2sgRHJpdmVcIixcclxuICAgICAgICAgICAgXCJDZW50cmFsIFByb2Nlc3NpbmcgVW5pdFwiLFxyXG4gICAgICAgICAgICBcIkdyYXBoaWNzIFByb2Nlc3NpbmcgVW5pdFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiQSB1bml2ZXJzYWwgc2V0LCBvciBhIHNldCB0aGF0IGNvbnRhaW5zIGFsbCBzZXRzLCBleGlzdHMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIEFjZSBBdHRvcm5leSB0cmlsb2d5IHdhcyBzdXBwb3NlIHRvIGVuZCB3aXRoICZxdW90O1Bob2VuaXggV3JpZ2h0OiBBY2UgQXR0b3JuZXkgJm1pbnVzOyBUcmlhbHMgYW5kIFRyaWJ1bGF0aW9ucyZxdW90OyBhcyBpdHMgZmluYWwgZ2FtZS5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGhpZ2hlc3QgYmVsdCB5b3UgY2FuIGdldCBpbiBUYWVrd29uZG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIldoaXRlXCIsXHJcbiAgICAgICAgICAgIFwiUmVkXCIsXHJcbiAgICAgICAgICAgIFwiR3JlZW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIFVuaXRlZCBTdGF0ZXMgRGVwYXJ0bWVudCBvZiBIb21lbGFuZCBTZWN1cml0eSB3YXMgZm9ybWVkIGluIHJlc3BvbnNlIHRvIHRoZSBTZXB0ZW1iZXIgMTF0aCBhdHRhY2tzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFwb2xsbyBtaXNzaW9uIHdhcyB0aGUgbGFzdCBvbmUgaW4gTkFTQSYjMDM5O3MgQXBvbGxvIHByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQXBvbGxvIDE3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTNcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTFcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGlzIGFuIGV4aXN0aW5nIGZhbWlseSBpbiAmcXVvdDtUaGUgU2ltcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgR290aCBGYW1pbHlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgU2ltb2xlb24gRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFByb3VkIEZhbWlseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lIE51Y2xlYXIgVGhyb25lLCB3aGF0IG9yZ2FuaXphdGlvbiBjaGFzZXMgdGhlIHBsYXllciBjaGFyYWN0ZXIgdGhyb3VnaG91dCB0aGUgZ2FtZT9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgSS5ELlAuRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZpc2htZW5cIixcclxuICAgICAgICAgICAgXCJUaGUgQmFuZGl0c1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBZLlYuRy5HXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSAmcXVvdDtDYXZlIFN0b3J5LCZxdW90OyB3aGF0IGlzIHRoZSBjaGFyYWN0ZXIgQmFscm9nJiMwMzk7cyBjYXRjaHBocmFzZT9cIixcclxuICAgICAgICBcImFcIjogXCJIdXp6YWghXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJZZXMhXCIsXHJcbiAgICAgICAgICAgIFwiV2hvYSB0aGVyZSFcIixcclxuICAgICAgICAgICAgXCJOeWVoIGhlaCBoZWghXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlZlaGljbGVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb25lIG9mIHRoZXNlIGNoYXNzaXMgY29kZXMgYXJlIHVzZWQgYnkgQk1XIDMtc2VyaWVzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkU0NlwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRTM5XCIsXHJcbiAgICAgICAgICAgIFwiRTg1XCIsXHJcbiAgICAgICAgICAgIFwiRjEwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENvbWljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHdoYXQgSG9tZXN0dWNrIFVwZGF0ZSB3YXMgW1NdIEdhbWUgT3ZlciByZWxlYXNlZD9cIixcclxuICAgICAgICBcImFcIjogXCJPY3RvYmVyIDI1dGgsIDIwMTRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwcmlsIDEzdGgsIDIwMDlcIixcclxuICAgICAgICAgICAgXCJBcHJpbCA4dGgsIDIwMTJcIixcclxuICAgICAgICAgICAgXCJBdWd1c3QgMjh0aCwgMjAwM1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIGJhbmQgbWVtYmVycyBvZiBBbWVyaWNhbiByb2NrIGJhbmQgS2luZyBvZiBMZW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJyb3RoZXJzICZhbXA7IGNvdXNpbnNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNoaWxkaG9vZCBmcmllbmRzXCIsXHJcbiAgICAgICAgICAgIFwiRm9ybWVyIGNsYXNzbWF0ZXNcIixcclxuICAgICAgICAgICAgXCJGcmF0ZXJuaXR5IGhvdXNlIG1lbWJlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGZyYW5jaGlzZSBoYWQgYSBzcGVjaWFsIGV2ZW50IGhvc3RlZCBpbiB0aGUgcG9wdWxhciBNTU9SUEcgRmluYWwgRmFudGFzeSBYSVY6IEEgUmVhbG0gUmVib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIllvLWthaSBXYXRjaFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUG9rJmVhY3V0ZTttb25cIixcclxuICAgICAgICAgICAgXCJZdS1naS1vaFwiLFxyXG4gICAgICAgICAgICBcIkJ1ZGR5ZmlnaHRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBLaW5nZG9tIEhlYXJ0cyBnYW1lIGZlYXR1cmVkIHRoZSBjYXN0IG9mICZxdW90O1RoZSBXb3JsZCBFbmRzIFdpdGggWW91JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRyZWFtIERyb3AgRGlzdGFuY2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJpcnRoIEJ5IFNsZWVwXCIsXHJcbiAgICAgICAgICAgIFwiMzY1LzIgRGF5c1wiLFxyXG4gICAgICAgICAgICBcIlJlOkNoYWluIG9mIE1lbW9yaWVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbGFyZ2VzdCBwbGFuZXQgaW4gS2VyYmFsIFNwYWNlIFByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSm9vbFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRWVsb29cIixcclxuICAgICAgICAgICAgXCJLZXJib2xcIixcclxuICAgICAgICAgICAgXCJNaW5tdXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBbmltYWwgQ3Jvc3NpbmcgZ2FtZSB3YXMgZm9yIHRoZSBOaW50ZW5kbyBXaWk/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQW5pbWFsIENyb3NzaW5nOiBDaXR5IEZvbGtcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogTmV3IExlYWZcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFdpbGQgV29ybGRcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFBvcHVsYXRpb24gR3Jvd2luZyFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiR2VvcmdlIEx1Y2FzIGRpcmVjdGVkIHRoZSBlbnRpcmUgb3JpZ2luYWwgU3RhciBXYXJzIHRyaWxvZ3kuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBjaXR5IG9mIFJvbWUsIEl0YWx5IGZvdW5kZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiNzUzIEJDRVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiOTAyIEJDRVwiLFxyXG4gICAgICAgICAgICBcIjUyNCBCQ0VcIixcclxuICAgICAgICAgICAgXCI2OTcgQkNFXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGRhdGEgc3RydWN0dXJlIGRvZXMgRklMTyBhcHBseSB0bz9cIixcclxuICAgICAgICBcImFcIjogXCJTdGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUXVldWVcIixcclxuICAgICAgICAgICAgXCJIZWFwXCIsXHJcbiAgICAgICAgICAgIFwiVHJlZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBCYXR0bGVzdGFyIEdhbGFjdGljYSAoMjAwNCksIEN5bG9ucyB3ZXJlIGNyZWF0ZWQgYnkgbWFuIGFzIGN5YmVybmV0aWMgd29ya2VycyBhbmQgc29sZGllcnMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSAyMDE2IERpc25leSBhbmltYXRlZCBmaWxtICYjMDM5O01vYW5hJiMwMzk7IGlzIGJhc2VkIG9uIHdoaWNoIGN1bHR1cmU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9seW5lc2lhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTmF0aXZlIEFtZXJpY2FuXCIsXHJcbiAgICAgICAgICAgIFwiSmFwYW5lc2VcIixcclxuICAgICAgICAgICAgXCJOb3JkaWNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjYWtlIGRlcGljdGVkIGluIFZhbHZlJiMwMzk7cyAmcXVvdDtQb3J0YWwmcXVvdDsgZnJhbmNoaXNlIG1vc3QgY2xvc2VseSByZXNlbWJsZXMgd2hpY2ggcmVhbC13b3JsZCB0eXBlIG9mIGNha2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2sgRm9yZXN0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJEZXZpbCYjMDM5O3MgRm9vZFwiLFxyXG4gICAgICAgICAgICBcIk1vbHRlbiBDaG9jb2xhdGVcIixcclxuICAgICAgICAgICAgXCJHZXJtYW4gQ2hvY29sYXRlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2UgJiBOYXR1cmVcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjaGVtaWNhbCBlbGVtZW50IExpdGhpdW0gaXMgbmFtZWQgYWZ0ZXIgdGhlIGNvdW50cnkgb2YgTGl0aHVhbmlhLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IEdhZGdldHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgRFZEIGludmVudGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5OTVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwMDBcIixcclxuICAgICAgICAgICAgXCIxOTkwXCIsXHJcbiAgICAgICAgICAgIFwiMTk4MFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBmdWxsIG5hbWUgb2YgdGhlIGZvb3RiYWxsZXIgJnF1b3Q7Q3Jpc3RpYW5vIFJvbmFsZG8mcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ3Jpc3RpYW5vIFJvbmFsZG8gZG9zIFNhbnRvcyBBdmVpcm9cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBSb25hbGRvIGxvcyBTYW50b3MgRGllZ29cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gQXJtYW5kbyBEaWVnbyBSb25hbGRvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEx1aXMgQXJtYW5kbyBSb25hbGRvXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGVzZSB0d28gY291bnRyaWVzIGhlbGQgYSBjb21tb253ZWFsdGggZnJvbSB0aGUgMTZ0aCB0byAxOHRoIGNlbnR1cnkuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9sYW5kIGFuZCBMaXRodWFuaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkh1dHUgYW5kIFJ3YW5kYVwiLFxyXG4gICAgICAgICAgICBcIk5vcnRoIEtvcmVhIGFuZCBTb3V0aCBLb3JlYVwiLFxyXG4gICAgICAgICAgICBcIkJhbmdsYWRlc2ggYW5kIEJodXRhblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7Q2FsbCBPZiBEdXR5OiBab21iaWVzJnF1b3Q7LCBjb21wbGV0aW5nIHdoaWNoIG1hcCYjMDM5O3MgbWFpbiBlYXN0ZXIgZWdnIHdpbGwgcmV3YXJkIHlvdSB3aXRoIHRoZSBhY2hpZXZlbWVudCwgJnF1b3Q7SGlnaCBNYWludGVuYW5jZSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEaWUgUmlzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTW9iIE9mIFRoZSBEZWFkXCIsXHJcbiAgICAgICAgICAgIFwiT3JpZ2luc1wiLFxyXG4gICAgICAgICAgICBcIkFzY2Vuc2lvblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDYXJ0b29uICYgQW5pbWF0aW9uc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0dyYXZpdHkgRmFsbHMmcXVvdDssIGhvdyBtdWNoIGRvZXMgV2FkZGxlcyB3ZWlnaCB3aGVuIE1hYmxlIHdpbnMgaGltIGluICZxdW90O1RoZSBUaW1lIFRyYXZlbGVyJiMwMzk7cyBQaWcmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTUgcG91bmRzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIxMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIzMCBwb3VuZHNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBnaXZlbiB0byBsYXllciA0IG9mIHRoZSBPcGVuIFN5c3RlbXMgSW50ZXJjb25uZWN0aW9uIChJU08pIG1vZGVsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRyYW5zcG9ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiU2Vzc2lvblwiLFxyXG4gICAgICAgICAgICBcIkRhdGEgbGlua1wiLFxyXG4gICAgICAgICAgICBcIk5ldHdvcmtcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IHllYXIgd2FzIGhvY2tleSBsZWdlbmQgV2F5bmUgR3JldHpreSBib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5NjFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjE5NjVcIixcclxuICAgICAgICAgICAgXCIxOTU5XCIsXHJcbiAgICAgICAgICAgIFwiMTk2M1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSG93IG1hbnkgZ2FtZXMgYXJlIHRoZXJlIGluIHRoZSAmcXVvdDtDb2xvbnkgV2FycyZxdW90OyBzZXJpZXMgZm9yIHRoZSBQbGF5U3RhdGlvbj9cIixcclxuICAgICAgICBcImFcIjogXCIzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyXCIsXHJcbiAgICAgICAgICAgIFwiNFwiLFxyXG4gICAgICAgICAgICBcIjVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiBXb3JsZCBvZiBXYXJjcmFmdCwgd2hpY2ggcmFpZCBpbnN0YW5jZSBmZWF0dXJlcyBhIGNoZXNzIGV2ZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkthcmF6aGFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJadWwmIzAzOTtBbWFuXCIsXHJcbiAgICAgICAgICAgIFwiQmxhY2t3aW5nIExhaXJcIixcclxuICAgICAgICAgICAgXCJUZW1wbGUgb2YgQWhuJiMwMzk7UWlyYWpcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGNvdW50cnkgd2FzIEpvc2VmIFN0YWxpbiBib3JuIGluP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdlb3JnaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJ1c3NpYVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbnlcIixcclxuICAgICAgICAgICAgXCJQb2xhbmRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBvZmZpY2lhbCBuYW1lIG9mIFByaW5jZSYjMDM5O3MgYmFja2luZyBiYW5kP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBSZXZvbHV0aW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgUGF1cGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBXYWlsZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEhlYXJ0YnJlYWtlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gR2FtZSBvZiBUaHJvbmVzIHdoYXQgaXMgdGhlIG5hbWUgb2YgSm9uIFNub3cmIzAzOTtzIHN3b3JkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvbmdjbGF3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJPYXRoa2VlcGVyXCIsXHJcbiAgICAgICAgICAgIFwiV2lkb3cmIzAzOTtzIFdhaWxcIixcclxuICAgICAgICAgICAgXCJOZWVkbGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgaW5zcGVjdG9yIGluIHRoZSBzZXJpZXMgJnF1b3Q7T24gdGhlIEJ1c2VzJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWtleVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFycGVyXCIsXHJcbiAgICAgICAgICAgIFwiTmFpbHlcIixcclxuICAgICAgICAgICAgXCJHYWxseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggYXJ0aXN0IGN1cmF0ZWQgdGhlIG9mZmljaWFsIHNvdW5kdHJhY2sgZm9yICZxdW90O1RoZSBIdW5nZXIgR2FtZXM6IE1vY2tpbmdqYXkgLSBQYXJ0IDEmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9yZGVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkthbnllIFdlc3RcIixcclxuICAgICAgICAgICAgXCJUb3ZlIExvXCIsXHJcbiAgICAgICAgICAgIFwiQ2hhcmxpIFhDWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBDYW5hZGlhbiAkMSBjb2luIGlzIGNvbGxvcXVpYWxseSBrbm93biBhcyBhIHdoYXQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9vbmllXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCb29saWVcIixcclxuICAgICAgICAgICAgXCJGb29saWVcIixcclxuICAgICAgICAgICAgXCJNb29kaWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlc2UgZm91bmRpbmcgZmF0aGVycyBvZiB0aGUgVW5pdGVkIFN0YXRlcyBvZiBBbWVyaWNhIGxhdGVyIGJlY2FtZSBwcmVzaWRlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmFtZXMgTW9ucm9lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbGV4YW5kZXIgSGFtaWx0b25cIixcclxuICAgICAgICAgICAgXCJTYW11ZWwgQWRhbXNcIixcclxuICAgICAgICAgICAgXCJSb2dlciBTaGVybWFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gRGl2aW5pdHk6IE9yaWdpbmFsIFNpbiBJSSwgd2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3Rlcj9cIixcclxuICAgICAgICBcImFcIjogXCJGYW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMb2hzZVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBSZWQgUHJpbmNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlcmUgYXJlIG5vIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hvIGlzIHRoZSBtYWluIHByb3RhZ29uaXN0IGluIHRoZSBnYW1lIExpZmUgaXMgU3RyYW5nZTogQmVmb3JlIFRoZSBTdG9ybT9cIixcclxuICAgICAgICBcImFcIjogXCJDaGxvZSBQcmljZSBcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1heCBDYXVsZmllbGRcIixcclxuICAgICAgICAgICAgXCJSYWNoZWwgQW1iZXJcIixcclxuICAgICAgICAgICAgXCJGcmFuayBCb3dlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSm9obm55IERlcHAgbWFkZSBoaXMgYmlnLXNjcmVlbiBhY3RpbmcgZGVidXQgaW4gd2hpY2ggZmlsbT9cIixcclxuICAgICAgICBcImFcIjogXCJBIE5pZ2h0bWFyZSBvbiBFbG0gU3RyZWV0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNeSBCbG9vZHkgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgICAgIFwiSGFsbG93ZWVuXCIsXHJcbiAgICAgICAgICAgIFwiRnJpZGF5IHRoZSAxM3RoXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O1Jlc2lkZW50IEV2aWwmcXVvdDssIG9ubHkgQ2hyaXMgaGFzIGFjY2VzcyB0byB0aGUgZ3JlbmFkZSBsYXVuY2hlci5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXJzIGlzIE5PVCBwbGF5YWJsZSBpbiAmcXVvdDtSZXNpZGVudCBFdmlsIDYmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmlsbCBWYWxlbnRpbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNocmlzIFJlZGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiU2hlcnJ5IEJpcmtpblwiLFxyXG4gICAgICAgICAgICBcIkhlbGVuYSBIYXJwZXJcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogSmFwYW5lc2UgQW5pbWUgJiBNYW5nYVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIDE5ODggZmlsbSAmcXVvdDtBa2lyYSZxdW90OywgVGV0c3VvIGVuZHMgdXAgZGVzdHJveWluZyBUb2t5by5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW9ncmFwaHlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgYm9keSBvZiB0aGUgRWd5cHRpYW4gU3BoaW54IHdhcyBiYXNlZCBvbiB3aGljaCBhbmltYWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQnVsbFwiLFxyXG4gICAgICAgICAgICBcIkhvcnNlXCIsXHJcbiAgICAgICAgICAgIFwiRG9nXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHJlbGF0aW9uIHRvIHRoZSBCcml0aXNoIE9jY3VwYXRpb24gaW4gSXJlbGFuZCwgd2hhdCBkb2VzIHRoZSBJUkEgc3RhbmQgZm9yLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIklyaXNoIFJlcHVibGljYW4gQXJteVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmViZWwgQWxsaWFuY2VcIixcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWZvcm1hdGlvbiBBcm15XCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2gtUm95YWwgQWxsaWFuY2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgcm9ib3QgaW4gdGhlIDE5NTEgc2NpZW5jZSBmaWN0aW9uIGZpbG0gY2xhc3NpYyAmIzAzOTtUaGUgRGF5IHRoZSBFYXJ0aCBTdG9vZCBTdGlsbCYjMDM5Oz9cIixcclxuICAgICAgICBcImFcIjogXCJHb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSb2JieVwiLFxyXG4gICAgICAgICAgICBcIkNvbG9zc3VzXCIsXHJcbiAgICAgICAgICAgIFwiQm94XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBSb21hbiBudW1lcmFsIGZvciA1MDA/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTFwiLFxyXG4gICAgICAgICAgICBcIkNcIixcclxuICAgICAgICAgICAgXCJYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbWFpbiBoZWFsaW5nIGl0ZW0gaW4gRGFyayBTb3Vscz9cIixcclxuICAgICAgICBcImFcIjogXCJFc3R1cyBGbGFza1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGVhbHRoIFBvdGlvblwiLFxyXG4gICAgICAgICAgICBcIk9yYW5nZSBKdWljZVwiLFxyXG4gICAgICAgICAgICBcIkFzaGVuIEZsYXNrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiT24gd2hpY2ggY29tcHV0ZXIgaGFyZHdhcmUgZGV2aWNlIGlzIHRoZSBCSU9TIGNoaXAgbG9jYXRlZD9cIixcclxuICAgICAgICBcImFcIjogXCJNb3RoZXJib2FyZFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFyZCBEaXNrIERyaXZlXCIsXHJcbiAgICAgICAgICAgIFwiQ2VudHJhbCBQcm9jZXNzaW5nIFVuaXRcIixcclxuICAgICAgICAgICAgXCJHcmFwaGljcyBQcm9jZXNzaW5nIFVuaXRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkEgdW5pdmVyc2FsIHNldCwgb3IgYSBzZXQgdGhhdCBjb250YWlucyBhbGwgc2V0cywgZXhpc3RzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBBY2UgQXR0b3JuZXkgdHJpbG9neSB3YXMgc3VwcG9zZSB0byBlbmQgd2l0aCAmcXVvdDtQaG9lbml4IFdyaWdodDogQWNlIEF0dG9ybmV5ICZtaW51czsgVHJpYWxzIGFuZCBUcmlidWxhdGlvbnMmcXVvdDsgYXMgaXRzIGZpbmFsIGdhbWUuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBoaWdoZXN0IGJlbHQgeW91IGNhbiBnZXQgaW4gVGFla3dvbmRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJXaGl0ZVwiLFxyXG4gICAgICAgICAgICBcIlJlZFwiLFxyXG4gICAgICAgICAgICBcIkdyZWVuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBVbml0ZWQgU3RhdGVzIERlcGFydG1lbnQgb2YgSG9tZWxhbmQgU2VjdXJpdHkgd2FzIGZvcm1lZCBpbiByZXNwb25zZSB0byB0aGUgU2VwdGVtYmVyIDExdGggYXR0YWNrcy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBcG9sbG8gbWlzc2lvbiB3YXMgdGhlIGxhc3Qgb25lIGluIE5BU0EmIzAzOTtzIEFwb2xsbyBwcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFwb2xsbyAxN1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDEzXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDExXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDE1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBpcyBhbiBleGlzdGluZyBmYW1pbHkgaW4gJnF1b3Q7VGhlIFNpbXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEdvdGggRmFtaWx5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFNpbW9sZW9uIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBQcm91ZCBGYW1pbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSBOdWNsZWFyIFRocm9uZSwgd2hhdCBvcmdhbml6YXRpb24gY2hhc2VzIHRoZSBwbGF5ZXIgY2hhcmFjdGVyIHRocm91Z2hvdXQgdGhlIGdhbWU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEkuRC5QLkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGaXNobWVuXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEJhbmRpdHNcIixcclxuICAgICAgICAgICAgXCJUaGUgWS5WLkcuR1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgJnF1b3Q7Q2F2ZSBTdG9yeSwmcXVvdDsgd2hhdCBpcyB0aGUgY2hhcmFjdGVyIEJhbHJvZyYjMDM5O3MgY2F0Y2hwaHJhc2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSHV6emFoIVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWWVzIVwiLFxyXG4gICAgICAgICAgICBcIldob2EgdGhlcmUhXCIsXHJcbiAgICAgICAgICAgIFwiTnllaCBoZWggaGVoIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJWZWhpY2xlc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9uZSBvZiB0aGVzZSBjaGFzc2lzIGNvZGVzIGFyZSB1c2VkIGJ5IEJNVyAzLXNlcmllcz9cIixcclxuICAgICAgICBcImFcIjogXCJFNDZcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkUzOVwiLFxyXG4gICAgICAgICAgICBcIkU4NVwiLFxyXG4gICAgICAgICAgICBcIkYxMFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDb21pY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB3aGF0IEhvbWVzdHVjayBVcGRhdGUgd2FzIFtTXSBHYW1lIE92ZXIgcmVsZWFzZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiT2N0b2JlciAyNXRoLCAyMDE0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcHJpbCAxM3RoLCAyMDA5XCIsXHJcbiAgICAgICAgICAgIFwiQXByaWwgOHRoLCAyMDEyXCIsXHJcbiAgICAgICAgICAgIFwiQXVndXN0IDI4dGgsIDIwMDNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBiYW5kIG1lbWJlcnMgb2YgQW1lcmljYW4gcm9jayBiYW5kIEtpbmcgb2YgTGVvbj9cIixcclxuICAgICAgICBcImFcIjogXCJCcm90aGVycyAmYW1wOyBjb3VzaW5zXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaGlsZGhvb2QgZnJpZW5kc1wiLFxyXG4gICAgICAgICAgICBcIkZvcm1lciBjbGFzc21hdGVzXCIsXHJcbiAgICAgICAgICAgIFwiRnJhdGVybml0eSBob3VzZSBtZW1iZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBmcmFuY2hpc2UgaGFkIGEgc3BlY2lhbCBldmVudCBob3N0ZWQgaW4gdGhlIHBvcHVsYXIgTU1PUlBHIEZpbmFsIEZhbnRhc3kgWElWOiBBIFJlYWxtIFJlYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCJZby1rYWkgV2F0Y2hcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlBvayZlYWN1dGU7bW9uXCIsXHJcbiAgICAgICAgICAgIFwiWXUtZ2ktb2hcIixcclxuICAgICAgICAgICAgXCJCdWRkeWZpZ2h0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggS2luZ2RvbSBIZWFydHMgZ2FtZSBmZWF0dXJlZCB0aGUgY2FzdCBvZiAmcXVvdDtUaGUgV29ybGQgRW5kcyBXaXRoIFlvdSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEcmVhbSBEcm9wIERpc3RhbmNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCaXJ0aCBCeSBTbGVlcFwiLFxyXG4gICAgICAgICAgICBcIjM2NS8yIERheXNcIixcclxuICAgICAgICAgICAgXCJSZTpDaGFpbiBvZiBNZW1vcmllc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGxhcmdlc3QgcGxhbmV0IGluIEtlcmJhbCBTcGFjZSBQcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkpvb2xcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkVlbG9vXCIsXHJcbiAgICAgICAgICAgIFwiS2VyYm9sXCIsXHJcbiAgICAgICAgICAgIFwiTWlubXVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQW5pbWFsIENyb3NzaW5nIGdhbWUgd2FzIGZvciB0aGUgTmludGVuZG8gV2lpP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFuaW1hbCBDcm9zc2luZzogQ2l0eSBGb2xrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IE5ldyBMZWFmXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBXaWxkIFdvcmxkXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBQb3B1bGF0aW9uIEdyb3dpbmchXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkdlb3JnZSBMdWNhcyBkaXJlY3RlZCB0aGUgZW50aXJlIG9yaWdpbmFsIFN0YXIgV2FycyB0cmlsb2d5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgY2l0eSBvZiBSb21lLCBJdGFseSBmb3VuZGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjc1MyBCQ0VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjkwMiBCQ0VcIixcclxuICAgICAgICAgICAgXCI1MjQgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNjk3IEJDRVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBkYXRhIHN0cnVjdHVyZSBkb2VzIEZJTE8gYXBwbHkgdG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiU3RhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlF1ZXVlXCIsXHJcbiAgICAgICAgICAgIFwiSGVhcFwiLFxyXG4gICAgICAgICAgICBcIlRyZWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gQmF0dGxlc3RhciBHYWxhY3RpY2EgKDIwMDQpLCBDeWxvbnMgd2VyZSBjcmVhdGVkIGJ5IG1hbiBhcyBjeWJlcm5ldGljIHdvcmtlcnMgYW5kIHNvbGRpZXJzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgMjAxNiBEaXNuZXkgYW5pbWF0ZWQgZmlsbSAmIzAzOTtNb2FuYSYjMDM5OyBpcyBiYXNlZCBvbiB3aGljaCBjdWx0dXJlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbHluZXNpYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk5hdGl2ZSBBbWVyaWNhblwiLFxyXG4gICAgICAgICAgICBcIkphcGFuZXNlXCIsXHJcbiAgICAgICAgICAgIFwiTm9yZGljXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2FrZSBkZXBpY3RlZCBpbiBWYWx2ZSYjMDM5O3MgJnF1b3Q7UG9ydGFsJnF1b3Q7IGZyYW5jaGlzZSBtb3N0IGNsb3NlbHkgcmVzZW1ibGVzIHdoaWNoIHJlYWwtd29ybGQgdHlwZSBvZiBjYWtlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrIEZvcmVzdFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRGV2aWwmIzAzOTtzIEZvb2RcIixcclxuICAgICAgICAgICAgXCJNb2x0ZW4gQ2hvY29sYXRlXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFuIENob2NvbGF0ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlICYgTmF0dXJlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2hlbWljYWwgZWxlbWVudCBMaXRoaXVtIGlzIG5hbWVkIGFmdGVyIHRoZSBjb3VudHJ5IG9mIExpdGh1YW5pYS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBHYWRnZXRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIERWRCBpbnZlbnRlZD9cIixcclxuICAgICAgICBcImFcIjogXCIxOTk1XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMDAwXCIsXHJcbiAgICAgICAgICAgIFwiMTk5MFwiLFxyXG4gICAgICAgICAgICBcIjE5ODBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgZnVsbCBuYW1lIG9mIHRoZSBmb290YmFsbGVyICZxdW90O0NyaXN0aWFubyBSb25hbGRvJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNyaXN0aWFubyBSb25hbGRvIGRvcyBTYW50b3MgQXZlaXJvXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gUm9uYWxkbyBsb3MgU2FudG9zIERpZWdvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEFybWFuZG8gRGllZ28gUm9uYWxkb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBMdWlzIEFybWFuZG8gUm9uYWxkb1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlc2UgdHdvIGNvdW50cmllcyBoZWxkIGEgY29tbW9ud2VhbHRoIGZyb20gdGhlIDE2dGggdG8gMTh0aCBjZW50dXJ5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbGFuZCBhbmQgTGl0aHVhbmlhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIdXR1IGFuZCBSd2FuZGFcIixcclxuICAgICAgICAgICAgXCJOb3J0aCBLb3JlYSBhbmQgU291dGggS29yZWFcIixcclxuICAgICAgICAgICAgXCJCYW5nbGFkZXNoIGFuZCBCaHV0YW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0NhbGwgT2YgRHV0eTogWm9tYmllcyZxdW90OywgY29tcGxldGluZyB3aGljaCBtYXAmIzAzOTtzIG1haW4gZWFzdGVyIGVnZyB3aWxsIHJld2FyZCB5b3Ugd2l0aCB0aGUgYWNoaWV2ZW1lbnQsICZxdW90O0hpZ2ggTWFpbnRlbmFuY2UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRGllIFJpc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1vYiBPZiBUaGUgRGVhZFwiLFxyXG4gICAgICAgICAgICBcIk9yaWdpbnNcIixcclxuICAgICAgICAgICAgXCJBc2NlbnNpb25cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ2FydG9vbiAmIEFuaW1hdGlvbnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtHcmF2aXR5IEZhbGxzJnF1b3Q7LCBob3cgbXVjaCBkb2VzIFdhZGRsZXMgd2VpZ2ggd2hlbiBNYWJsZSB3aW5zIGhpbSBpbiAmcXVvdDtUaGUgVGltZSBUcmF2ZWxlciYjMDM5O3MgUGlnJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE1IHBvdW5kc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMTAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMzAgcG91bmRzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgZ2l2ZW4gdG8gbGF5ZXIgNCBvZiB0aGUgT3BlbiBTeXN0ZW1zIEludGVyY29ubmVjdGlvbiAoSVNPKSBtb2RlbD9cIixcclxuICAgICAgICBcImFcIjogXCJUcmFuc3BvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlNlc3Npb25cIixcclxuICAgICAgICAgICAgXCJEYXRhIGxpbmtcIixcclxuICAgICAgICAgICAgXCJOZXR3b3JrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCB5ZWFyIHdhcyBob2NrZXkgbGVnZW5kIFdheW5lIEdyZXR6a3kgYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCIxOTYxXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIxOTY1XCIsXHJcbiAgICAgICAgICAgIFwiMTk1OVwiLFxyXG4gICAgICAgICAgICBcIjE5NjNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkhvdyBtYW55IGdhbWVzIGFyZSB0aGVyZSBpbiB0aGUgJnF1b3Q7Q29sb255IFdhcnMmcXVvdDsgc2VyaWVzIGZvciB0aGUgUGxheVN0YXRpb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiM1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMlwiLFxyXG4gICAgICAgICAgICBcIjRcIixcclxuICAgICAgICAgICAgXCI1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gV29ybGQgb2YgV2FyY3JhZnQsIHdoaWNoIHJhaWQgaW5zdGFuY2UgZmVhdHVyZXMgYSBjaGVzcyBldmVudD9cIixcclxuICAgICAgICBcImFcIjogXCJLYXJhemhhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWnVsJiMwMzk7QW1hblwiLFxyXG4gICAgICAgICAgICBcIkJsYWNrd2luZyBMYWlyXCIsXHJcbiAgICAgICAgICAgIFwiVGVtcGxlIG9mIEFobiYjMDM5O1FpcmFqXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBjb3VudHJ5IHdhcyBKb3NlZiBTdGFsaW4gYm9ybiBpbj9cIixcclxuICAgICAgICBcImFcIjogXCJHZW9yZ2lhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSdXNzaWFcIixcclxuICAgICAgICAgICAgXCJHZXJtYW55XCIsXHJcbiAgICAgICAgICAgIFwiUG9sYW5kXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgb2ZmaWNpYWwgbmFtZSBvZiBQcmluY2UmIzAzOTtzIGJhY2tpbmcgYmFuZD9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgUmV2b2x1dGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIFBhdXBlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgV2FpbGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBIZWFydGJyZWFrZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEdhbWUgb2YgVGhyb25lcyB3aGF0IGlzIHRoZSBuYW1lIG9mIEpvbiBTbm93JiMwMzk7cyBzd29yZD9cIixcclxuICAgICAgICBcImFcIjogXCJMb25nY2xhd1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiT2F0aGtlZXBlclwiLFxyXG4gICAgICAgICAgICBcIldpZG93JiMwMzk7cyBXYWlsXCIsXHJcbiAgICAgICAgICAgIFwiTmVlZGxlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGluc3BlY3RvciBpbiB0aGUgc2VyaWVzICZxdW90O09uIHRoZSBCdXNlcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFrZXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcnBlclwiLFxyXG4gICAgICAgICAgICBcIk5haWx5XCIsXHJcbiAgICAgICAgICAgIFwiR2FsbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGFydGlzdCBjdXJhdGVkIHRoZSBvZmZpY2lhbCBzb3VuZHRyYWNrIGZvciAmcXVvdDtUaGUgSHVuZ2VyIEdhbWVzOiBNb2NraW5namF5IC0gUGFydCAxJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvcmRlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJLYW55ZSBXZXN0XCIsXHJcbiAgICAgICAgICAgIFwiVG92ZSBMb1wiLFxyXG4gICAgICAgICAgICBcIkNoYXJsaSBYQ1hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQ2FuYWRpYW4gJDEgY29pbiBpcyBjb2xsb3F1aWFsbHkga25vd24gYXMgYSB3aGF0P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvb25pZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiRm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiTW9vZGllXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZXNlIGZvdW5kaW5nIGZhdGhlcnMgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgb2YgQW1lcmljYSBsYXRlciBiZWNhbWUgcHJlc2lkZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkphbWVzIE1vbnJvZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQWxleGFuZGVyIEhhbWlsdG9uXCIsXHJcbiAgICAgICAgICAgIFwiU2FtdWVsIEFkYW1zXCIsXHJcbiAgICAgICAgICAgIFwiUm9nZXIgU2hlcm1hblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIERpdmluaXR5OiBPcmlnaW5hbCBTaW4gSUksIHdoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXI/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFuZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTG9oc2VcIixcclxuICAgICAgICAgICAgXCJUaGUgUmVkIFByaW5jZVwiLFxyXG4gICAgICAgICAgICBcIlRoZXJlIGFyZSBubyBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldobyBpcyB0aGUgbWFpbiBwcm90YWdvbmlzdCBpbiB0aGUgZ2FtZSBMaWZlIGlzIFN0cmFuZ2U6IEJlZm9yZSBUaGUgU3Rvcm0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ2hsb2UgUHJpY2UgXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNYXggQ2F1bGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiUmFjaGVsIEFtYmVyXCIsXHJcbiAgICAgICAgICAgIFwiRnJhbmsgQm93ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkpvaG5ueSBEZXBwIG1hZGUgaGlzIGJpZy1zY3JlZW4gYWN0aW5nIGRlYnV0IGluIHdoaWNoIGZpbG0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQSBOaWdodG1hcmUgb24gRWxtIFN0cmVldFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTXkgQmxvb2R5IFZhbGVudGluZVwiLFxyXG4gICAgICAgICAgICBcIkhhbGxvd2VlblwiLFxyXG4gICAgICAgICAgICBcIkZyaWRheSB0aGUgMTN0aFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtSZXNpZGVudCBFdmlsJnF1b3Q7LCBvbmx5IENocmlzIGhhcyBhY2Nlc3MgdG8gdGhlIGdyZW5hZGUgbGF1bmNoZXIuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVycyBpcyBOT1QgcGxheWFibGUgaW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCA2JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkppbGwgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaHJpcyBSZWRmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlNoZXJyeSBCaXJraW5cIixcclxuICAgICAgICAgICAgXCJIZWxlbmEgSGFycGVyXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEphcGFuZXNlIEFuaW1lICYgTWFuZ2FcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSAxOTg4IGZpbG0gJnF1b3Q7QWtpcmEmcXVvdDssIFRldHN1byBlbmRzIHVwIGRlc3Ryb3lpbmcgVG9reW8uXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VvZ3JhcGh5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGJvZHkgb2YgdGhlIEVneXB0aWFuIFNwaGlueCB3YXMgYmFzZWQgb24gd2hpY2ggYW5pbWFsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJ1bGxcIixcclxuICAgICAgICAgICAgXCJIb3JzZVwiLFxyXG4gICAgICAgICAgICBcIkRvZ1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiByZWxhdGlvbiB0byB0aGUgQnJpdGlzaCBPY2N1cGF0aW9uIGluIElyZWxhbmQsIHdoYXQgZG9lcyB0aGUgSVJBIHN0YW5kIGZvci5cIixcclxuICAgICAgICBcImFcIjogXCJJcmlzaCBSZXB1YmxpY2FuIEFybXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIklyaXNoIFJlYmVsIEFsbGlhbmNlXCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmVmb3JtYXRpb24gQXJteVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoLVJveWFsIEFsbGlhbmNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHJvYm90IGluIHRoZSAxOTUxIHNjaWVuY2UgZmljdGlvbiBmaWxtIGNsYXNzaWMgJiMwMzk7VGhlIERheSB0aGUgRWFydGggU3Rvb2QgU3RpbGwmIzAzOTs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR29ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUm9iYnlcIixcclxuICAgICAgICAgICAgXCJDb2xvc3N1c1wiLFxyXG4gICAgICAgICAgICBcIkJveFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgUm9tYW4gbnVtZXJhbCBmb3IgNTAwP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxcIixcclxuICAgICAgICAgICAgXCJDXCIsXHJcbiAgICAgICAgICAgIFwiWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIG1haW4gaGVhbGluZyBpdGVtIGluIERhcmsgU291bHM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRXN0dXMgRmxhc2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhlYWx0aCBQb3Rpb25cIixcclxuICAgICAgICAgICAgXCJPcmFuZ2UgSnVpY2VcIixcclxuICAgICAgICAgICAgXCJBc2hlbiBGbGFza1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIk9uIHdoaWNoIGNvbXB1dGVyIGhhcmR3YXJlIGRldmljZSBpcyB0aGUgQklPUyBjaGlwIGxvY2F0ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTW90aGVyYm9hcmRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcmQgRGlzayBEcml2ZVwiLFxyXG4gICAgICAgICAgICBcIkNlbnRyYWwgUHJvY2Vzc2luZyBVbml0XCIsXHJcbiAgICAgICAgICAgIFwiR3JhcGhpY3MgUHJvY2Vzc2luZyBVbml0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJBIHVuaXZlcnNhbCBzZXQsIG9yIGEgc2V0IHRoYXQgY29udGFpbnMgYWxsIHNldHMsIGV4aXN0cy5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQWNlIEF0dG9ybmV5IHRyaWxvZ3kgd2FzIHN1cHBvc2UgdG8gZW5kIHdpdGggJnF1b3Q7UGhvZW5peCBXcmlnaHQ6IEFjZSBBdHRvcm5leSAmbWludXM7IFRyaWFscyBhbmQgVHJpYnVsYXRpb25zJnF1b3Q7IGFzIGl0cyBmaW5hbCBnYW1lLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgaGlnaGVzdCBiZWx0IHlvdSBjYW4gZ2V0IGluIFRhZWt3b25kbz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiV2hpdGVcIixcclxuICAgICAgICAgICAgXCJSZWRcIixcclxuICAgICAgICAgICAgXCJHcmVlblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgVW5pdGVkIFN0YXRlcyBEZXBhcnRtZW50IG9mIEhvbWVsYW5kIFNlY3VyaXR5IHdhcyBmb3JtZWQgaW4gcmVzcG9uc2UgdG8gdGhlIFNlcHRlbWJlciAxMXRoIGF0dGFja3MuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQXBvbGxvIG1pc3Npb24gd2FzIHRoZSBsYXN0IG9uZSBpbiBOQVNBJiMwMzk7cyBBcG9sbG8gcHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJBcG9sbG8gMTdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwb2xsbyAxM1wiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxMVwiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgaXMgYW4gZXhpc3RpbmcgZmFtaWx5IGluICZxdW90O1RoZSBTaW1zJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBHb3RoIEZhbWlseVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBTaW1vbGVvbiBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgUHJvdWQgRmFtaWx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgTnVjbGVhciBUaHJvbmUsIHdoYXQgb3JnYW5pemF0aW9uIGNoYXNlcyB0aGUgcGxheWVyIGNoYXJhY3RlciB0aHJvdWdob3V0IHRoZSBnYW1lP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBJLkQuUC5EXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmlzaG1lblwiLFxyXG4gICAgICAgICAgICBcIlRoZSBCYW5kaXRzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFkuVi5HLkdcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lICZxdW90O0NhdmUgU3RvcnksJnF1b3Q7IHdoYXQgaXMgdGhlIGNoYXJhY3RlciBCYWxyb2cmIzAzOTtzIGNhdGNocGhyYXNlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkh1enphaCFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlllcyFcIixcclxuICAgICAgICAgICAgXCJXaG9hIHRoZXJlIVwiLFxyXG4gICAgICAgICAgICBcIk55ZWggaGVoIGhlaCFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiVmVoaWNsZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvbmUgb2YgdGhlc2UgY2hhc3NpcyBjb2RlcyBhcmUgdXNlZCBieSBCTVcgMy1zZXJpZXM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRTQ2XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFMzlcIixcclxuICAgICAgICAgICAgXCJFODVcIixcclxuICAgICAgICAgICAgXCJGMTBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ29taWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gd2hhdCBIb21lc3R1Y2sgVXBkYXRlIHdhcyBbU10gR2FtZSBPdmVyIHJlbGVhc2VkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk9jdG9iZXIgMjV0aCwgMjAxNFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXByaWwgMTN0aCwgMjAwOVwiLFxyXG4gICAgICAgICAgICBcIkFwcmlsIDh0aCwgMjAxMlwiLFxyXG4gICAgICAgICAgICBcIkF1Z3VzdCAyOHRoLCAyMDAzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgYmFuZCBtZW1iZXJzIG9mIEFtZXJpY2FuIHJvY2sgYmFuZCBLaW5nIG9mIExlb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQnJvdGhlcnMgJmFtcDsgY291c2luc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hpbGRob29kIGZyaWVuZHNcIixcclxuICAgICAgICAgICAgXCJGb3JtZXIgY2xhc3NtYXRlc1wiLFxyXG4gICAgICAgICAgICBcIkZyYXRlcm5pdHkgaG91c2UgbWVtYmVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZnJhbmNoaXNlIGhhZCBhIHNwZWNpYWwgZXZlbnQgaG9zdGVkIGluIHRoZSBwb3B1bGFyIE1NT1JQRyBGaW5hbCBGYW50YXN5IFhJVjogQSBSZWFsbSBSZWJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiWW8ta2FpIFdhdGNoXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJQb2smZWFjdXRlO21vblwiLFxyXG4gICAgICAgICAgICBcIll1LWdpLW9oXCIsXHJcbiAgICAgICAgICAgIFwiQnVkZHlmaWdodFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEtpbmdkb20gSGVhcnRzIGdhbWUgZmVhdHVyZWQgdGhlIGNhc3Qgb2YgJnF1b3Q7VGhlIFdvcmxkIEVuZHMgV2l0aCBZb3UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRHJlYW0gRHJvcCBEaXN0YW5jZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQmlydGggQnkgU2xlZXBcIixcclxuICAgICAgICAgICAgXCIzNjUvMiBEYXlzXCIsXHJcbiAgICAgICAgICAgIFwiUmU6Q2hhaW4gb2YgTWVtb3JpZXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBsYXJnZXN0IHBsYW5ldCBpbiBLZXJiYWwgU3BhY2UgUHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJKb29sXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFZWxvb1wiLFxyXG4gICAgICAgICAgICBcIktlcmJvbFwiLFxyXG4gICAgICAgICAgICBcIk1pbm11c1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFuaW1hbCBDcm9zc2luZyBnYW1lIHdhcyBmb3IgdGhlIE5pbnRlbmRvIFdpaT9cIixcclxuICAgICAgICBcImFcIjogXCJBbmltYWwgQ3Jvc3Npbmc6IENpdHkgRm9sa1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBOZXcgTGVhZlwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogV2lsZCBXb3JsZFwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogUG9wdWxhdGlvbiBHcm93aW5nIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJHZW9yZ2UgTHVjYXMgZGlyZWN0ZWQgdGhlIGVudGlyZSBvcmlnaW5hbCBTdGFyIFdhcnMgdHJpbG9neS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIGNpdHkgb2YgUm9tZSwgSXRhbHkgZm91bmRlZD9cIixcclxuICAgICAgICBcImFcIjogXCI3NTMgQkNFXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCI5MDIgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNTI0IEJDRVwiLFxyXG4gICAgICAgICAgICBcIjY5NyBCQ0VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZGF0YSBzdHJ1Y3R1cmUgZG9lcyBGSUxPIGFwcGx5IHRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlN0YWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJRdWV1ZVwiLFxyXG4gICAgICAgICAgICBcIkhlYXBcIixcclxuICAgICAgICAgICAgXCJUcmVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEJhdHRsZXN0YXIgR2FsYWN0aWNhICgyMDA0KSwgQ3lsb25zIHdlcmUgY3JlYXRlZCBieSBtYW4gYXMgY3liZXJuZXRpYyB3b3JrZXJzIGFuZCBzb2xkaWVycy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIDIwMTYgRGlzbmV5IGFuaW1hdGVkIGZpbG0gJiMwMzk7TW9hbmEmIzAzOTsgaXMgYmFzZWQgb24gd2hpY2ggY3VsdHVyZT9cIixcclxuICAgICAgICBcImFcIjogXCJQb2x5bmVzaWFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJOYXRpdmUgQW1lcmljYW5cIixcclxuICAgICAgICAgICAgXCJKYXBhbmVzZVwiLFxyXG4gICAgICAgICAgICBcIk5vcmRpY1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNha2UgZGVwaWN0ZWQgaW4gVmFsdmUmIzAzOTtzICZxdW90O1BvcnRhbCZxdW90OyBmcmFuY2hpc2UgbW9zdCBjbG9zZWx5IHJlc2VtYmxlcyB3aGljaCByZWFsLXdvcmxkIHR5cGUgb2YgY2FrZT9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFjayBGb3Jlc3RcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkRldmlsJiMwMzk7cyBGb29kXCIsXHJcbiAgICAgICAgICAgIFwiTW9sdGVuIENob2NvbGF0ZVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbiBDaG9jb2xhdGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZSAmIE5hdHVyZVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNoZW1pY2FsIGVsZW1lbnQgTGl0aGl1bSBpcyBuYW1lZCBhZnRlciB0aGUgY291bnRyeSBvZiBMaXRodWFuaWEuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogR2FkZ2V0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBEVkQgaW52ZW50ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk5NVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAwMFwiLFxyXG4gICAgICAgICAgICBcIjE5OTBcIixcclxuICAgICAgICAgICAgXCIxOTgwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGZ1bGwgbmFtZSBvZiB0aGUgZm9vdGJhbGxlciAmcXVvdDtDcmlzdGlhbm8gUm9uYWxkbyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJDcmlzdGlhbm8gUm9uYWxkbyBkb3MgU2FudG9zIEF2ZWlyb1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIFJvbmFsZG8gbG9zIFNhbnRvcyBEaWVnb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBBcm1hbmRvIERpZWdvIFJvbmFsZG9cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gTHVpcyBBcm1hbmRvIFJvbmFsZG9cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZXNlIHR3byBjb3VudHJpZXMgaGVsZCBhIGNvbW1vbndlYWx0aCBmcm9tIHRoZSAxNnRoIHRvIDE4dGggY2VudHVyeS5cIixcclxuICAgICAgICBcImFcIjogXCJQb2xhbmQgYW5kIExpdGh1YW5pYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSHV0dSBhbmQgUndhbmRhXCIsXHJcbiAgICAgICAgICAgIFwiTm9ydGggS29yZWEgYW5kIFNvdXRoIEtvcmVhXCIsXHJcbiAgICAgICAgICAgIFwiQmFuZ2xhZGVzaCBhbmQgQmh1dGFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtDYWxsIE9mIER1dHk6IFpvbWJpZXMmcXVvdDssIGNvbXBsZXRpbmcgd2hpY2ggbWFwJiMwMzk7cyBtYWluIGVhc3RlciBlZ2cgd2lsbCByZXdhcmQgeW91IHdpdGggdGhlIGFjaGlldmVtZW50LCAmcXVvdDtIaWdoIE1haW50ZW5hbmNlJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRpZSBSaXNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNb2IgT2YgVGhlIERlYWRcIixcclxuICAgICAgICAgICAgXCJPcmlnaW5zXCIsXHJcbiAgICAgICAgICAgIFwiQXNjZW5zaW9uXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENhcnRvb24gJiBBbmltYXRpb25zXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7R3Jhdml0eSBGYWxscyZxdW90OywgaG93IG11Y2ggZG9lcyBXYWRkbGVzIHdlaWdoIHdoZW4gTWFibGUgd2lucyBoaW0gaW4gJnF1b3Q7VGhlIFRpbWUgVHJhdmVsZXImIzAzOTtzIFBpZyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCIxNSBwb3VuZHNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjEwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjMwIHBvdW5kc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIGdpdmVuIHRvIGxheWVyIDQgb2YgdGhlIE9wZW4gU3lzdGVtcyBJbnRlcmNvbm5lY3Rpb24gKElTTykgbW9kZWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJhbnNwb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJTZXNzaW9uXCIsXHJcbiAgICAgICAgICAgIFwiRGF0YSBsaW5rXCIsXHJcbiAgICAgICAgICAgIFwiTmV0d29ya1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgeWVhciB3YXMgaG9ja2V5IGxlZ2VuZCBXYXluZSBHcmV0emt5IGJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk2MVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMTk2NVwiLFxyXG4gICAgICAgICAgICBcIjE5NTlcIixcclxuICAgICAgICAgICAgXCIxOTYzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJIb3cgbWFueSBnYW1lcyBhcmUgdGhlcmUgaW4gdGhlICZxdW90O0NvbG9ueSBXYXJzJnF1b3Q7IHNlcmllcyBmb3IgdGhlIFBsYXlTdGF0aW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjJcIixcclxuICAgICAgICAgICAgXCI0XCIsXHJcbiAgICAgICAgICAgIFwiNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIFdvcmxkIG9mIFdhcmNyYWZ0LCB3aGljaCByYWlkIGluc3RhbmNlIGZlYXR1cmVzIGEgY2hlc3MgZXZlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiS2FyYXpoYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlp1bCYjMDM5O0FtYW5cIixcclxuICAgICAgICAgICAgXCJCbGFja3dpbmcgTGFpclwiLFxyXG4gICAgICAgICAgICBcIlRlbXBsZSBvZiBBaG4mIzAzOTtRaXJhalwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggY291bnRyeSB3YXMgSm9zZWYgU3RhbGluIGJvcm4gaW4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR2VvcmdpYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUnVzc2lhXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFueVwiLFxyXG4gICAgICAgICAgICBcIlBvbGFuZFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG9mZmljaWFsIG5hbWUgb2YgUHJpbmNlJiMwMzk7cyBiYWNraW5nIGJhbmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIFJldm9sdXRpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBQYXVwZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFdhaWxlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgSGVhcnRicmVha2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiBHYW1lIG9mIFRocm9uZXMgd2hhdCBpcyB0aGUgbmFtZSBvZiBKb24gU25vdyYjMDM5O3Mgc3dvcmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9uZ2NsYXdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk9hdGhrZWVwZXJcIixcclxuICAgICAgICAgICAgXCJXaWRvdyYjMDM5O3MgV2FpbFwiLFxyXG4gICAgICAgICAgICBcIk5lZWRsZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBpbnNwZWN0b3IgaW4gdGhlIHNlcmllcyAmcXVvdDtPbiB0aGUgQnVzZXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxha2V5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJwZXJcIixcclxuICAgICAgICAgICAgXCJOYWlseVwiLFxyXG4gICAgICAgICAgICBcIkdhbGx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBhcnRpc3QgY3VyYXRlZCB0aGUgb2ZmaWNpYWwgc291bmR0cmFjayBmb3IgJnF1b3Q7VGhlIEh1bmdlciBHYW1lczogTW9ja2luZ2pheSAtIFBhcnQgMSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJMb3JkZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiS2FueWUgV2VzdFwiLFxyXG4gICAgICAgICAgICBcIlRvdmUgTG9cIixcclxuICAgICAgICAgICAgXCJDaGFybGkgWENYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIENhbmFkaWFuICQxIGNvaW4gaXMgY29sbG9xdWlhbGx5IGtub3duIGFzIGEgd2hhdD9cIixcclxuICAgICAgICBcImFcIjogXCJMb29uaWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIkZvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIk1vb2RpZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGVzZSBmb3VuZGluZyBmYXRoZXJzIG9mIHRoZSBVbml0ZWQgU3RhdGVzIG9mIEFtZXJpY2EgbGF0ZXIgYmVjYW1lIHByZXNpZGVudD9cIixcclxuICAgICAgICBcImFcIjogXCJKYW1lcyBNb25yb2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFsZXhhbmRlciBIYW1pbHRvblwiLFxyXG4gICAgICAgICAgICBcIlNhbXVlbCBBZGFtc1wiLFxyXG4gICAgICAgICAgICBcIlJvZ2VyIFNoZXJtYW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBEaXZpbml0eTogT3JpZ2luYWwgU2luIElJLCB3aGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxvaHNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFJlZCBQcmluY2VcIixcclxuICAgICAgICAgICAgXCJUaGVyZSBhcmUgbm8gc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3RlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaG8gaXMgdGhlIG1haW4gcHJvdGFnb25pc3QgaW4gdGhlIGdhbWUgTGlmZSBpcyBTdHJhbmdlOiBCZWZvcmUgVGhlIFN0b3JtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNobG9lIFByaWNlIFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTWF4IENhdWxmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlJhY2hlbCBBbWJlclwiLFxyXG4gICAgICAgICAgICBcIkZyYW5rIEJvd2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJKb2hubnkgRGVwcCBtYWRlIGhpcyBiaWctc2NyZWVuIGFjdGluZyBkZWJ1dCBpbiB3aGljaCBmaWxtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkEgTmlnaHRtYXJlIG9uIEVsbSBTdHJlZXRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk15IEJsb29keSBWYWxlbnRpbmVcIixcclxuICAgICAgICAgICAgXCJIYWxsb3dlZW5cIixcclxuICAgICAgICAgICAgXCJGcmlkYXkgdGhlIDEzdGhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCZxdW90Oywgb25seSBDaHJpcyBoYXMgYWNjZXNzIHRvIHRoZSBncmVuYWRlIGxhdW5jaGVyLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcnMgaXMgTk9UIHBsYXlhYmxlIGluICZxdW90O1Jlc2lkZW50IEV2aWwgNiZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJKaWxsIFZhbGVudGluZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hyaXMgUmVkZmllbGRcIixcclxuICAgICAgICAgICAgXCJTaGVycnkgQmlya2luXCIsXHJcbiAgICAgICAgICAgIFwiSGVsZW5hIEhhcnBlclwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBKYXBhbmVzZSBBbmltZSAmIE1hbmdhXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgMTk4OCBmaWxtICZxdW90O0FraXJhJnF1b3Q7LCBUZXRzdW8gZW5kcyB1cCBkZXN0cm95aW5nIFRva3lvLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlb2dyYXBoeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBib2R5IG9mIHRoZSBFZ3lwdGlhbiBTcGhpbnggd2FzIGJhc2VkIG9uIHdoaWNoIGFuaW1hbD9cIixcclxuICAgICAgICBcImFcIjogXCJMaW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCdWxsXCIsXHJcbiAgICAgICAgICAgIFwiSG9yc2VcIixcclxuICAgICAgICAgICAgXCJEb2dcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gcmVsYXRpb24gdG8gdGhlIEJyaXRpc2ggT2NjdXBhdGlvbiBpbiBJcmVsYW5kLCB3aGF0IGRvZXMgdGhlIElSQSBzdGFuZCBmb3IuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSXJpc2ggUmVwdWJsaWNhbiBBcm15XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWJlbCBBbGxpYW5jZVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoIFJlZm9ybWF0aW9uIEFybXlcIixcclxuICAgICAgICAgICAgXCJJcmlzaC1Sb3lhbCBBbGxpYW5jZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSByb2JvdCBpbiB0aGUgMTk1MSBzY2llbmNlIGZpY3Rpb24gZmlsbSBjbGFzc2ljICYjMDM5O1RoZSBEYXkgdGhlIEVhcnRoIFN0b29kIFN0aWxsJiMwMzk7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJvYmJ5XCIsXHJcbiAgICAgICAgICAgIFwiQ29sb3NzdXNcIixcclxuICAgICAgICAgICAgXCJCb3hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIFJvbWFuIG51bWVyYWwgZm9yIDUwMD9cIixcclxuICAgICAgICBcImFcIjogXCJEXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMXCIsXHJcbiAgICAgICAgICAgIFwiQ1wiLFxyXG4gICAgICAgICAgICBcIlhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBtYWluIGhlYWxpbmcgaXRlbSBpbiBEYXJrIFNvdWxzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkVzdHVzIEZsYXNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIZWFsdGggUG90aW9uXCIsXHJcbiAgICAgICAgICAgIFwiT3JhbmdlIEp1aWNlXCIsXHJcbiAgICAgICAgICAgIFwiQXNoZW4gRmxhc2tcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJPbiB3aGljaCBjb21wdXRlciBoYXJkd2FyZSBkZXZpY2UgaXMgdGhlIEJJT1MgY2hpcCBsb2NhdGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk1vdGhlcmJvYXJkXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJkIERpc2sgRHJpdmVcIixcclxuICAgICAgICAgICAgXCJDZW50cmFsIFByb2Nlc3NpbmcgVW5pdFwiLFxyXG4gICAgICAgICAgICBcIkdyYXBoaWNzIFByb2Nlc3NpbmcgVW5pdFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiQSB1bml2ZXJzYWwgc2V0LCBvciBhIHNldCB0aGF0IGNvbnRhaW5zIGFsbCBzZXRzLCBleGlzdHMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIEFjZSBBdHRvcm5leSB0cmlsb2d5IHdhcyBzdXBwb3NlIHRvIGVuZCB3aXRoICZxdW90O1Bob2VuaXggV3JpZ2h0OiBBY2UgQXR0b3JuZXkgJm1pbnVzOyBUcmlhbHMgYW5kIFRyaWJ1bGF0aW9ucyZxdW90OyBhcyBpdHMgZmluYWwgZ2FtZS5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGhpZ2hlc3QgYmVsdCB5b3UgY2FuIGdldCBpbiBUYWVrd29uZG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIldoaXRlXCIsXHJcbiAgICAgICAgICAgIFwiUmVkXCIsXHJcbiAgICAgICAgICAgIFwiR3JlZW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIFVuaXRlZCBTdGF0ZXMgRGVwYXJ0bWVudCBvZiBIb21lbGFuZCBTZWN1cml0eSB3YXMgZm9ybWVkIGluIHJlc3BvbnNlIHRvIHRoZSBTZXB0ZW1iZXIgMTF0aCBhdHRhY2tzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFwb2xsbyBtaXNzaW9uIHdhcyB0aGUgbGFzdCBvbmUgaW4gTkFTQSYjMDM5O3MgQXBvbGxvIHByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQXBvbGxvIDE3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTNcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTFcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGlzIGFuIGV4aXN0aW5nIGZhbWlseSBpbiAmcXVvdDtUaGUgU2ltcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgR290aCBGYW1pbHlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgU2ltb2xlb24gRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFByb3VkIEZhbWlseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lIE51Y2xlYXIgVGhyb25lLCB3aGF0IG9yZ2FuaXphdGlvbiBjaGFzZXMgdGhlIHBsYXllciBjaGFyYWN0ZXIgdGhyb3VnaG91dCB0aGUgZ2FtZT9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgSS5ELlAuRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZpc2htZW5cIixcclxuICAgICAgICAgICAgXCJUaGUgQmFuZGl0c1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBZLlYuRy5HXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSAmcXVvdDtDYXZlIFN0b3J5LCZxdW90OyB3aGF0IGlzIHRoZSBjaGFyYWN0ZXIgQmFscm9nJiMwMzk7cyBjYXRjaHBocmFzZT9cIixcclxuICAgICAgICBcImFcIjogXCJIdXp6YWghXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJZZXMhXCIsXHJcbiAgICAgICAgICAgIFwiV2hvYSB0aGVyZSFcIixcclxuICAgICAgICAgICAgXCJOeWVoIGhlaCBoZWghXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlZlaGljbGVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb25lIG9mIHRoZXNlIGNoYXNzaXMgY29kZXMgYXJlIHVzZWQgYnkgQk1XIDMtc2VyaWVzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkU0NlwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRTM5XCIsXHJcbiAgICAgICAgICAgIFwiRTg1XCIsXHJcbiAgICAgICAgICAgIFwiRjEwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENvbWljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHdoYXQgSG9tZXN0dWNrIFVwZGF0ZSB3YXMgW1NdIEdhbWUgT3ZlciByZWxlYXNlZD9cIixcclxuICAgICAgICBcImFcIjogXCJPY3RvYmVyIDI1dGgsIDIwMTRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwcmlsIDEzdGgsIDIwMDlcIixcclxuICAgICAgICAgICAgXCJBcHJpbCA4dGgsIDIwMTJcIixcclxuICAgICAgICAgICAgXCJBdWd1c3QgMjh0aCwgMjAwM1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIGJhbmQgbWVtYmVycyBvZiBBbWVyaWNhbiByb2NrIGJhbmQgS2luZyBvZiBMZW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJyb3RoZXJzICZhbXA7IGNvdXNpbnNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNoaWxkaG9vZCBmcmllbmRzXCIsXHJcbiAgICAgICAgICAgIFwiRm9ybWVyIGNsYXNzbWF0ZXNcIixcclxuICAgICAgICAgICAgXCJGcmF0ZXJuaXR5IGhvdXNlIG1lbWJlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGZyYW5jaGlzZSBoYWQgYSBzcGVjaWFsIGV2ZW50IGhvc3RlZCBpbiB0aGUgcG9wdWxhciBNTU9SUEcgRmluYWwgRmFudGFzeSBYSVY6IEEgUmVhbG0gUmVib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIllvLWthaSBXYXRjaFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUG9rJmVhY3V0ZTttb25cIixcclxuICAgICAgICAgICAgXCJZdS1naS1vaFwiLFxyXG4gICAgICAgICAgICBcIkJ1ZGR5ZmlnaHRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBLaW5nZG9tIEhlYXJ0cyBnYW1lIGZlYXR1cmVkIHRoZSBjYXN0IG9mICZxdW90O1RoZSBXb3JsZCBFbmRzIFdpdGggWW91JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRyZWFtIERyb3AgRGlzdGFuY2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJpcnRoIEJ5IFNsZWVwXCIsXHJcbiAgICAgICAgICAgIFwiMzY1LzIgRGF5c1wiLFxyXG4gICAgICAgICAgICBcIlJlOkNoYWluIG9mIE1lbW9yaWVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbGFyZ2VzdCBwbGFuZXQgaW4gS2VyYmFsIFNwYWNlIFByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSm9vbFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRWVsb29cIixcclxuICAgICAgICAgICAgXCJLZXJib2xcIixcclxuICAgICAgICAgICAgXCJNaW5tdXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBbmltYWwgQ3Jvc3NpbmcgZ2FtZSB3YXMgZm9yIHRoZSBOaW50ZW5kbyBXaWk/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQW5pbWFsIENyb3NzaW5nOiBDaXR5IEZvbGtcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogTmV3IExlYWZcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFdpbGQgV29ybGRcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFBvcHVsYXRpb24gR3Jvd2luZyFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiR2VvcmdlIEx1Y2FzIGRpcmVjdGVkIHRoZSBlbnRpcmUgb3JpZ2luYWwgU3RhciBXYXJzIHRyaWxvZ3kuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBjaXR5IG9mIFJvbWUsIEl0YWx5IGZvdW5kZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiNzUzIEJDRVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiOTAyIEJDRVwiLFxyXG4gICAgICAgICAgICBcIjUyNCBCQ0VcIixcclxuICAgICAgICAgICAgXCI2OTcgQkNFXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGRhdGEgc3RydWN0dXJlIGRvZXMgRklMTyBhcHBseSB0bz9cIixcclxuICAgICAgICBcImFcIjogXCJTdGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUXVldWVcIixcclxuICAgICAgICAgICAgXCJIZWFwXCIsXHJcbiAgICAgICAgICAgIFwiVHJlZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBCYXR0bGVzdGFyIEdhbGFjdGljYSAoMjAwNCksIEN5bG9ucyB3ZXJlIGNyZWF0ZWQgYnkgbWFuIGFzIGN5YmVybmV0aWMgd29ya2VycyBhbmQgc29sZGllcnMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSAyMDE2IERpc25leSBhbmltYXRlZCBmaWxtICYjMDM5O01vYW5hJiMwMzk7IGlzIGJhc2VkIG9uIHdoaWNoIGN1bHR1cmU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9seW5lc2lhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTmF0aXZlIEFtZXJpY2FuXCIsXHJcbiAgICAgICAgICAgIFwiSmFwYW5lc2VcIixcclxuICAgICAgICAgICAgXCJOb3JkaWNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjYWtlIGRlcGljdGVkIGluIFZhbHZlJiMwMzk7cyAmcXVvdDtQb3J0YWwmcXVvdDsgZnJhbmNoaXNlIG1vc3QgY2xvc2VseSByZXNlbWJsZXMgd2hpY2ggcmVhbC13b3JsZCB0eXBlIG9mIGNha2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2sgRm9yZXN0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJEZXZpbCYjMDM5O3MgRm9vZFwiLFxyXG4gICAgICAgICAgICBcIk1vbHRlbiBDaG9jb2xhdGVcIixcclxuICAgICAgICAgICAgXCJHZXJtYW4gQ2hvY29sYXRlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2UgJiBOYXR1cmVcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjaGVtaWNhbCBlbGVtZW50IExpdGhpdW0gaXMgbmFtZWQgYWZ0ZXIgdGhlIGNvdW50cnkgb2YgTGl0aHVhbmlhLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IEdhZGdldHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgRFZEIGludmVudGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5OTVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwMDBcIixcclxuICAgICAgICAgICAgXCIxOTkwXCIsXHJcbiAgICAgICAgICAgIFwiMTk4MFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBmdWxsIG5hbWUgb2YgdGhlIGZvb3RiYWxsZXIgJnF1b3Q7Q3Jpc3RpYW5vIFJvbmFsZG8mcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ3Jpc3RpYW5vIFJvbmFsZG8gZG9zIFNhbnRvcyBBdmVpcm9cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBSb25hbGRvIGxvcyBTYW50b3MgRGllZ29cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gQXJtYW5kbyBEaWVnbyBSb25hbGRvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEx1aXMgQXJtYW5kbyBSb25hbGRvXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGVzZSB0d28gY291bnRyaWVzIGhlbGQgYSBjb21tb253ZWFsdGggZnJvbSB0aGUgMTZ0aCB0byAxOHRoIGNlbnR1cnkuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9sYW5kIGFuZCBMaXRodWFuaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkh1dHUgYW5kIFJ3YW5kYVwiLFxyXG4gICAgICAgICAgICBcIk5vcnRoIEtvcmVhIGFuZCBTb3V0aCBLb3JlYVwiLFxyXG4gICAgICAgICAgICBcIkJhbmdsYWRlc2ggYW5kIEJodXRhblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7Q2FsbCBPZiBEdXR5OiBab21iaWVzJnF1b3Q7LCBjb21wbGV0aW5nIHdoaWNoIG1hcCYjMDM5O3MgbWFpbiBlYXN0ZXIgZWdnIHdpbGwgcmV3YXJkIHlvdSB3aXRoIHRoZSBhY2hpZXZlbWVudCwgJnF1b3Q7SGlnaCBNYWludGVuYW5jZSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEaWUgUmlzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTW9iIE9mIFRoZSBEZWFkXCIsXHJcbiAgICAgICAgICAgIFwiT3JpZ2luc1wiLFxyXG4gICAgICAgICAgICBcIkFzY2Vuc2lvblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDYXJ0b29uICYgQW5pbWF0aW9uc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0dyYXZpdHkgRmFsbHMmcXVvdDssIGhvdyBtdWNoIGRvZXMgV2FkZGxlcyB3ZWlnaCB3aGVuIE1hYmxlIHdpbnMgaGltIGluICZxdW90O1RoZSBUaW1lIFRyYXZlbGVyJiMwMzk7cyBQaWcmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTUgcG91bmRzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIxMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIzMCBwb3VuZHNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBnaXZlbiB0byBsYXllciA0IG9mIHRoZSBPcGVuIFN5c3RlbXMgSW50ZXJjb25uZWN0aW9uIChJU08pIG1vZGVsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRyYW5zcG9ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiU2Vzc2lvblwiLFxyXG4gICAgICAgICAgICBcIkRhdGEgbGlua1wiLFxyXG4gICAgICAgICAgICBcIk5ldHdvcmtcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IHllYXIgd2FzIGhvY2tleSBsZWdlbmQgV2F5bmUgR3JldHpreSBib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5NjFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjE5NjVcIixcclxuICAgICAgICAgICAgXCIxOTU5XCIsXHJcbiAgICAgICAgICAgIFwiMTk2M1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSG93IG1hbnkgZ2FtZXMgYXJlIHRoZXJlIGluIHRoZSAmcXVvdDtDb2xvbnkgV2FycyZxdW90OyBzZXJpZXMgZm9yIHRoZSBQbGF5U3RhdGlvbj9cIixcclxuICAgICAgICBcImFcIjogXCIzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyXCIsXHJcbiAgICAgICAgICAgIFwiNFwiLFxyXG4gICAgICAgICAgICBcIjVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiBXb3JsZCBvZiBXYXJjcmFmdCwgd2hpY2ggcmFpZCBpbnN0YW5jZSBmZWF0dXJlcyBhIGNoZXNzIGV2ZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkthcmF6aGFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJadWwmIzAzOTtBbWFuXCIsXHJcbiAgICAgICAgICAgIFwiQmxhY2t3aW5nIExhaXJcIixcclxuICAgICAgICAgICAgXCJUZW1wbGUgb2YgQWhuJiMwMzk7UWlyYWpcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGNvdW50cnkgd2FzIEpvc2VmIFN0YWxpbiBib3JuIGluP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdlb3JnaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJ1c3NpYVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbnlcIixcclxuICAgICAgICAgICAgXCJQb2xhbmRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBvZmZpY2lhbCBuYW1lIG9mIFByaW5jZSYjMDM5O3MgYmFja2luZyBiYW5kP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBSZXZvbHV0aW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgUGF1cGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBXYWlsZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEhlYXJ0YnJlYWtlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gR2FtZSBvZiBUaHJvbmVzIHdoYXQgaXMgdGhlIG5hbWUgb2YgSm9uIFNub3cmIzAzOTtzIHN3b3JkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvbmdjbGF3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJPYXRoa2VlcGVyXCIsXHJcbiAgICAgICAgICAgIFwiV2lkb3cmIzAzOTtzIFdhaWxcIixcclxuICAgICAgICAgICAgXCJOZWVkbGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgaW5zcGVjdG9yIGluIHRoZSBzZXJpZXMgJnF1b3Q7T24gdGhlIEJ1c2VzJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWtleVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFycGVyXCIsXHJcbiAgICAgICAgICAgIFwiTmFpbHlcIixcclxuICAgICAgICAgICAgXCJHYWxseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggYXJ0aXN0IGN1cmF0ZWQgdGhlIG9mZmljaWFsIHNvdW5kdHJhY2sgZm9yICZxdW90O1RoZSBIdW5nZXIgR2FtZXM6IE1vY2tpbmdqYXkgLSBQYXJ0IDEmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9yZGVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkthbnllIFdlc3RcIixcclxuICAgICAgICAgICAgXCJUb3ZlIExvXCIsXHJcbiAgICAgICAgICAgIFwiQ2hhcmxpIFhDWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBDYW5hZGlhbiAkMSBjb2luIGlzIGNvbGxvcXVpYWxseSBrbm93biBhcyBhIHdoYXQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9vbmllXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCb29saWVcIixcclxuICAgICAgICAgICAgXCJGb29saWVcIixcclxuICAgICAgICAgICAgXCJNb29kaWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlc2UgZm91bmRpbmcgZmF0aGVycyBvZiB0aGUgVW5pdGVkIFN0YXRlcyBvZiBBbWVyaWNhIGxhdGVyIGJlY2FtZSBwcmVzaWRlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmFtZXMgTW9ucm9lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbGV4YW5kZXIgSGFtaWx0b25cIixcclxuICAgICAgICAgICAgXCJTYW11ZWwgQWRhbXNcIixcclxuICAgICAgICAgICAgXCJSb2dlciBTaGVybWFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gRGl2aW5pdHk6IE9yaWdpbmFsIFNpbiBJSSwgd2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3Rlcj9cIixcclxuICAgICAgICBcImFcIjogXCJGYW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMb2hzZVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBSZWQgUHJpbmNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlcmUgYXJlIG5vIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hvIGlzIHRoZSBtYWluIHByb3RhZ29uaXN0IGluIHRoZSBnYW1lIExpZmUgaXMgU3RyYW5nZTogQmVmb3JlIFRoZSBTdG9ybT9cIixcclxuICAgICAgICBcImFcIjogXCJDaGxvZSBQcmljZSBcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1heCBDYXVsZmllbGRcIixcclxuICAgICAgICAgICAgXCJSYWNoZWwgQW1iZXJcIixcclxuICAgICAgICAgICAgXCJGcmFuayBCb3dlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSm9obm55IERlcHAgbWFkZSBoaXMgYmlnLXNjcmVlbiBhY3RpbmcgZGVidXQgaW4gd2hpY2ggZmlsbT9cIixcclxuICAgICAgICBcImFcIjogXCJBIE5pZ2h0bWFyZSBvbiBFbG0gU3RyZWV0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNeSBCbG9vZHkgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgICAgIFwiSGFsbG93ZWVuXCIsXHJcbiAgICAgICAgICAgIFwiRnJpZGF5IHRoZSAxM3RoXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O1Jlc2lkZW50IEV2aWwmcXVvdDssIG9ubHkgQ2hyaXMgaGFzIGFjY2VzcyB0byB0aGUgZ3JlbmFkZSBsYXVuY2hlci5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXJzIGlzIE5PVCBwbGF5YWJsZSBpbiAmcXVvdDtSZXNpZGVudCBFdmlsIDYmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmlsbCBWYWxlbnRpbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNocmlzIFJlZGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiU2hlcnJ5IEJpcmtpblwiLFxyXG4gICAgICAgICAgICBcIkhlbGVuYSBIYXJwZXJcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogSmFwYW5lc2UgQW5pbWUgJiBNYW5nYVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIDE5ODggZmlsbSAmcXVvdDtBa2lyYSZxdW90OywgVGV0c3VvIGVuZHMgdXAgZGVzdHJveWluZyBUb2t5by5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW9ncmFwaHlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgYm9keSBvZiB0aGUgRWd5cHRpYW4gU3BoaW54IHdhcyBiYXNlZCBvbiB3aGljaCBhbmltYWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQnVsbFwiLFxyXG4gICAgICAgICAgICBcIkhvcnNlXCIsXHJcbiAgICAgICAgICAgIFwiRG9nXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHJlbGF0aW9uIHRvIHRoZSBCcml0aXNoIE9jY3VwYXRpb24gaW4gSXJlbGFuZCwgd2hhdCBkb2VzIHRoZSBJUkEgc3RhbmQgZm9yLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIklyaXNoIFJlcHVibGljYW4gQXJteVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmViZWwgQWxsaWFuY2VcIixcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWZvcm1hdGlvbiBBcm15XCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2gtUm95YWwgQWxsaWFuY2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgcm9ib3QgaW4gdGhlIDE5NTEgc2NpZW5jZSBmaWN0aW9uIGZpbG0gY2xhc3NpYyAmIzAzOTtUaGUgRGF5IHRoZSBFYXJ0aCBTdG9vZCBTdGlsbCYjMDM5Oz9cIixcclxuICAgICAgICBcImFcIjogXCJHb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSb2JieVwiLFxyXG4gICAgICAgICAgICBcIkNvbG9zc3VzXCIsXHJcbiAgICAgICAgICAgIFwiQm94XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBSb21hbiBudW1lcmFsIGZvciA1MDA/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTFwiLFxyXG4gICAgICAgICAgICBcIkNcIixcclxuICAgICAgICAgICAgXCJYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbWFpbiBoZWFsaW5nIGl0ZW0gaW4gRGFyayBTb3Vscz9cIixcclxuICAgICAgICBcImFcIjogXCJFc3R1cyBGbGFza1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGVhbHRoIFBvdGlvblwiLFxyXG4gICAgICAgICAgICBcIk9yYW5nZSBKdWljZVwiLFxyXG4gICAgICAgICAgICBcIkFzaGVuIEZsYXNrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiT24gd2hpY2ggY29tcHV0ZXIgaGFyZHdhcmUgZGV2aWNlIGlzIHRoZSBCSU9TIGNoaXAgbG9jYXRlZD9cIixcclxuICAgICAgICBcImFcIjogXCJNb3RoZXJib2FyZFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFyZCBEaXNrIERyaXZlXCIsXHJcbiAgICAgICAgICAgIFwiQ2VudHJhbCBQcm9jZXNzaW5nIFVuaXRcIixcclxuICAgICAgICAgICAgXCJHcmFwaGljcyBQcm9jZXNzaW5nIFVuaXRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkEgdW5pdmVyc2FsIHNldCwgb3IgYSBzZXQgdGhhdCBjb250YWlucyBhbGwgc2V0cywgZXhpc3RzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBBY2UgQXR0b3JuZXkgdHJpbG9neSB3YXMgc3VwcG9zZSB0byBlbmQgd2l0aCAmcXVvdDtQaG9lbml4IFdyaWdodDogQWNlIEF0dG9ybmV5ICZtaW51czsgVHJpYWxzIGFuZCBUcmlidWxhdGlvbnMmcXVvdDsgYXMgaXRzIGZpbmFsIGdhbWUuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBoaWdoZXN0IGJlbHQgeW91IGNhbiBnZXQgaW4gVGFla3dvbmRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJXaGl0ZVwiLFxyXG4gICAgICAgICAgICBcIlJlZFwiLFxyXG4gICAgICAgICAgICBcIkdyZWVuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBVbml0ZWQgU3RhdGVzIERlcGFydG1lbnQgb2YgSG9tZWxhbmQgU2VjdXJpdHkgd2FzIGZvcm1lZCBpbiByZXNwb25zZSB0byB0aGUgU2VwdGVtYmVyIDExdGggYXR0YWNrcy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBcG9sbG8gbWlzc2lvbiB3YXMgdGhlIGxhc3Qgb25lIGluIE5BU0EmIzAzOTtzIEFwb2xsbyBwcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFwb2xsbyAxN1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDEzXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDExXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDE1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBpcyBhbiBleGlzdGluZyBmYW1pbHkgaW4gJnF1b3Q7VGhlIFNpbXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEdvdGggRmFtaWx5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFNpbW9sZW9uIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBQcm91ZCBGYW1pbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSBOdWNsZWFyIFRocm9uZSwgd2hhdCBvcmdhbml6YXRpb24gY2hhc2VzIHRoZSBwbGF5ZXIgY2hhcmFjdGVyIHRocm91Z2hvdXQgdGhlIGdhbWU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEkuRC5QLkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGaXNobWVuXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEJhbmRpdHNcIixcclxuICAgICAgICAgICAgXCJUaGUgWS5WLkcuR1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgJnF1b3Q7Q2F2ZSBTdG9yeSwmcXVvdDsgd2hhdCBpcyB0aGUgY2hhcmFjdGVyIEJhbHJvZyYjMDM5O3MgY2F0Y2hwaHJhc2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSHV6emFoIVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWWVzIVwiLFxyXG4gICAgICAgICAgICBcIldob2EgdGhlcmUhXCIsXHJcbiAgICAgICAgICAgIFwiTnllaCBoZWggaGVoIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJWZWhpY2xlc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9uZSBvZiB0aGVzZSBjaGFzc2lzIGNvZGVzIGFyZSB1c2VkIGJ5IEJNVyAzLXNlcmllcz9cIixcclxuICAgICAgICBcImFcIjogXCJFNDZcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkUzOVwiLFxyXG4gICAgICAgICAgICBcIkU4NVwiLFxyXG4gICAgICAgICAgICBcIkYxMFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDb21pY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB3aGF0IEhvbWVzdHVjayBVcGRhdGUgd2FzIFtTXSBHYW1lIE92ZXIgcmVsZWFzZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiT2N0b2JlciAyNXRoLCAyMDE0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcHJpbCAxM3RoLCAyMDA5XCIsXHJcbiAgICAgICAgICAgIFwiQXByaWwgOHRoLCAyMDEyXCIsXHJcbiAgICAgICAgICAgIFwiQXVndXN0IDI4dGgsIDIwMDNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBiYW5kIG1lbWJlcnMgb2YgQW1lcmljYW4gcm9jayBiYW5kIEtpbmcgb2YgTGVvbj9cIixcclxuICAgICAgICBcImFcIjogXCJCcm90aGVycyAmYW1wOyBjb3VzaW5zXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaGlsZGhvb2QgZnJpZW5kc1wiLFxyXG4gICAgICAgICAgICBcIkZvcm1lciBjbGFzc21hdGVzXCIsXHJcbiAgICAgICAgICAgIFwiRnJhdGVybml0eSBob3VzZSBtZW1iZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBmcmFuY2hpc2UgaGFkIGEgc3BlY2lhbCBldmVudCBob3N0ZWQgaW4gdGhlIHBvcHVsYXIgTU1PUlBHIEZpbmFsIEZhbnRhc3kgWElWOiBBIFJlYWxtIFJlYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCJZby1rYWkgV2F0Y2hcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlBvayZlYWN1dGU7bW9uXCIsXHJcbiAgICAgICAgICAgIFwiWXUtZ2ktb2hcIixcclxuICAgICAgICAgICAgXCJCdWRkeWZpZ2h0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggS2luZ2RvbSBIZWFydHMgZ2FtZSBmZWF0dXJlZCB0aGUgY2FzdCBvZiAmcXVvdDtUaGUgV29ybGQgRW5kcyBXaXRoIFlvdSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEcmVhbSBEcm9wIERpc3RhbmNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCaXJ0aCBCeSBTbGVlcFwiLFxyXG4gICAgICAgICAgICBcIjM2NS8yIERheXNcIixcclxuICAgICAgICAgICAgXCJSZTpDaGFpbiBvZiBNZW1vcmllc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGxhcmdlc3QgcGxhbmV0IGluIEtlcmJhbCBTcGFjZSBQcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkpvb2xcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkVlbG9vXCIsXHJcbiAgICAgICAgICAgIFwiS2VyYm9sXCIsXHJcbiAgICAgICAgICAgIFwiTWlubXVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQW5pbWFsIENyb3NzaW5nIGdhbWUgd2FzIGZvciB0aGUgTmludGVuZG8gV2lpP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFuaW1hbCBDcm9zc2luZzogQ2l0eSBGb2xrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IE5ldyBMZWFmXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBXaWxkIFdvcmxkXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBQb3B1bGF0aW9uIEdyb3dpbmchXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkdlb3JnZSBMdWNhcyBkaXJlY3RlZCB0aGUgZW50aXJlIG9yaWdpbmFsIFN0YXIgV2FycyB0cmlsb2d5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgY2l0eSBvZiBSb21lLCBJdGFseSBmb3VuZGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjc1MyBCQ0VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjkwMiBCQ0VcIixcclxuICAgICAgICAgICAgXCI1MjQgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNjk3IEJDRVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBkYXRhIHN0cnVjdHVyZSBkb2VzIEZJTE8gYXBwbHkgdG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiU3RhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlF1ZXVlXCIsXHJcbiAgICAgICAgICAgIFwiSGVhcFwiLFxyXG4gICAgICAgICAgICBcIlRyZWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gQmF0dGxlc3RhciBHYWxhY3RpY2EgKDIwMDQpLCBDeWxvbnMgd2VyZSBjcmVhdGVkIGJ5IG1hbiBhcyBjeWJlcm5ldGljIHdvcmtlcnMgYW5kIHNvbGRpZXJzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgMjAxNiBEaXNuZXkgYW5pbWF0ZWQgZmlsbSAmIzAzOTtNb2FuYSYjMDM5OyBpcyBiYXNlZCBvbiB3aGljaCBjdWx0dXJlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbHluZXNpYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk5hdGl2ZSBBbWVyaWNhblwiLFxyXG4gICAgICAgICAgICBcIkphcGFuZXNlXCIsXHJcbiAgICAgICAgICAgIFwiTm9yZGljXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2FrZSBkZXBpY3RlZCBpbiBWYWx2ZSYjMDM5O3MgJnF1b3Q7UG9ydGFsJnF1b3Q7IGZyYW5jaGlzZSBtb3N0IGNsb3NlbHkgcmVzZW1ibGVzIHdoaWNoIHJlYWwtd29ybGQgdHlwZSBvZiBjYWtlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrIEZvcmVzdFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRGV2aWwmIzAzOTtzIEZvb2RcIixcclxuICAgICAgICAgICAgXCJNb2x0ZW4gQ2hvY29sYXRlXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFuIENob2NvbGF0ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlICYgTmF0dXJlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2hlbWljYWwgZWxlbWVudCBMaXRoaXVtIGlzIG5hbWVkIGFmdGVyIHRoZSBjb3VudHJ5IG9mIExpdGh1YW5pYS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBHYWRnZXRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIERWRCBpbnZlbnRlZD9cIixcclxuICAgICAgICBcImFcIjogXCIxOTk1XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMDAwXCIsXHJcbiAgICAgICAgICAgIFwiMTk5MFwiLFxyXG4gICAgICAgICAgICBcIjE5ODBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgZnVsbCBuYW1lIG9mIHRoZSBmb290YmFsbGVyICZxdW90O0NyaXN0aWFubyBSb25hbGRvJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNyaXN0aWFubyBSb25hbGRvIGRvcyBTYW50b3MgQXZlaXJvXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gUm9uYWxkbyBsb3MgU2FudG9zIERpZWdvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEFybWFuZG8gRGllZ28gUm9uYWxkb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBMdWlzIEFybWFuZG8gUm9uYWxkb1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlc2UgdHdvIGNvdW50cmllcyBoZWxkIGEgY29tbW9ud2VhbHRoIGZyb20gdGhlIDE2dGggdG8gMTh0aCBjZW50dXJ5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbGFuZCBhbmQgTGl0aHVhbmlhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIdXR1IGFuZCBSd2FuZGFcIixcclxuICAgICAgICAgICAgXCJOb3J0aCBLb3JlYSBhbmQgU291dGggS29yZWFcIixcclxuICAgICAgICAgICAgXCJCYW5nbGFkZXNoIGFuZCBCaHV0YW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0NhbGwgT2YgRHV0eTogWm9tYmllcyZxdW90OywgY29tcGxldGluZyB3aGljaCBtYXAmIzAzOTtzIG1haW4gZWFzdGVyIGVnZyB3aWxsIHJld2FyZCB5b3Ugd2l0aCB0aGUgYWNoaWV2ZW1lbnQsICZxdW90O0hpZ2ggTWFpbnRlbmFuY2UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRGllIFJpc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1vYiBPZiBUaGUgRGVhZFwiLFxyXG4gICAgICAgICAgICBcIk9yaWdpbnNcIixcclxuICAgICAgICAgICAgXCJBc2NlbnNpb25cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ2FydG9vbiAmIEFuaW1hdGlvbnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtHcmF2aXR5IEZhbGxzJnF1b3Q7LCBob3cgbXVjaCBkb2VzIFdhZGRsZXMgd2VpZ2ggd2hlbiBNYWJsZSB3aW5zIGhpbSBpbiAmcXVvdDtUaGUgVGltZSBUcmF2ZWxlciYjMDM5O3MgUGlnJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE1IHBvdW5kc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMTAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMzAgcG91bmRzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgZ2l2ZW4gdG8gbGF5ZXIgNCBvZiB0aGUgT3BlbiBTeXN0ZW1zIEludGVyY29ubmVjdGlvbiAoSVNPKSBtb2RlbD9cIixcclxuICAgICAgICBcImFcIjogXCJUcmFuc3BvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlNlc3Npb25cIixcclxuICAgICAgICAgICAgXCJEYXRhIGxpbmtcIixcclxuICAgICAgICAgICAgXCJOZXR3b3JrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCB5ZWFyIHdhcyBob2NrZXkgbGVnZW5kIFdheW5lIEdyZXR6a3kgYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCIxOTYxXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIxOTY1XCIsXHJcbiAgICAgICAgICAgIFwiMTk1OVwiLFxyXG4gICAgICAgICAgICBcIjE5NjNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkhvdyBtYW55IGdhbWVzIGFyZSB0aGVyZSBpbiB0aGUgJnF1b3Q7Q29sb255IFdhcnMmcXVvdDsgc2VyaWVzIGZvciB0aGUgUGxheVN0YXRpb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiM1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMlwiLFxyXG4gICAgICAgICAgICBcIjRcIixcclxuICAgICAgICAgICAgXCI1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gV29ybGQgb2YgV2FyY3JhZnQsIHdoaWNoIHJhaWQgaW5zdGFuY2UgZmVhdHVyZXMgYSBjaGVzcyBldmVudD9cIixcclxuICAgICAgICBcImFcIjogXCJLYXJhemhhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWnVsJiMwMzk7QW1hblwiLFxyXG4gICAgICAgICAgICBcIkJsYWNrd2luZyBMYWlyXCIsXHJcbiAgICAgICAgICAgIFwiVGVtcGxlIG9mIEFobiYjMDM5O1FpcmFqXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBjb3VudHJ5IHdhcyBKb3NlZiBTdGFsaW4gYm9ybiBpbj9cIixcclxuICAgICAgICBcImFcIjogXCJHZW9yZ2lhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSdXNzaWFcIixcclxuICAgICAgICAgICAgXCJHZXJtYW55XCIsXHJcbiAgICAgICAgICAgIFwiUG9sYW5kXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgb2ZmaWNpYWwgbmFtZSBvZiBQcmluY2UmIzAzOTtzIGJhY2tpbmcgYmFuZD9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgUmV2b2x1dGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIFBhdXBlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgV2FpbGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBIZWFydGJyZWFrZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEdhbWUgb2YgVGhyb25lcyB3aGF0IGlzIHRoZSBuYW1lIG9mIEpvbiBTbm93JiMwMzk7cyBzd29yZD9cIixcclxuICAgICAgICBcImFcIjogXCJMb25nY2xhd1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiT2F0aGtlZXBlclwiLFxyXG4gICAgICAgICAgICBcIldpZG93JiMwMzk7cyBXYWlsXCIsXHJcbiAgICAgICAgICAgIFwiTmVlZGxlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGluc3BlY3RvciBpbiB0aGUgc2VyaWVzICZxdW90O09uIHRoZSBCdXNlcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFrZXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcnBlclwiLFxyXG4gICAgICAgICAgICBcIk5haWx5XCIsXHJcbiAgICAgICAgICAgIFwiR2FsbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGFydGlzdCBjdXJhdGVkIHRoZSBvZmZpY2lhbCBzb3VuZHRyYWNrIGZvciAmcXVvdDtUaGUgSHVuZ2VyIEdhbWVzOiBNb2NraW5namF5IC0gUGFydCAxJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvcmRlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJLYW55ZSBXZXN0XCIsXHJcbiAgICAgICAgICAgIFwiVG92ZSBMb1wiLFxyXG4gICAgICAgICAgICBcIkNoYXJsaSBYQ1hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQ2FuYWRpYW4gJDEgY29pbiBpcyBjb2xsb3F1aWFsbHkga25vd24gYXMgYSB3aGF0P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvb25pZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiRm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiTW9vZGllXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZXNlIGZvdW5kaW5nIGZhdGhlcnMgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgb2YgQW1lcmljYSBsYXRlciBiZWNhbWUgcHJlc2lkZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkphbWVzIE1vbnJvZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQWxleGFuZGVyIEhhbWlsdG9uXCIsXHJcbiAgICAgICAgICAgIFwiU2FtdWVsIEFkYW1zXCIsXHJcbiAgICAgICAgICAgIFwiUm9nZXIgU2hlcm1hblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIERpdmluaXR5OiBPcmlnaW5hbCBTaW4gSUksIHdoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXI/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFuZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTG9oc2VcIixcclxuICAgICAgICAgICAgXCJUaGUgUmVkIFByaW5jZVwiLFxyXG4gICAgICAgICAgICBcIlRoZXJlIGFyZSBubyBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldobyBpcyB0aGUgbWFpbiBwcm90YWdvbmlzdCBpbiB0aGUgZ2FtZSBMaWZlIGlzIFN0cmFuZ2U6IEJlZm9yZSBUaGUgU3Rvcm0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ2hsb2UgUHJpY2UgXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNYXggQ2F1bGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiUmFjaGVsIEFtYmVyXCIsXHJcbiAgICAgICAgICAgIFwiRnJhbmsgQm93ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkpvaG5ueSBEZXBwIG1hZGUgaGlzIGJpZy1zY3JlZW4gYWN0aW5nIGRlYnV0IGluIHdoaWNoIGZpbG0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQSBOaWdodG1hcmUgb24gRWxtIFN0cmVldFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTXkgQmxvb2R5IFZhbGVudGluZVwiLFxyXG4gICAgICAgICAgICBcIkhhbGxvd2VlblwiLFxyXG4gICAgICAgICAgICBcIkZyaWRheSB0aGUgMTN0aFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtSZXNpZGVudCBFdmlsJnF1b3Q7LCBvbmx5IENocmlzIGhhcyBhY2Nlc3MgdG8gdGhlIGdyZW5hZGUgbGF1bmNoZXIuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVycyBpcyBOT1QgcGxheWFibGUgaW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCA2JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkppbGwgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaHJpcyBSZWRmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlNoZXJyeSBCaXJraW5cIixcclxuICAgICAgICAgICAgXCJIZWxlbmEgSGFycGVyXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEphcGFuZXNlIEFuaW1lICYgTWFuZ2FcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSAxOTg4IGZpbG0gJnF1b3Q7QWtpcmEmcXVvdDssIFRldHN1byBlbmRzIHVwIGRlc3Ryb3lpbmcgVG9reW8uXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VvZ3JhcGh5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGJvZHkgb2YgdGhlIEVneXB0aWFuIFNwaGlueCB3YXMgYmFzZWQgb24gd2hpY2ggYW5pbWFsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJ1bGxcIixcclxuICAgICAgICAgICAgXCJIb3JzZVwiLFxyXG4gICAgICAgICAgICBcIkRvZ1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiByZWxhdGlvbiB0byB0aGUgQnJpdGlzaCBPY2N1cGF0aW9uIGluIElyZWxhbmQsIHdoYXQgZG9lcyB0aGUgSVJBIHN0YW5kIGZvci5cIixcclxuICAgICAgICBcImFcIjogXCJJcmlzaCBSZXB1YmxpY2FuIEFybXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIklyaXNoIFJlYmVsIEFsbGlhbmNlXCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmVmb3JtYXRpb24gQXJteVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoLVJveWFsIEFsbGlhbmNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHJvYm90IGluIHRoZSAxOTUxIHNjaWVuY2UgZmljdGlvbiBmaWxtIGNsYXNzaWMgJiMwMzk7VGhlIERheSB0aGUgRWFydGggU3Rvb2QgU3RpbGwmIzAzOTs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR29ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUm9iYnlcIixcclxuICAgICAgICAgICAgXCJDb2xvc3N1c1wiLFxyXG4gICAgICAgICAgICBcIkJveFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgUm9tYW4gbnVtZXJhbCBmb3IgNTAwP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxcIixcclxuICAgICAgICAgICAgXCJDXCIsXHJcbiAgICAgICAgICAgIFwiWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIG1haW4gaGVhbGluZyBpdGVtIGluIERhcmsgU291bHM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRXN0dXMgRmxhc2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhlYWx0aCBQb3Rpb25cIixcclxuICAgICAgICAgICAgXCJPcmFuZ2UgSnVpY2VcIixcclxuICAgICAgICAgICAgXCJBc2hlbiBGbGFza1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIk9uIHdoaWNoIGNvbXB1dGVyIGhhcmR3YXJlIGRldmljZSBpcyB0aGUgQklPUyBjaGlwIGxvY2F0ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTW90aGVyYm9hcmRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcmQgRGlzayBEcml2ZVwiLFxyXG4gICAgICAgICAgICBcIkNlbnRyYWwgUHJvY2Vzc2luZyBVbml0XCIsXHJcbiAgICAgICAgICAgIFwiR3JhcGhpY3MgUHJvY2Vzc2luZyBVbml0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJBIHVuaXZlcnNhbCBzZXQsIG9yIGEgc2V0IHRoYXQgY29udGFpbnMgYWxsIHNldHMsIGV4aXN0cy5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQWNlIEF0dG9ybmV5IHRyaWxvZ3kgd2FzIHN1cHBvc2UgdG8gZW5kIHdpdGggJnF1b3Q7UGhvZW5peCBXcmlnaHQ6IEFjZSBBdHRvcm5leSAmbWludXM7IFRyaWFscyBhbmQgVHJpYnVsYXRpb25zJnF1b3Q7IGFzIGl0cyBmaW5hbCBnYW1lLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgaGlnaGVzdCBiZWx0IHlvdSBjYW4gZ2V0IGluIFRhZWt3b25kbz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiV2hpdGVcIixcclxuICAgICAgICAgICAgXCJSZWRcIixcclxuICAgICAgICAgICAgXCJHcmVlblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgVW5pdGVkIFN0YXRlcyBEZXBhcnRtZW50IG9mIEhvbWVsYW5kIFNlY3VyaXR5IHdhcyBmb3JtZWQgaW4gcmVzcG9uc2UgdG8gdGhlIFNlcHRlbWJlciAxMXRoIGF0dGFja3MuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQXBvbGxvIG1pc3Npb24gd2FzIHRoZSBsYXN0IG9uZSBpbiBOQVNBJiMwMzk7cyBBcG9sbG8gcHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJBcG9sbG8gMTdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwb2xsbyAxM1wiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxMVwiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgaXMgYW4gZXhpc3RpbmcgZmFtaWx5IGluICZxdW90O1RoZSBTaW1zJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBHb3RoIEZhbWlseVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBTaW1vbGVvbiBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgUHJvdWQgRmFtaWx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgTnVjbGVhciBUaHJvbmUsIHdoYXQgb3JnYW5pemF0aW9uIGNoYXNlcyB0aGUgcGxheWVyIGNoYXJhY3RlciB0aHJvdWdob3V0IHRoZSBnYW1lP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBJLkQuUC5EXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmlzaG1lblwiLFxyXG4gICAgICAgICAgICBcIlRoZSBCYW5kaXRzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFkuVi5HLkdcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lICZxdW90O0NhdmUgU3RvcnksJnF1b3Q7IHdoYXQgaXMgdGhlIGNoYXJhY3RlciBCYWxyb2cmIzAzOTtzIGNhdGNocGhyYXNlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkh1enphaCFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlllcyFcIixcclxuICAgICAgICAgICAgXCJXaG9hIHRoZXJlIVwiLFxyXG4gICAgICAgICAgICBcIk55ZWggaGVoIGhlaCFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiVmVoaWNsZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvbmUgb2YgdGhlc2UgY2hhc3NpcyBjb2RlcyBhcmUgdXNlZCBieSBCTVcgMy1zZXJpZXM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRTQ2XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFMzlcIixcclxuICAgICAgICAgICAgXCJFODVcIixcclxuICAgICAgICAgICAgXCJGMTBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ29taWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gd2hhdCBIb21lc3R1Y2sgVXBkYXRlIHdhcyBbU10gR2FtZSBPdmVyIHJlbGVhc2VkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk9jdG9iZXIgMjV0aCwgMjAxNFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXByaWwgMTN0aCwgMjAwOVwiLFxyXG4gICAgICAgICAgICBcIkFwcmlsIDh0aCwgMjAxMlwiLFxyXG4gICAgICAgICAgICBcIkF1Z3VzdCAyOHRoLCAyMDAzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgYmFuZCBtZW1iZXJzIG9mIEFtZXJpY2FuIHJvY2sgYmFuZCBLaW5nIG9mIExlb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQnJvdGhlcnMgJmFtcDsgY291c2luc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hpbGRob29kIGZyaWVuZHNcIixcclxuICAgICAgICAgICAgXCJGb3JtZXIgY2xhc3NtYXRlc1wiLFxyXG4gICAgICAgICAgICBcIkZyYXRlcm5pdHkgaG91c2UgbWVtYmVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZnJhbmNoaXNlIGhhZCBhIHNwZWNpYWwgZXZlbnQgaG9zdGVkIGluIHRoZSBwb3B1bGFyIE1NT1JQRyBGaW5hbCBGYW50YXN5IFhJVjogQSBSZWFsbSBSZWJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiWW8ta2FpIFdhdGNoXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJQb2smZWFjdXRlO21vblwiLFxyXG4gICAgICAgICAgICBcIll1LWdpLW9oXCIsXHJcbiAgICAgICAgICAgIFwiQnVkZHlmaWdodFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEtpbmdkb20gSGVhcnRzIGdhbWUgZmVhdHVyZWQgdGhlIGNhc3Qgb2YgJnF1b3Q7VGhlIFdvcmxkIEVuZHMgV2l0aCBZb3UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRHJlYW0gRHJvcCBEaXN0YW5jZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQmlydGggQnkgU2xlZXBcIixcclxuICAgICAgICAgICAgXCIzNjUvMiBEYXlzXCIsXHJcbiAgICAgICAgICAgIFwiUmU6Q2hhaW4gb2YgTWVtb3JpZXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBsYXJnZXN0IHBsYW5ldCBpbiBLZXJiYWwgU3BhY2UgUHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJKb29sXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFZWxvb1wiLFxyXG4gICAgICAgICAgICBcIktlcmJvbFwiLFxyXG4gICAgICAgICAgICBcIk1pbm11c1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFuaW1hbCBDcm9zc2luZyBnYW1lIHdhcyBmb3IgdGhlIE5pbnRlbmRvIFdpaT9cIixcclxuICAgICAgICBcImFcIjogXCJBbmltYWwgQ3Jvc3Npbmc6IENpdHkgRm9sa1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBOZXcgTGVhZlwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogV2lsZCBXb3JsZFwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogUG9wdWxhdGlvbiBHcm93aW5nIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJHZW9yZ2UgTHVjYXMgZGlyZWN0ZWQgdGhlIGVudGlyZSBvcmlnaW5hbCBTdGFyIFdhcnMgdHJpbG9neS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIGNpdHkgb2YgUm9tZSwgSXRhbHkgZm91bmRlZD9cIixcclxuICAgICAgICBcImFcIjogXCI3NTMgQkNFXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCI5MDIgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNTI0IEJDRVwiLFxyXG4gICAgICAgICAgICBcIjY5NyBCQ0VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZGF0YSBzdHJ1Y3R1cmUgZG9lcyBGSUxPIGFwcGx5IHRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlN0YWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJRdWV1ZVwiLFxyXG4gICAgICAgICAgICBcIkhlYXBcIixcclxuICAgICAgICAgICAgXCJUcmVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEJhdHRsZXN0YXIgR2FsYWN0aWNhICgyMDA0KSwgQ3lsb25zIHdlcmUgY3JlYXRlZCBieSBtYW4gYXMgY3liZXJuZXRpYyB3b3JrZXJzIGFuZCBzb2xkaWVycy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIDIwMTYgRGlzbmV5IGFuaW1hdGVkIGZpbG0gJiMwMzk7TW9hbmEmIzAzOTsgaXMgYmFzZWQgb24gd2hpY2ggY3VsdHVyZT9cIixcclxuICAgICAgICBcImFcIjogXCJQb2x5bmVzaWFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJOYXRpdmUgQW1lcmljYW5cIixcclxuICAgICAgICAgICAgXCJKYXBhbmVzZVwiLFxyXG4gICAgICAgICAgICBcIk5vcmRpY1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNha2UgZGVwaWN0ZWQgaW4gVmFsdmUmIzAzOTtzICZxdW90O1BvcnRhbCZxdW90OyBmcmFuY2hpc2UgbW9zdCBjbG9zZWx5IHJlc2VtYmxlcyB3aGljaCByZWFsLXdvcmxkIHR5cGUgb2YgY2FrZT9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFjayBGb3Jlc3RcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkRldmlsJiMwMzk7cyBGb29kXCIsXHJcbiAgICAgICAgICAgIFwiTW9sdGVuIENob2NvbGF0ZVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbiBDaG9jb2xhdGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZSAmIE5hdHVyZVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNoZW1pY2FsIGVsZW1lbnQgTGl0aGl1bSBpcyBuYW1lZCBhZnRlciB0aGUgY291bnRyeSBvZiBMaXRodWFuaWEuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogR2FkZ2V0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBEVkQgaW52ZW50ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk5NVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAwMFwiLFxyXG4gICAgICAgICAgICBcIjE5OTBcIixcclxuICAgICAgICAgICAgXCIxOTgwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGZ1bGwgbmFtZSBvZiB0aGUgZm9vdGJhbGxlciAmcXVvdDtDcmlzdGlhbm8gUm9uYWxkbyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJDcmlzdGlhbm8gUm9uYWxkbyBkb3MgU2FudG9zIEF2ZWlyb1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIFJvbmFsZG8gbG9zIFNhbnRvcyBEaWVnb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBBcm1hbmRvIERpZWdvIFJvbmFsZG9cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gTHVpcyBBcm1hbmRvIFJvbmFsZG9cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZXNlIHR3byBjb3VudHJpZXMgaGVsZCBhIGNvbW1vbndlYWx0aCBmcm9tIHRoZSAxNnRoIHRvIDE4dGggY2VudHVyeS5cIixcclxuICAgICAgICBcImFcIjogXCJQb2xhbmQgYW5kIExpdGh1YW5pYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSHV0dSBhbmQgUndhbmRhXCIsXHJcbiAgICAgICAgICAgIFwiTm9ydGggS29yZWEgYW5kIFNvdXRoIEtvcmVhXCIsXHJcbiAgICAgICAgICAgIFwiQmFuZ2xhZGVzaCBhbmQgQmh1dGFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtDYWxsIE9mIER1dHk6IFpvbWJpZXMmcXVvdDssIGNvbXBsZXRpbmcgd2hpY2ggbWFwJiMwMzk7cyBtYWluIGVhc3RlciBlZ2cgd2lsbCByZXdhcmQgeW91IHdpdGggdGhlIGFjaGlldmVtZW50LCAmcXVvdDtIaWdoIE1haW50ZW5hbmNlJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRpZSBSaXNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNb2IgT2YgVGhlIERlYWRcIixcclxuICAgICAgICAgICAgXCJPcmlnaW5zXCIsXHJcbiAgICAgICAgICAgIFwiQXNjZW5zaW9uXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENhcnRvb24gJiBBbmltYXRpb25zXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7R3Jhdml0eSBGYWxscyZxdW90OywgaG93IG11Y2ggZG9lcyBXYWRkbGVzIHdlaWdoIHdoZW4gTWFibGUgd2lucyBoaW0gaW4gJnF1b3Q7VGhlIFRpbWUgVHJhdmVsZXImIzAzOTtzIFBpZyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCIxNSBwb3VuZHNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjEwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjMwIHBvdW5kc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIGdpdmVuIHRvIGxheWVyIDQgb2YgdGhlIE9wZW4gU3lzdGVtcyBJbnRlcmNvbm5lY3Rpb24gKElTTykgbW9kZWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJhbnNwb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJTZXNzaW9uXCIsXHJcbiAgICAgICAgICAgIFwiRGF0YSBsaW5rXCIsXHJcbiAgICAgICAgICAgIFwiTmV0d29ya1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgeWVhciB3YXMgaG9ja2V5IGxlZ2VuZCBXYXluZSBHcmV0emt5IGJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk2MVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMTk2NVwiLFxyXG4gICAgICAgICAgICBcIjE5NTlcIixcclxuICAgICAgICAgICAgXCIxOTYzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJIb3cgbWFueSBnYW1lcyBhcmUgdGhlcmUgaW4gdGhlICZxdW90O0NvbG9ueSBXYXJzJnF1b3Q7IHNlcmllcyBmb3IgdGhlIFBsYXlTdGF0aW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjJcIixcclxuICAgICAgICAgICAgXCI0XCIsXHJcbiAgICAgICAgICAgIFwiNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIFdvcmxkIG9mIFdhcmNyYWZ0LCB3aGljaCByYWlkIGluc3RhbmNlIGZlYXR1cmVzIGEgY2hlc3MgZXZlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiS2FyYXpoYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlp1bCYjMDM5O0FtYW5cIixcclxuICAgICAgICAgICAgXCJCbGFja3dpbmcgTGFpclwiLFxyXG4gICAgICAgICAgICBcIlRlbXBsZSBvZiBBaG4mIzAzOTtRaXJhalwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggY291bnRyeSB3YXMgSm9zZWYgU3RhbGluIGJvcm4gaW4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR2VvcmdpYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUnVzc2lhXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFueVwiLFxyXG4gICAgICAgICAgICBcIlBvbGFuZFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG9mZmljaWFsIG5hbWUgb2YgUHJpbmNlJiMwMzk7cyBiYWNraW5nIGJhbmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIFJldm9sdXRpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBQYXVwZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFdhaWxlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgSGVhcnRicmVha2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiBHYW1lIG9mIFRocm9uZXMgd2hhdCBpcyB0aGUgbmFtZSBvZiBKb24gU25vdyYjMDM5O3Mgc3dvcmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9uZ2NsYXdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk9hdGhrZWVwZXJcIixcclxuICAgICAgICAgICAgXCJXaWRvdyYjMDM5O3MgV2FpbFwiLFxyXG4gICAgICAgICAgICBcIk5lZWRsZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBpbnNwZWN0b3IgaW4gdGhlIHNlcmllcyAmcXVvdDtPbiB0aGUgQnVzZXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxha2V5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJwZXJcIixcclxuICAgICAgICAgICAgXCJOYWlseVwiLFxyXG4gICAgICAgICAgICBcIkdhbGx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBhcnRpc3QgY3VyYXRlZCB0aGUgb2ZmaWNpYWwgc291bmR0cmFjayBmb3IgJnF1b3Q7VGhlIEh1bmdlciBHYW1lczogTW9ja2luZ2pheSAtIFBhcnQgMSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJMb3JkZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiS2FueWUgV2VzdFwiLFxyXG4gICAgICAgICAgICBcIlRvdmUgTG9cIixcclxuICAgICAgICAgICAgXCJDaGFybGkgWENYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIENhbmFkaWFuICQxIGNvaW4gaXMgY29sbG9xdWlhbGx5IGtub3duIGFzIGEgd2hhdD9cIixcclxuICAgICAgICBcImFcIjogXCJMb29uaWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIkZvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIk1vb2RpZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGVzZSBmb3VuZGluZyBmYXRoZXJzIG9mIHRoZSBVbml0ZWQgU3RhdGVzIG9mIEFtZXJpY2EgbGF0ZXIgYmVjYW1lIHByZXNpZGVudD9cIixcclxuICAgICAgICBcImFcIjogXCJKYW1lcyBNb25yb2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFsZXhhbmRlciBIYW1pbHRvblwiLFxyXG4gICAgICAgICAgICBcIlNhbXVlbCBBZGFtc1wiLFxyXG4gICAgICAgICAgICBcIlJvZ2VyIFNoZXJtYW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBEaXZpbml0eTogT3JpZ2luYWwgU2luIElJLCB3aGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxvaHNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFJlZCBQcmluY2VcIixcclxuICAgICAgICAgICAgXCJUaGVyZSBhcmUgbm8gc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3RlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaG8gaXMgdGhlIG1haW4gcHJvdGFnb25pc3QgaW4gdGhlIGdhbWUgTGlmZSBpcyBTdHJhbmdlOiBCZWZvcmUgVGhlIFN0b3JtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNobG9lIFByaWNlIFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTWF4IENhdWxmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlJhY2hlbCBBbWJlclwiLFxyXG4gICAgICAgICAgICBcIkZyYW5rIEJvd2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJKb2hubnkgRGVwcCBtYWRlIGhpcyBiaWctc2NyZWVuIGFjdGluZyBkZWJ1dCBpbiB3aGljaCBmaWxtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkEgTmlnaHRtYXJlIG9uIEVsbSBTdHJlZXRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk15IEJsb29keSBWYWxlbnRpbmVcIixcclxuICAgICAgICAgICAgXCJIYWxsb3dlZW5cIixcclxuICAgICAgICAgICAgXCJGcmlkYXkgdGhlIDEzdGhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCZxdW90Oywgb25seSBDaHJpcyBoYXMgYWNjZXNzIHRvIHRoZSBncmVuYWRlIGxhdW5jaGVyLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcnMgaXMgTk9UIHBsYXlhYmxlIGluICZxdW90O1Jlc2lkZW50IEV2aWwgNiZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJKaWxsIFZhbGVudGluZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hyaXMgUmVkZmllbGRcIixcclxuICAgICAgICAgICAgXCJTaGVycnkgQmlya2luXCIsXHJcbiAgICAgICAgICAgIFwiSGVsZW5hIEhhcnBlclwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBKYXBhbmVzZSBBbmltZSAmIE1hbmdhXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgMTk4OCBmaWxtICZxdW90O0FraXJhJnF1b3Q7LCBUZXRzdW8gZW5kcyB1cCBkZXN0cm95aW5nIFRva3lvLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlb2dyYXBoeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBib2R5IG9mIHRoZSBFZ3lwdGlhbiBTcGhpbnggd2FzIGJhc2VkIG9uIHdoaWNoIGFuaW1hbD9cIixcclxuICAgICAgICBcImFcIjogXCJMaW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCdWxsXCIsXHJcbiAgICAgICAgICAgIFwiSG9yc2VcIixcclxuICAgICAgICAgICAgXCJEb2dcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gcmVsYXRpb24gdG8gdGhlIEJyaXRpc2ggT2NjdXBhdGlvbiBpbiBJcmVsYW5kLCB3aGF0IGRvZXMgdGhlIElSQSBzdGFuZCBmb3IuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSXJpc2ggUmVwdWJsaWNhbiBBcm15XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWJlbCBBbGxpYW5jZVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoIFJlZm9ybWF0aW9uIEFybXlcIixcclxuICAgICAgICAgICAgXCJJcmlzaC1Sb3lhbCBBbGxpYW5jZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSByb2JvdCBpbiB0aGUgMTk1MSBzY2llbmNlIGZpY3Rpb24gZmlsbSBjbGFzc2ljICYjMDM5O1RoZSBEYXkgdGhlIEVhcnRoIFN0b29kIFN0aWxsJiMwMzk7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJvYmJ5XCIsXHJcbiAgICAgICAgICAgIFwiQ29sb3NzdXNcIixcclxuICAgICAgICAgICAgXCJCb3hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIFJvbWFuIG51bWVyYWwgZm9yIDUwMD9cIixcclxuICAgICAgICBcImFcIjogXCJEXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMXCIsXHJcbiAgICAgICAgICAgIFwiQ1wiLFxyXG4gICAgICAgICAgICBcIlhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBtYWluIGhlYWxpbmcgaXRlbSBpbiBEYXJrIFNvdWxzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkVzdHVzIEZsYXNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIZWFsdGggUG90aW9uXCIsXHJcbiAgICAgICAgICAgIFwiT3JhbmdlIEp1aWNlXCIsXHJcbiAgICAgICAgICAgIFwiQXNoZW4gRmxhc2tcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJPbiB3aGljaCBjb21wdXRlciBoYXJkd2FyZSBkZXZpY2UgaXMgdGhlIEJJT1MgY2hpcCBsb2NhdGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk1vdGhlcmJvYXJkXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJkIERpc2sgRHJpdmVcIixcclxuICAgICAgICAgICAgXCJDZW50cmFsIFByb2Nlc3NpbmcgVW5pdFwiLFxyXG4gICAgICAgICAgICBcIkdyYXBoaWNzIFByb2Nlc3NpbmcgVW5pdFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiQSB1bml2ZXJzYWwgc2V0LCBvciBhIHNldCB0aGF0IGNvbnRhaW5zIGFsbCBzZXRzLCBleGlzdHMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIEFjZSBBdHRvcm5leSB0cmlsb2d5IHdhcyBzdXBwb3NlIHRvIGVuZCB3aXRoICZxdW90O1Bob2VuaXggV3JpZ2h0OiBBY2UgQXR0b3JuZXkgJm1pbnVzOyBUcmlhbHMgYW5kIFRyaWJ1bGF0aW9ucyZxdW90OyBhcyBpdHMgZmluYWwgZ2FtZS5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGhpZ2hlc3QgYmVsdCB5b3UgY2FuIGdldCBpbiBUYWVrd29uZG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIldoaXRlXCIsXHJcbiAgICAgICAgICAgIFwiUmVkXCIsXHJcbiAgICAgICAgICAgIFwiR3JlZW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIFVuaXRlZCBTdGF0ZXMgRGVwYXJ0bWVudCBvZiBIb21lbGFuZCBTZWN1cml0eSB3YXMgZm9ybWVkIGluIHJlc3BvbnNlIHRvIHRoZSBTZXB0ZW1iZXIgMTF0aCBhdHRhY2tzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFwb2xsbyBtaXNzaW9uIHdhcyB0aGUgbGFzdCBvbmUgaW4gTkFTQSYjMDM5O3MgQXBvbGxvIHByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQXBvbGxvIDE3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTNcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTFcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGlzIGFuIGV4aXN0aW5nIGZhbWlseSBpbiAmcXVvdDtUaGUgU2ltcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgR290aCBGYW1pbHlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgU2ltb2xlb24gRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFByb3VkIEZhbWlseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lIE51Y2xlYXIgVGhyb25lLCB3aGF0IG9yZ2FuaXphdGlvbiBjaGFzZXMgdGhlIHBsYXllciBjaGFyYWN0ZXIgdGhyb3VnaG91dCB0aGUgZ2FtZT9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgSS5ELlAuRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZpc2htZW5cIixcclxuICAgICAgICAgICAgXCJUaGUgQmFuZGl0c1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBZLlYuRy5HXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSAmcXVvdDtDYXZlIFN0b3J5LCZxdW90OyB3aGF0IGlzIHRoZSBjaGFyYWN0ZXIgQmFscm9nJiMwMzk7cyBjYXRjaHBocmFzZT9cIixcclxuICAgICAgICBcImFcIjogXCJIdXp6YWghXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJZZXMhXCIsXHJcbiAgICAgICAgICAgIFwiV2hvYSB0aGVyZSFcIixcclxuICAgICAgICAgICAgXCJOeWVoIGhlaCBoZWghXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlZlaGljbGVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb25lIG9mIHRoZXNlIGNoYXNzaXMgY29kZXMgYXJlIHVzZWQgYnkgQk1XIDMtc2VyaWVzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkU0NlwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRTM5XCIsXHJcbiAgICAgICAgICAgIFwiRTg1XCIsXHJcbiAgICAgICAgICAgIFwiRjEwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENvbWljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHdoYXQgSG9tZXN0dWNrIFVwZGF0ZSB3YXMgW1NdIEdhbWUgT3ZlciByZWxlYXNlZD9cIixcclxuICAgICAgICBcImFcIjogXCJPY3RvYmVyIDI1dGgsIDIwMTRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwcmlsIDEzdGgsIDIwMDlcIixcclxuICAgICAgICAgICAgXCJBcHJpbCA4dGgsIDIwMTJcIixcclxuICAgICAgICAgICAgXCJBdWd1c3QgMjh0aCwgMjAwM1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIGJhbmQgbWVtYmVycyBvZiBBbWVyaWNhbiByb2NrIGJhbmQgS2luZyBvZiBMZW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJyb3RoZXJzICZhbXA7IGNvdXNpbnNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNoaWxkaG9vZCBmcmllbmRzXCIsXHJcbiAgICAgICAgICAgIFwiRm9ybWVyIGNsYXNzbWF0ZXNcIixcclxuICAgICAgICAgICAgXCJGcmF0ZXJuaXR5IGhvdXNlIG1lbWJlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGZyYW5jaGlzZSBoYWQgYSBzcGVjaWFsIGV2ZW50IGhvc3RlZCBpbiB0aGUgcG9wdWxhciBNTU9SUEcgRmluYWwgRmFudGFzeSBYSVY6IEEgUmVhbG0gUmVib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIllvLWthaSBXYXRjaFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUG9rJmVhY3V0ZTttb25cIixcclxuICAgICAgICAgICAgXCJZdS1naS1vaFwiLFxyXG4gICAgICAgICAgICBcIkJ1ZGR5ZmlnaHRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBLaW5nZG9tIEhlYXJ0cyBnYW1lIGZlYXR1cmVkIHRoZSBjYXN0IG9mICZxdW90O1RoZSBXb3JsZCBFbmRzIFdpdGggWW91JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRyZWFtIERyb3AgRGlzdGFuY2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJpcnRoIEJ5IFNsZWVwXCIsXHJcbiAgICAgICAgICAgIFwiMzY1LzIgRGF5c1wiLFxyXG4gICAgICAgICAgICBcIlJlOkNoYWluIG9mIE1lbW9yaWVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbGFyZ2VzdCBwbGFuZXQgaW4gS2VyYmFsIFNwYWNlIFByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSm9vbFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRWVsb29cIixcclxuICAgICAgICAgICAgXCJLZXJib2xcIixcclxuICAgICAgICAgICAgXCJNaW5tdXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBbmltYWwgQ3Jvc3NpbmcgZ2FtZSB3YXMgZm9yIHRoZSBOaW50ZW5kbyBXaWk/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQW5pbWFsIENyb3NzaW5nOiBDaXR5IEZvbGtcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogTmV3IExlYWZcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFdpbGQgV29ybGRcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFBvcHVsYXRpb24gR3Jvd2luZyFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiR2VvcmdlIEx1Y2FzIGRpcmVjdGVkIHRoZSBlbnRpcmUgb3JpZ2luYWwgU3RhciBXYXJzIHRyaWxvZ3kuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBjaXR5IG9mIFJvbWUsIEl0YWx5IGZvdW5kZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiNzUzIEJDRVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiOTAyIEJDRVwiLFxyXG4gICAgICAgICAgICBcIjUyNCBCQ0VcIixcclxuICAgICAgICAgICAgXCI2OTcgQkNFXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGRhdGEgc3RydWN0dXJlIGRvZXMgRklMTyBhcHBseSB0bz9cIixcclxuICAgICAgICBcImFcIjogXCJTdGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUXVldWVcIixcclxuICAgICAgICAgICAgXCJIZWFwXCIsXHJcbiAgICAgICAgICAgIFwiVHJlZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBCYXR0bGVzdGFyIEdhbGFjdGljYSAoMjAwNCksIEN5bG9ucyB3ZXJlIGNyZWF0ZWQgYnkgbWFuIGFzIGN5YmVybmV0aWMgd29ya2VycyBhbmQgc29sZGllcnMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSAyMDE2IERpc25leSBhbmltYXRlZCBmaWxtICYjMDM5O01vYW5hJiMwMzk7IGlzIGJhc2VkIG9uIHdoaWNoIGN1bHR1cmU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9seW5lc2lhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTmF0aXZlIEFtZXJpY2FuXCIsXHJcbiAgICAgICAgICAgIFwiSmFwYW5lc2VcIixcclxuICAgICAgICAgICAgXCJOb3JkaWNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjYWtlIGRlcGljdGVkIGluIFZhbHZlJiMwMzk7cyAmcXVvdDtQb3J0YWwmcXVvdDsgZnJhbmNoaXNlIG1vc3QgY2xvc2VseSByZXNlbWJsZXMgd2hpY2ggcmVhbC13b3JsZCB0eXBlIG9mIGNha2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2sgRm9yZXN0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJEZXZpbCYjMDM5O3MgRm9vZFwiLFxyXG4gICAgICAgICAgICBcIk1vbHRlbiBDaG9jb2xhdGVcIixcclxuICAgICAgICAgICAgXCJHZXJtYW4gQ2hvY29sYXRlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2UgJiBOYXR1cmVcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjaGVtaWNhbCBlbGVtZW50IExpdGhpdW0gaXMgbmFtZWQgYWZ0ZXIgdGhlIGNvdW50cnkgb2YgTGl0aHVhbmlhLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IEdhZGdldHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgRFZEIGludmVudGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5OTVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwMDBcIixcclxuICAgICAgICAgICAgXCIxOTkwXCIsXHJcbiAgICAgICAgICAgIFwiMTk4MFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBmdWxsIG5hbWUgb2YgdGhlIGZvb3RiYWxsZXIgJnF1b3Q7Q3Jpc3RpYW5vIFJvbmFsZG8mcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ3Jpc3RpYW5vIFJvbmFsZG8gZG9zIFNhbnRvcyBBdmVpcm9cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBSb25hbGRvIGxvcyBTYW50b3MgRGllZ29cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gQXJtYW5kbyBEaWVnbyBSb25hbGRvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEx1aXMgQXJtYW5kbyBSb25hbGRvXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGVzZSB0d28gY291bnRyaWVzIGhlbGQgYSBjb21tb253ZWFsdGggZnJvbSB0aGUgMTZ0aCB0byAxOHRoIGNlbnR1cnkuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9sYW5kIGFuZCBMaXRodWFuaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkh1dHUgYW5kIFJ3YW5kYVwiLFxyXG4gICAgICAgICAgICBcIk5vcnRoIEtvcmVhIGFuZCBTb3V0aCBLb3JlYVwiLFxyXG4gICAgICAgICAgICBcIkJhbmdsYWRlc2ggYW5kIEJodXRhblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7Q2FsbCBPZiBEdXR5OiBab21iaWVzJnF1b3Q7LCBjb21wbGV0aW5nIHdoaWNoIG1hcCYjMDM5O3MgbWFpbiBlYXN0ZXIgZWdnIHdpbGwgcmV3YXJkIHlvdSB3aXRoIHRoZSBhY2hpZXZlbWVudCwgJnF1b3Q7SGlnaCBNYWludGVuYW5jZSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEaWUgUmlzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTW9iIE9mIFRoZSBEZWFkXCIsXHJcbiAgICAgICAgICAgIFwiT3JpZ2luc1wiLFxyXG4gICAgICAgICAgICBcIkFzY2Vuc2lvblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDYXJ0b29uICYgQW5pbWF0aW9uc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0dyYXZpdHkgRmFsbHMmcXVvdDssIGhvdyBtdWNoIGRvZXMgV2FkZGxlcyB3ZWlnaCB3aGVuIE1hYmxlIHdpbnMgaGltIGluICZxdW90O1RoZSBUaW1lIFRyYXZlbGVyJiMwMzk7cyBQaWcmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTUgcG91bmRzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIxMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIzMCBwb3VuZHNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBnaXZlbiB0byBsYXllciA0IG9mIHRoZSBPcGVuIFN5c3RlbXMgSW50ZXJjb25uZWN0aW9uIChJU08pIG1vZGVsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRyYW5zcG9ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiU2Vzc2lvblwiLFxyXG4gICAgICAgICAgICBcIkRhdGEgbGlua1wiLFxyXG4gICAgICAgICAgICBcIk5ldHdvcmtcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IHllYXIgd2FzIGhvY2tleSBsZWdlbmQgV2F5bmUgR3JldHpreSBib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5NjFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjE5NjVcIixcclxuICAgICAgICAgICAgXCIxOTU5XCIsXHJcbiAgICAgICAgICAgIFwiMTk2M1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSG93IG1hbnkgZ2FtZXMgYXJlIHRoZXJlIGluIHRoZSAmcXVvdDtDb2xvbnkgV2FycyZxdW90OyBzZXJpZXMgZm9yIHRoZSBQbGF5U3RhdGlvbj9cIixcclxuICAgICAgICBcImFcIjogXCIzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyXCIsXHJcbiAgICAgICAgICAgIFwiNFwiLFxyXG4gICAgICAgICAgICBcIjVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiBXb3JsZCBvZiBXYXJjcmFmdCwgd2hpY2ggcmFpZCBpbnN0YW5jZSBmZWF0dXJlcyBhIGNoZXNzIGV2ZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkthcmF6aGFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJadWwmIzAzOTtBbWFuXCIsXHJcbiAgICAgICAgICAgIFwiQmxhY2t3aW5nIExhaXJcIixcclxuICAgICAgICAgICAgXCJUZW1wbGUgb2YgQWhuJiMwMzk7UWlyYWpcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGNvdW50cnkgd2FzIEpvc2VmIFN0YWxpbiBib3JuIGluP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdlb3JnaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJ1c3NpYVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbnlcIixcclxuICAgICAgICAgICAgXCJQb2xhbmRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBvZmZpY2lhbCBuYW1lIG9mIFByaW5jZSYjMDM5O3MgYmFja2luZyBiYW5kP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBSZXZvbHV0aW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgUGF1cGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBXYWlsZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEhlYXJ0YnJlYWtlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gR2FtZSBvZiBUaHJvbmVzIHdoYXQgaXMgdGhlIG5hbWUgb2YgSm9uIFNub3cmIzAzOTtzIHN3b3JkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvbmdjbGF3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJPYXRoa2VlcGVyXCIsXHJcbiAgICAgICAgICAgIFwiV2lkb3cmIzAzOTtzIFdhaWxcIixcclxuICAgICAgICAgICAgXCJOZWVkbGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgaW5zcGVjdG9yIGluIHRoZSBzZXJpZXMgJnF1b3Q7T24gdGhlIEJ1c2VzJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWtleVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFycGVyXCIsXHJcbiAgICAgICAgICAgIFwiTmFpbHlcIixcclxuICAgICAgICAgICAgXCJHYWxseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggYXJ0aXN0IGN1cmF0ZWQgdGhlIG9mZmljaWFsIHNvdW5kdHJhY2sgZm9yICZxdW90O1RoZSBIdW5nZXIgR2FtZXM6IE1vY2tpbmdqYXkgLSBQYXJ0IDEmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9yZGVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkthbnllIFdlc3RcIixcclxuICAgICAgICAgICAgXCJUb3ZlIExvXCIsXHJcbiAgICAgICAgICAgIFwiQ2hhcmxpIFhDWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBDYW5hZGlhbiAkMSBjb2luIGlzIGNvbGxvcXVpYWxseSBrbm93biBhcyBhIHdoYXQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9vbmllXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCb29saWVcIixcclxuICAgICAgICAgICAgXCJGb29saWVcIixcclxuICAgICAgICAgICAgXCJNb29kaWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlc2UgZm91bmRpbmcgZmF0aGVycyBvZiB0aGUgVW5pdGVkIFN0YXRlcyBvZiBBbWVyaWNhIGxhdGVyIGJlY2FtZSBwcmVzaWRlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmFtZXMgTW9ucm9lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbGV4YW5kZXIgSGFtaWx0b25cIixcclxuICAgICAgICAgICAgXCJTYW11ZWwgQWRhbXNcIixcclxuICAgICAgICAgICAgXCJSb2dlciBTaGVybWFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gRGl2aW5pdHk6IE9yaWdpbmFsIFNpbiBJSSwgd2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3Rlcj9cIixcclxuICAgICAgICBcImFcIjogXCJGYW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMb2hzZVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBSZWQgUHJpbmNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlcmUgYXJlIG5vIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hvIGlzIHRoZSBtYWluIHByb3RhZ29uaXN0IGluIHRoZSBnYW1lIExpZmUgaXMgU3RyYW5nZTogQmVmb3JlIFRoZSBTdG9ybT9cIixcclxuICAgICAgICBcImFcIjogXCJDaGxvZSBQcmljZSBcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1heCBDYXVsZmllbGRcIixcclxuICAgICAgICAgICAgXCJSYWNoZWwgQW1iZXJcIixcclxuICAgICAgICAgICAgXCJGcmFuayBCb3dlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSm9obm55IERlcHAgbWFkZSBoaXMgYmlnLXNjcmVlbiBhY3RpbmcgZGVidXQgaW4gd2hpY2ggZmlsbT9cIixcclxuICAgICAgICBcImFcIjogXCJBIE5pZ2h0bWFyZSBvbiBFbG0gU3RyZWV0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNeSBCbG9vZHkgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgICAgIFwiSGFsbG93ZWVuXCIsXHJcbiAgICAgICAgICAgIFwiRnJpZGF5IHRoZSAxM3RoXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O1Jlc2lkZW50IEV2aWwmcXVvdDssIG9ubHkgQ2hyaXMgaGFzIGFjY2VzcyB0byB0aGUgZ3JlbmFkZSBsYXVuY2hlci5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXJzIGlzIE5PVCBwbGF5YWJsZSBpbiAmcXVvdDtSZXNpZGVudCBFdmlsIDYmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmlsbCBWYWxlbnRpbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNocmlzIFJlZGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiU2hlcnJ5IEJpcmtpblwiLFxyXG4gICAgICAgICAgICBcIkhlbGVuYSBIYXJwZXJcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogSmFwYW5lc2UgQW5pbWUgJiBNYW5nYVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIDE5ODggZmlsbSAmcXVvdDtBa2lyYSZxdW90OywgVGV0c3VvIGVuZHMgdXAgZGVzdHJveWluZyBUb2t5by5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW9ncmFwaHlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgYm9keSBvZiB0aGUgRWd5cHRpYW4gU3BoaW54IHdhcyBiYXNlZCBvbiB3aGljaCBhbmltYWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQnVsbFwiLFxyXG4gICAgICAgICAgICBcIkhvcnNlXCIsXHJcbiAgICAgICAgICAgIFwiRG9nXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHJlbGF0aW9uIHRvIHRoZSBCcml0aXNoIE9jY3VwYXRpb24gaW4gSXJlbGFuZCwgd2hhdCBkb2VzIHRoZSBJUkEgc3RhbmQgZm9yLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIklyaXNoIFJlcHVibGljYW4gQXJteVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmViZWwgQWxsaWFuY2VcIixcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWZvcm1hdGlvbiBBcm15XCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2gtUm95YWwgQWxsaWFuY2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgcm9ib3QgaW4gdGhlIDE5NTEgc2NpZW5jZSBmaWN0aW9uIGZpbG0gY2xhc3NpYyAmIzAzOTtUaGUgRGF5IHRoZSBFYXJ0aCBTdG9vZCBTdGlsbCYjMDM5Oz9cIixcclxuICAgICAgICBcImFcIjogXCJHb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSb2JieVwiLFxyXG4gICAgICAgICAgICBcIkNvbG9zc3VzXCIsXHJcbiAgICAgICAgICAgIFwiQm94XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBSb21hbiBudW1lcmFsIGZvciA1MDA/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTFwiLFxyXG4gICAgICAgICAgICBcIkNcIixcclxuICAgICAgICAgICAgXCJYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbWFpbiBoZWFsaW5nIGl0ZW0gaW4gRGFyayBTb3Vscz9cIixcclxuICAgICAgICBcImFcIjogXCJFc3R1cyBGbGFza1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGVhbHRoIFBvdGlvblwiLFxyXG4gICAgICAgICAgICBcIk9yYW5nZSBKdWljZVwiLFxyXG4gICAgICAgICAgICBcIkFzaGVuIEZsYXNrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiT24gd2hpY2ggY29tcHV0ZXIgaGFyZHdhcmUgZGV2aWNlIGlzIHRoZSBCSU9TIGNoaXAgbG9jYXRlZD9cIixcclxuICAgICAgICBcImFcIjogXCJNb3RoZXJib2FyZFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFyZCBEaXNrIERyaXZlXCIsXHJcbiAgICAgICAgICAgIFwiQ2VudHJhbCBQcm9jZXNzaW5nIFVuaXRcIixcclxuICAgICAgICAgICAgXCJHcmFwaGljcyBQcm9jZXNzaW5nIFVuaXRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkEgdW5pdmVyc2FsIHNldCwgb3IgYSBzZXQgdGhhdCBjb250YWlucyBhbGwgc2V0cywgZXhpc3RzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBBY2UgQXR0b3JuZXkgdHJpbG9neSB3YXMgc3VwcG9zZSB0byBlbmQgd2l0aCAmcXVvdDtQaG9lbml4IFdyaWdodDogQWNlIEF0dG9ybmV5ICZtaW51czsgVHJpYWxzIGFuZCBUcmlidWxhdGlvbnMmcXVvdDsgYXMgaXRzIGZpbmFsIGdhbWUuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBoaWdoZXN0IGJlbHQgeW91IGNhbiBnZXQgaW4gVGFla3dvbmRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJXaGl0ZVwiLFxyXG4gICAgICAgICAgICBcIlJlZFwiLFxyXG4gICAgICAgICAgICBcIkdyZWVuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBVbml0ZWQgU3RhdGVzIERlcGFydG1lbnQgb2YgSG9tZWxhbmQgU2VjdXJpdHkgd2FzIGZvcm1lZCBpbiByZXNwb25zZSB0byB0aGUgU2VwdGVtYmVyIDExdGggYXR0YWNrcy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBcG9sbG8gbWlzc2lvbiB3YXMgdGhlIGxhc3Qgb25lIGluIE5BU0EmIzAzOTtzIEFwb2xsbyBwcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFwb2xsbyAxN1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDEzXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDExXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDE1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBpcyBhbiBleGlzdGluZyBmYW1pbHkgaW4gJnF1b3Q7VGhlIFNpbXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEdvdGggRmFtaWx5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFNpbW9sZW9uIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBQcm91ZCBGYW1pbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSBOdWNsZWFyIFRocm9uZSwgd2hhdCBvcmdhbml6YXRpb24gY2hhc2VzIHRoZSBwbGF5ZXIgY2hhcmFjdGVyIHRocm91Z2hvdXQgdGhlIGdhbWU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEkuRC5QLkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGaXNobWVuXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEJhbmRpdHNcIixcclxuICAgICAgICAgICAgXCJUaGUgWS5WLkcuR1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgJnF1b3Q7Q2F2ZSBTdG9yeSwmcXVvdDsgd2hhdCBpcyB0aGUgY2hhcmFjdGVyIEJhbHJvZyYjMDM5O3MgY2F0Y2hwaHJhc2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSHV6emFoIVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWWVzIVwiLFxyXG4gICAgICAgICAgICBcIldob2EgdGhlcmUhXCIsXHJcbiAgICAgICAgICAgIFwiTnllaCBoZWggaGVoIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJWZWhpY2xlc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9uZSBvZiB0aGVzZSBjaGFzc2lzIGNvZGVzIGFyZSB1c2VkIGJ5IEJNVyAzLXNlcmllcz9cIixcclxuICAgICAgICBcImFcIjogXCJFNDZcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkUzOVwiLFxyXG4gICAgICAgICAgICBcIkU4NVwiLFxyXG4gICAgICAgICAgICBcIkYxMFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDb21pY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB3aGF0IEhvbWVzdHVjayBVcGRhdGUgd2FzIFtTXSBHYW1lIE92ZXIgcmVsZWFzZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiT2N0b2JlciAyNXRoLCAyMDE0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcHJpbCAxM3RoLCAyMDA5XCIsXHJcbiAgICAgICAgICAgIFwiQXByaWwgOHRoLCAyMDEyXCIsXHJcbiAgICAgICAgICAgIFwiQXVndXN0IDI4dGgsIDIwMDNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBiYW5kIG1lbWJlcnMgb2YgQW1lcmljYW4gcm9jayBiYW5kIEtpbmcgb2YgTGVvbj9cIixcclxuICAgICAgICBcImFcIjogXCJCcm90aGVycyAmYW1wOyBjb3VzaW5zXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaGlsZGhvb2QgZnJpZW5kc1wiLFxyXG4gICAgICAgICAgICBcIkZvcm1lciBjbGFzc21hdGVzXCIsXHJcbiAgICAgICAgICAgIFwiRnJhdGVybml0eSBob3VzZSBtZW1iZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBmcmFuY2hpc2UgaGFkIGEgc3BlY2lhbCBldmVudCBob3N0ZWQgaW4gdGhlIHBvcHVsYXIgTU1PUlBHIEZpbmFsIEZhbnRhc3kgWElWOiBBIFJlYWxtIFJlYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCJZby1rYWkgV2F0Y2hcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlBvayZlYWN1dGU7bW9uXCIsXHJcbiAgICAgICAgICAgIFwiWXUtZ2ktb2hcIixcclxuICAgICAgICAgICAgXCJCdWRkeWZpZ2h0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggS2luZ2RvbSBIZWFydHMgZ2FtZSBmZWF0dXJlZCB0aGUgY2FzdCBvZiAmcXVvdDtUaGUgV29ybGQgRW5kcyBXaXRoIFlvdSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEcmVhbSBEcm9wIERpc3RhbmNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCaXJ0aCBCeSBTbGVlcFwiLFxyXG4gICAgICAgICAgICBcIjM2NS8yIERheXNcIixcclxuICAgICAgICAgICAgXCJSZTpDaGFpbiBvZiBNZW1vcmllc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGxhcmdlc3QgcGxhbmV0IGluIEtlcmJhbCBTcGFjZSBQcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkpvb2xcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkVlbG9vXCIsXHJcbiAgICAgICAgICAgIFwiS2VyYm9sXCIsXHJcbiAgICAgICAgICAgIFwiTWlubXVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQW5pbWFsIENyb3NzaW5nIGdhbWUgd2FzIGZvciB0aGUgTmludGVuZG8gV2lpP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFuaW1hbCBDcm9zc2luZzogQ2l0eSBGb2xrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IE5ldyBMZWFmXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBXaWxkIFdvcmxkXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBQb3B1bGF0aW9uIEdyb3dpbmchXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkdlb3JnZSBMdWNhcyBkaXJlY3RlZCB0aGUgZW50aXJlIG9yaWdpbmFsIFN0YXIgV2FycyB0cmlsb2d5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgY2l0eSBvZiBSb21lLCBJdGFseSBmb3VuZGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjc1MyBCQ0VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjkwMiBCQ0VcIixcclxuICAgICAgICAgICAgXCI1MjQgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNjk3IEJDRVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBkYXRhIHN0cnVjdHVyZSBkb2VzIEZJTE8gYXBwbHkgdG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiU3RhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlF1ZXVlXCIsXHJcbiAgICAgICAgICAgIFwiSGVhcFwiLFxyXG4gICAgICAgICAgICBcIlRyZWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gQmF0dGxlc3RhciBHYWxhY3RpY2EgKDIwMDQpLCBDeWxvbnMgd2VyZSBjcmVhdGVkIGJ5IG1hbiBhcyBjeWJlcm5ldGljIHdvcmtlcnMgYW5kIHNvbGRpZXJzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgMjAxNiBEaXNuZXkgYW5pbWF0ZWQgZmlsbSAmIzAzOTtNb2FuYSYjMDM5OyBpcyBiYXNlZCBvbiB3aGljaCBjdWx0dXJlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbHluZXNpYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk5hdGl2ZSBBbWVyaWNhblwiLFxyXG4gICAgICAgICAgICBcIkphcGFuZXNlXCIsXHJcbiAgICAgICAgICAgIFwiTm9yZGljXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2FrZSBkZXBpY3RlZCBpbiBWYWx2ZSYjMDM5O3MgJnF1b3Q7UG9ydGFsJnF1b3Q7IGZyYW5jaGlzZSBtb3N0IGNsb3NlbHkgcmVzZW1ibGVzIHdoaWNoIHJlYWwtd29ybGQgdHlwZSBvZiBjYWtlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrIEZvcmVzdFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRGV2aWwmIzAzOTtzIEZvb2RcIixcclxuICAgICAgICAgICAgXCJNb2x0ZW4gQ2hvY29sYXRlXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFuIENob2NvbGF0ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlICYgTmF0dXJlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2hlbWljYWwgZWxlbWVudCBMaXRoaXVtIGlzIG5hbWVkIGFmdGVyIHRoZSBjb3VudHJ5IG9mIExpdGh1YW5pYS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBHYWRnZXRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIERWRCBpbnZlbnRlZD9cIixcclxuICAgICAgICBcImFcIjogXCIxOTk1XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMDAwXCIsXHJcbiAgICAgICAgICAgIFwiMTk5MFwiLFxyXG4gICAgICAgICAgICBcIjE5ODBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgZnVsbCBuYW1lIG9mIHRoZSBmb290YmFsbGVyICZxdW90O0NyaXN0aWFubyBSb25hbGRvJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNyaXN0aWFubyBSb25hbGRvIGRvcyBTYW50b3MgQXZlaXJvXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gUm9uYWxkbyBsb3MgU2FudG9zIERpZWdvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEFybWFuZG8gRGllZ28gUm9uYWxkb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBMdWlzIEFybWFuZG8gUm9uYWxkb1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlc2UgdHdvIGNvdW50cmllcyBoZWxkIGEgY29tbW9ud2VhbHRoIGZyb20gdGhlIDE2dGggdG8gMTh0aCBjZW50dXJ5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbGFuZCBhbmQgTGl0aHVhbmlhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIdXR1IGFuZCBSd2FuZGFcIixcclxuICAgICAgICAgICAgXCJOb3J0aCBLb3JlYSBhbmQgU291dGggS29yZWFcIixcclxuICAgICAgICAgICAgXCJCYW5nbGFkZXNoIGFuZCBCaHV0YW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0NhbGwgT2YgRHV0eTogWm9tYmllcyZxdW90OywgY29tcGxldGluZyB3aGljaCBtYXAmIzAzOTtzIG1haW4gZWFzdGVyIGVnZyB3aWxsIHJld2FyZCB5b3Ugd2l0aCB0aGUgYWNoaWV2ZW1lbnQsICZxdW90O0hpZ2ggTWFpbnRlbmFuY2UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRGllIFJpc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1vYiBPZiBUaGUgRGVhZFwiLFxyXG4gICAgICAgICAgICBcIk9yaWdpbnNcIixcclxuICAgICAgICAgICAgXCJBc2NlbnNpb25cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ2FydG9vbiAmIEFuaW1hdGlvbnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtHcmF2aXR5IEZhbGxzJnF1b3Q7LCBob3cgbXVjaCBkb2VzIFdhZGRsZXMgd2VpZ2ggd2hlbiBNYWJsZSB3aW5zIGhpbSBpbiAmcXVvdDtUaGUgVGltZSBUcmF2ZWxlciYjMDM5O3MgUGlnJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE1IHBvdW5kc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMTAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMzAgcG91bmRzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgZ2l2ZW4gdG8gbGF5ZXIgNCBvZiB0aGUgT3BlbiBTeXN0ZW1zIEludGVyY29ubmVjdGlvbiAoSVNPKSBtb2RlbD9cIixcclxuICAgICAgICBcImFcIjogXCJUcmFuc3BvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlNlc3Npb25cIixcclxuICAgICAgICAgICAgXCJEYXRhIGxpbmtcIixcclxuICAgICAgICAgICAgXCJOZXR3b3JrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCB5ZWFyIHdhcyBob2NrZXkgbGVnZW5kIFdheW5lIEdyZXR6a3kgYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCIxOTYxXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIxOTY1XCIsXHJcbiAgICAgICAgICAgIFwiMTk1OVwiLFxyXG4gICAgICAgICAgICBcIjE5NjNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkhvdyBtYW55IGdhbWVzIGFyZSB0aGVyZSBpbiB0aGUgJnF1b3Q7Q29sb255IFdhcnMmcXVvdDsgc2VyaWVzIGZvciB0aGUgUGxheVN0YXRpb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiM1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMlwiLFxyXG4gICAgICAgICAgICBcIjRcIixcclxuICAgICAgICAgICAgXCI1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gV29ybGQgb2YgV2FyY3JhZnQsIHdoaWNoIHJhaWQgaW5zdGFuY2UgZmVhdHVyZXMgYSBjaGVzcyBldmVudD9cIixcclxuICAgICAgICBcImFcIjogXCJLYXJhemhhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWnVsJiMwMzk7QW1hblwiLFxyXG4gICAgICAgICAgICBcIkJsYWNrd2luZyBMYWlyXCIsXHJcbiAgICAgICAgICAgIFwiVGVtcGxlIG9mIEFobiYjMDM5O1FpcmFqXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBjb3VudHJ5IHdhcyBKb3NlZiBTdGFsaW4gYm9ybiBpbj9cIixcclxuICAgICAgICBcImFcIjogXCJHZW9yZ2lhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSdXNzaWFcIixcclxuICAgICAgICAgICAgXCJHZXJtYW55XCIsXHJcbiAgICAgICAgICAgIFwiUG9sYW5kXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgb2ZmaWNpYWwgbmFtZSBvZiBQcmluY2UmIzAzOTtzIGJhY2tpbmcgYmFuZD9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgUmV2b2x1dGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIFBhdXBlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgV2FpbGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBIZWFydGJyZWFrZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEdhbWUgb2YgVGhyb25lcyB3aGF0IGlzIHRoZSBuYW1lIG9mIEpvbiBTbm93JiMwMzk7cyBzd29yZD9cIixcclxuICAgICAgICBcImFcIjogXCJMb25nY2xhd1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiT2F0aGtlZXBlclwiLFxyXG4gICAgICAgICAgICBcIldpZG93JiMwMzk7cyBXYWlsXCIsXHJcbiAgICAgICAgICAgIFwiTmVlZGxlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGluc3BlY3RvciBpbiB0aGUgc2VyaWVzICZxdW90O09uIHRoZSBCdXNlcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFrZXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcnBlclwiLFxyXG4gICAgICAgICAgICBcIk5haWx5XCIsXHJcbiAgICAgICAgICAgIFwiR2FsbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGFydGlzdCBjdXJhdGVkIHRoZSBvZmZpY2lhbCBzb3VuZHRyYWNrIGZvciAmcXVvdDtUaGUgSHVuZ2VyIEdhbWVzOiBNb2NraW5namF5IC0gUGFydCAxJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvcmRlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJLYW55ZSBXZXN0XCIsXHJcbiAgICAgICAgICAgIFwiVG92ZSBMb1wiLFxyXG4gICAgICAgICAgICBcIkNoYXJsaSBYQ1hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQ2FuYWRpYW4gJDEgY29pbiBpcyBjb2xsb3F1aWFsbHkga25vd24gYXMgYSB3aGF0P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvb25pZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiRm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiTW9vZGllXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZXNlIGZvdW5kaW5nIGZhdGhlcnMgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgb2YgQW1lcmljYSBsYXRlciBiZWNhbWUgcHJlc2lkZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkphbWVzIE1vbnJvZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQWxleGFuZGVyIEhhbWlsdG9uXCIsXHJcbiAgICAgICAgICAgIFwiU2FtdWVsIEFkYW1zXCIsXHJcbiAgICAgICAgICAgIFwiUm9nZXIgU2hlcm1hblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIERpdmluaXR5OiBPcmlnaW5hbCBTaW4gSUksIHdoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXI/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFuZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTG9oc2VcIixcclxuICAgICAgICAgICAgXCJUaGUgUmVkIFByaW5jZVwiLFxyXG4gICAgICAgICAgICBcIlRoZXJlIGFyZSBubyBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldobyBpcyB0aGUgbWFpbiBwcm90YWdvbmlzdCBpbiB0aGUgZ2FtZSBMaWZlIGlzIFN0cmFuZ2U6IEJlZm9yZSBUaGUgU3Rvcm0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ2hsb2UgUHJpY2UgXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNYXggQ2F1bGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiUmFjaGVsIEFtYmVyXCIsXHJcbiAgICAgICAgICAgIFwiRnJhbmsgQm93ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkpvaG5ueSBEZXBwIG1hZGUgaGlzIGJpZy1zY3JlZW4gYWN0aW5nIGRlYnV0IGluIHdoaWNoIGZpbG0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQSBOaWdodG1hcmUgb24gRWxtIFN0cmVldFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTXkgQmxvb2R5IFZhbGVudGluZVwiLFxyXG4gICAgICAgICAgICBcIkhhbGxvd2VlblwiLFxyXG4gICAgICAgICAgICBcIkZyaWRheSB0aGUgMTN0aFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtSZXNpZGVudCBFdmlsJnF1b3Q7LCBvbmx5IENocmlzIGhhcyBhY2Nlc3MgdG8gdGhlIGdyZW5hZGUgbGF1bmNoZXIuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVycyBpcyBOT1QgcGxheWFibGUgaW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCA2JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkppbGwgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaHJpcyBSZWRmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlNoZXJyeSBCaXJraW5cIixcclxuICAgICAgICAgICAgXCJIZWxlbmEgSGFycGVyXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEphcGFuZXNlIEFuaW1lICYgTWFuZ2FcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSAxOTg4IGZpbG0gJnF1b3Q7QWtpcmEmcXVvdDssIFRldHN1byBlbmRzIHVwIGRlc3Ryb3lpbmcgVG9reW8uXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VvZ3JhcGh5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGJvZHkgb2YgdGhlIEVneXB0aWFuIFNwaGlueCB3YXMgYmFzZWQgb24gd2hpY2ggYW5pbWFsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJ1bGxcIixcclxuICAgICAgICAgICAgXCJIb3JzZVwiLFxyXG4gICAgICAgICAgICBcIkRvZ1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiByZWxhdGlvbiB0byB0aGUgQnJpdGlzaCBPY2N1cGF0aW9uIGluIElyZWxhbmQsIHdoYXQgZG9lcyB0aGUgSVJBIHN0YW5kIGZvci5cIixcclxuICAgICAgICBcImFcIjogXCJJcmlzaCBSZXB1YmxpY2FuIEFybXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIklyaXNoIFJlYmVsIEFsbGlhbmNlXCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmVmb3JtYXRpb24gQXJteVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoLVJveWFsIEFsbGlhbmNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHJvYm90IGluIHRoZSAxOTUxIHNjaWVuY2UgZmljdGlvbiBmaWxtIGNsYXNzaWMgJiMwMzk7VGhlIERheSB0aGUgRWFydGggU3Rvb2QgU3RpbGwmIzAzOTs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR29ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUm9iYnlcIixcclxuICAgICAgICAgICAgXCJDb2xvc3N1c1wiLFxyXG4gICAgICAgICAgICBcIkJveFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgUm9tYW4gbnVtZXJhbCBmb3IgNTAwP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxcIixcclxuICAgICAgICAgICAgXCJDXCIsXHJcbiAgICAgICAgICAgIFwiWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIG1haW4gaGVhbGluZyBpdGVtIGluIERhcmsgU291bHM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRXN0dXMgRmxhc2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhlYWx0aCBQb3Rpb25cIixcclxuICAgICAgICAgICAgXCJPcmFuZ2UgSnVpY2VcIixcclxuICAgICAgICAgICAgXCJBc2hlbiBGbGFza1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIk9uIHdoaWNoIGNvbXB1dGVyIGhhcmR3YXJlIGRldmljZSBpcyB0aGUgQklPUyBjaGlwIGxvY2F0ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTW90aGVyYm9hcmRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcmQgRGlzayBEcml2ZVwiLFxyXG4gICAgICAgICAgICBcIkNlbnRyYWwgUHJvY2Vzc2luZyBVbml0XCIsXHJcbiAgICAgICAgICAgIFwiR3JhcGhpY3MgUHJvY2Vzc2luZyBVbml0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJBIHVuaXZlcnNhbCBzZXQsIG9yIGEgc2V0IHRoYXQgY29udGFpbnMgYWxsIHNldHMsIGV4aXN0cy5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQWNlIEF0dG9ybmV5IHRyaWxvZ3kgd2FzIHN1cHBvc2UgdG8gZW5kIHdpdGggJnF1b3Q7UGhvZW5peCBXcmlnaHQ6IEFjZSBBdHRvcm5leSAmbWludXM7IFRyaWFscyBhbmQgVHJpYnVsYXRpb25zJnF1b3Q7IGFzIGl0cyBmaW5hbCBnYW1lLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgaGlnaGVzdCBiZWx0IHlvdSBjYW4gZ2V0IGluIFRhZWt3b25kbz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiV2hpdGVcIixcclxuICAgICAgICAgICAgXCJSZWRcIixcclxuICAgICAgICAgICAgXCJHcmVlblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgVW5pdGVkIFN0YXRlcyBEZXBhcnRtZW50IG9mIEhvbWVsYW5kIFNlY3VyaXR5IHdhcyBmb3JtZWQgaW4gcmVzcG9uc2UgdG8gdGhlIFNlcHRlbWJlciAxMXRoIGF0dGFja3MuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQXBvbGxvIG1pc3Npb24gd2FzIHRoZSBsYXN0IG9uZSBpbiBOQVNBJiMwMzk7cyBBcG9sbG8gcHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJBcG9sbG8gMTdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwb2xsbyAxM1wiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxMVwiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgaXMgYW4gZXhpc3RpbmcgZmFtaWx5IGluICZxdW90O1RoZSBTaW1zJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBHb3RoIEZhbWlseVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBTaW1vbGVvbiBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgUHJvdWQgRmFtaWx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgTnVjbGVhciBUaHJvbmUsIHdoYXQgb3JnYW5pemF0aW9uIGNoYXNlcyB0aGUgcGxheWVyIGNoYXJhY3RlciB0aHJvdWdob3V0IHRoZSBnYW1lP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBJLkQuUC5EXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmlzaG1lblwiLFxyXG4gICAgICAgICAgICBcIlRoZSBCYW5kaXRzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFkuVi5HLkdcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lICZxdW90O0NhdmUgU3RvcnksJnF1b3Q7IHdoYXQgaXMgdGhlIGNoYXJhY3RlciBCYWxyb2cmIzAzOTtzIGNhdGNocGhyYXNlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkh1enphaCFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlllcyFcIixcclxuICAgICAgICAgICAgXCJXaG9hIHRoZXJlIVwiLFxyXG4gICAgICAgICAgICBcIk55ZWggaGVoIGhlaCFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiVmVoaWNsZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvbmUgb2YgdGhlc2UgY2hhc3NpcyBjb2RlcyBhcmUgdXNlZCBieSBCTVcgMy1zZXJpZXM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRTQ2XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFMzlcIixcclxuICAgICAgICAgICAgXCJFODVcIixcclxuICAgICAgICAgICAgXCJGMTBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ29taWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gd2hhdCBIb21lc3R1Y2sgVXBkYXRlIHdhcyBbU10gR2FtZSBPdmVyIHJlbGVhc2VkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk9jdG9iZXIgMjV0aCwgMjAxNFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXByaWwgMTN0aCwgMjAwOVwiLFxyXG4gICAgICAgICAgICBcIkFwcmlsIDh0aCwgMjAxMlwiLFxyXG4gICAgICAgICAgICBcIkF1Z3VzdCAyOHRoLCAyMDAzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgYmFuZCBtZW1iZXJzIG9mIEFtZXJpY2FuIHJvY2sgYmFuZCBLaW5nIG9mIExlb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQnJvdGhlcnMgJmFtcDsgY291c2luc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hpbGRob29kIGZyaWVuZHNcIixcclxuICAgICAgICAgICAgXCJGb3JtZXIgY2xhc3NtYXRlc1wiLFxyXG4gICAgICAgICAgICBcIkZyYXRlcm5pdHkgaG91c2UgbWVtYmVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZnJhbmNoaXNlIGhhZCBhIHNwZWNpYWwgZXZlbnQgaG9zdGVkIGluIHRoZSBwb3B1bGFyIE1NT1JQRyBGaW5hbCBGYW50YXN5IFhJVjogQSBSZWFsbSBSZWJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiWW8ta2FpIFdhdGNoXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJQb2smZWFjdXRlO21vblwiLFxyXG4gICAgICAgICAgICBcIll1LWdpLW9oXCIsXHJcbiAgICAgICAgICAgIFwiQnVkZHlmaWdodFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEtpbmdkb20gSGVhcnRzIGdhbWUgZmVhdHVyZWQgdGhlIGNhc3Qgb2YgJnF1b3Q7VGhlIFdvcmxkIEVuZHMgV2l0aCBZb3UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRHJlYW0gRHJvcCBEaXN0YW5jZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQmlydGggQnkgU2xlZXBcIixcclxuICAgICAgICAgICAgXCIzNjUvMiBEYXlzXCIsXHJcbiAgICAgICAgICAgIFwiUmU6Q2hhaW4gb2YgTWVtb3JpZXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBsYXJnZXN0IHBsYW5ldCBpbiBLZXJiYWwgU3BhY2UgUHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJKb29sXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFZWxvb1wiLFxyXG4gICAgICAgICAgICBcIktlcmJvbFwiLFxyXG4gICAgICAgICAgICBcIk1pbm11c1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFuaW1hbCBDcm9zc2luZyBnYW1lIHdhcyBmb3IgdGhlIE5pbnRlbmRvIFdpaT9cIixcclxuICAgICAgICBcImFcIjogXCJBbmltYWwgQ3Jvc3Npbmc6IENpdHkgRm9sa1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBOZXcgTGVhZlwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogV2lsZCBXb3JsZFwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogUG9wdWxhdGlvbiBHcm93aW5nIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJHZW9yZ2UgTHVjYXMgZGlyZWN0ZWQgdGhlIGVudGlyZSBvcmlnaW5hbCBTdGFyIFdhcnMgdHJpbG9neS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIGNpdHkgb2YgUm9tZSwgSXRhbHkgZm91bmRlZD9cIixcclxuICAgICAgICBcImFcIjogXCI3NTMgQkNFXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCI5MDIgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNTI0IEJDRVwiLFxyXG4gICAgICAgICAgICBcIjY5NyBCQ0VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZGF0YSBzdHJ1Y3R1cmUgZG9lcyBGSUxPIGFwcGx5IHRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlN0YWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJRdWV1ZVwiLFxyXG4gICAgICAgICAgICBcIkhlYXBcIixcclxuICAgICAgICAgICAgXCJUcmVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEJhdHRsZXN0YXIgR2FsYWN0aWNhICgyMDA0KSwgQ3lsb25zIHdlcmUgY3JlYXRlZCBieSBtYW4gYXMgY3liZXJuZXRpYyB3b3JrZXJzIGFuZCBzb2xkaWVycy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIDIwMTYgRGlzbmV5IGFuaW1hdGVkIGZpbG0gJiMwMzk7TW9hbmEmIzAzOTsgaXMgYmFzZWQgb24gd2hpY2ggY3VsdHVyZT9cIixcclxuICAgICAgICBcImFcIjogXCJQb2x5bmVzaWFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJOYXRpdmUgQW1lcmljYW5cIixcclxuICAgICAgICAgICAgXCJKYXBhbmVzZVwiLFxyXG4gICAgICAgICAgICBcIk5vcmRpY1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNha2UgZGVwaWN0ZWQgaW4gVmFsdmUmIzAzOTtzICZxdW90O1BvcnRhbCZxdW90OyBmcmFuY2hpc2UgbW9zdCBjbG9zZWx5IHJlc2VtYmxlcyB3aGljaCByZWFsLXdvcmxkIHR5cGUgb2YgY2FrZT9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFjayBGb3Jlc3RcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkRldmlsJiMwMzk7cyBGb29kXCIsXHJcbiAgICAgICAgICAgIFwiTW9sdGVuIENob2NvbGF0ZVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbiBDaG9jb2xhdGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZSAmIE5hdHVyZVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNoZW1pY2FsIGVsZW1lbnQgTGl0aGl1bSBpcyBuYW1lZCBhZnRlciB0aGUgY291bnRyeSBvZiBMaXRodWFuaWEuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogR2FkZ2V0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBEVkQgaW52ZW50ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk5NVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAwMFwiLFxyXG4gICAgICAgICAgICBcIjE5OTBcIixcclxuICAgICAgICAgICAgXCIxOTgwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGZ1bGwgbmFtZSBvZiB0aGUgZm9vdGJhbGxlciAmcXVvdDtDcmlzdGlhbm8gUm9uYWxkbyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJDcmlzdGlhbm8gUm9uYWxkbyBkb3MgU2FudG9zIEF2ZWlyb1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIFJvbmFsZG8gbG9zIFNhbnRvcyBEaWVnb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBBcm1hbmRvIERpZWdvIFJvbmFsZG9cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gTHVpcyBBcm1hbmRvIFJvbmFsZG9cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZXNlIHR3byBjb3VudHJpZXMgaGVsZCBhIGNvbW1vbndlYWx0aCBmcm9tIHRoZSAxNnRoIHRvIDE4dGggY2VudHVyeS5cIixcclxuICAgICAgICBcImFcIjogXCJQb2xhbmQgYW5kIExpdGh1YW5pYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSHV0dSBhbmQgUndhbmRhXCIsXHJcbiAgICAgICAgICAgIFwiTm9ydGggS29yZWEgYW5kIFNvdXRoIEtvcmVhXCIsXHJcbiAgICAgICAgICAgIFwiQmFuZ2xhZGVzaCBhbmQgQmh1dGFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtDYWxsIE9mIER1dHk6IFpvbWJpZXMmcXVvdDssIGNvbXBsZXRpbmcgd2hpY2ggbWFwJiMwMzk7cyBtYWluIGVhc3RlciBlZ2cgd2lsbCByZXdhcmQgeW91IHdpdGggdGhlIGFjaGlldmVtZW50LCAmcXVvdDtIaWdoIE1haW50ZW5hbmNlJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRpZSBSaXNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNb2IgT2YgVGhlIERlYWRcIixcclxuICAgICAgICAgICAgXCJPcmlnaW5zXCIsXHJcbiAgICAgICAgICAgIFwiQXNjZW5zaW9uXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENhcnRvb24gJiBBbmltYXRpb25zXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7R3Jhdml0eSBGYWxscyZxdW90OywgaG93IG11Y2ggZG9lcyBXYWRkbGVzIHdlaWdoIHdoZW4gTWFibGUgd2lucyBoaW0gaW4gJnF1b3Q7VGhlIFRpbWUgVHJhdmVsZXImIzAzOTtzIFBpZyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCIxNSBwb3VuZHNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjEwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjMwIHBvdW5kc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIGdpdmVuIHRvIGxheWVyIDQgb2YgdGhlIE9wZW4gU3lzdGVtcyBJbnRlcmNvbm5lY3Rpb24gKElTTykgbW9kZWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJhbnNwb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJTZXNzaW9uXCIsXHJcbiAgICAgICAgICAgIFwiRGF0YSBsaW5rXCIsXHJcbiAgICAgICAgICAgIFwiTmV0d29ya1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgeWVhciB3YXMgaG9ja2V5IGxlZ2VuZCBXYXluZSBHcmV0emt5IGJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk2MVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMTk2NVwiLFxyXG4gICAgICAgICAgICBcIjE5NTlcIixcclxuICAgICAgICAgICAgXCIxOTYzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJIb3cgbWFueSBnYW1lcyBhcmUgdGhlcmUgaW4gdGhlICZxdW90O0NvbG9ueSBXYXJzJnF1b3Q7IHNlcmllcyBmb3IgdGhlIFBsYXlTdGF0aW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjJcIixcclxuICAgICAgICAgICAgXCI0XCIsXHJcbiAgICAgICAgICAgIFwiNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIFdvcmxkIG9mIFdhcmNyYWZ0LCB3aGljaCByYWlkIGluc3RhbmNlIGZlYXR1cmVzIGEgY2hlc3MgZXZlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiS2FyYXpoYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlp1bCYjMDM5O0FtYW5cIixcclxuICAgICAgICAgICAgXCJCbGFja3dpbmcgTGFpclwiLFxyXG4gICAgICAgICAgICBcIlRlbXBsZSBvZiBBaG4mIzAzOTtRaXJhalwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggY291bnRyeSB3YXMgSm9zZWYgU3RhbGluIGJvcm4gaW4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR2VvcmdpYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUnVzc2lhXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFueVwiLFxyXG4gICAgICAgICAgICBcIlBvbGFuZFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG9mZmljaWFsIG5hbWUgb2YgUHJpbmNlJiMwMzk7cyBiYWNraW5nIGJhbmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIFJldm9sdXRpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBQYXVwZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFdhaWxlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgSGVhcnRicmVha2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiBHYW1lIG9mIFRocm9uZXMgd2hhdCBpcyB0aGUgbmFtZSBvZiBKb24gU25vdyYjMDM5O3Mgc3dvcmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9uZ2NsYXdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk9hdGhrZWVwZXJcIixcclxuICAgICAgICAgICAgXCJXaWRvdyYjMDM5O3MgV2FpbFwiLFxyXG4gICAgICAgICAgICBcIk5lZWRsZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBpbnNwZWN0b3IgaW4gdGhlIHNlcmllcyAmcXVvdDtPbiB0aGUgQnVzZXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxha2V5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJwZXJcIixcclxuICAgICAgICAgICAgXCJOYWlseVwiLFxyXG4gICAgICAgICAgICBcIkdhbGx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBhcnRpc3QgY3VyYXRlZCB0aGUgb2ZmaWNpYWwgc291bmR0cmFjayBmb3IgJnF1b3Q7VGhlIEh1bmdlciBHYW1lczogTW9ja2luZ2pheSAtIFBhcnQgMSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJMb3JkZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiS2FueWUgV2VzdFwiLFxyXG4gICAgICAgICAgICBcIlRvdmUgTG9cIixcclxuICAgICAgICAgICAgXCJDaGFybGkgWENYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIENhbmFkaWFuICQxIGNvaW4gaXMgY29sbG9xdWlhbGx5IGtub3duIGFzIGEgd2hhdD9cIixcclxuICAgICAgICBcImFcIjogXCJMb29uaWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIkZvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIk1vb2RpZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGVzZSBmb3VuZGluZyBmYXRoZXJzIG9mIHRoZSBVbml0ZWQgU3RhdGVzIG9mIEFtZXJpY2EgbGF0ZXIgYmVjYW1lIHByZXNpZGVudD9cIixcclxuICAgICAgICBcImFcIjogXCJKYW1lcyBNb25yb2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFsZXhhbmRlciBIYW1pbHRvblwiLFxyXG4gICAgICAgICAgICBcIlNhbXVlbCBBZGFtc1wiLFxyXG4gICAgICAgICAgICBcIlJvZ2VyIFNoZXJtYW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBEaXZpbml0eTogT3JpZ2luYWwgU2luIElJLCB3aGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxvaHNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFJlZCBQcmluY2VcIixcclxuICAgICAgICAgICAgXCJUaGVyZSBhcmUgbm8gc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3RlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaG8gaXMgdGhlIG1haW4gcHJvdGFnb25pc3QgaW4gdGhlIGdhbWUgTGlmZSBpcyBTdHJhbmdlOiBCZWZvcmUgVGhlIFN0b3JtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNobG9lIFByaWNlIFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTWF4IENhdWxmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlJhY2hlbCBBbWJlclwiLFxyXG4gICAgICAgICAgICBcIkZyYW5rIEJvd2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJKb2hubnkgRGVwcCBtYWRlIGhpcyBiaWctc2NyZWVuIGFjdGluZyBkZWJ1dCBpbiB3aGljaCBmaWxtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkEgTmlnaHRtYXJlIG9uIEVsbSBTdHJlZXRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk15IEJsb29keSBWYWxlbnRpbmVcIixcclxuICAgICAgICAgICAgXCJIYWxsb3dlZW5cIixcclxuICAgICAgICAgICAgXCJGcmlkYXkgdGhlIDEzdGhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCZxdW90Oywgb25seSBDaHJpcyBoYXMgYWNjZXNzIHRvIHRoZSBncmVuYWRlIGxhdW5jaGVyLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcnMgaXMgTk9UIHBsYXlhYmxlIGluICZxdW90O1Jlc2lkZW50IEV2aWwgNiZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJKaWxsIFZhbGVudGluZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hyaXMgUmVkZmllbGRcIixcclxuICAgICAgICAgICAgXCJTaGVycnkgQmlya2luXCIsXHJcbiAgICAgICAgICAgIFwiSGVsZW5hIEhhcnBlclwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBKYXBhbmVzZSBBbmltZSAmIE1hbmdhXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgMTk4OCBmaWxtICZxdW90O0FraXJhJnF1b3Q7LCBUZXRzdW8gZW5kcyB1cCBkZXN0cm95aW5nIFRva3lvLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlb2dyYXBoeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBib2R5IG9mIHRoZSBFZ3lwdGlhbiBTcGhpbnggd2FzIGJhc2VkIG9uIHdoaWNoIGFuaW1hbD9cIixcclxuICAgICAgICBcImFcIjogXCJMaW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCdWxsXCIsXHJcbiAgICAgICAgICAgIFwiSG9yc2VcIixcclxuICAgICAgICAgICAgXCJEb2dcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gcmVsYXRpb24gdG8gdGhlIEJyaXRpc2ggT2NjdXBhdGlvbiBpbiBJcmVsYW5kLCB3aGF0IGRvZXMgdGhlIElSQSBzdGFuZCBmb3IuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSXJpc2ggUmVwdWJsaWNhbiBBcm15XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWJlbCBBbGxpYW5jZVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoIFJlZm9ybWF0aW9uIEFybXlcIixcclxuICAgICAgICAgICAgXCJJcmlzaC1Sb3lhbCBBbGxpYW5jZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSByb2JvdCBpbiB0aGUgMTk1MSBzY2llbmNlIGZpY3Rpb24gZmlsbSBjbGFzc2ljICYjMDM5O1RoZSBEYXkgdGhlIEVhcnRoIFN0b29kIFN0aWxsJiMwMzk7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJvYmJ5XCIsXHJcbiAgICAgICAgICAgIFwiQ29sb3NzdXNcIixcclxuICAgICAgICAgICAgXCJCb3hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIFJvbWFuIG51bWVyYWwgZm9yIDUwMD9cIixcclxuICAgICAgICBcImFcIjogXCJEXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMXCIsXHJcbiAgICAgICAgICAgIFwiQ1wiLFxyXG4gICAgICAgICAgICBcIlhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBtYWluIGhlYWxpbmcgaXRlbSBpbiBEYXJrIFNvdWxzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkVzdHVzIEZsYXNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIZWFsdGggUG90aW9uXCIsXHJcbiAgICAgICAgICAgIFwiT3JhbmdlIEp1aWNlXCIsXHJcbiAgICAgICAgICAgIFwiQXNoZW4gRmxhc2tcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJPbiB3aGljaCBjb21wdXRlciBoYXJkd2FyZSBkZXZpY2UgaXMgdGhlIEJJT1MgY2hpcCBsb2NhdGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk1vdGhlcmJvYXJkXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJkIERpc2sgRHJpdmVcIixcclxuICAgICAgICAgICAgXCJDZW50cmFsIFByb2Nlc3NpbmcgVW5pdFwiLFxyXG4gICAgICAgICAgICBcIkdyYXBoaWNzIFByb2Nlc3NpbmcgVW5pdFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiQSB1bml2ZXJzYWwgc2V0LCBvciBhIHNldCB0aGF0IGNvbnRhaW5zIGFsbCBzZXRzLCBleGlzdHMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIEFjZSBBdHRvcm5leSB0cmlsb2d5IHdhcyBzdXBwb3NlIHRvIGVuZCB3aXRoICZxdW90O1Bob2VuaXggV3JpZ2h0OiBBY2UgQXR0b3JuZXkgJm1pbnVzOyBUcmlhbHMgYW5kIFRyaWJ1bGF0aW9ucyZxdW90OyBhcyBpdHMgZmluYWwgZ2FtZS5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGhpZ2hlc3QgYmVsdCB5b3UgY2FuIGdldCBpbiBUYWVrd29uZG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIldoaXRlXCIsXHJcbiAgICAgICAgICAgIFwiUmVkXCIsXHJcbiAgICAgICAgICAgIFwiR3JlZW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIFVuaXRlZCBTdGF0ZXMgRGVwYXJ0bWVudCBvZiBIb21lbGFuZCBTZWN1cml0eSB3YXMgZm9ybWVkIGluIHJlc3BvbnNlIHRvIHRoZSBTZXB0ZW1iZXIgMTF0aCBhdHRhY2tzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFwb2xsbyBtaXNzaW9uIHdhcyB0aGUgbGFzdCBvbmUgaW4gTkFTQSYjMDM5O3MgQXBvbGxvIHByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQXBvbGxvIDE3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTNcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTFcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGlzIGFuIGV4aXN0aW5nIGZhbWlseSBpbiAmcXVvdDtUaGUgU2ltcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgR290aCBGYW1pbHlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgU2ltb2xlb24gRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFByb3VkIEZhbWlseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lIE51Y2xlYXIgVGhyb25lLCB3aGF0IG9yZ2FuaXphdGlvbiBjaGFzZXMgdGhlIHBsYXllciBjaGFyYWN0ZXIgdGhyb3VnaG91dCB0aGUgZ2FtZT9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgSS5ELlAuRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZpc2htZW5cIixcclxuICAgICAgICAgICAgXCJUaGUgQmFuZGl0c1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBZLlYuRy5HXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSAmcXVvdDtDYXZlIFN0b3J5LCZxdW90OyB3aGF0IGlzIHRoZSBjaGFyYWN0ZXIgQmFscm9nJiMwMzk7cyBjYXRjaHBocmFzZT9cIixcclxuICAgICAgICBcImFcIjogXCJIdXp6YWghXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJZZXMhXCIsXHJcbiAgICAgICAgICAgIFwiV2hvYSB0aGVyZSFcIixcclxuICAgICAgICAgICAgXCJOeWVoIGhlaCBoZWghXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlZlaGljbGVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb25lIG9mIHRoZXNlIGNoYXNzaXMgY29kZXMgYXJlIHVzZWQgYnkgQk1XIDMtc2VyaWVzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkU0NlwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRTM5XCIsXHJcbiAgICAgICAgICAgIFwiRTg1XCIsXHJcbiAgICAgICAgICAgIFwiRjEwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENvbWljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHdoYXQgSG9tZXN0dWNrIFVwZGF0ZSB3YXMgW1NdIEdhbWUgT3ZlciByZWxlYXNlZD9cIixcclxuICAgICAgICBcImFcIjogXCJPY3RvYmVyIDI1dGgsIDIwMTRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwcmlsIDEzdGgsIDIwMDlcIixcclxuICAgICAgICAgICAgXCJBcHJpbCA4dGgsIDIwMTJcIixcclxuICAgICAgICAgICAgXCJBdWd1c3QgMjh0aCwgMjAwM1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIGJhbmQgbWVtYmVycyBvZiBBbWVyaWNhbiByb2NrIGJhbmQgS2luZyBvZiBMZW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJyb3RoZXJzICZhbXA7IGNvdXNpbnNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNoaWxkaG9vZCBmcmllbmRzXCIsXHJcbiAgICAgICAgICAgIFwiRm9ybWVyIGNsYXNzbWF0ZXNcIixcclxuICAgICAgICAgICAgXCJGcmF0ZXJuaXR5IGhvdXNlIG1lbWJlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGZyYW5jaGlzZSBoYWQgYSBzcGVjaWFsIGV2ZW50IGhvc3RlZCBpbiB0aGUgcG9wdWxhciBNTU9SUEcgRmluYWwgRmFudGFzeSBYSVY6IEEgUmVhbG0gUmVib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIllvLWthaSBXYXRjaFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUG9rJmVhY3V0ZTttb25cIixcclxuICAgICAgICAgICAgXCJZdS1naS1vaFwiLFxyXG4gICAgICAgICAgICBcIkJ1ZGR5ZmlnaHRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBLaW5nZG9tIEhlYXJ0cyBnYW1lIGZlYXR1cmVkIHRoZSBjYXN0IG9mICZxdW90O1RoZSBXb3JsZCBFbmRzIFdpdGggWW91JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRyZWFtIERyb3AgRGlzdGFuY2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJpcnRoIEJ5IFNsZWVwXCIsXHJcbiAgICAgICAgICAgIFwiMzY1LzIgRGF5c1wiLFxyXG4gICAgICAgICAgICBcIlJlOkNoYWluIG9mIE1lbW9yaWVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbGFyZ2VzdCBwbGFuZXQgaW4gS2VyYmFsIFNwYWNlIFByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSm9vbFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRWVsb29cIixcclxuICAgICAgICAgICAgXCJLZXJib2xcIixcclxuICAgICAgICAgICAgXCJNaW5tdXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBbmltYWwgQ3Jvc3NpbmcgZ2FtZSB3YXMgZm9yIHRoZSBOaW50ZW5kbyBXaWk/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQW5pbWFsIENyb3NzaW5nOiBDaXR5IEZvbGtcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogTmV3IExlYWZcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFdpbGQgV29ybGRcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFBvcHVsYXRpb24gR3Jvd2luZyFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiR2VvcmdlIEx1Y2FzIGRpcmVjdGVkIHRoZSBlbnRpcmUgb3JpZ2luYWwgU3RhciBXYXJzIHRyaWxvZ3kuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBjaXR5IG9mIFJvbWUsIEl0YWx5IGZvdW5kZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiNzUzIEJDRVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiOTAyIEJDRVwiLFxyXG4gICAgICAgICAgICBcIjUyNCBCQ0VcIixcclxuICAgICAgICAgICAgXCI2OTcgQkNFXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGRhdGEgc3RydWN0dXJlIGRvZXMgRklMTyBhcHBseSB0bz9cIixcclxuICAgICAgICBcImFcIjogXCJTdGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUXVldWVcIixcclxuICAgICAgICAgICAgXCJIZWFwXCIsXHJcbiAgICAgICAgICAgIFwiVHJlZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBCYXR0bGVzdGFyIEdhbGFjdGljYSAoMjAwNCksIEN5bG9ucyB3ZXJlIGNyZWF0ZWQgYnkgbWFuIGFzIGN5YmVybmV0aWMgd29ya2VycyBhbmQgc29sZGllcnMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSAyMDE2IERpc25leSBhbmltYXRlZCBmaWxtICYjMDM5O01vYW5hJiMwMzk7IGlzIGJhc2VkIG9uIHdoaWNoIGN1bHR1cmU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9seW5lc2lhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTmF0aXZlIEFtZXJpY2FuXCIsXHJcbiAgICAgICAgICAgIFwiSmFwYW5lc2VcIixcclxuICAgICAgICAgICAgXCJOb3JkaWNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjYWtlIGRlcGljdGVkIGluIFZhbHZlJiMwMzk7cyAmcXVvdDtQb3J0YWwmcXVvdDsgZnJhbmNoaXNlIG1vc3QgY2xvc2VseSByZXNlbWJsZXMgd2hpY2ggcmVhbC13b3JsZCB0eXBlIG9mIGNha2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2sgRm9yZXN0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJEZXZpbCYjMDM5O3MgRm9vZFwiLFxyXG4gICAgICAgICAgICBcIk1vbHRlbiBDaG9jb2xhdGVcIixcclxuICAgICAgICAgICAgXCJHZXJtYW4gQ2hvY29sYXRlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2UgJiBOYXR1cmVcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjaGVtaWNhbCBlbGVtZW50IExpdGhpdW0gaXMgbmFtZWQgYWZ0ZXIgdGhlIGNvdW50cnkgb2YgTGl0aHVhbmlhLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IEdhZGdldHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgRFZEIGludmVudGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5OTVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwMDBcIixcclxuICAgICAgICAgICAgXCIxOTkwXCIsXHJcbiAgICAgICAgICAgIFwiMTk4MFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBmdWxsIG5hbWUgb2YgdGhlIGZvb3RiYWxsZXIgJnF1b3Q7Q3Jpc3RpYW5vIFJvbmFsZG8mcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ3Jpc3RpYW5vIFJvbmFsZG8gZG9zIFNhbnRvcyBBdmVpcm9cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBSb25hbGRvIGxvcyBTYW50b3MgRGllZ29cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gQXJtYW5kbyBEaWVnbyBSb25hbGRvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEx1aXMgQXJtYW5kbyBSb25hbGRvXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGVzZSB0d28gY291bnRyaWVzIGhlbGQgYSBjb21tb253ZWFsdGggZnJvbSB0aGUgMTZ0aCB0byAxOHRoIGNlbnR1cnkuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9sYW5kIGFuZCBMaXRodWFuaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkh1dHUgYW5kIFJ3YW5kYVwiLFxyXG4gICAgICAgICAgICBcIk5vcnRoIEtvcmVhIGFuZCBTb3V0aCBLb3JlYVwiLFxyXG4gICAgICAgICAgICBcIkJhbmdsYWRlc2ggYW5kIEJodXRhblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7Q2FsbCBPZiBEdXR5OiBab21iaWVzJnF1b3Q7LCBjb21wbGV0aW5nIHdoaWNoIG1hcCYjMDM5O3MgbWFpbiBlYXN0ZXIgZWdnIHdpbGwgcmV3YXJkIHlvdSB3aXRoIHRoZSBhY2hpZXZlbWVudCwgJnF1b3Q7SGlnaCBNYWludGVuYW5jZSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEaWUgUmlzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTW9iIE9mIFRoZSBEZWFkXCIsXHJcbiAgICAgICAgICAgIFwiT3JpZ2luc1wiLFxyXG4gICAgICAgICAgICBcIkFzY2Vuc2lvblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDYXJ0b29uICYgQW5pbWF0aW9uc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0dyYXZpdHkgRmFsbHMmcXVvdDssIGhvdyBtdWNoIGRvZXMgV2FkZGxlcyB3ZWlnaCB3aGVuIE1hYmxlIHdpbnMgaGltIGluICZxdW90O1RoZSBUaW1lIFRyYXZlbGVyJiMwMzk7cyBQaWcmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTUgcG91bmRzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIxMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIzMCBwb3VuZHNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBnaXZlbiB0byBsYXllciA0IG9mIHRoZSBPcGVuIFN5c3RlbXMgSW50ZXJjb25uZWN0aW9uIChJU08pIG1vZGVsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRyYW5zcG9ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiU2Vzc2lvblwiLFxyXG4gICAgICAgICAgICBcIkRhdGEgbGlua1wiLFxyXG4gICAgICAgICAgICBcIk5ldHdvcmtcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IHllYXIgd2FzIGhvY2tleSBsZWdlbmQgV2F5bmUgR3JldHpreSBib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5NjFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjE5NjVcIixcclxuICAgICAgICAgICAgXCIxOTU5XCIsXHJcbiAgICAgICAgICAgIFwiMTk2M1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSG93IG1hbnkgZ2FtZXMgYXJlIHRoZXJlIGluIHRoZSAmcXVvdDtDb2xvbnkgV2FycyZxdW90OyBzZXJpZXMgZm9yIHRoZSBQbGF5U3RhdGlvbj9cIixcclxuICAgICAgICBcImFcIjogXCIzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyXCIsXHJcbiAgICAgICAgICAgIFwiNFwiLFxyXG4gICAgICAgICAgICBcIjVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiBXb3JsZCBvZiBXYXJjcmFmdCwgd2hpY2ggcmFpZCBpbnN0YW5jZSBmZWF0dXJlcyBhIGNoZXNzIGV2ZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkthcmF6aGFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJadWwmIzAzOTtBbWFuXCIsXHJcbiAgICAgICAgICAgIFwiQmxhY2t3aW5nIExhaXJcIixcclxuICAgICAgICAgICAgXCJUZW1wbGUgb2YgQWhuJiMwMzk7UWlyYWpcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGNvdW50cnkgd2FzIEpvc2VmIFN0YWxpbiBib3JuIGluP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdlb3JnaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJ1c3NpYVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbnlcIixcclxuICAgICAgICAgICAgXCJQb2xhbmRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBvZmZpY2lhbCBuYW1lIG9mIFByaW5jZSYjMDM5O3MgYmFja2luZyBiYW5kP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBSZXZvbHV0aW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgUGF1cGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBXYWlsZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEhlYXJ0YnJlYWtlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gR2FtZSBvZiBUaHJvbmVzIHdoYXQgaXMgdGhlIG5hbWUgb2YgSm9uIFNub3cmIzAzOTtzIHN3b3JkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvbmdjbGF3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJPYXRoa2VlcGVyXCIsXHJcbiAgICAgICAgICAgIFwiV2lkb3cmIzAzOTtzIFdhaWxcIixcclxuICAgICAgICAgICAgXCJOZWVkbGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgaW5zcGVjdG9yIGluIHRoZSBzZXJpZXMgJnF1b3Q7T24gdGhlIEJ1c2VzJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWtleVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFycGVyXCIsXHJcbiAgICAgICAgICAgIFwiTmFpbHlcIixcclxuICAgICAgICAgICAgXCJHYWxseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggYXJ0aXN0IGN1cmF0ZWQgdGhlIG9mZmljaWFsIHNvdW5kdHJhY2sgZm9yICZxdW90O1RoZSBIdW5nZXIgR2FtZXM6IE1vY2tpbmdqYXkgLSBQYXJ0IDEmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9yZGVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkthbnllIFdlc3RcIixcclxuICAgICAgICAgICAgXCJUb3ZlIExvXCIsXHJcbiAgICAgICAgICAgIFwiQ2hhcmxpIFhDWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBDYW5hZGlhbiAkMSBjb2luIGlzIGNvbGxvcXVpYWxseSBrbm93biBhcyBhIHdoYXQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9vbmllXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCb29saWVcIixcclxuICAgICAgICAgICAgXCJGb29saWVcIixcclxuICAgICAgICAgICAgXCJNb29kaWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlc2UgZm91bmRpbmcgZmF0aGVycyBvZiB0aGUgVW5pdGVkIFN0YXRlcyBvZiBBbWVyaWNhIGxhdGVyIGJlY2FtZSBwcmVzaWRlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmFtZXMgTW9ucm9lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbGV4YW5kZXIgSGFtaWx0b25cIixcclxuICAgICAgICAgICAgXCJTYW11ZWwgQWRhbXNcIixcclxuICAgICAgICAgICAgXCJSb2dlciBTaGVybWFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gRGl2aW5pdHk6IE9yaWdpbmFsIFNpbiBJSSwgd2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3Rlcj9cIixcclxuICAgICAgICBcImFcIjogXCJGYW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMb2hzZVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBSZWQgUHJpbmNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlcmUgYXJlIG5vIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hvIGlzIHRoZSBtYWluIHByb3RhZ29uaXN0IGluIHRoZSBnYW1lIExpZmUgaXMgU3RyYW5nZTogQmVmb3JlIFRoZSBTdG9ybT9cIixcclxuICAgICAgICBcImFcIjogXCJDaGxvZSBQcmljZSBcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1heCBDYXVsZmllbGRcIixcclxuICAgICAgICAgICAgXCJSYWNoZWwgQW1iZXJcIixcclxuICAgICAgICAgICAgXCJGcmFuayBCb3dlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSm9obm55IERlcHAgbWFkZSBoaXMgYmlnLXNjcmVlbiBhY3RpbmcgZGVidXQgaW4gd2hpY2ggZmlsbT9cIixcclxuICAgICAgICBcImFcIjogXCJBIE5pZ2h0bWFyZSBvbiBFbG0gU3RyZWV0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNeSBCbG9vZHkgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgICAgIFwiSGFsbG93ZWVuXCIsXHJcbiAgICAgICAgICAgIFwiRnJpZGF5IHRoZSAxM3RoXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O1Jlc2lkZW50IEV2aWwmcXVvdDssIG9ubHkgQ2hyaXMgaGFzIGFjY2VzcyB0byB0aGUgZ3JlbmFkZSBsYXVuY2hlci5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXJzIGlzIE5PVCBwbGF5YWJsZSBpbiAmcXVvdDtSZXNpZGVudCBFdmlsIDYmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmlsbCBWYWxlbnRpbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNocmlzIFJlZGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiU2hlcnJ5IEJpcmtpblwiLFxyXG4gICAgICAgICAgICBcIkhlbGVuYSBIYXJwZXJcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogSmFwYW5lc2UgQW5pbWUgJiBNYW5nYVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIDE5ODggZmlsbSAmcXVvdDtBa2lyYSZxdW90OywgVGV0c3VvIGVuZHMgdXAgZGVzdHJveWluZyBUb2t5by5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW9ncmFwaHlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgYm9keSBvZiB0aGUgRWd5cHRpYW4gU3BoaW54IHdhcyBiYXNlZCBvbiB3aGljaCBhbmltYWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQnVsbFwiLFxyXG4gICAgICAgICAgICBcIkhvcnNlXCIsXHJcbiAgICAgICAgICAgIFwiRG9nXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHJlbGF0aW9uIHRvIHRoZSBCcml0aXNoIE9jY3VwYXRpb24gaW4gSXJlbGFuZCwgd2hhdCBkb2VzIHRoZSBJUkEgc3RhbmQgZm9yLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIklyaXNoIFJlcHVibGljYW4gQXJteVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmViZWwgQWxsaWFuY2VcIixcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWZvcm1hdGlvbiBBcm15XCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2gtUm95YWwgQWxsaWFuY2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgcm9ib3QgaW4gdGhlIDE5NTEgc2NpZW5jZSBmaWN0aW9uIGZpbG0gY2xhc3NpYyAmIzAzOTtUaGUgRGF5IHRoZSBFYXJ0aCBTdG9vZCBTdGlsbCYjMDM5Oz9cIixcclxuICAgICAgICBcImFcIjogXCJHb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSb2JieVwiLFxyXG4gICAgICAgICAgICBcIkNvbG9zc3VzXCIsXHJcbiAgICAgICAgICAgIFwiQm94XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBSb21hbiBudW1lcmFsIGZvciA1MDA/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTFwiLFxyXG4gICAgICAgICAgICBcIkNcIixcclxuICAgICAgICAgICAgXCJYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbWFpbiBoZWFsaW5nIGl0ZW0gaW4gRGFyayBTb3Vscz9cIixcclxuICAgICAgICBcImFcIjogXCJFc3R1cyBGbGFza1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGVhbHRoIFBvdGlvblwiLFxyXG4gICAgICAgICAgICBcIk9yYW5nZSBKdWljZVwiLFxyXG4gICAgICAgICAgICBcIkFzaGVuIEZsYXNrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiT24gd2hpY2ggY29tcHV0ZXIgaGFyZHdhcmUgZGV2aWNlIGlzIHRoZSBCSU9TIGNoaXAgbG9jYXRlZD9cIixcclxuICAgICAgICBcImFcIjogXCJNb3RoZXJib2FyZFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFyZCBEaXNrIERyaXZlXCIsXHJcbiAgICAgICAgICAgIFwiQ2VudHJhbCBQcm9jZXNzaW5nIFVuaXRcIixcclxuICAgICAgICAgICAgXCJHcmFwaGljcyBQcm9jZXNzaW5nIFVuaXRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkEgdW5pdmVyc2FsIHNldCwgb3IgYSBzZXQgdGhhdCBjb250YWlucyBhbGwgc2V0cywgZXhpc3RzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBBY2UgQXR0b3JuZXkgdHJpbG9neSB3YXMgc3VwcG9zZSB0byBlbmQgd2l0aCAmcXVvdDtQaG9lbml4IFdyaWdodDogQWNlIEF0dG9ybmV5ICZtaW51czsgVHJpYWxzIGFuZCBUcmlidWxhdGlvbnMmcXVvdDsgYXMgaXRzIGZpbmFsIGdhbWUuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBoaWdoZXN0IGJlbHQgeW91IGNhbiBnZXQgaW4gVGFla3dvbmRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJXaGl0ZVwiLFxyXG4gICAgICAgICAgICBcIlJlZFwiLFxyXG4gICAgICAgICAgICBcIkdyZWVuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBVbml0ZWQgU3RhdGVzIERlcGFydG1lbnQgb2YgSG9tZWxhbmQgU2VjdXJpdHkgd2FzIGZvcm1lZCBpbiByZXNwb25zZSB0byB0aGUgU2VwdGVtYmVyIDExdGggYXR0YWNrcy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBcG9sbG8gbWlzc2lvbiB3YXMgdGhlIGxhc3Qgb25lIGluIE5BU0EmIzAzOTtzIEFwb2xsbyBwcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFwb2xsbyAxN1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDEzXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDExXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDE1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBpcyBhbiBleGlzdGluZyBmYW1pbHkgaW4gJnF1b3Q7VGhlIFNpbXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEdvdGggRmFtaWx5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFNpbW9sZW9uIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBQcm91ZCBGYW1pbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSBOdWNsZWFyIFRocm9uZSwgd2hhdCBvcmdhbml6YXRpb24gY2hhc2VzIHRoZSBwbGF5ZXIgY2hhcmFjdGVyIHRocm91Z2hvdXQgdGhlIGdhbWU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEkuRC5QLkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGaXNobWVuXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEJhbmRpdHNcIixcclxuICAgICAgICAgICAgXCJUaGUgWS5WLkcuR1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgJnF1b3Q7Q2F2ZSBTdG9yeSwmcXVvdDsgd2hhdCBpcyB0aGUgY2hhcmFjdGVyIEJhbHJvZyYjMDM5O3MgY2F0Y2hwaHJhc2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSHV6emFoIVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWWVzIVwiLFxyXG4gICAgICAgICAgICBcIldob2EgdGhlcmUhXCIsXHJcbiAgICAgICAgICAgIFwiTnllaCBoZWggaGVoIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJWZWhpY2xlc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9uZSBvZiB0aGVzZSBjaGFzc2lzIGNvZGVzIGFyZSB1c2VkIGJ5IEJNVyAzLXNlcmllcz9cIixcclxuICAgICAgICBcImFcIjogXCJFNDZcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkUzOVwiLFxyXG4gICAgICAgICAgICBcIkU4NVwiLFxyXG4gICAgICAgICAgICBcIkYxMFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDb21pY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB3aGF0IEhvbWVzdHVjayBVcGRhdGUgd2FzIFtTXSBHYW1lIE92ZXIgcmVsZWFzZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiT2N0b2JlciAyNXRoLCAyMDE0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcHJpbCAxM3RoLCAyMDA5XCIsXHJcbiAgICAgICAgICAgIFwiQXByaWwgOHRoLCAyMDEyXCIsXHJcbiAgICAgICAgICAgIFwiQXVndXN0IDI4dGgsIDIwMDNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBiYW5kIG1lbWJlcnMgb2YgQW1lcmljYW4gcm9jayBiYW5kIEtpbmcgb2YgTGVvbj9cIixcclxuICAgICAgICBcImFcIjogXCJCcm90aGVycyAmYW1wOyBjb3VzaW5zXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaGlsZGhvb2QgZnJpZW5kc1wiLFxyXG4gICAgICAgICAgICBcIkZvcm1lciBjbGFzc21hdGVzXCIsXHJcbiAgICAgICAgICAgIFwiRnJhdGVybml0eSBob3VzZSBtZW1iZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBmcmFuY2hpc2UgaGFkIGEgc3BlY2lhbCBldmVudCBob3N0ZWQgaW4gdGhlIHBvcHVsYXIgTU1PUlBHIEZpbmFsIEZhbnRhc3kgWElWOiBBIFJlYWxtIFJlYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCJZby1rYWkgV2F0Y2hcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlBvayZlYWN1dGU7bW9uXCIsXHJcbiAgICAgICAgICAgIFwiWXUtZ2ktb2hcIixcclxuICAgICAgICAgICAgXCJCdWRkeWZpZ2h0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggS2luZ2RvbSBIZWFydHMgZ2FtZSBmZWF0dXJlZCB0aGUgY2FzdCBvZiAmcXVvdDtUaGUgV29ybGQgRW5kcyBXaXRoIFlvdSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEcmVhbSBEcm9wIERpc3RhbmNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCaXJ0aCBCeSBTbGVlcFwiLFxyXG4gICAgICAgICAgICBcIjM2NS8yIERheXNcIixcclxuICAgICAgICAgICAgXCJSZTpDaGFpbiBvZiBNZW1vcmllc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGxhcmdlc3QgcGxhbmV0IGluIEtlcmJhbCBTcGFjZSBQcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkpvb2xcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkVlbG9vXCIsXHJcbiAgICAgICAgICAgIFwiS2VyYm9sXCIsXHJcbiAgICAgICAgICAgIFwiTWlubXVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQW5pbWFsIENyb3NzaW5nIGdhbWUgd2FzIGZvciB0aGUgTmludGVuZG8gV2lpP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFuaW1hbCBDcm9zc2luZzogQ2l0eSBGb2xrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IE5ldyBMZWFmXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBXaWxkIFdvcmxkXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBQb3B1bGF0aW9uIEdyb3dpbmchXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkdlb3JnZSBMdWNhcyBkaXJlY3RlZCB0aGUgZW50aXJlIG9yaWdpbmFsIFN0YXIgV2FycyB0cmlsb2d5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgY2l0eSBvZiBSb21lLCBJdGFseSBmb3VuZGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjc1MyBCQ0VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjkwMiBCQ0VcIixcclxuICAgICAgICAgICAgXCI1MjQgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNjk3IEJDRVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBkYXRhIHN0cnVjdHVyZSBkb2VzIEZJTE8gYXBwbHkgdG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiU3RhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlF1ZXVlXCIsXHJcbiAgICAgICAgICAgIFwiSGVhcFwiLFxyXG4gICAgICAgICAgICBcIlRyZWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gQmF0dGxlc3RhciBHYWxhY3RpY2EgKDIwMDQpLCBDeWxvbnMgd2VyZSBjcmVhdGVkIGJ5IG1hbiBhcyBjeWJlcm5ldGljIHdvcmtlcnMgYW5kIHNvbGRpZXJzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgMjAxNiBEaXNuZXkgYW5pbWF0ZWQgZmlsbSAmIzAzOTtNb2FuYSYjMDM5OyBpcyBiYXNlZCBvbiB3aGljaCBjdWx0dXJlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbHluZXNpYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk5hdGl2ZSBBbWVyaWNhblwiLFxyXG4gICAgICAgICAgICBcIkphcGFuZXNlXCIsXHJcbiAgICAgICAgICAgIFwiTm9yZGljXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2FrZSBkZXBpY3RlZCBpbiBWYWx2ZSYjMDM5O3MgJnF1b3Q7UG9ydGFsJnF1b3Q7IGZyYW5jaGlzZSBtb3N0IGNsb3NlbHkgcmVzZW1ibGVzIHdoaWNoIHJlYWwtd29ybGQgdHlwZSBvZiBjYWtlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrIEZvcmVzdFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRGV2aWwmIzAzOTtzIEZvb2RcIixcclxuICAgICAgICAgICAgXCJNb2x0ZW4gQ2hvY29sYXRlXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFuIENob2NvbGF0ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlICYgTmF0dXJlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2hlbWljYWwgZWxlbWVudCBMaXRoaXVtIGlzIG5hbWVkIGFmdGVyIHRoZSBjb3VudHJ5IG9mIExpdGh1YW5pYS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBHYWRnZXRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIERWRCBpbnZlbnRlZD9cIixcclxuICAgICAgICBcImFcIjogXCIxOTk1XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMDAwXCIsXHJcbiAgICAgICAgICAgIFwiMTk5MFwiLFxyXG4gICAgICAgICAgICBcIjE5ODBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgZnVsbCBuYW1lIG9mIHRoZSBmb290YmFsbGVyICZxdW90O0NyaXN0aWFubyBSb25hbGRvJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNyaXN0aWFubyBSb25hbGRvIGRvcyBTYW50b3MgQXZlaXJvXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gUm9uYWxkbyBsb3MgU2FudG9zIERpZWdvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEFybWFuZG8gRGllZ28gUm9uYWxkb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBMdWlzIEFybWFuZG8gUm9uYWxkb1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlc2UgdHdvIGNvdW50cmllcyBoZWxkIGEgY29tbW9ud2VhbHRoIGZyb20gdGhlIDE2dGggdG8gMTh0aCBjZW50dXJ5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbGFuZCBhbmQgTGl0aHVhbmlhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIdXR1IGFuZCBSd2FuZGFcIixcclxuICAgICAgICAgICAgXCJOb3J0aCBLb3JlYSBhbmQgU291dGggS29yZWFcIixcclxuICAgICAgICAgICAgXCJCYW5nbGFkZXNoIGFuZCBCaHV0YW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0NhbGwgT2YgRHV0eTogWm9tYmllcyZxdW90OywgY29tcGxldGluZyB3aGljaCBtYXAmIzAzOTtzIG1haW4gZWFzdGVyIGVnZyB3aWxsIHJld2FyZCB5b3Ugd2l0aCB0aGUgYWNoaWV2ZW1lbnQsICZxdW90O0hpZ2ggTWFpbnRlbmFuY2UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRGllIFJpc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1vYiBPZiBUaGUgRGVhZFwiLFxyXG4gICAgICAgICAgICBcIk9yaWdpbnNcIixcclxuICAgICAgICAgICAgXCJBc2NlbnNpb25cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ2FydG9vbiAmIEFuaW1hdGlvbnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtHcmF2aXR5IEZhbGxzJnF1b3Q7LCBob3cgbXVjaCBkb2VzIFdhZGRsZXMgd2VpZ2ggd2hlbiBNYWJsZSB3aW5zIGhpbSBpbiAmcXVvdDtUaGUgVGltZSBUcmF2ZWxlciYjMDM5O3MgUGlnJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE1IHBvdW5kc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMTAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMzAgcG91bmRzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgZ2l2ZW4gdG8gbGF5ZXIgNCBvZiB0aGUgT3BlbiBTeXN0ZW1zIEludGVyY29ubmVjdGlvbiAoSVNPKSBtb2RlbD9cIixcclxuICAgICAgICBcImFcIjogXCJUcmFuc3BvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlNlc3Npb25cIixcclxuICAgICAgICAgICAgXCJEYXRhIGxpbmtcIixcclxuICAgICAgICAgICAgXCJOZXR3b3JrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCB5ZWFyIHdhcyBob2NrZXkgbGVnZW5kIFdheW5lIEdyZXR6a3kgYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCIxOTYxXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIxOTY1XCIsXHJcbiAgICAgICAgICAgIFwiMTk1OVwiLFxyXG4gICAgICAgICAgICBcIjE5NjNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkhvdyBtYW55IGdhbWVzIGFyZSB0aGVyZSBpbiB0aGUgJnF1b3Q7Q29sb255IFdhcnMmcXVvdDsgc2VyaWVzIGZvciB0aGUgUGxheVN0YXRpb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiM1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMlwiLFxyXG4gICAgICAgICAgICBcIjRcIixcclxuICAgICAgICAgICAgXCI1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gV29ybGQgb2YgV2FyY3JhZnQsIHdoaWNoIHJhaWQgaW5zdGFuY2UgZmVhdHVyZXMgYSBjaGVzcyBldmVudD9cIixcclxuICAgICAgICBcImFcIjogXCJLYXJhemhhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWnVsJiMwMzk7QW1hblwiLFxyXG4gICAgICAgICAgICBcIkJsYWNrd2luZyBMYWlyXCIsXHJcbiAgICAgICAgICAgIFwiVGVtcGxlIG9mIEFobiYjMDM5O1FpcmFqXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBjb3VudHJ5IHdhcyBKb3NlZiBTdGFsaW4gYm9ybiBpbj9cIixcclxuICAgICAgICBcImFcIjogXCJHZW9yZ2lhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSdXNzaWFcIixcclxuICAgICAgICAgICAgXCJHZXJtYW55XCIsXHJcbiAgICAgICAgICAgIFwiUG9sYW5kXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgb2ZmaWNpYWwgbmFtZSBvZiBQcmluY2UmIzAzOTtzIGJhY2tpbmcgYmFuZD9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgUmV2b2x1dGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIFBhdXBlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgV2FpbGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBIZWFydGJyZWFrZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEdhbWUgb2YgVGhyb25lcyB3aGF0IGlzIHRoZSBuYW1lIG9mIEpvbiBTbm93JiMwMzk7cyBzd29yZD9cIixcclxuICAgICAgICBcImFcIjogXCJMb25nY2xhd1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiT2F0aGtlZXBlclwiLFxyXG4gICAgICAgICAgICBcIldpZG93JiMwMzk7cyBXYWlsXCIsXHJcbiAgICAgICAgICAgIFwiTmVlZGxlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGluc3BlY3RvciBpbiB0aGUgc2VyaWVzICZxdW90O09uIHRoZSBCdXNlcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFrZXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcnBlclwiLFxyXG4gICAgICAgICAgICBcIk5haWx5XCIsXHJcbiAgICAgICAgICAgIFwiR2FsbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGFydGlzdCBjdXJhdGVkIHRoZSBvZmZpY2lhbCBzb3VuZHRyYWNrIGZvciAmcXVvdDtUaGUgSHVuZ2VyIEdhbWVzOiBNb2NraW5namF5IC0gUGFydCAxJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvcmRlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJLYW55ZSBXZXN0XCIsXHJcbiAgICAgICAgICAgIFwiVG92ZSBMb1wiLFxyXG4gICAgICAgICAgICBcIkNoYXJsaSBYQ1hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQ2FuYWRpYW4gJDEgY29pbiBpcyBjb2xsb3F1aWFsbHkga25vd24gYXMgYSB3aGF0P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvb25pZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiRm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiTW9vZGllXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZXNlIGZvdW5kaW5nIGZhdGhlcnMgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgb2YgQW1lcmljYSBsYXRlciBiZWNhbWUgcHJlc2lkZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkphbWVzIE1vbnJvZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQWxleGFuZGVyIEhhbWlsdG9uXCIsXHJcbiAgICAgICAgICAgIFwiU2FtdWVsIEFkYW1zXCIsXHJcbiAgICAgICAgICAgIFwiUm9nZXIgU2hlcm1hblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIERpdmluaXR5OiBPcmlnaW5hbCBTaW4gSUksIHdoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXI/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFuZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTG9oc2VcIixcclxuICAgICAgICAgICAgXCJUaGUgUmVkIFByaW5jZVwiLFxyXG4gICAgICAgICAgICBcIlRoZXJlIGFyZSBubyBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldobyBpcyB0aGUgbWFpbiBwcm90YWdvbmlzdCBpbiB0aGUgZ2FtZSBMaWZlIGlzIFN0cmFuZ2U6IEJlZm9yZSBUaGUgU3Rvcm0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ2hsb2UgUHJpY2UgXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNYXggQ2F1bGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiUmFjaGVsIEFtYmVyXCIsXHJcbiAgICAgICAgICAgIFwiRnJhbmsgQm93ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkpvaG5ueSBEZXBwIG1hZGUgaGlzIGJpZy1zY3JlZW4gYWN0aW5nIGRlYnV0IGluIHdoaWNoIGZpbG0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQSBOaWdodG1hcmUgb24gRWxtIFN0cmVldFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTXkgQmxvb2R5IFZhbGVudGluZVwiLFxyXG4gICAgICAgICAgICBcIkhhbGxvd2VlblwiLFxyXG4gICAgICAgICAgICBcIkZyaWRheSB0aGUgMTN0aFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtSZXNpZGVudCBFdmlsJnF1b3Q7LCBvbmx5IENocmlzIGhhcyBhY2Nlc3MgdG8gdGhlIGdyZW5hZGUgbGF1bmNoZXIuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVycyBpcyBOT1QgcGxheWFibGUgaW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCA2JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkppbGwgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaHJpcyBSZWRmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlNoZXJyeSBCaXJraW5cIixcclxuICAgICAgICAgICAgXCJIZWxlbmEgSGFycGVyXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEphcGFuZXNlIEFuaW1lICYgTWFuZ2FcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSAxOTg4IGZpbG0gJnF1b3Q7QWtpcmEmcXVvdDssIFRldHN1byBlbmRzIHVwIGRlc3Ryb3lpbmcgVG9reW8uXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VvZ3JhcGh5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGJvZHkgb2YgdGhlIEVneXB0aWFuIFNwaGlueCB3YXMgYmFzZWQgb24gd2hpY2ggYW5pbWFsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJ1bGxcIixcclxuICAgICAgICAgICAgXCJIb3JzZVwiLFxyXG4gICAgICAgICAgICBcIkRvZ1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiByZWxhdGlvbiB0byB0aGUgQnJpdGlzaCBPY2N1cGF0aW9uIGluIElyZWxhbmQsIHdoYXQgZG9lcyB0aGUgSVJBIHN0YW5kIGZvci5cIixcclxuICAgICAgICBcImFcIjogXCJJcmlzaCBSZXB1YmxpY2FuIEFybXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIklyaXNoIFJlYmVsIEFsbGlhbmNlXCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmVmb3JtYXRpb24gQXJteVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoLVJveWFsIEFsbGlhbmNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHJvYm90IGluIHRoZSAxOTUxIHNjaWVuY2UgZmljdGlvbiBmaWxtIGNsYXNzaWMgJiMwMzk7VGhlIERheSB0aGUgRWFydGggU3Rvb2QgU3RpbGwmIzAzOTs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR29ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUm9iYnlcIixcclxuICAgICAgICAgICAgXCJDb2xvc3N1c1wiLFxyXG4gICAgICAgICAgICBcIkJveFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgUm9tYW4gbnVtZXJhbCBmb3IgNTAwP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxcIixcclxuICAgICAgICAgICAgXCJDXCIsXHJcbiAgICAgICAgICAgIFwiWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIG1haW4gaGVhbGluZyBpdGVtIGluIERhcmsgU291bHM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRXN0dXMgRmxhc2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhlYWx0aCBQb3Rpb25cIixcclxuICAgICAgICAgICAgXCJPcmFuZ2UgSnVpY2VcIixcclxuICAgICAgICAgICAgXCJBc2hlbiBGbGFza1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIk9uIHdoaWNoIGNvbXB1dGVyIGhhcmR3YXJlIGRldmljZSBpcyB0aGUgQklPUyBjaGlwIGxvY2F0ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTW90aGVyYm9hcmRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcmQgRGlzayBEcml2ZVwiLFxyXG4gICAgICAgICAgICBcIkNlbnRyYWwgUHJvY2Vzc2luZyBVbml0XCIsXHJcbiAgICAgICAgICAgIFwiR3JhcGhpY3MgUHJvY2Vzc2luZyBVbml0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJBIHVuaXZlcnNhbCBzZXQsIG9yIGEgc2V0IHRoYXQgY29udGFpbnMgYWxsIHNldHMsIGV4aXN0cy5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQWNlIEF0dG9ybmV5IHRyaWxvZ3kgd2FzIHN1cHBvc2UgdG8gZW5kIHdpdGggJnF1b3Q7UGhvZW5peCBXcmlnaHQ6IEFjZSBBdHRvcm5leSAmbWludXM7IFRyaWFscyBhbmQgVHJpYnVsYXRpb25zJnF1b3Q7IGFzIGl0cyBmaW5hbCBnYW1lLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgaGlnaGVzdCBiZWx0IHlvdSBjYW4gZ2V0IGluIFRhZWt3b25kbz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiV2hpdGVcIixcclxuICAgICAgICAgICAgXCJSZWRcIixcclxuICAgICAgICAgICAgXCJHcmVlblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgVW5pdGVkIFN0YXRlcyBEZXBhcnRtZW50IG9mIEhvbWVsYW5kIFNlY3VyaXR5IHdhcyBmb3JtZWQgaW4gcmVzcG9uc2UgdG8gdGhlIFNlcHRlbWJlciAxMXRoIGF0dGFja3MuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQXBvbGxvIG1pc3Npb24gd2FzIHRoZSBsYXN0IG9uZSBpbiBOQVNBJiMwMzk7cyBBcG9sbG8gcHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJBcG9sbG8gMTdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwb2xsbyAxM1wiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxMVwiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgaXMgYW4gZXhpc3RpbmcgZmFtaWx5IGluICZxdW90O1RoZSBTaW1zJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBHb3RoIEZhbWlseVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBTaW1vbGVvbiBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgUHJvdWQgRmFtaWx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgTnVjbGVhciBUaHJvbmUsIHdoYXQgb3JnYW5pemF0aW9uIGNoYXNlcyB0aGUgcGxheWVyIGNoYXJhY3RlciB0aHJvdWdob3V0IHRoZSBnYW1lP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBJLkQuUC5EXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmlzaG1lblwiLFxyXG4gICAgICAgICAgICBcIlRoZSBCYW5kaXRzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFkuVi5HLkdcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lICZxdW90O0NhdmUgU3RvcnksJnF1b3Q7IHdoYXQgaXMgdGhlIGNoYXJhY3RlciBCYWxyb2cmIzAzOTtzIGNhdGNocGhyYXNlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkh1enphaCFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlllcyFcIixcclxuICAgICAgICAgICAgXCJXaG9hIHRoZXJlIVwiLFxyXG4gICAgICAgICAgICBcIk55ZWggaGVoIGhlaCFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiVmVoaWNsZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvbmUgb2YgdGhlc2UgY2hhc3NpcyBjb2RlcyBhcmUgdXNlZCBieSBCTVcgMy1zZXJpZXM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRTQ2XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFMzlcIixcclxuICAgICAgICAgICAgXCJFODVcIixcclxuICAgICAgICAgICAgXCJGMTBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ29taWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gd2hhdCBIb21lc3R1Y2sgVXBkYXRlIHdhcyBbU10gR2FtZSBPdmVyIHJlbGVhc2VkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk9jdG9iZXIgMjV0aCwgMjAxNFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXByaWwgMTN0aCwgMjAwOVwiLFxyXG4gICAgICAgICAgICBcIkFwcmlsIDh0aCwgMjAxMlwiLFxyXG4gICAgICAgICAgICBcIkF1Z3VzdCAyOHRoLCAyMDAzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgYmFuZCBtZW1iZXJzIG9mIEFtZXJpY2FuIHJvY2sgYmFuZCBLaW5nIG9mIExlb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQnJvdGhlcnMgJmFtcDsgY291c2luc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hpbGRob29kIGZyaWVuZHNcIixcclxuICAgICAgICAgICAgXCJGb3JtZXIgY2xhc3NtYXRlc1wiLFxyXG4gICAgICAgICAgICBcIkZyYXRlcm5pdHkgaG91c2UgbWVtYmVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZnJhbmNoaXNlIGhhZCBhIHNwZWNpYWwgZXZlbnQgaG9zdGVkIGluIHRoZSBwb3B1bGFyIE1NT1JQRyBGaW5hbCBGYW50YXN5IFhJVjogQSBSZWFsbSBSZWJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiWW8ta2FpIFdhdGNoXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJQb2smZWFjdXRlO21vblwiLFxyXG4gICAgICAgICAgICBcIll1LWdpLW9oXCIsXHJcbiAgICAgICAgICAgIFwiQnVkZHlmaWdodFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEtpbmdkb20gSGVhcnRzIGdhbWUgZmVhdHVyZWQgdGhlIGNhc3Qgb2YgJnF1b3Q7VGhlIFdvcmxkIEVuZHMgV2l0aCBZb3UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRHJlYW0gRHJvcCBEaXN0YW5jZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQmlydGggQnkgU2xlZXBcIixcclxuICAgICAgICAgICAgXCIzNjUvMiBEYXlzXCIsXHJcbiAgICAgICAgICAgIFwiUmU6Q2hhaW4gb2YgTWVtb3JpZXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBsYXJnZXN0IHBsYW5ldCBpbiBLZXJiYWwgU3BhY2UgUHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJKb29sXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFZWxvb1wiLFxyXG4gICAgICAgICAgICBcIktlcmJvbFwiLFxyXG4gICAgICAgICAgICBcIk1pbm11c1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFuaW1hbCBDcm9zc2luZyBnYW1lIHdhcyBmb3IgdGhlIE5pbnRlbmRvIFdpaT9cIixcclxuICAgICAgICBcImFcIjogXCJBbmltYWwgQ3Jvc3Npbmc6IENpdHkgRm9sa1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBOZXcgTGVhZlwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogV2lsZCBXb3JsZFwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogUG9wdWxhdGlvbiBHcm93aW5nIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJHZW9yZ2UgTHVjYXMgZGlyZWN0ZWQgdGhlIGVudGlyZSBvcmlnaW5hbCBTdGFyIFdhcnMgdHJpbG9neS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIGNpdHkgb2YgUm9tZSwgSXRhbHkgZm91bmRlZD9cIixcclxuICAgICAgICBcImFcIjogXCI3NTMgQkNFXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCI5MDIgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNTI0IEJDRVwiLFxyXG4gICAgICAgICAgICBcIjY5NyBCQ0VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZGF0YSBzdHJ1Y3R1cmUgZG9lcyBGSUxPIGFwcGx5IHRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlN0YWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJRdWV1ZVwiLFxyXG4gICAgICAgICAgICBcIkhlYXBcIixcclxuICAgICAgICAgICAgXCJUcmVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEJhdHRsZXN0YXIgR2FsYWN0aWNhICgyMDA0KSwgQ3lsb25zIHdlcmUgY3JlYXRlZCBieSBtYW4gYXMgY3liZXJuZXRpYyB3b3JrZXJzIGFuZCBzb2xkaWVycy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIDIwMTYgRGlzbmV5IGFuaW1hdGVkIGZpbG0gJiMwMzk7TW9hbmEmIzAzOTsgaXMgYmFzZWQgb24gd2hpY2ggY3VsdHVyZT9cIixcclxuICAgICAgICBcImFcIjogXCJQb2x5bmVzaWFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJOYXRpdmUgQW1lcmljYW5cIixcclxuICAgICAgICAgICAgXCJKYXBhbmVzZVwiLFxyXG4gICAgICAgICAgICBcIk5vcmRpY1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNha2UgZGVwaWN0ZWQgaW4gVmFsdmUmIzAzOTtzICZxdW90O1BvcnRhbCZxdW90OyBmcmFuY2hpc2UgbW9zdCBjbG9zZWx5IHJlc2VtYmxlcyB3aGljaCByZWFsLXdvcmxkIHR5cGUgb2YgY2FrZT9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFjayBGb3Jlc3RcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkRldmlsJiMwMzk7cyBGb29kXCIsXHJcbiAgICAgICAgICAgIFwiTW9sdGVuIENob2NvbGF0ZVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbiBDaG9jb2xhdGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZSAmIE5hdHVyZVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNoZW1pY2FsIGVsZW1lbnQgTGl0aGl1bSBpcyBuYW1lZCBhZnRlciB0aGUgY291bnRyeSBvZiBMaXRodWFuaWEuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogR2FkZ2V0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBEVkQgaW52ZW50ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk5NVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAwMFwiLFxyXG4gICAgICAgICAgICBcIjE5OTBcIixcclxuICAgICAgICAgICAgXCIxOTgwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGZ1bGwgbmFtZSBvZiB0aGUgZm9vdGJhbGxlciAmcXVvdDtDcmlzdGlhbm8gUm9uYWxkbyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJDcmlzdGlhbm8gUm9uYWxkbyBkb3MgU2FudG9zIEF2ZWlyb1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIFJvbmFsZG8gbG9zIFNhbnRvcyBEaWVnb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBBcm1hbmRvIERpZWdvIFJvbmFsZG9cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gTHVpcyBBcm1hbmRvIFJvbmFsZG9cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZXNlIHR3byBjb3VudHJpZXMgaGVsZCBhIGNvbW1vbndlYWx0aCBmcm9tIHRoZSAxNnRoIHRvIDE4dGggY2VudHVyeS5cIixcclxuICAgICAgICBcImFcIjogXCJQb2xhbmQgYW5kIExpdGh1YW5pYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSHV0dSBhbmQgUndhbmRhXCIsXHJcbiAgICAgICAgICAgIFwiTm9ydGggS29yZWEgYW5kIFNvdXRoIEtvcmVhXCIsXHJcbiAgICAgICAgICAgIFwiQmFuZ2xhZGVzaCBhbmQgQmh1dGFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtDYWxsIE9mIER1dHk6IFpvbWJpZXMmcXVvdDssIGNvbXBsZXRpbmcgd2hpY2ggbWFwJiMwMzk7cyBtYWluIGVhc3RlciBlZ2cgd2lsbCByZXdhcmQgeW91IHdpdGggdGhlIGFjaGlldmVtZW50LCAmcXVvdDtIaWdoIE1haW50ZW5hbmNlJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRpZSBSaXNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNb2IgT2YgVGhlIERlYWRcIixcclxuICAgICAgICAgICAgXCJPcmlnaW5zXCIsXHJcbiAgICAgICAgICAgIFwiQXNjZW5zaW9uXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENhcnRvb24gJiBBbmltYXRpb25zXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7R3Jhdml0eSBGYWxscyZxdW90OywgaG93IG11Y2ggZG9lcyBXYWRkbGVzIHdlaWdoIHdoZW4gTWFibGUgd2lucyBoaW0gaW4gJnF1b3Q7VGhlIFRpbWUgVHJhdmVsZXImIzAzOTtzIFBpZyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCIxNSBwb3VuZHNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjEwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjMwIHBvdW5kc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIGdpdmVuIHRvIGxheWVyIDQgb2YgdGhlIE9wZW4gU3lzdGVtcyBJbnRlcmNvbm5lY3Rpb24gKElTTykgbW9kZWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJhbnNwb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJTZXNzaW9uXCIsXHJcbiAgICAgICAgICAgIFwiRGF0YSBsaW5rXCIsXHJcbiAgICAgICAgICAgIFwiTmV0d29ya1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgeWVhciB3YXMgaG9ja2V5IGxlZ2VuZCBXYXluZSBHcmV0emt5IGJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk2MVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMTk2NVwiLFxyXG4gICAgICAgICAgICBcIjE5NTlcIixcclxuICAgICAgICAgICAgXCIxOTYzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJIb3cgbWFueSBnYW1lcyBhcmUgdGhlcmUgaW4gdGhlICZxdW90O0NvbG9ueSBXYXJzJnF1b3Q7IHNlcmllcyBmb3IgdGhlIFBsYXlTdGF0aW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjJcIixcclxuICAgICAgICAgICAgXCI0XCIsXHJcbiAgICAgICAgICAgIFwiNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIFdvcmxkIG9mIFdhcmNyYWZ0LCB3aGljaCByYWlkIGluc3RhbmNlIGZlYXR1cmVzIGEgY2hlc3MgZXZlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiS2FyYXpoYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlp1bCYjMDM5O0FtYW5cIixcclxuICAgICAgICAgICAgXCJCbGFja3dpbmcgTGFpclwiLFxyXG4gICAgICAgICAgICBcIlRlbXBsZSBvZiBBaG4mIzAzOTtRaXJhalwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggY291bnRyeSB3YXMgSm9zZWYgU3RhbGluIGJvcm4gaW4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR2VvcmdpYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUnVzc2lhXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFueVwiLFxyXG4gICAgICAgICAgICBcIlBvbGFuZFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG9mZmljaWFsIG5hbWUgb2YgUHJpbmNlJiMwMzk7cyBiYWNraW5nIGJhbmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIFJldm9sdXRpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBQYXVwZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFdhaWxlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgSGVhcnRicmVha2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiBHYW1lIG9mIFRocm9uZXMgd2hhdCBpcyB0aGUgbmFtZSBvZiBKb24gU25vdyYjMDM5O3Mgc3dvcmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9uZ2NsYXdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk9hdGhrZWVwZXJcIixcclxuICAgICAgICAgICAgXCJXaWRvdyYjMDM5O3MgV2FpbFwiLFxyXG4gICAgICAgICAgICBcIk5lZWRsZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBpbnNwZWN0b3IgaW4gdGhlIHNlcmllcyAmcXVvdDtPbiB0aGUgQnVzZXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxha2V5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJwZXJcIixcclxuICAgICAgICAgICAgXCJOYWlseVwiLFxyXG4gICAgICAgICAgICBcIkdhbGx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBhcnRpc3QgY3VyYXRlZCB0aGUgb2ZmaWNpYWwgc291bmR0cmFjayBmb3IgJnF1b3Q7VGhlIEh1bmdlciBHYW1lczogTW9ja2luZ2pheSAtIFBhcnQgMSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJMb3JkZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiS2FueWUgV2VzdFwiLFxyXG4gICAgICAgICAgICBcIlRvdmUgTG9cIixcclxuICAgICAgICAgICAgXCJDaGFybGkgWENYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIENhbmFkaWFuICQxIGNvaW4gaXMgY29sbG9xdWlhbGx5IGtub3duIGFzIGEgd2hhdD9cIixcclxuICAgICAgICBcImFcIjogXCJMb29uaWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIkZvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIk1vb2RpZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGVzZSBmb3VuZGluZyBmYXRoZXJzIG9mIHRoZSBVbml0ZWQgU3RhdGVzIG9mIEFtZXJpY2EgbGF0ZXIgYmVjYW1lIHByZXNpZGVudD9cIixcclxuICAgICAgICBcImFcIjogXCJKYW1lcyBNb25yb2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFsZXhhbmRlciBIYW1pbHRvblwiLFxyXG4gICAgICAgICAgICBcIlNhbXVlbCBBZGFtc1wiLFxyXG4gICAgICAgICAgICBcIlJvZ2VyIFNoZXJtYW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBEaXZpbml0eTogT3JpZ2luYWwgU2luIElJLCB3aGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxvaHNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFJlZCBQcmluY2VcIixcclxuICAgICAgICAgICAgXCJUaGVyZSBhcmUgbm8gc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3RlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaG8gaXMgdGhlIG1haW4gcHJvdGFnb25pc3QgaW4gdGhlIGdhbWUgTGlmZSBpcyBTdHJhbmdlOiBCZWZvcmUgVGhlIFN0b3JtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNobG9lIFByaWNlIFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTWF4IENhdWxmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlJhY2hlbCBBbWJlclwiLFxyXG4gICAgICAgICAgICBcIkZyYW5rIEJvd2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJKb2hubnkgRGVwcCBtYWRlIGhpcyBiaWctc2NyZWVuIGFjdGluZyBkZWJ1dCBpbiB3aGljaCBmaWxtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkEgTmlnaHRtYXJlIG9uIEVsbSBTdHJlZXRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk15IEJsb29keSBWYWxlbnRpbmVcIixcclxuICAgICAgICAgICAgXCJIYWxsb3dlZW5cIixcclxuICAgICAgICAgICAgXCJGcmlkYXkgdGhlIDEzdGhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCZxdW90Oywgb25seSBDaHJpcyBoYXMgYWNjZXNzIHRvIHRoZSBncmVuYWRlIGxhdW5jaGVyLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcnMgaXMgTk9UIHBsYXlhYmxlIGluICZxdW90O1Jlc2lkZW50IEV2aWwgNiZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJKaWxsIFZhbGVudGluZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hyaXMgUmVkZmllbGRcIixcclxuICAgICAgICAgICAgXCJTaGVycnkgQmlya2luXCIsXHJcbiAgICAgICAgICAgIFwiSGVsZW5hIEhhcnBlclwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBKYXBhbmVzZSBBbmltZSAmIE1hbmdhXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgMTk4OCBmaWxtICZxdW90O0FraXJhJnF1b3Q7LCBUZXRzdW8gZW5kcyB1cCBkZXN0cm95aW5nIFRva3lvLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlb2dyYXBoeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBib2R5IG9mIHRoZSBFZ3lwdGlhbiBTcGhpbnggd2FzIGJhc2VkIG9uIHdoaWNoIGFuaW1hbD9cIixcclxuICAgICAgICBcImFcIjogXCJMaW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCdWxsXCIsXHJcbiAgICAgICAgICAgIFwiSG9yc2VcIixcclxuICAgICAgICAgICAgXCJEb2dcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gcmVsYXRpb24gdG8gdGhlIEJyaXRpc2ggT2NjdXBhdGlvbiBpbiBJcmVsYW5kLCB3aGF0IGRvZXMgdGhlIElSQSBzdGFuZCBmb3IuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSXJpc2ggUmVwdWJsaWNhbiBBcm15XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWJlbCBBbGxpYW5jZVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoIFJlZm9ybWF0aW9uIEFybXlcIixcclxuICAgICAgICAgICAgXCJJcmlzaC1Sb3lhbCBBbGxpYW5jZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSByb2JvdCBpbiB0aGUgMTk1MSBzY2llbmNlIGZpY3Rpb24gZmlsbSBjbGFzc2ljICYjMDM5O1RoZSBEYXkgdGhlIEVhcnRoIFN0b29kIFN0aWxsJiMwMzk7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJvYmJ5XCIsXHJcbiAgICAgICAgICAgIFwiQ29sb3NzdXNcIixcclxuICAgICAgICAgICAgXCJCb3hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIFJvbWFuIG51bWVyYWwgZm9yIDUwMD9cIixcclxuICAgICAgICBcImFcIjogXCJEXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMXCIsXHJcbiAgICAgICAgICAgIFwiQ1wiLFxyXG4gICAgICAgICAgICBcIlhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBtYWluIGhlYWxpbmcgaXRlbSBpbiBEYXJrIFNvdWxzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkVzdHVzIEZsYXNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIZWFsdGggUG90aW9uXCIsXHJcbiAgICAgICAgICAgIFwiT3JhbmdlIEp1aWNlXCIsXHJcbiAgICAgICAgICAgIFwiQXNoZW4gRmxhc2tcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJPbiB3aGljaCBjb21wdXRlciBoYXJkd2FyZSBkZXZpY2UgaXMgdGhlIEJJT1MgY2hpcCBsb2NhdGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk1vdGhlcmJvYXJkXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJkIERpc2sgRHJpdmVcIixcclxuICAgICAgICAgICAgXCJDZW50cmFsIFByb2Nlc3NpbmcgVW5pdFwiLFxyXG4gICAgICAgICAgICBcIkdyYXBoaWNzIFByb2Nlc3NpbmcgVW5pdFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiQSB1bml2ZXJzYWwgc2V0LCBvciBhIHNldCB0aGF0IGNvbnRhaW5zIGFsbCBzZXRzLCBleGlzdHMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIEFjZSBBdHRvcm5leSB0cmlsb2d5IHdhcyBzdXBwb3NlIHRvIGVuZCB3aXRoICZxdW90O1Bob2VuaXggV3JpZ2h0OiBBY2UgQXR0b3JuZXkgJm1pbnVzOyBUcmlhbHMgYW5kIFRyaWJ1bGF0aW9ucyZxdW90OyBhcyBpdHMgZmluYWwgZ2FtZS5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGhpZ2hlc3QgYmVsdCB5b3UgY2FuIGdldCBpbiBUYWVrd29uZG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIldoaXRlXCIsXHJcbiAgICAgICAgICAgIFwiUmVkXCIsXHJcbiAgICAgICAgICAgIFwiR3JlZW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIFVuaXRlZCBTdGF0ZXMgRGVwYXJ0bWVudCBvZiBIb21lbGFuZCBTZWN1cml0eSB3YXMgZm9ybWVkIGluIHJlc3BvbnNlIHRvIHRoZSBTZXB0ZW1iZXIgMTF0aCBhdHRhY2tzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFwb2xsbyBtaXNzaW9uIHdhcyB0aGUgbGFzdCBvbmUgaW4gTkFTQSYjMDM5O3MgQXBvbGxvIHByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQXBvbGxvIDE3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTNcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTFcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGlzIGFuIGV4aXN0aW5nIGZhbWlseSBpbiAmcXVvdDtUaGUgU2ltcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgR290aCBGYW1pbHlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgU2ltb2xlb24gRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFByb3VkIEZhbWlseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lIE51Y2xlYXIgVGhyb25lLCB3aGF0IG9yZ2FuaXphdGlvbiBjaGFzZXMgdGhlIHBsYXllciBjaGFyYWN0ZXIgdGhyb3VnaG91dCB0aGUgZ2FtZT9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgSS5ELlAuRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZpc2htZW5cIixcclxuICAgICAgICAgICAgXCJUaGUgQmFuZGl0c1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBZLlYuRy5HXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSAmcXVvdDtDYXZlIFN0b3J5LCZxdW90OyB3aGF0IGlzIHRoZSBjaGFyYWN0ZXIgQmFscm9nJiMwMzk7cyBjYXRjaHBocmFzZT9cIixcclxuICAgICAgICBcImFcIjogXCJIdXp6YWghXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJZZXMhXCIsXHJcbiAgICAgICAgICAgIFwiV2hvYSB0aGVyZSFcIixcclxuICAgICAgICAgICAgXCJOeWVoIGhlaCBoZWghXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlZlaGljbGVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb25lIG9mIHRoZXNlIGNoYXNzaXMgY29kZXMgYXJlIHVzZWQgYnkgQk1XIDMtc2VyaWVzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkU0NlwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRTM5XCIsXHJcbiAgICAgICAgICAgIFwiRTg1XCIsXHJcbiAgICAgICAgICAgIFwiRjEwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENvbWljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHdoYXQgSG9tZXN0dWNrIFVwZGF0ZSB3YXMgW1NdIEdhbWUgT3ZlciByZWxlYXNlZD9cIixcclxuICAgICAgICBcImFcIjogXCJPY3RvYmVyIDI1dGgsIDIwMTRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwcmlsIDEzdGgsIDIwMDlcIixcclxuICAgICAgICAgICAgXCJBcHJpbCA4dGgsIDIwMTJcIixcclxuICAgICAgICAgICAgXCJBdWd1c3QgMjh0aCwgMjAwM1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIGJhbmQgbWVtYmVycyBvZiBBbWVyaWNhbiByb2NrIGJhbmQgS2luZyBvZiBMZW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJyb3RoZXJzICZhbXA7IGNvdXNpbnNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNoaWxkaG9vZCBmcmllbmRzXCIsXHJcbiAgICAgICAgICAgIFwiRm9ybWVyIGNsYXNzbWF0ZXNcIixcclxuICAgICAgICAgICAgXCJGcmF0ZXJuaXR5IGhvdXNlIG1lbWJlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGZyYW5jaGlzZSBoYWQgYSBzcGVjaWFsIGV2ZW50IGhvc3RlZCBpbiB0aGUgcG9wdWxhciBNTU9SUEcgRmluYWwgRmFudGFzeSBYSVY6IEEgUmVhbG0gUmVib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIllvLWthaSBXYXRjaFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUG9rJmVhY3V0ZTttb25cIixcclxuICAgICAgICAgICAgXCJZdS1naS1vaFwiLFxyXG4gICAgICAgICAgICBcIkJ1ZGR5ZmlnaHRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBLaW5nZG9tIEhlYXJ0cyBnYW1lIGZlYXR1cmVkIHRoZSBjYXN0IG9mICZxdW90O1RoZSBXb3JsZCBFbmRzIFdpdGggWW91JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRyZWFtIERyb3AgRGlzdGFuY2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJpcnRoIEJ5IFNsZWVwXCIsXHJcbiAgICAgICAgICAgIFwiMzY1LzIgRGF5c1wiLFxyXG4gICAgICAgICAgICBcIlJlOkNoYWluIG9mIE1lbW9yaWVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbGFyZ2VzdCBwbGFuZXQgaW4gS2VyYmFsIFNwYWNlIFByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSm9vbFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRWVsb29cIixcclxuICAgICAgICAgICAgXCJLZXJib2xcIixcclxuICAgICAgICAgICAgXCJNaW5tdXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBbmltYWwgQ3Jvc3NpbmcgZ2FtZSB3YXMgZm9yIHRoZSBOaW50ZW5kbyBXaWk/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQW5pbWFsIENyb3NzaW5nOiBDaXR5IEZvbGtcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogTmV3IExlYWZcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFdpbGQgV29ybGRcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFBvcHVsYXRpb24gR3Jvd2luZyFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiR2VvcmdlIEx1Y2FzIGRpcmVjdGVkIHRoZSBlbnRpcmUgb3JpZ2luYWwgU3RhciBXYXJzIHRyaWxvZ3kuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBjaXR5IG9mIFJvbWUsIEl0YWx5IGZvdW5kZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiNzUzIEJDRVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiOTAyIEJDRVwiLFxyXG4gICAgICAgICAgICBcIjUyNCBCQ0VcIixcclxuICAgICAgICAgICAgXCI2OTcgQkNFXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGRhdGEgc3RydWN0dXJlIGRvZXMgRklMTyBhcHBseSB0bz9cIixcclxuICAgICAgICBcImFcIjogXCJTdGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUXVldWVcIixcclxuICAgICAgICAgICAgXCJIZWFwXCIsXHJcbiAgICAgICAgICAgIFwiVHJlZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBCYXR0bGVzdGFyIEdhbGFjdGljYSAoMjAwNCksIEN5bG9ucyB3ZXJlIGNyZWF0ZWQgYnkgbWFuIGFzIGN5YmVybmV0aWMgd29ya2VycyBhbmQgc29sZGllcnMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSAyMDE2IERpc25leSBhbmltYXRlZCBmaWxtICYjMDM5O01vYW5hJiMwMzk7IGlzIGJhc2VkIG9uIHdoaWNoIGN1bHR1cmU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9seW5lc2lhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTmF0aXZlIEFtZXJpY2FuXCIsXHJcbiAgICAgICAgICAgIFwiSmFwYW5lc2VcIixcclxuICAgICAgICAgICAgXCJOb3JkaWNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjYWtlIGRlcGljdGVkIGluIFZhbHZlJiMwMzk7cyAmcXVvdDtQb3J0YWwmcXVvdDsgZnJhbmNoaXNlIG1vc3QgY2xvc2VseSByZXNlbWJsZXMgd2hpY2ggcmVhbC13b3JsZCB0eXBlIG9mIGNha2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2sgRm9yZXN0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJEZXZpbCYjMDM5O3MgRm9vZFwiLFxyXG4gICAgICAgICAgICBcIk1vbHRlbiBDaG9jb2xhdGVcIixcclxuICAgICAgICAgICAgXCJHZXJtYW4gQ2hvY29sYXRlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2UgJiBOYXR1cmVcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjaGVtaWNhbCBlbGVtZW50IExpdGhpdW0gaXMgbmFtZWQgYWZ0ZXIgdGhlIGNvdW50cnkgb2YgTGl0aHVhbmlhLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IEdhZGdldHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgRFZEIGludmVudGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5OTVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwMDBcIixcclxuICAgICAgICAgICAgXCIxOTkwXCIsXHJcbiAgICAgICAgICAgIFwiMTk4MFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBmdWxsIG5hbWUgb2YgdGhlIGZvb3RiYWxsZXIgJnF1b3Q7Q3Jpc3RpYW5vIFJvbmFsZG8mcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ3Jpc3RpYW5vIFJvbmFsZG8gZG9zIFNhbnRvcyBBdmVpcm9cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBSb25hbGRvIGxvcyBTYW50b3MgRGllZ29cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gQXJtYW5kbyBEaWVnbyBSb25hbGRvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEx1aXMgQXJtYW5kbyBSb25hbGRvXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGVzZSB0d28gY291bnRyaWVzIGhlbGQgYSBjb21tb253ZWFsdGggZnJvbSB0aGUgMTZ0aCB0byAxOHRoIGNlbnR1cnkuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9sYW5kIGFuZCBMaXRodWFuaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkh1dHUgYW5kIFJ3YW5kYVwiLFxyXG4gICAgICAgICAgICBcIk5vcnRoIEtvcmVhIGFuZCBTb3V0aCBLb3JlYVwiLFxyXG4gICAgICAgICAgICBcIkJhbmdsYWRlc2ggYW5kIEJodXRhblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7Q2FsbCBPZiBEdXR5OiBab21iaWVzJnF1b3Q7LCBjb21wbGV0aW5nIHdoaWNoIG1hcCYjMDM5O3MgbWFpbiBlYXN0ZXIgZWdnIHdpbGwgcmV3YXJkIHlvdSB3aXRoIHRoZSBhY2hpZXZlbWVudCwgJnF1b3Q7SGlnaCBNYWludGVuYW5jZSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEaWUgUmlzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTW9iIE9mIFRoZSBEZWFkXCIsXHJcbiAgICAgICAgICAgIFwiT3JpZ2luc1wiLFxyXG4gICAgICAgICAgICBcIkFzY2Vuc2lvblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDYXJ0b29uICYgQW5pbWF0aW9uc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0dyYXZpdHkgRmFsbHMmcXVvdDssIGhvdyBtdWNoIGRvZXMgV2FkZGxlcyB3ZWlnaCB3aGVuIE1hYmxlIHdpbnMgaGltIGluICZxdW90O1RoZSBUaW1lIFRyYXZlbGVyJiMwMzk7cyBQaWcmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTUgcG91bmRzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIxMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIzMCBwb3VuZHNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBnaXZlbiB0byBsYXllciA0IG9mIHRoZSBPcGVuIFN5c3RlbXMgSW50ZXJjb25uZWN0aW9uIChJU08pIG1vZGVsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRyYW5zcG9ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiU2Vzc2lvblwiLFxyXG4gICAgICAgICAgICBcIkRhdGEgbGlua1wiLFxyXG4gICAgICAgICAgICBcIk5ldHdvcmtcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IHllYXIgd2FzIGhvY2tleSBsZWdlbmQgV2F5bmUgR3JldHpreSBib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5NjFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjE5NjVcIixcclxuICAgICAgICAgICAgXCIxOTU5XCIsXHJcbiAgICAgICAgICAgIFwiMTk2M1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSG93IG1hbnkgZ2FtZXMgYXJlIHRoZXJlIGluIHRoZSAmcXVvdDtDb2xvbnkgV2FycyZxdW90OyBzZXJpZXMgZm9yIHRoZSBQbGF5U3RhdGlvbj9cIixcclxuICAgICAgICBcImFcIjogXCIzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyXCIsXHJcbiAgICAgICAgICAgIFwiNFwiLFxyXG4gICAgICAgICAgICBcIjVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiBXb3JsZCBvZiBXYXJjcmFmdCwgd2hpY2ggcmFpZCBpbnN0YW5jZSBmZWF0dXJlcyBhIGNoZXNzIGV2ZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkthcmF6aGFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJadWwmIzAzOTtBbWFuXCIsXHJcbiAgICAgICAgICAgIFwiQmxhY2t3aW5nIExhaXJcIixcclxuICAgICAgICAgICAgXCJUZW1wbGUgb2YgQWhuJiMwMzk7UWlyYWpcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGNvdW50cnkgd2FzIEpvc2VmIFN0YWxpbiBib3JuIGluP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdlb3JnaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJ1c3NpYVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbnlcIixcclxuICAgICAgICAgICAgXCJQb2xhbmRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBvZmZpY2lhbCBuYW1lIG9mIFByaW5jZSYjMDM5O3MgYmFja2luZyBiYW5kP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBSZXZvbHV0aW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgUGF1cGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBXYWlsZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEhlYXJ0YnJlYWtlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gR2FtZSBvZiBUaHJvbmVzIHdoYXQgaXMgdGhlIG5hbWUgb2YgSm9uIFNub3cmIzAzOTtzIHN3b3JkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvbmdjbGF3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJPYXRoa2VlcGVyXCIsXHJcbiAgICAgICAgICAgIFwiV2lkb3cmIzAzOTtzIFdhaWxcIixcclxuICAgICAgICAgICAgXCJOZWVkbGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgaW5zcGVjdG9yIGluIHRoZSBzZXJpZXMgJnF1b3Q7T24gdGhlIEJ1c2VzJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWtleVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFycGVyXCIsXHJcbiAgICAgICAgICAgIFwiTmFpbHlcIixcclxuICAgICAgICAgICAgXCJHYWxseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggYXJ0aXN0IGN1cmF0ZWQgdGhlIG9mZmljaWFsIHNvdW5kdHJhY2sgZm9yICZxdW90O1RoZSBIdW5nZXIgR2FtZXM6IE1vY2tpbmdqYXkgLSBQYXJ0IDEmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9yZGVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkthbnllIFdlc3RcIixcclxuICAgICAgICAgICAgXCJUb3ZlIExvXCIsXHJcbiAgICAgICAgICAgIFwiQ2hhcmxpIFhDWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBDYW5hZGlhbiAkMSBjb2luIGlzIGNvbGxvcXVpYWxseSBrbm93biBhcyBhIHdoYXQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9vbmllXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCb29saWVcIixcclxuICAgICAgICAgICAgXCJGb29saWVcIixcclxuICAgICAgICAgICAgXCJNb29kaWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlc2UgZm91bmRpbmcgZmF0aGVycyBvZiB0aGUgVW5pdGVkIFN0YXRlcyBvZiBBbWVyaWNhIGxhdGVyIGJlY2FtZSBwcmVzaWRlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmFtZXMgTW9ucm9lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbGV4YW5kZXIgSGFtaWx0b25cIixcclxuICAgICAgICAgICAgXCJTYW11ZWwgQWRhbXNcIixcclxuICAgICAgICAgICAgXCJSb2dlciBTaGVybWFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gRGl2aW5pdHk6IE9yaWdpbmFsIFNpbiBJSSwgd2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3Rlcj9cIixcclxuICAgICAgICBcImFcIjogXCJGYW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMb2hzZVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBSZWQgUHJpbmNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlcmUgYXJlIG5vIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hvIGlzIHRoZSBtYWluIHByb3RhZ29uaXN0IGluIHRoZSBnYW1lIExpZmUgaXMgU3RyYW5nZTogQmVmb3JlIFRoZSBTdG9ybT9cIixcclxuICAgICAgICBcImFcIjogXCJDaGxvZSBQcmljZSBcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1heCBDYXVsZmllbGRcIixcclxuICAgICAgICAgICAgXCJSYWNoZWwgQW1iZXJcIixcclxuICAgICAgICAgICAgXCJGcmFuayBCb3dlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSm9obm55IERlcHAgbWFkZSBoaXMgYmlnLXNjcmVlbiBhY3RpbmcgZGVidXQgaW4gd2hpY2ggZmlsbT9cIixcclxuICAgICAgICBcImFcIjogXCJBIE5pZ2h0bWFyZSBvbiBFbG0gU3RyZWV0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNeSBCbG9vZHkgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgICAgIFwiSGFsbG93ZWVuXCIsXHJcbiAgICAgICAgICAgIFwiRnJpZGF5IHRoZSAxM3RoXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O1Jlc2lkZW50IEV2aWwmcXVvdDssIG9ubHkgQ2hyaXMgaGFzIGFjY2VzcyB0byB0aGUgZ3JlbmFkZSBsYXVuY2hlci5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXJzIGlzIE5PVCBwbGF5YWJsZSBpbiAmcXVvdDtSZXNpZGVudCBFdmlsIDYmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmlsbCBWYWxlbnRpbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNocmlzIFJlZGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiU2hlcnJ5IEJpcmtpblwiLFxyXG4gICAgICAgICAgICBcIkhlbGVuYSBIYXJwZXJcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogSmFwYW5lc2UgQW5pbWUgJiBNYW5nYVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIDE5ODggZmlsbSAmcXVvdDtBa2lyYSZxdW90OywgVGV0c3VvIGVuZHMgdXAgZGVzdHJveWluZyBUb2t5by5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW9ncmFwaHlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgYm9keSBvZiB0aGUgRWd5cHRpYW4gU3BoaW54IHdhcyBiYXNlZCBvbiB3aGljaCBhbmltYWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQnVsbFwiLFxyXG4gICAgICAgICAgICBcIkhvcnNlXCIsXHJcbiAgICAgICAgICAgIFwiRG9nXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHJlbGF0aW9uIHRvIHRoZSBCcml0aXNoIE9jY3VwYXRpb24gaW4gSXJlbGFuZCwgd2hhdCBkb2VzIHRoZSBJUkEgc3RhbmQgZm9yLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIklyaXNoIFJlcHVibGljYW4gQXJteVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmViZWwgQWxsaWFuY2VcIixcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWZvcm1hdGlvbiBBcm15XCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2gtUm95YWwgQWxsaWFuY2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgcm9ib3QgaW4gdGhlIDE5NTEgc2NpZW5jZSBmaWN0aW9uIGZpbG0gY2xhc3NpYyAmIzAzOTtUaGUgRGF5IHRoZSBFYXJ0aCBTdG9vZCBTdGlsbCYjMDM5Oz9cIixcclxuICAgICAgICBcImFcIjogXCJHb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSb2JieVwiLFxyXG4gICAgICAgICAgICBcIkNvbG9zc3VzXCIsXHJcbiAgICAgICAgICAgIFwiQm94XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBSb21hbiBudW1lcmFsIGZvciA1MDA/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTFwiLFxyXG4gICAgICAgICAgICBcIkNcIixcclxuICAgICAgICAgICAgXCJYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbWFpbiBoZWFsaW5nIGl0ZW0gaW4gRGFyayBTb3Vscz9cIixcclxuICAgICAgICBcImFcIjogXCJFc3R1cyBGbGFza1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGVhbHRoIFBvdGlvblwiLFxyXG4gICAgICAgICAgICBcIk9yYW5nZSBKdWljZVwiLFxyXG4gICAgICAgICAgICBcIkFzaGVuIEZsYXNrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiT24gd2hpY2ggY29tcHV0ZXIgaGFyZHdhcmUgZGV2aWNlIGlzIHRoZSBCSU9TIGNoaXAgbG9jYXRlZD9cIixcclxuICAgICAgICBcImFcIjogXCJNb3RoZXJib2FyZFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFyZCBEaXNrIERyaXZlXCIsXHJcbiAgICAgICAgICAgIFwiQ2VudHJhbCBQcm9jZXNzaW5nIFVuaXRcIixcclxuICAgICAgICAgICAgXCJHcmFwaGljcyBQcm9jZXNzaW5nIFVuaXRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkEgdW5pdmVyc2FsIHNldCwgb3IgYSBzZXQgdGhhdCBjb250YWlucyBhbGwgc2V0cywgZXhpc3RzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBBY2UgQXR0b3JuZXkgdHJpbG9neSB3YXMgc3VwcG9zZSB0byBlbmQgd2l0aCAmcXVvdDtQaG9lbml4IFdyaWdodDogQWNlIEF0dG9ybmV5ICZtaW51czsgVHJpYWxzIGFuZCBUcmlidWxhdGlvbnMmcXVvdDsgYXMgaXRzIGZpbmFsIGdhbWUuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBoaWdoZXN0IGJlbHQgeW91IGNhbiBnZXQgaW4gVGFla3dvbmRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJXaGl0ZVwiLFxyXG4gICAgICAgICAgICBcIlJlZFwiLFxyXG4gICAgICAgICAgICBcIkdyZWVuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBVbml0ZWQgU3RhdGVzIERlcGFydG1lbnQgb2YgSG9tZWxhbmQgU2VjdXJpdHkgd2FzIGZvcm1lZCBpbiByZXNwb25zZSB0byB0aGUgU2VwdGVtYmVyIDExdGggYXR0YWNrcy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBcG9sbG8gbWlzc2lvbiB3YXMgdGhlIGxhc3Qgb25lIGluIE5BU0EmIzAzOTtzIEFwb2xsbyBwcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFwb2xsbyAxN1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDEzXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDExXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDE1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBpcyBhbiBleGlzdGluZyBmYW1pbHkgaW4gJnF1b3Q7VGhlIFNpbXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEdvdGggRmFtaWx5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFNpbW9sZW9uIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBQcm91ZCBGYW1pbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSBOdWNsZWFyIFRocm9uZSwgd2hhdCBvcmdhbml6YXRpb24gY2hhc2VzIHRoZSBwbGF5ZXIgY2hhcmFjdGVyIHRocm91Z2hvdXQgdGhlIGdhbWU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEkuRC5QLkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGaXNobWVuXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEJhbmRpdHNcIixcclxuICAgICAgICAgICAgXCJUaGUgWS5WLkcuR1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgJnF1b3Q7Q2F2ZSBTdG9yeSwmcXVvdDsgd2hhdCBpcyB0aGUgY2hhcmFjdGVyIEJhbHJvZyYjMDM5O3MgY2F0Y2hwaHJhc2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSHV6emFoIVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWWVzIVwiLFxyXG4gICAgICAgICAgICBcIldob2EgdGhlcmUhXCIsXHJcbiAgICAgICAgICAgIFwiTnllaCBoZWggaGVoIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJWZWhpY2xlc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9uZSBvZiB0aGVzZSBjaGFzc2lzIGNvZGVzIGFyZSB1c2VkIGJ5IEJNVyAzLXNlcmllcz9cIixcclxuICAgICAgICBcImFcIjogXCJFNDZcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkUzOVwiLFxyXG4gICAgICAgICAgICBcIkU4NVwiLFxyXG4gICAgICAgICAgICBcIkYxMFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDb21pY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB3aGF0IEhvbWVzdHVjayBVcGRhdGUgd2FzIFtTXSBHYW1lIE92ZXIgcmVsZWFzZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiT2N0b2JlciAyNXRoLCAyMDE0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcHJpbCAxM3RoLCAyMDA5XCIsXHJcbiAgICAgICAgICAgIFwiQXByaWwgOHRoLCAyMDEyXCIsXHJcbiAgICAgICAgICAgIFwiQXVndXN0IDI4dGgsIDIwMDNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBiYW5kIG1lbWJlcnMgb2YgQW1lcmljYW4gcm9jayBiYW5kIEtpbmcgb2YgTGVvbj9cIixcclxuICAgICAgICBcImFcIjogXCJCcm90aGVycyAmYW1wOyBjb3VzaW5zXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaGlsZGhvb2QgZnJpZW5kc1wiLFxyXG4gICAgICAgICAgICBcIkZvcm1lciBjbGFzc21hdGVzXCIsXHJcbiAgICAgICAgICAgIFwiRnJhdGVybml0eSBob3VzZSBtZW1iZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBmcmFuY2hpc2UgaGFkIGEgc3BlY2lhbCBldmVudCBob3N0ZWQgaW4gdGhlIHBvcHVsYXIgTU1PUlBHIEZpbmFsIEZhbnRhc3kgWElWOiBBIFJlYWxtIFJlYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCJZby1rYWkgV2F0Y2hcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlBvayZlYWN1dGU7bW9uXCIsXHJcbiAgICAgICAgICAgIFwiWXUtZ2ktb2hcIixcclxuICAgICAgICAgICAgXCJCdWRkeWZpZ2h0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggS2luZ2RvbSBIZWFydHMgZ2FtZSBmZWF0dXJlZCB0aGUgY2FzdCBvZiAmcXVvdDtUaGUgV29ybGQgRW5kcyBXaXRoIFlvdSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEcmVhbSBEcm9wIERpc3RhbmNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCaXJ0aCBCeSBTbGVlcFwiLFxyXG4gICAgICAgICAgICBcIjM2NS8yIERheXNcIixcclxuICAgICAgICAgICAgXCJSZTpDaGFpbiBvZiBNZW1vcmllc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGxhcmdlc3QgcGxhbmV0IGluIEtlcmJhbCBTcGFjZSBQcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkpvb2xcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkVlbG9vXCIsXHJcbiAgICAgICAgICAgIFwiS2VyYm9sXCIsXHJcbiAgICAgICAgICAgIFwiTWlubXVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQW5pbWFsIENyb3NzaW5nIGdhbWUgd2FzIGZvciB0aGUgTmludGVuZG8gV2lpP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFuaW1hbCBDcm9zc2luZzogQ2l0eSBGb2xrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IE5ldyBMZWFmXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBXaWxkIFdvcmxkXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBQb3B1bGF0aW9uIEdyb3dpbmchXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkdlb3JnZSBMdWNhcyBkaXJlY3RlZCB0aGUgZW50aXJlIG9yaWdpbmFsIFN0YXIgV2FycyB0cmlsb2d5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgY2l0eSBvZiBSb21lLCBJdGFseSBmb3VuZGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjc1MyBCQ0VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjkwMiBCQ0VcIixcclxuICAgICAgICAgICAgXCI1MjQgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNjk3IEJDRVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBkYXRhIHN0cnVjdHVyZSBkb2VzIEZJTE8gYXBwbHkgdG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiU3RhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlF1ZXVlXCIsXHJcbiAgICAgICAgICAgIFwiSGVhcFwiLFxyXG4gICAgICAgICAgICBcIlRyZWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gQmF0dGxlc3RhciBHYWxhY3RpY2EgKDIwMDQpLCBDeWxvbnMgd2VyZSBjcmVhdGVkIGJ5IG1hbiBhcyBjeWJlcm5ldGljIHdvcmtlcnMgYW5kIHNvbGRpZXJzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgMjAxNiBEaXNuZXkgYW5pbWF0ZWQgZmlsbSAmIzAzOTtNb2FuYSYjMDM5OyBpcyBiYXNlZCBvbiB3aGljaCBjdWx0dXJlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbHluZXNpYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk5hdGl2ZSBBbWVyaWNhblwiLFxyXG4gICAgICAgICAgICBcIkphcGFuZXNlXCIsXHJcbiAgICAgICAgICAgIFwiTm9yZGljXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2FrZSBkZXBpY3RlZCBpbiBWYWx2ZSYjMDM5O3MgJnF1b3Q7UG9ydGFsJnF1b3Q7IGZyYW5jaGlzZSBtb3N0IGNsb3NlbHkgcmVzZW1ibGVzIHdoaWNoIHJlYWwtd29ybGQgdHlwZSBvZiBjYWtlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrIEZvcmVzdFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRGV2aWwmIzAzOTtzIEZvb2RcIixcclxuICAgICAgICAgICAgXCJNb2x0ZW4gQ2hvY29sYXRlXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFuIENob2NvbGF0ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlICYgTmF0dXJlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2hlbWljYWwgZWxlbWVudCBMaXRoaXVtIGlzIG5hbWVkIGFmdGVyIHRoZSBjb3VudHJ5IG9mIExpdGh1YW5pYS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBHYWRnZXRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIERWRCBpbnZlbnRlZD9cIixcclxuICAgICAgICBcImFcIjogXCIxOTk1XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMDAwXCIsXHJcbiAgICAgICAgICAgIFwiMTk5MFwiLFxyXG4gICAgICAgICAgICBcIjE5ODBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgZnVsbCBuYW1lIG9mIHRoZSBmb290YmFsbGVyICZxdW90O0NyaXN0aWFubyBSb25hbGRvJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNyaXN0aWFubyBSb25hbGRvIGRvcyBTYW50b3MgQXZlaXJvXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gUm9uYWxkbyBsb3MgU2FudG9zIERpZWdvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEFybWFuZG8gRGllZ28gUm9uYWxkb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBMdWlzIEFybWFuZG8gUm9uYWxkb1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlc2UgdHdvIGNvdW50cmllcyBoZWxkIGEgY29tbW9ud2VhbHRoIGZyb20gdGhlIDE2dGggdG8gMTh0aCBjZW50dXJ5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbGFuZCBhbmQgTGl0aHVhbmlhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIdXR1IGFuZCBSd2FuZGFcIixcclxuICAgICAgICAgICAgXCJOb3J0aCBLb3JlYSBhbmQgU291dGggS29yZWFcIixcclxuICAgICAgICAgICAgXCJCYW5nbGFkZXNoIGFuZCBCaHV0YW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0NhbGwgT2YgRHV0eTogWm9tYmllcyZxdW90OywgY29tcGxldGluZyB3aGljaCBtYXAmIzAzOTtzIG1haW4gZWFzdGVyIGVnZyB3aWxsIHJld2FyZCB5b3Ugd2l0aCB0aGUgYWNoaWV2ZW1lbnQsICZxdW90O0hpZ2ggTWFpbnRlbmFuY2UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRGllIFJpc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1vYiBPZiBUaGUgRGVhZFwiLFxyXG4gICAgICAgICAgICBcIk9yaWdpbnNcIixcclxuICAgICAgICAgICAgXCJBc2NlbnNpb25cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ2FydG9vbiAmIEFuaW1hdGlvbnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtHcmF2aXR5IEZhbGxzJnF1b3Q7LCBob3cgbXVjaCBkb2VzIFdhZGRsZXMgd2VpZ2ggd2hlbiBNYWJsZSB3aW5zIGhpbSBpbiAmcXVvdDtUaGUgVGltZSBUcmF2ZWxlciYjMDM5O3MgUGlnJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE1IHBvdW5kc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMTAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMzAgcG91bmRzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgZ2l2ZW4gdG8gbGF5ZXIgNCBvZiB0aGUgT3BlbiBTeXN0ZW1zIEludGVyY29ubmVjdGlvbiAoSVNPKSBtb2RlbD9cIixcclxuICAgICAgICBcImFcIjogXCJUcmFuc3BvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlNlc3Npb25cIixcclxuICAgICAgICAgICAgXCJEYXRhIGxpbmtcIixcclxuICAgICAgICAgICAgXCJOZXR3b3JrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCB5ZWFyIHdhcyBob2NrZXkgbGVnZW5kIFdheW5lIEdyZXR6a3kgYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCIxOTYxXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIxOTY1XCIsXHJcbiAgICAgICAgICAgIFwiMTk1OVwiLFxyXG4gICAgICAgICAgICBcIjE5NjNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkhvdyBtYW55IGdhbWVzIGFyZSB0aGVyZSBpbiB0aGUgJnF1b3Q7Q29sb255IFdhcnMmcXVvdDsgc2VyaWVzIGZvciB0aGUgUGxheVN0YXRpb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiM1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMlwiLFxyXG4gICAgICAgICAgICBcIjRcIixcclxuICAgICAgICAgICAgXCI1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gV29ybGQgb2YgV2FyY3JhZnQsIHdoaWNoIHJhaWQgaW5zdGFuY2UgZmVhdHVyZXMgYSBjaGVzcyBldmVudD9cIixcclxuICAgICAgICBcImFcIjogXCJLYXJhemhhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWnVsJiMwMzk7QW1hblwiLFxyXG4gICAgICAgICAgICBcIkJsYWNrd2luZyBMYWlyXCIsXHJcbiAgICAgICAgICAgIFwiVGVtcGxlIG9mIEFobiYjMDM5O1FpcmFqXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBjb3VudHJ5IHdhcyBKb3NlZiBTdGFsaW4gYm9ybiBpbj9cIixcclxuICAgICAgICBcImFcIjogXCJHZW9yZ2lhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSdXNzaWFcIixcclxuICAgICAgICAgICAgXCJHZXJtYW55XCIsXHJcbiAgICAgICAgICAgIFwiUG9sYW5kXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgb2ZmaWNpYWwgbmFtZSBvZiBQcmluY2UmIzAzOTtzIGJhY2tpbmcgYmFuZD9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgUmV2b2x1dGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIFBhdXBlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgV2FpbGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBIZWFydGJyZWFrZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEdhbWUgb2YgVGhyb25lcyB3aGF0IGlzIHRoZSBuYW1lIG9mIEpvbiBTbm93JiMwMzk7cyBzd29yZD9cIixcclxuICAgICAgICBcImFcIjogXCJMb25nY2xhd1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiT2F0aGtlZXBlclwiLFxyXG4gICAgICAgICAgICBcIldpZG93JiMwMzk7cyBXYWlsXCIsXHJcbiAgICAgICAgICAgIFwiTmVlZGxlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGluc3BlY3RvciBpbiB0aGUgc2VyaWVzICZxdW90O09uIHRoZSBCdXNlcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFrZXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcnBlclwiLFxyXG4gICAgICAgICAgICBcIk5haWx5XCIsXHJcbiAgICAgICAgICAgIFwiR2FsbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGFydGlzdCBjdXJhdGVkIHRoZSBvZmZpY2lhbCBzb3VuZHRyYWNrIGZvciAmcXVvdDtUaGUgSHVuZ2VyIEdhbWVzOiBNb2NraW5namF5IC0gUGFydCAxJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvcmRlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJLYW55ZSBXZXN0XCIsXHJcbiAgICAgICAgICAgIFwiVG92ZSBMb1wiLFxyXG4gICAgICAgICAgICBcIkNoYXJsaSBYQ1hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQ2FuYWRpYW4gJDEgY29pbiBpcyBjb2xsb3F1aWFsbHkga25vd24gYXMgYSB3aGF0P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvb25pZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiRm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiTW9vZGllXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZXNlIGZvdW5kaW5nIGZhdGhlcnMgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgb2YgQW1lcmljYSBsYXRlciBiZWNhbWUgcHJlc2lkZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkphbWVzIE1vbnJvZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQWxleGFuZGVyIEhhbWlsdG9uXCIsXHJcbiAgICAgICAgICAgIFwiU2FtdWVsIEFkYW1zXCIsXHJcbiAgICAgICAgICAgIFwiUm9nZXIgU2hlcm1hblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIERpdmluaXR5OiBPcmlnaW5hbCBTaW4gSUksIHdoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXI/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFuZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTG9oc2VcIixcclxuICAgICAgICAgICAgXCJUaGUgUmVkIFByaW5jZVwiLFxyXG4gICAgICAgICAgICBcIlRoZXJlIGFyZSBubyBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldobyBpcyB0aGUgbWFpbiBwcm90YWdvbmlzdCBpbiB0aGUgZ2FtZSBMaWZlIGlzIFN0cmFuZ2U6IEJlZm9yZSBUaGUgU3Rvcm0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ2hsb2UgUHJpY2UgXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNYXggQ2F1bGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiUmFjaGVsIEFtYmVyXCIsXHJcbiAgICAgICAgICAgIFwiRnJhbmsgQm93ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkpvaG5ueSBEZXBwIG1hZGUgaGlzIGJpZy1zY3JlZW4gYWN0aW5nIGRlYnV0IGluIHdoaWNoIGZpbG0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQSBOaWdodG1hcmUgb24gRWxtIFN0cmVldFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTXkgQmxvb2R5IFZhbGVudGluZVwiLFxyXG4gICAgICAgICAgICBcIkhhbGxvd2VlblwiLFxyXG4gICAgICAgICAgICBcIkZyaWRheSB0aGUgMTN0aFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtSZXNpZGVudCBFdmlsJnF1b3Q7LCBvbmx5IENocmlzIGhhcyBhY2Nlc3MgdG8gdGhlIGdyZW5hZGUgbGF1bmNoZXIuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVycyBpcyBOT1QgcGxheWFibGUgaW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCA2JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkppbGwgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaHJpcyBSZWRmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlNoZXJyeSBCaXJraW5cIixcclxuICAgICAgICAgICAgXCJIZWxlbmEgSGFycGVyXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEphcGFuZXNlIEFuaW1lICYgTWFuZ2FcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSAxOTg4IGZpbG0gJnF1b3Q7QWtpcmEmcXVvdDssIFRldHN1byBlbmRzIHVwIGRlc3Ryb3lpbmcgVG9reW8uXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VvZ3JhcGh5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGJvZHkgb2YgdGhlIEVneXB0aWFuIFNwaGlueCB3YXMgYmFzZWQgb24gd2hpY2ggYW5pbWFsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJ1bGxcIixcclxuICAgICAgICAgICAgXCJIb3JzZVwiLFxyXG4gICAgICAgICAgICBcIkRvZ1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiByZWxhdGlvbiB0byB0aGUgQnJpdGlzaCBPY2N1cGF0aW9uIGluIElyZWxhbmQsIHdoYXQgZG9lcyB0aGUgSVJBIHN0YW5kIGZvci5cIixcclxuICAgICAgICBcImFcIjogXCJJcmlzaCBSZXB1YmxpY2FuIEFybXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIklyaXNoIFJlYmVsIEFsbGlhbmNlXCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmVmb3JtYXRpb24gQXJteVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoLVJveWFsIEFsbGlhbmNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHJvYm90IGluIHRoZSAxOTUxIHNjaWVuY2UgZmljdGlvbiBmaWxtIGNsYXNzaWMgJiMwMzk7VGhlIERheSB0aGUgRWFydGggU3Rvb2QgU3RpbGwmIzAzOTs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR29ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUm9iYnlcIixcclxuICAgICAgICAgICAgXCJDb2xvc3N1c1wiLFxyXG4gICAgICAgICAgICBcIkJveFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgUm9tYW4gbnVtZXJhbCBmb3IgNTAwP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxcIixcclxuICAgICAgICAgICAgXCJDXCIsXHJcbiAgICAgICAgICAgIFwiWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIG1haW4gaGVhbGluZyBpdGVtIGluIERhcmsgU291bHM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRXN0dXMgRmxhc2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhlYWx0aCBQb3Rpb25cIixcclxuICAgICAgICAgICAgXCJPcmFuZ2UgSnVpY2VcIixcclxuICAgICAgICAgICAgXCJBc2hlbiBGbGFza1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIk9uIHdoaWNoIGNvbXB1dGVyIGhhcmR3YXJlIGRldmljZSBpcyB0aGUgQklPUyBjaGlwIGxvY2F0ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTW90aGVyYm9hcmRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcmQgRGlzayBEcml2ZVwiLFxyXG4gICAgICAgICAgICBcIkNlbnRyYWwgUHJvY2Vzc2luZyBVbml0XCIsXHJcbiAgICAgICAgICAgIFwiR3JhcGhpY3MgUHJvY2Vzc2luZyBVbml0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJBIHVuaXZlcnNhbCBzZXQsIG9yIGEgc2V0IHRoYXQgY29udGFpbnMgYWxsIHNldHMsIGV4aXN0cy5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQWNlIEF0dG9ybmV5IHRyaWxvZ3kgd2FzIHN1cHBvc2UgdG8gZW5kIHdpdGggJnF1b3Q7UGhvZW5peCBXcmlnaHQ6IEFjZSBBdHRvcm5leSAmbWludXM7IFRyaWFscyBhbmQgVHJpYnVsYXRpb25zJnF1b3Q7IGFzIGl0cyBmaW5hbCBnYW1lLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgaGlnaGVzdCBiZWx0IHlvdSBjYW4gZ2V0IGluIFRhZWt3b25kbz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiV2hpdGVcIixcclxuICAgICAgICAgICAgXCJSZWRcIixcclxuICAgICAgICAgICAgXCJHcmVlblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgVW5pdGVkIFN0YXRlcyBEZXBhcnRtZW50IG9mIEhvbWVsYW5kIFNlY3VyaXR5IHdhcyBmb3JtZWQgaW4gcmVzcG9uc2UgdG8gdGhlIFNlcHRlbWJlciAxMXRoIGF0dGFja3MuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQXBvbGxvIG1pc3Npb24gd2FzIHRoZSBsYXN0IG9uZSBpbiBOQVNBJiMwMzk7cyBBcG9sbG8gcHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJBcG9sbG8gMTdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwb2xsbyAxM1wiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxMVwiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgaXMgYW4gZXhpc3RpbmcgZmFtaWx5IGluICZxdW90O1RoZSBTaW1zJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBHb3RoIEZhbWlseVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBTaW1vbGVvbiBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgUHJvdWQgRmFtaWx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgTnVjbGVhciBUaHJvbmUsIHdoYXQgb3JnYW5pemF0aW9uIGNoYXNlcyB0aGUgcGxheWVyIGNoYXJhY3RlciB0aHJvdWdob3V0IHRoZSBnYW1lP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBJLkQuUC5EXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmlzaG1lblwiLFxyXG4gICAgICAgICAgICBcIlRoZSBCYW5kaXRzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFkuVi5HLkdcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lICZxdW90O0NhdmUgU3RvcnksJnF1b3Q7IHdoYXQgaXMgdGhlIGNoYXJhY3RlciBCYWxyb2cmIzAzOTtzIGNhdGNocGhyYXNlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkh1enphaCFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlllcyFcIixcclxuICAgICAgICAgICAgXCJXaG9hIHRoZXJlIVwiLFxyXG4gICAgICAgICAgICBcIk55ZWggaGVoIGhlaCFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiVmVoaWNsZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvbmUgb2YgdGhlc2UgY2hhc3NpcyBjb2RlcyBhcmUgdXNlZCBieSBCTVcgMy1zZXJpZXM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRTQ2XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFMzlcIixcclxuICAgICAgICAgICAgXCJFODVcIixcclxuICAgICAgICAgICAgXCJGMTBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ29taWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gd2hhdCBIb21lc3R1Y2sgVXBkYXRlIHdhcyBbU10gR2FtZSBPdmVyIHJlbGVhc2VkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk9jdG9iZXIgMjV0aCwgMjAxNFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXByaWwgMTN0aCwgMjAwOVwiLFxyXG4gICAgICAgICAgICBcIkFwcmlsIDh0aCwgMjAxMlwiLFxyXG4gICAgICAgICAgICBcIkF1Z3VzdCAyOHRoLCAyMDAzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgYmFuZCBtZW1iZXJzIG9mIEFtZXJpY2FuIHJvY2sgYmFuZCBLaW5nIG9mIExlb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQnJvdGhlcnMgJmFtcDsgY291c2luc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hpbGRob29kIGZyaWVuZHNcIixcclxuICAgICAgICAgICAgXCJGb3JtZXIgY2xhc3NtYXRlc1wiLFxyXG4gICAgICAgICAgICBcIkZyYXRlcm5pdHkgaG91c2UgbWVtYmVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZnJhbmNoaXNlIGhhZCBhIHNwZWNpYWwgZXZlbnQgaG9zdGVkIGluIHRoZSBwb3B1bGFyIE1NT1JQRyBGaW5hbCBGYW50YXN5IFhJVjogQSBSZWFsbSBSZWJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiWW8ta2FpIFdhdGNoXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJQb2smZWFjdXRlO21vblwiLFxyXG4gICAgICAgICAgICBcIll1LWdpLW9oXCIsXHJcbiAgICAgICAgICAgIFwiQnVkZHlmaWdodFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEtpbmdkb20gSGVhcnRzIGdhbWUgZmVhdHVyZWQgdGhlIGNhc3Qgb2YgJnF1b3Q7VGhlIFdvcmxkIEVuZHMgV2l0aCBZb3UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRHJlYW0gRHJvcCBEaXN0YW5jZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQmlydGggQnkgU2xlZXBcIixcclxuICAgICAgICAgICAgXCIzNjUvMiBEYXlzXCIsXHJcbiAgICAgICAgICAgIFwiUmU6Q2hhaW4gb2YgTWVtb3JpZXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBsYXJnZXN0IHBsYW5ldCBpbiBLZXJiYWwgU3BhY2UgUHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJKb29sXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFZWxvb1wiLFxyXG4gICAgICAgICAgICBcIktlcmJvbFwiLFxyXG4gICAgICAgICAgICBcIk1pbm11c1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFuaW1hbCBDcm9zc2luZyBnYW1lIHdhcyBmb3IgdGhlIE5pbnRlbmRvIFdpaT9cIixcclxuICAgICAgICBcImFcIjogXCJBbmltYWwgQ3Jvc3Npbmc6IENpdHkgRm9sa1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBOZXcgTGVhZlwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogV2lsZCBXb3JsZFwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogUG9wdWxhdGlvbiBHcm93aW5nIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJHZW9yZ2UgTHVjYXMgZGlyZWN0ZWQgdGhlIGVudGlyZSBvcmlnaW5hbCBTdGFyIFdhcnMgdHJpbG9neS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIGNpdHkgb2YgUm9tZSwgSXRhbHkgZm91bmRlZD9cIixcclxuICAgICAgICBcImFcIjogXCI3NTMgQkNFXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCI5MDIgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNTI0IEJDRVwiLFxyXG4gICAgICAgICAgICBcIjY5NyBCQ0VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZGF0YSBzdHJ1Y3R1cmUgZG9lcyBGSUxPIGFwcGx5IHRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlN0YWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJRdWV1ZVwiLFxyXG4gICAgICAgICAgICBcIkhlYXBcIixcclxuICAgICAgICAgICAgXCJUcmVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEJhdHRsZXN0YXIgR2FsYWN0aWNhICgyMDA0KSwgQ3lsb25zIHdlcmUgY3JlYXRlZCBieSBtYW4gYXMgY3liZXJuZXRpYyB3b3JrZXJzIGFuZCBzb2xkaWVycy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIDIwMTYgRGlzbmV5IGFuaW1hdGVkIGZpbG0gJiMwMzk7TW9hbmEmIzAzOTsgaXMgYmFzZWQgb24gd2hpY2ggY3VsdHVyZT9cIixcclxuICAgICAgICBcImFcIjogXCJQb2x5bmVzaWFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJOYXRpdmUgQW1lcmljYW5cIixcclxuICAgICAgICAgICAgXCJKYXBhbmVzZVwiLFxyXG4gICAgICAgICAgICBcIk5vcmRpY1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNha2UgZGVwaWN0ZWQgaW4gVmFsdmUmIzAzOTtzICZxdW90O1BvcnRhbCZxdW90OyBmcmFuY2hpc2UgbW9zdCBjbG9zZWx5IHJlc2VtYmxlcyB3aGljaCByZWFsLXdvcmxkIHR5cGUgb2YgY2FrZT9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFjayBGb3Jlc3RcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkRldmlsJiMwMzk7cyBGb29kXCIsXHJcbiAgICAgICAgICAgIFwiTW9sdGVuIENob2NvbGF0ZVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbiBDaG9jb2xhdGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZSAmIE5hdHVyZVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNoZW1pY2FsIGVsZW1lbnQgTGl0aGl1bSBpcyBuYW1lZCBhZnRlciB0aGUgY291bnRyeSBvZiBMaXRodWFuaWEuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogR2FkZ2V0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBEVkQgaW52ZW50ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk5NVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAwMFwiLFxyXG4gICAgICAgICAgICBcIjE5OTBcIixcclxuICAgICAgICAgICAgXCIxOTgwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGZ1bGwgbmFtZSBvZiB0aGUgZm9vdGJhbGxlciAmcXVvdDtDcmlzdGlhbm8gUm9uYWxkbyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJDcmlzdGlhbm8gUm9uYWxkbyBkb3MgU2FudG9zIEF2ZWlyb1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIFJvbmFsZG8gbG9zIFNhbnRvcyBEaWVnb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBBcm1hbmRvIERpZWdvIFJvbmFsZG9cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gTHVpcyBBcm1hbmRvIFJvbmFsZG9cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZXNlIHR3byBjb3VudHJpZXMgaGVsZCBhIGNvbW1vbndlYWx0aCBmcm9tIHRoZSAxNnRoIHRvIDE4dGggY2VudHVyeS5cIixcclxuICAgICAgICBcImFcIjogXCJQb2xhbmQgYW5kIExpdGh1YW5pYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSHV0dSBhbmQgUndhbmRhXCIsXHJcbiAgICAgICAgICAgIFwiTm9ydGggS29yZWEgYW5kIFNvdXRoIEtvcmVhXCIsXHJcbiAgICAgICAgICAgIFwiQmFuZ2xhZGVzaCBhbmQgQmh1dGFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtDYWxsIE9mIER1dHk6IFpvbWJpZXMmcXVvdDssIGNvbXBsZXRpbmcgd2hpY2ggbWFwJiMwMzk7cyBtYWluIGVhc3RlciBlZ2cgd2lsbCByZXdhcmQgeW91IHdpdGggdGhlIGFjaGlldmVtZW50LCAmcXVvdDtIaWdoIE1haW50ZW5hbmNlJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRpZSBSaXNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNb2IgT2YgVGhlIERlYWRcIixcclxuICAgICAgICAgICAgXCJPcmlnaW5zXCIsXHJcbiAgICAgICAgICAgIFwiQXNjZW5zaW9uXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENhcnRvb24gJiBBbmltYXRpb25zXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7R3Jhdml0eSBGYWxscyZxdW90OywgaG93IG11Y2ggZG9lcyBXYWRkbGVzIHdlaWdoIHdoZW4gTWFibGUgd2lucyBoaW0gaW4gJnF1b3Q7VGhlIFRpbWUgVHJhdmVsZXImIzAzOTtzIFBpZyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCIxNSBwb3VuZHNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjEwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjMwIHBvdW5kc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIGdpdmVuIHRvIGxheWVyIDQgb2YgdGhlIE9wZW4gU3lzdGVtcyBJbnRlcmNvbm5lY3Rpb24gKElTTykgbW9kZWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJhbnNwb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJTZXNzaW9uXCIsXHJcbiAgICAgICAgICAgIFwiRGF0YSBsaW5rXCIsXHJcbiAgICAgICAgICAgIFwiTmV0d29ya1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgeWVhciB3YXMgaG9ja2V5IGxlZ2VuZCBXYXluZSBHcmV0emt5IGJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk2MVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMTk2NVwiLFxyXG4gICAgICAgICAgICBcIjE5NTlcIixcclxuICAgICAgICAgICAgXCIxOTYzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJIb3cgbWFueSBnYW1lcyBhcmUgdGhlcmUgaW4gdGhlICZxdW90O0NvbG9ueSBXYXJzJnF1b3Q7IHNlcmllcyBmb3IgdGhlIFBsYXlTdGF0aW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjJcIixcclxuICAgICAgICAgICAgXCI0XCIsXHJcbiAgICAgICAgICAgIFwiNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIFdvcmxkIG9mIFdhcmNyYWZ0LCB3aGljaCByYWlkIGluc3RhbmNlIGZlYXR1cmVzIGEgY2hlc3MgZXZlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiS2FyYXpoYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlp1bCYjMDM5O0FtYW5cIixcclxuICAgICAgICAgICAgXCJCbGFja3dpbmcgTGFpclwiLFxyXG4gICAgICAgICAgICBcIlRlbXBsZSBvZiBBaG4mIzAzOTtRaXJhalwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggY291bnRyeSB3YXMgSm9zZWYgU3RhbGluIGJvcm4gaW4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR2VvcmdpYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUnVzc2lhXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFueVwiLFxyXG4gICAgICAgICAgICBcIlBvbGFuZFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG9mZmljaWFsIG5hbWUgb2YgUHJpbmNlJiMwMzk7cyBiYWNraW5nIGJhbmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIFJldm9sdXRpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBQYXVwZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFdhaWxlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgSGVhcnRicmVha2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiBHYW1lIG9mIFRocm9uZXMgd2hhdCBpcyB0aGUgbmFtZSBvZiBKb24gU25vdyYjMDM5O3Mgc3dvcmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9uZ2NsYXdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk9hdGhrZWVwZXJcIixcclxuICAgICAgICAgICAgXCJXaWRvdyYjMDM5O3MgV2FpbFwiLFxyXG4gICAgICAgICAgICBcIk5lZWRsZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBpbnNwZWN0b3IgaW4gdGhlIHNlcmllcyAmcXVvdDtPbiB0aGUgQnVzZXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxha2V5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJwZXJcIixcclxuICAgICAgICAgICAgXCJOYWlseVwiLFxyXG4gICAgICAgICAgICBcIkdhbGx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBhcnRpc3QgY3VyYXRlZCB0aGUgb2ZmaWNpYWwgc291bmR0cmFjayBmb3IgJnF1b3Q7VGhlIEh1bmdlciBHYW1lczogTW9ja2luZ2pheSAtIFBhcnQgMSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJMb3JkZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiS2FueWUgV2VzdFwiLFxyXG4gICAgICAgICAgICBcIlRvdmUgTG9cIixcclxuICAgICAgICAgICAgXCJDaGFybGkgWENYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIENhbmFkaWFuICQxIGNvaW4gaXMgY29sbG9xdWlhbGx5IGtub3duIGFzIGEgd2hhdD9cIixcclxuICAgICAgICBcImFcIjogXCJMb29uaWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIkZvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIk1vb2RpZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGVzZSBmb3VuZGluZyBmYXRoZXJzIG9mIHRoZSBVbml0ZWQgU3RhdGVzIG9mIEFtZXJpY2EgbGF0ZXIgYmVjYW1lIHByZXNpZGVudD9cIixcclxuICAgICAgICBcImFcIjogXCJKYW1lcyBNb25yb2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFsZXhhbmRlciBIYW1pbHRvblwiLFxyXG4gICAgICAgICAgICBcIlNhbXVlbCBBZGFtc1wiLFxyXG4gICAgICAgICAgICBcIlJvZ2VyIFNoZXJtYW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBEaXZpbml0eTogT3JpZ2luYWwgU2luIElJLCB3aGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxvaHNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFJlZCBQcmluY2VcIixcclxuICAgICAgICAgICAgXCJUaGVyZSBhcmUgbm8gc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3RlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaG8gaXMgdGhlIG1haW4gcHJvdGFnb25pc3QgaW4gdGhlIGdhbWUgTGlmZSBpcyBTdHJhbmdlOiBCZWZvcmUgVGhlIFN0b3JtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNobG9lIFByaWNlIFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTWF4IENhdWxmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlJhY2hlbCBBbWJlclwiLFxyXG4gICAgICAgICAgICBcIkZyYW5rIEJvd2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJKb2hubnkgRGVwcCBtYWRlIGhpcyBiaWctc2NyZWVuIGFjdGluZyBkZWJ1dCBpbiB3aGljaCBmaWxtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkEgTmlnaHRtYXJlIG9uIEVsbSBTdHJlZXRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk15IEJsb29keSBWYWxlbnRpbmVcIixcclxuICAgICAgICAgICAgXCJIYWxsb3dlZW5cIixcclxuICAgICAgICAgICAgXCJGcmlkYXkgdGhlIDEzdGhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCZxdW90Oywgb25seSBDaHJpcyBoYXMgYWNjZXNzIHRvIHRoZSBncmVuYWRlIGxhdW5jaGVyLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcnMgaXMgTk9UIHBsYXlhYmxlIGluICZxdW90O1Jlc2lkZW50IEV2aWwgNiZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJKaWxsIFZhbGVudGluZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hyaXMgUmVkZmllbGRcIixcclxuICAgICAgICAgICAgXCJTaGVycnkgQmlya2luXCIsXHJcbiAgICAgICAgICAgIFwiSGVsZW5hIEhhcnBlclwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBKYXBhbmVzZSBBbmltZSAmIE1hbmdhXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgMTk4OCBmaWxtICZxdW90O0FraXJhJnF1b3Q7LCBUZXRzdW8gZW5kcyB1cCBkZXN0cm95aW5nIFRva3lvLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlb2dyYXBoeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBib2R5IG9mIHRoZSBFZ3lwdGlhbiBTcGhpbnggd2FzIGJhc2VkIG9uIHdoaWNoIGFuaW1hbD9cIixcclxuICAgICAgICBcImFcIjogXCJMaW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCdWxsXCIsXHJcbiAgICAgICAgICAgIFwiSG9yc2VcIixcclxuICAgICAgICAgICAgXCJEb2dcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gcmVsYXRpb24gdG8gdGhlIEJyaXRpc2ggT2NjdXBhdGlvbiBpbiBJcmVsYW5kLCB3aGF0IGRvZXMgdGhlIElSQSBzdGFuZCBmb3IuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSXJpc2ggUmVwdWJsaWNhbiBBcm15XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWJlbCBBbGxpYW5jZVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoIFJlZm9ybWF0aW9uIEFybXlcIixcclxuICAgICAgICAgICAgXCJJcmlzaC1Sb3lhbCBBbGxpYW5jZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSByb2JvdCBpbiB0aGUgMTk1MSBzY2llbmNlIGZpY3Rpb24gZmlsbSBjbGFzc2ljICYjMDM5O1RoZSBEYXkgdGhlIEVhcnRoIFN0b29kIFN0aWxsJiMwMzk7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJvYmJ5XCIsXHJcbiAgICAgICAgICAgIFwiQ29sb3NzdXNcIixcclxuICAgICAgICAgICAgXCJCb3hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIFJvbWFuIG51bWVyYWwgZm9yIDUwMD9cIixcclxuICAgICAgICBcImFcIjogXCJEXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMXCIsXHJcbiAgICAgICAgICAgIFwiQ1wiLFxyXG4gICAgICAgICAgICBcIlhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBtYWluIGhlYWxpbmcgaXRlbSBpbiBEYXJrIFNvdWxzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkVzdHVzIEZsYXNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIZWFsdGggUG90aW9uXCIsXHJcbiAgICAgICAgICAgIFwiT3JhbmdlIEp1aWNlXCIsXHJcbiAgICAgICAgICAgIFwiQXNoZW4gRmxhc2tcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJPbiB3aGljaCBjb21wdXRlciBoYXJkd2FyZSBkZXZpY2UgaXMgdGhlIEJJT1MgY2hpcCBsb2NhdGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk1vdGhlcmJvYXJkXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJkIERpc2sgRHJpdmVcIixcclxuICAgICAgICAgICAgXCJDZW50cmFsIFByb2Nlc3NpbmcgVW5pdFwiLFxyXG4gICAgICAgICAgICBcIkdyYXBoaWNzIFByb2Nlc3NpbmcgVW5pdFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiQSB1bml2ZXJzYWwgc2V0LCBvciBhIHNldCB0aGF0IGNvbnRhaW5zIGFsbCBzZXRzLCBleGlzdHMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIEFjZSBBdHRvcm5leSB0cmlsb2d5IHdhcyBzdXBwb3NlIHRvIGVuZCB3aXRoICZxdW90O1Bob2VuaXggV3JpZ2h0OiBBY2UgQXR0b3JuZXkgJm1pbnVzOyBUcmlhbHMgYW5kIFRyaWJ1bGF0aW9ucyZxdW90OyBhcyBpdHMgZmluYWwgZ2FtZS5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGhpZ2hlc3QgYmVsdCB5b3UgY2FuIGdldCBpbiBUYWVrd29uZG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIldoaXRlXCIsXHJcbiAgICAgICAgICAgIFwiUmVkXCIsXHJcbiAgICAgICAgICAgIFwiR3JlZW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIFVuaXRlZCBTdGF0ZXMgRGVwYXJ0bWVudCBvZiBIb21lbGFuZCBTZWN1cml0eSB3YXMgZm9ybWVkIGluIHJlc3BvbnNlIHRvIHRoZSBTZXB0ZW1iZXIgMTF0aCBhdHRhY2tzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFwb2xsbyBtaXNzaW9uIHdhcyB0aGUgbGFzdCBvbmUgaW4gTkFTQSYjMDM5O3MgQXBvbGxvIHByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQXBvbGxvIDE3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTNcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTFcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGlzIGFuIGV4aXN0aW5nIGZhbWlseSBpbiAmcXVvdDtUaGUgU2ltcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgR290aCBGYW1pbHlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgU2ltb2xlb24gRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFByb3VkIEZhbWlseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lIE51Y2xlYXIgVGhyb25lLCB3aGF0IG9yZ2FuaXphdGlvbiBjaGFzZXMgdGhlIHBsYXllciBjaGFyYWN0ZXIgdGhyb3VnaG91dCB0aGUgZ2FtZT9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgSS5ELlAuRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZpc2htZW5cIixcclxuICAgICAgICAgICAgXCJUaGUgQmFuZGl0c1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBZLlYuRy5HXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSAmcXVvdDtDYXZlIFN0b3J5LCZxdW90OyB3aGF0IGlzIHRoZSBjaGFyYWN0ZXIgQmFscm9nJiMwMzk7cyBjYXRjaHBocmFzZT9cIixcclxuICAgICAgICBcImFcIjogXCJIdXp6YWghXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJZZXMhXCIsXHJcbiAgICAgICAgICAgIFwiV2hvYSB0aGVyZSFcIixcclxuICAgICAgICAgICAgXCJOeWVoIGhlaCBoZWghXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlZlaGljbGVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb25lIG9mIHRoZXNlIGNoYXNzaXMgY29kZXMgYXJlIHVzZWQgYnkgQk1XIDMtc2VyaWVzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkU0NlwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRTM5XCIsXHJcbiAgICAgICAgICAgIFwiRTg1XCIsXHJcbiAgICAgICAgICAgIFwiRjEwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENvbWljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHdoYXQgSG9tZXN0dWNrIFVwZGF0ZSB3YXMgW1NdIEdhbWUgT3ZlciByZWxlYXNlZD9cIixcclxuICAgICAgICBcImFcIjogXCJPY3RvYmVyIDI1dGgsIDIwMTRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwcmlsIDEzdGgsIDIwMDlcIixcclxuICAgICAgICAgICAgXCJBcHJpbCA4dGgsIDIwMTJcIixcclxuICAgICAgICAgICAgXCJBdWd1c3QgMjh0aCwgMjAwM1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIGJhbmQgbWVtYmVycyBvZiBBbWVyaWNhbiByb2NrIGJhbmQgS2luZyBvZiBMZW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJyb3RoZXJzICZhbXA7IGNvdXNpbnNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNoaWxkaG9vZCBmcmllbmRzXCIsXHJcbiAgICAgICAgICAgIFwiRm9ybWVyIGNsYXNzbWF0ZXNcIixcclxuICAgICAgICAgICAgXCJGcmF0ZXJuaXR5IGhvdXNlIG1lbWJlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGZyYW5jaGlzZSBoYWQgYSBzcGVjaWFsIGV2ZW50IGhvc3RlZCBpbiB0aGUgcG9wdWxhciBNTU9SUEcgRmluYWwgRmFudGFzeSBYSVY6IEEgUmVhbG0gUmVib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIllvLWthaSBXYXRjaFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUG9rJmVhY3V0ZTttb25cIixcclxuICAgICAgICAgICAgXCJZdS1naS1vaFwiLFxyXG4gICAgICAgICAgICBcIkJ1ZGR5ZmlnaHRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBLaW5nZG9tIEhlYXJ0cyBnYW1lIGZlYXR1cmVkIHRoZSBjYXN0IG9mICZxdW90O1RoZSBXb3JsZCBFbmRzIFdpdGggWW91JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRyZWFtIERyb3AgRGlzdGFuY2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJpcnRoIEJ5IFNsZWVwXCIsXHJcbiAgICAgICAgICAgIFwiMzY1LzIgRGF5c1wiLFxyXG4gICAgICAgICAgICBcIlJlOkNoYWluIG9mIE1lbW9yaWVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbGFyZ2VzdCBwbGFuZXQgaW4gS2VyYmFsIFNwYWNlIFByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSm9vbFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRWVsb29cIixcclxuICAgICAgICAgICAgXCJLZXJib2xcIixcclxuICAgICAgICAgICAgXCJNaW5tdXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBbmltYWwgQ3Jvc3NpbmcgZ2FtZSB3YXMgZm9yIHRoZSBOaW50ZW5kbyBXaWk/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQW5pbWFsIENyb3NzaW5nOiBDaXR5IEZvbGtcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogTmV3IExlYWZcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFdpbGQgV29ybGRcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFBvcHVsYXRpb24gR3Jvd2luZyFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiR2VvcmdlIEx1Y2FzIGRpcmVjdGVkIHRoZSBlbnRpcmUgb3JpZ2luYWwgU3RhciBXYXJzIHRyaWxvZ3kuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBjaXR5IG9mIFJvbWUsIEl0YWx5IGZvdW5kZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiNzUzIEJDRVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiOTAyIEJDRVwiLFxyXG4gICAgICAgICAgICBcIjUyNCBCQ0VcIixcclxuICAgICAgICAgICAgXCI2OTcgQkNFXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGRhdGEgc3RydWN0dXJlIGRvZXMgRklMTyBhcHBseSB0bz9cIixcclxuICAgICAgICBcImFcIjogXCJTdGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUXVldWVcIixcclxuICAgICAgICAgICAgXCJIZWFwXCIsXHJcbiAgICAgICAgICAgIFwiVHJlZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBCYXR0bGVzdGFyIEdhbGFjdGljYSAoMjAwNCksIEN5bG9ucyB3ZXJlIGNyZWF0ZWQgYnkgbWFuIGFzIGN5YmVybmV0aWMgd29ya2VycyBhbmQgc29sZGllcnMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSAyMDE2IERpc25leSBhbmltYXRlZCBmaWxtICYjMDM5O01vYW5hJiMwMzk7IGlzIGJhc2VkIG9uIHdoaWNoIGN1bHR1cmU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9seW5lc2lhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTmF0aXZlIEFtZXJpY2FuXCIsXHJcbiAgICAgICAgICAgIFwiSmFwYW5lc2VcIixcclxuICAgICAgICAgICAgXCJOb3JkaWNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjYWtlIGRlcGljdGVkIGluIFZhbHZlJiMwMzk7cyAmcXVvdDtQb3J0YWwmcXVvdDsgZnJhbmNoaXNlIG1vc3QgY2xvc2VseSByZXNlbWJsZXMgd2hpY2ggcmVhbC13b3JsZCB0eXBlIG9mIGNha2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2sgRm9yZXN0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJEZXZpbCYjMDM5O3MgRm9vZFwiLFxyXG4gICAgICAgICAgICBcIk1vbHRlbiBDaG9jb2xhdGVcIixcclxuICAgICAgICAgICAgXCJHZXJtYW4gQ2hvY29sYXRlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2UgJiBOYXR1cmVcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjaGVtaWNhbCBlbGVtZW50IExpdGhpdW0gaXMgbmFtZWQgYWZ0ZXIgdGhlIGNvdW50cnkgb2YgTGl0aHVhbmlhLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IEdhZGdldHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgRFZEIGludmVudGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5OTVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwMDBcIixcclxuICAgICAgICAgICAgXCIxOTkwXCIsXHJcbiAgICAgICAgICAgIFwiMTk4MFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBmdWxsIG5hbWUgb2YgdGhlIGZvb3RiYWxsZXIgJnF1b3Q7Q3Jpc3RpYW5vIFJvbmFsZG8mcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ3Jpc3RpYW5vIFJvbmFsZG8gZG9zIFNhbnRvcyBBdmVpcm9cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBSb25hbGRvIGxvcyBTYW50b3MgRGllZ29cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gQXJtYW5kbyBEaWVnbyBSb25hbGRvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEx1aXMgQXJtYW5kbyBSb25hbGRvXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGVzZSB0d28gY291bnRyaWVzIGhlbGQgYSBjb21tb253ZWFsdGggZnJvbSB0aGUgMTZ0aCB0byAxOHRoIGNlbnR1cnkuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9sYW5kIGFuZCBMaXRodWFuaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkh1dHUgYW5kIFJ3YW5kYVwiLFxyXG4gICAgICAgICAgICBcIk5vcnRoIEtvcmVhIGFuZCBTb3V0aCBLb3JlYVwiLFxyXG4gICAgICAgICAgICBcIkJhbmdsYWRlc2ggYW5kIEJodXRhblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7Q2FsbCBPZiBEdXR5OiBab21iaWVzJnF1b3Q7LCBjb21wbGV0aW5nIHdoaWNoIG1hcCYjMDM5O3MgbWFpbiBlYXN0ZXIgZWdnIHdpbGwgcmV3YXJkIHlvdSB3aXRoIHRoZSBhY2hpZXZlbWVudCwgJnF1b3Q7SGlnaCBNYWludGVuYW5jZSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEaWUgUmlzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTW9iIE9mIFRoZSBEZWFkXCIsXHJcbiAgICAgICAgICAgIFwiT3JpZ2luc1wiLFxyXG4gICAgICAgICAgICBcIkFzY2Vuc2lvblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDYXJ0b29uICYgQW5pbWF0aW9uc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0dyYXZpdHkgRmFsbHMmcXVvdDssIGhvdyBtdWNoIGRvZXMgV2FkZGxlcyB3ZWlnaCB3aGVuIE1hYmxlIHdpbnMgaGltIGluICZxdW90O1RoZSBUaW1lIFRyYXZlbGVyJiMwMzk7cyBQaWcmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTUgcG91bmRzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIxMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIzMCBwb3VuZHNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBnaXZlbiB0byBsYXllciA0IG9mIHRoZSBPcGVuIFN5c3RlbXMgSW50ZXJjb25uZWN0aW9uIChJU08pIG1vZGVsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRyYW5zcG9ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiU2Vzc2lvblwiLFxyXG4gICAgICAgICAgICBcIkRhdGEgbGlua1wiLFxyXG4gICAgICAgICAgICBcIk5ldHdvcmtcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IHllYXIgd2FzIGhvY2tleSBsZWdlbmQgV2F5bmUgR3JldHpreSBib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5NjFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjE5NjVcIixcclxuICAgICAgICAgICAgXCIxOTU5XCIsXHJcbiAgICAgICAgICAgIFwiMTk2M1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSG93IG1hbnkgZ2FtZXMgYXJlIHRoZXJlIGluIHRoZSAmcXVvdDtDb2xvbnkgV2FycyZxdW90OyBzZXJpZXMgZm9yIHRoZSBQbGF5U3RhdGlvbj9cIixcclxuICAgICAgICBcImFcIjogXCIzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyXCIsXHJcbiAgICAgICAgICAgIFwiNFwiLFxyXG4gICAgICAgICAgICBcIjVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiBXb3JsZCBvZiBXYXJjcmFmdCwgd2hpY2ggcmFpZCBpbnN0YW5jZSBmZWF0dXJlcyBhIGNoZXNzIGV2ZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkthcmF6aGFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJadWwmIzAzOTtBbWFuXCIsXHJcbiAgICAgICAgICAgIFwiQmxhY2t3aW5nIExhaXJcIixcclxuICAgICAgICAgICAgXCJUZW1wbGUgb2YgQWhuJiMwMzk7UWlyYWpcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGNvdW50cnkgd2FzIEpvc2VmIFN0YWxpbiBib3JuIGluP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdlb3JnaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJ1c3NpYVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbnlcIixcclxuICAgICAgICAgICAgXCJQb2xhbmRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBvZmZpY2lhbCBuYW1lIG9mIFByaW5jZSYjMDM5O3MgYmFja2luZyBiYW5kP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBSZXZvbHV0aW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgUGF1cGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBXYWlsZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEhlYXJ0YnJlYWtlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gR2FtZSBvZiBUaHJvbmVzIHdoYXQgaXMgdGhlIG5hbWUgb2YgSm9uIFNub3cmIzAzOTtzIHN3b3JkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvbmdjbGF3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJPYXRoa2VlcGVyXCIsXHJcbiAgICAgICAgICAgIFwiV2lkb3cmIzAzOTtzIFdhaWxcIixcclxuICAgICAgICAgICAgXCJOZWVkbGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgaW5zcGVjdG9yIGluIHRoZSBzZXJpZXMgJnF1b3Q7T24gdGhlIEJ1c2VzJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWtleVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFycGVyXCIsXHJcbiAgICAgICAgICAgIFwiTmFpbHlcIixcclxuICAgICAgICAgICAgXCJHYWxseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggYXJ0aXN0IGN1cmF0ZWQgdGhlIG9mZmljaWFsIHNvdW5kdHJhY2sgZm9yICZxdW90O1RoZSBIdW5nZXIgR2FtZXM6IE1vY2tpbmdqYXkgLSBQYXJ0IDEmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9yZGVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkthbnllIFdlc3RcIixcclxuICAgICAgICAgICAgXCJUb3ZlIExvXCIsXHJcbiAgICAgICAgICAgIFwiQ2hhcmxpIFhDWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBDYW5hZGlhbiAkMSBjb2luIGlzIGNvbGxvcXVpYWxseSBrbm93biBhcyBhIHdoYXQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9vbmllXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCb29saWVcIixcclxuICAgICAgICAgICAgXCJGb29saWVcIixcclxuICAgICAgICAgICAgXCJNb29kaWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlc2UgZm91bmRpbmcgZmF0aGVycyBvZiB0aGUgVW5pdGVkIFN0YXRlcyBvZiBBbWVyaWNhIGxhdGVyIGJlY2FtZSBwcmVzaWRlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmFtZXMgTW9ucm9lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbGV4YW5kZXIgSGFtaWx0b25cIixcclxuICAgICAgICAgICAgXCJTYW11ZWwgQWRhbXNcIixcclxuICAgICAgICAgICAgXCJSb2dlciBTaGVybWFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gRGl2aW5pdHk6IE9yaWdpbmFsIFNpbiBJSSwgd2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3Rlcj9cIixcclxuICAgICAgICBcImFcIjogXCJGYW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMb2hzZVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBSZWQgUHJpbmNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlcmUgYXJlIG5vIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hvIGlzIHRoZSBtYWluIHByb3RhZ29uaXN0IGluIHRoZSBnYW1lIExpZmUgaXMgU3RyYW5nZTogQmVmb3JlIFRoZSBTdG9ybT9cIixcclxuICAgICAgICBcImFcIjogXCJDaGxvZSBQcmljZSBcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1heCBDYXVsZmllbGRcIixcclxuICAgICAgICAgICAgXCJSYWNoZWwgQW1iZXJcIixcclxuICAgICAgICAgICAgXCJGcmFuayBCb3dlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSm9obm55IERlcHAgbWFkZSBoaXMgYmlnLXNjcmVlbiBhY3RpbmcgZGVidXQgaW4gd2hpY2ggZmlsbT9cIixcclxuICAgICAgICBcImFcIjogXCJBIE5pZ2h0bWFyZSBvbiBFbG0gU3RyZWV0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNeSBCbG9vZHkgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgICAgIFwiSGFsbG93ZWVuXCIsXHJcbiAgICAgICAgICAgIFwiRnJpZGF5IHRoZSAxM3RoXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O1Jlc2lkZW50IEV2aWwmcXVvdDssIG9ubHkgQ2hyaXMgaGFzIGFjY2VzcyB0byB0aGUgZ3JlbmFkZSBsYXVuY2hlci5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXJzIGlzIE5PVCBwbGF5YWJsZSBpbiAmcXVvdDtSZXNpZGVudCBFdmlsIDYmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmlsbCBWYWxlbnRpbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNocmlzIFJlZGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiU2hlcnJ5IEJpcmtpblwiLFxyXG4gICAgICAgICAgICBcIkhlbGVuYSBIYXJwZXJcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogSmFwYW5lc2UgQW5pbWUgJiBNYW5nYVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIDE5ODggZmlsbSAmcXVvdDtBa2lyYSZxdW90OywgVGV0c3VvIGVuZHMgdXAgZGVzdHJveWluZyBUb2t5by5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW9ncmFwaHlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgYm9keSBvZiB0aGUgRWd5cHRpYW4gU3BoaW54IHdhcyBiYXNlZCBvbiB3aGljaCBhbmltYWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQnVsbFwiLFxyXG4gICAgICAgICAgICBcIkhvcnNlXCIsXHJcbiAgICAgICAgICAgIFwiRG9nXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHJlbGF0aW9uIHRvIHRoZSBCcml0aXNoIE9jY3VwYXRpb24gaW4gSXJlbGFuZCwgd2hhdCBkb2VzIHRoZSBJUkEgc3RhbmQgZm9yLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIklyaXNoIFJlcHVibGljYW4gQXJteVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmViZWwgQWxsaWFuY2VcIixcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWZvcm1hdGlvbiBBcm15XCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2gtUm95YWwgQWxsaWFuY2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgcm9ib3QgaW4gdGhlIDE5NTEgc2NpZW5jZSBmaWN0aW9uIGZpbG0gY2xhc3NpYyAmIzAzOTtUaGUgRGF5IHRoZSBFYXJ0aCBTdG9vZCBTdGlsbCYjMDM5Oz9cIixcclxuICAgICAgICBcImFcIjogXCJHb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSb2JieVwiLFxyXG4gICAgICAgICAgICBcIkNvbG9zc3VzXCIsXHJcbiAgICAgICAgICAgIFwiQm94XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBSb21hbiBudW1lcmFsIGZvciA1MDA/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTFwiLFxyXG4gICAgICAgICAgICBcIkNcIixcclxuICAgICAgICAgICAgXCJYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbWFpbiBoZWFsaW5nIGl0ZW0gaW4gRGFyayBTb3Vscz9cIixcclxuICAgICAgICBcImFcIjogXCJFc3R1cyBGbGFza1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGVhbHRoIFBvdGlvblwiLFxyXG4gICAgICAgICAgICBcIk9yYW5nZSBKdWljZVwiLFxyXG4gICAgICAgICAgICBcIkFzaGVuIEZsYXNrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiT24gd2hpY2ggY29tcHV0ZXIgaGFyZHdhcmUgZGV2aWNlIGlzIHRoZSBCSU9TIGNoaXAgbG9jYXRlZD9cIixcclxuICAgICAgICBcImFcIjogXCJNb3RoZXJib2FyZFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFyZCBEaXNrIERyaXZlXCIsXHJcbiAgICAgICAgICAgIFwiQ2VudHJhbCBQcm9jZXNzaW5nIFVuaXRcIixcclxuICAgICAgICAgICAgXCJHcmFwaGljcyBQcm9jZXNzaW5nIFVuaXRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkEgdW5pdmVyc2FsIHNldCwgb3IgYSBzZXQgdGhhdCBjb250YWlucyBhbGwgc2V0cywgZXhpc3RzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBBY2UgQXR0b3JuZXkgdHJpbG9neSB3YXMgc3VwcG9zZSB0byBlbmQgd2l0aCAmcXVvdDtQaG9lbml4IFdyaWdodDogQWNlIEF0dG9ybmV5ICZtaW51czsgVHJpYWxzIGFuZCBUcmlidWxhdGlvbnMmcXVvdDsgYXMgaXRzIGZpbmFsIGdhbWUuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBoaWdoZXN0IGJlbHQgeW91IGNhbiBnZXQgaW4gVGFla3dvbmRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJXaGl0ZVwiLFxyXG4gICAgICAgICAgICBcIlJlZFwiLFxyXG4gICAgICAgICAgICBcIkdyZWVuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBVbml0ZWQgU3RhdGVzIERlcGFydG1lbnQgb2YgSG9tZWxhbmQgU2VjdXJpdHkgd2FzIGZvcm1lZCBpbiByZXNwb25zZSB0byB0aGUgU2VwdGVtYmVyIDExdGggYXR0YWNrcy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBcG9sbG8gbWlzc2lvbiB3YXMgdGhlIGxhc3Qgb25lIGluIE5BU0EmIzAzOTtzIEFwb2xsbyBwcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFwb2xsbyAxN1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDEzXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDExXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDE1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBpcyBhbiBleGlzdGluZyBmYW1pbHkgaW4gJnF1b3Q7VGhlIFNpbXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEdvdGggRmFtaWx5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFNpbW9sZW9uIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBQcm91ZCBGYW1pbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSBOdWNsZWFyIFRocm9uZSwgd2hhdCBvcmdhbml6YXRpb24gY2hhc2VzIHRoZSBwbGF5ZXIgY2hhcmFjdGVyIHRocm91Z2hvdXQgdGhlIGdhbWU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEkuRC5QLkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGaXNobWVuXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEJhbmRpdHNcIixcclxuICAgICAgICAgICAgXCJUaGUgWS5WLkcuR1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgJnF1b3Q7Q2F2ZSBTdG9yeSwmcXVvdDsgd2hhdCBpcyB0aGUgY2hhcmFjdGVyIEJhbHJvZyYjMDM5O3MgY2F0Y2hwaHJhc2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSHV6emFoIVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWWVzIVwiLFxyXG4gICAgICAgICAgICBcIldob2EgdGhlcmUhXCIsXHJcbiAgICAgICAgICAgIFwiTnllaCBoZWggaGVoIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJWZWhpY2xlc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9uZSBvZiB0aGVzZSBjaGFzc2lzIGNvZGVzIGFyZSB1c2VkIGJ5IEJNVyAzLXNlcmllcz9cIixcclxuICAgICAgICBcImFcIjogXCJFNDZcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkUzOVwiLFxyXG4gICAgICAgICAgICBcIkU4NVwiLFxyXG4gICAgICAgICAgICBcIkYxMFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDb21pY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB3aGF0IEhvbWVzdHVjayBVcGRhdGUgd2FzIFtTXSBHYW1lIE92ZXIgcmVsZWFzZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiT2N0b2JlciAyNXRoLCAyMDE0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcHJpbCAxM3RoLCAyMDA5XCIsXHJcbiAgICAgICAgICAgIFwiQXByaWwgOHRoLCAyMDEyXCIsXHJcbiAgICAgICAgICAgIFwiQXVndXN0IDI4dGgsIDIwMDNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBiYW5kIG1lbWJlcnMgb2YgQW1lcmljYW4gcm9jayBiYW5kIEtpbmcgb2YgTGVvbj9cIixcclxuICAgICAgICBcImFcIjogXCJCcm90aGVycyAmYW1wOyBjb3VzaW5zXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaGlsZGhvb2QgZnJpZW5kc1wiLFxyXG4gICAgICAgICAgICBcIkZvcm1lciBjbGFzc21hdGVzXCIsXHJcbiAgICAgICAgICAgIFwiRnJhdGVybml0eSBob3VzZSBtZW1iZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBmcmFuY2hpc2UgaGFkIGEgc3BlY2lhbCBldmVudCBob3N0ZWQgaW4gdGhlIHBvcHVsYXIgTU1PUlBHIEZpbmFsIEZhbnRhc3kgWElWOiBBIFJlYWxtIFJlYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCJZby1rYWkgV2F0Y2hcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlBvayZlYWN1dGU7bW9uXCIsXHJcbiAgICAgICAgICAgIFwiWXUtZ2ktb2hcIixcclxuICAgICAgICAgICAgXCJCdWRkeWZpZ2h0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggS2luZ2RvbSBIZWFydHMgZ2FtZSBmZWF0dXJlZCB0aGUgY2FzdCBvZiAmcXVvdDtUaGUgV29ybGQgRW5kcyBXaXRoIFlvdSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEcmVhbSBEcm9wIERpc3RhbmNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCaXJ0aCBCeSBTbGVlcFwiLFxyXG4gICAgICAgICAgICBcIjM2NS8yIERheXNcIixcclxuICAgICAgICAgICAgXCJSZTpDaGFpbiBvZiBNZW1vcmllc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGxhcmdlc3QgcGxhbmV0IGluIEtlcmJhbCBTcGFjZSBQcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkpvb2xcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkVlbG9vXCIsXHJcbiAgICAgICAgICAgIFwiS2VyYm9sXCIsXHJcbiAgICAgICAgICAgIFwiTWlubXVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQW5pbWFsIENyb3NzaW5nIGdhbWUgd2FzIGZvciB0aGUgTmludGVuZG8gV2lpP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFuaW1hbCBDcm9zc2luZzogQ2l0eSBGb2xrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IE5ldyBMZWFmXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBXaWxkIFdvcmxkXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBQb3B1bGF0aW9uIEdyb3dpbmchXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkdlb3JnZSBMdWNhcyBkaXJlY3RlZCB0aGUgZW50aXJlIG9yaWdpbmFsIFN0YXIgV2FycyB0cmlsb2d5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgY2l0eSBvZiBSb21lLCBJdGFseSBmb3VuZGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjc1MyBCQ0VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjkwMiBCQ0VcIixcclxuICAgICAgICAgICAgXCI1MjQgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNjk3IEJDRVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBkYXRhIHN0cnVjdHVyZSBkb2VzIEZJTE8gYXBwbHkgdG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiU3RhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlF1ZXVlXCIsXHJcbiAgICAgICAgICAgIFwiSGVhcFwiLFxyXG4gICAgICAgICAgICBcIlRyZWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gQmF0dGxlc3RhciBHYWxhY3RpY2EgKDIwMDQpLCBDeWxvbnMgd2VyZSBjcmVhdGVkIGJ5IG1hbiBhcyBjeWJlcm5ldGljIHdvcmtlcnMgYW5kIHNvbGRpZXJzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgMjAxNiBEaXNuZXkgYW5pbWF0ZWQgZmlsbSAmIzAzOTtNb2FuYSYjMDM5OyBpcyBiYXNlZCBvbiB3aGljaCBjdWx0dXJlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbHluZXNpYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk5hdGl2ZSBBbWVyaWNhblwiLFxyXG4gICAgICAgICAgICBcIkphcGFuZXNlXCIsXHJcbiAgICAgICAgICAgIFwiTm9yZGljXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2FrZSBkZXBpY3RlZCBpbiBWYWx2ZSYjMDM5O3MgJnF1b3Q7UG9ydGFsJnF1b3Q7IGZyYW5jaGlzZSBtb3N0IGNsb3NlbHkgcmVzZW1ibGVzIHdoaWNoIHJlYWwtd29ybGQgdHlwZSBvZiBjYWtlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrIEZvcmVzdFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRGV2aWwmIzAzOTtzIEZvb2RcIixcclxuICAgICAgICAgICAgXCJNb2x0ZW4gQ2hvY29sYXRlXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFuIENob2NvbGF0ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlICYgTmF0dXJlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2hlbWljYWwgZWxlbWVudCBMaXRoaXVtIGlzIG5hbWVkIGFmdGVyIHRoZSBjb3VudHJ5IG9mIExpdGh1YW5pYS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBHYWRnZXRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIERWRCBpbnZlbnRlZD9cIixcclxuICAgICAgICBcImFcIjogXCIxOTk1XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMDAwXCIsXHJcbiAgICAgICAgICAgIFwiMTk5MFwiLFxyXG4gICAgICAgICAgICBcIjE5ODBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgZnVsbCBuYW1lIG9mIHRoZSBmb290YmFsbGVyICZxdW90O0NyaXN0aWFubyBSb25hbGRvJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNyaXN0aWFubyBSb25hbGRvIGRvcyBTYW50b3MgQXZlaXJvXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gUm9uYWxkbyBsb3MgU2FudG9zIERpZWdvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEFybWFuZG8gRGllZ28gUm9uYWxkb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBMdWlzIEFybWFuZG8gUm9uYWxkb1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlc2UgdHdvIGNvdW50cmllcyBoZWxkIGEgY29tbW9ud2VhbHRoIGZyb20gdGhlIDE2dGggdG8gMTh0aCBjZW50dXJ5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbGFuZCBhbmQgTGl0aHVhbmlhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIdXR1IGFuZCBSd2FuZGFcIixcclxuICAgICAgICAgICAgXCJOb3J0aCBLb3JlYSBhbmQgU291dGggS29yZWFcIixcclxuICAgICAgICAgICAgXCJCYW5nbGFkZXNoIGFuZCBCaHV0YW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0NhbGwgT2YgRHV0eTogWm9tYmllcyZxdW90OywgY29tcGxldGluZyB3aGljaCBtYXAmIzAzOTtzIG1haW4gZWFzdGVyIGVnZyB3aWxsIHJld2FyZCB5b3Ugd2l0aCB0aGUgYWNoaWV2ZW1lbnQsICZxdW90O0hpZ2ggTWFpbnRlbmFuY2UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRGllIFJpc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1vYiBPZiBUaGUgRGVhZFwiLFxyXG4gICAgICAgICAgICBcIk9yaWdpbnNcIixcclxuICAgICAgICAgICAgXCJBc2NlbnNpb25cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ2FydG9vbiAmIEFuaW1hdGlvbnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtHcmF2aXR5IEZhbGxzJnF1b3Q7LCBob3cgbXVjaCBkb2VzIFdhZGRsZXMgd2VpZ2ggd2hlbiBNYWJsZSB3aW5zIGhpbSBpbiAmcXVvdDtUaGUgVGltZSBUcmF2ZWxlciYjMDM5O3MgUGlnJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE1IHBvdW5kc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMTAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMzAgcG91bmRzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgZ2l2ZW4gdG8gbGF5ZXIgNCBvZiB0aGUgT3BlbiBTeXN0ZW1zIEludGVyY29ubmVjdGlvbiAoSVNPKSBtb2RlbD9cIixcclxuICAgICAgICBcImFcIjogXCJUcmFuc3BvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlNlc3Npb25cIixcclxuICAgICAgICAgICAgXCJEYXRhIGxpbmtcIixcclxuICAgICAgICAgICAgXCJOZXR3b3JrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCB5ZWFyIHdhcyBob2NrZXkgbGVnZW5kIFdheW5lIEdyZXR6a3kgYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCIxOTYxXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIxOTY1XCIsXHJcbiAgICAgICAgICAgIFwiMTk1OVwiLFxyXG4gICAgICAgICAgICBcIjE5NjNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkhvdyBtYW55IGdhbWVzIGFyZSB0aGVyZSBpbiB0aGUgJnF1b3Q7Q29sb255IFdhcnMmcXVvdDsgc2VyaWVzIGZvciB0aGUgUGxheVN0YXRpb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiM1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMlwiLFxyXG4gICAgICAgICAgICBcIjRcIixcclxuICAgICAgICAgICAgXCI1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gV29ybGQgb2YgV2FyY3JhZnQsIHdoaWNoIHJhaWQgaW5zdGFuY2UgZmVhdHVyZXMgYSBjaGVzcyBldmVudD9cIixcclxuICAgICAgICBcImFcIjogXCJLYXJhemhhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWnVsJiMwMzk7QW1hblwiLFxyXG4gICAgICAgICAgICBcIkJsYWNrd2luZyBMYWlyXCIsXHJcbiAgICAgICAgICAgIFwiVGVtcGxlIG9mIEFobiYjMDM5O1FpcmFqXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBjb3VudHJ5IHdhcyBKb3NlZiBTdGFsaW4gYm9ybiBpbj9cIixcclxuICAgICAgICBcImFcIjogXCJHZW9yZ2lhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSdXNzaWFcIixcclxuICAgICAgICAgICAgXCJHZXJtYW55XCIsXHJcbiAgICAgICAgICAgIFwiUG9sYW5kXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgb2ZmaWNpYWwgbmFtZSBvZiBQcmluY2UmIzAzOTtzIGJhY2tpbmcgYmFuZD9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgUmV2b2x1dGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIFBhdXBlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgV2FpbGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBIZWFydGJyZWFrZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEdhbWUgb2YgVGhyb25lcyB3aGF0IGlzIHRoZSBuYW1lIG9mIEpvbiBTbm93JiMwMzk7cyBzd29yZD9cIixcclxuICAgICAgICBcImFcIjogXCJMb25nY2xhd1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiT2F0aGtlZXBlclwiLFxyXG4gICAgICAgICAgICBcIldpZG93JiMwMzk7cyBXYWlsXCIsXHJcbiAgICAgICAgICAgIFwiTmVlZGxlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGluc3BlY3RvciBpbiB0aGUgc2VyaWVzICZxdW90O09uIHRoZSBCdXNlcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFrZXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcnBlclwiLFxyXG4gICAgICAgICAgICBcIk5haWx5XCIsXHJcbiAgICAgICAgICAgIFwiR2FsbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGFydGlzdCBjdXJhdGVkIHRoZSBvZmZpY2lhbCBzb3VuZHRyYWNrIGZvciAmcXVvdDtUaGUgSHVuZ2VyIEdhbWVzOiBNb2NraW5namF5IC0gUGFydCAxJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvcmRlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJLYW55ZSBXZXN0XCIsXHJcbiAgICAgICAgICAgIFwiVG92ZSBMb1wiLFxyXG4gICAgICAgICAgICBcIkNoYXJsaSBYQ1hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQ2FuYWRpYW4gJDEgY29pbiBpcyBjb2xsb3F1aWFsbHkga25vd24gYXMgYSB3aGF0P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvb25pZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiRm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiTW9vZGllXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZXNlIGZvdW5kaW5nIGZhdGhlcnMgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgb2YgQW1lcmljYSBsYXRlciBiZWNhbWUgcHJlc2lkZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkphbWVzIE1vbnJvZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQWxleGFuZGVyIEhhbWlsdG9uXCIsXHJcbiAgICAgICAgICAgIFwiU2FtdWVsIEFkYW1zXCIsXHJcbiAgICAgICAgICAgIFwiUm9nZXIgU2hlcm1hblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIERpdmluaXR5OiBPcmlnaW5hbCBTaW4gSUksIHdoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXI/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFuZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTG9oc2VcIixcclxuICAgICAgICAgICAgXCJUaGUgUmVkIFByaW5jZVwiLFxyXG4gICAgICAgICAgICBcIlRoZXJlIGFyZSBubyBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldobyBpcyB0aGUgbWFpbiBwcm90YWdvbmlzdCBpbiB0aGUgZ2FtZSBMaWZlIGlzIFN0cmFuZ2U6IEJlZm9yZSBUaGUgU3Rvcm0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ2hsb2UgUHJpY2UgXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNYXggQ2F1bGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiUmFjaGVsIEFtYmVyXCIsXHJcbiAgICAgICAgICAgIFwiRnJhbmsgQm93ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkpvaG5ueSBEZXBwIG1hZGUgaGlzIGJpZy1zY3JlZW4gYWN0aW5nIGRlYnV0IGluIHdoaWNoIGZpbG0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQSBOaWdodG1hcmUgb24gRWxtIFN0cmVldFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTXkgQmxvb2R5IFZhbGVudGluZVwiLFxyXG4gICAgICAgICAgICBcIkhhbGxvd2VlblwiLFxyXG4gICAgICAgICAgICBcIkZyaWRheSB0aGUgMTN0aFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtSZXNpZGVudCBFdmlsJnF1b3Q7LCBvbmx5IENocmlzIGhhcyBhY2Nlc3MgdG8gdGhlIGdyZW5hZGUgbGF1bmNoZXIuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVycyBpcyBOT1QgcGxheWFibGUgaW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCA2JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkppbGwgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaHJpcyBSZWRmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlNoZXJyeSBCaXJraW5cIixcclxuICAgICAgICAgICAgXCJIZWxlbmEgSGFycGVyXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEphcGFuZXNlIEFuaW1lICYgTWFuZ2FcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSAxOTg4IGZpbG0gJnF1b3Q7QWtpcmEmcXVvdDssIFRldHN1byBlbmRzIHVwIGRlc3Ryb3lpbmcgVG9reW8uXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VvZ3JhcGh5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGJvZHkgb2YgdGhlIEVneXB0aWFuIFNwaGlueCB3YXMgYmFzZWQgb24gd2hpY2ggYW5pbWFsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJ1bGxcIixcclxuICAgICAgICAgICAgXCJIb3JzZVwiLFxyXG4gICAgICAgICAgICBcIkRvZ1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiByZWxhdGlvbiB0byB0aGUgQnJpdGlzaCBPY2N1cGF0aW9uIGluIElyZWxhbmQsIHdoYXQgZG9lcyB0aGUgSVJBIHN0YW5kIGZvci5cIixcclxuICAgICAgICBcImFcIjogXCJJcmlzaCBSZXB1YmxpY2FuIEFybXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIklyaXNoIFJlYmVsIEFsbGlhbmNlXCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmVmb3JtYXRpb24gQXJteVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoLVJveWFsIEFsbGlhbmNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHJvYm90IGluIHRoZSAxOTUxIHNjaWVuY2UgZmljdGlvbiBmaWxtIGNsYXNzaWMgJiMwMzk7VGhlIERheSB0aGUgRWFydGggU3Rvb2QgU3RpbGwmIzAzOTs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR29ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUm9iYnlcIixcclxuICAgICAgICAgICAgXCJDb2xvc3N1c1wiLFxyXG4gICAgICAgICAgICBcIkJveFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgUm9tYW4gbnVtZXJhbCBmb3IgNTAwP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxcIixcclxuICAgICAgICAgICAgXCJDXCIsXHJcbiAgICAgICAgICAgIFwiWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIG1haW4gaGVhbGluZyBpdGVtIGluIERhcmsgU291bHM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRXN0dXMgRmxhc2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhlYWx0aCBQb3Rpb25cIixcclxuICAgICAgICAgICAgXCJPcmFuZ2UgSnVpY2VcIixcclxuICAgICAgICAgICAgXCJBc2hlbiBGbGFza1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIk9uIHdoaWNoIGNvbXB1dGVyIGhhcmR3YXJlIGRldmljZSBpcyB0aGUgQklPUyBjaGlwIGxvY2F0ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTW90aGVyYm9hcmRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcmQgRGlzayBEcml2ZVwiLFxyXG4gICAgICAgICAgICBcIkNlbnRyYWwgUHJvY2Vzc2luZyBVbml0XCIsXHJcbiAgICAgICAgICAgIFwiR3JhcGhpY3MgUHJvY2Vzc2luZyBVbml0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJBIHVuaXZlcnNhbCBzZXQsIG9yIGEgc2V0IHRoYXQgY29udGFpbnMgYWxsIHNldHMsIGV4aXN0cy5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQWNlIEF0dG9ybmV5IHRyaWxvZ3kgd2FzIHN1cHBvc2UgdG8gZW5kIHdpdGggJnF1b3Q7UGhvZW5peCBXcmlnaHQ6IEFjZSBBdHRvcm5leSAmbWludXM7IFRyaWFscyBhbmQgVHJpYnVsYXRpb25zJnF1b3Q7IGFzIGl0cyBmaW5hbCBnYW1lLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgaGlnaGVzdCBiZWx0IHlvdSBjYW4gZ2V0IGluIFRhZWt3b25kbz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiV2hpdGVcIixcclxuICAgICAgICAgICAgXCJSZWRcIixcclxuICAgICAgICAgICAgXCJHcmVlblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgVW5pdGVkIFN0YXRlcyBEZXBhcnRtZW50IG9mIEhvbWVsYW5kIFNlY3VyaXR5IHdhcyBmb3JtZWQgaW4gcmVzcG9uc2UgdG8gdGhlIFNlcHRlbWJlciAxMXRoIGF0dGFja3MuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQXBvbGxvIG1pc3Npb24gd2FzIHRoZSBsYXN0IG9uZSBpbiBOQVNBJiMwMzk7cyBBcG9sbG8gcHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJBcG9sbG8gMTdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwb2xsbyAxM1wiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxMVwiLFxyXG4gICAgICAgICAgICBcIkFwb2xsbyAxNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgaXMgYW4gZXhpc3RpbmcgZmFtaWx5IGluICZxdW90O1RoZSBTaW1zJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBHb3RoIEZhbWlseVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBTaW1vbGVvbiBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgUHJvdWQgRmFtaWx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgTnVjbGVhciBUaHJvbmUsIHdoYXQgb3JnYW5pemF0aW9uIGNoYXNlcyB0aGUgcGxheWVyIGNoYXJhY3RlciB0aHJvdWdob3V0IHRoZSBnYW1lP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBJLkQuUC5EXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmlzaG1lblwiLFxyXG4gICAgICAgICAgICBcIlRoZSBCYW5kaXRzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFkuVi5HLkdcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lICZxdW90O0NhdmUgU3RvcnksJnF1b3Q7IHdoYXQgaXMgdGhlIGNoYXJhY3RlciBCYWxyb2cmIzAzOTtzIGNhdGNocGhyYXNlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkh1enphaCFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlllcyFcIixcclxuICAgICAgICAgICAgXCJXaG9hIHRoZXJlIVwiLFxyXG4gICAgICAgICAgICBcIk55ZWggaGVoIGhlaCFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiVmVoaWNsZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvbmUgb2YgdGhlc2UgY2hhc3NpcyBjb2RlcyBhcmUgdXNlZCBieSBCTVcgMy1zZXJpZXM/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRTQ2XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFMzlcIixcclxuICAgICAgICAgICAgXCJFODVcIixcclxuICAgICAgICAgICAgXCJGMTBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ29taWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gd2hhdCBIb21lc3R1Y2sgVXBkYXRlIHdhcyBbU10gR2FtZSBPdmVyIHJlbGVhc2VkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk9jdG9iZXIgMjV0aCwgMjAxNFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXByaWwgMTN0aCwgMjAwOVwiLFxyXG4gICAgICAgICAgICBcIkFwcmlsIDh0aCwgMjAxMlwiLFxyXG4gICAgICAgICAgICBcIkF1Z3VzdCAyOHRoLCAyMDAzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGUgYmFuZCBtZW1iZXJzIG9mIEFtZXJpY2FuIHJvY2sgYmFuZCBLaW5nIG9mIExlb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQnJvdGhlcnMgJmFtcDsgY291c2luc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hpbGRob29kIGZyaWVuZHNcIixcclxuICAgICAgICAgICAgXCJGb3JtZXIgY2xhc3NtYXRlc1wiLFxyXG4gICAgICAgICAgICBcIkZyYXRlcm5pdHkgaG91c2UgbWVtYmVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZnJhbmNoaXNlIGhhZCBhIHNwZWNpYWwgZXZlbnQgaG9zdGVkIGluIHRoZSBwb3B1bGFyIE1NT1JQRyBGaW5hbCBGYW50YXN5IFhJVjogQSBSZWFsbSBSZWJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiWW8ta2FpIFdhdGNoXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJQb2smZWFjdXRlO21vblwiLFxyXG4gICAgICAgICAgICBcIll1LWdpLW9oXCIsXHJcbiAgICAgICAgICAgIFwiQnVkZHlmaWdodFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEtpbmdkb20gSGVhcnRzIGdhbWUgZmVhdHVyZWQgdGhlIGNhc3Qgb2YgJnF1b3Q7VGhlIFdvcmxkIEVuZHMgV2l0aCBZb3UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRHJlYW0gRHJvcCBEaXN0YW5jZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQmlydGggQnkgU2xlZXBcIixcclxuICAgICAgICAgICAgXCIzNjUvMiBEYXlzXCIsXHJcbiAgICAgICAgICAgIFwiUmU6Q2hhaW4gb2YgTWVtb3JpZXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBsYXJnZXN0IHBsYW5ldCBpbiBLZXJiYWwgU3BhY2UgUHJvZ3JhbT9cIixcclxuICAgICAgICBcImFcIjogXCJKb29sXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJFZWxvb1wiLFxyXG4gICAgICAgICAgICBcIktlcmJvbFwiLFxyXG4gICAgICAgICAgICBcIk1pbm11c1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFuaW1hbCBDcm9zc2luZyBnYW1lIHdhcyBmb3IgdGhlIE5pbnRlbmRvIFdpaT9cIixcclxuICAgICAgICBcImFcIjogXCJBbmltYWwgQ3Jvc3Npbmc6IENpdHkgRm9sa1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBOZXcgTGVhZlwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogV2lsZCBXb3JsZFwiLFxyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogUG9wdWxhdGlvbiBHcm93aW5nIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJHZW9yZ2UgTHVjYXMgZGlyZWN0ZWQgdGhlIGVudGlyZSBvcmlnaW5hbCBTdGFyIFdhcnMgdHJpbG9neS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIGNpdHkgb2YgUm9tZSwgSXRhbHkgZm91bmRlZD9cIixcclxuICAgICAgICBcImFcIjogXCI3NTMgQkNFXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCI5MDIgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNTI0IEJDRVwiLFxyXG4gICAgICAgICAgICBcIjY5NyBCQ0VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggZGF0YSBzdHJ1Y3R1cmUgZG9lcyBGSUxPIGFwcGx5IHRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlN0YWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJRdWV1ZVwiLFxyXG4gICAgICAgICAgICBcIkhlYXBcIixcclxuICAgICAgICAgICAgXCJUcmVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEJhdHRsZXN0YXIgR2FsYWN0aWNhICgyMDA0KSwgQ3lsb25zIHdlcmUgY3JlYXRlZCBieSBtYW4gYXMgY3liZXJuZXRpYyB3b3JrZXJzIGFuZCBzb2xkaWVycy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIDIwMTYgRGlzbmV5IGFuaW1hdGVkIGZpbG0gJiMwMzk7TW9hbmEmIzAzOTsgaXMgYmFzZWQgb24gd2hpY2ggY3VsdHVyZT9cIixcclxuICAgICAgICBcImFcIjogXCJQb2x5bmVzaWFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJOYXRpdmUgQW1lcmljYW5cIixcclxuICAgICAgICAgICAgXCJKYXBhbmVzZVwiLFxyXG4gICAgICAgICAgICBcIk5vcmRpY1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNha2UgZGVwaWN0ZWQgaW4gVmFsdmUmIzAzOTtzICZxdW90O1BvcnRhbCZxdW90OyBmcmFuY2hpc2UgbW9zdCBjbG9zZWx5IHJlc2VtYmxlcyB3aGljaCByZWFsLXdvcmxkIHR5cGUgb2YgY2FrZT9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFjayBGb3Jlc3RcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkRldmlsJiMwMzk7cyBGb29kXCIsXHJcbiAgICAgICAgICAgIFwiTW9sdGVuIENob2NvbGF0ZVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbiBDaG9jb2xhdGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZSAmIE5hdHVyZVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIGNoZW1pY2FsIGVsZW1lbnQgTGl0aGl1bSBpcyBuYW1lZCBhZnRlciB0aGUgY291bnRyeSBvZiBMaXRodWFuaWEuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogR2FkZ2V0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBEVkQgaW52ZW50ZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk5NVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAwMFwiLFxyXG4gICAgICAgICAgICBcIjE5OTBcIixcclxuICAgICAgICAgICAgXCIxOTgwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGZ1bGwgbmFtZSBvZiB0aGUgZm9vdGJhbGxlciAmcXVvdDtDcmlzdGlhbm8gUm9uYWxkbyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJDcmlzdGlhbm8gUm9uYWxkbyBkb3MgU2FudG9zIEF2ZWlyb1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIFJvbmFsZG8gbG9zIFNhbnRvcyBEaWVnb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBBcm1hbmRvIERpZWdvIFJvbmFsZG9cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gTHVpcyBBcm1hbmRvIFJvbmFsZG9cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZXNlIHR3byBjb3VudHJpZXMgaGVsZCBhIGNvbW1vbndlYWx0aCBmcm9tIHRoZSAxNnRoIHRvIDE4dGggY2VudHVyeS5cIixcclxuICAgICAgICBcImFcIjogXCJQb2xhbmQgYW5kIExpdGh1YW5pYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSHV0dSBhbmQgUndhbmRhXCIsXHJcbiAgICAgICAgICAgIFwiTm9ydGggS29yZWEgYW5kIFNvdXRoIEtvcmVhXCIsXHJcbiAgICAgICAgICAgIFwiQmFuZ2xhZGVzaCBhbmQgQmh1dGFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtDYWxsIE9mIER1dHk6IFpvbWJpZXMmcXVvdDssIGNvbXBsZXRpbmcgd2hpY2ggbWFwJiMwMzk7cyBtYWluIGVhc3RlciBlZ2cgd2lsbCByZXdhcmQgeW91IHdpdGggdGhlIGFjaGlldmVtZW50LCAmcXVvdDtIaWdoIE1haW50ZW5hbmNlJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRpZSBSaXNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNb2IgT2YgVGhlIERlYWRcIixcclxuICAgICAgICAgICAgXCJPcmlnaW5zXCIsXHJcbiAgICAgICAgICAgIFwiQXNjZW5zaW9uXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENhcnRvb24gJiBBbmltYXRpb25zXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7R3Jhdml0eSBGYWxscyZxdW90OywgaG93IG11Y2ggZG9lcyBXYWRkbGVzIHdlaWdoIHdoZW4gTWFibGUgd2lucyBoaW0gaW4gJnF1b3Q7VGhlIFRpbWUgVHJhdmVsZXImIzAzOTtzIFBpZyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCIxNSBwb3VuZHNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjEwIHBvdW5kc1wiLFxyXG4gICAgICAgICAgICBcIjMwIHBvdW5kc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIGdpdmVuIHRvIGxheWVyIDQgb2YgdGhlIE9wZW4gU3lzdGVtcyBJbnRlcmNvbm5lY3Rpb24gKElTTykgbW9kZWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJhbnNwb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJTZXNzaW9uXCIsXHJcbiAgICAgICAgICAgIFwiRGF0YSBsaW5rXCIsXHJcbiAgICAgICAgICAgIFwiTmV0d29ya1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgeWVhciB3YXMgaG9ja2V5IGxlZ2VuZCBXYXluZSBHcmV0emt5IGJvcm4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTk2MVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMTk2NVwiLFxyXG4gICAgICAgICAgICBcIjE5NTlcIixcclxuICAgICAgICAgICAgXCIxOTYzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJIb3cgbWFueSBnYW1lcyBhcmUgdGhlcmUgaW4gdGhlICZxdW90O0NvbG9ueSBXYXJzJnF1b3Q7IHNlcmllcyBmb3IgdGhlIFBsYXlTdGF0aW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjJcIixcclxuICAgICAgICAgICAgXCI0XCIsXHJcbiAgICAgICAgICAgIFwiNVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIFdvcmxkIG9mIFdhcmNyYWZ0LCB3aGljaCByYWlkIGluc3RhbmNlIGZlYXR1cmVzIGEgY2hlc3MgZXZlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiS2FyYXpoYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlp1bCYjMDM5O0FtYW5cIixcclxuICAgICAgICAgICAgXCJCbGFja3dpbmcgTGFpclwiLFxyXG4gICAgICAgICAgICBcIlRlbXBsZSBvZiBBaG4mIzAzOTtRaXJhalwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggY291bnRyeSB3YXMgSm9zZWYgU3RhbGluIGJvcm4gaW4/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiR2VvcmdpYVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUnVzc2lhXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFueVwiLFxyXG4gICAgICAgICAgICBcIlBvbGFuZFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG9mZmljaWFsIG5hbWUgb2YgUHJpbmNlJiMwMzk7cyBiYWNraW5nIGJhbmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIFJldm9sdXRpb25cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBQYXVwZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFdhaWxlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgSGVhcnRicmVha2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiBHYW1lIG9mIFRocm9uZXMgd2hhdCBpcyB0aGUgbmFtZSBvZiBKb24gU25vdyYjMDM5O3Mgc3dvcmQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9uZ2NsYXdcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk9hdGhrZWVwZXJcIixcclxuICAgICAgICAgICAgXCJXaWRvdyYjMDM5O3MgV2FpbFwiLFxyXG4gICAgICAgICAgICBcIk5lZWRsZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBpbnNwZWN0b3IgaW4gdGhlIHNlcmllcyAmcXVvdDtPbiB0aGUgQnVzZXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxha2V5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJwZXJcIixcclxuICAgICAgICAgICAgXCJOYWlseVwiLFxyXG4gICAgICAgICAgICBcIkdhbGx5XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBhcnRpc3QgY3VyYXRlZCB0aGUgb2ZmaWNpYWwgc291bmR0cmFjayBmb3IgJnF1b3Q7VGhlIEh1bmdlciBHYW1lczogTW9ja2luZ2pheSAtIFBhcnQgMSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJMb3JkZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiS2FueWUgV2VzdFwiLFxyXG4gICAgICAgICAgICBcIlRvdmUgTG9cIixcclxuICAgICAgICAgICAgXCJDaGFybGkgWENYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIENhbmFkaWFuICQxIGNvaW4gaXMgY29sbG9xdWlhbGx5IGtub3duIGFzIGEgd2hhdD9cIixcclxuICAgICAgICBcImFcIjogXCJMb29uaWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIkZvb2xpZVwiLFxyXG4gICAgICAgICAgICBcIk1vb2RpZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGVzZSBmb3VuZGluZyBmYXRoZXJzIG9mIHRoZSBVbml0ZWQgU3RhdGVzIG9mIEFtZXJpY2EgbGF0ZXIgYmVjYW1lIHByZXNpZGVudD9cIixcclxuICAgICAgICBcImFcIjogXCJKYW1lcyBNb25yb2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFsZXhhbmRlciBIYW1pbHRvblwiLFxyXG4gICAgICAgICAgICBcIlNhbXVlbCBBZGFtc1wiLFxyXG4gICAgICAgICAgICBcIlJvZ2VyIFNoZXJtYW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBEaXZpbml0eTogT3JpZ2luYWwgU2luIElJLCB3aGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkxvaHNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFJlZCBQcmluY2VcIixcclxuICAgICAgICAgICAgXCJUaGVyZSBhcmUgbm8gc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3RlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaG8gaXMgdGhlIG1haW4gcHJvdGFnb25pc3QgaW4gdGhlIGdhbWUgTGlmZSBpcyBTdHJhbmdlOiBCZWZvcmUgVGhlIFN0b3JtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNobG9lIFByaWNlIFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTWF4IENhdWxmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlJhY2hlbCBBbWJlclwiLFxyXG4gICAgICAgICAgICBcIkZyYW5rIEJvd2Vyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJKb2hubnkgRGVwcCBtYWRlIGhpcyBiaWctc2NyZWVuIGFjdGluZyBkZWJ1dCBpbiB3aGljaCBmaWxtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkEgTmlnaHRtYXJlIG9uIEVsbSBTdHJlZXRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk15IEJsb29keSBWYWxlbnRpbmVcIixcclxuICAgICAgICAgICAgXCJIYWxsb3dlZW5cIixcclxuICAgICAgICAgICAgXCJGcmlkYXkgdGhlIDEzdGhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCZxdW90Oywgb25seSBDaHJpcyBoYXMgYWNjZXNzIHRvIHRoZSBncmVuYWRlIGxhdW5jaGVyLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcnMgaXMgTk9UIHBsYXlhYmxlIGluICZxdW90O1Jlc2lkZW50IEV2aWwgNiZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJKaWxsIFZhbGVudGluZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQ2hyaXMgUmVkZmllbGRcIixcclxuICAgICAgICAgICAgXCJTaGVycnkgQmlya2luXCIsXHJcbiAgICAgICAgICAgIFwiSGVsZW5hIEhhcnBlclwiXHJcbiAgICAgICAgXVxyXG4gICAgfVxyXG5dIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCJpbXBvcnQgZnNnIGZyb20gJy4vZnNnJztcclxuaW1wb3J0IFBvcFRyaXZpYSBmcm9tICcuL2dhbWUnO1xyXG5cclxuXHJcblxyXG5mc2cub24oJ25ld2dhbWUnLCAoKSA9PiBQb3BUcml2aWEub25OZXdHYW1lKCkpO1xyXG5mc2cub24oJ3NraXAnLCAoKSA9PiBQb3BUcml2aWEub25Ta2lwKCkpO1xyXG5mc2cub24oJ2pvaW4nLCAoKSA9PiBQb3BUcml2aWEub25Kb2luKCkpO1xyXG5mc2cub24oJ2xlYXZlJywgKCkgPT4gUG9wVHJpdmlhLm9uTGVhdmUoKSk7XHJcbmZzZy5vbigncGljaycsICgpID0+IFBvcFRyaXZpYS5vblBpY2soKSk7XHJcblxyXG5mc2cuc3VibWl0KCk7Il0sInNvdXJjZVJvb3QiOiIifQ==