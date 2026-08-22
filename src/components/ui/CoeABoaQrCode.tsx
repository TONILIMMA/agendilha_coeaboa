import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export function CoeABoaQrCode() {
  const url = "https://coeaboa.com";
  
  const downloadQRCode = () => {
    const svg = document.getElementById("coeaboa-qr-code");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "coeaboa-qr-code.png";
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Code baixado com sucesso!");
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-3xl border border-border shadow-sm">
      <div className="bg-white p-4 rounded-2xl shadow-inner">
        <QRCodeSVG 
          id="coeaboa-qr-code"
          value={url} 
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>
      <div className="text-center space-y-1">
        <h3 className="font-bold text-lg">Coé a Boa?</h3>
        <p className="text-sm text-muted-foreground">Escaneie para acessar o portal</p>
      </div>
      <Button 
        variant="outline" 
        className="rounded-full gap-2 w-full"
        onClick={downloadQRCode}
      >
        <Download className="h-4 w-4" />
        Baixar em PNG
      </Button>
    </div>
  );
}