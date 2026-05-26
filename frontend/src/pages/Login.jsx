import { Lock } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      navigate('/scanner');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="glass rounded-lg p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-400 text-slate-950">
            <Lock size={21} />
          </span>
          <div>
            <h1 className="text-2xl font-black text-slate-50">Admin Login</h1>
            <p className="text-sm text-slate-400">Access scanner and product controls</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-red-200">{error}</div>}

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-semibold text-slate-300">Email</span>
          <input
            className="field"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-2 block text-sm font-semibold text-slate-300">Password</span>
          <input
            className="field"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
            minLength={8}
          />
        </label>

        <button className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
