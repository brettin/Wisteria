import React, { useState } from 'react';
import { apiService } from '../services/api';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isCreateMode) {
        // Create user
        const result = await apiService.createUser(username, password);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccessMessage(result.message || 'User created successfully! You can now sign in.');
          setIsCreateMode(false);
          setUsername('');
          setPassword('');
        }
      } else {
        // Login user
        const result = await apiService.login(username, password);
        if (result.error) {
          setError(result.error);
        } else {
          onLogin();
        }
      }
    } catch (error: any) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsCreateMode(!isCreateMode);
    setError('');
    setSuccessMessage('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/images/wisteria_logo.png" alt="Wisteria" className="login-logo" />
          <h1 className="login-title">Welcome to Wisteria</h1>
          <p className="login-subtitle">
            {isCreateMode 
              ? 'Create a new account to get started' 
              : 'Sign in to continue to your research session'
            }
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder={isCreateMode ? "Choose a username (min 3 characters)" : "Enter your username"}
              disabled={loading}
              required
              minLength={isCreateMode ? 3 : undefined}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder={isCreateMode ? "Choose a password (min 6 characters)" : "Enter your password"}
              disabled={loading}
              required
              minLength={isCreateMode ? 6 : undefined}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading 
              ? (isCreateMode ? 'Creating Account...' : 'Signing in...') 
              : (isCreateMode ? 'Create Account' : 'Sign In')
            }
          </button>
          
          <div className="auth-toggle">
            <button
              type="button"
              onClick={toggleMode}
              className="toggle-button"
              disabled={loading}
            >
              {isCreateMode 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Create User"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 