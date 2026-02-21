/*
 * api.ts — Drop-in replacement for storage.ts
 * All exported names and signatures match storage.ts so pages need only change their import path.
 */

const API_BASE = "/api";
const AUTH_BASE = "/auth";

// ── Modo 100% frontend (sem backend) ───────────────────────
const LOCAL_COMPANY_ID = "local-company-id";
const LOCAL_TOKEN = "local-token";

function isLocalSession(): boolean {
    return getToken() === LOCAL_TOKEN;
}

// ── Token management ─────────────────────────────────────
function getToken(): string | null {
    return localStorage.getItem("erp_token");
}
function setToken(token: string): void {
    localStorage.setItem("erp_token", token);
}
function clearToken(): void {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_session");
}

// ── Fetch wrapper with JWT ────────────────────────────────
async function fetchAPI<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(path, { ...options, headers });

    if (res.status === 401) {
        if (!isLocalSession()) {
            clearToken();
            window.location.href = "/login";
        }
        throw new Error("Sessão expirada.");
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Erro desconhecido." }));
        throw new Error(body.error || `HTTP ${res.status}`);
    }

    return res.json();
}

export const api = {
    get: <T = any>(path: string) => fetchAPI<T>(path),
    post: <T = any>(path: string, body: any) => fetchAPI<T>(path, { method: "POST", body: JSON.stringify(body) }),
    put: <T = any>(path: string, body: any) => fetchAPI<T>(path, { method: "PUT", body: JSON.stringify(body) }),
    delete: <T = any>(path: string) => fetchAPI<T>(path, { method: "DELETE" }),
};

// ── Auth ──────────────────────────────────────────────────
import { User } from "@/types/erp";

interface LoginResponse {
    token: string;
    user: Omit<User, "password">;
}

const REGISTERED_USERS_KEY = "erp_registered_users";

interface RegisteredUser {
    id: string;
    email: string;
    name: string;
    password: string;
    companyId: string;
    companyName?: string;
}

function getRegisteredUsers(): RegisteredUser[] {
    try {
        const raw = localStorage.getItem(REGISTERED_USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveRegisteredUser(user: RegisteredUser): void {
    const list = getRegisteredUsers();
    const idx = list.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (idx >= 0) list[idx] = user;
    else list.push(user);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
}

function setSessionFromLocalUser(user: Omit<User, "password">): void {
    setToken(LOCAL_TOKEN);
    localStorage.setItem("erp_session", JSON.stringify(user));
}

export async function initializeData(): Promise<void> {
    // No-op
}

/** Cadastro: tenta backend; se falhar, salva localmente. Quem se cadastra sempre tem acesso ao entrar. */
export async function register(data: {
    companyName?: string;
    companyCnpj?: string;
    name: string;
    email: string;
    password: string;
}): Promise<{ ok: boolean; error?: string }> {
    try {
        await fetch(AUTH_BASE + "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                companyName: data.companyName,
                companyCnpj: data.companyCnpj,
                name: data.name,
                email: data.email,
                password: data.password,
            }),
        }).then((r) => {
            if (!r.ok) throw new Error("Register failed");
        });
        return { ok: true };
    } catch {
        const list = getRegisteredUsers();
        if (list.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
            return { ok: false, error: "Este e-mail já está cadastrado." };
        }
        const id = "local-user-" + Date.now();
        const companyId = "local-company-" + Date.now();
        saveRegisteredUser({
            id,
            email: data.email.trim(),
            name: data.name.trim(),
            password: data.password,
            companyId,
            companyName: data.companyName?.trim(),
        });
        return { ok: true };
    }
}

/** Login: só entra quem já se cadastrou (backend ou cadastro local). */
export async function login(email: string, password: string): Promise<Omit<User, "password"> | null> {
    if (!email?.trim() || !password?.trim()) return null;

    try {
        const data = await fetchAPI<LoginResponse>(`${AUTH_BASE}/login`, {
            method: "POST",
            body: JSON.stringify({ email: email.trim(), password }),
        });
        setToken(data.token);
        localStorage.setItem("erp_session", JSON.stringify(data.user));
        return data.user;
    } catch {
        const list = getRegisteredUsers();
        const user = list.find((u) => u.email.toLowerCase() === email.trim());
        if (!user || user.password !== password) return null;
        const sessionUser: Omit<User, "password"> = {
            id: user.id,
            companyId: user.companyId,
            name: user.name,
            email: user.email,
            role: "admin",
        };
        setSessionFromLocalUser(sessionUser);
        return sessionUser;
    }
}

export function logout(): void {
    clearToken();
}

