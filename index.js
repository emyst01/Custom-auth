/* MAIN */

//imports and decl
var tokenList = []
const express = require('express');
const app = express();
const culture = "KUIAJROSELEIEUNNANWNFUOENIAJVALETOLONNICESAPICEUBRESIELEANAPEIREUSIENISONASTREJINMENICEU"

//functions
function enc(txt, key) {
    txt = txt.toUpperCase();
    key = key.toUpperCase();
  
    let cipher = "";
    for (let i = 0; i < txt.length; i++) {
        const charCode = txt.charCodeAt(i);
        const keyCode = key.charCodeAt(i % key.length);
        if (charCode >= 65 && charCode <= 90) {
            const shift = keyCode - 65;
            const newCharCode = ((charCode - 65 + shift) % 26) + 65;
            cipher += String.fromCharCode(newCharCode);
        } else {
            cipher += txt[i];
        }
    }
    return cipher;
}
function dec(txt, key) {
    txt = txt.toUpperCase();
    key = key.toUpperCase();
  
    let message = "";
    for (let i = 0; i < txt.length; i++) {
        const charCode = txt.charCodeAt(i);
        if (charCode >= 65 && charCode <= 90) {
            const keyCode = key.charCodeAt(i % key.length);
            const shift = keyCode - 65;
            const newCharCode = ((charCode - 65 - shift + 26) % 26) + 65;
            message += String.fromCharCode(newCharCode);
        } else {
            message += txt[i];
        }
    }
    return message;
}
async function genToken() {
        return new Promise((resolve, reject) => {
        const characters = 'QWERTYUIOPASDFGHJKLZXCVBNM';
        let token = '';
        for (let i = 0; i < 30; i++) {
            token += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        resolve(token);
    });
}
function formatTwoDigits(n) {
    const numberString = n.toString();
    return numberString.padStart(2, '0');
}
function removeToken(t) {
    const filteredArr = tokenList.filter(element => element !== t);
    tokenList = filteredArr;
}


app.get("/whatever", (req, res) => {
    const token = req.headers.token;

    if(tokenList.indexOf(token) !== -1) {
        removeToken(token);
        console.log("Bravo, you're in.");
        res.status(200).send("Nice, you're in");
    } else {
        res.status(401).send("Nope");
    }
});

app.get("/get-token", async (req, res) => {
    const pass = req.headers.authorization; 
    const user = req.headers['user-agent'];

    if(user == "admin" && pass == "ciao") {
        const today = new Date()
        const year = today.getFullYear();
        const month = formatTwoDigits(today.getMonth() + 1);
        const day = formatTwoDigits(today.getDate());
        
        const url = `https://www.nytimes.com/svc/wordle/v2/${year}-${month}-${day}.json`
        let dailyWord = '';
    
        await fetch(url).then(response => response.json()).then(data => {
            dailyWord = data.solution;
        }).catch(error => console.error(error));
    
        const txt = await genToken();
        const key = enc(culture, dailyWord);
        const token = enc(txt, key);
        tokenList.push(token);
        res.json({token: token});
    } else {
        res.status(401).send("Nope");
    }
})

app.get("/tokenList", (req, res) => {
    res.json({tokenList});
})

app.listen(3037, () => {console.log("Server started on :3037")})