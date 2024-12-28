import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Post } from 'src/schema/post.schema';
import { User } from 'src/schema/user.schema';
import { postCreateInterface, postDeleteInterface } from './post.service.type';

@Injectable()
export class PostService {
  private _postsCount: number;
  constructor(
    @InjectModel(User.name) private users: Model<User>,
    @InjectModel(Post.name) private posts: Model<Post>,
  ) {}

  async create(data: postCreateInterface) {
    try {
      const posts = (this._postsCount ??= await this.posts.countDocuments());
      const title = `${posts}-${data.title}`;
      const post = await this.posts.create({
        title: title,
        content: data.content,
        poster: data.poster,
      });
      await this.users.findByIdAndUpdate(data.poster, {
        $push: { posts: post._id },
      });
      this._postsCount += 1;
      return {
        title: title,
        content: post.content,
        id: post._id,
        createdAt: post.createdAt,
        poster: post.poster,
      };
    } catch (error) {
      console.log(error);
      throw new ConflictException();
    }
  }

  async update(posterId: string, postId: string, updatedContent: string) {
    try {
      const post = await this.posts
        .findOneAndUpdate(
          {
            poster: posterId,
            _id: postId,
          },
          {
            content: updatedContent,
          },
        )
        .populate('poster');
      if (!post)
        throw new NotFoundException("You don't have this post to modify it.");
      if (post.isDeleted)
        throw new ConflictException("You can't modify a deleted post.");
      return {
        id: post.id,
        title: post.title,
        content: updatedContent,
        commentsCount: post.comments.length,
        likes: post.likes.length,
        poster: {
          username: post.poster.username,
          id: post.poster.id,
          avatar: post.poster.avatar,
          followersCount: post.poster.followers.length,
          followingCount: post.poster.following.length,
          createdAt: post.poster.createdAt,
        },
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async like(posterId: string, postId: string) {
    try {
      const post = await this.posts.findOne({
        _id: postId,
      });
      if (!post && post.poster != (posterId as any as User) && post.isDeleted)
        throw new NotFoundException("Post doesn't exists.");
      let like = true;
      if (post.likes.includes(posterId as any as User)) like = false;

      if (like) post.likes.push(posterId as any as User);
      else post.likes.splice(post.likes.indexOf(posterId as any as User), 1);
      await post.save();
      await this.users.findOneAndUpdate(
        {
          _id: posterId,
        },
        like
          ? { $push: { postslikes: post._id } }
          : { $pull: { postslikes: post._id } },
      );

      return { status: like ? 'ADD' : 'REMOVE' };
    } catch (error) {
      console.error('PostLikeError: ', error);
      throw error;
    }
  }

  async delete(data: postDeleteInterface) {
    try {
      const post = await this.posts.findOneAndUpdate(
        {
          poster: data.poster,
          _id: data.postId,
          isDeleted: false,
        },
        { isDeleted: true },
        { new: true },
      );
      if (!post) throw new NotFoundException("Post wasn't found.");
      await this.users.findByIdAndUpdate(data.poster, {
        $pull: { posts: data.postId },
      });
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  }

  async findOne(authorId: string, id: string, admin?: boolean) {
    try {
      if (!isValidObjectId(id)) throw new BadRequestException('use correct id');
      const post = await this.posts
        .findOne({ _id: id, ...(admin ? {} : { isDeleted: false }) })
        .populate('poster');
      if (!post) throw new NotFoundException("Post doesn't exists");
      return {
        id: post._id,
        title: post.title,
        content: post.content,
        commentsCount: post.comments.length,
        likes: post.likes.length,
        poster: {
          username: post.poster.username,
          id: post.poster._id,
          avatar: post.poster.avatar,
          postsCount: post.poster.posts.length,
          createdAt: post.poster.createdAt,
        },
        isLikedByAuthorizedUser: post.likes.includes(authorId as any as User),
        isPoster:
          String(post.poster._id.toString()) == String(authorId.toString()),
      };
    } catch (error) {
      throw error;
    }
  }

  async find(posterId: string, page: number = 0, admin?: boolean) {
    try {
      if (page < 0) page = 0;
      const posts = await this.posts
        .find({ poster: posterId, ...(admin ? {} : { isDeleted: false }) })
        .skip(page * 10)
        .limit(10)
        .populate('poster');
      return posts.map((post) => {
        return {
          id: post._id,
          title: post.title,
          poster: {
            id: post.poster._id,
            username: post.poster.username,
            avatar: post.poster.avatar,
            postsCount: post.poster.posts.length,
            followersCount: post.poster.followers.length,
            followingCount: post.poster.following.length,
            createdAt: post.poster.createdAt,
          },
          commentsCount: post.comments.length,
          likes: post.likes.length,
          isLikedByAuthorizedUser: post.likes.includes(posterId as any as User),
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      });
    } catch (error) {
      console.error(error);
    }
  }

  async feeds(userId: string, page: number = 0) {
    if (page < 0) page = 0;
    const user = await this.users.findById(userId);
    if (user.following.length > 0) await user.populate('following');
    let feeds = await this.posts
      .find({
        poster: {
          $in: user.following,
        },
        isDeleted: false,
      })
      .skip(page * 15)
      .limit(15)
      .populate('poster');
    if (feeds.length === 0) {
      feeds = await this.posts
        .find({
          isDeleted: false,
        })
        .skip(page * 15)
        .limit(15)
        .populate('poster');
    }
    return feeds.map((post) => ({
      id: post._id,
      title: post.title,
      poster: {
        id: post.poster._id,
        username: post.poster.username,
        avatar: post.poster.avatar,
        postsCount: post.poster.posts.length,
        followersCount: post.poster.followers.length,
        followingCount: post.poster.following.length,
        createdAt: post.poster.createdAt,
      },
      commentsCount: post.comments.length,
      shortContent: post.content.slice(0, 100),
      likes: post.likes.length,
      isLikedByAuthorizedUser: post.likes.includes(userId as any as User),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));
  }

  async search(
    query: string,
    author: string,
    sort: string = 'latest',
    page: number = 0,
    admin?: boolean,
  ) {
    const posts = await this.posts
      .find({
        ...(author ? { poster: author } : {}),
        $or: [
          {
            title: new RegExp(query, 'i'),
          },
          {
            content: new RegExp(query, 'i'),
          },
        ],
        ...(admin ? {} : { isDeleted: false }),
      })
      .sort(sort === 'oldest' ? { createdAt: -1 } : { createdAt: 1 })
      .skip(page * 30)
      .limit(30)
      .populate('poster');
    return posts.map((post) => {
      return {
        id: post._id,
        title: post.title,
        poster: {
          id: post.poster._id,
          username: post.poster.username,
          avatar: post.poster.avatar,
          followersCount: post.poster.followers.length,
          followingCount: post.poster.following.length,
          postsCount: post.poster.posts.length,
          createdAt: post.poster.createdAt,
        },
        commentsCount: post.comments.length,
        likesCount: post.likes.length,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        content: post.content,
      };
    });
  }
}
