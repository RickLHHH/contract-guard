"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserRole } from "@prisma/client";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// 默认测试用户
const DEFAULT_TEST_USER: User = {
  id: 'user-1',
  email: 'business@contractguard.com',
  name: '张业务',
  role: UserRole.BUSINESS_USER,
  department: '采购部',
  avatar: '',
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // 首先检查 localStorage 是否有测试用户
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('test-user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setLoading(false);
          return;
        }
      }

      // 否则尝试从 API 获取
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // 如果未登录，使用默认测试用户
        setUser(DEFAULT_TEST_USER);
      }
    } catch {
      // 出错时使用默认测试用户
      setUser(DEFAULT_TEST_USER);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem('test-user');
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, setUser, logout, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
