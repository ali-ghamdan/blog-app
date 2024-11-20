import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from './user.schema';
import { Comment } from './comment.schema';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  poster: User;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: Comment.name,
    default: [],
  })
  comments: Array<Comment>;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] })
  likes: Array<User>;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const postSchema = SchemaFactory.createForClass(Post);
