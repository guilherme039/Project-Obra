import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const API_URL = "http://localhost:3001";

describe("Obras CRUD", () => {
  let testUserId: string;
  let testCompanyId: string;
  let authToken: string;
  let obraId: string;

  beforeAll(async () => {
    // Criar empresa de teste
    const company = await prisma.company.create({
      data: {
        name: "Test Company",
        cnpj: "11.111.111/0001-11"
      }
    });
    testCompanyId = company.id;

    // Criar usuário de teste
    const hashedPassword = await bcrypt.hash("test123", 10);
    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@test.com",
        password: hashedPassword,
        companyId: testCompanyId
      }
    });
    testUserId = user.id;

    // Login para obter token
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@test.com",
        password: "test123"
      })
    });
    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.obra.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.user.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.company.delete({ where: { id: testCompanyId } });
    await prisma.$disconnect();
  });

  it("should create a new obra", async () => {
    const response = await fetch(`${API_URL}/api/obras`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: "Test Obra",
        materialsCost: 10000,
        laborCost: 5000,
        totalCost: 15000,
        progress: 0,
        status: "Em andamento"
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe("Test Obra");
    expect(data.totalCost).toBe(15000);
    obraId = data.id;
  });

  it("should validate obra data", async () => {
    const response = await fetch(`${API_URL}/api/obras`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: "",
        progress: 150 // Invalid: > 100
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Dados inválidos");
  });

  it("should get obra by id", async () => {
    const response = await fetch(`${API_URL}/api/obras/${obraId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(obraId);
    expect(data.name).toBe("Test Obra");
  });

  it("should update obra", async () => {
    const response = await fetch(`${API_URL}/api/obras/${obraId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        progress: 50,
        status: "Em andamento"
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.progress).toBe(50);
  });

  it("should delete obra", async () => {
    const response = await fetch(`${API_URL}/api/obras/${obraId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
  });

  it("should return paginated results", async () => {
    // Criar múltiplas obras
    for (let i = 0; i < 5; i++) {
      await prisma.obra.create({
        data: {
          name: `Obra ${i}`,
          companyId: testCompanyId,
          totalCost: 10000,
          progress: 0,
          status: "Em andamento"
        }
      });
    }

    const response = await fetch(`${API_URL}/api/obras?page=1&limit=2`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveLength(2);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(2);
    expect(data.pagination.total).toBeGreaterThanOrEqual(5);
  });
});
