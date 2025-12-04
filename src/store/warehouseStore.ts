import { create } from 'zustand';


export interface Warehouse {
    id: string;
    name: string;
    location: string;
    capacity: number;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    description?: string;
    address?: string;
    photoUrl?: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    description: string;
    quantity: number;
    warehouseId: string;
}

export interface Movement {
    id: string;
    type: 'IN' | 'OUT';
    itemId: string;
    quantity: number;
    date: string;
    userId: string;
    clientId?: string; // For OUT
    qrCode?: string;
}

export interface CollaboratorDocument {
    id: string;
    collaboratorId: string;
    name: string;
    type: string;
    url: string;
    uploadDate: string;
}

export interface Collaborator {
    id: string;
    name: string;
    birthDate: string;
    gender: string;
    phone: string;
    personalEmail: string;
    corporateEmail: string;
    assignedComputer: boolean;
    assignedPhone: boolean;
    position: string;
    salary: number;
    startDate: string;
    photoUrl?: string;
    documents?: CollaboratorDocument[];
    isActive: boolean;

    // Asset Details
    computerBrand?: string;
    computerModel?: string;
    computerSerial?: string;
    computerColor?: string;

    phoneBrand?: string;
    phoneModel?: string;
    phoneSerial?: string;
    phoneColor?: string;
}

interface WarehouseState {
    warehouses: Warehouse[];
    clients: Client[];
    inventory: InventoryItem[];
    movements: Movement[];
    collaborators: Collaborator[];

    addWarehouse: (warehouse: Warehouse) => void;
    updateWarehouse: (id: string, warehouse: Partial<Warehouse>) => void;
    deleteWarehouse: (id: string) => void;

    fetchCollaborators: () => Promise<void>;
    addCollaborator: (collaborator: Collaborator) => Promise<void>;
    updateCollaborator: (id: string, collaborator: Partial<Collaborator>) => Promise<void>;
    deleteCollaborator: (id: string) => Promise<void>;
    addCollaboratorDocument: (doc: CollaboratorDocument) => Promise<void>;
    deleteCollaboratorDocument: (id: string) => Promise<void>;

    addClient: (client: Client) => void;
    updateClient: (id: string, client: Partial<Client>) => void;
    deleteClient: (id: string) => void;

    addInventoryItem: (item: InventoryItem) => void;
    updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
    deleteInventoryItem: (id: string) => void;

    addMovement: (movement: Movement) => void;



    // Orders
    orders: Order[];
    addOrder: (order: Order) => void;
    updateOrder: (id: string, order: Partial<Order>) => void;

    // Users
    users: any[]; // Using any for now to avoid circular dependency or complex type if User is elsewhere
    fetchUsers: () => Promise<void>;
    deleteUser: (id: string) => Promise<void>;

    // Async Actions
    fetchWarehouses: () => Promise<void>;
    fetchClients: () => Promise<void>;
    fetchInventory: () => Promise<void>;
    fetchMovements: () => Promise<void>;
    fetchOrders: () => Promise<void>;

    fetchInitialData: () => Promise<void>;
}

export interface Order {
    id: string;
    uniqueId: string; // Human readable unique ID e.g., ORD-001
    type: 'IN' | 'OUT';
    items: { itemId: string; quantity: number }[];
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    qrCode: string;
    createdAt: string;
    completedAt?: string;
    warehouseId?: string; // Target/Source warehouse
    clientId?: string; // Associated client
    createdByUserId?: string;
    completedByUserId?: string;
    cancellationReason?: string;
}

