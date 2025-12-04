import { QRCodeCanvas } from 'qrcode.react';
import { Button } from './ui/Button';
import { Download } from 'lucide-react';

interface QRGeneratorProps {
    value: string;
    size?: number;
    label?: string;
}

export const QRGenerator = ({ value, size = 128, label }: QRGeneratorProps) => {
    const downloadQR = () => {
        const canvas = document.getElementById(`qr-${value}`) as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `qr-${label || value}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-white">
            <QRCodeCanvas
                id={`qr-${value}`}
                value={value}
                size={size}
                level={"H"}
                includeMargin={true}
            />
            {label && <p className="text-xs text-muted-foreground font-mono">{label}</p>}
            <Button variant="outline" size="sm" onClick={downloadQR} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Descargar
            </Button>
        </div>
    );
};
