import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuardFc } from './auth.guard';
import { AuthService } from './auth.service';
import { createAccDto } from './dtos/createAccDto.dto';
import { loginAccDto } from './dtos/loginAccDto.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async register(@Body() createAccDto: createAccDto) {
    const user = await this.authService.register(
      createAccDto.username,
      createAccDto.email,
      createAccDto.password,
    );

    return {
      username: user.username,
      id: user._id,
    };
  }

  @Post('/login')
  login(@Body() loginAccDto: loginAccDto) {
    return this.authService.login(loginAccDto.email, loginAccDto.password);
  }

  @Get('/profile')
  @UseGuards(AuthGuardFc)
  profile(@Request() req) {
    delete req.user.isAdmin;
    return req.user;
  }
}
