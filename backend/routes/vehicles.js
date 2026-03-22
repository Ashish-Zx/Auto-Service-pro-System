const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/vehicles
router.get('/', async (req, res) => {
    try {
        const [vehicles] = await db.execute(`
            SELECT v.*, CONCAT(c.first_name, ' ', c.last_name) AS owner_name, c.phone AS owner_phone
            FROM vehicles v
            JOIN customers c ON v.customer_id = c.customer_id
            ORDER BY v.vehicle_id DESC
        `);
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res) => {
    try {
        const [vehicle] = await db.execute(`
            SELECT v.*, CONCAT(c.first_name, ' ', c.last_name) AS owner_name
            FROM vehicles v
            JOIN customers c ON v.customer_id = c.customer_id
            WHERE v.vehicle_id = ?
        `, [req.params.id]);

        if (vehicle.length === 0) return res.status(404).json({ error: 'Not found' });

        // Service history for this vehicle
        const [history] = await db.execute(`
            SELECT so.order_id, so.order_date, so.status, so.total_amount,
                   GROUP_CONCAT(s.service_name SEPARATOR ', ') AS services_done
            FROM service_orders so
            LEFT JOIN service_line_items sli ON so.order_id = sli.order_id
            LEFT JOIN services s ON sli.service_id = s.service_id
            WHERE so.vehicle_id = ?
            GROUP BY so.order_id
            ORDER BY so.order_date DESC
        `, [req.params.id]);

        res.json({ vehicle: vehicle[0], serviceHistory: history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/vehicles
router.post('/', async (req, res) => {
    try {
        const { customer_id, license_plate, make, model, year, color, vin, mileage, fuel_type } = req.body;
        const [result] = await db.execute(
            `INSERT INTO vehicles (customer_id, license_plate, make, model, year, color, vin, mileage, fuel_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [customer_id, license_plate, make, model, year, color, vin, mileage || 0, fuel_type || 'petrol']
        );
        res.status(201).json({ message: 'Vehicle added!', vehicleId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/vehicles/:id
router.put('/:id', async (req, res) => {
    try {
        const { license_plate, make, model, year, color, mileage, fuel_type } = req.body;
        await db.execute(
            `UPDATE vehicles SET license_plate=?, make=?, model=?, year=?, color=?, mileage=?, fuel_type=?
             WHERE vehicle_id=?`,
            [license_plate, make, model, year, color, mileage, fuel_type, req.params.id]
        );
        res.json({ message: 'Vehicle updated!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/vehicles/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM vehicles WHERE vehicle_id = ?', [req.params.id]);
        res.json({ message: 'Vehicle deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
