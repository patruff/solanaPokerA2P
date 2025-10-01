import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Solana Poker</h1>
        <p className="subtitle">Welcome to the table</p>
        
        <div className="login-content">
          <div className="poker-chips">
            <div className="chip chip-red"></div>
            <div className="chip chip-blue"></div>
            <div className="chip chip-green"></div>
          </div>
          
          <button className="google-signin-btn" onClick={handleGoogleSignIn}>
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google logo" 
            />
            Sign in with Google
          </button>
          
          <p className="info-text">
            Sign in to join the game. You'll need a Phantom wallet to play.
          </p>
        </div>
      </div>
    </div>
  );
}
