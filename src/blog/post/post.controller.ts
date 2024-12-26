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
import { CommentService } from '../comment/comment.service';
import { createCommentDto } from './dtos/createComment.dto';
import { createPostDto } from './dtos/createPost.dto';
import { updatePostDto } from './dtos/updatePost.dto';
import { PostService } from './post.service';

@Controller('posts')
export class PostController {
  constructor(
    private postService: PostService,
    private commentService: CommentService,
  ) {}

  @Post()
  @UseGuards(AuthGuardFc(false))
  async create(@Request() req, @Body() body: createPostDto) {
    return this.postService.create({
      title: body.title,
      content: body.content,
      poster: req.user.sub,
    });
  }

  @Put('/:id/like')
  @UseGuards(AuthGuardFc(false))
  async like(@Request() req, @Param('id') id: string) {
    return this.postService.like(req.user.sub, id);
  }

  @Put(':id')
  @UseGuards(AuthGuardFc(false))
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() body: updatePostDto,
  ) {
    return this.postService.update(req.user.sub, id, body.content);
  }

  @Delete(':id')
  @UseGuards(AuthGuardFc(false))
  async delete(@Request() req, @Param('id') id: string) {
    return this.postService.delete({
      poster: req.user.sub,
      postId: id,
    });
  }

  @Get()
  @UseGuards(AuthGuardFc(false))
  async listPosts(@Request() req, @Query('page') page: number = 1) {
    return this.postService.find(req.user.sub, page - 1, req.user.isAdmin);
  }

  @Get('/feeds')
  @UseGuards(AuthGuardFc(false))
  async feeds(@Request() req, @Query('page') page: number = 1): Promise<any> {
    return this.postService.feeds(req.user.sub, page - 1);
  }

  @Get('/search')
  @UseGuards(AuthGuardFc(true))
  async search(
    @Request() req,
    @Query('author') author: string,
    @Query('sort') sort: string,
    @Query('q') query: string,
    @Query('page') page: number = 1,
  ) {
    return this.postService.search(
      query,
      author,
      sort?.toLowerCase(),
      page - 1,
      req?.user?.isAdmin,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuardFc(false))
  async getPost(@Request() req, @Param('id') id: string) {
    return this.postService.findOne(req.user.sub, id, req.user.isAdmin);
  }

  // comments Section

  @Post('/:id/comments')
  @UseGuards(AuthGuardFc(false))
  async createComment(
    @Request() req,
    @Param('id') id: string,
    @Body() body: createCommentDto,
  ) {
    return this.commentService.create(req.user.sub, id, body.content);
  }

  @Get('/:id/comments/:commentId')
  @UseGuards(AuthGuardFc(false))
  async getComment(
    @Request() req,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.findOne(commentId, id, req.user.sub);
  }

  @Get('/:id/comments')
  @UseGuards(AuthGuardFc(false))
  async getComments(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page: number = 1,
  ): Promise<any> {
    return this.commentService.find(id, page - 1, req.user.sub);
  }

  @Put('/:id/comments/:commentId/like')
  @UseGuards(AuthGuardFc(false))
  async likeComment(
    @Request() req,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.like(req.user.sub, id, commentId);
  }

  @Put('/:id/comments/:commentId')
  @UseGuards(AuthGuardFc(false))
  async updateComments(
    @Request() req,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() body: createCommentDto,
  ) {
    return this.commentService.update(
      req.user.sub,
      id,
      commentId,
      body.content,
    );
  }

  @Delete('/:id/comments/:commentId')
  @UseGuards(AuthGuardFc(false))
  async deleteComment(
    @Request() req,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.delete(req.user.sub, commentId, id);
  }
}
