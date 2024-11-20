import { Module } from '@nestjs/common';
import { PostController } from './post/post.controller';
import { PostService } from './post/post.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/schema/user.schema';
import { Post, postSchema } from 'src/schema/post.schema';
import { CommentService } from './comment/comment.service';
import { Comment, commentSchema } from 'src/schema/comment.schema';

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
    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: commentSchema,
      },
    ]),
  ],
  controllers: [PostController],
  providers: [PostService, CommentService],
})
export class BlogModule {}
