import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { hash } from 'bcrypt';
import { isValidObjectId, Model } from 'mongoose';
import { Post } from 'src/schema/post.schema';
import { User } from 'src/schema/user.schema';
import { updateAccDto } from './dtos/updateAccount.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private users: Model<User>,
    @InjectModel(Post.name) private posts: Model<Post>,
    private jwtService: JwtService,
  ) {}

  async create(username: string, email: string, password: string) {
    try {
      const user = await this.users.create({
        username,
        email,
        password: await hash(password, 10),
      });

      return user;
    } catch (error) {
      console.log(error);
      if (error.code === 11000) {
        throw new ConflictException(
          'Creating an Already exsists account, try another email',
        );
      }

      throw new NotFoundException('Something went wrong');
    }
  }

  async findOne(email?: string, id?: string) {
    try {
      if (!email && !id) throw new UnauthorizedException();
      if (id && !isValidObjectId(id))
        throw new BadRequestException('invalid provided user id');
      const user = await this.users.findOne({
        ...(email ? { email } : { _id: id }),
        isDeleted: false,
      });
      if (!user) throw new NotFoundException("User doesn't exists.");
      return user;
    } catch (error) {
      console.log('findUserError:', error);
      throw error;
    }
  }

  async update(id: string, body: updateAccDto) {
    const user = await this.findOne(undefined, id);
    if (!user) throw new NotFoundException("User doesn't exists");
    if (Object.keys(body).length <= 0)
      throw new BadRequestException('at least one key to change');
    if (body.username) user.username = body.username;
    if (body.avatar) user.avatar = body.avatar;
    if (body.password) user.password = await hash(body.password, 10);
    await user.save();
    if (body.password)
      return {
        access_token: await this.jwtService.signAsync({
          sub: user._id,
          email: user.email,
        }),
      };
    else return { success: true };
  }

  async delete(id: string) {
    const user = await this.users.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
    await this.posts.updateMany({ poster: user._id }, { isDeleted: true });
    return user;
  }

  async toogleFollow(id: string, followerId: string, follow: boolean) {
    if (!isValidObjectId(followerId))
      throw new BadRequestException('invalid provided user id');
    if (id === followerId)
      throw new BadRequestException(
        `You can't ${follow ? 'un' : ''}follow your self.`,
      );
    const follower = await this.users.findOne({ _id: followerId });
    if (!follower)
      throw new NotFoundException(
        'the user that you need to follow is not exists.',
      );
    const user = await this.users.findOne({ _id: id });
    if (!user) throw new UnauthorizedException();
    if (follow) {
      if (
        !user.following.includes(followerId as any as User) ||
        !follower.followers.includes(id as any as User)
      ) {
        user.following.push(followerId as any as User);
        follower.followers.push(id as any as User);
        await user.save();
        await follower.save();
      }
      return { follow_status: true };
    } else {
      if (
        user.following.includes(followerId as any as User) ||
        follower.followers.includes(id as any as User)
      ) {
        user.following.splice(
          user.following.indexOf(followerId as any as User),
          1,
        );
        follower.followers.splice(
          follower.followers.indexOf(id as any as User),
          1,
        );
        await user.save();
        await follower.save();
      }
      return { follow_status: false };
    }
  }

  async listFollowing(id: string, page: number = 0) {
    if (page < 0) page = 0;
    const users = await this.users
      .find({
        followers: { $in: [id] },
        isDeleted: false,
      })
      .skip(page * 50)
      .limit(50);
    return users.map((follow) => {
      return {
        id: follow._id,
        username: follow.username,
        avatar: follow.avatar,
        followersCount: follow.followers.length,
        followingCount: follow.following.length,
        postsCount: follow.posts.length,
        createdAt: follow.createdAt,
      };
    });
  }
}
