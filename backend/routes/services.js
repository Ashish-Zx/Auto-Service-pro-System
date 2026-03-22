const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [services] = await db.execute(`
            SELECT s.*, sc.category_name
            FROM services s
            LEFT JOIN service_categories sc ON s.category_id = sc.category_id
            ORDER BY sc.category_name, s.service_name
        `);
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const [categories] = await db.execute('SELECT * FROM service_categories');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/popularity', async (req, res) => {
    try {
        const [report] = await db.execute('SELECT * FROM vw_service_popularity');
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
