import React from 'react';
import { useWarehouseStore, type Warehouse } from '../store/warehouseStore';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

import { Trash2, Edit, FileText, X } from 'lucide-react';
import { format } from 'date-fns';

export const Warehouses = () => {
    const { warehouses, inventory, addWarehouse, deleteWarehouse, updateWarehouse, movements } = useWarehouseStore();
    const { user } = useAuthStore();
    const [showForm, setShowForm] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState<Partial<Warehouse>>({
        name: '',
        location: '',
        capacity: 0,
    });

    // Delete Security State
    const [showDeleteModal, setShowDeleteModal] = React.useState(false);
    const [warehouseToDelete, setWarehouseToDelete] = React.useState<string | null>(null);
    const [deletePassword, setDeletePassword] = React.useState('');

    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    // Report State
    const [reportWarehouse, setReportWarehouse] = React.useState<Warehouse | null>(null);
    const [showReportModal, setShowReportModal] = React.useState(false);
    const [reportTab, setReportTab] = React.useState<'inventory' | 'history'>('inventory');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            updateWarehouse(isEditing, formData);
            setIsEditing(null);
            setShowForm(false);
        } else {
            addWarehouse({
                id: Math.random().toString(36).substr(2, 9),
                name: formData.name || '',
                location: formData.location || '',
                capacity: Number(formData.capacity) || 0,
            } as Warehouse);
            setShowForm(false);
        }
        setFormData({ name: '', location: '', capacity: 0 });
    };

    const handleEdit = (warehouse: Warehouse) => {
        setIsEditing(warehouse.id);
        setFormData(warehouse);
        setShowForm(true);
    };

    const handleDeleteClick = (id: string) => {
        // Validation: Check if warehouse is empty
        const warehouseItems = inventory.filter(i => i.warehouseId === id);
        const occupancy = warehouseItems.reduce((acc, item) => acc + item.quantity, 0);

        if (occupancy > 0) {
            alert("No se puede eliminar la bodega porque aún tiene productos. Debe vaciarla primero.");
            return;
        }

        setWarehouseToDelete(id);
        setDeletePassword('');
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!user || !warehouseToDelete) return;

        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, password: deletePassword })
            });
            const data = await response.json();

            if (response.ok && data.valid) {
                deleteWarehouse(warehouseToDelete);
                setShowDeleteModal(false);
                setWarehouseToDelete(null);
            } else {
                // Show specific error from server if available, otherwise generic password error
                setDeleteError(data.error || 'Contraseña incorrecta');
            }
        } catch (error) {
            console.error('Error verifying password:', error);
            setDeleteError('Error de conexión');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestión de Bodegas</h1>
                <Button onClick={() => {
                    if (showForm) {
                        setIsEditing(null);
                        setFormData({ name: '', location: '', capacity: 0 });
                    }
                    setShowForm(!showForm);
                }}>
                    {showForm ? 'Cancelar' : 'Agregar Nueva Bodega'}
                </Button>
            </div>

            <div className={`grid gap-6 ${showForm ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                {showForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{isEditing ? 'Editar Bodega' : 'Nueva Bodega'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nombre</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej. Bodega Central"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ubicación</label>
                                    <Input
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Ej. Ciudad de México"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Capacidad</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                        placeholder="Ej. 1000"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit">
                                        {isEditing ? 'Actualizar' : 'Agregar'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(null);
                                            setFormData({ name: '', location: '', capacity: 0 });
                                            setShowForm(false);
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className={`space-y-6 ${!showForm ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0' : ''}`}>
                    {warehouses.map((warehouse) => {
                        const warehouseItems = inventory.filter(i => i.warehouseId === warehouse.id);
                        const occupancy = warehouseItems.reduce((acc, item) => acc + item.quantity, 0);
                        const percentage = Math.min((occupancy / warehouse.capacity) * 100, 100);
                        const isFull = occupancy >= warehouse.capacity;

                        return (
                            <Card key={warehouse.id} className="flex flex-col">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{warehouse.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{warehouse.location}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(warehouse)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => {
                                                setReportWarehouse(warehouse);
                                                setShowReportModal(true);
                                            }}>
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteClick(warehouse.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1">
                                    {/* Occupancy Bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Ocupación</span>
                                            <span className={isFull ? "text-red-500" : "text-muted-foreground"}>
                                                {occupancy} / {warehouse.capacity} ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${isFull ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Product List */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-muted-foreground">Productos en Bodega</h4>
                                        {warehouseItems.length > 0 ? (
                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                                {warehouseItems.map(item => {
                                                    const itemPercentage = (item.quantity / warehouse.capacity) * 100;
                                                    return (
                                                        <div key={item.id} className="text-sm border-b pb-2 last:border-0">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-medium truncate max-w-[120px]" title={item.name}>{item.name}</span>
                                                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                                                    {item.quantity} un.
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-primary/60"
                                                                        style={{ width: `${itemPercentage}%` }}
                                                                    />
                                                                </div>
                                                                <span className="w-10 text-right">{itemPercentage.toFixed(1)}%</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic text-center py-4">
                                                Bodega vacía
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm">
                        <CardHeader>
                            <CardTitle className="text-destructive">Confirmar Eliminación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Esta acción es irreversible. Para confirmar que tienes permisos, por favor ingresa tu contraseña de administrador.
                            </p>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contraseña</label>
                                <Input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder="Tu contraseña actual"
                                />
                                {deleteError && (
                                    <p className="text-xs text-red-500 font-medium">{deleteError}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                                    Cancelar
                                </Button>
                                <Button variant="destructive" onClick={confirmDelete}>
                                    Eliminar Bodega
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && reportWarehouse && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                            <div>
                                <CardTitle className="text-2xl">Reporte de Bodega: {reportWarehouse.name}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {reportWarehouse.location} | Capacidad: {reportWarehouse.capacity}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowReportModal(false)}>
                                <X className="h-6 w-6" />
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                            <div className="flex border-b">
                                <button
                                    className={`flex-1 py-3 text-sm font-medium ${reportTab === 'inventory' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
                                    onClick={() => setReportTab('inventory')}
                                >
                                    Inventario Actual
                                </button>
                                <button
                                    className={`flex-1 py-3 text-sm font-medium ${reportTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
                                    onClick={() => setReportTab('history')}
                                >
                                    Historial de Movimientos
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-4">
                                {reportTab === 'inventory' ? (
                                    <div className="space-y-4">
                                        {inventory.filter(i => i.warehouseId === reportWarehouse.id).length > 0 ? (
                                            <div className="border rounded-md">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left font-medium">Producto</th>
                                                            <th className="px-4 py-2 text-left font-medium">SKU</th>
                                                            <th className="px-4 py-2 text-right font-medium">Cantidad</th>
                                                            <th className="px-4 py-2 text-right font-medium">Ocupación</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {inventory
                                                            .filter(i => i.warehouseId === reportWarehouse.id)
                                                            .map(item => (
                                                                <tr key={item.id} className="border-t">
                                                                    <td className="px-4 py-2">{item.name}</td>
                                                                    <td className="px-4 py-2 text-muted-foreground">{item.sku}</td>
                                                                    <td className="px-4 py-2 text-right font-medium">{item.quantity}</td>
                                                                    <td className="px-4 py-2 text-right text-muted-foreground">
                                                                        {((item.quantity / reportWarehouse.capacity) * 100).toFixed(1)}%
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8">No hay productos en esta bodega.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {movements.filter(m =>
                                            inventory.find(i => i.id === m.itemId && i.warehouseId === reportWarehouse.id)
                                        ).length > 0 ? (
                                            <div className="border rounded-md">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left font-medium">Fecha</th>
                                                            <th className="px-4 py-2 text-left font-medium">Tipo</th>
                                                            <th className="px-4 py-2 text-left font-medium">Producto</th>
                                                            <th className="px-4 py-2 text-right font-medium">Cantidad</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {movements
                                                            .filter(m =>
                                                                inventory.find(i => i.id === m.itemId && i.warehouseId === reportWarehouse.id)
                                                            )
                                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                            .map(movement => {
                                                                const item = inventory.find(i => i.id === movement.itemId);
                                                                return (
                                                                    <tr key={movement.id} className="border-t">
                                                                        <td className="px-4 py-2">{format(new Date(movement.date), 'dd/MM/yyyy HH:mm')}</td>
                                                                        <td className="px-4 py-2">
                                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${movement.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                                }`}>
                                                                                {movement.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2">{item?.name || 'Producto Eliminado'}</td>
                                                                        <td className="px-4 py-2 text-right font-medium">{movement.quantity}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-center text-muted-foreground py-8">No hay movimientos registrados para los productos actuales.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
