const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/reports/dashboard — Dashboard stats
router.get('/dashboard', async (req, res) => {
    try {
        // Total customers
        const [customers] = await db.execute('SELECT COUNT(*) AS total FROM customers');
        
        // Active orders
        const [activeOrders] = await db.execute(
            "SELECT COUNT(*) AS total FROM service_orders WHERE status IN ('pending','in_progress')"
        );
        
        // Today's revenue
        const [todayRevenue] = await db.execute(`
            SELECT COALESCE(SUM(amount), 0) AS total 
            FROM payments 
            WHERE DATE(payment_date) = CURDATE() AND status = 'completed'
        `);
        
        // Available mechanics
        const [availMechanics] = await db.execute(
            "SELECT COUNT(*) AS total FROM mechanics WHERE status = 'available'"
        );
        
        // Low stock items
        const [lowStock] = await db.execute(
            "SELECT COUNT(*) AS total FROM vw_inventory_status WHERE stock_status != 'IN STOCK'"
        );
        
        // Avg rating
        const [avgRating] = await db.execute(
            'SELECT COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating FROM feedback'
        );

        res.json({
            totalCustomers: customers[0].total,
            activeOrders: activeOrders[0].total,
            todayRevenue: todayRevenue[0].total,
            availableMechanics: availMechanics[0].total,
            lowStockItems: lowStock[0].total,
            avgRating: avgRating[0].avg_rating
        });
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/revenue — Daily revenue (uses VIEW)
router.get('/revenue', async (req, res) => {
    try {
        const [revenue] = await db.execute('SELECT * FROM vw_daily_revenue LIMIT 30');
        res.json(revenue);
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/service-popularity
router.get('/service-popularity', async (req, res) => {
    try {
        const [data] = await db.execute('SELECT * FROM vw_service_popularity');
        res.json(data);
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/mechanic-performance
router.get('/mechanic-performance', async (req, res) => {
    try {
        const [data] = await db.execute('SELECT * FROM vw_mechanic_workload');
        res.json(data);
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/reports/audit-log — For Activity Feed
router.get('/audit-log', async (req, res) => {
    try {
        const [logs] = await db.execute(
            'SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 20'
        );
        res.json(logs);
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reports/feedback — Submit order feedback (DBMS Feature: Feedback table)
router.post('/feedback', async (req, res) => {
    try {
        const { order_id, rating, comments } = req.body;
        
        // 1. Get customer_id from service_order
        const [[order_res]] = await db.execute('SELECT customer_id FROM service_orders WHERE order_id = ?', [order_id]);
        
        if (!order_res) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const customer_id = order_res.customer_id;

        // 2. Insert feedback
        await db.execute(
            'INSERT INTO feedback (order_id, customer_id, rating, comments) VALUES (?, ?, ?, ?)',
            [order_id, customer_id, rating, comments]
        );

        // 2. Audit Log
        await db.execute(
            'INSERT INTO audit_log (table_name, operation, record_id, new_values) VALUES (?, ?, ?, ?)',
            ['feedback', 'INSERT', order_id, JSON.stringify({ rating, comments: comments.substring(0, 50) })]
        );

        res.status(201).json({ message: 'Feedback submitted successfully!' });
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
