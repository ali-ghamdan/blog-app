import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/schema/user.schema';
import { UserController } from './user.controller';
import { Post, postSchema } from 'src/schema/post.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: userSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Post.name,
        schema: postSchema,
      },
    ]),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
