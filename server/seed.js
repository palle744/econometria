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
        process.exit(1);
    }
    console.log('Connected to the SQLite database for seeding.');
    seedData();
});

function seedData() {
    db.serialize(() => {
        // Clear existing data (optional, but good for clean state if requested, but maybe user wants to keep? 
        // User said "populate", usually implies adding. I'll use INSERT OR IGNORE or just INSERT and let it fail if exists, or check counts.
        // To be safe and ensure they have data to work with, I'll insert if not exists.

        console.log('Seeding Warehouses...');
        const warehouses = [
            { id: 'WH-001', name: 'Bodega Central', location: 'Ciudad de México', capacity: 1000 },
            { id: 'WH-002', name: 'Bodega Norte', location: 'Monterrey', capacity: 800 },
            { id: 'WH-003', name: 'Bodega Sur', location: 'Guadalajara', capacity: 600 }
        ];

        const stmtWh = db.prepare("INSERT OR IGNORE INTO warehouses (id, name, location, capacity) VALUES (?, ?, ?, ?)");
        warehouses.forEach(w => stmtWh.run(w.id, w.name, w.location, w.capacity));
        stmtWh.finalize();

        console.log('Seeding Clients...');
        const clients = [
            { id: 'CL-001', name: 'Tech Solutions SA', email: 'contacto@techsolutions.com', phone: '555-0101', description: 'Cliente corporativo', address: 'Av. Reforma 123' },
            { id: 'CL-002', name: 'Distribuidora Global', email: 'ventas@global.com', phone: '555-0202', description: 'Distribuidor mayorista', address: 'Calle Industria 45' },
            { id: 'CL-003', name: 'Comercializadora Local', email: 'info@comercial.com', phone: '555-0303', description: 'Retail', address: 'Plaza Central 8' }
        ];

        const stmtCl = db.prepare("INSERT OR IGNORE INTO clients (id, name, email, phone, description, address) VALUES (?, ?, ?, ?, ?, ?)");
        clients.forEach(c => stmtCl.run(c.id, c.name, c.email, c.phone, c.description, c.address));
        stmtCl.finalize();

        console.log('Seeding Inventory...');
        const inventory = [
            { id: 'INV-001', name: 'Laptop Gamer X', sku: 'LPT-001', description: 'Laptop de alto rendimiento', quantity: 50, warehouseId: 'WH-001' },
            { id: 'INV-002', name: 'Monitor 4K 27"', sku: 'MON-002', description: 'Monitor IPS UHD', quantity: 30, warehouseId: 'WH-001' },
            { id: 'INV-003', name: 'Teclado Mecánico RGB', sku: 'KEY-003', description: 'Switch Cherry MX Blue', quantity: 100, warehouseId: 'WH-002' },
            { id: 'INV-004', name: 'Mouse Inalámbrico', sku: 'MOU-004', description: 'Ergonómico 2.4Ghz', quantity: 200, warehouseId: 'WH-002' },
            { id: 'INV-005', name: 'Silla Ergonómica', sku: 'CHR-005', description: 'Soporte lumbar ajustable', quantity: 15, warehouseId: 'WH-003' },
            { id: 'INV-006', name: 'Escritorio Elevable', sku: 'DSK-006', description: 'Motor eléctrico dual', quantity: 10, warehouseId: 'WH-003' }
        ];

        const stmtInv = db.prepare("INSERT OR IGNORE INTO inventory (id, name, sku, description, quantity, warehouseId) VALUES (?, ?, ?, ?, ?, ?)");
        inventory.forEach(i => stmtInv.run(i.id, i.name, i.sku, i.description, i.quantity, i.warehouseId));
        stmtInv.finalize();

        console.log('Seeding completed successfully.');
        // Close connection explicitly to ensure process exits
        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Database connection closed.');
        });
    });
}
