const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/orders — All orders with details
router.get('/', async (req, res) => {
    try {
        const { status, from_date, to_date } = req.query;
        let query = `
            SELECT so.*, 
                   CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                   c.phone AS customer_phone,
                   CONCAT(v.make, ' ', v.model) AS vehicle,
                   v.license_plate
            FROM service_orders so
            JOIN customers c ON so.customer_id = c.customer_id
            JOIN vehicles v ON so.vehicle_id = v.vehicle_id
            WHERE 1=1
        `;
        let params = [];

        if (status) {
            query += ' AND so.status = ?';
            params.push(status);
        }
        if (from_date) {
            query += ' AND DATE(so.order_date) >= ?';
            params.push(from_date);
        }
        if (to_date) {
            query += ' AND DATE(so.order_date) <= ?';
            params.push(to_date);
        }

        query += ' ORDER BY so.order_date DESC';
        const [orders] = await db.execute(query, params);
        res.json(orders);
    } catch (err) {
        console.error('SERVICE ORDERS ROUTE ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:id — Full order detail
router.get('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;

        const [order] = await db.execute(`
            SELECT so.*, CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                   c.email, c.phone, v.license_plate, CONCAT(v.make, ' ', v.model) AS vehicle
            FROM service_orders so
            JOIN customers c ON so.customer_id = c.customer_id
            JOIN vehicles v ON so.vehicle_id = v.vehicle_id
            WHERE so.order_id = ?
        `, [orderId]);

        if (order.length === 0) return res.status(404).json({ error: 'Order not found' });

        const [lineItems] = await db.execute(`
            SELECT sli.*, s.service_name, sc.category_name
            FROM service_line_items sli
            JOIN services s ON sli.service_id = s.service_id
            LEFT JOIN service_categories sc ON s.category_id = sc.category_id
            WHERE sli.order_id = ?
        `, [orderId]);

        const [partsUsed] = await db.execute(`
            SELECT pu.*, p.part_name, p.part_number
            FROM parts_used pu
            JOIN parts p ON pu.part_id = p.part_id
            WHERE pu.order_id = ?
        `, [orderId]);

        const [mechanics] = await db.execute(`
            SELECT ma.*, CONCAT(m.first_name, ' ', m.last_name) AS mechanic_name,
                   m.specialization
            FROM mechanic_assignments ma
            JOIN mechanics m ON ma.mechanic_id = m.mechanic_id
            WHERE ma.order_id = ?
        `, [orderId]);

        const [payments] = await db.execute(
            'SELECT * FROM payments WHERE order_id = ?', [orderId]
        );

        const [feedback] = await db.execute(
            'SELECT * FROM feedback WHERE order_id = ?', [orderId]
        );

        res.json({
            order: order[0],
            lineItems,
            partsUsed,
            mechanics,
            payments,
            feedback: feedback[0] || null
        });
    } catch (err) {
        console.error('SERVICE ORDERS ROUTE ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

// ★★★ POST /api/orders — Create order using STORED PROCEDURE (ACID) ★★★
router.post('/', async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { appointment_id, vehicle_id, customer_id, mechanic_id,
                services: serviceItems, parts: partItems, estimated_days } = req.body;

        // ★ BEGIN TRANSACTION ★
        await connection.beginTransaction();

        // 1. Create service order
        const [orderResult] = await connection.execute(
            `INSERT INTO service_orders (appointment_id, vehicle_id, customer_id, estimated_completion)
             VALUES (?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY))`,
            [appointment_id || null, vehicle_id, customer_id, estimated_days || 1]
        );
        const orderId = orderResult.insertId;

        // 2. Add service line items
        if (serviceItems && serviceItems.length > 0) {
            for (let i = 0; i < serviceItems.length; i++) {
                const item = serviceItems[i];
                await connection.execute(
                    `INSERT INTO service_line_items (order_id, line_number, service_id, quantity, unit_price, discount_percent)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [orderId, i + 1, item.service_id, item.quantity || 1, 
                     item.unit_price, item.discount_percent || 0]
                );
            }
        }

        // 3. Add parts used (triggers auto-deduct inventory)
        if (partItems && partItems.length > 0) {
            for (const part of partItems) {
                // Check stock availability
                const [stock] = await connection.execute(
                    'SELECT quantity_in_stock FROM parts WHERE part_id = ? FOR UPDATE',  // ★ Row Lock ★
                    [part.part_id]
                );

                if (stock[0].quantity_in_stock < part.quantity_used) {
                    await connection.rollback();
                    return res.status(400).json({ 
                        error: `Insufficient stock for part ID ${part.part_id}` 
                    });
                }

                await connection.execute(
                    `INSERT INTO parts_used (order_id, part_id, quantity_used, unit_price)
                     VALUES (?, ?, ?, ?)`,
                    [orderId, part.part_id, part.quantity_used, part.unit_price]
                );
            }
        }

        // 4. Assign mechanic
        if (mechanic_id) {
            await connection.execute(
                'INSERT INTO mechanic_assignments (order_id, mechanic_id) VALUES (?, ?)',
                [orderId, mechanic_id]
            );
        }

        // 5. Update appointment status
        if (appointment_id) {
            await connection.execute(
                "UPDATE appointments SET status = 'in_progress' WHERE appointment_id = ?",
                [appointment_id]
            );
        }

        // 6. Recalculate totals
        const [laborCost] = await connection.execute(
            'SELECT COALESCE(SUM(line_total), 0) AS total FROM service_line_items WHERE order_id = ?',
            [orderId]
        );
        const [partsCost] = await connection.execute(
            'SELECT COALESCE(SUM(quantity_used * unit_price), 0) AS total FROM parts_used WHERE order_id = ?',
            [orderId]
        );

        const totalLabor = laborCost[0].total;
        const totalParts = partsCost[0].total;
        const totalAmount = (parseFloat(totalLabor) + parseFloat(totalParts)) * 1.13; // 13% tax

        console.log(`ORDER ${orderId} CALC: Labor=${totalLabor}, Parts=${totalParts}, Total=${totalAmount}`);

        await connection.execute(
            `UPDATE service_orders 
             SET total_labor_cost = ?, total_parts_cost = ?, total_amount = ?, status = 'in_progress'
             WHERE order_id = ?`,
            [totalLabor, totalParts, totalAmount, orderId]
        );

        // ★ AUDIT LOG — Manual Trigger Simulation (DBMS Feature: Audit Trail) ★
        await connection.execute(
            `INSERT INTO audit_log (table_name, operation, record_id, new_values) 
             VALUES (?, ?, ?, ?)`,
            ['service_orders', 'INSERT', orderId, JSON.stringify({ 
                totalAmount: totalAmount.toFixed(2), 
                customer_id, 
                vehicle_id 
            })]
        );

        // ★ COMMIT — All changes become permanent ★
        await connection.commit();

        res.status(201).json({ 
            message: 'Service order created successfully!', 
            orderId,
            totalAmount: totalAmount.toFixed(2)
        });

    } catch (err) {
        // ★ ROLLBACK — Undo all changes on error ★
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// PUT /api/orders/:id/complete — Complete order & process payment
router.put('/:id/complete', async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { payment_method } = req.body;
        const orderId = req.params.id;

        await connection.beginTransaction();

        // Get order total
        const [order] = await connection.execute(
            'SELECT total_amount, customer_id FROM service_orders WHERE order_id = ?',
            [orderId]
        );

        if (order.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update order status
        await connection.execute(
            `UPDATE service_orders 
             SET status = 'completed', actual_completion = NOW()
             WHERE order_id = ?`,
            [orderId]
        );

        // Create payment
        await connection.execute(
            `INSERT INTO payments (order_id, amount, payment_method, transaction_ref, status)
             VALUES (?, ?, ?, CONCAT('TXN-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', ?), 'completed')`,
            [orderId, order[0].total_amount, payment_method, orderId]
        );

        // Free mechanics
        const [assignments] = await connection.execute(
            'SELECT mechanic_id FROM mechanic_assignments WHERE order_id = ?', [orderId]
        );
        for (const a of assignments) {
            await connection.execute(
                "UPDATE mechanics SET status = 'available' WHERE mechanic_id = ?",
                [a.mechanic_id]
            );
        }

        await connection.commit();
        res.json({ message: 'Order completed!', amount: order[0].total_amount });

    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// PUT /api/orders/:id/deliver — Mark as delivered
router.put('/:id/deliver', async (req, res) => {
    try {
        const [result] = await db.query(
            "UPDATE service_orders SET status = 'delivered' WHERE order_id = ? AND status = 'completed'",
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Order must be COMPLETED before delivery or order not found.' });
        }
        res.json({ message: 'Asset delivered to client!' });
    } catch (err) {
        console.error('SERVICE ORDERS ROUTE ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
