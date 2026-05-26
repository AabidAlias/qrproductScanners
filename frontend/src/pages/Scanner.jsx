import { Package, Pause, Play, RefreshCcw, ScanLine, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { api, scannerApi } from '../services/api.js';

export default function Scanner() {
  const [cameraUrl, setCameraUrl] = useState(import.meta.env.VITE_CAMERA_STREAM_URL || '');
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [error, setError] = useState('');

  async function loadData() {
    const [statusResponse, historyResponse] = await Promise.all([
      scannerApi.get('/status'),
      api.get('/scans?limit=20')
    ]);
    setStatus(statusResponse.data);
    setHistory(historyResponse.data.items);
  }

  useEffect(() => {
    loadData().catch((err) => setError(err.response?.data?.message || err.message));
    const timer = window.setInterval(() => {
      loadData().catch(() => {});
    }, 2500);
    return () => window.clearInterval(timer);
  }, []);

  async function startScanner() {
    setError('');
    try {
      await scannerApi.post('/scan/start', { cameraUrl });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  async function stopScanner() {
    setError('');
    try {
      await scannerApi.post('/scan/stop');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <section className="glass rounded-lg p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-50">Live Scanner</h1>
            <p className="text-sm text-slate-400">Mobile IP camera preview and QR decoding</p>
          </div>
          <span className={`rounded px-3 py-1 text-sm font-bold ${status?.running ? 'bg-teal-400/15 text-teal-200' : 'bg-slate-800 text-slate-300'}`}>
            {status?.running ? 'Running' : 'Stopped'}
          </span>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input className="field" value={cameraUrl} onChange={(event) => setCameraUrl(event.target.value)} placeholder="Mobile IP camera stream URL" />
          <button className="btn btn-primary" onClick={startScanner}>
            <Play size={18} />
            Start
          </button>
          <button className="btn btn-secondary" onClick={stopScanner}>
            <Pause size={18} />
            Stop
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-red-200">{error}</div>}

        <div className="aspect-video overflow-hidden rounded-lg border border-slate-800 bg-black">
          {cameraUrl ? (
            <img src={cameraUrl} alt="Live camera stream" className="h-full w-full object-contain" />
          ) : (
            <div className="grid h-full place-items-center text-slate-500">Set camera stream URL</div>
          )}
        </div>
      </section>

      <section className="glass rounded-lg p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-50">Scan History</h2>
            <p className="text-sm text-slate-400">Latest decoded QR results</p>
          </div>
          <button className="btn btn-secondary px-3 py-2" onClick={() => loadData()}>
            <RefreshCcw size={17} />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center gap-3">
            <ScanLine className="text-teal-300" />
            <div>
              <p className="text-sm text-slate-400">Last QR Code</p>
              <p className="break-all font-bold text-slate-100">{status?.last_code || 'No scan yet'}</p>
            </div>
          </div>
          {status?.last_error && <p className="mt-3 text-sm text-red-200">{status.last_error}</p>}
        </div>

        <div className="space-y-3">
          {history.map((scan) => (
            <button
              key={scan._id}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-left transition hover:border-teal-300/50 hover:bg-slate-900/80"
              onClick={() => setSelectedScan(scan)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="break-all font-bold text-slate-100">{scan.productSnapshot?.name || scan.qrCode}</p>
                  <p className="text-sm text-slate-400">{scan.productSnapshot?.sku || 'Unmatched product'}</p>
                </div>
                <span className={`rounded px-2 py-1 text-xs font-bold ${scan.matched ? 'bg-teal-400/15 text-teal-200' : 'bg-amber-400/15 text-amber-200'}`}>
                  {scan.matched ? 'Matched' : 'Unknown'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{new Date(scan.scannedAt).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </section>

      {selectedScan && (
        <ProductScanModal scan={selectedScan} onClose={() => setSelectedScan(null)} />
      )}
    </div>
  );
}

function ProductScanModal({ scan, onClose }) {
  const product = scan.product || {};
  const snapshot = scan.productSnapshot || {};
  const name = snapshot.name || product.name || 'Unknown Product';
  const sku = snapshot.sku || product.sku || 'No SKU';
  const category = snapshot.category || product.category || 'Uncategorized';
  const price = snapshot.price ?? product.price;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div className="glass w-full max-w-lg rounded-lg p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-400 text-slate-950">
              <Package size={22} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-50">{name}</h2>
              <p className="text-sm text-slate-400">{sku}</p>
            </div>
          </div>
          <button className="btn btn-secondary px-3 py-2" onClick={onClose} aria-label="Close product details">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Info label="QR Code" value={scan.qrCode} />
          <Info label="Status" value={scan.matched ? 'Matched' : 'Unknown'} />
          <Info label="Category" value={category} />
          <Info label="Price" value={price !== undefined ? Number(price).toFixed(2) : 'Not set'} />
          <Info label="Stock" value={product.stock ?? 'Not available'} />
          <Info label="Scanned At" value={new Date(scan.scannedAt).toLocaleString()} />
        </div>

        {(product.description || product.imageUrl) && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            {product.imageUrl && (
              <img src={product.imageUrl} alt={name} className="mb-3 max-h-48 w-full rounded-lg object-cover" />
            )}
            {product.description && <p className="text-sm leading-6 text-slate-300">{product.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words font-bold text-slate-100">{value}</p>
    </div>
  );
}
