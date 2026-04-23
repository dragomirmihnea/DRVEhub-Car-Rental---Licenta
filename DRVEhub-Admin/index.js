import express from "express";
import bodyParser from "body-parser";
import pkg from 'pg';
import session from 'express-session';
import bcrypt from 'bcrypt';
const saltRounds = 10;

const { Client } = pkg;
const app = express();
const port = 3000;

const db = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'admin123',
  port: 5432,
});

db.connect()
  .then(() => console.log("✅ Conectat cu succes la PostgreSQL!"))
  .catch(err => console.error("❌ Eroare de conexiune:", err.stack));

// creare owner
async function ensureOwnerExists() {
    try {
        const result = await db.query("SELECT * FROM admins WHERE role = 'owner'");
        if (result.rows.length === 0) {
            console.log("⚠️ Nu există niciun Owner. Se creează contul principal...");
            
            
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash('parola_secreta_aici', saltRounds);
            
            await db.query(
                "INSERT INTO admins (username, password, role) VALUES ($1, $2, 'owner')",
                ['admin_principal', hashedPassword]
            );
            console.log("✅ Contul de Owner a fost creat automat");
        }
    } catch (err) {
        console.error("Eroare la crearea Owner-ului:", err.message);
    }
}

ensureOwnerExists();

app.use(express.static("public")); 
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret_key', 
    resave: false, 
    saveUninitialized: true 
}));

// protectie admin
function protectAdmin(req, res, next) {
    if (req.session && req.session.adminId) {
        next(); 
    } else {
        res.redirect("/login-admin"); 
    }
}

app.use((req, res, next) => {
    res.locals.admin = req.session.adminId; 
    res.locals.adminRole = req.session.role;
    next();
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login-admin");
});

app.get("/login-admin", (req, res) => {
    res.render("login.ejs"); 
});


app.get("/register-admin", (req, res) => {
    res.render("register.ejs");
});

// ruta pentru owner
app.get("/admin-settings", async (req, res) => {
    if (req.session.role !== 'owner') {
        return res.status(403).send("Acces interzis! Doar Owner-ul vede asta.");
    }
    const result = await db.query("SELECT * FROM admins");
    res.render("admin-settings.ejs", { admins: result.rows });
});

app.post("/register-admin", async (req, res) => {
    const { username, password, code } = req.body;
    try {
        const codeResult = await db.query("SELECT * FROM invitation_codes WHERE code = $1 AND is_used = FALSE", [code]);
        if (codeResult.rows.length === 0) return res.send("Cod invalid!");

        //hashuire parola 
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        await db.query("INSERT INTO admins (username, password, role) VALUES ($1, $2, 'admin')", [username, hashedPassword]);
        await db.query("UPDATE invitation_codes SET is_used = TRUE WHERE code = $1", [code]);
        res.send("Cont creat! <a href='/login-admin'>Loghează-te</a>");
    } catch (err) {
        res.status(500).send("Eroare: " + err.message);
    }
});

app.post("/login-admin", async (req, res) => {
    const { username, password } = req.body;
    const result = await db.query("SELECT * FROM admins WHERE username=$1", [username]);
    
    if (result.rows.length > 0) {
        const match = await bcrypt.compare(password, result.rows[0].password);
        if (match) {
            req.session.adminId = result.rows[0].id;
            req.session.role = result.rows[0].role;
            res.redirect("/");
        } else {
            res.send("Parolă incorectă!");
        }
    } else {
        res.send("Utilizator inexistent!");
    }
});

const adaptCars = (rows) => {
  return rows.map(car => ({
    ...car,
    reparatie: {
      descriere: car.reparatie_descriere,
      cost: car.reparatie_cost,
      timp: car.reparatie_timp
    }
  }));
};

