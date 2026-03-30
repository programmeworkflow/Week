import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { User, mockUsers, Sector } from "@/lib/mock-data";

const USERS_STORAGE_KEY = "medwork-users";
const SESSION_KEY = "medwork-session";

const loadUsers = (): User[] => {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return mockUsers;
};

const saveUsers = (users: User[]) => {
  try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)); } catch {}
};

const loadSession = (users: User[]): User | null => {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    if (id) return users.find((u) => u.id === id) || null;
  } catch {}
  return null;
};

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  canAccessSector: (sector: Sector) => boolean;
  updateProfile: (data: Partial<User>) => void;
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, data: Partial<Omit<User, "id">>) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [user, setUser] = useState<User | null>(() => loadSession(loadUsers()));

  const persistUsers = useCallback((newUsers: User[]) => {
    setUsers(newUsers);
    saveUsers(newUsers);
  }, []);

  const login = (email: string, password: string) => {
    // Always read fresh from localStorage to catch newly created users
    const freshUsers = loadUsers();
    if (JSON.stringify(freshUsers) !== JSON.stringify(users)) {
      setUsers(freshUsers);
    }
    const found = freshUsers.find((u) => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      try { localStorage.setItem(SESSION_KEY, found.id); } catch {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  };

  const canAccessSector = (sector: Sector) => {
    if (!user) return false;
    if (user.is_admin) return true;
    return user.sectors.includes(sector);
  };

  const updateProfile = (data: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...data } : prev);
    if (user) {
      const newUsers = users.map((u) => u.id === user.id ? { ...u, ...data } : u);
      persistUsers(newUsers);
    }
  };

  const addUser = (userData: Omit<User, "id">) => {
    const newUser: User = { ...userData, id: String(Date.now()) };
    const newUsers = [...users, newUser];
    persistUsers(newUsers);
  };

  const updateUser = (id: string, data: Partial<Omit<User, "id">>) => {
    const newUsers = users.map((u) => u.id === id ? { ...u, ...data } : u);
    persistUsers(newUsers);
    if (user && user.id === id) {
      setUser((prev) => prev ? { ...prev, ...data } : prev);
    }
  };

  const deleteUser = (id: string) => {
    const newUsers = users.filter((u) => u.id !== id);
    persistUsers(newUsers);
  };

  return (
    <AuthContext.Provider value={{ user, allUsers: users, login, logout, canAccessSector, updateProfile, addUser, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
};
