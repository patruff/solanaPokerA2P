import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserAttributes {
  email: string;
  name?: string;
}

interface AuthContextType {
  user: UserAttributes | null;
  loading: boolean;
  signIn: (name?: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserAttributes | null>(null);
  const [loading] = useState(false);

  const signIn = (name?: string) => {
    // Simple mock authentication - just set a user
    setUser({
      email: 'player@poker.local',
      name: name || 'Player',
    });
  };

  const signOut = () => {
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
