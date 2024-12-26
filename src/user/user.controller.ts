import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuardFc } from 'src/auth/auth.guard';
import { updateAccDto } from './dtos/updateAccount.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private users: UserService) {}

  @Get('/followers')
  @UseGuards(AuthGuardFc(false))
  async followers(@Request() req, @Query('page') page: number = 1) {
    return this.users.listFollowing(req.user.sub, page - 1);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.users.findOne(undefined, id);
    return {
      username: user.username,
      id: user.id,
      avatar: user.avatar,
      posts: user.posts.length,
      followers: user.followers.length,
      following: user.following.length,
      createdAt: user.createdAt,
    };
  }

  @Put()
  @UseGuards(AuthGuardFc(false))
  async updateAccount(@Request() req, @Body() body: updateAccDto) {
    return this.users.update(req.user.sub, body);
  }

  @Delete()
  @UseGuards(AuthGuardFc(false))
  async deleteAccount(@Request() req) {
    return this.users.delete(req.user.sub);
  }

  @Post('/:id/follow')
  @UseGuards(AuthGuardFc(false))
  async followUser(@Request() req, @Param('id') id: string) {
    return this.users.toogleFollow(req.user.sub, id, true);
  }

  @Delete('/:id/unfollow')
  @UseGuards(AuthGuardFc(false))
  async unfollowUser(@Request() req, @Param('id') id: string) {
    return this.users.toogleFollow(req.user.sub, id, false);
  }
}
