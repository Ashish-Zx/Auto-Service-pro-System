const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET all appointments
router.get('/', async (req, res) => {
    try {
        const [appointments] = await db.execute(`
            SELECT a.*, 
                   CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                   c.phone,
                   CONCAT(v.make, ' ', v.model) AS vehicle,
                   v.license_plate
            FROM appointments a
            JOIN customers c ON a.customer_id = c.customer_id
            JOIN vehicles v ON a.vehicle_id = v.vehicle_id
            ORDER BY a.appointment_date DESC, a.appointment_time ASC
        `);
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST - book appointment (with concurrency check)
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { customer_id, vehicle_id, appointment_date, appointment_time, notes } = req.body;

        await connection.beginTransaction();

        // Check for time slot conflict (Concurrency Control)
        const [conflicts] = await connection.execute(`
            SELECT COUNT(*) AS cnt FROM appointments 
            WHERE appointment_date = ? 
              AND appointment_time = ? 
              AND status NOT IN ('cancelled', 'completed')
            FOR UPDATE
        `, [appointment_date, appointment_time]);

        if (conflicts[0].cnt >= 3) { // Max 3 appointments per slot
            await connection.rollback();
            return res.status(409).json({ error: 'Time slot is fully booked!' });
        }

        const [result] = await connection.execute(
            `INSERT INTO appointments (customer_id, vehicle_id, appointment_date, appointment_time, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [customer_id, vehicle_id, appointment_date, appointment_time, notes]
        );

        await connection.commit();
        res.status(201).json({ message: 'Appointment booked!', appointmentId: result.insertId });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// PUT - update status
router.put('/:id', async (req, res) => {
    try {
        const { status, notes } = req.body;
        await db.execute(
            'UPDATE appointments SET status = ?, notes = ? WHERE appointment_id = ?',
            [status, notes, req.params.id]
        );
        res.json({ message: 'Appointment updated!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
