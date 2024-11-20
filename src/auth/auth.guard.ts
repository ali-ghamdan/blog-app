import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schema/user.schema';

export function AuthGuardFc(optional?: boolean) {
  @Injectable()
  class AuthGuard implements CanActivate {
    constructor(
      public jwtService: JwtService,
      @InjectModel(User.name) public users: Model<User>,
    ) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const token = request.headers.authorization;
      try {
        if (!token) throw new UnauthorizedException();
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });
        const user = await this.users.findById(payload.sub);
        if (!user || user.isDeleted) throw new UnauthorizedException();
        request['user'] = { ...payload, isAdmin: user.isAdmin };
      } catch (error) {
        if (optional) request['user'] = undefined;
        else throw new UnauthorizedException();
      }
      return true;
    }
  }
  return AuthGuard;
}
