import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class createAccDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
