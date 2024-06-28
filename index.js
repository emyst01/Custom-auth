/* MAIN */

//imports and decl
var tokenList = []
require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const helmet = require('helmet');
app.use(helmet());
const rateLimit = require('express-rate-limit');
const culture = process.env.CULTURE

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5
});

app.use(limiter);

//vigenere enc and dec functions
function vEnc(txt, key) {
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
function vDec(txt, key) {
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

//functions
async function getDaily() {
    const today = new Date()
    const year = today.getFullYear();
    const month = formatTwoDigits(today.getMonth() + 1);
    const day = formatTwoDigits(today.getDate());
    
    const url = `https://www.nytimes.com/svc/wordle/v2/${year}-${month}-${day}.json`
    let dailyWord = '';

    await fetch(url).then(response => response.json()).then(data => {
        dailyWord = data.solution;
    }).catch(error => console.error(error));
    return dailyWord;
}

async function getPassword() {
    const daily = await getDaily();
    return vEnc(culture, daily);
}

async function genToken() {
    const characters = 'QWERTYUIOPASDFGHJKLZXCVBNM';
    let token = '';
    for (let i = 0; i < 30; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const expiresAt = new Date(Date.now() + (60 * 1000)); //1 minute
    tokenList.push({ token, expiresAt });
    return token;
}

function formatTwoDigits(n) {
    const numberString = n.toString();
    return numberString.padStart(2, '0');
}

function removeToken(t) {
    const filteredArr = tokenList.filter(element => element !== t);
    tokenList = filteredArr;
}

//Authorization Basic admin:enc(culture, daily)
async function authentication(req, res) {
    const authheader = req.headers.authorization;

    if(!authheader) {
        return false;
    }

    const auth = new Buffer.from(authheader, 'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];

    let reqPass = await getPassword();
    return (user == 'admin' && pass == reqPass) ? true : false
}

//Requests manager

app.get("/get-token", async (req, res) => {
    const auth = await authentication(req, res);
    if(auth) {
        let token = await genToken();
        res.json({token: token});
    } else {
        res.status(401).send("nope")
    }
});

app.get("/whatever", (req, res) => {
    const token = req.headers.token;

    const matchingToken = tokenList.find(t => t.token === token);
    if (matchingToken) {
        if (matchingToken.expiresAt > Date.now()) {
        removeToken(token);
        console.log("Bravo, you're in.");
        res.status(200).send("Nice, you're in");
        } else {
            removeToken(token);
            res.status(401).send("Token expired.");
        }
    } else {
        res.status(401).send("Nope");
    }
});

app.get("/test", async (req, res) => {
    res.json({tokenList});
})

app.listen(3037, () => {console.log("Server started on :3037")})