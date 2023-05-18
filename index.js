const qrcode = require("qrcode-terminal");
const axios = require("axios");
const moment = require('moment');
const express = require("express");
const fs = require('fs');
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
require("dotenv").config();

const owner = "6281225389903";
const app = express();
const port = 3000;

// Middleware untuk mengizinkan parsing body dalam format JSON
app.use(express.json());

// Endpoint untuk route GET "/"
app.get("/", (req, res) => {
    res.send("Selamat datang di REST API sederhana!");
});

// Endpoint untuk route GET "/get"
app.get("/get", (req, res) => {
    const data = {
        name: "John Doe",
        age: 25,
        city: "Jakarta",
    };

    res.json(data);
});

// Endpoint untuk route POST "/post"
app.post("/post", (req, res) => {
    const data = req.body;
    console.log("Data yang diterima: ", data);

    res.status(200).json({ message: "Data diterima" });
});

const client = new Client({
    // buat no gui kaya vps;
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ["--no-sandbox"],
    },
});

client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    client.isRegisteredUser(owner + "@c.us").then(function (isRegistered) {
        if (isRegistered) {
            client.sendMessage(
                owner + "@c.us",
                "Assalamualaikum Mas\nbot " + process.env.BOT_NAME + " sudah nyala"
            );
        }
    });

    console.log(process.env.BOT_NAME + " siap digunakan!");

    app.post("/send-msg", (req, res) => {
        const data = req.body;

        client
            .isRegisteredUser(data.number + "@c.us")
            .then(function (isRegistered) {
                let msg_response = "";
                if (isRegistered) {
                    client.sendMessage(data.number + "@c.us", data.msg);
                    msg_response = "Pesan berhasil dikirim";
                } else {
                    msg_response = "Pesan gagal terkirim. Nomor tidak terdaftar";
                }

                res.status(200).json({ message: msg_response });
                console.log("Data API MSG : " + data);
            });
    });
});

function getFirstCharacter(str) {
    if (str.length === 1) {
        return false;
    }

    if (str.charAt(0) == process.env.BOT_PREFIX) {
        return true;
    } else {
        return false;
    }
}

function checkIfContainsSpace(str) {
    if (str.includes(" ")) {
        return true;
    } else {
        return false;
    }
}

function parseNumber(str) {
    const atIndex = str.indexOf("@");
    return str.slice(0, atIndex);
}

function parsePrefix(str) {
    if (checkIfContainsSpace(str)) {
        const spaceIndex = str.indexOf(" ");
        const getChar = str.slice(1, spaceIndex);
        return getChar;
    } else {
        const getChar = str.slice(1);
        return getChar;
    }
}

function parseArgs(str) {
    const spaceIndex = str.indexOf(" ");

    if (spaceIndex !== -1) {
        const afterSpace = str.slice(spaceIndex + 1);
        return afterSpace;
    } else {
        return false;
    }
}

client.on("message", (message) => {
    if (getFirstCharacter(message.body)) {
        console.log(
            parseNumber(message.from) +
            " menggunakan command " +
            parsePrefix(message.body)
        );
    }

    if (getFirstCharacter(message.body) && parsePrefix(message.body) == "amikom-foto") {
        if (parseArgs(message.body)) {
            const media = await MessageMedia.fromUrl('https://via.placeholder.com/350x150.png');
            message.reply(media);
        } else {
            message.reply("Penggunaan salah. Contoh yang benar :\n.amikom-foto 22.11.4xxx");
        }
    } else if (getFirstCharacter(message.body) && parsePrefix(message.body) == "args") {
        if (parseArgs(message.body)) {
            message.reply("Parsed argument: \n" + parseArgs(message.body));
        } else {
            message.reply("ARGUMEN KOSONG!!!");
        }
    }
});

client.initialize();

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
