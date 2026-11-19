import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity.js';
import { SESSION_TTL_SECONDS, SessionPayload, SessionUser } from './session.js';

@Injectable()
export class AuthService {
  private readonly revokedTokens = new Map<string, number>();

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<string> {
    const user = await this.users.findOneBy({ email });
    const valid = user && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, jti: randomUUID() },
      { expiresIn: SESSION_TTL_SECONDS },
    );
  }

  async verify(token: string): Promise<SessionUser> {
    let payload: SessionPayload;
    try {
      payload = await this.jwt.verifyAsync<SessionPayload>(token, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException();
    }
    if (this.revokedTokens.has(payload.jti)) {
      throw new UnauthorizedException();
    }
    return { id: payload.sub, email: payload.email };
  }

  // FIX-10: logout revokes the token server-side, not only by deleting the cookie
  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    try {
      const payload = await this.jwt.verifyAsync<SessionPayload>(token, {
        algorithms: ['HS256'],
      });
      this.revokedTokens.set(payload.jti, payload.exp);
    } catch {
      // invalid or expired token: nothing to revoke
    }
    this.purgeExpired();
  }

  private purgeExpired() {
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of this.revokedTokens) {
      if (exp < now) this.revokedTokens.delete(jti);
    }
  }
}
