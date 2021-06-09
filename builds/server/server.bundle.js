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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vRzpcXEdpdEh1YlxcZnNnLXBsYXRmb3JtXFx0ZW1wbGF0ZXNcXHBvcHRyaXZpYVxcZ2FtZS1zZXJ2ZXJcXGZzZy5qcyIsImZpbGU6Ly8vRzpcXEdpdEh1YlxcZnNnLXBsYXRmb3JtXFx0ZW1wbGF0ZXNcXHBvcHRyaXZpYVxcZ2FtZS1zZXJ2ZXJcXGdhbWUuanMiLCJmaWxlOi8vL0c6XFxHaXRIdWJcXGZzZy1wbGF0Zm9ybVxcdGVtcGxhdGVzXFxwb3B0cml2aWFcXGdhbWUtc2VydmVyXFxxdWVzdGlvbnMuanMiLCJmaWxlOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwiZmlsZTovLy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJmaWxlOi8vL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJmaWxlOi8vL0c6XFxHaXRIdWJcXGZzZy1wbGF0Zm9ybVxcdGVtcGxhdGVzXFxwb3B0cml2aWFcXGdhbWUtc2VydmVyXFxpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1EQUFtRCxnQkFBZ0IsaUNBQWlDO0FBQ3BHO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBLHlDQUF5QztBQUN6QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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O0FBQ0E7QUFDQSxDOzs7Ozs7VUN6a0JBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0Esd0NBQXdDLHlDQUF5QztXQUNqRjtXQUNBO1dBQ0EsRTs7Ozs7V0NQQSx3Rjs7Ozs7Ozs7Ozs7O0FDQXdCO0FBQ087Ozs7QUFJL0IsNENBQU0sa0JBQWtCLG9EQUFtQjtBQUMzQyw0Q0FBTSxlQUFlLGlEQUFnQjtBQUNyQyw0Q0FBTSxlQUFlLGlEQUFnQjtBQUNyQyw0Q0FBTSxnQkFBZ0Isa0RBQWlCO0FBQ3ZDLDRDQUFNLGVBQWUsaURBQWdCOztBQUVyQyxnREFBVSxHIiwiZmlsZSI6InNlcnZlci5idW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuY2xhc3MgRlNHIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMubXNnID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmFjdGlvbigpKSk7XHJcbiAgICAgICAgdGhpcy5vcmlnaW5hbEdhbWUgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGdsb2JhbHMuZ2FtZSgpKSk7XHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5nYW1lKCkpKTtcclxuICAgICAgICB0aGlzLmlzTmV3R2FtZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMubWFya2VkRm9yRGVsZXRlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kZWZhdWx0U2Vjb25kcyA9IDE1O1xyXG4gICAgICAgIC8vIHRoaXMubmV4dFRpbWVMaW1pdCA9IC0xO1xyXG4gICAgICAgIHRoaXMua2lja2VkUGxheWVycyA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMubmV4dEdhbWUgfHwgT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5ydWxlcykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5pc05ld0dhbWUgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmVycm9yKCdNaXNzaW5nIFJ1bGVzJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5uZXh0R2FtZSkge1xyXG4gICAgICAgICAgICBpZiAoISgndGltZXInIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyID0ge307XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCEoJ3N0YXRlJyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5zdGF0ZSA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoISgncGxheWVycycgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUucGxheWVycyA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICghKCdwcmV2JyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnByZXYgPSB7fTtcclxuICAgICAgICAgICAgLy99XHJcblxyXG4gICAgICAgICAgICBpZiAoISgnbmV4dCcgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUubmV4dCA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoISgncnVsZXMnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnJ1bGVzID0ge307XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCEoJ2V2ZW50cycgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMgPSBbXTtcclxuICAgICAgICAgICAgLy99XHJcbiAgICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9uKHR5cGUsIGNiKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubXNnLnR5cGUgIT0gdHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSAnbmV3Z2FtZScgJiYgdGhpcy5pc05ld0dhbWUpIHtcclxuICAgICAgICAgICAgICAgIGNiKHRoaXMubXNnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzLm5leHRHYW1lID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdEdhbWUsIHsgcGxheWVyczogdGhpcy5uZXh0R2FtZS5wbGF5ZXJzIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2IodGhpcy5tc2cpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEdhbWUoZ2FtZSkge1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMubmV4dEdhbWUucGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgZ2FtZS5wbGF5ZXJzW2lkXSA9IHsgbmFtZTogcGxheWVyLm5hbWUgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL2dhbWUucGxheWVycyA9IE9iamVjdC5hc3NpZ24oe30sIGdhbWUucGxheWVycywgdGhpcy5uZXh0R2FtZS5wbGF5ZXJzKVxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUgPSBnYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHN1Ym1pdCgpIHtcclxuICAgICAgICAvLyBpZiAodGhpcy5uZXh0R2FtZS50aW1lciAmJiB0aGlzLm5leHRUaW1lTGltaXQgPiAtMSkge1xyXG4gICAgICAgIC8vICAgICB0aGlzLm5leHRHYW1lLnRpbWVyLnRpbWVsaW1pdCA9IHRoaXMubmV4dFRpbWVMaW1pdDtcclxuICAgICAgICAvLyAgICAgLy8gaWYgKHRoaXMubWFya2VkRm9yRGVsZXRlKVxyXG4gICAgICAgIC8vICAgICAvLyAgICAgZGVsZXRlIHRoaXMubmV4dEdhbWUubmV4dFsndGltZWxpbWl0J107XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAvL2lmIG5leHQgaW5mbyBoYXMgYmVlbiB1cGRhdGVkLCB3ZSBmb3JjZSBhIG5ldyB0aW1lclxyXG4gICAgICAgIC8vIGxldCBwcmV2TmV4dFVzZXIgPSBKU09OLnN0cmluZ2lmeSh0aGlzLm9yaWdpbmFsR2FtZS5uZXh0KTtcclxuICAgICAgICAvLyBsZXQgY3VyTmV4dFVzZXIgPSBKU09OLnN0cmluZ2lmeSh0aGlzLm5leHRHYW1lLm5leHQpO1xyXG4gICAgICAgIC8vIGlmIChwcmV2TmV4dFVzZXIgIT0gY3VyTmV4dFVzZXIgJiYgdHlwZW9mIHRoaXMubmV4dEdhbWUudGltZXIuc2V0ID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuc2V0VGltZWxpbWl0KClcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmtpY2tlZFBsYXllcnMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5raWNrID0gdGhpcy5raWNrZWRQbGF5ZXJzO1xyXG5cclxuICAgICAgICBnbG9iYWxzLmZpbmlzaCh0aGlzLm5leHRHYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBraWxsR2FtZSgpIHtcclxuICAgICAgICB0aGlzLm1hcmtlZEZvckRlbGV0ZSA9IHRydWU7XHJcbiAgICAgICAgZ2xvYmFscy5raWxsR2FtZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGxvZyhtc2cpIHtcclxuICAgICAgICBnbG9iYWxzLmxvZyhtc2cpO1xyXG4gICAgfVxyXG4gICAgZXJyb3IobXNnKSB7XHJcbiAgICAgICAgZ2xvYmFscy5lcnJvcihtc2cpO1xyXG4gICAgfVxyXG5cclxuICAgIGtpY2tQbGF5ZXIoaWQpIHtcclxuICAgICAgICB0aGlzLmtpY2tlZFBsYXllcnMucHVzaChpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1zZztcclxuICAgIH1cclxuXHJcbiAgICBzdGF0ZShrZXksIHZhbHVlKSB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuc3RhdGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnN0YXRlW2tleV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGVba2V5XSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHBsYXllckxpc3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMubmV4dEdhbWUucGxheWVycyk7XHJcbiAgICB9XHJcbiAgICBwbGF5ZXJDb3VudCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5wbGF5ZXJzKS5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheWVycyh1c2VyaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB1c2VyaWQgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW3VzZXJpZF07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucGxheWVyc1t1c2VyaWRdID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcnVsZXMocnVsZSwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHJ1bGUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ydWxlcztcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV07XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUucnVsZXNbcnVsZV0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcmV2KG9iaikge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnByZXYgPSBvYmo7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnByZXY7XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dChvYmopIHtcclxuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5uZXh0ID0gb2JqO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5uZXh0O1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRpbWVsaW1pdChzZWNvbmRzKSB7XHJcbiAgICAgICAgc2Vjb25kcyA9IHNlY29uZHMgfHwgdGhpcy5kZWZhdWx0U2Vjb25kcztcclxuICAgICAgICBpZiAoIXRoaXMubmV4dEdhbWUudGltZXIpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUudGltZXIgPSB7fTtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLnRpbWVyLnNldCA9IE1hdGgubWluKDYwLCBNYXRoLm1heCgxMCwgc2Vjb25kcykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlYWNoZWRUaW1lbGltaXQoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm1zZy50aW1lbGVmdCA9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1zZy50aW1lbGVmdCA8PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIGV2ZW50KG5hbWUpIHtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cy5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyRXZlbnRzKCkge1xyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzID0gW107XHJcbiAgICB9XHJcbiAgICBldmVudHMobmFtZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLmV2ZW50cztcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cy5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuZXcgRlNHKCk7IiwiaW1wb3J0IGZzZyBmcm9tICcuL2ZzZyc7XHJcblxyXG5pbXBvcnQgcXVlc3Rpb25zIGZyb20gJy4vcXVlc3Rpb25zJztcclxuXHJcbmxldCBkZWZhdWx0R2FtZSA9IHtcclxuICAgIHN0YXRlOiB7XHJcbiAgICAgICAgcWlkOiAwLFxyXG4gICAgICAgIGhpc3Rvcnk6IFtdLFxyXG4gICAgICAgIGNhdGVnb3J5OiAnJyxcclxuICAgICAgICBxdWVzdGlvbjogJycsXHJcbiAgICAgICAgY2hvaWNlczogW10sXHJcbiAgICAgICAgcm91bmQ6IDBcclxuICAgIH0sXHJcbiAgICBwbGF5ZXJzOiB7fSxcclxuICAgIHJ1bGVzOiB7XHJcbiAgICAgICAgcm91bmRzOiAyLFxyXG4gICAgICAgIG1heHBsYXllcnM6IDJcclxuICAgIH0sXHJcbiAgICBuZXh0OiB7fSxcclxuICAgIGV2ZW50czogW11cclxufVxyXG5cclxuY2xhc3MgUG9wVHJpdmlhIHtcclxuXHJcbiAgICBvbk5ld0dhbWUoKSB7XHJcbiAgICAgICAgZnNnLnNldEdhbWUoZGVmYXVsdEdhbWUpO1xyXG4gICAgICAgIHRoaXMuY2hlY2tTdGFydEdhbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBvblNraXAoKSB7XHJcbiAgICAgICAgaWYgKGZzZy5yZWFjaGVkVGltZWxpbWl0KCkpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tTdGFydEdhbWUoKSB7XHJcbiAgICAgICAgLy9pZiBwbGF5ZXIgY291bnQgcmVhY2hlZCByZXF1aXJlZCBsaW1pdCwgc3RhcnQgdGhlIGdhbWVcclxuICAgICAgICBsZXQgbWF4UGxheWVycyA9IGZzZy5ydWxlcygnbWF4UGxheWVycycpIHx8IDI7XHJcbiAgICAgICAgbGV0IHBsYXllckNvdW50ID0gZnNnLnBsYXllckNvdW50KCk7XHJcbiAgICAgICAgaWYgKHBsYXllckNvdW50ID49IG1heFBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKVxyXG4gICAgICAgICAgICAgICAgcGxheWVyc1tpZF0ucG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG5leHRSb3VuZCgpIHtcclxuICAgICAgICB0aGlzLnByb2Nlc3NDb3JyZWN0QW5zd2VycygpO1xyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuICAgICAgICBzdGF0ZS5yb3VuZCA9IHN0YXRlLnJvdW5kICsgMTtcclxuICAgICAgICBmc2cubmV4dCh7XHJcbiAgICAgICAgICAgIGlkOiAnKicsXHJcbiAgICAgICAgfSlcclxuICAgICAgICBmc2cuc2V0VGltZWxpbWl0KDUpO1xyXG5cclxuICAgICAgICB0aGlzLnJlc2V0UGxheWVyQ2hvaWNlcygpO1xyXG5cclxuICAgICAgICBsZXQgcnVsZXMgPSBmc2cucnVsZXMoKTtcclxuICAgICAgICBpZiAoc3RhdGUucm91bmQgPiBydWxlcy5yb3VuZHMpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzV2lubmVycygpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnByb2Nlc3NOZXh0UXVlc3Rpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICByZXNldFBsYXllckNob2ljZXMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IHBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBwbGF5ZXIuY2hvaWNlID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc05leHRRdWVzdGlvbigpIHtcclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuXHJcbiAgICAgICAgLy9maW5kIGEgcmFuZG9tIHF1ZXN0aW9uIG5vdCBhc2tlZCBiZWZvcmVcclxuICAgICAgICBsZXQgcWlkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcXVlc3Rpb25zLmxlbmd0aCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLmhpc3RvcnkuaW5jbHVkZXMocWlkKSkge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NOZXh0UXVlc3Rpb24oKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zZXR1cCBuZXh0IHF1ZXN0aW9uXHJcbiAgICAgICAgbGV0IHF1ZXN0aW9uID0gcXVlc3Rpb25zW3FpZF07XHJcbiAgICAgICAgc3RhdGUucWlkID0gcWlkO1xyXG4gICAgICAgIHN0YXRlLnF1ZXN0aW9uID0gcXVlc3Rpb24ucTtcclxuICAgICAgICBzdGF0ZS5jYXRlZ29yeSA9IHF1ZXN0aW9uLmM7XHJcbiAgICAgICAgaWYgKHF1ZXN0aW9uLnQgPT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgICAgIC8vYWx3YXlzIFRydWUgdGhlbiBGYWxzZSBpbiB0aGUgY2hvaWNlc1xyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzID0gWydUcnVlJywgJ0ZhbHNlJ11cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vc29ydCB0aGUgY2hvaWNlcyBhbHBoYWJldGljYWxseVxyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzID0gW107XHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMucHVzaChxdWVzdGlvbi5hKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWVzdGlvbi5pLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5jaG9pY2VzLnB1c2gocXVlc3Rpb24uaVtpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcy5zb3J0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vc2F2ZSB0aGlzIHF1ZXN0aW9uIGluIGhpc3RvcnkgdG8gYXZvaWQgY2hvb3NpbmcgYWdhaW5cclxuICAgICAgICBzdGF0ZS5oaXN0b3J5LnB1c2gocWlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzV2lubmVycygpIHtcclxuICAgICAgICBsZXQgcGxheWVyTGlzdCA9IFtdO1xyXG4gICAgICAgIGxldCBwbGF5ZXJJZHMgPSBbXTtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGZzZy5wbGF5ZXJzKCk7XHJcblxyXG4gICAgICAgIC8vYWRkIHBsYXllciBpZCBpbnRvIHRoZSBwbGF5ZXIgZGF0YVxyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgcGxheWVyc1tpZF0uaWQgPSBpZDtcclxuICAgICAgICAgICAgcGxheWVyTGlzdC5wdXNoKHBsYXllcnNbaWRdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc29ydCBhbGwgcGxheWVycyBieSB0aGVpciBwb2ludHNcclxuICAgICAgICBwbGF5ZXJMaXN0LnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgYi5wb2ludHMgLSBhLnBvaW50cztcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICAvL2dldCB0aGUgdG9wIDEwXHJcbiAgICAgICAgbGV0IHdpbm5lcnMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE1hdGgubWluKHBsYXllckxpc3QubGVuZ3RoLCAxMCk7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyTGlzdFtpXTtcclxuICAgICAgICAgICAgd2lubmVycy5wdXNoKHBsYXllci5pZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3JlbW92ZSBpZCwgc28gd2UgZG9uJ3Qgc2VuZCBvdmVyIG5ldHdvcmtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXJzW2lkXVsnaWQnXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG4gICAgICAgIHN0YXRlLndpbm5lcnMgPSB3aW5uZXJzO1xyXG4gICAgICAgIGZzZy5ldmVudHMoJ3dpbm5lcicpO1xyXG5cclxuICAgICAgICBmc2cua2lsbEdhbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzQ29ycmVjdEFuc3dlcnMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG4gICAgICAgIGlmIChzdGF0ZS5yb3VuZCA8PSAwKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vYXdhcmQgcG9pbnRzIGZvciBjb3JyZWN0IGNob2ljZXMsIHJlbW92ZSBwb2ludHMgZm9yIHdyb25nIGNob2ljZXNcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbGF5ZXIuY2hvaWNlID09ICd1bmRlZmluZWQnIHx8IHBsYXllci5jaG9pY2UgPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgbGV0IGFuc3dlciA9IHF1ZXN0aW9uc1tzdGF0ZS5xaWRdLmE7XHJcbiAgICAgICAgICAgIGxldCB1c2VyQ2hvaWNlID0gc3RhdGUuY2hvaWNlc1twbGF5ZXIuY2hvaWNlXTtcclxuICAgICAgICAgICAgaWYgKGFuc3dlciA9PSB1c2VyQ2hvaWNlKSB7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIucG9pbnRzICs9IDEwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnBvaW50cyAtPSAyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uSm9pbigpIHtcclxuICAgICAgICBsZXQgYWN0aW9uID0gZnNnLmFjdGlvbigpO1xyXG4gICAgICAgIGlmICghYWN0aW9uLnVzZXIuaWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHVzZXIgPSBmc2cucGxheWVycyhhY3Rpb24udXNlci5pZCk7XHJcbiAgICAgICAgaWYgKCF1c2VyKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vbmV3IHBsYXllciBkZWZhdWx0c1xyXG4gICAgICAgIHVzZXIucG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5jaGVja1N0YXJ0R2FtZSgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgb25MZWF2ZSgpIHtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGZzZy5wbGF5ZXJzKCk7XHJcbiAgICAgICAgaWYgKHBsYXllcnNbaWRdKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25QaWNrKCkge1xyXG5cclxuICAgICAgICBpZiAoZnNnLnJlYWNoZWRUaW1lbGltaXQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRSb3VuZCgpO1xyXG4gICAgICAgICAgICBmc2cubG9nKFwiUGljayBwYXNzZWQgdGltZWxpbWl0LCBnZXR0aW5nIG5ldyByb3VuZFwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN0YXRlID0gZnNnLnN0YXRlKCk7XHJcbiAgICAgICAgbGV0IGFjdGlvbiA9IGZzZy5hY3Rpb24oKTtcclxuICAgICAgICBsZXQgdXNlciA9IGZzZy5wbGF5ZXJzKGFjdGlvbi51c2VyLmlkKTtcclxuXHJcbiAgICAgICAgLy9nZXQgdGhlIHBpY2tlZCBjZWxsXHJcbiAgICAgICAgbGV0IGNob2ljZSA9IGFjdGlvbi5wYXlsb2FkLmNob2ljZTtcclxuXHJcbiAgICAgICAgaWYgKGNob2ljZSA8IDAgfHwgY2hvaWNlID4gc3RhdGUuY2hvaWNlcy5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdXNlci5jaG9pY2UgPSBjaG9pY2U7XHJcblxyXG4gICAgICAgIGZzZy5ldmVudCgncGlja2VkJyk7XHJcbiAgICAgICAgc3RhdGUucGlja2VkID0gdXNlci5pZDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IG5ldyBQb3BUcml2aWEoKTsiLCJleHBvcnQgZGVmYXVsdCBbXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogSmFwYW5lc2UgQW5pbWUgJiBNYW5nYVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIDE5ODggZmlsbSAmcXVvdDtBa2lyYSZxdW90OywgVGV0c3VvIGVuZHMgdXAgZGVzdHJveWluZyBUb2t5by5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW9ncmFwaHlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgYm9keSBvZiB0aGUgRWd5cHRpYW4gU3BoaW54IHdhcyBiYXNlZCBvbiB3aGljaCBhbmltYWw/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQnVsbFwiLFxyXG4gICAgICAgICAgICBcIkhvcnNlXCIsXHJcbiAgICAgICAgICAgIFwiRG9nXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHJlbGF0aW9uIHRvIHRoZSBCcml0aXNoIE9jY3VwYXRpb24gaW4gSXJlbGFuZCwgd2hhdCBkb2VzIHRoZSBJUkEgc3RhbmQgZm9yLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIklyaXNoIFJlcHVibGljYW4gQXJteVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSXJpc2ggUmViZWwgQWxsaWFuY2VcIixcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWZvcm1hdGlvbiBBcm15XCIsXHJcbiAgICAgICAgICAgIFwiSXJpc2gtUm95YWwgQWxsaWFuY2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgcm9ib3QgaW4gdGhlIDE5NTEgc2NpZW5jZSBmaWN0aW9uIGZpbG0gY2xhc3NpYyAmIzAzOTtUaGUgRGF5IHRoZSBFYXJ0aCBTdG9vZCBTdGlsbCYjMDM5Oz9cIixcclxuICAgICAgICBcImFcIjogXCJHb3J0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSb2JieVwiLFxyXG4gICAgICAgICAgICBcIkNvbG9zc3VzXCIsXHJcbiAgICAgICAgICAgIFwiQm94XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IE1hdGhlbWF0aWNzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBSb21hbiBudW1lcmFsIGZvciA1MDA/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTFwiLFxyXG4gICAgICAgICAgICBcIkNcIixcclxuICAgICAgICAgICAgXCJYXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbWFpbiBoZWFsaW5nIGl0ZW0gaW4gRGFyayBTb3Vscz9cIixcclxuICAgICAgICBcImFcIjogXCJFc3R1cyBGbGFza1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGVhbHRoIFBvdGlvblwiLFxyXG4gICAgICAgICAgICBcIk9yYW5nZSBKdWljZVwiLFxyXG4gICAgICAgICAgICBcIkFzaGVuIEZsYXNrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiT24gd2hpY2ggY29tcHV0ZXIgaGFyZHdhcmUgZGV2aWNlIGlzIHRoZSBCSU9TIGNoaXAgbG9jYXRlZD9cIixcclxuICAgICAgICBcImFcIjogXCJNb3RoZXJib2FyZFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFyZCBEaXNrIERyaXZlXCIsXHJcbiAgICAgICAgICAgIFwiQ2VudHJhbCBQcm9jZXNzaW5nIFVuaXRcIixcclxuICAgICAgICAgICAgXCJHcmFwaGljcyBQcm9jZXNzaW5nIFVuaXRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkEgdW5pdmVyc2FsIHNldCwgb3IgYSBzZXQgdGhhdCBjb250YWlucyBhbGwgc2V0cywgZXhpc3RzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBBY2UgQXR0b3JuZXkgdHJpbG9neSB3YXMgc3VwcG9zZSB0byBlbmQgd2l0aCAmcXVvdDtQaG9lbml4IFdyaWdodDogQWNlIEF0dG9ybmV5ICZtaW51czsgVHJpYWxzIGFuZCBUcmlidWxhdGlvbnMmcXVvdDsgYXMgaXRzIGZpbmFsIGdhbWUuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBoaWdoZXN0IGJlbHQgeW91IGNhbiBnZXQgaW4gVGFla3dvbmRvP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJXaGl0ZVwiLFxyXG4gICAgICAgICAgICBcIlJlZFwiLFxyXG4gICAgICAgICAgICBcIkdyZWVuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBVbml0ZWQgU3RhdGVzIERlcGFydG1lbnQgb2YgSG9tZWxhbmQgU2VjdXJpdHkgd2FzIGZvcm1lZCBpbiByZXNwb25zZSB0byB0aGUgU2VwdGVtYmVyIDExdGggYXR0YWNrcy5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBcG9sbG8gbWlzc2lvbiB3YXMgdGhlIGxhc3Qgb25lIGluIE5BU0EmIzAzOTtzIEFwb2xsbyBwcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFwb2xsbyAxN1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDEzXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDExXCIsXHJcbiAgICAgICAgICAgIFwiQXBvbGxvIDE1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlbmVyYWwgS25vd2xlZGdlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBpcyBhbiBleGlzdGluZyBmYW1pbHkgaW4gJnF1b3Q7VGhlIFNpbXMmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEdvdGggRmFtaWx5XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFNpbW9sZW9uIEZhbWlseVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBQcm91ZCBGYW1pbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSBOdWNsZWFyIFRocm9uZSwgd2hhdCBvcmdhbml6YXRpb24gY2hhc2VzIHRoZSBwbGF5ZXIgY2hhcmFjdGVyIHRocm91Z2hvdXQgdGhlIGdhbWU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVGhlIEkuRC5QLkRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGaXNobWVuXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEJhbmRpdHNcIixcclxuICAgICAgICAgICAgXCJUaGUgWS5WLkcuR1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gdGhlIGdhbWUgJnF1b3Q7Q2F2ZSBTdG9yeSwmcXVvdDsgd2hhdCBpcyB0aGUgY2hhcmFjdGVyIEJhbHJvZyYjMDM5O3MgY2F0Y2hwaHJhc2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSHV6emFoIVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWWVzIVwiLFxyXG4gICAgICAgICAgICBcIldob2EgdGhlcmUhXCIsXHJcbiAgICAgICAgICAgIFwiTnllaCBoZWggaGVoIVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJWZWhpY2xlc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9uZSBvZiB0aGVzZSBjaGFzc2lzIGNvZGVzIGFyZSB1c2VkIGJ5IEJNVyAzLXNlcmllcz9cIixcclxuICAgICAgICBcImFcIjogXCJFNDZcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkUzOVwiLFxyXG4gICAgICAgICAgICBcIkU4NVwiLFxyXG4gICAgICAgICAgICBcIkYxMFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDb21pY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiB3aGF0IEhvbWVzdHVjayBVcGRhdGUgd2FzIFtTXSBHYW1lIE92ZXIgcmVsZWFzZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiT2N0b2JlciAyNXRoLCAyMDE0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcHJpbCAxM3RoLCAyMDA5XCIsXHJcbiAgICAgICAgICAgIFwiQXByaWwgOHRoLCAyMDEyXCIsXHJcbiAgICAgICAgICAgIFwiQXVndXN0IDI4dGgsIDIwMDNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIHRoZSBiYW5kIG1lbWJlcnMgb2YgQW1lcmljYW4gcm9jayBiYW5kIEtpbmcgb2YgTGVvbj9cIixcclxuICAgICAgICBcImFcIjogXCJCcm90aGVycyAmYW1wOyBjb3VzaW5zXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaGlsZGhvb2QgZnJpZW5kc1wiLFxyXG4gICAgICAgICAgICBcIkZvcm1lciBjbGFzc21hdGVzXCIsXHJcbiAgICAgICAgICAgIFwiRnJhdGVybml0eSBob3VzZSBtZW1iZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBmcmFuY2hpc2UgaGFkIGEgc3BlY2lhbCBldmVudCBob3N0ZWQgaW4gdGhlIHBvcHVsYXIgTU1PUlBHIEZpbmFsIEZhbnRhc3kgWElWOiBBIFJlYWxtIFJlYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCJZby1rYWkgV2F0Y2hcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlBvayZlYWN1dGU7bW9uXCIsXHJcbiAgICAgICAgICAgIFwiWXUtZ2ktb2hcIixcclxuICAgICAgICAgICAgXCJCdWRkeWZpZ2h0XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggS2luZ2RvbSBIZWFydHMgZ2FtZSBmZWF0dXJlZCB0aGUgY2FzdCBvZiAmcXVvdDtUaGUgV29ybGQgRW5kcyBXaXRoIFlvdSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEcmVhbSBEcm9wIERpc3RhbmNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCaXJ0aCBCeSBTbGVlcFwiLFxyXG4gICAgICAgICAgICBcIjM2NS8yIERheXNcIixcclxuICAgICAgICAgICAgXCJSZTpDaGFpbiBvZiBNZW1vcmllc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGxhcmdlc3QgcGxhbmV0IGluIEtlcmJhbCBTcGFjZSBQcm9ncmFtP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkpvb2xcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkVlbG9vXCIsXHJcbiAgICAgICAgICAgIFwiS2VyYm9sXCIsXHJcbiAgICAgICAgICAgIFwiTWlubXVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggQW5pbWFsIENyb3NzaW5nIGdhbWUgd2FzIGZvciB0aGUgTmludGVuZG8gV2lpP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkFuaW1hbCBDcm9zc2luZzogQ2l0eSBGb2xrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IE5ldyBMZWFmXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBXaWxkIFdvcmxkXCIsXHJcbiAgICAgICAgICAgIFwiQW5pbWFsIENyb3NzaW5nOiBQb3B1bGF0aW9uIEdyb3dpbmchXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkdlb3JnZSBMdWNhcyBkaXJlY3RlZCB0aGUgZW50aXJlIG9yaWdpbmFsIFN0YXIgV2FycyB0cmlsb2d5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgY2l0eSBvZiBSb21lLCBJdGFseSBmb3VuZGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjc1MyBCQ0VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjkwMiBCQ0VcIixcclxuICAgICAgICAgICAgXCI1MjQgQkNFXCIsXHJcbiAgICAgICAgICAgIFwiNjk3IEJDRVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBDb21wdXRlcnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBkYXRhIHN0cnVjdHVyZSBkb2VzIEZJTE8gYXBwbHkgdG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiU3RhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlF1ZXVlXCIsXHJcbiAgICAgICAgICAgIFwiSGVhcFwiLFxyXG4gICAgICAgICAgICBcIlRyZWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gQmF0dGxlc3RhciBHYWxhY3RpY2EgKDIwMDQpLCBDeWxvbnMgd2VyZSBjcmVhdGVkIGJ5IG1hbiBhcyBjeWJlcm5ldGljIHdvcmtlcnMgYW5kIHNvbGRpZXJzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgMjAxNiBEaXNuZXkgYW5pbWF0ZWQgZmlsbSAmIzAzOTtNb2FuYSYjMDM5OyBpcyBiYXNlZCBvbiB3aGljaCBjdWx0dXJlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbHluZXNpYW5cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk5hdGl2ZSBBbWVyaWNhblwiLFxyXG4gICAgICAgICAgICBcIkphcGFuZXNlXCIsXHJcbiAgICAgICAgICAgIFwiTm9yZGljXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2FrZSBkZXBpY3RlZCBpbiBWYWx2ZSYjMDM5O3MgJnF1b3Q7UG9ydGFsJnF1b3Q7IGZyYW5jaGlzZSBtb3N0IGNsb3NlbHkgcmVzZW1ibGVzIHdoaWNoIHJlYWwtd29ybGQgdHlwZSBvZiBjYWtlP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWNrIEZvcmVzdFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRGV2aWwmIzAzOTtzIEZvb2RcIixcclxuICAgICAgICAgICAgXCJNb2x0ZW4gQ2hvY29sYXRlXCIsXHJcbiAgICAgICAgICAgIFwiR2VybWFuIENob2NvbGF0ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlICYgTmF0dXJlXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgY2hlbWljYWwgZWxlbWVudCBMaXRoaXVtIGlzIG5hbWVkIGFmdGVyIHRoZSBjb3VudHJ5IG9mIExpdGh1YW5pYS5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBHYWRnZXRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hlbiB3YXMgdGhlIERWRCBpbnZlbnRlZD9cIixcclxuICAgICAgICBcImFcIjogXCIxOTk1XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMDAwXCIsXHJcbiAgICAgICAgICAgIFwiMTk5MFwiLFxyXG4gICAgICAgICAgICBcIjE5ODBcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgZnVsbCBuYW1lIG9mIHRoZSBmb290YmFsbGVyICZxdW90O0NyaXN0aWFubyBSb25hbGRvJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkNyaXN0aWFubyBSb25hbGRvIGRvcyBTYW50b3MgQXZlaXJvXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gUm9uYWxkbyBsb3MgU2FudG9zIERpZWdvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEFybWFuZG8gRGllZ28gUm9uYWxkb1wiLFxyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBMdWlzIEFybWFuZG8gUm9uYWxkb1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJIaXN0b3J5XCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlc2UgdHdvIGNvdW50cmllcyBoZWxkIGEgY29tbW9ud2VhbHRoIGZyb20gdGhlIDE2dGggdG8gMTh0aCBjZW50dXJ5LlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlBvbGFuZCBhbmQgTGl0aHVhbmlhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIdXR1IGFuZCBSd2FuZGFcIixcclxuICAgICAgICAgICAgXCJOb3J0aCBLb3JlYSBhbmQgU291dGggS29yZWFcIixcclxuICAgICAgICAgICAgXCJCYW5nbGFkZXNoIGFuZCBCaHV0YW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0NhbGwgT2YgRHV0eTogWm9tYmllcyZxdW90OywgY29tcGxldGluZyB3aGljaCBtYXAmIzAzOTtzIG1haW4gZWFzdGVyIGVnZyB3aWxsIHJld2FyZCB5b3Ugd2l0aCB0aGUgYWNoaWV2ZW1lbnQsICZxdW90O0hpZ2ggTWFpbnRlbmFuY2UmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRGllIFJpc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1vYiBPZiBUaGUgRGVhZFwiLFxyXG4gICAgICAgICAgICBcIk9yaWdpbnNcIixcclxuICAgICAgICAgICAgXCJBc2NlbnNpb25cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogQ2FydG9vbiAmIEFuaW1hdGlvbnNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtHcmF2aXR5IEZhbGxzJnF1b3Q7LCBob3cgbXVjaCBkb2VzIFdhZGRsZXMgd2VpZ2ggd2hlbiBNYWJsZSB3aW5zIGhpbSBpbiAmcXVvdDtUaGUgVGltZSBUcmF2ZWxlciYjMDM5O3MgUGlnJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE1IHBvdW5kc1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMjAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMTAgcG91bmRzXCIsXHJcbiAgICAgICAgICAgIFwiMzAgcG91bmRzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgZ2l2ZW4gdG8gbGF5ZXIgNCBvZiB0aGUgT3BlbiBTeXN0ZW1zIEludGVyY29ubmVjdGlvbiAoSVNPKSBtb2RlbD9cIixcclxuICAgICAgICBcImFcIjogXCJUcmFuc3BvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlNlc3Npb25cIixcclxuICAgICAgICAgICAgXCJEYXRhIGxpbmtcIixcclxuICAgICAgICAgICAgXCJOZXR3b3JrXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNwb3J0c1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCB5ZWFyIHdhcyBob2NrZXkgbGVnZW5kIFdheW5lIEdyZXR6a3kgYm9ybj9cIixcclxuICAgICAgICBcImFcIjogXCIxOTYxXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIxOTY1XCIsXHJcbiAgICAgICAgICAgIFwiMTk1OVwiLFxyXG4gICAgICAgICAgICBcIjE5NjNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkhvdyBtYW55IGdhbWVzIGFyZSB0aGVyZSBpbiB0aGUgJnF1b3Q7Q29sb255IFdhcnMmcXVvdDsgc2VyaWVzIGZvciB0aGUgUGxheVN0YXRpb24/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiM1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiMlwiLFxyXG4gICAgICAgICAgICBcIjRcIixcclxuICAgICAgICAgICAgXCI1XCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gV29ybGQgb2YgV2FyY3JhZnQsIHdoaWNoIHJhaWQgaW5zdGFuY2UgZmVhdHVyZXMgYSBjaGVzcyBldmVudD9cIixcclxuICAgICAgICBcImFcIjogXCJLYXJhemhhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiWnVsJiMwMzk7QW1hblwiLFxyXG4gICAgICAgICAgICBcIkJsYWNrd2luZyBMYWlyXCIsXHJcbiAgICAgICAgICAgIFwiVGVtcGxlIG9mIEFobiYjMDM5O1FpcmFqXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBjb3VudHJ5IHdhcyBKb3NlZiBTdGFsaW4gYm9ybiBpbj9cIixcclxuICAgICAgICBcImFcIjogXCJHZW9yZ2lhXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJSdXNzaWFcIixcclxuICAgICAgICAgICAgXCJHZXJtYW55XCIsXHJcbiAgICAgICAgICAgIFwiUG9sYW5kXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IE11c2ljXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgb2ZmaWNpYWwgbmFtZSBvZiBQcmluY2UmIzAzOTtzIGJhY2tpbmcgYmFuZD9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgUmV2b2x1dGlvblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIFBhdXBlcnNcIixcclxuICAgICAgICAgICAgXCJUaGUgV2FpbGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBIZWFydGJyZWFrZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIEdhbWUgb2YgVGhyb25lcyB3aGF0IGlzIHRoZSBuYW1lIG9mIEpvbiBTbm93JiMwMzk7cyBzd29yZD9cIixcclxuICAgICAgICBcImFcIjogXCJMb25nY2xhd1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiT2F0aGtlZXBlclwiLFxyXG4gICAgICAgICAgICBcIldpZG93JiMwMzk7cyBXYWlsXCIsXHJcbiAgICAgICAgICAgIFwiTmVlZGxlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFRlbGV2aXNpb25cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIGluc3BlY3RvciBpbiB0aGUgc2VyaWVzICZxdW90O09uIHRoZSBCdXNlcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJCbGFrZXlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkhhcnBlclwiLFxyXG4gICAgICAgICAgICBcIk5haWx5XCIsXHJcbiAgICAgICAgICAgIFwiR2FsbHlcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGFydGlzdCBjdXJhdGVkIHRoZSBvZmZpY2lhbCBzb3VuZHRyYWNrIGZvciAmcXVvdDtUaGUgSHVuZ2VyIEdhbWVzOiBNb2NraW5namF5IC0gUGFydCAxJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvcmRlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJLYW55ZSBXZXN0XCIsXHJcbiAgICAgICAgICAgIFwiVG92ZSBMb1wiLFxyXG4gICAgICAgICAgICBcIkNoYXJsaSBYQ1hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGUgQ2FuYWRpYW4gJDEgY29pbiBpcyBjb2xsb3F1aWFsbHkga25vd24gYXMgYSB3aGF0P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvb25pZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiRm9vbGllXCIsXHJcbiAgICAgICAgICAgIFwiTW9vZGllXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZXNlIGZvdW5kaW5nIGZhdGhlcnMgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgb2YgQW1lcmljYSBsYXRlciBiZWNhbWUgcHJlc2lkZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkphbWVzIE1vbnJvZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiQWxleGFuZGVyIEhhbWlsdG9uXCIsXHJcbiAgICAgICAgICAgIFwiU2FtdWVsIEFkYW1zXCIsXHJcbiAgICAgICAgICAgIFwiUm9nZXIgU2hlcm1hblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIERpdmluaXR5OiBPcmlnaW5hbCBTaW4gSUksIHdoYXQgaXMgdGhlIG5hbWUgb2YgdGhlIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXI/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFuZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTG9oc2VcIixcclxuICAgICAgICAgICAgXCJUaGUgUmVkIFByaW5jZVwiLFxyXG4gICAgICAgICAgICBcIlRoZXJlIGFyZSBubyBza2VsZXRhbCBvcmlnaW4gY2hhcmFjdGVyc1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldobyBpcyB0aGUgbWFpbiBwcm90YWdvbmlzdCBpbiB0aGUgZ2FtZSBMaWZlIGlzIFN0cmFuZ2U6IEJlZm9yZSBUaGUgU3Rvcm0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ2hsb2UgUHJpY2UgXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNYXggQ2F1bGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiUmFjaGVsIEFtYmVyXCIsXHJcbiAgICAgICAgICAgIFwiRnJhbmsgQm93ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IEZpbG1cIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkpvaG5ueSBEZXBwIG1hZGUgaGlzIGJpZy1zY3JlZW4gYWN0aW5nIGRlYnV0IGluIHdoaWNoIGZpbG0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQSBOaWdodG1hcmUgb24gRWxtIFN0cmVldFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTXkgQmxvb2R5IFZhbGVudGluZVwiLFxyXG4gICAgICAgICAgICBcIkhhbGxvd2VlblwiLFxyXG4gICAgICAgICAgICBcIkZyaWRheSB0aGUgMTN0aFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiAmcXVvdDtSZXNpZGVudCBFdmlsJnF1b3Q7LCBvbmx5IENocmlzIGhhcyBhY2Nlc3MgdG8gdGhlIGdyZW5hZGUgbGF1bmNoZXIuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIG9mIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVycyBpcyBOT1QgcGxheWFibGUgaW4gJnF1b3Q7UmVzaWRlbnQgRXZpbCA2JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkppbGwgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJDaHJpcyBSZWRmaWVsZFwiLFxyXG4gICAgICAgICAgICBcIlNoZXJyeSBCaXJraW5cIixcclxuICAgICAgICAgICAgXCJIZWxlbmEgSGFycGVyXCJcclxuICAgICAgICBdXHJcbiAgICB9XHJcbl0iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsImltcG9ydCBmc2cgZnJvbSAnLi9mc2cnO1xyXG5pbXBvcnQgUG9wVHJpdmlhIGZyb20gJy4vZ2FtZSc7XHJcblxyXG5cclxuXHJcbmZzZy5vbignbmV3Z2FtZScsICgpID0+IFBvcFRyaXZpYS5vbk5ld0dhbWUoKSk7XHJcbmZzZy5vbignc2tpcCcsICgpID0+IFBvcFRyaXZpYS5vblNraXAoKSk7XHJcbmZzZy5vbignam9pbicsICgpID0+IFBvcFRyaXZpYS5vbkpvaW4oKSk7XHJcbmZzZy5vbignbGVhdmUnLCAoKSA9PiBQb3BUcml2aWEub25MZWF2ZSgpKTtcclxuZnNnLm9uKCdwaWNrJywgKCkgPT4gUG9wVHJpdmlhLm9uUGljaygpKTtcclxuXHJcbmZzZy5zdWJtaXQoKTsiXSwic291cmNlUm9vdCI6IiJ9