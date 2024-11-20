import { IsEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class updateAccDto {
  @IsUrl()
  @IsOptional()
  @IsEmpty()
  avatar?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
