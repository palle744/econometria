import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import db from './db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../dist')));

// Handle client-side routing by serving index.html for all non-API routes
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the URL to access the file
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// --- Collaborators Routes ---

// Get all collaborators
app.get('/api/collaborators', (req, res) => {
    db.all("SELECT * FROM collaborators", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Fetch documents for each collaborator? Or fetch separately. 
        // For list view, basic info is enough.
        res.json(rows);
    });
});

// Get single collaborator with documents
app.get('/api/collaborators/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM collaborators WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Collaborator not found' });

        db.all("SELECT * FROM collaborator_documents WHERE collaboratorId = ?", [id], (err, docs) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...row, documents: docs });
        });
    });
});

// Create collaborator
app.post('/api/collaborators', (req, res) => {
    const {
        id, name, birthDate, gender, phone, personalEmail, corporateEmail,
        assignedComputer, assignedPhone, position, salary, startDate, photoUrl, isActive,
        computerBrand, computerModel, computerSerial, computerColor,
        phoneBrand, phoneModel, phoneSerial, phoneColor
    } = req.body;

    const sql = `INSERT INTO collaborators (
        id, name, birthDate, gender, phone, personalEmail, corporateEmail, 
        assignedComputer, assignedPhone, position, salary, startDate, photoUrl, isActive,
        computerBrand, computerModel, computerSerial, computerColor,
        phoneBrand, phoneModel, phoneSerial, phoneColor
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        id, name, birthDate, gender, phone, personalEmail, corporateEmail,
        assignedComputer ? 1 : 0, assignedPhone ? 1 : 0, position, salary, startDate, photoUrl, isActive ? 1 : 0,
        computerBrand, computerModel, computerSerial, computerColor,
        phoneBrand, phoneModel, phoneSerial, phoneColor
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, ...req.body });
    });
});

// Update collaborator
app.put('/api/collaborators/:id', (req, res) => {
    const { id } = req.params;
    const {
        name, birthDate, gender, phone, personalEmail, corporateEmail,
        assignedComputer, assignedPhone, position, salary, startDate, photoUrl, isActive,
        computerBrand, computerModel, computerSerial, computerColor,
        phoneBrand, phoneModel, phoneSerial, phoneColor
    } = req.body;

    const sql = `UPDATE collaborators SET 
        name = ?, birthDate = ?, gender = ?, phone = ?, personalEmail = ?, corporateEmail = ?, 
        assignedComputer = ?, assignedPhone = ?, position = ?, salary = ?, startDate = ?, photoUrl = ?, isActive = ?,
        computerBrand = ?, computerModel = ?, computerSerial = ?, computerColor = ?,
        phoneBrand = ?, phoneModel = ?, phoneSerial = ?, phoneColor = ?
        WHERE id = ?`;

    const params = [
        name, birthDate, gender, phone, personalEmail, corporateEmail,
        assignedComputer ? 1 : 0, assignedPhone ? 1 : 0, position, salary, startDate, photoUrl, isActive ? 1 : 0,
        computerBrand, computerModel, computerSerial, computerColor,
        phoneBrand, phoneModel, phoneSerial, phoneColor,
        id
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Collaborator updated' });
    });
});

// Delete collaborator
app.delete('/api/collaborators/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM collaborators WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Collaborator deleted' });
    });
});

// Add Document
app.post('/api/collaborator_documents', (req, res) => {
    const { id, collaboratorId, name, type, url, uploadDate } = req.body;
    const sql = `INSERT INTO collaborator_documents (id, collaboratorId, name, type, url, uploadDate) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [id, collaboratorId, name, type, url, uploadDate], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, ...req.body });
    });
});

// Delete Document
app.delete('/api/collaborator_documents/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM collaborator_documents WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Document deleted' });
    });
});

// --- Users Routes ---
// --- Warehouses ---
app.get('/api/warehouses', (req, res) => {
    db.all("SELECT * FROM warehouses", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/warehouses', (req, res) => {
    const { id, name, location, capacity } = req.body;
    db.run("INSERT INTO warehouses (id, name, location, capacity) VALUES (?, ?, ?, ?)",
        [id, name, location, capacity],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, name, location, capacity });
        }
    );
});

app.put('/api/warehouses/:id', (req, res) => {
    const { name, location, capacity } = req.body;
    db.run("UPDATE warehouses SET name = ?, location = ?, capacity = ? WHERE id = ?",
        [name, location, capacity, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Updated", changes: this.changes });
        }
    );
});

app.delete('/api/warehouses/:id', (req, res) => {
    db.run("DELETE FROM warehouses WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted", changes: this.changes });
    });
});

// --- Clients ---
app.get('/api/clients', (req, res) => {
    db.all("SELECT * FROM clients", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/clients', (req, res) => {
    const { id, name, email, phone, description, address, photoUrl } = req.body;
    db.run("INSERT INTO clients (id, name, email, phone, description, address, photoUrl) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, name, email, phone, description, address, photoUrl],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json(req.body);
        }
    );
});

