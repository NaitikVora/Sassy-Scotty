import { useState } from 'react';
import { themes, type Theme } from '../utils/themes';
import './MoodSelector.css';

interface MoodSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export default function MoodSelector({ currentTheme, onThemeChange }: MoodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mood-selector">
      <button
        className="mood-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Change your vibe"
      >
        <span className="mood-emoji">{currentTheme.emoji}</span>
        <span className="mood-label">
          <span className="mood-label-text">mood</span>
          <span className="mood-name">{currentTheme.name}</span>
        </span>
        <span className="mood-arrow">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <>
          <div className="mood-backdrop" onClick={() => setIsOpen(false)} />
          <div className="mood-dropdown">
            <div className="mood-dropdown-header">
              <h3>set your vibe</h3>
              <p>pick a mood that matches your energy</p>
            </div>
            <div className="mood-grid">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  className={`mood-option ${theme.id === currentTheme.id ? 'active' : ''}`}
                  onClick={() => {
                    onThemeChange(theme);
                    setIsOpen(false);
                  }}
                  style={{
                    '--preview-bg': theme.colors.background,
                    '--preview-card': theme.colors.cardBackground,
                    '--preview-primary': theme.colors.primary,
                    '--preview-text': theme.colors.textPrimary,
                  } as React.CSSProperties}
                >
                  <div className="mood-option-preview">
                    <div className="preview-bg">
                      <div className="preview-card"></div>
                      <div className="preview-accent"></div>
                    </div>
                  </div>
                  <div className="mood-option-info">
                    <span className="mood-option-emoji">{theme.emoji}</span>
                    <div>
                      <strong>{theme.name}</strong>
                      <p>{theme.description}</p>
                    </div>
                  </div>
                  {theme.id === currentTheme.id && (
                    <div className="mood-option-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
