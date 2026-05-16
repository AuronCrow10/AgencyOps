import type { Request, Response } from 'express';
import { loginSchema, registerSchema } from '@agencyops/shared';
import { refreshCookieName, setAuthCookies, clearAuthCookies } from './session.js';
import { AuthService } from './auth.service.js';

const authService = new AuthService();

export class AuthController {
  register = async (request: Request, response: Response) => {
    const payload = registerSchema.parse(request.body);
    const result = await authService.register(payload);
    setAuthCookies(response, result.accessPayload, result.refreshPayload);

    response.status(201).json({
      user: result.user
    });
  };

  login = async (request: Request, response: Response) => {
    const payload = loginSchema.parse(request.body);
    const result = await authService.login(payload);
    setAuthCookies(response, result.accessPayload, result.refreshPayload);

    response.json({
      user: result.user
    });
  };

  refresh = async (request: Request, response: Response) => {
    const refreshToken = request.signedCookies?.[refreshCookieName] as string | undefined;
    const result = await authService.refresh(refreshToken ?? '');
    setAuthCookies(response, result.accessPayload, result.refreshPayload);

    response.json({
      user: result.user
    });
  };

  logout = async (request: Request, response: Response) => {
    const refreshToken = request.signedCookies?.[refreshCookieName] as string | undefined;
    await authService.logout(refreshToken);
    clearAuthCookies(response);
    response.status(204).send();
  };

  me = async (request: Request, response: Response) => {
    const user = await authService.getCurrentUser(request.auth!.userId);
    response.json({ user });
  };
}
