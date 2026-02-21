import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "erp-secret-key-change-in-production";

export interface AuthPayload {
    userId: string;
    companyId: string;
    email: string;
    role: string;
    name: string;
}

declare global {
    namespace Express {
        interface Request {
            auth?: AuthPayload;
        }
    }
}

export function generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token não fornecido." });
        return;
    }

    try {
        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
        req.auth = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Token inválido ou expirado." });
    }
}