app.get("/", protectAdmin, async (req, res) => {
    try {
        const search = req.query.search;
        let queryText = `
          SELECT id, marca, model, status, an, km, motor, combustibil, consum, profit,
          pret_zi AS pret, revizie_la_km AS "revizieLaKM", 
          inchirieri_luna AS "inchirieriLuna", mentenanta_luna AS "mentenantaLuna", 
          combustibil_luna AS "combustibilLuna", reparatie_descriere, reparatie_cost, reparatie_timp
          FROM cars
        `;
        let values = [];
        if (search) {
          queryText += ' WHERE marca ILIKE $1 OR model ILIKE $1';
          values.push(`%${search}%`);
        }
        queryText += ' ORDER BY id ASC';
        const result = await db.query(queryText, values);
        
        res.render("index.ejs", { 
            masini: adaptCars(result.rows), 
            searchQuery: search 
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get("/service-board", protectAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cars WHERE status = $1 ORDER BY id ASC', ['Mentenanță']);
        res.render("service.ejs", { masini: adaptCars(result.rows) });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get("/add", protectAdmin, (req, res) => {
    res.render("add.ejs");
});

app.get("/generate-code", async (req, res) => {
    if (req.session.role !== 'owner') return res.status(403).send("Acces interzis!");
    
    // Generăm un cod scurt și ușor de citit
    const cod = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    await db.query("INSERT INTO invitation_codes (code) VALUES ($1)", [cod]);
    res.send(`<h1>Cod generat cu succes: <strong>${cod}</strong></h1><a href='/admin-settings'>Înapoi</a>`);
});

// Și ruta pentru ștergere admin
app.post("/delete-admin", async (req, res) => {
    if (req.session.role !== 'owner') return res.status(403).send("Acces interzis!");
    
    await db.query("DELETE FROM admins WHERE id = $1", [req.body.id]);
    res.redirect("/admin-settings");
});

app.post("/add-car", async (req, res) => {
  try {
    const { marca, model, an, km, revizieLaKM, motor, consum, pret, status, combustibil } = req.body;
    await db.query(`
      INSERT INTO cars (marca, model, an, km, revizie_la_km, motor, consum, pret_zi, status, combustibil)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [marca, model, parseInt(an), parseInt(km), parseInt(revizieLaKM), motor, consum, parseInt(pret), status, combustibil]
    );
    res.redirect("/");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/delete",protectAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM cars WHERE id = $1", [parseInt(req.body.id)]);
    res.redirect("/");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/edit/:id",protectAdmin, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM cars WHERE id = $1", [parseInt(req.params.id)]);
    if (result.rows.length > 0) {
      res.render("edit.ejs", { masina: result.rows[0] });
    } else {
      res.redirect("/");
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/edit/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { marca, model, pret, status, km, motor, consum } = req.body;
    
    await db.query(`
      UPDATE cars 
      SET marca=$1, model=$2, pret_zi=$3, status=$4, km=$5, motor=$6, consum=$7 
      WHERE id=$8`,
      [marca, model, parseInt(pret), status, parseInt(km), motor, consum, id]
    );
    
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Eroare la actualizare: " + err.message);
  }
});

app.get("/car/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM cars WHERE id = $1", [parseInt(req.params.id)]);
    if (result.rows.length > 0) {
      const masina = adaptCars(result.rows)[0];
      res.render("details.ejs", { masina: masina });
    } else {
      res.status(404).send("Mașina nu a fost găsită!");
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/status/:tip", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM cars WHERE status = $1 ORDER BY id ASC", [req.params.tip]);
    res.render("index.ejs", { masini: adaptCars(result.rows), titluPagina: `Mașini: ${req.params.tip}` });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/analytics", protectAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cars');
    
    const statisticiMasini = result.rows.map(car => {
      const pret = Number(car.pret_zi) || 0;
      const inchirieri = Number(car.inchirieri_luna) || 0;
      const mentenanta = Number(car.mentenanta_luna) || 0;
      const gaz = Number(car.combustibil_luna) || 0;

      const venitBrut = pret * inchirieri;
      const totalCosturi = mentenanta + gaz;
      
      return { 
        ...car, 
        pret: pret,
        inchirieriLuna: inchirieri,
        mentenantaLuna: mentenanta,
        combustibilLuna: gaz,
        venitBrut: venitBrut,
        costuri: totalCosturi,
        profitNet: venitBrut - totalCosturi 
      };
    });

    const totalFlotaNet = statisticiMasini.reduce((sum, car) => sum + car.profitNet, 0);

    res.render("analytics.ejs", { 
      masini: statisticiMasini, 
      totalNet: totalFlotaNet 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Eroare la calcularea profitului.");
  }
});

app.post("/update-status/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.query("UPDATE cars SET status = $1 WHERE id = $2", [req.body.status, id]);
    res.redirect(`/car/${id}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Aici definim ruta pentru API
app.get("/api/cars", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM cars");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Eroare la baza de date" });
    }
});

app.listen(port, () => {
  console.log(`Serverul ruleaza pe portul ${port}`);
});