import prisma from "./prisma";

async function check() {
    console.log("🔍 Checking users inside DB...");
    try {
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ${u.email} (Role: ${u.role}, ID: ${u.id})`);
            console.log(`  Password Hash: ${u.password.substring(0, 20)}...`);
        });
    } catch (e) {
        console.error("Error reading users:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
