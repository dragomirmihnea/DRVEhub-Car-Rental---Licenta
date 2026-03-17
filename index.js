import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(express.static("public")); 

app.use(bodyParser.urlencoded({ extended: true }));

let flotaMasini = [
    { 
        id: 1, marca: "Mercedes-Benz", model: "AMG GT", pret: 250, status: "Disponibil", 
        an: 2023, km: 12500, revizieLaKM: 15000, profit: 15400, motor: "4.0L V8", combustibil: "Benzină", 
        consum: "13.5L/100km", inchirieriLuna: 8, mentenantaLuna: 450, combustibilLuna: 650,
        reparatie: { descriere: "Igienizare interior + Tratament ceramic", cost: 350, timp: "1 zi" }
    },
    { 
        id: 2, marca: "BMW", model: "M8 Competition", pret: 300, status: "Închiriat", 
        an: 2022, km: 18200, revizieLaKM: 18500, profit: 21000, motor: "4.4L V8", combustibil: "Benzină", 
        consum: "15.2L/100km", inchirieriLuna: 5, mentenantaLuna: 500, combustibilLuna: 700,
        reparatie: { descriere: "Verificare post-închiriere + Geometrie", cost: 150, timp: "4 ore" }
    },
    { 
        id: 3, marca: "Porsche", model: "911 Turbo S", pret: 450, status: "Mentenanță", 
        an: 2024, km: 5400, revizieLaKM: 10000, profit: 8900, motor: "3.8L Flat-6", combustibil: "Benzină", 
        consum: "12.1L/100km", inchirieriLuna: 3, mentenantaLuna: 800, combustibilLuna: 400,
        reparatie: { descriere: "Revizie 5000km + Schimb plăcuțe frână", cost: 800, timp: "2 zile" }
    },
    { 
        id: 4, marca: "VW", model: "Scirocco", pret: 60, status: "Disponibil", 
        an: 2011, km: 223000, revizieLaKM: 225000, profit: 9000, motor: "2.0 TDI", combustibil: "Diesel", 
        consum: "6.2L/100km", inchirieriLuna: 22, mentenantaLuna: 180, combustibilLuna: 320,
        reparatie: { descriere: "Curățare filtru particule (DPF)", cost: 120, timp: "1 zi" }
    },
    { 
        id: 5, marca: "VW", model: "Tiguan", pret: 85, status: "Disponibil", 
        an: 2018, km: 145000, revizieLaKM: 150000, profit: 12500, motor: "2.0 TDI", combustibil: "Diesel", 
        consum: "7.5L/100km", inchirieriLuna: 18, mentenantaLuna: 200, combustibilLuna: 450,
        reparatie: { descriere: "Schimb ulei cutie DSG + Filtre", cost: 450, timp: "5 ore" }
    },
    { 
        id: 6, marca: "Dacia", model: "Duster", pret: 55, status: "Închiriat", 
        an: 2020, km: 89000, revizieLaKM: 89500, profit: 10200, motor: "1.5 dCi", combustibil: "Diesel", 
        consum: "5.8L/100km", inchirieriLuna: 25, mentenantaLuna: 120, combustibilLuna: 300,
        reparatie: { descriere: "Revizie standard (Ulei + Filtre)", cost: 110, timp: "3 ore" }
    },
    { 
        id: 7, marca: "Skoda", model: "Superb", pret: 95, status: "Disponibil", 
        an: 2021, km: 112000, revizieLaKM: 120000, profit: 14800, motor: "2.0 TDI", combustibil: "Diesel", 
        consum: "6.0L/100km", inchirieriLuna: 20, mentenantaLuna: 250, combustibilLuna: 400,
        reparatie: { descriere: "Schimb kit distribuție (Programat)", cost: 650, timp: "1 zi" }
    },
    { 
        id: 8, marca: "Dacia", model: "Logan", pret: 35, status: "Disponibil", 
        an: 2019, km: 167000, revizieLaKM: 175000, profit: 7500, motor: "1.0 TCe", combustibil: "Benzină", 
        consum: "6.5L/100km", inchirieriLuna: 26, mentenantaLuna: 80, combustibilLuna: 280,
        reparatie: { descriere: "Verificare sistem climatizare", cost: 80, timp: "2 ore" }
    },
    { 
        id: 9, marca: "Renault", model: "Megane", pret: 65, status: "Mentenanță", 
        an: 2017, km: 215000, revizieLaKM: 220000, profit: 11000, motor: "1.6 dCi", combustibil: "Diesel", 
        consum: "5.2L/100km", inchirieriLuna: 14, mentenantaLuna: 150, combustibilLuna: 250,
        reparatie: { descriere: "Schimb kit distribuție + pompă apă", cost: 1200, timp: "4 zile" }
    }
];

app.get("/service-board", (req, res) => {
    // Luăm doar mașinile care sunt în Mentenanță
    const masiniInService = flotaMasini.filter(c => c.status === "Mentenanță");
    
    res.render("service.ejs", { masini: masiniInService });
});

