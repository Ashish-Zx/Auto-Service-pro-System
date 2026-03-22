const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET inventory with stock status (uses VIEW)
router.get('/', async (req, res) => {
    try {
        const [parts] = await db.execute('SELECT * FROM vw_inventory_status');
        res.json(parts);
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET low stock alerts
router.get('/low-stock', async (req, res) => {
    try {
        const [parts] = await db.execute(`
            SELECT * FROM vw_inventory_status 
            WHERE stock_status IN ('LOW STOCK', 'OUT OF STOCK')
        `);
        res.json(parts);
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - add new part
router.post('/', async (req, res) => {
    try {
        const { part_name, part_number, description, unit_price, 
                quantity_in_stock, reorder_level, supplier_id } = req.body;
        const [result] = await db.execute(
            `INSERT INTO parts (part_name, part_number, description, unit_price, 
                                quantity_in_stock, reorder_level, supplier_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [part_name, part_number, description, unit_price, quantity_in_stock, reorder_level, supplier_id]
        );
        res.status(201).json({ message: 'Part added!', partId: result.insertId });
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT - restock
router.put('/:id/restock', async (req, res) => {
    try {
        const { quantity } = req.body;
        await db.execute(
            'UPDATE parts SET quantity_in_stock = quantity_in_stock + ? WHERE part_id = ?',
            [quantity, req.params.id]
        );

        // Audit Log
        await db.execute(
            'INSERT INTO audit_log (table_name, operation, record_id, new_values) VALUES (?, ?, ?, ?)',
            ['parts', 'RESTOCK', req.params.id, JSON.stringify({ added_quantity: quantity })]
        );

        res.json({ message: `Restocked ${quantity} units!` });
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});
// PUT - edit part
router.put('/:id', async (req, res) => {
    try {
        const { part_name, part_number, description, unit_price, 
                quantity_in_stock, reorder_level, supplier_id } = req.body;
        await db.execute(
            `UPDATE parts SET part_name = ?, part_number = ?, description = ?, unit_price = ?, 
                              quantity_in_stock = ?, reorder_level = ?, supplier_id = ?
             WHERE part_id = ?`,
            [part_name, part_number, description, unit_price, quantity_in_stock, reorder_level, supplier_id, req.params.id]
        );
        res.json({ message: 'Part updated successfully!' });
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET suppliers
router.get('/suppliers', async (req, res) => {
    try {
        const [suppliers] = await db.execute('SELECT supplier_id, company_name as supplier_name FROM suppliers');
        res.json(suppliers);
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST new supplier
router.post('/suppliers', async (req, res) => {
    try {
        const { company_name, contact_person, phone, email } = req.body;
        const [result] = await db.execute(
            'INSERT INTO suppliers (company_name, contact_person, phone, email) VALUES (?, ?, ?, ?)',
            [company_name, contact_person || null, phone || null, email || null]
        );
        res.status(201).json({ message: 'Supplier added!', supplier_id: result.insertId });
    } catch (err) {
        console.error('BACKEND ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
