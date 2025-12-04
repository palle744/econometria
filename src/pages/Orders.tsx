import { useState, useEffect } from 'react';
import { useWarehouseStore } from '../store/warehouseStore';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Eye, Download, FileText, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { openEmailClient } from '../utils/emailUtils';
import { generateOrderPDF } from '../utils/pdfGenerator';

type EntityType = 'WAREHOUSE' | 'CLIENT';

interface OrderEntity {
    type: EntityType;
    id: string;
}

export const Orders = () => {
    const { orders, inventory, addOrder, warehouses, clients } = useWarehouseStore();
    const { user } = useAuthStore();
    const [isCreating, setIsCreating] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
    const [pdfActionOrder, setPdfActionOrder] = useState<string | null>(null);
    const [showPdfOptions, setShowPdfOptions] = useState(false);
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { updateOrder } = useWarehouseStore();

    const handleCancelClick = (orderId: string) => {
        setOrderToCancel(orderId);
        setCancellationReason('');
        setShowCancelModal(true);
    };

    const confirmCancellation = async () => {
        if (!orderToCancel || !cancellationReason.trim()) return;

        await updateOrder(orderToCancel, {
            status: 'CANCELLED',
            cancellationReason: cancellationReason
        });

        setShowCancelModal(false);
        setOrderToCancel(null);
    };
    const [usersList, setUsersList] = useState<any[]>([]);

    // Wizard State
    const [step, setStep] = useState(1);
    const [origin, setOrigin] = useState<OrderEntity | null>(null);
    const [destination, setDestination] = useState<OrderEntity | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => setUsersList(data))
            .catch(err => console.error('Error fetching users:', err));
    }, []);

    // Initialize Date Filter
    useEffect(() => {
        if (orders.length > 0 && !startDate && !endDate) {
            const dates = orders.map(o => new Date(o.createdAt).getTime());
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(); // Today

            setStartDate(minDate.toISOString().split('T')[0]);
            setEndDate(maxDate.toISOString().split('T')[0]);
        } else if (orders.length === 0 && !startDate && !endDate) {
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            setEndDate(today);
        }
    }, [orders, startDate, endDate]);

    const getUserName = (userId?: string) => {
        if (!userId) return '-';
        const u = usersList.find(u => u.id === userId);
        return u ? u.name : 'Desconocido';
    };

    const handleDownloadPDF = (orderId: string) => {
        setPdfActionOrder(orderId);
        setShowPdfOptions(true);
    };

    const executeDownloadPDF = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const orderItems = order.items.map(item => {
            const product = inventory.find(p => p.id === item.itemId);
            return {
                name: product?.name || 'Desconocido',
                sku: product?.sku || 'N/A',
                quantity: item.quantity
            };
        });

        const clientEntity = order.clientId ? clients.find(c => c.id === order.clientId) : null;
        const warehouseEntity = order.warehouseId ? warehouses.find(w => w.id === order.warehouseId) : null;

        generateOrderPDF({
            order,
            items: orderItems,
            clientName: clientEntity?.name || '-',
            warehouseName: warehouseEntity?.name || '-',
            createdByName: getUserName(order.createdByUserId),
            completedByName: getUserName(order.completedByUserId)
        });

        setShowPdfOptions(false);
        setShowPdfPreview(false);
        setPdfActionOrder(null);
    };

    // Form State
    const [selectedItems, setSelectedItems] = useState<{ itemId: string; quantity: number }[]>([]);
    const [currentItemId, setCurrentItemId] = useState('');
    const [currentItemQty, setCurrentItemQty] = useState(1);

    const handleAddItem = () => {
        if (!currentItemId) return;
        if (currentItemQty <= 0) {
            alert('La cantidad debe ser mayor a 0.');
            return;
        }

        const existing = selectedItems.find(i => i.itemId === currentItemId);
        const currentTotal = (existing?.quantity || 0) + currentItemQty;

        // Validation for OUT orders (Salida)
        // If Destination is Client, it's likely an OUT order.
        // Or if Origin is Warehouse, it's an OUT from that warehouse.
        // For simplicity, if we are taking FROM a warehouse (Origin=Warehouse), check stock.
        if (origin?.type === 'WAREHOUSE') {
            // Note: Inventory is currently global or per warehouse? 
            // The inventory array has warehouseId. We should filter by origin warehouse if possible.
            // But current inventory list might be mixed.
            // Let's assume we check against the specific item selected.

            const product = inventory.find(i => i.id === currentItemId);
            if (product && currentTotal > product.quantity) {
                alert(`Stock insuficiente. Disponible: ${product.quantity}. Intentas agregar: ${currentTotal}`);
                return;
            }
        }

        if (existing) {
            setSelectedItems(selectedItems.map(i =>
                i.itemId === currentItemId ? { ...i, quantity: i.quantity + currentItemQty } : i
            ));
        } else {
            setSelectedItems([...selectedItems, { itemId: currentItemId, quantity: currentItemQty }]);
        }
        setCurrentItemId('');
        setCurrentItemQty(1);
    };

    const handleRemoveItem = (itemId: string) => {
        setSelectedItems(selectedItems.filter(i => i.itemId !== itemId));
    };

    const resetWizard = () => {
        setIsCreating(false);
        setStep(1);
        setOrigin(null);
        setDestination(null);
        setSelectedItems([]);
        setShowConfirmation(false);
    };

    const handleCreateOrder = () => {
        if (selectedItems.length === 0 || !origin || !destination) return;

        const uniqueId = `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const orderId = Math.random().toString(36).substr(2, 9);

        // QR Content: ORDER|ID|UNIQUE_ID
        const qrContent = `ORDER|${orderId}|${uniqueId}`;

        // Determine Type
        // Dest = Warehouse -> IN
        // Dest = Client -> OUT
        const orderType = destination.type === 'WAREHOUSE' ? 'IN' : 'OUT';

        addOrder({
            id: orderId,
            uniqueId,
            type: orderType,
            items: selectedItems,
            status: 'PENDING',
            qrCode: qrContent,
            createdAt: new Date().toISOString(),
            warehouseId: destination.type === 'WAREHOUSE' ? destination.id : (origin.type === 'WAREHOUSE' ? origin.id : undefined),
            clientId: destination.type === 'CLIENT' ? destination.id : (origin.type === 'CLIENT' ? origin.id : undefined),
            createdByUserId: user?.id
        });

        // Send Email Notification if Client involved
        const clientEntity = destination.type === 'CLIENT' ? clients.find(c => c.id === destination.id) :
            (origin.type === 'CLIENT' ? clients.find(c => c.id === origin.id) : null);

        if (clientEntity && clientEntity.email) {
            const orderItems = selectedItems.map(item => {
                const product = inventory.find(p => p.id === item.itemId);
                return {
                    name: product?.name || 'Desconocido',
                    sku: product?.sku || 'N/A',
                    quantity: item.quantity
                };
            });

            openEmailClient({
                type: 'ORDER_CREATED',
                client: clientEntity,
                items: orderItems,
                orderId: uniqueId,
                date: new Date().toISOString(),
                movementType: orderType
            });
        }

        resetWizard();
    };

    const getProductName = (id: string) => inventory.find(i => i.id === id)?.name || 'Desconocido';
    const getEntityName = (entity: OrderEntity | null) => {
        if (!entity) return '-';
        if (entity.type === 'WAREHOUSE') return warehouses.find(w => w.id === entity.id)?.name || 'Bodega Desconocida';
        return clients.find(c => c.id === entity.id)?.name || 'Cliente Desconocido';
    };

    // Filter inventory based on Origin if it's a warehouse
    const availableInventory = origin?.type === 'WAREHOUSE'
        ? inventory.filter(i => i.warehouseId === origin.id)
        : inventory;

    // Filter Orders Logic
    const filteredOrders = orders.filter(order => {
        const matchesSearch = searchTerm === '' ||
            order.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.clientId && clients.find(c => c.id === order.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

        let matchesDate = true;
        if (startDate && endDate) {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            matchesDate = orderDate >= startDate && orderDate <= endDate;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
                <Button onClick={() => { resetWizard(); setIsCreating(!isCreating); }}>
                    {isCreating ? 'Cancelar' : 'Nuevo Pedido'}
                </Button>
            </div>

            {isCreating && (
                <Card>
                    <CardHeader>
                        <CardTitle>Crear Nuevo Pedido - Paso {step} de 3</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Progress Bar */}
                        <div className="flex gap-2 mb-4">
                            <div className={`h-2 flex-1 rounded ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                            <div className={`h-2 flex-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                            <div className={`h-2 flex-1 rounded ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                        </div>

                        {/* STEP 1: ORIGIN */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">1. Seleccionar Origen</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        className={`p-4 border rounded cursor-pointer hover:bg-muted/50 ${origin?.type === 'WAREHOUSE' ? 'border-primary bg-primary/10' : ''}`}
                                        onClick={() => setOrigin({ type: 'WAREHOUSE', id: '' })}
                                    >
                                        <h4 className="font-bold">Bodega</h4>
                                        <p className="text-sm text-muted-foreground">Salida de inventario</p>
                                    </div>
                                    <div
                                        className={`p-4 border rounded cursor-pointer hover:bg-muted/50 ${origin?.type === 'CLIENT' ? 'border-primary bg-primary/10' : ''}`}
                                        onClick={() => setOrigin({ type: 'CLIENT', id: '' })}
                                    >
                                        <h4 className="font-bold">Cliente</h4>
                                        <p className="text-sm text-muted-foreground">Devolución o Compra</p>
                                    </div>
                                </div>

                                {origin?.type === 'WAREHOUSE' && (
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={origin.id}
                                        onChange={(e) => setOrigin({ ...origin, id: e.target.value })}
                                    >
                                        <option value="">Seleccionar Bodega...</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                )}

                                {origin?.type === 'CLIENT' && (
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={origin.id}
                                        onChange={(e) => setOrigin({ ...origin, id: e.target.value })}
                                    >
                                        <option value="">Seleccionar Cliente...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                )}

                                <div className="flex justify-end">
                                    <Button onClick={() => setStep(2)} disabled={!origin?.id}>
                                        Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: DESTINATION */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">2. Seleccionar Destino</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        className={`p-4 border rounded cursor-pointer hover:bg-muted/50 ${destination?.type === 'WAREHOUSE' ? 'border-primary bg-primary/10' : ''}`}
                                        onClick={() => setDestination({ type: 'WAREHOUSE', id: '' })}
                                    >
                                        <h4 className="font-bold">Bodega</h4>
                                        <p className="text-sm text-muted-foreground">Entrada o Transferencia</p>
                                    </div>
                                    <div
                                        className={`p-4 border rounded cursor-pointer hover:bg-muted/50 ${destination?.type === 'CLIENT' ? 'border-primary bg-primary/10' : ''}`}
                                        onClick={() => setDestination({ type: 'CLIENT', id: '' })}
                                    >
                                        <h4 className="font-bold">Cliente</h4>
                                        <p className="text-sm text-muted-foreground">Venta o Entrega</p>
                                    </div>
                                </div>

                                {destination?.type === 'WAREHOUSE' && (
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={destination.id}
                                        onChange={(e) => setDestination({ ...destination, id: e.target.value })}
                                    >
                                        <option value="">Seleccionar Bodega...</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                )}

                                {destination?.type === 'CLIENT' && (
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={destination.id}
                                        onChange={(e) => setDestination({ ...destination, id: e.target.value })}
                                    >
                                        <option value="">Seleccionar Cliente...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                )}

                                <div className="flex justify-between">
                                    <Button variant="outline" onClick={() => setStep(1)}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                                    </Button>
                                    <Button onClick={() => setStep(3)} disabled={!destination?.id}>
                                        Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: PRODUCTS */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">3. Agregar Productos</h3>
                                <div className="bg-muted/20 p-4 rounded mb-4 text-sm">
                                    <p><strong>Origen:</strong> {getEntityName(origin)}</p>
                                    <p><strong>Destino:</strong> {getEntityName(destination)}</p>
                                </div>

                                <div className="flex flex-col md:flex-row gap-2 md:items-end">
                                    <div className="flex-1 space-y-2 w-full">
                                        <label className="text-sm font-medium">Producto</label>
                                        <select
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={currentItemId}
                                            onChange={(e) => setCurrentItemId(e.target.value)}
                                        >
                                            <option value="">Seleccionar Producto...</option>
                                            {availableInventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku}) - Stock: {i.quantity}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-24 space-y-2">
                                        <label className="text-sm font-medium">Cant.</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={currentItemQty}
                                            onChange={(e) => setCurrentItemQty(Number(e.target.value))}
                                        />
                                    </div>
                                    <Button onClick={handleAddItem} className="w-full md:w-auto"><Plus className="h-4 w-4" /></Button>
                                </div>

                                {selectedItems.length > 0 && (
                                    <div className="border rounded-md p-4">
                                        <h4 className="text-sm font-medium mb-2">Items Seleccionados:</h4>
                                        <ul className="space-y-2">
                                            {selectedItems.map((item, idx) => (
                                                <li key={idx} className="flex justify-between items-center text-sm bg-muted p-2 rounded">
                                                    <span>{getProductName(item.itemId)} (x{item.quantity})</span>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.itemId)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <Button variant="outline" onClick={() => setStep(2)}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                                    </Button>
                                    <Button onClick={() => setShowConfirmation(true)} disabled={selectedItems.length === 0}>
                                        Revisar Pedido <CheckCircle className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Confirmar Pedido</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                                <p><strong>Origen:</strong> {getEntityName(origin)}</p>
                                <p><strong>Destino:</strong> {getEntityName(destination)}</p>
                                <p><strong>Tipo:</strong> {destination?.type === 'WAREHOUSE' ? 'ENTRADA (IN)' : 'SALIDA (OUT)'}</p>
                            </div>
                            <div className="border-t pt-2">
                                <h4 className="font-bold mb-2">Resumen de Items:</h4>
                                <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
                                    {selectedItems.map((item, idx) => (
                                        <li key={idx} className="flex justify-between">
                                            <span>{getProductName(item.itemId)}</span>
                                            <span>x{item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button className="flex-1" onClick={handleCreateOrder}>Confirmar y Crear</Button>
                                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmation(false)}>Cancelar</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}


            {/* ... existing code ... */}

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Pedidos</CardTitle>
                    <div className="flex flex-col md:flex-row gap-4 mt-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Buscar por ID de Pedido o Cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">Todos los estados</option>
                                <option value="PENDING">Pendientes</option>
                                <option value="COMPLETED">Completados</option>
                                <option value="CANCELLED">Cancelados</option>
                            </select>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground">Desde</span>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full md:w-36"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground">Hasta</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full md:w-36"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Creado Por</TableHead>
                                    <TableHead>Entregado Por</TableHead>
                                    <TableHead>Creación</TableHead>
                                    <TableHead>Entrega</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.uniqueId}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${order.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {order.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {order.status === 'COMPLETED' ? 'COMPLETADO' :
                                                    order.status === 'CANCELLED' ? 'CANCELADO' : 'PENDIENTE'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{order.items.length} productos</TableCell>
                                        <TableCell className="text-sm">{order.clientId ? clients.find(c => c.id === order.clientId)?.name || '-' : '-'}</TableCell>
                                        <TableCell className="text-sm">{getUserName(order.createdByUserId)}</TableCell>
                                        <TableCell className="text-sm">{getUserName(order.completedByUserId)}</TableCell>
                                        <TableCell className="text-sm">{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                        <TableCell className="text-sm">
                                            {order.completedAt
                                                ? `${new Date(order.completedAt).toLocaleDateString()} ${new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" title="Ver QR" onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Descargar PDF" onClick={() => handleDownloadPDF(order.id)}>
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                                {order.status === 'PENDING' && (
                                                    <Button variant="ghost" size="icon" title="Cancelar Pedido" onClick={() => handleCancelClick(order.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredOrders.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center text-muted-foreground">No hay pedidos encontrados</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-red-600">Cancelar Pedido</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Por favor, ingrese el motivo de la cancelación. Esta acción no se puede deshacer.
                            </p>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Motivo de cancelación..."
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                            />
                            <div className="flex gap-2 pt-2">
                                <Button variant="destructive" className="flex-1" onClick={confirmCancellation} disabled={!cancellationReason.trim()}>
                                    Confirmar Cancelación
                                </Button>
                                <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>
                                    Cerrar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* PDF Options Modal */}
            {showPdfOptions && pdfActionOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-sm">
                        <CardHeader>
                            <CardTitle>Opciones de Reporte</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                ¿Qué deseas hacer con el reporte del pedido?
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button onClick={() => executeDownloadPDF(pdfActionOrder)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar PDF
                                </Button>
                                <Button variant="secondary" onClick={() => { setShowPdfOptions(false); setShowPdfPreview(true); }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Previsualizar
                                </Button>
                                <Button variant="outline" onClick={() => { setShowPdfOptions(false); setPdfActionOrder(null); }}>
                                    Cancelar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* PDF Preview Modal */}
            {showPdfPreview && pdfActionOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Vista Previa del Pedido</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => { setShowPdfPreview(false); setPdfActionOrder(null); }}>
                                <Trash2 className="h-4 w-4 rotate-45" /> {/* Using Trash2 rotated as close icon or just X if available, using simple close logic */}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {(() => {
                                const order = orders.find(o => o.id === pdfActionOrder);
                                if (!order) return null;
                                const client = order.clientId ? clients.find(c => c.id === order.clientId) : null;
                                const warehouse = order.warehouseId ? warehouses.find(w => w.id === order.warehouseId) : null;

                                return (
                                    <>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-bold">ID Pedido:</p>
                                                <p>{order.uniqueId}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold">Estado:</p>
                                                <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.status === 'COMPLETED' ? 'COMPLETADO' :
                                                        order.status === 'CANCELLED' ? 'CANCELADO' : 'PENDIENTE'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-bold">Tipo:</p>
                                                <p>{order.type === 'IN' ? 'ENTRADA' : 'SALIDA'}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold">Fecha:</p>
                                                <p>{new Date(order.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold">Bodega:</p>
                                                <p>{warehouse?.name || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold">Cliente:</p>
                                                <p>{client?.name || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold">Creado por:</p>
                                                <p>{getUserName(order.createdByUserId)}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold">Entregado por:</p>
                                                <p>{getUserName(order.completedByUserId)}</p>
                                            </div>
                                        </div>

                                        {order.status === 'CANCELLED' && (
                                            <div className="bg-red-50 border border-red-200 rounded p-4">
                                                <p className="text-red-800 font-bold">PEDIDO CANCELADO</p>
                                                <p className="text-red-600 text-sm">Motivo: {order.cancellationReason || 'No especificado'}</p>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="font-bold mb-2">Productos</h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Producto</TableHead>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>Cantidad</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {order.items.map((item, idx) => {
                                                        const product = inventory.find(p => p.id === item.itemId);
                                                        return (
                                                            <TableRow key={idx}>
                                                                <TableCell>{product?.name || 'Desconocido'}</TableCell>
                                                                <TableCell>{product?.sku || '-'}</TableCell>
                                                                <TableCell>{item.quantity}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button onClick={() => executeDownloadPDF(pdfActionOrder)}>
                                                <Download className="h-4 w-4 mr-2" />
                                                Descargar PDF
                                            </Button>
                                            <Button variant="outline" onClick={() => { setShowPdfPreview(false); setPdfActionOrder(null); }}>
                                                Cerrar
                                            </Button>
                                        </div>
                                    </>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </div>
            )}

            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-background p-6 rounded-lg max-w-sm w-full text-center space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold">Código QR del Pedido</h3>
                        <div className="flex justify-center p-4 bg-white rounded" id="qr-container">
                            <QRCodeSVG
                                id="qr-code-svg"
                                value={orders.find(o => o.id === selectedOrder)?.qrCode || ''}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground break-all">
                            {orders.find(o => o.id === selectedOrder)?.uniqueId}
                        </p>
                        <div className="flex gap-2">
                            <Button className="flex-1" onClick={() => {
                                const svg = document.getElementById('qr-code-svg');
                                if (svg) {
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement('canvas');
                                    const ctx = canvas.getContext('2d');
                                    const img = new Image();
                                    img.onload = () => {
                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                        ctx?.drawImage(img, 0, 0);
                                        const pngFile = canvas.toDataURL('image/png');
                                        const downloadLink = document.createElement('a');
                                        downloadLink.download = `QR-${orders.find(o => o.id === selectedOrder)?.uniqueId}.png`;
                                        downloadLink.href = pngFile;
                                        downloadLink.click();
                                    };
                                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                                }
                            }}>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
