import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order } from '../store/warehouseStore';

interface GenerateOrderPDFParams {
    order: Order;
    items: { name: string; sku: string; quantity: number }[];
    clientName: string;
    warehouseName: string;
    createdByName: string;
    completedByName: string;
}

export const generateOrderPDF = ({
    order,
    items,
    clientName,
    warehouseName,
    createdByName,
    completedByName
}: GenerateOrderPDFParams) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Detalle de Pedido', 14, 22);

    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);

    // Order Info Box
    doc.setDrawColor(0);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 35, 182, 40, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`ID Pedido: ${order.uniqueId}`, 20, 45);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo: ${order.type === 'IN' ? 'ENTRADA' : 'SALIDA'}`, 20, 52);
    doc.text(`Estado: ${order.status === 'COMPLETED' ? 'COMPLETADO' : 'PENDIENTE'}`, 20, 59);
    doc.text(`Fecha Creación: ${new Date(order.createdAt).toLocaleString()}`, 20, 66);
    if (order.completedAt) {
        doc.text(`Fecha Entrega: ${new Date(order.completedAt).toLocaleString()}`, 20, 73);
    }

    // Right Column Info
    doc.text(`Bodega: ${warehouseName}`, 100, 45);
    doc.text(`Cliente: ${clientName}`, 100, 52);
    doc.text(`Creado por: ${createdByName}`, 100, 59);
    doc.text(`Entregado por: ${completedByName}`, 100, 66);

    // Items Table
    const tableColumn = ["Producto", "SKU", "Cantidad"];
    const tableRows = items.map(item => [
        item.name,
        item.sku,
        item.quantity
    ]);

    autoTable(doc, {
        startY: 85,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 85;
    doc.setFontSize(8);
    doc.text('Este documento es un comprobante generado automáticamente por el sistema.', 14, finalY + 10);

    // Cancelled Banner
    if (order.status === 'CANCELLED') {
        doc.setFillColor(255, 200, 200); // Light red
        doc.setDrawColor(200, 0, 0); // Dark red border
        doc.rect(14, finalY + 20, 182, 20, 'FD');

        doc.setFontSize(12);
        doc.setTextColor(200, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('CANCELADO', 20, finalY + 32);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(`Motivo: ${order.cancellationReason || 'No especificado'}`, 60, finalY + 32);
    }

    // Save
    doc.save(`Pedido_${order.uniqueId}.pdf`);
};
