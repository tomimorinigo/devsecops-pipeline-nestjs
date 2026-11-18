import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './login.dto.js';
import {
  type AuthenticatedRequest,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from './session.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.auth.login(dto.email, dto.password);
    res.cookie(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    return { status: 'ok' };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[SESSION_COOKIE] as string | undefined);
    const { maxAge: _maxAge, ...clearOptions } = SESSION_COOKIE_OPTIONS;
    res.clearCookie(SESSION_COOKIE, clearOptions);
    return { status: 'ok' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
