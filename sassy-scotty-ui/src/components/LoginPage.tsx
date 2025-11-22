import { useState } from 'react';
import './LoginPage.css';
import type { UserProfile } from '../types/user';
import { getDeviceInfo } from '../utils/deviceDetection';

interface LoginPageProps {
  onLogin: (profile: UserProfile) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [step, setStep] = useState<'code' | 'profile'>('code');
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate access code with backend
      const response = await fetch('/api/auth/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        // Check if user already exists
        if (data.existingUser) {
          onLogin(data.user);
        } else {
          setStep('profile');
        }
      } else {
        setError('Invalid access code. Please try again.');
      }
    } catch (err) {
      setError('Failed to validate access code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const deviceInfo = getDeviceInfo();
      const now = new Date().toISOString();

      const newUser: UserProfile = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name,
        email,
        accessCode,
        deviceInfo,
        firstAccess: now,
        lastAccess: now,
      };

      // Register user with backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.user);
      } else {
        setError('Failed to create profile. Please try again.');
      }
    } catch (err) {
      setError('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            {['🎯', '🚀', '✨', '🔥', '💯'][Math.floor(Math.random() * 5)]}
          </div>
          <h1>scotty szn</h1>
          <p className="login-tagline">cmu productivity hits different</p>
        </div>

        {step === 'code' ? (
          <form onSubmit={handleAccessCode} className="login-form">
            <div className="form-group">
              <label htmlFor="accessCode">access code</label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="enter your access code"
                required
                autoFocus
                disabled={loading}
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'verifying...' : 'continue'}
            </button>
            <p className="login-footer">
              need access? contact{' '}
              <a href="mailto:naitikvora@cmu.edu">naitikvora@cmu.edu</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="login-form">
            <p className="form-intro">welcome! let's set up your profile</p>
            <div className="form-group">
              <label htmlFor="name">name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="your name"
                required
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">cmu email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@andrew.cmu.edu"
                required
                disabled={loading}
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'creating profile...' : 'get started'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
