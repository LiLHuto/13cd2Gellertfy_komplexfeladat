const express = require("express");
const mysql = require("mysql");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000, () => {
    console.log("A szerver a 3000-es porton fut.");
});

const adatbazis = mysql.createConnection({
    user: "root",
    host: "localhost",
    port: 3306,
    password: "",
    database: "felveteli",
});

adatbazis.connect((err) => {
    if (err) {
        console.error("Adatbázis csatlakozási hiba:", err);
        return;
    }
    console.log("Csatlakozás az adatbázishoz sikeres.");
});

app.get("/", (req, res) => {
    res.send("Szerver Működik");
});

app.get("/api/elozetes-rangsor", (req, res) => {
    const lekerdezes = `
        SELECT 
            diakok.nev AS "Tanuló neve",
            tagozatok.agazat AS "Ágazat",
            (diakok.hozott * 2 + diakok.kpmagy + diakok.kpmat) AS "Összes pontszám"
        FROM 
            diakok
        JOIN 
            jelentkezesek ON diakok.oktazon = jelentkezesek.diak
        JOIN 
            tagozatok ON jelentkezesek.tag = tagozatok.akod
        ORDER BY 
            diakok.nev ASC;
    `;

    adatbazis.query(lekerdezes, (err, eredmenyek) => {
        if (err) {
            console.error("Lekérdezési hiba:", err);
            res.status(500).send("Szerver hiba történt.");
            return;
        }
        res.json(eredmenyek);
    });
});
app.get("/api/felvettek-rangsora", (req, res) => {
    const agazat = req.query.agazat;
    if (!agazat) {
        res.status(400).send("Hiányzik az ágazat paraméter!");
        return;
    }

    const lekerdezes = `
        SELECT 
            diakok.nev AS "Tanuló neve",
            tagozatok.agazat AS "Ágazat",
            (diakok.hozott * 2 + diakok.kpmagy + diakok.kpmat) AS "Összes pontszám"
        FROM 
            diakok
        JOIN 
            jelentkezesek ON diakok.oktazon = jelentkezesek.diak
        JOIN 
            tagozatok ON jelentkezesek.tag = tagozatok.akod
        WHERE 
            tagozatok.nyek = 1 
            AND tagozatok.agazat = ? 
            AND jelentkezesek.hely = 1
        ORDER BY 
            (diakok.hozott * 2 + diakok.kpmagy + diakok.kpmat) DESC
        LIMIT 32;
    `;

    adatbazis.query(lekerdezes, [agazat], (err, eredmenyek) => {
        if (err) {
            console.error("Lekérdezési hiba:", err);
            res.status(500).send("Szerver hiba történt.");
            return;
        }
        res.json(eredmenyek);
    });
});

app.use((req, res) => {
    res.status(404).send("Az oldal nem található.");
});