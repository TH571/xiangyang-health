import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";

interface User {
    id: number;
    username: string;
    nickname?: string;
    title?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem("admin_user");
        return stored ? JSON.parse(stored) : null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));
    const [, setLocation] = useLocation();

    // No need for initialization useEffect since we do it in useState initializer

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("admin_token", newToken);
        localStorage.setItem("admin_user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setLocation("/admin/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        setToken(null);
        setUser(null);
        setLocation("/admin/login");
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const newUser = { ...user, ...updates };
        localStorage.setItem("admin_user", JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