export function getSession(): Omit<User, "password"> | null {
    try {
        const token = getToken();
        if (!token) return null;
        const data = localStorage.getItem("erp_session");
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

export function canDelete(userRole: string): boolean {
    return userRole === "admin";
}

export function autoUpdateOverdueStatus(_companyId: string): void {
    // Handled server-side on every lancamento fetch
}

// ── Obras (com fallback em localStorage quando backend falha) ──
import { Obra, Lancamento, Cliente, Fornecedor, RelatorioSemanal, Medicao, ComentarioObra, Etapa, ListaCompra, Cotacao, NotaFiscal } from "@/types/erp";

const LOCAL_OBRAS_KEY = "erp_local_obras";

function getLocalObras(companyId: string): Obra[] {
    try {
        const raw = localStorage.getItem(LOCAL_OBRAS_KEY);
        const map: Record<string, Obra[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch {
        return [];
    }
}

function setLocalObras(companyId: string, list: Obra[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_OBRAS_KEY);
        const map: Record<string, Obra[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_OBRAS_KEY, JSON.stringify(map));
    } catch {
        // ignore storage errors
    }
}

export const obrasService = {
    async getAll(companyId: string): Promise<Obra[]> {
        try {
            return await fetchAPI<Obra[]>(`${API_BASE}/obras`);
        } catch {
            return getLocalObras(companyId);
        }
    },
    async getById(id: string, companyId: string): Promise<Obra | undefined> {
        try {
            return await fetchAPI<Obra>(`${API_BASE}/obras/${id}`);
        } catch {
            return getLocalObras(companyId).find((o) => o.id === id);
        }
    },
    async create(item: Partial<Obra> & { companyId: string }): Promise<Obra> {
        const companyId = item.companyId;
        try {
            return await fetchAPI<Obra>(`${API_BASE}/obras`, {
                method: "POST",
                body: JSON.stringify(item),
            });
        } catch {
            const id = "local-" + Date.now();
            const now = new Date().toISOString();
            const obra: Obra = {
                id,
                companyId,
                name: item.name ?? "",
                materialsCost: Number(item.materialsCost) ?? 0,
                laborCost: Number(item.laborCost) ?? 0,
                totalCost: Number(item.totalCost) ?? 0,
                progress: Number(item.progress) ?? 0,
                status: (item.status as Obra["status"]) ?? "Em andamento",
                client: item.client ?? undefined,
                address: item.address ?? undefined,
                cep: item.cep,
                number: item.number,
                complement: item.complement,
                startDate: item.startDate,
                endDate: item.endDate,
                description: item.description,
                imageUrl: item.imageUrl,
                createdAt: now,
                updatedAt: now,
            };
            const list = getLocalObras(companyId);
            list.unshift(obra);
            setLocalObras(companyId, list);
            return obra;
        }
    },
    async update(id: string, companyId: string, updates: Partial<Obra>): Promise<Obra | undefined> {
        try {
            return await fetchAPI<Obra>(`${API_BASE}/obras/${id}`, {
                method: "PUT",
                body: JSON.stringify(updates),
            });
        } catch {
            const list = getLocalObras(companyId);
            const idx = list.findIndex((o) => o.id === id);
            if (idx === -1) return undefined;
            list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
            setLocalObras(companyId, list);
            return list[idx];
        }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try {
            await fetchAPI(`${API_BASE}/obras/${id}`, { method: "DELETE" });
            return true;
        } catch {
            const list = getLocalObras(companyId).filter((o) => o.id !== id);
            setLocalObras(companyId, list);
            return true;
        }
    },
    async deleteWithValidation(id: string, companyId: string): Promise<boolean> {
        try {
            await fetchAPI(`${API_BASE}/obras/${id}`, { method: "DELETE" });
            return true;
        } catch {
            const list = getLocalObras(companyId).filter((o) => o.id !== id);
            setLocalObras(companyId, list);
            return true;
        }
    },
};

// ── Lançamentos (fallback localStorage quando backend falha) ──
const LOCAL_LANCAMENTOS_KEY = "erp_local_lancamentos";

function getLocalLancamentos(companyId: string): Lancamento[] {
    try {
        const raw = localStorage.getItem(LOCAL_LANCAMENTOS_KEY);
        const map: Record<string, Lancamento[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch { return []; }
}

function setLocalLancamentos(companyId: string, list: Lancamento[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_LANCAMENTOS_KEY);
        const map: Record<string, Lancamento[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_LANCAMENTOS_KEY, JSON.stringify(map));
    } catch { }
}

export const lancamentosService = {
    async getAll(companyId: string): Promise<Lancamento[]> {
        try {
            return await fetchAPI<Lancamento[]>(`${API_BASE}/lancamentos`);
        } catch {
            return getLocalLancamentos(companyId);
        }
    },
    async getById(id: string, companyId: string): Promise<Lancamento | undefined> {
        try {
            return await fetchAPI<Lancamento>(`${API_BASE}/lancamentos/${id}`);
        } catch {
            return getLocalLancamentos(companyId).find((l) => l.id === id);
        }
    },
    async create(item: any): Promise<Lancamento> {
        const companyId = item.companyId;
        try {
            return await fetchAPI<Lancamento>(`${API_BASE}/lancamentos`, { method: "POST", body: JSON.stringify(item) });
        } catch {
            const id = "local-lanc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
            const now = new Date().toISOString();
            const lancamento: Lancamento = {
                ...item,
                id,
                createdAt: now,
            };
            const list = getLocalLancamentos(companyId);
            list.unshift(lancamento);
            setLocalLancamentos(companyId, list);
            return lancamento;
        }
    },
    async update(id: string, companyId: string, updates: Partial<Lancamento>): Promise<Lancamento | undefined> {
        try {
            return await fetchAPI<Lancamento>(`${API_BASE}/lancamentos/${id}`, { method: "PUT", body: JSON.stringify(updates) });
        } catch {
            const list = getLocalLancamentos(companyId);
            const idx = list.findIndex((l) => l.id === id);
            if (idx === -1) return undefined;
            list[idx] = { ...list[idx], ...updates };
            setLocalLancamentos(companyId, list);
            return list[idx];
        }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try {
            await fetchAPI(`${API_BASE}/lancamentos/${id}`, { method: "DELETE" });
            return true;
        } catch {
            const list = getLocalLancamentos(companyId).filter((l) => l.id !== id);
            setLocalLancamentos(companyId, list);
            return true;
        }
    },
};

// ── Clientes (fallback localStorage quando backend falha) ──
const LOCAL_CLIENTES_KEY = "erp_local_clientes";

function getLocalClientes(companyId: string): Cliente[] {
    try {
        const raw = localStorage.getItem(LOCAL_CLIENTES_KEY);
        const map: Record<string, Cliente[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch {
        return [];
    }
}

function setLocalClientes(companyId: string, list: Cliente[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_CLIENTES_KEY);
        const map: Record<string, Cliente[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_CLIENTES_KEY, JSON.stringify(map));
    } catch {
        // ignore
    }
}

export const clientesService = {
    async getAll(companyId: string): Promise<Cliente[]> {
        try {
            return await fetchAPI<Cliente[]>(`${API_BASE}/clientes`);
        } catch {
            return getLocalClientes(companyId);
        }
    },
    async getById(id: string, companyId: string): Promise<Cliente | undefined> {
        try {
            return await fetchAPI<Cliente>(`${API_BASE}/clientes/${id}`);
        } catch {
            return getLocalClientes(companyId).find((c) => c.id === id);
        }
    },
    async create(item: Omit<Cliente, "id">): Promise<Cliente> {
        const companyId = item.companyId;
        try {
            return await fetchAPI<Cliente>(`${API_BASE}/clientes`, {
                method: "POST",
                body: JSON.stringify(item),
            });
        } catch {
            const id = "local-cli-" + Date.now();
            const cliente: Cliente = {
                ...item,
                id,
                telefone: item.telefone ?? "",
                email: item.email ?? "",
            };
            const list = getLocalClientes(companyId);
            list.unshift(cliente);
            setLocalClientes(companyId, list);
            return cliente;
        }
    },
    async update(id: string, companyId: string, updates: Partial<Cliente>): Promise<Cliente | undefined> {
        try {
            return await fetchAPI<Cliente>(`${API_BASE}/clientes/${id}`, {
                method: "PUT",
                body: JSON.stringify(updates),
            });
        } catch {
            const list = getLocalClientes(companyId);
            const idx = list.findIndex((c) => c.id === id);
            if (idx === -1) return undefined;
            list[idx] = { ...list[idx], ...updates };
            setLocalClientes(companyId, list);
            return list[idx];
        }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try {
            await fetchAPI(`${API_BASE}/clientes/${id}`, { method: "DELETE" });
            return true;
        } catch {
            const list = getLocalClientes(companyId).filter((c) => c.id !== id);
            setLocalClientes(companyId, list);
            return true;
        }
    },
};

// ── Fornecedores (fallback localStorage quando backend falha) ──
const LOCAL_FORNECEDORES_KEY = "erp_local_fornecedores";

function getLocalFornecedores(companyId: string): Fornecedor[] {
    try {
        const raw = localStorage.getItem(LOCAL_FORNECEDORES_KEY);
        const map: Record<string, Fornecedor[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch { return []; }
}

function setLocalFornecedores(companyId: string, list: Fornecedor[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_FORNECEDORES_KEY);
        const map: Record<string, Fornecedor[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_FORNECEDORES_KEY, JSON.stringify(map));
    } catch { }
}

export const fornecedoresService = {
    async getAll(companyId: string): Promise<Fornecedor[]> {
        try { return await fetchAPI<Fornecedor[]>(`${API_BASE}/fornecedores`); }
        catch { return getLocalFornecedores(companyId); }
    },
    async getById(id: string, companyId: string): Promise<Fornecedor | undefined> {
        try { return await fetchAPI<Fornecedor>(`${API_BASE}/fornecedores/${id}`); }
        catch { return getLocalFornecedores(companyId).find((f) => f.id === id); }
    },
    async create(item: any): Promise<Fornecedor> {
        const companyId = item.companyId;
        try {
            return await fetchAPI<Fornecedor>(`${API_BASE}/fornecedores`, { method: "POST", body: JSON.stringify(item) });
        } catch {
            const created: Fornecedor = { ...item, id: "local-forn-" + Date.now() };
            const list = getLocalFornecedores(companyId);
            list.unshift(created);
            setLocalFornecedores(companyId, list);
            return created;
        }
    },
    async update(id: string, companyId: string, updates: Partial<Fornecedor>): Promise<Fornecedor | undefined> {
        try {
            return await fetchAPI<Fornecedor>(`${API_BASE}/fornecedores/${id}`, { method: "PUT", body: JSON.stringify(updates) });
        } catch {
            const list = getLocalFornecedores(companyId);
            const idx = list.findIndex((f) => f.id === id);
            if (idx === -1) return undefined;
            list[idx] = { ...list[idx], ...updates };
            setLocalFornecedores(companyId, list);
            return list[idx];
        }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try {
            await fetchAPI(`${API_BASE}/fornecedores/${id}`, { method: "DELETE" });
            return true;
        } catch {
            const list = getLocalFornecedores(companyId).filter((f) => f.id !== id);
            setLocalFornecedores(companyId, list);
            return true;
        }
    },
    async deleteWithValidation(id: string, companyId: string): Promise<boolean> {
        return this.delete(id, companyId);
    },
};

// ── Relatórios Semanais (fallback localStorage quando backend falha) ─────
const LOCAL_RELATORIOS_KEY = "erp_local_relatorios";

function getLocalRelatorios(companyId: string): RelatorioSemanal[] {
    try {
        const raw = localStorage.getItem(LOCAL_RELATORIOS_KEY);
        const map: Record<string, RelatorioSemanal[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch { return []; }
}

function setLocalRelatorios(companyId: string, list: RelatorioSemanal[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_RELATORIOS_KEY);
        const map: Record<string, RelatorioSemanal[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_RELATORIOS_KEY, JSON.stringify(map));
    } catch { }
}

export const relatoriosService = {
    async getAll(companyId: string): Promise<RelatorioSemanal[]> {
        try { return await fetchAPI<RelatorioSemanal[]>(`${API_BASE}/relatorios`); }
        catch { return getLocalRelatorios(companyId); }
    },
    async getById(id: string, companyId: string): Promise<RelatorioSemanal | undefined> {
        try { return await fetchAPI<RelatorioSemanal>(`${API_BASE}/relatorios/${id}`); }
        catch { return getLocalRelatorios(companyId).find((r) => r.id === id); }
    },
    async create(item: any): Promise<RelatorioSemanal> {
        const companyId = item.companyId;
        try { return await fetchAPI<RelatorioSemanal>(`${API_BASE}/relatorios`, { method: "POST", body: JSON.stringify(item) }); }
        catch {
            const created: RelatorioSemanal = { ...item, id: "local-rel-" + Date.now(), createdAt: new Date().toISOString() };
            const list = getLocalRelatorios(companyId);
            list.unshift(created);
            setLocalRelatorios(companyId, list);
            return created;
        }
    },
    async update(id: string, _companyId: string, updates: Partial<RelatorioSemanal>): Promise<RelatorioSemanal | undefined> {
        try { return await fetchAPI<RelatorioSemanal>(`${API_BASE}/relatorios/${id}`, { method: "PUT", body: JSON.stringify(updates) }); }
        catch { return undefined; }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try { await fetchAPI(`${API_BASE}/relatorios/${id}`, { method: "DELETE" }); return true; }
        catch {
            const list = getLocalRelatorios(companyId).filter((r) => r.id !== id);
            setLocalRelatorios(companyId, list);
            return true;
        }
    },
    async getByObra(obraId: string, companyId: string): Promise<RelatorioSemanal[]> {
        try { return await fetchAPI<RelatorioSemanal[]>(`${API_BASE}/relatorios?obraId=${obraId}`); }
        catch { return getLocalRelatorios(companyId).filter((r) => !obraId || r.obraId === obraId); }
    },
    hasWeekConflict(_obraId: string, _companyId: string, _semanaInicio: string, _semanaFim: string, _excludeId?: string): boolean {
        return false;
    },
    async createWithValidation(item: any): Promise<RelatorioSemanal> {
        return this.create(item);
    },
};

// ── Medições (fallback localStorage quando backend falha) ─────────────────
const LOCAL_MEDICOES_KEY = "erp_local_medicoes";

function getLocalMedicoes(companyId: string): Medicao[] {
    try {
        const raw = localStorage.getItem(LOCAL_MEDICOES_KEY);
        const map: Record<string, Medicao[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch { return []; }
}

function setLocalMedicoes(companyId: string, list: Medicao[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_MEDICOES_KEY);
        const map: Record<string, Medicao[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_MEDICOES_KEY, JSON.stringify(map));
    } catch { }
}

export const medicoesService = {
    async getAll(companyId: string): Promise<Medicao[]> {
        try { return await fetchAPI<Medicao[]>(`${API_BASE}/medicoes`); }
        catch { return getLocalMedicoes(companyId); }
    },
    async getById(id: string, companyId: string): Promise<Medicao | undefined> {
        try { return await fetchAPI<Medicao>(`${API_BASE}/medicoes/${id}`); }
        catch { return getLocalMedicoes(companyId).find((m) => m.id === id); }
    },
    async create(item: any): Promise<Medicao> {
        const companyId = item.companyId;
        try { return await fetchAPI<Medicao>(`${API_BASE}/medicoes`, { method: "POST", body: JSON.stringify(item) }); }
        catch {
            const created: Medicao = { ...item, id: "local-med-" + Date.now(), createdAt: new Date().toISOString() };
            const list = getLocalMedicoes(companyId);
            list.unshift(created);
            setLocalMedicoes(companyId, list);
            return created;
        }
    },
    async update(id: string, companyId: string, updates: Partial<Medicao>): Promise<Medicao | undefined> {
        try { return await fetchAPI<Medicao>(`${API_BASE}/medicoes/${id}`, { method: "PUT", body: JSON.stringify(updates) }); }
        catch {
            const list = getLocalMedicoes(companyId);
            const idx = list.findIndex((m) => m.id === id);
            if (idx === -1) return undefined;
            list[idx] = { ...list[idx], ...updates };
            setLocalMedicoes(companyId, list);
            return list[idx];
        }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try { await fetchAPI(`${API_BASE}/medicoes/${id}`, { method: "DELETE" }); return true; }
        catch {
            const list = getLocalMedicoes(companyId).filter((m) => m.id !== id);
            setLocalMedicoes(companyId, list);
            return true;
        }
    },
    async getByObra(obraId: string, companyId: string): Promise<Medicao[]> {
        try { return await fetchAPI<Medicao[]>(`${API_BASE}/medicoes?obraId=${obraId}`); }
        catch { return getLocalMedicoes(companyId).filter((m) => !obraId || m.obraId === obraId); }
    },
    async aprovarMedicao(id: string, companyId: string): Promise<Medicao | undefined> {
        try { return await fetchAPI<Medicao>(`${API_BASE}/medicoes/${id}/aprovar`, { method: "POST" }); }
        catch { return this.update(id, companyId, { status: "Aprovado" }); }
    },
    async pagarMedicao(id: string, companyId: string): Promise<{ medicao: Medicao; lancamento: Lancamento } | undefined> {
        try { return await fetchAPI(`${API_BASE}/medicoes/${id}/pagar`, { method: "POST" }); }
        catch {
            const medicao = await this.update(id, companyId, { status: "Pago" });
            return medicao ? { medicao, lancamento: {} as Lancamento } : undefined;
        }
    },
};

// ── Comentários (fallback localStorage quando backend falha) ──────────────
const LOCAL_COMENTARIOS_KEY = "erp_local_comentarios";

function getLocalComentarios(companyId: string): ComentarioObra[] {
    try {
        const raw = localStorage.getItem(LOCAL_COMENTARIOS_KEY);
        const map: Record<string, ComentarioObra[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch { return []; }
}

function setLocalComentarios(companyId: string, list: ComentarioObra[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_COMENTARIOS_KEY);
        const map: Record<string, ComentarioObra[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_COMENTARIOS_KEY, JSON.stringify(map));
    } catch { }
}

export const comentariosService = {
    async getAll(companyId: string): Promise<ComentarioObra[]> {
        try { return await fetchAPI<ComentarioObra[]>(`${API_BASE}/comentarios`); }
        catch { return getLocalComentarios(companyId); }
    },
    async getById(id: string, companyId: string): Promise<ComentarioObra | undefined> {
        try { return await fetchAPI<ComentarioObra>(`${API_BASE}/comentarios/${id}`); }
        catch { return getLocalComentarios(companyId).find((c) => c.id === id); }
    },
    async create(item: any): Promise<ComentarioObra> {
        const companyId = item.companyId;
        try { return await fetchAPI<ComentarioObra>(`${API_BASE}/comentarios`, { method: "POST", body: JSON.stringify(item) }); }
        catch {
            const created: ComentarioObra = { ...item, id: "local-com-" + Date.now() };
            const list = getLocalComentarios(companyId);
            list.unshift(created);
            setLocalComentarios(companyId, list);
            return created;
        }
    },
    async update(id: string, companyId: string, updates: Partial<ComentarioObra>): Promise<ComentarioObra | undefined> {
        try { return await fetchAPI<ComentarioObra>(`${API_BASE}/comentarios/${id}`, { method: "PUT", body: JSON.stringify(updates) }); }
        catch {
            const list = getLocalComentarios(companyId);
            const idx = list.findIndex((c) => c.id === id);
            if (idx === -1) return undefined;
            list[idx] = { ...list[idx], ...updates };
            setLocalComentarios(companyId, list);
            return list[idx];
        }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try { await fetchAPI(`${API_BASE}/comentarios/${id}`, { method: "DELETE" }); return true; }
        catch {
            const list = getLocalComentarios(companyId).filter((c) => c.id !== id);
            setLocalComentarios(companyId, list);
            return true;
        }
    },
    async getByObra(obraId: string, companyId: string): Promise<ComentarioObra[]> {
        try { return await fetchAPI<ComentarioObra[]>(`${API_BASE}/comentarios?obraId=${obraId}`); }
        catch { return getLocalComentarios(companyId).filter((c) => (!obraId || c.obraId === obraId) && !c.oculto); }
    },
    async getAllByObra(obraId: string, companyId: string): Promise<ComentarioObra[]> {
        try { return await fetchAPI<ComentarioObra[]>(`${API_BASE}/comentarios?obraId=${obraId}&includeHidden=true`); }
        catch { return getLocalComentarios(companyId).filter((c) => c.obraId === obraId); }
    },
    async softDelete(id: string, companyId: string): Promise<ComentarioObra | undefined> {
        try { return await fetchAPI<ComentarioObra>(`${API_BASE}/comentarios/${id}/ocultar`, { method: "POST" }); }
        catch { return this.update(id, companyId, { oculto: true }); }
    },
    async createComment(item: any): Promise<ComentarioObra> {
        return this.create(item);
    },
};

// ── Financeiro Executivo (fallback para não gerar 404) ─────
export const financeiroExecutivoService = {
    async calcularResumo(obraId: string, _companyId: string) {
        try { return await fetchAPI(`${API_BASE}/financeiro/resumo?obraId=${obraId}`); }
        catch { return null; }
    },
    async filtrarPorPeriodo(obraId: string, _companyId: string, inicio: string, fim: string): Promise<Lancamento[]> {
        try { return await fetchAPI<Lancamento[]>(`${API_BASE}/financeiro/periodo?obraId=${obraId}&inicio=${inicio}&fim=${fim}`); }
        catch { return []; }
    },
    async calcularDesvio(obraId: string, _companyId: string) {
        try { return await fetchAPI(`${API_BASE}/financeiro/desvio?obraId=${obraId}`); }
        catch { return null; }
    },
    async calcularFluxoCaixaFuturo(obraId: string, _companyId: string) {
        try { return await fetchAPI(`${API_BASE}/financeiro/fluxo-caixa?obraId=${obraId}`); }
        catch { return null; }
    },
};

// ── Etapas (fallback localStorage quando backend falha) ───────────
const LOCAL_ETAPAS_KEY = "erp_local_etapas";

function getLocalEtapas(companyId: string): Etapa[] {
    try {
        const raw = localStorage.getItem(LOCAL_ETAPAS_KEY);
        const map: Record<string, Etapa[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch { return []; }
}

function setLocalEtapas(companyId: string, list: Etapa[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_ETAPAS_KEY);
        const map: Record<string, Etapa[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_ETAPAS_KEY, JSON.stringify(map));
    } catch { }
}

export const etapasService = {
    async getAll(companyId: string): Promise<Etapa[]> {
        try { return await fetchAPI<Etapa[]>(`${API_BASE}/etapas`); }
        catch { return getLocalEtapas(companyId); }
    },
    async getById(id: string, companyId: string): Promise<Etapa | undefined> {
        try { return await fetchAPI<Etapa>(`${API_BASE}/etapas/${id}`); }
        catch { return getLocalEtapas(companyId).find((e) => e.id === id); }
    },
    async create(item: any): Promise<Etapa> {
        const companyId = item.companyId;
        try { return await fetchAPI<Etapa>(`${API_BASE}/etapas`, { method: "POST", body: JSON.stringify(item) }); }
        catch {
            const created: Etapa = { ...item, id: "local-etapa-" + Date.now(), createdAt: new Date().toISOString() };
            const list = getLocalEtapas(companyId);
            list.unshift(created);
            setLocalEtapas(companyId, list);
            return created;
        }
    },
    async update(id: string, companyId: string, updates: Partial<Etapa>): Promise<Etapa | undefined> {
        try { return await fetchAPI<Etapa>(`${API_BASE}/etapas/${id}`, { method: "PUT", body: JSON.stringify(updates) }); }
        catch {
            const list = getLocalEtapas(companyId);
            const idx = list.findIndex((e) => e.id === id);
            if (idx === -1) return undefined;
            list[idx] = { ...list[idx], ...updates };
            setLocalEtapas(companyId, list);
            return list[idx];
        }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try { await fetchAPI(`${API_BASE}/etapas/${id}`, { method: "DELETE" }); return true; }
        catch {
            const list = getLocalEtapas(companyId).filter((e) => e.id !== id);
            setLocalEtapas(companyId, list);
            return true;
        }
    },
    async getByObra(obraId: string, companyId: string): Promise<Etapa[]> {
        try { return await fetchAPI<Etapa[]>(`${API_BASE}/etapas?obraId=${obraId}`); }
        catch { return getLocalEtapas(companyId).filter((e) => !obraId || e.obraId === obraId); }
    },
    async somaPercentualPrevisto(obraId: string, companyId: string, excludeId?: string): Promise<number> {
        try {
            const result = await fetchAPI<{ soma: number }>(`${API_BASE}/etapas/soma-percentual?obraId=${obraId}${excludeId ? `&excludeId=${excludeId}` : ""}`);
            return result.soma;
        } catch {
            const list = getLocalEtapas(companyId).filter((e) => e.obraId === obraId && e.id !== excludeId);
            return list.reduce((acc, e) => acc + (e.percentualPrevisto || 0), 0);
        }
    },
    async createWithValidation(item: any): Promise<Etapa> {
        return this.create(item);
    },
    async updateWithValidation(id: string, companyId: string, updates: Partial<Etapa>): Promise<Etapa | undefined> {
        return this.update(id, companyId, updates);
    },
    async deleteWithValidation(id: string, companyId: string): Promise<boolean> {
        return this.delete(id, companyId);
    },
    recalcularProgressoObra(_obraId: string, _companyId: string): void { },
    async verificarAtraso(obraId: string, companyId: string): Promise<Etapa[]> {
        const all = await this.getByObra(obraId, companyId);
        const today = new Date().toISOString().split("T")[0];
        return all.filter((e) => e.dataFim < today && e.percentualExecutado < 100);
    },
};

// ── Lista de Compras (fallback localStorage quando backend falha) ─────────
const LOCAL_LISTACOMPRAS_KEY = "erp_local_listacompras";

function getLocalListaCompras(companyId: string): ListaCompra[] {
    try {
        const raw = localStorage.getItem(LOCAL_LISTACOMPRAS_KEY);
        const map: Record<string, ListaCompra[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch { return []; }
}

function setLocalListaCompras(companyId: string, list: ListaCompra[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_LISTACOMPRAS_KEY);
        const map: Record<string, ListaCompra[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_LISTACOMPRAS_KEY, JSON.stringify(map));
    } catch { }
}

export const listaComprasService = {
    async getAll(companyId: string): Promise<ListaCompra[]> {
        try { return await fetchAPI<ListaCompra[]>(`${API_BASE}/lista-compras`); }
        catch { return getLocalListaCompras(companyId); }
    },
    async getById(id: string, companyId: string): Promise<ListaCompra | undefined> {
        try { return await fetchAPI<ListaCompra>(`${API_BASE}/lista-compras/${id}`); }
        catch { return getLocalListaCompras(companyId).find((c) => c.id === id); }
    },
    async create(item: any): Promise<ListaCompra> {
        const companyId = item.companyId;
        try { return await fetchAPI<ListaCompra>(`${API_BASE}/lista-compras`, { method: "POST", body: JSON.stringify(item) }); }
        catch {
            const created: ListaCompra = { ...item, id: "local-lc-" + Date.now(), createdAt: new Date().toISOString() };
            const list = getLocalListaCompras(companyId);
            list.unshift(created);
            setLocalListaCompras(companyId, list);
            return created;
        }
    },
    async update(id: string, companyId: string, updates: Partial<ListaCompra>): Promise<ListaCompra | undefined> {
        try { return await fetchAPI<ListaCompra>(`${API_BASE}/lista-compras/${id}`, { method: "PUT", body: JSON.stringify(updates) }); }
        catch {
            const list = getLocalListaCompras(companyId);
            const idx = list.findIndex((c) => c.id === id);
            if (idx === -1) return undefined;
            list[idx] = { ...list[idx], ...updates };
            setLocalListaCompras(companyId, list);
            return list[idx];
        }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try { await fetchAPI(`${API_BASE}/lista-compras/${id}`, { method: "DELETE" }); return true; }
        catch {
            const list = getLocalListaCompras(companyId).filter((c) => c.id !== id);
            setLocalListaCompras(companyId, list);
            return true;
        }
    },
    async getByObra(obraId: string, companyId: string): Promise<ListaCompra[]> {
        try { return await fetchAPI<ListaCompra[]>(`${API_BASE}/lista-compras?obraId=${obraId}`); }
        catch { return getLocalListaCompras(companyId).filter((c) => !obraId || c.obraId === obraId); }
    },
    async projecaoDesembolso(obraId: string, _companyId: string) {
        try { return await fetchAPI(`${API_BASE}/lista-compras/projecao?obraId=${obraId}`); }
        catch { return null; }
    },
    async marcarComprado(id: string, companyId: string): Promise<ListaCompra | undefined> {
        try { return await fetchAPI<ListaCompra>(`${API_BASE}/lista-compras/${id}/comprado`, { method: "POST" }); }
        catch { return this.update(id, companyId, { status: "Comprado" }); }
    },
    async getComprasFuturas(obraId: string, companyId: string): Promise<ListaCompra[]> {
        const all = await this.getByObra(obraId, companyId);
        const today = new Date().toISOString().split("T")[0];
        return all.filter((c) => c.status === "Planejado" && c.dataPrevista >= today);
    },
};

// ── Cotações (fallback para não gerar 404) ─────────────────
// ── Cotações (fallback localStorage quando backend falha) ─────────────────
const LOCAL_COTACOES_KEY = "erp_local_cotacoes";

function getLocalCotacoes(companyId: string): Cotacao[] {
    try {
        const raw = localStorage.getItem(LOCAL_COTACOES_KEY);
        const map: Record<string, Cotacao[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch { return []; }
}

function setLocalCotacoes(companyId: string, list: Cotacao[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_COTACOES_KEY);
        const map: Record<string, Cotacao[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_COTACOES_KEY, JSON.stringify(map));
    } catch { }
}

export const cotacoesService = {
    async getAll(companyId: string): Promise<Cotacao[]> {
        try { return await fetchAPI<Cotacao[]>(`${API_BASE}/cotacoes`); }
        catch { return getLocalCotacoes(companyId); }
    },
    async getById(id: string, companyId: string): Promise<Cotacao | undefined> {
        try { return await fetchAPI<Cotacao>(`${API_BASE}/cotacoes/${id}`); }
        catch { return getLocalCotacoes(companyId).find((c) => c.id === id); }
    },
    async create(item: any): Promise<Cotacao> {
        const companyId = item.companyId;
        try { return await fetchAPI<Cotacao>(`${API_BASE}/cotacoes`, { method: "POST", body: JSON.stringify(item) }); }
        catch {
            const created: Cotacao = { ...item, id: "local-cot-" + Date.now() };
            const list = getLocalCotacoes(companyId);
            list.unshift(created);
            setLocalCotacoes(companyId, list);
            return created;
        }
    },
    async update(id: string, companyId: string, updates: Partial<Cotacao>): Promise<Cotacao | undefined> {
        try { return await fetchAPI<Cotacao>(`${API_BASE}/cotacoes/${id}`, { method: "PUT", body: JSON.stringify(updates) }); }
        catch {
            const list = getLocalCotacoes(companyId);
            const idx = list.findIndex((c) => c.id === id);
            if (idx === -1) return undefined;
            list[idx] = { ...list[idx], ...updates };
            setLocalCotacoes(companyId, list);
            return list[idx];
        }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try { await fetchAPI(`${API_BASE}/cotacoes/${id}`, { method: "DELETE" }); return true; }
        catch {
            const list = getLocalCotacoes(companyId).filter((c) => c.id !== id);
            setLocalCotacoes(companyId, list);
            return true;
        }
    },
    async getByObra(obraId: string, companyId: string): Promise<Cotacao[]> {
        try { return await fetchAPI<Cotacao[]>(`${API_BASE}/cotacoes?obraId=${obraId}`); }
        catch { return getLocalCotacoes(companyId).filter((c) => !obraId || c.obraId === obraId); }
    },
    async getByDescricao(obraId: string, companyId: string, descricao: string): Promise<Cotacao[]> {
        const all = await this.getByObra(obraId, companyId);
        return all.filter((c) => c.descricao.toLowerCase() === descricao.toLowerCase()).sort((a, b) => a.valor - b.valor);
    },
    async aprovarCotacao(id: string, companyId: string) {
        try { return await fetchAPI(`${API_BASE}/cotacoes/${id}/aprovar`, { method: "POST" }); }
        catch {
            const item = await this.getById(id, companyId);
            if (item) {
                await this.update(id, companyId, { status: "Aprovado" });
                // Note: lancamento creation would happen here in a real backend, but locally we just update status
            }
            return undefined;
        }
    },
    async rejeitarCotacao(id: string, companyId: string): Promise<Cotacao | undefined> {
        try { return await fetchAPI<Cotacao>(`${API_BASE}/cotacoes/${id}/rejeitar`, { method: "POST" }); }
        catch { return this.update(id, companyId, { status: "Rejeitado" }); }
    },
    async receberCotacao(id: string, companyId: string, valor: number): Promise<Cotacao | undefined> {
        try { return await fetchAPI<Cotacao>(`${API_BASE}/cotacoes/${id}/receber`, { method: "POST", body: JSON.stringify({ valor }) }); }
        catch { return this.update(id, companyId, { valor, status: "Recebido" }); }
    },
};

// ── Notas Fiscais (fallback localStorage quando backend falha) ──────────
const LOCAL_NOTASFISCAIS_KEY = "erp_local_notasfiscais";

function getLocalNotasFiscais(companyId: string): NotaFiscal[] {
    try {
        const raw = localStorage.getItem(LOCAL_NOTASFISCAIS_KEY);
        const map: Record<string, NotaFiscal[]> = raw ? JSON.parse(raw) : {};
        return map[companyId] || [];
    } catch { return []; }
}

function setLocalNotasFiscais(companyId: string, list: NotaFiscal[]): void {
    try {
        const raw = localStorage.getItem(LOCAL_NOTASFISCAIS_KEY);
        const map: Record<string, NotaFiscal[]> = raw ? JSON.parse(raw) : {};
        map[companyId] = list;
        localStorage.setItem(LOCAL_NOTASFISCAIS_KEY, JSON.stringify(map));
    } catch { }
}

export const notasFiscaisService = {
    async getAll(companyId: string): Promise<NotaFiscal[]> {
        try { return await fetchAPI<NotaFiscal[]>(`${API_BASE}/notas-fiscais`); }
        catch { return getLocalNotasFiscais(companyId); }
    },
    async getById(id: string, companyId: string): Promise<NotaFiscal | undefined> {
        try { return await fetchAPI<NotaFiscal>(`${API_BASE}/notas-fiscais/${id}`); }
        catch { return getLocalNotasFiscais(companyId).find((n) => n.id === id); }
    },
    async create(item: any): Promise<NotaFiscal> {
        const companyId = item.companyId;
        try { return await fetchAPI<NotaFiscal>(`${API_BASE}/notas-fiscais`, { method: "POST", body: JSON.stringify(item) }); }
        catch {
            const created: NotaFiscal = { ...item, id: "local-nf-" + Date.now(), createdAt: new Date().toISOString() };
            const list = getLocalNotasFiscais(companyId);
            list.unshift(created);
            setLocalNotasFiscais(companyId, list);
            return created;
        }
    },
    async update(id: string, companyId: string, updates: Partial<NotaFiscal>): Promise<NotaFiscal | undefined> {
        try { return await fetchAPI<NotaFiscal>(`${API_BASE}/notas-fiscais/${id}`, { method: "PUT", body: JSON.stringify(updates) }); }
        catch {
            const list = getLocalNotasFiscais(companyId);
            const idx = list.findIndex((n) => n.id === id);
            if (idx === -1) return undefined;
            list[idx] = { ...list[idx], ...updates };
            setLocalNotasFiscais(companyId, list);
            return list[idx];
        }
    },
    async delete(id: string, companyId: string): Promise<boolean> {
        try { await fetchAPI(`${API_BASE}/notas-fiscais/${id}`, { method: "DELETE" }); return true; }
        catch {
            const list = getLocalNotasFiscais(companyId).filter((n) => n.id !== id);
            setLocalNotasFiscais(companyId, list);
            return true;
        }
    },
    async getByObra(obraId: string, companyId: string): Promise<NotaFiscal[]> {
        try { return await fetchAPI<NotaFiscal[]>(`${API_BASE}/notas-fiscais?obraId=${obraId}`); }
        catch { return getLocalNotasFiscais(companyId).filter((n) => !obraId || n.obraId === obraId); }
    },
    async filtrarPorPeriodo(obraId: string, companyId: string, inicio: string, fim: string): Promise<NotaFiscal[]> {
        const all = await this.getByObra(obraId, companyId);
        return all.filter((n) => n.dataEmissao >= inicio && n.dataEmissao <= fim);
    },
    async createWithValidation(item: any): Promise<NotaFiscal> {
        return this.create(item);
    },
};

// ── Alertas ──────────────────────────────────────────────
export interface Alerta {
    tipo: "etapa" | "compra" | "atraso" | "desvio" | "medicao" | "obra";
    titulo: string;
    descricao: string;
    severidade: "info" | "warning" | "critical";
}

export const alertasService = {
    async gerarAlertas(obraId: string, _companyId: string): Promise<Alerta[]> {
        try { return await fetchAPI<Alerta[]>(`${API_BASE}/alertas?obraId=${obraId}`); }
        catch { return []; }
    },
};

// ── Relatório Gerencial ──────────────────────────────────
export const relatorioGerencialService = {
    async gerarRelatorio(obraId: string, _companyId: string) {
        try { return await fetchAPI(`${API_BASE}/relatorio-gerencial?obraId=${obraId}`); }
        catch { return null; }
    },
};

// ── Activity Log ─────────────────────────────────────────
import { ActivityLog } from "@/types/erp";

export const activityLogService = {
    async create(log: Omit<ActivityLog, "id" | "timestamp" | "companyId">): Promise<void> {
        try {
            await fetchAPI(`${API_BASE}/activity-log`, { method: "POST", body: JSON.stringify(log) });
        } catch {
            // Backend pode não ter rota; não quebrar nem poluir console
        }
    },
    async getAll(_companyId: string): Promise<ActivityLog[]> {
        try {
            return await fetchAPI<ActivityLog[]>(`${API_BASE}/activity-log`);
        } catch {
            return [];
        }
    }
};

// ── Users ────────────────────────────────────────────────
import { UserObra } from "@/types/erp";

export const usersService = {
    async getAll(companyId: string): Promise<User[]> {
        try {
            return await fetchAPI<User[]>(`${API_BASE}/users`);
        } catch {
            return [];
        }
    },
    async getById(id: string, companyId: string): Promise<User | undefined> {
        try {
            return await fetchAPI<User>(`${API_BASE}/users/${id}`);
        } catch { return undefined; }
    },
    async create(item: any): Promise<User> {
        try {
            return await fetchAPI<User>(`${API_BASE}/users`, { method: "POST", body: JSON.stringify(item) });
        } catch {
            return { ...item, id: "local-user-" + Date.now() } as User;
        }
    },
    async update(id: string, _companyId: string, updates: Partial<User>): Promise<User | undefined> {
        try {
            return await fetchAPI<User>(`${API_BASE}/users/${id}`, { method: "PUT", body: JSON.stringify(updates) });
        } catch { return undefined; }
    },
    async delete(id: string, _companyId: string): Promise<boolean> {
        try {
            await fetchAPI(`${API_BASE}/users/${id}`, { method: "DELETE" });
            return true;
        } catch { return false; }
    },
    async getByObra(obraId: string, companyId: string): Promise<User[]> {
        const all = await this.getAll(companyId);
        return all.filter((u: User & { obraId?: string }) => u.obraId === obraId || u.role === "admin");
    }
};
