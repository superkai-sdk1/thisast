'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { propertiesApi } from '@/lib/api/properties';
import { Button } from '@/components/atoms/Button';

interface PDFDownloadButtonProps {
  propertyId: string;
  address?: string;
}

export function PDFDownloadButton({ propertyId, address }: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await propertiesApi.downloadPdf(propertyId);
      const blob = new Blob([res.data as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property-${address ?? propertyId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      PDF
    </Button>
  );
}
