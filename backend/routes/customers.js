const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/customers — List all customers with vehicle count
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT c.*, COUNT(v.vehicle_id) AS vehicle_count
            FROM customers c
            LEFT JOIN vehicles v ON c.customer_id = v.customer_id
        `;
        let params = [];

        if (search && search.trim() !== '') {
            query += ` WHERE c.first_name LIKE ? OR c.last_name LIKE ? 
                        OR c.email LIKE ? OR c.phone LIKE ?`;
            const searchTerm = `%${search}%`;
            params = [searchTerm, searchTerm, searchTerm, searchTerm];
        }

        const finalLimit = parseInt(limit) || 10;
        const finalOffset = parseInt(offset) || 0;
        query += ` GROUP BY c.customer_id ORDER BY c.created_at DESC LIMIT ${finalLimit} OFFSET ${finalOffset}`;

        const [customers] = await db.query(query, params);

        // Total count for pagination
        const [countResult] = await db.query('SELECT COUNT(*) AS total FROM customers');
        const totalCount = countResult && countResult[0] ? countResult[0].total : 0;

        res.json({
            data: customers,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalCount / limit)
            }
        });
    } catch (err) {
        console.error('CUSTOMERS ROUTE ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/customers/:id — Detailed Profile (Demonstrates SQL VIEWS)
router.get('/:id', async (req, res) => {
    try {
        // Basic customer info
        const [customer] = await db.query(
            'SELECT * FROM customers WHERE customer_id = ?', [req.params.id]
        );

        if (customer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Use the VIEW for rich service history (DBMS Feature: VIEW)
        const [history] = await db.query(
            'SELECT * FROM vw_customer_service_history WHERE customer_id = ?', 
            [req.params.id]
        );

        // Current vehicles
        const [vehicles] = await db.query(
            'SELECT * FROM vehicles WHERE customer_id = ?', [req.params.id]
        );

        res.json({
            customer: customer[0],
            vehicles,
            serviceHistory: history
        });
    } catch (err) {
        console.error('CUSTOMERS ROUTE ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/customers — Create new customer
router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, email, phone,
                address_street, address_city, address_state, address_zip } = req.body;

        const [result] = await db.query(
            `INSERT INTO customers 
             (first_name, last_name, email, phone, address_street, address_city, address_state, address_zip)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, phone, address_street, address_city, address_state, address_zip]
        );

        res.status(201).json({ 
            message: 'Customer created!', 
            customerId: result.insertId 
        });
    } catch (err) {
        console.error('CUSTOMERS ROUTE ERROR:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already exists.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/customers/:id — Update customer
router.put('/:id', async (req, res) => {
    try {
        const { first_name, last_name, email, phone,
                address_street, address_city, address_state, address_zip } = req.body;

        const [result] = await db.query(
            `UPDATE customers SET first_name=?, last_name=?, email=?, phone=?,
             address_street=?, address_city=?, address_state=?, address_zip=?
             WHERE customer_id=?`,
            [first_name, last_name, email, phone, 
             address_street, address_city, address_state, address_zip, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json({ message: 'Customer updated!' });
    } catch (err) {
        console.error('CUSTOMERS ROUTE ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/customers/:id — Delete customer (CASCADE deletes vehicles too)
router.delete('/:id', async (req, res) => {
    try {
        // Audit BEFORE delete (to capture id)
        await db.execute(
            'INSERT INTO audit_log (table_name, operation, record_id, old_values) VALUES (?, ?, ?, ?)',
            ['customers', 'DELETE', req.params.id, JSON.stringify({ note: 'Permanent deletion' })]
        );

        const [result] = await db.query(
            'DELETE FROM customers WHERE customer_id = ?', [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json({ message: 'Customer deleted (vehicles cascaded).' });
    } catch (err) {
        console.error('CUSTOMERS ROUTE ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
