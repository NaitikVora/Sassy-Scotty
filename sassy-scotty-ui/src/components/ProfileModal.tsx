import { useState } from 'react';
import type { UserProfile } from '../types/user';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
  onLogout,
}: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [canvasApiKey, setCanvasApiKey] = useState(user.canvasApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateProfile({ name, email, canvasApiKey });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(user.name);
    setEmail(user.email);
    setCanvasApiKey(user.canvasApiKey || '');
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>profile</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <div className="profile-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {isEditing ? (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label>name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>cmu email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>canvas api key (optional)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={canvasApiKey}
                      onChange={(e) => setCanvasApiKey(e.target.value)}
                      placeholder="paste your canvas api token"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                      }}
                    >
                      {showApiKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <p className="form-hint">
                    <a
                      href="https://canvas.cmu.edu/profile/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      get your api key →
                    </a>
                  </p>
                </div>
                <div className="button-group">
                  <button className="btn btn-secondary" onClick={handleCancel}>
                    cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSave}>
                    save changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <h3>{user.name}</h3>
                <p className="profile-email">{user.email}</p>
                {user.canvasApiKey && (
                  <p className="profile-badge">
                    ✅ canvas connected
                  </p>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(true)}
                >
                  edit profile
                </button>
              </div>
            )}
          </div>

          <div className="profile-section">
            <h4>account info</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">member since</span>
                <span className="info-value">{formatDate(user.firstAccess)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">last active</span>
                <span className="info-value">{formatDate(user.lastAccess)}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <button className="btn btn-danger" onClick={onLogout}>
              log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
