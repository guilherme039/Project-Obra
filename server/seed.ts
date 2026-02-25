import prisma from "./prisma.js";
import bcrypt from "bcryptjs";

async function seed() {
    console.log("🌱 Seeding database...");

    const company = await prisma.company.create({
        data: {
            name: "Construtora Principal",
            cnpj: "12.345.678/0001-90",
        },
    });

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.create({
        data: {
            companyId: company.id,
            name: "Administrador",
            email: "admin@erp.com",
            password: hashedPassword,
            role: "admin",
        },
    });

    console.log("✅ Seed complete!");
    console.log("   Company:", company.name);
    console.log("   Login: admin@erp.com / admin123");
}

seed()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
