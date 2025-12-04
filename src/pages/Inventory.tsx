import React from 'react';
import { useWarehouseStore, type InventoryItem } from '../store/warehouseStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { QRGenerator } from '../components/QRGenerator';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';

export const Inventory = () => {
    const { inventory, warehouses, addInventoryItem, addMovement } = useWarehouseStore();
    const [showAddForm, setShowAddForm] = React.useState(false);
    const [showMovementForm, setShowMovementForm] = React.useState<'IN' | 'OUT' | null>(null);
    const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null);

    // Form states
    const [newItem, setNewItem] = React.useState<Partial<InventoryItem>>({
        name: '', sku: '', description: '', quantity: 0, warehouseId: ''
    });
    const [movementQty, setMovementQty] = React.useState(0);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        const id = Math.random().toString(36).substr(2, 9);
        addInventoryItem({
            id,
            name: newItem.name || '',
            sku: newItem.sku || '',
            description: newItem.description || '',
            quantity: Number(newItem.quantity) || 0,
            warehouseId: newItem.warehouseId || warehouses[0]?.id || '',
        } as InventoryItem);
        setShowAddForm(false);
        setNewItem({ name: '', sku: '', description: '', quantity: 0, warehouseId: '' });
    };

    const handleMovement = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !showMovementForm) return;

        addMovement({
            id: Math.random().toString(36).substr(2, 9),
            type: showMovementForm,
            itemId: selectedItem.id,
            quantity: Number(movementQty),
            date: new Date().toISOString(),
            userId: 'current-user-id', // Should come from auth store
            qrCode: `MOV-${showMovementForm}-${selectedItem.sku}-${Date.now()}`
        });

        setShowMovementForm(null);
        setSelectedItem(null);
        setMovementQty(0);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Inventario</h1>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Producto
                </Button>
            </div>

            {/* Add Item Form */}
            {showAddForm && (
                <Card>
                    <CardHeader><CardTitle>Agregar Producto</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddItem} className="grid gap-4 md:grid-cols-2">
                            <Input
                                placeholder="SKU"
                                value={newItem.sku}
                                onChange={e => setNewItem({ ...newItem, sku: e.target.value })}
                                required
                            />
                            <Input
                                placeholder="Nombre"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                required
                            />
                            <Input
                                placeholder="Descripción"
                                value={newItem.description}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />
                            <Input
                                type="number"
                                min="0"
                                placeholder="Cantidad Inicial"
                                value={newItem.quantity}
                                onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                required
                            />
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={newItem.warehouseId}
                                onChange={e => setNewItem({ ...newItem, warehouseId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar Bodega</option>
                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <Button type="submit">Guardar</Button>
                                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Movement Form Modal/Card */}
            {showMovementForm && selectedItem && (
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle>
                            Registrar {showMovementForm === 'IN' ? 'Entrada' : 'Salida'} - {selectedItem.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleMovement} className="flex flex-col md:flex-row gap-4 md:items-end">
                            <div className="flex-1 w-full">
                                <label className="text-sm font-medium">Cantidad</label>
                                <Input
                                    type="number"
                                    value={movementQty}
                                    onChange={e => setMovementQty(Number(e.target.value))}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button type="submit" className="flex-1 md:flex-none">Confirmar</Button>
                                <Button type="button" variant="outline" className="flex-1 md:flex-none" onClick={() => { setShowMovementForm(null); setSelectedItem(null); }}>Cancelar</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Inventory List */}
            <Card>
                <CardHeader><CardTitle>Existencias</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Bodega</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>QR</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventory.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono">{item.sku}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            {warehouses.find(w => w.id === item.warehouseId)?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-bold">{item.quantity}</TableCell>
                                        <TableCell>
                                            <div className="w-16">
                                                <QRGenerator value={item.sku} size={64} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                                    onClick={() => { setSelectedItem(item); setShowMovementForm('IN'); }}
                                                >
                                                    <ArrowDown className="h-4 w-4 mr-1" /> Entrada
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                                    onClick={() => { setSelectedItem(item); setShowMovementForm('OUT'); }}
                                                >
                                                    <ArrowUp className="h-4 w-4 mr-1" /> Salida
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {inventory.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No hay productos en inventario
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
