import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, Warehouse, Users, Package, LogOut, Menu, X, Scan, FileText, User as UserIcon, Briefcase } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';

import { useWarehouseStore } from '../store/warehouseStore';

export const Layout = () => {
    const { user, logout } = useAuthStore();
    const { fetchInitialData } = useWarehouseStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        fetchInitialData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'supervisor'] },
        { label: 'Bodegas', path: '/warehouses', icon: Warehouse, roles: ['admin'] },
        { label: 'Inventario', path: '/inventory', icon: Package, roles: ['admin', 'supervisor'] },
        { label: 'Pedidos', path: '/orders', icon: FileText, roles: ['admin', 'supervisor'] },
        { label: 'Clientes', path: '/clients', icon: Users, roles: ['admin'] },
        { label: 'Usuarios', path: '/users', icon: UserIcon, roles: ['admin'] },
        { label: 'Colaboradores', path: '/collaborators', icon: Briefcase, roles: ['admin'] },
        { label: 'Escanear', path: '/scan', icon: Scan, roles: ['driver', 'admin', 'supervisor'] },
        { label: 'Reportes', path: '/reports', icon: FileText, roles: ['admin', 'supervisor'] },
    ];

    const filteredNavItems = navItems.filter(item =>
        user && item.roles.includes(user.role)
    );

    return (
        <div className="h-screen bg-background flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-200 ease-in-out lg:transform-none",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center px-6 border-b flex-none">
                    <h1 className="text-xl font-bold text-primary">BodegaApp</h1>
                    <button
                        className="ml-auto lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t bg-card flex-none">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 border-b bg-card flex items-center px-4 lg:px-8 justify-between lg:justify-end flex-none">
                    <button
                        className="lg:hidden p-2 -ml-2"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    {/* Header content like notifications could go here */}
                </header>

                <main className="flex-1 overflow-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
