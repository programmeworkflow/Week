import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { User, Sector } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "medwork-session";
const USER_CACHE_KEY = "medwork_user_v2"; // versioned — invalida cache se shape mudar

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  canAccessSector: (sector: Sector) => boolean;
  updateProfile: (data: Partial<User>) => Promise<void>;
  addUser: (user: Omit<User, "id">) => Promise<void>;
  updateUser: (id: string, data: Partial<Omit<User, "id">>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

// Helpers defensivos pro localStorage (Safari Privado pode falhar)
function readUserCache(): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed.id !== "string" ||
      typeof parsed.full_name !== "string" ||
      typeof parsed.email !== "string"
    ) return null;
    return parsed as User;
  } catch {
    return null;
  }
}

function writeUserCache(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {}
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Restaura user do cache localStorage SÍNCRONO no init — entrada instantânea
  const cachedUser = readUserCache();
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from("medwork_users").select("*");
    if (data) {
      const mapped: User[] = data.map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        cpf: u.cpf || "",
        email: u.email,
        password: u.password,
        is_admin: u.is_admin || false,
        company_id: u.company_id || "1",
        sectors: u.sectors || [],
      }));
      setUsers(mapped);
      return mapped;
    }
    return [];
  }, []);

  // Background refresh: valida sessão e atualiza users sem bloquear render
  useEffect(() => {
    const init = async () => {
      const allUsers = await fetchUsers();
      const savedId = localStorage.getItem(SESSION_KEY);
      if (savedId) {
        const found = allUsers.find((u) => u.id === savedId);
        if (found) {
          setUser(found);
          writeUserCache(found);
        } else {
          // User não existe mais no banco — limpa
          setUser(null);
          writeUserCache(null);
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
    };
    init();
  }, [fetchUsers]);

  const login = async (email: string, password: string) => {
    const freshUsers = await fetchUsers();
    const found = freshUsers.find((u) => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      writeUserCache(found);
      try { localStorage.setItem(SESSION_KEY, found.id); } catch {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    writeUserCache(null);
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  };

  const canAccessSector = (sector: Sector) => {
    if (!user) return false;
    if (user.is_admin) return true;
    return user.sectors.includes(sector);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updates: any = {};
    if (data.full_name !== undefined) updates.full_name = data.full_name;
    if (data.email !== undefined) updates.email = data.email;
    if (data.password !== undefined) updates.password = data.password;

    await supabase.from("medwork_users").update(updates).eq("id", user.id);
    setUser((prev) => {
      const updated = prev ? { ...prev, ...data } : prev;
      if (updated) writeUserCache(updated);
      return updated;
    });
    await fetchUsers();
  };

  const addUser = async (userData: Omit<User, "id">) => {
    const newId = String(Date.now());
    await supabase.from("medwork_users").insert({
      id: newId,
      full_name: userData.full_name,
      cpf: userData.cpf,
      email: userData.email,
      password: userData.password,
      is_admin: userData.is_admin,
      company_id: userData.company_id || "1",
      sectors: userData.sectors,
    });
    await fetchUsers();
  };

  const updateUser = async (id: string, data: Partial<Omit<User, "id">>) => {
    await supabase.from("medwork_users").update(data).eq("id", id);
    if (user && user.id === id) {
      setUser((prev) => {
        const updated = prev ? { ...prev, ...data } : prev;
        if (updated) writeUserCache(updated);
        return updated;
      });
    }
    await fetchUsers();
  };

  const deleteUser = async (id: string) => {
    await supabase.from("medwork_users").delete().eq("id", id);
    await fetchUsers();
  };

  const refreshUsers = fetchUsers;

  return (
    <AuthContext.Provider value={{ user, allUsers: users, loading, login, logout, canAccessSector, updateProfile, addUser, updateUser, deleteUser, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  );
};
