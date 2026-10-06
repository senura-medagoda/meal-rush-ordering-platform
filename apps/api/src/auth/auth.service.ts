import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    // Role is NOT taken from the request: new accounts are always CUSTOMER.
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
    });
    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const passwordOk = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

    // Same message for "no such user" and "wrong password" so attackers can't discover emails.
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildAuthResult(user);
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User no longer exists');
    return this.publicUser(user);
  }

  private async buildAuthResult(user: User) {
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { token, user: this.publicUser(user) };
  }

  private publicUser(user: User) {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}