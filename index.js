const qrcode = require("qrcode-terminal");
const axios = require("axios");
const url = require('url');
const express = require("express");
const fs = require('fs');
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
require("dotenv").config();

// for fun
const petPetGif = require('pet-pet-gif')

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

async function checkURLStatus(url) {
    try {
        const response = await axios.get(url);
        return response.status;
    } catch (error) {
        console.error(`Terjadi kesalahan saat memeriksa URL ${url}:`, error.message);
        throw error.response.status;
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
            const patternNIM = /^\d{2}\.\d{2}\.\d{4}$/;

            if (patternNIM.test(parseArgs(message.body))) {
                let fotomhsUrl = 'https://fotomhs.amikom.ac.id/20' + parseArgs(message.body).slice(0, 2) + '/' + parseArgs(message.body).replace(/\./g, '_') + '.jpg';

                checkURLStatus(fotomhsUrl)
                    .then(status => {
                        MessageMedia.fromUrl(fotomhsUrl)
                            .then(media => {
                                message.reply(media);
                            })
                            .catch(error => {
                                console.error("Terjadi kesalahan saat mengambil media:", error);
                            });
                    })
                    .catch(error => {
                        message.reply("NIM tersebut tidak memiliki foto");
                    });
            } else {
                message.reply("format NIM tidak valid");
            }

        } else {
            message.reply("Penggunaan salah.\ncommand: .amikom-foto <nim>\ncontoh: .amikom-foto 22.11.xxxx");
        }
    } else if (getFirstCharacter(message.body) && parsePrefix(message.body) == "amikom-pet") {
        if (parseArgs(message.body)) {
            const patternNIM = /^\d{2}\.\d{2}\.\d{4}$/;

            if (patternNIM.test(parseArgs(message.body))) {
                let fotomhsUrl = 'https://fotomhs.amikom.ac.id/20' + parseArgs(message.body).slice(0, 2) + '/' + parseArgs(message.body).replace(/\./g, '_') + '.jpg';

                checkURLStatus(fotomhsUrl)
                    .then(status => {
                        console.log("Pet URL Passed");
                        petPetGif(fotomhsUrl, {
                            resolution: 500
                        })
                            .then(animatedGif => {
                                console.log("Pet Create Passed");
                                // Buffer yang berisi data GIF
                                const gifBuffer = animatedGif;

                                // Path file tujuan untuk GIF
                                const outputFilePath = 'temp/amikom-pet/' + parseArgs(message.body).replace(/\./g, '_') + '.gif';

                                // Menulis buffer ke file GIF
                                fs.writeFile(outputFilePath, gifBuffer, (error) => {
                                    if (error) {
                                        console.error('Terjadi kesalahan saat menulis file GIF:', error);
                                    } else {
                                        console.log('File GIF berhasil dibuat:', outputFilePath);
                                        const media = MessageMedia.fromFilePath(outputFilePath);
                                        message.reply(media);
                                        setTimeout(() => {
                                            client.sendMessage(message.from, "Fitur Pat-Pat masih dalam proses pengerjaan");
                                        }, 5000);
                                        fs.unlink(outputFilePath, (err) => {
                                            if (err) throw err;
                                        });
                                    }
                                });
                            })
                            .catch(error => {
                                console.error("Terjadi kesalahan saat membuat pet-pet:", error);
                            });
                    })
                    .catch(error => {
                        message.reply("NIM tersebut tidak memiliki foto");
                    });
            } else {
                message.reply("format NIM tidak valid");
            }

        } else {
            message.reply("Penggunaan salah.\ncommand: .amikom-foto <nim>\ncontoh: .amikom-foto 22.11.xxxx");
        }
    } else if (getFirstCharacter(message.body) && parsePrefix(message.body) == "args") {
        if (parseArgs(message.body)) {
            message.reply("Parsed argument: \n" + parseArgs(message.body));
        } else {
            message.reply("ARGUMEN KOSONG!!!");
        }
    } else if (getFirstCharacter(message.body) && parsePrefix(message.body) == "cari-mhs") {
        if (parseArgs(message.body)) {
            let kemendikAPI = 'https://api-frontend.kemdikbud.go.id/hit_mhs/' + encodeURIComponent(parseArgs(message.body));
            axios.get(kemendikAPI)
                .then(response => {
                    const data = response.data;
                    let text = '';
                    let i = 1;
                    for (const item of data.mahasiswa) {
                        text += `${i++}. ${item.text}\nBiodata : https://pddikti.kemdikbud.go.id${item['website-link']}\n\n`;
                    }
                    message.reply("Berikut data *" + parseArgs(message.body) + "* yang ditemukan");
                    setTimeout(() => {
                        client.sendMessage(message.from, text);
                    }, 3000);
                })
                .catch(error => {
                    message.reply("Data mahasiswa *" + parseArgs(message.body) + "* tidak ditemukan");
                });
        } else {
            message.reply("Penggunaan salah.\ncommand: .cari-mhs <nama lengkap atau nim tanpa karakter . _>\ncontoh: .cari-mhs Abdul Dudul Pesi\ncontoh: .cari-mhs 22114631");
        }
    }
});

client.initialize();

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
