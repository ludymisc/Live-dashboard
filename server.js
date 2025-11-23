import express from "express";
import pool from "./db.js";
import { fileURLToPath } from  "url";
import path from "path";
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"))
});

app.get("/api/stock_check", async(req, res) => {
    try {
        const stock_info = `SELECT * FROM stock;`;
        const result = await pool.query(stock_info);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});

app.get("/restock", (req, res) => {
    exec("python script.py", (error, stdout, stderr) => {
        if (error) {
            console.error("Python error:", error);
            return res.status(500).send("Python error");
        }
        console.log("Python output:", stdout);
        res.send("Restock generated");
    });
});

app.get("/restock-info", async(req, res) => {
    try{
        const stock_info = `SELECT item_id, restock_id, quantity, added_at
        FROM restock_detail ORDER BY added_at;`;

        const result = await pool.query(stock_info);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});

app.get("/nuke-restock", async(req, res) => {
    try {
        const nukeQuery = `TRUNCATE TABLE restock_detail RESTART IDENTITY;`;
        await pool.query(nukeQuery);
        res.send("restock_detail table nuked");
    } catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});

app.get("/nuke-stock", async(req, res) => {
    try {
        const nukeQuery = `TRUNCATE TABLE stock RESTART IDENTITY;`;
        await pool.query(nukeQuery);    
        const rebuildQuery = `INSERT INTO stock (item_id, item_qty, updated_at)
        VALUES (1, 0, NOW()), (2, 0, NOW()), (3, 0, NOW());`;
        await pool.query(rebuildQuery);
        res.send("stock table nuked");
    } catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});

app.get("/nuke-both", async(req, res) => {
    try {
        const nuke_both = `TRUNCATE TABLE restock_detail, stock RESTART IDENTITY;`;
        await pool.query(nuke_both);
        res.send("both stock and restock_detail tables nuked");
        const rebuildQuery = `INSERT INTO stock (item_id, item_qty, updated_at)
        VALUES (1, 0, NOW()), (2, 0, NOW()), (3, 0, NOW());`;
        await pool.query(rebuildQuery);
    } catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});

app.get("/api/stock_table", async(req, res) => {
    try {
        const stock_info = `
        SELECT s.item_id, i.item_name AS item_name, s.item_qty, s.updated_at
        FROM stock s
        LEFT JOIN items i ON s.item_id = i.id`;
        const result = await pool.query(stock_info);
        const ITEM_NAMES = { 1: 'Apel', 2: 'Pisang', 3: 'Jeruk' };
        const rows = result.rows.map(r => ({
            ...r,
            item_name: r.item_name || ITEM_NAMES[r.item_id] || null
        }));

        return res.json(rows);
    } catch (err) {
        console.error("stock_table query error, falling back:", err.message || err);
        try {
            const fallback = `SELECT item_id, item_qty, updated_at FROM stock`;
            const result2 = await pool.query(fallback);
            const ITEM_NAMES = { 1: 'Apel', 2: 'Pisang', 3: 'Jeruk' };
            const rows = result2.rows.map(r => ({
                item_id: r.item_id,
                item_name: ITEM_NAMES[r.item_id] || null,
                item_qty: r.item_qty,
                updated_at: r.updated_at
            }));
            return res.json(rows);
        } catch (err2) {
            console.error("fallback stock_table query also failed:", err2);
            res.status(500).json({ error: 'failed to read stock table' });
        }
    }
});

app.listen(process.env.PORT, () => {
    console.log("server running on port " + process.env.PORT);
});