export const useWarehouseStore = create<WarehouseState>((set, get) => ({
    warehouses: [],
    clients: [],
    inventory: [],
    movements: [],
    orders: [],
    users: [],
    collaborators: [],

    deleteUser: async (id: string) => {
        try {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    },

    // Collaborators Actions
    fetchCollaborators: async () => {
        try {
            const res = await fetch('/api/collaborators');
            const data = await res.json();
            // Convert 0/1 to boolean for frontend
            const formatted = data.map((c: any) => ({
                ...c,
                assignedComputer: !!c.assignedComputer,
                assignedPhone: !!c.assignedPhone
            }));
            set({ collaborators: formatted });
        } catch (error) {
            console.error('Error fetching collaborators:', error);
        }
    },
    addCollaborator: async (collaborator) => {
        try {
            await fetch('/api/collaborators', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(collaborator),
            });
            set((state) => ({ collaborators: [...state.collaborators, collaborator] }));
        } catch (error) {
            console.error('Error adding collaborator:', error);
        }
    },
    updateCollaborator: async (id, collaborator) => {
        try {
            await fetch(`/api/collaborators/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(collaborator),
            });
            set((state) => ({
                collaborators: state.collaborators.map((c) => (c.id === id ? { ...c, ...collaborator } : c)),
            }));
        } catch (error) {
            console.error('Error updating collaborator:', error);
        }
    },
    deleteCollaborator: async (id) => {
        try {
            await fetch(`/api/collaborators/${id}`, { method: 'DELETE' });
            set((state) => ({ collaborators: state.collaborators.filter((c) => c.id !== id) }));
        } catch (error) {
            console.error('Error deleting collaborator:', error);
        }
    },
    addCollaboratorDocument: async (doc) => {
        try {
            await fetch('/api/collaborator_documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doc),
            });
            // Ideally we should refetch the specific collaborator to update documents, 
            // but for now we might rely on local state in the component or refetch all.
            // Let's just update the store if we had documents in the collaborator object, 
            // but the main list might not have deep documents. 
            // The component will likely fetch details.
        } catch (error) {
            console.error('Error adding document:', error);
        }
    },
    deleteCollaboratorDocument: async (id) => {
        try {
            await fetch(`/api/collaborator_documents/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    },



    addWarehouse: async (warehouse) => {
        if (warehouse.capacity < 0) {
            alert('La capacidad no puede ser negativa.');
            return;
        }
        try {
            const res = await fetch('/api/warehouses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(warehouse)
            });
            const newWarehouse = await res.json();
            set((state) => ({ warehouses: [...state.warehouses, newWarehouse] }));
        } catch (error) {
            console.error('Error adding warehouse:', error);
        }
    },
    updateWarehouse: async (id, updated) => {
        if (updated.capacity !== undefined && updated.capacity < 0) {
            alert('La capacidad no puede ser negativa.');
            return;
        }
        try {
            await fetch(`/api/warehouses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            set((state) => ({
                warehouses: state.warehouses.map((w) =>
                    w.id === id ? { ...w, ...updated } : w
                ),
            }));
        } catch (error) {
            console.error('Error updating warehouse:', error);
        }
    },
    deleteWarehouse: async (id) => {
        try {
            await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
            set((state) => ({
                warehouses: state.warehouses.filter((w) => w.id !== id),
            }));
        } catch (error) {
            console.error('Error deleting warehouse:', error);
        }
    },

    addClient: async (client) => {
        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
            });
            const newClient = await res.json();
            set((state) => ({ clients: [...state.clients, newClient] }));
        } catch (error) {
            console.error('Error adding client:', error);
        }
    },
    updateClient: async (id, updated) => {
        try {
            await fetch(`/api/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            set((state) => ({
                clients: state.clients.map((c) =>
                    c.id === id ? { ...c, ...updated } : c
                ),
            }));
        } catch (error) {
            console.error('Error updating client:', error);
        }
    },
    deleteClient: async (id) => {
        try {
            await fetch(`/api/clients/${id}`, { method: 'DELETE' });
            set((state) => ({
                clients: state.clients.filter((c) => c.id !== id),
            }));
        } catch (error) {
            console.error('Error deleting client:', error);
        }
    },

    addInventoryItem: async (item) => {
        if (item.quantity < 0) {
            alert('La cantidad inicial no puede ser negativa.');
            return;
        }
        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            const newItem = await res.json();
            set((state) => ({ inventory: [...state.inventory, newItem] }));
        } catch (error) {
            console.error('Error adding inventory item:', error);
        }
    },
    updateInventoryItem: async (id, updated) => {
        if (updated.quantity !== undefined && updated.quantity < 0) {
            alert('La cantidad no puede ser negativa.');
            return;
        }
        try {
            await fetch(`/api/inventory/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            set((state) => ({
                inventory: state.inventory.map((i) =>
                    i.id === id ? { ...i, ...updated } : i
                ),
            }));
        } catch (error) {
            console.error('Error updating inventory item:', error);
        }
    },
    deleteInventoryItem: async (id) => {
        try {
            await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
            set((state) => ({
                inventory: state.inventory.filter((i) => i.id !== id),
            }));
        } catch (error) {
            console.error('Error deleting inventory item:', error);
        }
    },

    addMovement: async (movement) => {
        const state = get();
        const item = state.inventory.find((i) => i.id === movement.itemId);
        if (!item) return;

        if (movement.type === 'OUT') {
            if (item.quantity < movement.quantity) {
                alert(`Stock insuficiente. Disponible: ${item.quantity}, Intento de salida: ${movement.quantity}`);
                return;
            }
        }

        try {
            const res = await fetch('/api/movements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movement)
            });
            const newMovement = await res.json();

            // Optimistic update or refetch? Let's do optimistic for now based on response
            // Actually, backend handles transaction, so we should update local state to match
            const qtyChange = movement.type === 'IN' ? movement.quantity : -movement.quantity;

            set((state) => ({
                movements: [...state.movements, newMovement],
                inventory: state.inventory.map((i) =>
                    i.id === movement.itemId ? { ...i, quantity: i.quantity + qtyChange } : i
                ),
            }));
        } catch (error) {
            console.error('Error adding movement:', error);
        }
    },

    addOrder: async (order) => {
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });
            const newOrder = await res.json();
            set((state) => ({ orders: [...state.orders, newOrder] }));
            await get().fetchWarehouses();
            await get().fetchClients();
            await get().fetchInventory();
            await get().fetchMovements();
            await get().fetchOrders();
            await get().fetchUsers(); // Assuming fetchUsers exists in the store
            // Assuming fetchCollaborators exists in the store
            if (get().fetchCollaborators) {
                await get().fetchCollaborators();
            }
        } catch (error) {
            console.error('Error adding order:', error);
        }
    },
    updateOrder: async (id, updated) => {
        try {
            await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            set((state) => ({
                orders: state.orders.map((o) =>
                    o.id === id ? { ...o, ...updated } : o
                ),
            }));
        } catch (error) {
            console.error('Error updating order:', error);
        }
    },


    fetchWarehouses: async () => {
        const response = await fetch('/api/warehouses');
        const data = await response.json();
        set({ warehouses: data });
    },
    fetchClients: async () => {
        const response = await fetch('/api/clients');
        const data = await response.json();
        set({ clients: data });
    },
    fetchInventory: async () => {
        const response = await fetch('/api/inventory');
        const data = await response.json();
        set({ inventory: data });
    },
    fetchMovements: async () => {
        const response = await fetch('/api/movements');
        const data = await response.json();
        set({ movements: data });
    },
    fetchOrders: async () => {
        const response = await fetch('/api/orders');
        const data = await response.json();
        set({ orders: data });
    },
    fetchUsers: async () => {
        const response = await fetch('/api/users');
        const data = await response.json();
        set({ users: data });
    },

    fetchInitialData: async () => {
        try {
            await get().fetchWarehouses();
            await get().fetchClients();
            await get().fetchInventory();
            await get().fetchMovements();
            await get().fetchOrders();
            await get().fetchUsers();
            if (get().fetchCollaborators) {
                await get().fetchCollaborators();
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        }
    },
}));
