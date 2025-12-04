
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'database.sqlite');

const verboseSqlite = sqlite3.verbose();
const db = new verboseSqlite.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Warehouses
        db.run(`CREATE TABLE IF NOT EXISTS warehouses(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    capacity INTEGER
)`);

        // Clients
        db.run(`CREATE TABLE IF NOT EXISTS clients(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    description TEXT,
    address TEXT,
    photoUrl TEXT
)`);

        // Inventory Items
        db.run(`CREATE TABLE IF NOT EXISTS inventory(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT,
    description TEXT,
    quantity INTEGER,
    warehouseId TEXT,
    FOREIGN KEY(warehouseId) REFERENCES warehouses(id)
)`);

        // Movements
        db.run(`CREATE TABLE IF NOT EXISTS movements(
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    itemId TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    date TEXT NOT NULL,
    userId TEXT,
    clientId TEXT,
    qrCode TEXT
)`);

        // Orders
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            uniqueId TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            qrCode TEXT,
            createdAt TEXT NOT NULL,
            completedAt TEXT,
            warehouseId TEXT,
            clientId TEXT,
            createdByUserId TEXT,
            completedByUserId TEXT,
            cancellationReason TEXT
        )`);

        // Migration for existing databases
        db.run("ALTER TABLE orders ADD COLUMN createdByUserId TEXT", (err) => { /* ignore if exists */ });
        db.run("ALTER TABLE orders ADD COLUMN completedByUserId TEXT", (err) => { /* ignore if exists */ });
        db.run("ALTER TABLE orders ADD COLUMN cancellationReason TEXT", (err) => { /* ignore if exists */ });

        // Order Items (Many-to-Many relationship for Orders <-> Inventory)
        db.run(`CREATE TABLE IF NOT EXISTS order_items(
    orderId TEXT NOT NULL,
    itemId TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY(orderId) REFERENCES orders(id),
    FOREIGN KEY(itemId) REFERENCES inventory(id)
)`);

        // Users (Basic auth for now)
        db.run(`CREATE TABLE IF NOT EXISTS users(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    position TEXT,
    photoUrl TEXT
)`);

        // Collaborators (HR)
        db.run(`CREATE TABLE IF NOT EXISTS collaborators(
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            birthDate TEXT,
            gender TEXT,
            phone TEXT,
            personalEmail TEXT,
            corporateEmail TEXT,
            assignedComputer INTEGER DEFAULT 0,
            assignedPhone INTEGER DEFAULT 0,
            position TEXT,
            salary REAL,
            startDate TEXT,
            photoUrl TEXT,
            isActive INTEGER DEFAULT 1,
            computerBrand TEXT,
            computerModel TEXT,
            computerSerial TEXT,
            computerColor TEXT,
            phoneBrand TEXT,
            phoneModel TEXT,
            phoneSerial TEXT,
            phoneColor TEXT
        )`);

        // Migration for existing table
        const migrationCols = [
            "isActive INTEGER DEFAULT 1",
            "computerBrand TEXT",
            "computerModel TEXT",
            "computerSerial TEXT",
            "computerColor TEXT",
            "phoneBrand TEXT",
            "phoneModel TEXT",
            "phoneSerial TEXT",
            "phoneColor TEXT"
        ];

        migrationCols.forEach(col => {
            db.run(`ALTER TABLE collaborators ADD COLUMN ${col}`, (err) => {
                // Ignore error if column already exists
            });
        });

        // Collaborator Documents
        db.run(`CREATE TABLE IF NOT EXISTS collaborator_documents(
            id TEXT PRIMARY KEY,
            collaboratorId TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT,
            url TEXT NOT NULL,
            uploadDate TEXT NOT NULL,
            FOREIGN KEY(collaboratorId) REFERENCES collaborators(id) ON DELETE CASCADE
        )`);

        // Seed initial admin user if not exists
        db.get("SELECT id FROM users WHERE email = 'admin@example.com'", (err, row) => {
            if (!row) {
                db.run(`INSERT INTO users(id, name, email, password, role, position)
VALUES('admin_1', 'Admin User', 'admin@example.com', 'admin123', 'admin', 'System Admin')`);
            }
        });
    });
}

export default db;

