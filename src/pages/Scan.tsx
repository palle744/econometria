import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useWarehouseStore, type InventoryItem, type Order } from '../store/warehouseStore';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { openEmailClient } from '../utils/emailUtils';

export const Scan = () => {
    const { user } = useAuthStore();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
    const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
    const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
    const [message, setMessage] = useState('');

    // Movement Form State
    const { inventory, warehouses, clients, addMovement, orders, updateOrder } = useWarehouseStore();
    const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [selectedClient, setSelectedClient] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [step, setStep] = useState<'scan' | 'form' | 'complete' | 'order-review'>('scan');

    useEffect(() => {
        if (step !== 'scan') return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear();
                setScanResult(decodedText);
                processScan(decodedText);
            },
            () => { }
        );

        return () => {
            scanner.clear().catch(console.error);
        };
    }, [step]);

    const processScan = (text: string) => {
        // Check if it's an Order QR
        if (text.startsWith('ORDER|')) {
            const parts = text.split('|');
            const orderId = parts[1];
            const order = orders.find(o => o.id === orderId);

            if (order) {
                setScannedOrder(order);
                if (order.status === 'COMPLETED') {
                    if (user?.role === 'admin') {
                        setStatus('warning');
                        setMessage('Este pedido ya fue procesado. ¿Deseas modificarlo?');
                        setStep('order-review');
                    } else {
                        setStatus('error');
                        setMessage('Este código ya fue escaneado y procesado.');
                        setStep('complete');
                    }
                } else {
                    setStatus('success');
                    setMessage('Pedido encontrado. Confirmar procesamiento.');
                    setStep('order-review');
                }
                return;
            }
        }

        // Normal Product Scan
        const item = inventory.find(i => i.sku === text);

        if (item) {
            setScannedItem(item);
            setStatus('success');
            setStep('form');
            setSelectedWarehouse(item.warehouseId);
        } else {
            setStatus('error');
            setMessage(`Código no encontrado: ${text}`);
            setStep('complete');
        }
    };

    const handleOrderProcess = () => {
        if (!scannedOrder) return;

        // Validate stock for OUT orders
        if (scannedOrder.type === 'OUT') {
            for (const item of scannedOrder.items) {
                const inventoryItem = inventory.find(i => i.id === item.itemId);
                if (!inventoryItem || inventoryItem.quantity < item.quantity) {
                    setStatus('error');
                    setMessage(`Stock insuficiente para el producto ${inventoryItem?.name || 'Desconocido'}. Disponible: ${inventoryItem?.quantity || 0}, Requerido: ${item.quantity}`);
                    setStep('complete');
                    return;
                }
            }
        }

        // Process all items in the order
        scannedOrder.items.forEach(item => {
            addMovement({
                id: Math.random().toString(36).substr(2, 9),
                type: scannedOrder.type,
                itemId: item.itemId,
                quantity: item.quantity,
                date: new Date().toISOString(),
                userId: user?.id || 'unknown',
                clientId: scannedOrder.clientId,
                qrCode: scannedOrder.qrCode
            });
        });

        updateOrder(scannedOrder.id, {
            status: 'COMPLETED',
            completedAt: new Date().toISOString()
        });

        // Send Email Notification
        const client = clients.find(c => c.id === scannedOrder.clientId);
        if (client && client.email) {
            const orderItems = scannedOrder.items.map(item => {
                const product = inventory.find(p => p.id === item.itemId);
                return {
                    name: product?.name || 'Desconocido',
                    sku: product?.sku || 'N/A',
                    quantity: item.quantity
                };
            });

            openEmailClient({
                type: 'ORDER_PROCESSED',
                client,
                items: orderItems,
                orderId: scannedOrder.uniqueId,
                date: new Date().toISOString(),
                movementType: scannedOrder.type
            });
        }

        setStatus('success');
        setMessage(`Pedido ${scannedOrder.uniqueId} procesado exitosamente.`);
        setStep('complete');
    };

    const handleMovementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!scannedItem) return;

        const qty = Number(quantity);

        if (movementType === 'OUT') {
            if (scannedItem.quantity < qty) {
                setStatus('error');
                setMessage(`Stock insuficiente. Disponible: ${scannedItem.quantity}, Intento de salida: ${qty}`);
                setStep('complete');
                return;
            }
        }

        addMovement({
            id: Math.random().toString(36).substr(2, 9),
            type: movementType,
            itemId: scannedItem.id,
            quantity: qty,
            date: new Date().toISOString(),
            userId: user?.id || 'unknown',
            clientId: selectedClient,
            qrCode: `MOV-${movementType}-${scannedItem.sku}-${Date.now()}`
        });

        // Send Email Notification
        const client = clients.find(c => c.id === selectedClient);
        if (client && client.email) {
            openEmailClient({
                type: 'MOVEMENT_CREATED',
                client,
                items: [{
                    name: scannedItem.name,
                    sku: scannedItem.sku,
                    quantity: qty
                }],
                date: new Date().toISOString(),
                movementType: movementType
            });
        }

        setStatus('success');
        setMessage(`Movimiento registrado: ${movementType === 'IN' ? 'Entrada' : 'Salida'} de ${qty} unidades.`);
        setStep('complete');
    };

    const resetScanner = () => {
        setScanResult(null);
        setScannedItem(null);
        setScannedOrder(null);
        setStatus('idle');
        setMessage('');
        setStep('scan');
        setQuantity(1);
        setSelectedClient('');
    };

    return (
        <div className="max-w-md mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-center">Escáner de QR</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="text-center">
                        {step === 'scan' ? 'Escanear Código' :
                            step === 'form' ? 'Registrar Movimiento' :
                                step === 'order-review' ? 'Revisar Pedido' : 'Resultado'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {step === 'scan' && (
                        <div id="reader" className="w-full"></div>
                    )}

                    {step === 'order-review' && scannedOrder && (
                        <div className="space-y-4 text-center">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="font-bold text-lg">Pedido: {scannedOrder.uniqueId}</p>
                                <p className="text-sm text-muted-foreground">
                                    Tipo: {scannedOrder.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Items: {scannedOrder.items.length}
                                </p>
                            </div>

                            {status === 'warning' ? (
                                <div className="space-y-4">
                                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
                                    <p className="text-yellow-600 font-medium">{message}</p>
                                    <Button onClick={handleOrderProcess} className="w-full">
                                        Reprocesar Pedido
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="font-medium">¿Confirmar procesamiento de este pedido?</p>
                                    <Button onClick={handleOrderProcess} className="w-full">
                                        Confirmar
                                    </Button>
                                </div>
                            )}

                            <Button variant="outline" onClick={resetScanner} className="w-full">
                                Cancelar
                            </Button>
                        </div>
                    )}

                    {step === 'form' && scannedItem && (
                        <form onSubmit={handleMovementSubmit} className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg text-center">
                                <p className="font-bold text-lg">{scannedItem.name}</p>
                                <p className="text-sm text-muted-foreground">SKU: {scannedItem.sku}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo de Movimiento</label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={movementType === 'IN' ? 'default' : 'outline'}
                                        className="flex-1"
                                        onClick={() => setMovementType('IN')}
                                    >
                                        Entrada
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={movementType === 'OUT' ? 'default' : 'outline'}
                                        className="flex-1"
                                        onClick={() => setMovementType('OUT')}
                                    >
                                        Salida
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bodega</label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedWarehouse}
                                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                                    required
                                >
                                    <option value="">Seleccionar Bodega</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cliente</label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                    required
                                >
                                    <option value="">Seleccionar Cliente</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cantidad</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    required
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" className="flex-1">Confirmar</Button>
                                <Button type="button" variant="outline" onClick={resetScanner}>Cancelar</Button>
                            </div>
                        </form>
                    )}

                    {step === 'complete' && (
                        <div className="text-center space-y-4">
                            {status === 'success' ? (
                                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                            ) : status === 'error' ? (
                                <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                            ) : (
                                <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
                            )}

                            <div className="text-lg font-medium">{message}</div>
                            {scanResult && <p className="text-sm text-muted-foreground break-all">{scanResult}</p>}

                            <Button onClick={resetScanner} className="w-full">
                                Escanear Otro
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
