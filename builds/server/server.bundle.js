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
        this.nextTimeLimit = this.originalGame.next && this.originalGame.next.timelimit || 0;
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
        delete this.nextGame.deadline;
        delete this.nextGame.now;
    }

    reachedTimeLimit() {
        return this.originalGame.next.deadline && this.originalGame.next.now && this.originalGame.next.now >= this.originalGame.next.deadline;
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


        if (_fsg__WEBPACK_IMPORTED_MODULE_0__.default.reachedTimeLimit())
            this.nextRound();
    }

    nextRound() {
        this.processCorrectAnswers();

        let state = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.state();
        state.round = state.round + 1;
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.next({
            id: '*',
        })
        _fsg__WEBPACK_IMPORTED_MODULE_0__.default.setTimeLimit(20);

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

    onLeave() {
        let players = _fsg__WEBPACK_IMPORTED_MODULE_0__.default.players();
        if (players[id]) {
            delete players[id];
        }
    }

    onPick() {

        if (_fsg__WEBPACK_IMPORTED_MODULE_0__.default.reachedTimeLimit()) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vRzpcXEdpdEh1YlxcZnNnLXBsYXRmb3JtXFx0ZW1wbGF0ZXNcXHBvcHRyaXZpYVxcZ2FtZS1zZXJ2ZXJcXGZzZy5qcyIsImZpbGU6Ly8vRzpcXEdpdEh1YlxcZnNnLXBsYXRmb3JtXFx0ZW1wbGF0ZXNcXHBvcHRyaXZpYVxcZ2FtZS1zZXJ2ZXJcXGdhbWUuanMiLCJmaWxlOi8vL0c6XFxHaXRIdWJcXGZzZy1wbGF0Zm9ybVxcdGVtcGxhdGVzXFxwb3B0cml2aWFcXGdhbWUtc2VydmVyXFxxdWVzdGlvbnMuanMiLCJmaWxlOi8vL3dlYnBhY2svYm9vdHN0cmFwIiwiZmlsZTovLy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJmaWxlOi8vL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJmaWxlOi8vL0c6XFxHaXRIdWJcXGZzZy1wbGF0Zm9ybVxcdGVtcGxhdGVzXFxwb3B0cml2aWFcXGdhbWUtc2VydmVyXFxpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1EQUFtRCxnQkFBZ0IsaUNBQWlDO0FBQ3BHO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGdDQUFnQztBQUNoQztBQUNBLHlDQUF5QztBQUN6QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FB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QUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx3Q0FBd0MseUNBQXlDO1dBQ2pGO1dBQ0E7V0FDQSxFOzs7OztXQ1BBLHdGOzs7Ozs7Ozs7Ozs7QUNBd0I7QUFDTzs7OztBQUkvQiw0Q0FBTSxrQkFBa0Isb0RBQW1CO0FBQzNDLDRDQUFNLGVBQWUsaURBQWdCO0FBQ3JDLDRDQUFNLGVBQWUsaURBQWdCO0FBQ3JDLDRDQUFNLGdCQUFnQixrREFBaUI7QUFDdkMsNENBQU0sZUFBZSxpREFBZ0I7O0FBRXJDLGdEQUFVLEciLCJmaWxlIjoic2VydmVyLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5jbGFzcyBGU0cge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5tc2cgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGdsb2JhbHMuYWN0aW9uKCkpKTtcclxuICAgICAgICB0aGlzLm9yaWdpbmFsR2FtZSA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoZ2xvYmFscy5nYW1lKCkpKTtcclxuICAgICAgICB0aGlzLm5leHRHYW1lID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShnbG9iYWxzLmdhbWUoKSkpO1xyXG4gICAgICAgIHRoaXMuaXNOZXdHYW1lID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5tYXJrZWRGb3JEZWxldGUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLm5leHRUaW1lTGltaXQgPSB0aGlzLm9yaWdpbmFsR2FtZS5uZXh0ICYmIHRoaXMub3JpZ2luYWxHYW1lLm5leHQudGltZWxpbWl0IHx8IDA7XHJcbiAgICAgICAgdGhpcy5raWNrZWRQbGF5ZXJzID0gW107XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5uZXh0R2FtZSB8fCBPYmplY3Qua2V5cyh0aGlzLm5leHRHYW1lLnJ1bGVzKS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmlzTmV3R2FtZSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3IoJ01pc3NpbmcgUnVsZXMnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm5leHRHYW1lKSB7XHJcbiAgICAgICAgICAgIGlmICghKCdzdGF0ZScgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUuc3RhdGUgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoISgncGxheWVycycgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUucGxheWVycyA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICghKCdwcmV2JyBpbiB0aGlzLm5leHRHYW1lKSkge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLnByZXYgPSB7fTtcclxuICAgICAgICAgICAgLy99XHJcblxyXG4gICAgICAgICAgICBpZiAoISgnbmV4dCcgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dEdhbWUubmV4dCA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoISgncnVsZXMnIGluIHRoaXMubmV4dEdhbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRHYW1lLnJ1bGVzID0ge307XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCEoJ2V2ZW50cycgaW4gdGhpcy5uZXh0R2FtZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5uZXh0R2FtZS5ldmVudHMgPSBbXTtcclxuICAgICAgICAgICAgLy99XHJcbiAgICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9uKHR5cGUsIGNiKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubXNnLnR5cGUgIT0gdHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSAnbmV3Z2FtZScgJiYgdGhpcy5pc05ld0dhbWUpIHtcclxuICAgICAgICAgICAgICAgIGNiKHRoaXMubXNnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzLm5leHRHYW1lID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdEdhbWUsIHsgcGxheWVyczogdGhpcy5uZXh0R2FtZS5wbGF5ZXJzIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2IodGhpcy5tc2cpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEdhbWUoZ2FtZSkge1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMubmV4dEdhbWUucGxheWVycykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgZ2FtZS5wbGF5ZXJzW2lkXSA9IHsgbmFtZTogcGxheWVyLm5hbWUgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL2dhbWUucGxheWVycyA9IE9iamVjdC5hc3NpZ24oe30sIGdhbWUucGxheWVycywgdGhpcy5uZXh0R2FtZS5wbGF5ZXJzKVxyXG4gICAgICAgIHRoaXMubmV4dEdhbWUgPSBnYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHN1Ym1pdCgpIHtcclxuICAgICAgICBpZiAodGhpcy5uZXh0R2FtZS5uZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUubmV4dC50aW1lbGltaXQgPSB0aGlzLm5leHRUaW1lTGltaXQ7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1hcmtlZEZvckRlbGV0ZSlcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm5leHRHYW1lLm5leHRbJ3RpbWVsaW1pdCddO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMua2lja2VkUGxheWVycy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLmtpY2sgPSB0aGlzLmtpY2tlZFBsYXllcnM7XHJcblxyXG4gICAgICAgIGdsb2JhbHMuZmluaXNoKHRoaXMubmV4dEdhbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGtpbGxHYW1lKCkge1xyXG4gICAgICAgIHRoaXMubWFya2VkRm9yRGVsZXRlID0gdHJ1ZTtcclxuICAgICAgICBnbG9iYWxzLmtpbGxHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgbG9nKG1zZykge1xyXG4gICAgICAgIGdsb2JhbHMubG9nKG1zZyk7XHJcbiAgICB9XHJcbiAgICBlcnJvcihtc2cpIHtcclxuICAgICAgICBnbG9iYWxzLmVycm9yKG1zZyk7XHJcbiAgICB9XHJcblxyXG4gICAga2lja1BsYXllcihpZCkge1xyXG4gICAgICAgIHRoaXMua2lja2VkUGxheWVycy5wdXNoKGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubXNnO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRlKGtleSwgdmFsdWUpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5zdGF0ZTtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUuc3RhdGVba2V5XTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS5zdGF0ZVtrZXldID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcGxheWVyTGlzdCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5uZXh0R2FtZS5wbGF5ZXJzKTtcclxuICAgIH1cclxuICAgIHBsYXllckNvdW50KCkge1xyXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLm5leHRHYW1lLnBsYXllcnMpLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBwbGF5ZXJzKHVzZXJpZCwgdmFsdWUpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHVzZXJpZCA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnBsYXllcnM7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnBsYXllcnNbdXNlcmlkXTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS5wbGF5ZXJzW3VzZXJpZF0gPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBydWxlcyhydWxlLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgcnVsZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLnJ1bGVzO1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0R2FtZS5ydWxlc1tydWxlXTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0R2FtZS5ydWxlc1tydWxlXSA9IHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHByZXYob2JqKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dEdhbWUucHJldiA9IG9iajtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dEdhbWUucHJldjtcclxuICAgIH1cclxuXHJcbiAgICBuZXh0KG9iaikge1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLm5leHRHYW1lLm5leHQgPSBvYmo7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLm5leHQ7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGltZUxpbWl0KHNlY29uZHMpIHtcclxuICAgICAgICB0aGlzLm5leHRUaW1lTGltaXQgPSBNYXRoLm1pbig2MCwgTWF0aC5tYXgoMTAsIHNlY29uZHMpKTtcclxuICAgICAgICBkZWxldGUgdGhpcy5uZXh0R2FtZS5kZWFkbGluZTtcclxuICAgICAgICBkZWxldGUgdGhpcy5uZXh0R2FtZS5ub3c7XHJcbiAgICB9XHJcblxyXG4gICAgcmVhY2hlZFRpbWVMaW1pdCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vcmlnaW5hbEdhbWUubmV4dC5kZWFkbGluZSAmJiB0aGlzLm9yaWdpbmFsR2FtZS5uZXh0Lm5vdyAmJiB0aGlzLm9yaWdpbmFsR2FtZS5uZXh0Lm5vdyA+PSB0aGlzLm9yaWdpbmFsR2FtZS5uZXh0LmRlYWRsaW5lO1xyXG4gICAgfVxyXG5cclxuICAgIGV2ZW50KG5hbWUpIHtcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cy5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyRXZlbnRzKCkge1xyXG4gICAgICAgIHRoaXMubmV4dEdhbWUuZXZlbnRzID0gW107XHJcbiAgICB9XHJcbiAgICBldmVudHMobmFtZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRHYW1lLmV2ZW50cztcclxuICAgICAgICB0aGlzLm5leHRHYW1lLmV2ZW50cy5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBuZXcgRlNHKCk7IiwiaW1wb3J0IGZzZyBmcm9tICcuL2ZzZyc7XHJcblxyXG5pbXBvcnQgcXVlc3Rpb25zIGZyb20gJy4vcXVlc3Rpb25zJztcclxuXHJcbmxldCBkZWZhdWx0R2FtZSA9IHtcclxuICAgIHN0YXRlOiB7XHJcbiAgICAgICAgcWlkOiAwLFxyXG4gICAgICAgIGhpc3Rvcnk6IFtdLFxyXG4gICAgICAgIGNhdGVnb3J5OiAnJyxcclxuICAgICAgICBxdWVzdGlvbjogJycsXHJcbiAgICAgICAgY2hvaWNlczogW10sXHJcbiAgICAgICAgcm91bmQ6IDBcclxuICAgIH0sXHJcbiAgICBwbGF5ZXJzOiB7fSxcclxuICAgIHJ1bGVzOiB7XHJcbiAgICAgICAgcm91bmRzOiAxMCxcclxuICAgICAgICBtYXhwbGF5ZXJzOiAyXHJcbiAgICB9LFxyXG4gICAgbmV4dDoge30sXHJcbiAgICBldmVudHM6IFtdXHJcbn1cclxuXHJcbmNsYXNzIFBvcFRyaXZpYSB7XHJcblxyXG4gICAgb25OZXdHYW1lKCkge1xyXG4gICAgICAgIGZzZy5zZXRHYW1lKGRlZmF1bHRHYW1lKTtcclxuICAgICAgICB0aGlzLmNoZWNrU3RhcnRHYW1lKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25Ta2lwKCkge1xyXG5cclxuXHJcbiAgICAgICAgaWYgKGZzZy5yZWFjaGVkVGltZUxpbWl0KCkpXHJcbiAgICAgICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dFJvdW5kKCkge1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc0NvcnJlY3RBbnN3ZXJzKCk7XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG4gICAgICAgIHN0YXRlLnJvdW5kID0gc3RhdGUucm91bmQgKyAxO1xyXG4gICAgICAgIGZzZy5uZXh0KHtcclxuICAgICAgICAgICAgaWQ6ICcqJyxcclxuICAgICAgICB9KVxyXG4gICAgICAgIGZzZy5zZXRUaW1lTGltaXQoMjApO1xyXG5cclxuICAgICAgICB0aGlzLnJlc2V0UGxheWVyQ2hvaWNlcygpO1xyXG5cclxuICAgICAgICBsZXQgcnVsZXMgPSBmc2cucnVsZXMoKTtcclxuICAgICAgICBpZiAoc3RhdGUucm91bmQgPiBydWxlcy5yb3VuZHMpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzV2lubmVycygpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnByb2Nlc3NOZXh0UXVlc3Rpb24oKTtcclxuICAgIH1cclxuXHJcbiAgICByZXNldFBsYXllckNob2ljZXMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgbGV0IHBsYXllciA9IHBsYXllcnNbaWRdO1xyXG4gICAgICAgICAgICBwbGF5ZXIuY2hvaWNlID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc05leHRRdWVzdGlvbigpIHtcclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuXHJcbiAgICAgICAgLy9maW5kIGEgcmFuZG9tIHF1ZXN0aW9uIG5vdCBhc2tlZCBiZWZvcmVcclxuICAgICAgICBsZXQgcWlkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcXVlc3Rpb25zLmxlbmd0aCk7XHJcbiAgICAgICAgaWYgKHN0YXRlLmhpc3RvcnkuaW5jbHVkZXMocWlkKSkge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NOZXh0UXVlc3Rpb24oKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zZXR1cCBuZXh0IHF1ZXN0aW9uXHJcbiAgICAgICAgbGV0IHF1ZXN0aW9uID0gcXVlc3Rpb25zW3FpZF07XHJcbiAgICAgICAgc3RhdGUucWlkID0gcWlkO1xyXG4gICAgICAgIHN0YXRlLnF1ZXN0aW9uID0gcXVlc3Rpb24ucTtcclxuICAgICAgICBzdGF0ZS5jYXRlZ29yeSA9IHF1ZXN0aW9uLmM7XHJcbiAgICAgICAgaWYgKHF1ZXN0aW9uLnQgPT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgICAgIC8vYWx3YXlzIFRydWUgdGhlbiBGYWxzZSBpbiB0aGUgY2hvaWNlc1xyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzID0gWydUcnVlJywgJ0ZhbHNlJ11cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vc29ydCB0aGUgY2hvaWNlcyBhbHBoYWJldGljYWxseVxyXG4gICAgICAgICAgICBzdGF0ZS5jaG9pY2VzID0gW107XHJcbiAgICAgICAgICAgIHN0YXRlLmNob2ljZXMucHVzaChxdWVzdGlvbi5hKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWVzdGlvbi5pLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5jaG9pY2VzLnB1c2gocXVlc3Rpb24uaVtpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RhdGUuY2hvaWNlcy5zb3J0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vc2F2ZSB0aGlzIHF1ZXN0aW9uIGluIGhpc3RvcnkgdG8gYXZvaWQgY2hvb3NpbmcgYWdhaW5cclxuICAgICAgICBzdGF0ZS5oaXN0b3J5LnB1c2gocWlkKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzV2lubmVycygpIHtcclxuICAgICAgICBsZXQgcGxheWVyTGlzdCA9IFtdO1xyXG4gICAgICAgIGxldCBwbGF5ZXJJZHMgPSBbXTtcclxuICAgICAgICBsZXQgcGxheWVycyA9IGZzZy5wbGF5ZXJzKCk7XHJcblxyXG4gICAgICAgIC8vYWRkIHBsYXllciBpZCBpbnRvIHRoZSBwbGF5ZXIgZGF0YVxyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHBsYXllcnMpIHtcclxuICAgICAgICAgICAgcGxheWVyc1tpZF0uaWQgPSBpZDtcclxuICAgICAgICAgICAgcGxheWVyTGlzdC5wdXNoKHBsYXllcnNbaWRdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc29ydCBhbGwgcGxheWVycyBieSB0aGVpciBwb2ludHNcclxuICAgICAgICBwbGF5ZXJMaXN0LnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgYi5wb2ludHMgLSBhLnBvaW50cztcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICAvL2dldCB0aGUgdG9wIDEwXHJcbiAgICAgICAgbGV0IHdpbm5lcnMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE1hdGgubWluKHBsYXllckxpc3QubGVuZ3RoLCAxMCk7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgcGxheWVyID0gcGxheWVyTGlzdFtpXTtcclxuICAgICAgICAgICAgd2lubmVycy5wdXNoKHBsYXllci5pZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3JlbW92ZSBpZCwgc28gd2UgZG9uJ3Qgc2VuZCBvdmVyIG5ldHdvcmtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBwbGF5ZXJzW2lkXVsnaWQnXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG4gICAgICAgIHN0YXRlLndpbm5lcnMgPSB3aW5uZXJzO1xyXG4gICAgICAgIGZzZy5ldmVudHMoJ3dpbm5lcicpO1xyXG5cclxuICAgICAgICBmc2cua2lsbEdhbWUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzQ29ycmVjdEFuc3dlcnMoKSB7XHJcbiAgICAgICAgbGV0IHBsYXllcnMgPSBmc2cucGxheWVycygpO1xyXG4gICAgICAgIGxldCBzdGF0ZSA9IGZzZy5zdGF0ZSgpO1xyXG4gICAgICAgIGlmIChzdGF0ZS5yb3VuZCA8PSAwKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vYXdhcmQgcG9pbnRzIGZvciBjb3JyZWN0IGNob2ljZXMsIHJlbW92ZSBwb2ludHMgZm9yIHdyb25nIGNob2ljZXNcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBwbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXIgPSBwbGF5ZXJzW2lkXTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwbGF5ZXIuY2hvaWNlID09ICd1bmRlZmluZWQnIHx8IHBsYXllci5jaG9pY2UgPT0gbnVsbClcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgbGV0IGFuc3dlciA9IHF1ZXN0aW9uc1tzdGF0ZS5xaWRdLmE7XHJcbiAgICAgICAgICAgIGxldCB1c2VyQ2hvaWNlID0gc3RhdGUuY2hvaWNlc1twbGF5ZXIuY2hvaWNlXTtcclxuICAgICAgICAgICAgaWYgKGFuc3dlciA9PSB1c2VyQ2hvaWNlKSB7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIucG9pbnRzICs9IDEwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnBvaW50cyAtPSAyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uSm9pbigpIHtcclxuICAgICAgICBsZXQgYWN0aW9uID0gZnNnLmFjdGlvbigpO1xyXG4gICAgICAgIGlmICghYWN0aW9uLnVzZXIuaWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHVzZXIgPSBmc2cucGxheWVycyhhY3Rpb24udXNlci5pZCk7XHJcbiAgICAgICAgaWYgKCF1c2VyKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vbmV3IHBsYXllciBkZWZhdWx0c1xyXG4gICAgICAgIHVzZXIucG9pbnRzID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5jaGVja1N0YXJ0R2FtZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNoZWNrU3RhcnRHYW1lKCkge1xyXG4gICAgICAgIC8vaWYgcGxheWVyIGNvdW50IHJlYWNoZWQgcmVxdWlyZWQgbGltaXQsIHN0YXJ0IHRoZSBnYW1lXHJcbiAgICAgICAgbGV0IG1heFBsYXllcnMgPSBmc2cucnVsZXMoJ21heFBsYXllcnMnKSB8fCAyO1xyXG4gICAgICAgIGxldCBwbGF5ZXJDb3VudCA9IGZzZy5wbGF5ZXJDb3VudCgpO1xyXG4gICAgICAgIGlmIChwbGF5ZXJDb3VudCA+PSBtYXhQbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCBwbGF5ZXJzID0gZnNnLnBsYXllcnMoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaWQgaW4gcGxheWVycylcclxuICAgICAgICAgICAgICAgIHBsYXllcnNbaWRdLnBvaW50cyA9IDA7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm5leHRSb3VuZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvbkxlYXZlKCkge1xyXG4gICAgICAgIGxldCBwbGF5ZXJzID0gZnNnLnBsYXllcnMoKTtcclxuICAgICAgICBpZiAocGxheWVyc1tpZF0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIHBsYXllcnNbaWRdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvblBpY2soKSB7XHJcblxyXG4gICAgICAgIGlmIChmc2cucmVhY2hlZFRpbWVMaW1pdCgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dFJvdW5kKCk7XHJcbiAgICAgICAgICAgIGZzZy5sb2coXCJQaWNrIHBhc3NlZCB0aW1lbGltaXQsIGdldHRpbmcgbmV3IHJvdW5kXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc3RhdGUgPSBmc2cuc3RhdGUoKTtcclxuICAgICAgICBsZXQgYWN0aW9uID0gZnNnLmFjdGlvbigpO1xyXG4gICAgICAgIGxldCB1c2VyID0gZnNnLnBsYXllcnMoYWN0aW9uLnVzZXIuaWQpO1xyXG5cclxuICAgICAgICAvL2dldCB0aGUgcGlja2VkIGNlbGxcclxuICAgICAgICBsZXQgY2hvaWNlID0gYWN0aW9uLnBheWxvYWQuY2hvaWNlO1xyXG5cclxuICAgICAgICBpZiAoY2hvaWNlIDwgMCB8fCBjaG9pY2UgPiBzdGF0ZS5jaG9pY2VzLmxlbmd0aClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB1c2VyLmNob2ljZSA9IGNob2ljZTtcclxuXHJcbiAgICAgICAgZnNnLmV2ZW50KCdwaWNrZWQnKTtcclxuICAgICAgICBzdGF0ZS5waWNrZWQgPSB1c2VyLmlkO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbmV3IFBvcFRyaXZpYSgpOyIsImV4cG9ydCBkZWZhdWx0IFtcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBKYXBhbmVzZSBBbmltZSAmIE1hbmdhXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgMTk4OCBmaWxtICZxdW90O0FraXJhJnF1b3Q7LCBUZXRzdW8gZW5kcyB1cCBkZXN0cm95aW5nIFRva3lvLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkdlb2dyYXBoeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBib2R5IG9mIHRoZSBFZ3lwdGlhbiBTcGhpbnggd2FzIGJhc2VkIG9uIHdoaWNoIGFuaW1hbD9cIixcclxuICAgICAgICBcImFcIjogXCJMaW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCdWxsXCIsXHJcbiAgICAgICAgICAgIFwiSG9yc2VcIixcclxuICAgICAgICAgICAgXCJEb2dcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gcmVsYXRpb24gdG8gdGhlIEJyaXRpc2ggT2NjdXBhdGlvbiBpbiBJcmVsYW5kLCB3aGF0IGRvZXMgdGhlIElSQSBzdGFuZCBmb3IuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSXJpc2ggUmVwdWJsaWNhbiBBcm15XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJJcmlzaCBSZWJlbCBBbGxpYW5jZVwiLFxyXG4gICAgICAgICAgICBcIklyaXNoIFJlZm9ybWF0aW9uIEFybXlcIixcclxuICAgICAgICAgICAgXCJJcmlzaC1Sb3lhbCBBbGxpYW5jZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBGaWxtXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSByb2JvdCBpbiB0aGUgMTk1MSBzY2llbmNlIGZpY3Rpb24gZmlsbSBjbGFzc2ljICYjMDM5O1RoZSBEYXkgdGhlIEVhcnRoIFN0b29kIFN0aWxsJiMwMzk7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdvcnRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJvYmJ5XCIsXHJcbiAgICAgICAgICAgIFwiQ29sb3NzdXNcIixcclxuICAgICAgICAgICAgXCJCb3hcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogTWF0aGVtYXRpY3NcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIFJvbWFuIG51bWVyYWwgZm9yIDUwMD9cIixcclxuICAgICAgICBcImFcIjogXCJEXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMXCIsXHJcbiAgICAgICAgICAgIFwiQ1wiLFxyXG4gICAgICAgICAgICBcIlhcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBuYW1lIG9mIHRoZSBtYWluIGhlYWxpbmcgaXRlbSBpbiBEYXJrIFNvdWxzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkVzdHVzIEZsYXNrXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIZWFsdGggUG90aW9uXCIsXHJcbiAgICAgICAgICAgIFwiT3JhbmdlIEp1aWNlXCIsXHJcbiAgICAgICAgICAgIFwiQXNoZW4gRmxhc2tcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJPbiB3aGljaCBjb21wdXRlciBoYXJkd2FyZSBkZXZpY2UgaXMgdGhlIEJJT1MgY2hpcCBsb2NhdGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIk1vdGhlcmJvYXJkXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJIYXJkIERpc2sgRHJpdmVcIixcclxuICAgICAgICAgICAgXCJDZW50cmFsIFByb2Nlc3NpbmcgVW5pdFwiLFxyXG4gICAgICAgICAgICBcIkdyYXBoaWNzIFByb2Nlc3NpbmcgVW5pdFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTY2llbmNlOiBNYXRoZW1hdGljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiQSB1bml2ZXJzYWwgc2V0LCBvciBhIHNldCB0aGF0IGNvbnRhaW5zIGFsbCBzZXRzLCBleGlzdHMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIEFjZSBBdHRvcm5leSB0cmlsb2d5IHdhcyBzdXBwb3NlIHRvIGVuZCB3aXRoICZxdW90O1Bob2VuaXggV3JpZ2h0OiBBY2UgQXR0b3JuZXkgJm1pbnVzOyBUcmlhbHMgYW5kIFRyaWJ1bGF0aW9ucyZxdW90OyBhcyBpdHMgZmluYWwgZ2FtZS5cIixcclxuICAgICAgICBcImFcIjogXCJUcnVlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJGYWxzZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoYXQgaXMgdGhlIGhpZ2hlc3QgYmVsdCB5b3UgY2FuIGdldCBpbiBUYWVrd29uZG8/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2tcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIldoaXRlXCIsXHJcbiAgICAgICAgICAgIFwiUmVkXCIsXHJcbiAgICAgICAgICAgIFwiR3JlZW5cIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiVGhlIFVuaXRlZCBTdGF0ZXMgRGVwYXJ0bWVudCBvZiBIb21lbGFuZCBTZWN1cml0eSB3YXMgZm9ybWVkIGluIHJlc3BvbnNlIHRvIHRoZSBTZXB0ZW1iZXIgMTF0aCBhdHRhY2tzLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRydWVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkZhbHNlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIEFwb2xsbyBtaXNzaW9uIHdhcyB0aGUgbGFzdCBvbmUgaW4gTkFTQSYjMDM5O3MgQXBvbGxvIHByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQXBvbGxvIDE3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTNcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTFcIixcclxuICAgICAgICAgICAgXCJBcG9sbG8gMTVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiR2VuZXJhbCBLbm93bGVkZ2VcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBvZiB0aGUgZm9sbG93aW5nIGlzIGFuIGV4aXN0aW5nIGZhbWlseSBpbiAmcXVvdDtUaGUgU2ltcyZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgR290aCBGYW1pbHlcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRoZSBGYW1pbHlcIixcclxuICAgICAgICAgICAgXCJUaGUgU2ltb2xlb24gRmFtaWx5XCIsXHJcbiAgICAgICAgICAgIFwiVGhlIFByb3VkIEZhbWlseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHRoZSBnYW1lIE51Y2xlYXIgVGhyb25lLCB3aGF0IG9yZ2FuaXphdGlvbiBjaGFzZXMgdGhlIHBsYXllciBjaGFyYWN0ZXIgdGhyb3VnaG91dCB0aGUgZ2FtZT9cIixcclxuICAgICAgICBcImFcIjogXCJUaGUgSS5ELlAuRFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVGhlIEZpc2htZW5cIixcclxuICAgICAgICAgICAgXCJUaGUgQmFuZGl0c1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBZLlYuRy5HXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJJbiB0aGUgZ2FtZSAmcXVvdDtDYXZlIFN0b3J5LCZxdW90OyB3aGF0IGlzIHRoZSBjaGFyYWN0ZXIgQmFscm9nJiMwMzk7cyBjYXRjaHBocmFzZT9cIixcclxuICAgICAgICBcImFcIjogXCJIdXp6YWghXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJZZXMhXCIsXHJcbiAgICAgICAgICAgIFwiV2hvYSB0aGVyZSFcIixcclxuICAgICAgICAgICAgXCJOeWVoIGhlaCBoZWghXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlZlaGljbGVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb25lIG9mIHRoZXNlIGNoYXNzaXMgY29kZXMgYXJlIHVzZWQgYnkgQk1XIDMtc2VyaWVzP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkU0NlwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRTM5XCIsXHJcbiAgICAgICAgICAgIFwiRTg1XCIsXHJcbiAgICAgICAgICAgIFwiRjEwXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IENvbWljc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluIHdoYXQgSG9tZXN0dWNrIFVwZGF0ZSB3YXMgW1NdIEdhbWUgT3ZlciByZWxlYXNlZD9cIixcclxuICAgICAgICBcImFcIjogXCJPY3RvYmVyIDI1dGgsIDIwMTRcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFwcmlsIDEzdGgsIDIwMDlcIixcclxuICAgICAgICAgICAgXCJBcHJpbCA4dGgsIDIwMTJcIixcclxuICAgICAgICAgICAgXCJBdWd1c3QgMjh0aCwgMjAwM1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgcmVsYXRpb25zaGlwIGJldHdlZW4gdGhlIGJhbmQgbWVtYmVycyBvZiBBbWVyaWNhbiByb2NrIGJhbmQgS2luZyBvZiBMZW9uP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJyb3RoZXJzICZhbXA7IGNvdXNpbnNcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNoaWxkaG9vZCBmcmllbmRzXCIsXHJcbiAgICAgICAgICAgIFwiRm9ybWVyIGNsYXNzbWF0ZXNcIixcclxuICAgICAgICAgICAgXCJGcmF0ZXJuaXR5IGhvdXNlIG1lbWJlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGZyYW5jaGlzZSBoYWQgYSBzcGVjaWFsIGV2ZW50IGhvc3RlZCBpbiB0aGUgcG9wdWxhciBNTU9SUEcgRmluYWwgRmFudGFzeSBYSVY6IEEgUmVhbG0gUmVib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIllvLWthaSBXYXRjaFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUG9rJmVhY3V0ZTttb25cIixcclxuICAgICAgICAgICAgXCJZdS1naS1vaFwiLFxyXG4gICAgICAgICAgICBcIkJ1ZGR5ZmlnaHRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBLaW5nZG9tIEhlYXJ0cyBnYW1lIGZlYXR1cmVkIHRoZSBjYXN0IG9mICZxdW90O1RoZSBXb3JsZCBFbmRzIFdpdGggWW91JnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkRyZWFtIERyb3AgRGlzdGFuY2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkJpcnRoIEJ5IFNsZWVwXCIsXHJcbiAgICAgICAgICAgIFwiMzY1LzIgRGF5c1wiLFxyXG4gICAgICAgICAgICBcIlJlOkNoYWluIG9mIE1lbW9yaWVzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgbGFyZ2VzdCBwbGFuZXQgaW4gS2VyYmFsIFNwYWNlIFByb2dyYW0/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSm9vbFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRWVsb29cIixcclxuICAgICAgICAgICAgXCJLZXJib2xcIixcclxuICAgICAgICAgICAgXCJNaW5tdXNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGljaCBBbmltYWwgQ3Jvc3NpbmcgZ2FtZSB3YXMgZm9yIHRoZSBOaW50ZW5kbyBXaWk/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQW5pbWFsIENyb3NzaW5nOiBDaXR5IEZvbGtcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkFuaW1hbCBDcm9zc2luZzogTmV3IExlYWZcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFdpbGQgV29ybGRcIixcclxuICAgICAgICAgICAgXCJBbmltYWwgQ3Jvc3Npbmc6IFBvcHVsYXRpb24gR3Jvd2luZyFcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcImJvb2xlYW5cIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiR2VvcmdlIEx1Y2FzIGRpcmVjdGVkIHRoZSBlbnRpcmUgb3JpZ2luYWwgU3RhciBXYXJzIHRyaWxvZ3kuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiRmFsc2VcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlRydWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoZW4gd2FzIHRoZSBjaXR5IG9mIFJvbWUsIEl0YWx5IGZvdW5kZWQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiNzUzIEJDRVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiOTAyIEJDRVwiLFxyXG4gICAgICAgICAgICBcIjUyNCBCQ0VcIixcclxuICAgICAgICAgICAgXCI2OTcgQkNFXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IENvbXB1dGVyc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGRhdGEgc3RydWN0dXJlIGRvZXMgRklMTyBhcHBseSB0bz9cIixcclxuICAgICAgICBcImFcIjogXCJTdGFja1wiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiUXVldWVcIixcclxuICAgICAgICAgICAgXCJIZWFwXCIsXHJcbiAgICAgICAgICAgIFwiVHJlZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBUZWxldmlzaW9uXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJJbiBCYXR0bGVzdGFyIEdhbGFjdGljYSAoMjAwNCksIEN5bG9ucyB3ZXJlIGNyZWF0ZWQgYnkgbWFuIGFzIGN5YmVybmV0aWMgd29ya2VycyBhbmQgc29sZGllcnMuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiVHJ1ZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiRmFsc2VcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSAyMDE2IERpc25leSBhbmltYXRlZCBmaWxtICYjMDM5O01vYW5hJiMwMzk7IGlzIGJhc2VkIG9uIHdoaWNoIGN1bHR1cmU/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9seW5lc2lhblwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTmF0aXZlIEFtZXJpY2FuXCIsXHJcbiAgICAgICAgICAgIFwiSmFwYW5lc2VcIixcclxuICAgICAgICAgICAgXCJOb3JkaWNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjYWtlIGRlcGljdGVkIGluIFZhbHZlJiMwMzk7cyAmcXVvdDtQb3J0YWwmcXVvdDsgZnJhbmNoaXNlIG1vc3QgY2xvc2VseSByZXNlbWJsZXMgd2hpY2ggcmVhbC13b3JsZCB0eXBlIG9mIGNha2U/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQmxhY2sgRm9yZXN0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJEZXZpbCYjMDM5O3MgRm9vZFwiLFxyXG4gICAgICAgICAgICBcIk1vbHRlbiBDaG9jb2xhdGVcIixcclxuICAgICAgICAgICAgXCJHZXJtYW4gQ2hvY29sYXRlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2UgJiBOYXR1cmVcIixcclxuICAgICAgICBcInRcIjogXCJib29sZWFuXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBjaGVtaWNhbCBlbGVtZW50IExpdGhpdW0gaXMgbmFtZWQgYWZ0ZXIgdGhlIGNvdW50cnkgb2YgTGl0aHVhbmlhLlwiLFxyXG4gICAgICAgIFwiYVwiOiBcIkZhbHNlXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUcnVlXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIlNjaWVuY2U6IEdhZGdldHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJXaGVuIHdhcyB0aGUgRFZEIGludmVudGVkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5OTVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjIwMDBcIixcclxuICAgICAgICAgICAgXCIxOTkwXCIsXHJcbiAgICAgICAgICAgIFwiMTk4MFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJTcG9ydHNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBmdWxsIG5hbWUgb2YgdGhlIGZvb3RiYWxsZXIgJnF1b3Q7Q3Jpc3RpYW5vIFJvbmFsZG8mcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiQ3Jpc3RpYW5vIFJvbmFsZG8gZG9zIFNhbnRvcyBBdmVpcm9cIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNyaXN0aWFubyBSb25hbGRvIGxvcyBTYW50b3MgRGllZ29cIixcclxuICAgICAgICAgICAgXCJDcmlzdGlhbm8gQXJtYW5kbyBEaWVnbyBSb25hbGRvXCIsXHJcbiAgICAgICAgICAgIFwiQ3Jpc3RpYW5vIEx1aXMgQXJtYW5kbyBSb25hbGRvXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkhpc3RvcnlcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImVhc3lcIixcclxuICAgICAgICBcInFcIjogXCJUaGVzZSB0d28gY291bnRyaWVzIGhlbGQgYSBjb21tb253ZWFsdGggZnJvbSB0aGUgMTZ0aCB0byAxOHRoIGNlbnR1cnkuXCIsXHJcbiAgICAgICAgXCJhXCI6IFwiUG9sYW5kIGFuZCBMaXRodWFuaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkh1dHUgYW5kIFJ3YW5kYVwiLFxyXG4gICAgICAgICAgICBcIk5vcnRoIEtvcmVhIGFuZCBTb3V0aCBLb3JlYVwiLFxyXG4gICAgICAgICAgICBcIkJhbmdsYWRlc2ggYW5kIEJodXRhblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gJnF1b3Q7Q2FsbCBPZiBEdXR5OiBab21iaWVzJnF1b3Q7LCBjb21wbGV0aW5nIHdoaWNoIG1hcCYjMDM5O3MgbWFpbiBlYXN0ZXIgZWdnIHdpbGwgcmV3YXJkIHlvdSB3aXRoIHRoZSBhY2hpZXZlbWVudCwgJnF1b3Q7SGlnaCBNYWludGVuYW5jZSZxdW90Oz9cIixcclxuICAgICAgICBcImFcIjogXCJEaWUgUmlzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiTW9iIE9mIFRoZSBEZWFkXCIsXHJcbiAgICAgICAgICAgIFwiT3JpZ2luc1wiLFxyXG4gICAgICAgICAgICBcIkFzY2Vuc2lvblwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBDYXJ0b29uICYgQW5pbWF0aW9uc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiaGFyZFwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O0dyYXZpdHkgRmFsbHMmcXVvdDssIGhvdyBtdWNoIGRvZXMgV2FkZGxlcyB3ZWlnaCB3aGVuIE1hYmxlIHdpbnMgaGltIGluICZxdW90O1RoZSBUaW1lIFRyYXZlbGVyJiMwMzk7cyBQaWcmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiMTUgcG91bmRzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIxMCBwb3VuZHNcIixcclxuICAgICAgICAgICAgXCIzMCBwb3VuZHNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU2NpZW5jZTogQ29tcHV0ZXJzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJoYXJkXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBnaXZlbiB0byBsYXllciA0IG9mIHRoZSBPcGVuIFN5c3RlbXMgSW50ZXJjb25uZWN0aW9uIChJU08pIG1vZGVsP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRyYW5zcG9ydFwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiU2Vzc2lvblwiLFxyXG4gICAgICAgICAgICBcIkRhdGEgbGlua1wiLFxyXG4gICAgICAgICAgICBcIk5ldHdvcmtcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiU3BvcnRzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJtZWRpdW1cIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IHllYXIgd2FzIGhvY2tleSBsZWdlbmQgV2F5bmUgR3JldHpreSBib3JuP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIjE5NjFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIjE5NjVcIixcclxuICAgICAgICAgICAgXCIxOTU5XCIsXHJcbiAgICAgICAgICAgIFwiMTk2M1wiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSG93IG1hbnkgZ2FtZXMgYXJlIHRoZXJlIGluIHRoZSAmcXVvdDtDb2xvbnkgV2FycyZxdW90OyBzZXJpZXMgZm9yIHRoZSBQbGF5U3RhdGlvbj9cIixcclxuICAgICAgICBcImFcIjogXCIzXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCIyXCIsXHJcbiAgICAgICAgICAgIFwiNFwiLFxyXG4gICAgICAgICAgICBcIjVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVmlkZW8gR2FtZXNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJJbiBXb3JsZCBvZiBXYXJjcmFmdCwgd2hpY2ggcmFpZCBpbnN0YW5jZSBmZWF0dXJlcyBhIGNoZXNzIGV2ZW50P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkthcmF6aGFuXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJadWwmIzAzOTtBbWFuXCIsXHJcbiAgICAgICAgICAgIFwiQmxhY2t3aW5nIExhaXJcIixcclxuICAgICAgICAgICAgXCJUZW1wbGUgb2YgQWhuJiMwMzk7UWlyYWpcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIldoaWNoIGNvdW50cnkgd2FzIEpvc2VmIFN0YWxpbiBib3JuIGluP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkdlb3JnaWFcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIlJ1c3NpYVwiLFxyXG4gICAgICAgICAgICBcIkdlcm1hbnlcIixcclxuICAgICAgICAgICAgXCJQb2xhbmRcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogTXVzaWNcIixcclxuICAgICAgICBcInRcIjogXCJtdWx0aXBsZVwiLFxyXG4gICAgICAgIFwiZFwiOiBcImhhcmRcIixcclxuICAgICAgICBcInFcIjogXCJXaGF0IGlzIHRoZSBvZmZpY2lhbCBuYW1lIG9mIFByaW5jZSYjMDM5O3MgYmFja2luZyBiYW5kP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIlRoZSBSZXZvbHV0aW9uXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJUaGUgUGF1cGVyc1wiLFxyXG4gICAgICAgICAgICBcIlRoZSBXYWlsZXJzXCIsXHJcbiAgICAgICAgICAgIFwiVGhlIEhlYXJ0YnJlYWtlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gR2FtZSBvZiBUaHJvbmVzIHdoYXQgaXMgdGhlIG5hbWUgb2YgSm9uIFNub3cmIzAzOTtzIHN3b3JkP1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkxvbmdjbGF3XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJPYXRoa2VlcGVyXCIsXHJcbiAgICAgICAgICAgIFwiV2lkb3cmIzAzOTtzIFdhaWxcIixcclxuICAgICAgICAgICAgXCJOZWVkbGVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogVGVsZXZpc2lvblwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgaW5zcGVjdG9yIGluIHRoZSBzZXJpZXMgJnF1b3Q7T24gdGhlIEJ1c2VzJnF1b3Q7P1wiLFxyXG4gICAgICAgIFwiYVwiOiBcIkJsYWtleVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiSGFycGVyXCIsXHJcbiAgICAgICAgICAgIFwiTmFpbHlcIixcclxuICAgICAgICAgICAgXCJHYWxseVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBNdXNpY1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggYXJ0aXN0IGN1cmF0ZWQgdGhlIG9mZmljaWFsIHNvdW5kdHJhY2sgZm9yICZxdW90O1RoZSBIdW5nZXIgR2FtZXM6IE1vY2tpbmdqYXkgLSBQYXJ0IDEmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9yZGVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkthbnllIFdlc3RcIixcclxuICAgICAgICAgICAgXCJUb3ZlIExvXCIsXHJcbiAgICAgICAgICAgIFwiQ2hhcmxpIFhDWFwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJHZW5lcmFsIEtub3dsZWRnZVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwiZWFzeVwiLFxyXG4gICAgICAgIFwicVwiOiBcIlRoZSBDYW5hZGlhbiAkMSBjb2luIGlzIGNvbGxvcXVpYWxseSBrbm93biBhcyBhIHdoYXQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiTG9vbmllXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJCb29saWVcIixcclxuICAgICAgICAgICAgXCJGb29saWVcIixcclxuICAgICAgICAgICAgXCJNb29kaWVcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiSGlzdG9yeVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlc2UgZm91bmRpbmcgZmF0aGVycyBvZiB0aGUgVW5pdGVkIFN0YXRlcyBvZiBBbWVyaWNhIGxhdGVyIGJlY2FtZSBwcmVzaWRlbnQ/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmFtZXMgTW9ucm9lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJBbGV4YW5kZXIgSGFtaWx0b25cIixcclxuICAgICAgICAgICAgXCJTYW11ZWwgQWRhbXNcIixcclxuICAgICAgICAgICAgXCJSb2dlciBTaGVybWFuXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSW4gRGl2aW5pdHk6IE9yaWdpbmFsIFNpbiBJSSwgd2hhdCBpcyB0aGUgbmFtZSBvZiB0aGUgc2tlbGV0YWwgb3JpZ2luIGNoYXJhY3Rlcj9cIixcclxuICAgICAgICBcImFcIjogXCJGYW5lXCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJMb2hzZVwiLFxyXG4gICAgICAgICAgICBcIlRoZSBSZWQgUHJpbmNlXCIsXHJcbiAgICAgICAgICAgIFwiVGhlcmUgYXJlIG5vIHNrZWxldGFsIG9yaWdpbiBjaGFyYWN0ZXJzXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwibXVsdGlwbGVcIixcclxuICAgICAgICBcImRcIjogXCJlYXN5XCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hvIGlzIHRoZSBtYWluIHByb3RhZ29uaXN0IGluIHRoZSBnYW1lIExpZmUgaXMgU3RyYW5nZTogQmVmb3JlIFRoZSBTdG9ybT9cIixcclxuICAgICAgICBcImFcIjogXCJDaGxvZSBQcmljZSBcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIk1heCBDYXVsZmllbGRcIixcclxuICAgICAgICAgICAgXCJSYWNoZWwgQW1iZXJcIixcclxuICAgICAgICAgICAgXCJGcmFuayBCb3dlcnNcIlxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgXCJjXCI6IFwiRW50ZXJ0YWlubWVudDogRmlsbVwiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiSm9obm55IERlcHAgbWFkZSBoaXMgYmlnLXNjcmVlbiBhY3RpbmcgZGVidXQgaW4gd2hpY2ggZmlsbT9cIixcclxuICAgICAgICBcImFcIjogXCJBIE5pZ2h0bWFyZSBvbiBFbG0gU3RyZWV0XCIsXHJcbiAgICAgICAgXCJpXCI6IFtcclxuICAgICAgICAgICAgXCJNeSBCbG9vZHkgVmFsZW50aW5lXCIsXHJcbiAgICAgICAgICAgIFwiSGFsbG93ZWVuXCIsXHJcbiAgICAgICAgICAgIFwiRnJpZGF5IHRoZSAxM3RoXCJcclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIFwiY1wiOiBcIkVudGVydGFpbm1lbnQ6IFZpZGVvIEdhbWVzXCIsXHJcbiAgICAgICAgXCJ0XCI6IFwiYm9vbGVhblwiLFxyXG4gICAgICAgIFwiZFwiOiBcIm1lZGl1bVwiLFxyXG4gICAgICAgIFwicVwiOiBcIkluICZxdW90O1Jlc2lkZW50IEV2aWwmcXVvdDssIG9ubHkgQ2hyaXMgaGFzIGFjY2VzcyB0byB0aGUgZ3JlbmFkZSBsYXVuY2hlci5cIixcclxuICAgICAgICBcImFcIjogXCJGYWxzZVwiLFxyXG4gICAgICAgIFwiaVwiOiBbXHJcbiAgICAgICAgICAgIFwiVHJ1ZVwiXHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBcImNcIjogXCJFbnRlcnRhaW5tZW50OiBWaWRlbyBHYW1lc1wiLFxyXG4gICAgICAgIFwidFwiOiBcIm11bHRpcGxlXCIsXHJcbiAgICAgICAgXCJkXCI6IFwibWVkaXVtXCIsXHJcbiAgICAgICAgXCJxXCI6IFwiV2hpY2ggb2YgdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXJzIGlzIE5PVCBwbGF5YWJsZSBpbiAmcXVvdDtSZXNpZGVudCBFdmlsIDYmcXVvdDs/XCIsXHJcbiAgICAgICAgXCJhXCI6IFwiSmlsbCBWYWxlbnRpbmVcIixcclxuICAgICAgICBcImlcIjogW1xyXG4gICAgICAgICAgICBcIkNocmlzIFJlZGZpZWxkXCIsXHJcbiAgICAgICAgICAgIFwiU2hlcnJ5IEJpcmtpblwiLFxyXG4gICAgICAgICAgICBcIkhlbGVuYSBIYXJwZXJcIlxyXG4gICAgICAgIF1cclxuICAgIH1cclxuXSIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiaW1wb3J0IGZzZyBmcm9tICcuL2ZzZyc7XHJcbmltcG9ydCBQb3BUcml2aWEgZnJvbSAnLi9nYW1lJztcclxuXHJcblxyXG5cclxuZnNnLm9uKCduZXdnYW1lJywgKCkgPT4gUG9wVHJpdmlhLm9uTmV3R2FtZSgpKTtcclxuZnNnLm9uKCdza2lwJywgKCkgPT4gUG9wVHJpdmlhLm9uU2tpcCgpKTtcclxuZnNnLm9uKCdqb2luJywgKCkgPT4gUG9wVHJpdmlhLm9uSm9pbigpKTtcclxuZnNnLm9uKCdsZWF2ZScsICgpID0+IFBvcFRyaXZpYS5vbkxlYXZlKCkpO1xyXG5mc2cub24oJ3BpY2snLCAoKSA9PiBQb3BUcml2aWEub25QaWNrKCkpO1xyXG5cclxuZnNnLnN1Ym1pdCgpOyJdLCJzb3VyY2VSb290IjoiIn0=