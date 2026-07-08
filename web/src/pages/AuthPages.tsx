import { useState } from 'react';
import { supabase } from '../lib/supabase';


export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center mb-2">
          <img src="/logo.png" alt="NEST OS" className="w-16 h-16 rounded mb-2" />
          <h1 className="text-3xl font-semibold text-center">NestOS</h1>
        </div>
        <p className="text-[var(--text-secondary)] text-center mb-8">Sign in to your personal OS</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" required placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-lg px-4 py-3 outline-none focus:border-[var(--accent)]"
          />
          <input 
            type="password" required placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-lg px-4 py-3 outline-none focus:border-[var(--accent)]"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button 
            type="submit" disabled={loading}
            className="w-full bg-[var(--text-primary)] text-[var(--bg-base)] rounded-lg py-3 font-medium hover:opacity-90 transition-opacity"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Don't have an account? <a href="/register" className="text-[var(--accent)] hover:underline">Register</a>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Attempt to create user profile immediately
    try {
      if (data.session) {
        // If session is returned synchronously, use it immediately
        await fetch((import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') + '/partner/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
          },
          body: JSON.stringify({ username })
        });
        window.location.href = '/';
      } else {
        // Email confirmation required
        setError('Registration successful! Please check your email to verify your account.');
      }
    } catch (e: any) {
      setError('Failed to create profile: ' + e.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center mb-2">
          <img src="/logo.png" alt="NEST OS" className="w-16 h-16 rounded mb-2" />
          <h1 className="text-3xl font-semibold text-center">Join NestOS</h1>
        </div>
        <p className="text-[var(--text-secondary)] text-center mb-8">Create your personal OS</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <input 
            type="email" required placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-lg px-4 py-3 outline-none focus:border-[var(--accent)]"
          />
          <input 
            type="text" required placeholder="Display Name (e.g. Alice)"
            value={username} onChange={e => setUsername(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-lg px-4 py-3 outline-none focus:border-[var(--accent)]"
          />
          <input 
            type="password" required placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-lg px-4 py-3 outline-none focus:border-[var(--accent)]"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button 
            type="submit" disabled={loading}
            className="w-full bg-[var(--accent)] text-white rounded-lg py-3 font-medium hover:opacity-90 transition-opacity"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Already have an account? <a href="/login" className="text-[var(--text-primary)] hover:underline">Log in</a>
        </p>
      </div>
    </div>
  );
}
