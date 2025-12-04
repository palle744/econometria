import type { Client } from '../store/warehouseStore';

interface EmailData {
    type: 'ORDER_CREATED' | 'MOVEMENT_CREATED' | 'ORDER_PROCESSED';
    client: Client;
    items: { name: string; quantity: number; sku: string }[];
    orderId?: string;
    date: string;
    movementType: 'IN' | 'OUT';
}

export const generateMailtoLink = (data: EmailData): string => {
    const { type, client, items, orderId, date, movementType } = data;

    if (!client.email) return '';

    const subjectMap = {
        'ORDER_CREATED': `Nuevo Pedido Generado - ${orderId || 'Sin ID'}`,
        'MOVEMENT_CREATED': `Movimiento de Inventario Registrado - ${movementType === 'IN' ? 'Entrada' : 'Salida'}`,
        'ORDER_PROCESSED': `Pedido Procesado - ${orderId || 'Sin ID'}`
    };

    const typeLabel = movementType === 'IN' ? 'ENTRADA' : 'SALIDA';

    let body = `Estimado/a ${client.name},\n\n`;

    if (type === 'ORDER_CREATED') {
        body += `Se ha generado un nuevo pedido de ${typeLabel} con la siguiente información:\n\n`;
        body += `ID Pedido: ${orderId}\n`;
    } else if (type === 'MOVEMENT_CREATED') {
        body += `Se ha registrado un movimiento de ${typeLabel} en su inventario:\n\n`;
    } else if (type === 'ORDER_PROCESSED') {
        body += `Su pedido ${orderId} ha sido procesado exitosamente (${typeLabel}).\n\n`;
    }

    body += `Fecha: ${new Date(date).toLocaleString()}\n\n`;
    body += `Detalle de Productos:\n`;
    body += `----------------------------------------\n`;

    items.forEach(item => {
        body += `- ${item.name} (SKU: ${item.sku}): ${item.quantity} unidades\n`;
    });

    body += `----------------------------------------\n\n`;
    body += `Atentamente,\nEquipo de Bodega`;

    return `mailto:${client.email}?subject=${encodeURIComponent(subjectMap[type])}&body=${encodeURIComponent(body)}`;
};

export const openEmailClient = (data: EmailData) => {
    const link = generateMailtoLink(data);
    if (link) {
        window.location.href = link;
    } else {
        console.warn('El cliente no tiene email registrado');
    }
};
