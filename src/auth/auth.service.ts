import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private UsersService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, email: string, password: string) {
    return await this.UsersService.create(username, email, password);
  }

  async login(email: string, password: string) {
    const user = await this.UsersService.findOne(email);
    if (!user) throw new UnauthorizedException("user doesn't exists");
    const isMatch = await compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid Password.');
    return {
      access_token: await this.jwtService.signAsync({
        sub: user._id,
        username: user.username,
      }),
    };
  }
}
