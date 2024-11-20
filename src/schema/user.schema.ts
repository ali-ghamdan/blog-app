import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Post } from './post.schema';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  avatar: string;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] })
  followers: Array<User>;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] })
  following: Array<User>;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: Post.name, default: [] })
  posts: Array<Post>;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: Post.name, default: [] })
  postslikes: Array<Post>;

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Comment',
    default: [],
  })
  commentslikes: Array<Comment>;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const userSchema = SchemaFactory.createForClass(User);
