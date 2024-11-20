import { IsOptional, IsString } from 'class-validator';

export class updatePostDto {
  @IsString()
  content: string;
}
