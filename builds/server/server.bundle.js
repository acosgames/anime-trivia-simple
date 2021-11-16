(()=>{"use strict";const e=new class{constructor(){try{this.actions=JSON.parse(JSON.stringify(globals.actions()))}catch(e){return void this.error("Failed to load actions")}try{this.originalGame=JSON.parse(JSON.stringify(globals.game()))}catch(e){return void this.error("Failed to load originalGame")}try{this.nextGame=JSON.parse(JSON.stringify(globals.game()))}catch(e){return void this.error("Failed to load nextGame")}this.currentAction=null,this.isNewGame=!1,this.markedForDelete=!1,this.defaultSeconds=15,this.kickedPlayers=[],this.nextGame&&0!=Object.keys(this.nextGame.rules).length||(this.isNewGame=!0,this.error("Missing Rules")),this.nextGame&&("timer"in this.nextGame||(this.nextGame.timer={}),"state"in this.nextGame||(this.nextGame.state={}),"players"in this.nextGame||(this.nextGame.players={}),this.nextGame.prev={},"next"in this.nextGame||(this.nextGame.next={}),"rules"in this.nextGame||(this.nextGame.rules={}),this.nextGame.events=[])}on(e,t){if("newgame"!=e)for(var s=0;s<this.actions.length;s++)this.actions[s].type==e&&(this.currentAction=this.actions[s],t(this.currentAction));else this.isNewGame&&(this.currentAction=this.actions[0],t(this.actions[0]),this.isNewGame=!1)}setGame(e){for(var t in this.nextGame.players){let s=this.nextGame.players[t];e.players[t]={name:s.name}}this.nextGame=e}submit(){this.kickedPlayers.length>0&&(this.nextGame.kick=this.kickedPlayers),globals.finish(this.nextGame)}killGame(){this.markedForDelete=!0,globals.killGame()}log(e){globals.log(e)}error(e){globals.error(e)}kickPlayer(e){this.kickedPlayers.push(e)}database(){return globals.database()}action(){return this.currentAction}state(e,t){return void 0===e?this.nextGame.state:void 0===t?this.nextGame.state[e]:void(this.nextGame.state[e]=t)}playerList(){return Object.keys(this.nextGame.players)}playerCount(){return Object.keys(this.nextGame.players).length}players(e,t){return void 0===e?this.nextGame.players:void 0===t?this.nextGame.players[e]:void(this.nextGame.players[e]=t)}rules(e,t){return void 0===e?this.nextGame.rules:void 0===t?this.nextGame.rules[e]:void(this.nextGame.rules[e]=t)}prev(e){return"object"==typeof e&&(this.nextGame.prev=e),this.nextGame.prev}next(e){return"object"==typeof e&&(this.nextGame.next=e),this.nextGame.next}setTimelimit(e){e=e||this.defaultSeconds,this.nextGame.timer||(this.nextGame.timer={}),this.nextGame.timer.set=Math.min(60,Math.max(10,e))}reachedTimelimit(e){return void 0!==e.timeleft&&e.timeleft<=0}event(e){this.nextGame.events.push(e)}clearEvents(){this.nextGame.events=[]}events(e){if(void 0===e)return this.nextGame.events;this.nextGame.events.push(e)}};let t=e.database(),s={state:{qid:0,history:[],category:"",question:"",choices:[],round:0},players:{},rules:{rounds:2,maxplayers:2},next:{},events:[]};const i=new class{onNewGame(t){e.setGame(s),this.checkStartGame()}onSkip(e){this.nextRound()}onJoin(t){if(!t.user.id)return;let s=e.players(t.user.id);s&&(s.points=0,this.checkStartGame())}onLeave(t){let s=t.user.id,i=e.players();i[s]&&delete i[s]}onPick(t){let s=e.state(),i=e.players(t.user.id),n=t.payload.choice;n<0||n>s.choices.length||(i._choice=n,e.event("picked"),s.picked=i.id)}checkStartGame(){let t=e.rules("maxPlayers")||2;if(e.playerCount()>=t){let t=e.players();for(var s in t)t[s].points=0;this.nextRound()}}nextRound(){this.processCorrectAnswers();let t=e.state();t.round=t.round+1,e.next({id:"*"}),e.setTimelimit(5),this.resetPlayerChoices();let s=e.rules();t.round>s.rounds?this.processWinners():this.processNextQuestion()}resetPlayerChoices(){let t=e.players();for(var s in t){let e=t[s];e.choices=e.choices||[],void 0!==e._choice&&null!=e._choice&&e.choices.push(e._choice),delete e._choice}}processNextQuestion(){let s=e.state(),i=Math.floor(Math.random()*t.length);if(s.history.includes(i))return void this.processNextQuestion();let n=t[i];if(s.qid=i,s.question=n.q,s.category=n.c,"boolean"==n.t)s.choices=["True","False"];else{s.choices=[],s.choices.push(n.a);for(let e=0;e<n.i.length;e++)s.choices.push(n.i[e]);s.choices.sort()}s.history.push(i)}processWinners(){let t=[],s=e.players();for(var i in s)s[i].id=i,t.push(s[i]);t.sort(((e,t)=>{e.points,t.points}));let n=[];for(var r=0;r<Math.min(t.length,10);r++){let e=t[r];n.push(e.id)}for(var i in s)delete s[i].id;e.state().winners=n,e.events("winner"),e.killGame()}processCorrectAnswers(){let s=e.players(),i=e.state();if(!(i.round<=0))for(var n in s){let e=s[n];void 0!==e._choice&&null!=e._choice&&(t[i.qid].a==i.choices[e._choice]?e.points+=10:e.points-=2)}}};e.on("newgame",(e=>i.onNewGame(e))),e.on("skip",(e=>i.onSkip(e))),e.on("join",(e=>i.onJoin(e))),e.on("leave",(e=>i.onLeave(e))),e.on("pick",(e=>i.onPick(e))),e.submit()})();