app.put('/api/clients/:id', (req, res) => {
    const { name, email, phone, description, address, photoUrl } = req.body;
    db.run("UPDATE clients SET name = ?, email = ?, phone = ?, description = ?, address = ?, photoUrl = ? WHERE id = ?",
        [name, email, phone, description, address, photoUrl, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Updated" });
        }
    );
});

app.delete('/api/clients/:id', (req, res) => {
    db.run("DELETE FROM clients WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// --- Inventory ---
app.get('/api/inventory', (req, res) => {
    db.all("SELECT * FROM inventory", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/inventory', (req, res) => {
    const { id, name, sku, description, quantity, warehouseId } = req.body;
    db.run("INSERT INTO inventory (id, name, sku, description, quantity, warehouseId) VALUES (?, ?, ?, ?, ?, ?)",
        [id, name, sku, description, quantity, warehouseId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json(req.body);
        }
    );
});

app.put('/api/inventory/:id', (req, res) => {
    const { name, sku, description, quantity, warehouseId } = req.body;
    db.run("UPDATE inventory SET name = ?, sku = ?, description = ?, quantity = ?, warehouseId = ? WHERE id = ?",
        [name, sku, description, quantity, warehouseId, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Updated" });
        }
    );
});

app.delete('/api/inventory/:id', (req, res) => {
    db.run("DELETE FROM inventory WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// --- Movements ---
app.get('/api/movements', (req, res) => {
    db.all("SELECT * FROM movements", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/movements', (req, res) => {
    const { id, type, itemId, quantity, date, userId, clientId, qrCode } = req.body;

    // Transaction for movement + inventory update
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run("INSERT INTO movements (id, type, itemId, quantity, date, userId, clientId, qrCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [id, type, itemId, quantity, date, userId, clientId, qrCode],
            function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err.message });
                }
            }
        );

        // Update inventory quantity
        const operator = type === 'IN' ? '+' : '-';
        db.run(`UPDATE inventory SET quantity = quantity ${operator} ? WHERE id = ?`,
            [quantity, itemId],
            function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err.message });
                }
                db.run("COMMIT");
                res.json(req.body);
            }
        );
    });
});

// --- Orders ---
app.get('/api/orders', (req, res) => {
    const sql = `
        SELECT o.*, 
               json_group_array(json_object('itemId', oi.itemId, 'quantity', oi.quantity)) as items 
        FROM orders o 
        LEFT JOIN order_items oi ON o.id = oi.orderId 
        GROUP BY o.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Parse items JSON string back to object
        const orders = rows.map(row => ({
            ...row,
            items: JSON.parse(row.items).filter(i => i.itemId) // Filter out nulls from left join
        }));
        res.json(orders);
    });
});

app.post('/api/orders', (req, res) => {
    const { id, uniqueId, type, items, status, qrCode, createdAt, warehouseId, clientId, createdByUserId } = req.body;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run("INSERT INTO orders (id, uniqueId, type, status, qrCode, createdAt, warehouseId, clientId, createdByUserId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [id, uniqueId, type, status, qrCode, createdAt, warehouseId, clientId, createdByUserId],
            function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err.message });
                }
            }
        );

        const stmt = db.prepare("INSERT INTO order_items (orderId, itemId, quantity) VALUES (?, ?, ?)");
        items.forEach(item => {
            stmt.run(id, item.itemId, item.quantity);
        });
        stmt.finalize(err => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }
            db.run("COMMIT");
            res.json(req.body);
        });
    });
});

app.put('/api/orders/:id', (req, res) => {
    const { status, completedAt, completedByUserId, cancellationReason } = req.body;

    let sql = "UPDATE orders SET status = ?";
    let params = [status];

    if (completedAt) {
        sql += ", completedAt = ?";
        params.push(completedAt);
    }

    if (completedByUserId) {
        sql += ", completedByUserId = ?";
        params.push(completedByUserId);
    }

    if (cancellationReason) {
        sql += ", cancellationReason = ?";
        params.push(cancellationReason);
    }

    sql += " WHERE id = ?";
    params.push(req.params.id);

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated" });
    });
});

// --- Auth Verification ---
app.post('/api/auth/verify', (req, res) => {
    const { userId, password } = req.body;
    db.get("SELECT password FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!row) return res.status(404).json({ error: "User not found" });

        // In a real app, compare hashed passwords. Here simple string comparison.
        if (row.password === password) {
            res.json({ valid: true });
        } else {
            res.json({ valid: false });
        }
    });
});

// --- Users ---
app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/users', (req, res) => {
    const { id, name, email, password, role, position, photoUrl } = req.body;
    db.run("INSERT INTO users (id, name, email, password, role, position, photoUrl) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, name, email, password, role, position, photoUrl],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json(req.body);
        }
    );
});

app.put('/api/users/:id', (req, res) => {
    const { name, email, role, position, photoUrl } = req.body;
    db.run("UPDATE users SET name = ?, email = ?, role = ?, position = ?, photoUrl = ? WHERE id = ?",
        [name, email, role, position, photoUrl, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Updated" });
        }
    );
});

app.delete('/api/users/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
