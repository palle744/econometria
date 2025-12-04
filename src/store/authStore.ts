import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'supervisor' | 'driver';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    position?: string;
    photoUrl?: string;
    password?: string; // In a real app, this should be hashed
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    users: User[]; // List of all users
    login: (user: User) => void;
    logout: () => void;
    addUser: (user: User) => void;
    updateUser: (id: string, user: Partial<User>) => void;
    deleteUser: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            users: [
                { id: 'admin_1', name: 'Admin User', email: 'admin@example.com', role: 'admin', position: 'Administrador', password: 'admin123' },
                { id: '2', name: 'Supervisor User', email: 'supervisor@example.com', role: 'supervisor', position: 'Supervisor de Bodega', password: 'user' },
                { id: '3', name: 'Driver User', email: 'driver@example.com', role: 'driver', position: 'Conductor', password: 'user' },
            ], // Initial mock users
            login: (user) => set({ user, isAuthenticated: true }),
            logout: () => set({ user: null, isAuthenticated: false }),

            addUser: (user) => set((state) => ({ users: [...state.users, user] })),
            updateUser: (id, updated) => set((state) => ({
                users: state.users.map((u) => u.id === id ? { ...u, ...updated } : u),
                // Also update current user if it's the one being modified
                user: state.user?.id === id ? { ...state.user, ...updated } : state.user
            })),
            deleteUser: (id) => set((state) => ({
                users: state.users.filter((u) => u.id !== id)
            })),
        }),
        {
            name: 'auth-storage-v2', // Changed key to invalidate old persisted state (with wrong user IDs)
        }
    )
);
