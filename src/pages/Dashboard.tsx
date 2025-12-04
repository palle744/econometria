import React from 'react';
import { useWarehouseStore } from '../store/warehouseStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, ArrowUpRight, ArrowDownLeft, Users, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard = () => {
    const { warehouses, inventory, movements, clients, orders } = useWarehouseStore();

    // Stats
    const totalProducts = inventory.reduce((acc, item) => acc + item.quantity, 0);
    const totalMovements = movements.length;
    const totalClients = clients.length;
    const totalWarehouses = warehouses.length;

    // Chart Data: Inventory by Warehouse
    const inventoryByWarehouse = warehouses.map(w => ({
        name: w.name,
        value: inventory.filter(i => i.warehouseId === w.id).reduce((acc, i) => acc + i.quantity, 0)
    }));


    const STATUS_COLORS = {
        PENDING: '#FFBB28',
        COMPLETED: '#00C49F',
        CANCELLED: '#FF8042'
    };

    // Chart Data: Order Status
    const ordersByStatus = [
        { name: 'Pendientes', value: orders.filter(o => o.status === 'PENDING').length, color: STATUS_COLORS.PENDING },
        { name: 'Completados', value: orders.filter(o => o.status === 'COMPLETED').length, color: STATUS_COLORS.COMPLETED },
        { name: 'Cancelados', value: orders.filter(o => o.status === 'CANCELLED').length, color: STATUS_COLORS.CANCELLED },
    ].filter(item => item.value > 0);

    // Chart Data: Top Moving Products (OUT)
    const topProducts = React.useMemo(() => {
        const productMovements: Record<string, number> = {};
        movements.filter(m => m.type === 'OUT').forEach(m => {
            productMovements[m.itemId] = (productMovements[m.itemId] || 0) + m.quantity;
        });

        return Object.entries(productMovements)
            .map(([itemId, quantity]) => {
                const item = inventory.find(i => i.id === itemId);
                return { name: item?.name || 'Desconocido', value: quantity };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [movements, inventory]);

    // Low Stock Items
    const lowStockItems = inventory.filter(i => i.quantity < 10).slice(0, 5);

    // Recent Orders
    const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Movimientos Totales</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMovements}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClients}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bodegas</CardTitle>
                        <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalWarehouses}</div>
                    </CardContent>
                </Card>
            </div>



            {/* Expanded Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Inventario por Bodega</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={inventoryByWarehouse}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" name="Cantidad" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Estado de Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ordersByStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {ordersByStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Top Productos (Salidas)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} />
                                <Tooltip />
                                <Bar dataKey="value" name="Cantidad" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section: Recent Orders & Low Stock */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Pedidos Recientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium">{order.uniqueId}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {order.status === 'COMPLETED' ? 'Completado' :
                                                order.status === 'PENDING' ? 'Pendiente' : 'Cancelado'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {recentOrders.length === 0 && (
                                <p className="text-center text-muted-foreground">No hay pedidos recientes</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-600">
                            <AlertTriangle className="h-5 w-5" />
                            Alertas de Bajo Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {lowStockItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-red-600 font-bold">{item.quantity}</span>
                                        <p className="text-xs text-muted-foreground">unidades</p>
                                    </div>
                                </div>
                            ))}
                            {lowStockItems.length === 0 && (
                                <p className="text-center text-muted-foreground">Todo el inventario está saludable</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
