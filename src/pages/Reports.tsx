import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useWarehouseStore } from '../store/warehouseStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { FileText, FileSpreadsheet } from 'lucide-react';

export const Reports = () => {
    const { movements, inventory } = useWarehouseStore();

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.text('Reporte de Movimientos', 14, 15);

        const tableData = movements.map(m => [
            m.date.split('T')[0],
            m.type === 'IN' ? 'Entrada' : 'Salida',
            inventory.find(i => i.id === m.itemId)?.name || 'N/A',
            m.quantity,
            m.qrCode || 'N/A'
        ]);

        autoTable(doc, {
            head: [['Fecha', 'Tipo', 'Producto', 'Cantidad', 'QR']],
            body: tableData,
            startY: 20,
        });

        doc.save('movimientos.pdf');
    };

    const generateExcel = () => {
        const data = movements.map(m => ({
            Fecha: m.date.split('T')[0],
            Tipo: m.type === 'IN' ? 'Entrada' : 'Salida',
            Producto: inventory.find(i => i.id === m.itemId)?.name || 'N/A',
            Cantidad: m.quantity,
            QR: m.qrCode || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
        XLSX.writeFile(wb, "movimientos.xlsx");
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Reportes</h1>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Reporte de Movimientos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Descarga el historial completo de entradas y salidas de inventario.
                        </p>
                        <div className="flex gap-4">
                            <Button onClick={generatePDF} className="flex-1">
                                <FileText className="mr-2 h-4 w-4" />
                                Descargar PDF
                            </Button>
                            <Button onClick={generateExcel} variant="outline" className="flex-1">
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Descargar Excel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
