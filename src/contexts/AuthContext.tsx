import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { User, Sector } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "medwork-session";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    // Não inclui `password` — nunca expõe credenciais na listagem geral
    const { data } = await supabase
      .from("medwork_users")
      .select("id, full_name, cpf, email, is_admin, company_id, sectors");
    if (data) {
      const mapped: User[] = data.map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        cpf: u.cpf || "",
        email: u.email,
        is_admin: u.is_admin || false,
        company_id: u.company_id || "1",
        sectors: u.sectors || [],
      }));
      setUsers(mapped);
      return mapped;
    }
    return [];
  }, []);

  // Load users and restore session on mount
  useEffect(() => {
    const init = async () => {
      const allUsers = await fetchUsers();
      const savedId = localStorage.getItem(SESSION_KEY);
      if (savedId) {
        const found = allUsers.find((u) => u.id === savedId);
        if (found) setUser(found);
      }
      setLoading(false);
    };
    init();
  }, [fetchUsers]);

  const login = async (email: string, password: string) => {
    // Query específica do login (inclui password só pra comparar) — não vai pro estado público
    const { data } = await supabase
      .from("medwork_users")
      .select("id, full_name, cpf, email, password, is_admin, company_id, sectors")
      .eq("email", email)
      .maybeSingle();
    if (!data || data.password !== password) return false;
    const safeUser: User = {
      id: data.id,
      full_name: data.full_name,
      cpf: data.cpf || "",
      email: data.email,
      is_admin: data.is_admin || false,
      company_id: data.company_id || "1",
      sectors: data.sectors || [],
    };
    setUser(safeUser);
    // Garante que o user logado existe na lista pública
    setUsers((prev) => prev.some((u) => u.id === safeUser.id) ? prev : [...prev, safeUser]);
    localStorage.setItem(SESSION_KEY, safeUser.id);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
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
    setUser((prev) => prev ? { ...prev, ...data } : prev);
    await fetchUsers();
  };

  const addUser = async (userData: Omit<User, "id">) => {
    const newId = crypto.randomUUID();
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
      setUser((prev) => prev ? { ...prev, ...data } : prev);
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