app.get("/", (req, res) => {
    res.render("index.ejs", { masini: flotaMasini });
});

// RUTA CARE AFIȘEAZĂ FORMULARUL (Cea care îți lipsește)
app.get("/add", (req, res) => {
    res.render("add.ejs");
});

app.post("/add-car", (req, res) => {
    // Generăm un ID nou (ID-ul ultimei mașini + 1)
    const nouID = flotaMasini.length > 0 ? flotaMasini[flotaMasini.length - 1].id + 1 : 1;

    // Construim obiectul complet
    const masinaNoua = {
        id: nouID,
        marca: req.body.marca,
        model: req.body.model,
        an: parseInt(req.body.an),
        km: parseInt(req.body.km),
        revizieLaKM: parseInt(req.body.revizieLaKM),
        motor: req.body.motor,
        consum: req.body.consum,
        pret: parseInt(req.body.pret),
        status: req.body.status,
        combustibil: req.body.combustibil,
        // Inițializăm restul valorilor cu 0 sau default ca să nu crape Analytics
        inchirieriLuna: 0,
        profit: 0,
        mentenantaLuna: 0,
        combustibilLuna: 0,
        reparatie: { descriere: "Nicio lucrare programată", cost: 0, timp: "N/A" }
    };

    flotaMasini.push(masinaNoua);
    console.log(`[ADMIN] S-a adăugat o mașină nouă: ${masinaNoua.marca}`);
    
    res.redirect("/"); // Ne întoarcem la dashboard
});

app.post("/delete", (req, res) => {
    const idDeSters = parseInt(req.body.id);
    
    flotaMasini = flotaMasini.filter(car => car.id !== idDeSters);
    
    console.log(`Am șters mașina cu ID: ${idDeSters}`);
    res.redirect("/");
});


app.get("/edit/:id", (req, res) => {
    const idCautat = parseInt(req.params.id);
    const masinaDeEditat = flotaMasini.find(car => car.id === idCautat);

    if (masinaDeEditat) {
        res.render("edit.ejs", { masina: masinaDeEditat });
    } else {
        res.redirect("/"); 
    }
});


app.post("/edit/:id", (req, res) => {
    const idActualizat = parseInt(req.params.id);
    const index = flotaMasini.findIndex(car => car.id === idActualizat);

    if (index !== -1) { 
        flotaMasini[index] = {
            id: idActualizat,
            marca: req.body.marca,
            model: req.body.model,
            pret: req.body.pret,
            status: req.body.status
        };
    }

    res.redirect("/");
});

// Aceasta este "camera" pe care o caută browserul
app.get("/car/:id", (req, res) => {
    const id = parseInt(req.params.id); // Extrage 4 din URL
    const masinaGasita = flotaMasini.find(c => c.id === id); // Caută în listă

    if (masinaGasita) {
        // Dacă o găsește, randează pagina de detalii
        res.render("details.ejs", { masina: masinaGasita });
    } else {
        // Dacă nu (ex: scrii /car/999), dă eroare
        res.status(404).send("Mașina nu a fost găsită în baza DRVEhub!");
    }
});


app.get("/status/:tip", (req, res) => {
    const statusCautat = req.params.tip; 
    const masiniFiltrate = flotaMasini.filter(car => car.status === statusCautat);

    res.render("index.ejs", { 
        masini: masiniFiltrate, 
        titluPagina: `Mașini: ${statusCautat}` 
    });
});

app.get("/analytics", (req, res) => {
    const statisticiMasini = flotaMasini.map(car => {
        const venitBrut = car.pret * car.inchirieriLuna;
        const totalCosturi = car.mentenantaLuna + car.combustibilLuna;
        return {
            ...car,
            venitBrut: venitBrut,
            costuri: totalCosturi,
            profitNet: venitBrut - totalCosturi // Aici e profitul tău real
        };
    });

    const totalFlotaNet = statisticiMasini.reduce((sum, car) => sum + car.profitNet, 0);

    res.render("analytics.ejs", { 
        masini: statisticiMasini, 
        totalNet: totalFlotaNet 
    });
});

app.post("/update-status/:id", (req, res) => {
    const id = parseInt(req.params.id); // ID-ul mașinii (ex: 1)
    const noulStatus = req.body.status; // Statusul trimis de buton (ex: "Mentenanță")

    // Căutăm mașina în array-ul flotaMasini
    const masinaIndex = flotaMasini.findIndex(m => m.id === id);

    if (masinaIndex !== -1) {
        // Actualizăm statusul în memorie
        flotaMasini[masinaIndex].status = noulStatus;
        console.log(`[ADMIN] Mașina ${flotaMasini[masinaIndex].marca} a fost mutată în: ${noulStatus}`);
    } else {
        console.log(`[EROARE] Mașina cu ID ${id} nu a fost găsită.`);
    }

    // După ce am făcut modificarea, trimitem browserul înapoi la pagina mașinii
    res.redirect(`/car/${id}`);
});

app.listen(port, () => {
    console.log(`Serverul ruleaza pe portul ${port}`);
});

