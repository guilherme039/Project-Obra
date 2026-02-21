// No import needed for fetch in Node 18+
const BASE_URL = "http://localhost:3001";

async function test() {
    console.log("🚀 Testing Obra Creation (v2)...");

    // 1. Login
    console.log("🔑 Logging in...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@erp.com", password: "admin123" }),
    });

    if (!loginRes.ok) {
        const txt = await loginRes.text();
        console.error("❌ Login failed:", loginRes.status, txt);
        return;
    }

    const loginData = await loginRes.json() as any;
    const token = loginData.token;
    console.log("✅ Login success. Token:", token.substring(0, 20) + "...");

    // 2. Create Obra
    console.log("📝 Creating Obra...");
    const payload = {
        nome: "Obra Teste Script",
        cliente: "Cliente Teste",
        endereco: "Rua Exemplo, 123",
        dataInicio: "2023-01-01",
        dataPrevisaoTermino: "2023-12-31",
        orcamentoTotal: 100000,
        orcamentoMateriais: 50000,
        orcamentoEmpreiteira: 50000,
        progresso: 0,
        status: "Em andamento"
    };

    const res = await fetch(`${BASE_URL}/api/obras`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        const data = await res.json();
        console.log("✅ Obra created successfully:", data);
    } else {
        console.error("❌ Failed to create Obra:", res.status, res.statusText);
        const err = await res.text();
        console.error("Error body:", err);
    }
}

test().catch(console.error);
