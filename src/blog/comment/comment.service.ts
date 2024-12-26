import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from 'src/schema/comment.schema';
import { Post } from 'src/schema/post.schema';
import { User } from 'src/schema/user.schema';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Post.name) private posts: Model<Post>,
    @InjectModel(Comment.name) private comments: Model<Comment>,
    @InjectModel(User.name) private users: Model<User>,
  ) {}
  async create(commenterId: string, postId: string, content: string) {
    try {
      if (!content) throw new BadRequestException('content body is required');
      const post = await this.posts
        .findOne({
          _id: postId,
          isDeleted: false,
        })
        .populate('poster');
      if (!post) throw new NotFoundException("Post wasn't found");

      const comment = await this.comments.create({
        commenter: commenterId,
        post: postId,
        content,
      });
      post.comments.push(comment._id as any as Comment);
      await post.save();
      return {
        id: comment._id,
        post: {
          id: post._id,
          title: post.title,
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          poster: {
            id: post.poster._id,
            username: post.poster.username,
            avatar: post.poster.avatar,
            followers: post.poster.followers.length,
            following: post.poster.following.length,
            postsCount: post.poster.posts.length,
            createdAt: post.poster.createdAt,
          },
          createdAt: post.createdAt,
        },
        content: comment.content,
        likesCount: comment.likes.length,
        createdAt: comment.createdAt,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async like(authorId: string, postId: string, commentId: string) {
    try {
      const post = await this.posts.findOne({
        _id: postId,
        isDeleted: false,
      });
      if (!post) throw new NotFoundException("Post wasn't found");

      const comment = await this.comments.findOne({
        _id: commentId,
        post: postId,
        isDeleted: false,
      });
      if (!comment) throw new NotFoundException("Comment wasn't found");

      let like = true;
      if (comment.likes.includes(authorId as any as User)) like = false;

      if (like) comment.likes.push(authorId as any as User);
      else
        comment.likes.splice(comment.likes.indexOf(authorId as any as User), 1);

      await comment.save();

      await this.users.findOneAndUpdate(
        {
          _id: authorId,
          isDeleted: false,
        },
        like
          ? { $push: { commentslikes: comment._id } }
          : { $pull: { commentslikes: comment._id } },
      );

      return {
        status: like ? 'ADD' : 'REMOVE',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async update(
    commenterId: string,
    postId: string,
    commentId: string,
    content: string,
  ) {
    try {
      const post = await this.posts.findOne({
        _id: postId,
        isDeleted: false,
      });
      if (!post) throw new NotFoundException("Post wasn't found");

      const comment = await this.comments.findOne({
        commenter: commenterId,
        post: postId,
        isDeleted: false,
        _id: commentId,
      });
      if (!comment) throw new NotFoundException("Comment wasn't found");
      comment.content = content;
      await comment.save();
      return {
        success: true,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findOne(commentId: string, postId: string, authorId: string) {
    try {
      const comment = await this.comments.findOne({
        _id: commentId,
        post: postId,
      });
      await comment.populate(['post', 'commenter']);
      console.log(comment);
      return {
        id: comment._id,
        commenter: {
          id: comment.commenter._id,
          username: comment.commenter.username,
          avatar: comment.commenter.avatar,
          postsCount: comment.commenter.posts.length,
          followingCount: comment.commenter.following.length,
          followersCount: comment.commenter.followers.length,
          createdAt: comment.commenter.createdAt,
        },
        content: comment.content,
        likesCount: comment.likes.length,
        createdAt: comment.createdAt,
        isLikedByAuthorizedUser: comment.likes.includes(
          authorId as any as User,
        ),
        post: {
          id: comment.post._id,
          title: comment.post.title,
          commentsCount: comment.post.comments.length,
          likes: comment.post.likes.length,
          isLikedByAuthorizedUser: comment.post.likes.includes(
            authorId as any as User,
          ),
          createdAt: comment.post.createdAt,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async find(postId: string, page: number = 0, authorId: string): Promise<any> {
    try {
      if (page < 0) page = 0;
      const count = await this.comments
        .find({
          post: postId,
          isDeleted: false,
        })
        .countDocuments();
      const comments = await this.comments
        .find({
          post: postId,
          isDeleted: false,
        })
        .skip(page * 10)
        .limit(10)
        .populate('commenter')
        .lean();
      const lastPage = Math.ceil(count / 10);
      const havePrevious = page > 0;
      const haveNext = lastPage - 1 > page;
      return {
        prev: havePrevious,
        next: haveNext,
        data: comments.map((comment) => ({
          id: comment._id,
          content: comment.content,
          likesCount: comment.likes.length,
          commenter: {
            username: comment.commenter.username,
            avatar: comment.commenter.avatar,
            followersCount: comment.commenter.followers.length,
            followingCount: comment.commenter.following.length,
            postsCount: comment.commenter.posts.length,
            id: comment.commenter._id,
            createdAt: comment.commenter.createdAt,
          },
          createdAt: comment.createdAt,
          postId: comment.post,
          isLikedByAuthorizedUser: comment.likes.includes(authorId as any),
          isCommenter: String(comment.commenter.id) == String(authorId)
        })),
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async delete(commenterId: string, commentId: string, postId: string) {
    try {
      const comment = await this.comments.findOneAndUpdate(
        {
          commenter: commenterId,
          _id: commentId,
          post: postId,
        },
        { isDeleted: true },
        { new: true },
      );
      if (!comment) throw new NotFoundException("comment wasn't found.");
      await this.posts.findByIdAndUpdate(postId, {
        $pull: { comments: commentId },
      });
      return {
        success: true,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
