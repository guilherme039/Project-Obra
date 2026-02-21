import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissão insuficiente.' 
      });
    }

    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
}
