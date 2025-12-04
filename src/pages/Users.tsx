import { useState } from 'react';
import { useAuthStore, type User, type UserRole } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Pencil, Trash2, User as UserIcon } from 'lucide-react';

export const Users = () => {
    const { users, addUser, updateUser, deleteUser, user: currentUser } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: 'driver',
        position: '',
        password: '',
        photoUrl: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && editingId) {
            updateUser(editingId, formData);
        } else {
            addUser({
                id: Math.random().toString(36).substr(2, 9),
                name: formData.name || '',
                email: formData.email || '',
                role: formData.role as UserRole,
                position: formData.position || '',
                password: formData.password || '',
                photoUrl: formData.photoUrl || ''
            });
        }

        resetForm();
    };

    const handleEdit = (user: User) => {
        setFormData(user);
        setEditingId(user.id);
        setIsEditing(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            deleteUser(id);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            role: 'driver',
            position: '',
            password: '',
            photoUrl: ''
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
                <Button onClick={() => { resetForm(); setIsEditing(!isEditing); }}>
                    {isEditing ? 'Cancelar' : 'Nuevo Usuario'}
                </Button>
            </div>

            {isEditing && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre Completo</label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Correo Electrónico</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Puesto / Cargo</label>
                                    <Input
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                        placeholder="Ej. Supervisor de Turno"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Rol del Sistema</label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="driver">Conductor / Operario</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Contraseña</label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={editingId ? "Dejar en blanco para mantener actual" : "Contraseña"}
                                        required={!editingId}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Foto de Perfil</label>
                                    <div className="flex items-center gap-4">
                                        {formData.photoUrl && (
                                            <img
                                                src={formData.photoUrl}
                                                alt="Preview"
                                                className="h-12 w-12 rounded-full object-cover border"
                                            />
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full">
                                {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Puesto</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="flex items-center gap-3">
                                            {user.photoUrl ? (
                                                <img src={user.photoUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                    <UserIcon className="h-4 w-4" />
                                                </div>
                                            )}
                                            <span className="font-medium">{user.name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs 
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {user.role.toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell>{user.position || '-'}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {user.id !== currentUser?.id && (
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
