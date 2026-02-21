import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const API_URL = "http://localhost:3001";

describe("Authentication", () => {
  let testUserId: string;
  let testCompanyId: string;
  let authToken: string;

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
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.user.deleteMany({ where: { companyId: testCompanyId } });
    await prisma.company.delete({ where: { id: testCompanyId } });
    await prisma.$disconnect();
  });

  it("should login with valid credentials", async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@test.com",
        password: "test123"
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe("test@test.com");
    authToken = data.token;
  });

  it("should reject login with invalid credentials", async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@test.com",
        password: "wrongpassword"
      })
    });

    expect(response.status).toBe(401);
  });

  it("should validate email format", async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
        password: "test123"
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Dados inválidos");
  });

  it("should require authentication for protected routes", async () => {
    const response = await fetch(`${API_URL}/api/obras`, {
      method: "GET"
    });

    expect(response.status).toBe(401);
  });

  it("should access protected routes with valid token", async () => {
    const response = await fetch(`${API_URL}/api/obras`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
  });
});
