import { useState } from 'react';
import { useWarehouseStore, type Client } from '../store/warehouseStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Pencil, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const Clients = () => {
    const { clients, addClient, updateClient, deleteClient } = useWarehouseStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Client>>({
        name: '',
        email: '',
        phone: '',
        description: '',
        address: '',
        photoUrl: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && editingId) {
            updateClient(editingId, formData);
        } else {
            addClient({
                id: Math.random().toString(36).substr(2, 9),
                name: formData.name || '',
                email: formData.email || '',
                phone: formData.phone || '',
                description: formData.description || '',
                address: formData.address || '',
                photoUrl: formData.photoUrl || ''
            });
        }

        resetForm();
    };

    const handleEdit = (client: Client) => {
        setFormData(client);
        setEditingId(client.id);
        setIsEditing(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            deleteClient(id);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            description: '',
            address: '',
            photoUrl: ''
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Lista de Clientes', 14, 15);

        const tableData = clients.map(c => [
            c.name,
            c.email,
            c.phone,
            c.address || '-',
            c.description || '-'
        ]);

        autoTable(doc, {
            head: [['Nombre', 'Email', 'Teléfono', 'Dirección', 'Descripción']],
            body: tableData,
            startY: 20,
        });

        doc.save('clientes.pdf');
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(clients.map(c => ({
            Nombre: c.name,
            Email: c.email,
            Teléfono: c.phone,
            Dirección: c.address,
            Descripción: c.description
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");
        XLSX.writeFile(wb, "clientes.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToPDF} title="Exportar a PDF">
                        <FileText className="h-4 w-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" onClick={exportToExcel} title="Exportar a Excel">
                        <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                    </Button>
                    <Button onClick={() => { resetForm(); setIsEditing(!isEditing); }}>
                        {isEditing ? 'Cancelar' : 'Nuevo Cliente'}
                    </Button>
                </div>
            </div>

            {isEditing && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre</label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Teléfono</label>
                                    <Input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Dirección</label>
                                    <Input
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Descripción</label>
                                    <Input
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Foto de Perfil</label>
                                    <div className="flex flex-col gap-4">
                                        {formData.photoUrl && (
                                            <div className="flex justify-center">
                                                <img
                                                    src={formData.photoUrl}
                                                    alt="Preview"
                                                    className="h-24 w-24 rounded-full object-cover border-2 border-primary"
                                                />
                                            </div>
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setFormData({ ...formData, photoUrl: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="cursor-pointer"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Formatos: JPG, PNG. Máx 5MB recomendado.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full">
                                {editingId ? 'Guardar Cambios' : 'Crear Cliente'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                {client.photoUrl && (
                                                    <img
                                                        src={client.photoUrl}
                                                        alt={client.name}
                                                        className="h-10 w-10 rounded-full object-cover border"
                                                    />
                                                )}
                                                <div>
                                                    <p>{client.name}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p>{client.email}</p>
                                                <p className="text-muted-foreground">{client.phone}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{client.address || '-'}</TableCell>
                                        <TableCell className="max-w-xs truncate" title={client.description}>
                                            {client.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {clients.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No hay clientes registrados
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
