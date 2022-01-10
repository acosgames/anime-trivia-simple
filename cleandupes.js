
//Copy the results from 
// https://opentdb.com/api_config.php

var json = [

]

let fs = require('fs');


let filtered = [];
let qMap = {};
for (var q of json) {
    if (qMap[q.question]) {
        continue;
    }

    qMap[q.question] = true;

    filtered.push({
        c: q.category,
        t: q.type,
        d: q.difficulty,
        q: q.question,
        a: q.correct_answer,
        i: q.incorrect_answers
    })
}

let jsonSTR = JSON.stringify(filtered, null, 4);
console.log(jsonSTR);

fs.writeFileSync('./database.json', jsonSTR, { encoding: 'utf-8' })
console.log("Total questions: " + filtered.length);