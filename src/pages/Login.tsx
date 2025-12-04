import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Warehouse } from 'lucide-react';

export const Login = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [role, setRole] = React.useState<UserRole>('admin');
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Por favor complete todos los campos');
            return;
        }

        // Mock login logic - Find matching user in store or create mock
        const storeUsers = useAuthStore.getState().users;
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = storeUsers.find(u => u.email.toLowerCase() === normalizedEmail);

        if (existingUser) {
            login({
                ...existingUser,
                role: role
            });
        } else if (normalizedEmail === 'admin@example.com' || normalizedEmail === 'admin@bodega.com') {
            // Hardcoded fallback for admin if store is empty or missing it
            // Maps both emails to the same admin_1 ID which exists in the DB
            login({
                id: 'admin_1',
                name: 'Admin User',
                email: normalizedEmail, // Keep the email the user typed
                role: 'admin',
                position: 'Administrador',
                password: 'admin123'
            });
        } else {
            // Fallback for unknown users (demo mode)
            login({
                id: Math.random().toString(36).substr(2, 9),
                name: email.split('@')[0],
                email,
                role,
            });
        }

        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Warehouse className="h-6 w-6" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Bienvenido</CardTitle>
                    <CardDescription className="text-center">
                        Ingrese sus credenciales para acceder a la plataforma
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                Correo Electrónico
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@bodega.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                Contraseña
                            </label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="role">
                                Rol (Simulado)
                            </label>
                            <select
                                id="role"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                            >
                                <option value="admin">Administrador</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="driver">Chofer</option>
                            </select>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                            Ingresar
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
