import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class loginAccDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
