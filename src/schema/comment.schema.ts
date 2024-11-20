import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from './user.schema';
import { Post } from './post.schema';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  commenter: User;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  })
  post: Post;

  @Prop({ required: true })
  content: string;

  @Prop({ default: [], type: [mongoose.Schema.Types.ObjectId], ref: 'User' })
  likes: Array<User>;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const commentSchema = SchemaFactory.createForClass(Comment);
