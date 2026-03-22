const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [mechanics] = await db.execute('SELECT * FROM vw_mechanic_workload');
        res.json(mechanics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/available', async (req, res) => {
    try {
        const [mechanics] = await db.execute(
            "SELECT * FROM mechanics WHERE status = 'available' ORDER BY hourly_rate ASC"
        );
        res.json(mechanics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, email, phone, specialization, hire_date, hourly_rate } = req.body;
        const [result] = await db.execute(
            `INSERT INTO mechanics (first_name, last_name, email, phone, specialization, hire_date, hourly_rate)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, phone, specialization, hire_date, hourly_rate]
        );
        res.status(201).json({ message: 'Mechanic added!', mechanicId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
