import { Activity, Database, ScanLine } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { authenticated } = useAuth();

  return (
    <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <div className="py-6 lg:py-14">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-teal-300">
          MERN + Flask + OpenCV
        </p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-50 md:text-6xl">
          Smart QR Product Scanner
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Scan product QR codes from a mobile IP camera stream, match inventory in MongoDB, and keep a real-time audit trail for every scan.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={authenticated ? '/scanner' : '/login'} className="btn btn-primary">
            <ScanLine size={19} />
            Open Scanner
          </Link>
          <Link to={authenticated ? '/admin' : '/login'} className="btn btn-secondary">
            <Database size={19} />
            Manage Products
          </Link>
        </div>
      </div>

      <div className="glass rounded-lg p-5">
        <div className="aspect-video overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
          <div className="flex h-full flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="rounded bg-teal-400/15 px-3 py-1 text-sm font-bold text-teal-200">
                Live Ready
              </span>
              <Activity className="text-amber-300" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['Camera', 'Decode', 'Lookup'].map((item) => (
                <div key={item} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                  <div className="h-2 rounded bg-teal-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
