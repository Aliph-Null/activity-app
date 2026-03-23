import {
  Controller, Get, Post, Render, Req, Res,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { BlogService } from './blog.service';

@Controller('admin/blog')
@UseGuards(AuthenticatedGuard)
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  private ctx(req: any, extra: Record<string, any> = {}) {
    return { layout: 'layouts/main', currentRoute: 'blog', user: req.user, flash: req.session._flashMessages, ...extra };
  }

  // ── Posts ────────────────────────────────────────────────────────────

  @Get()
  @Render('blog/posts/index')
  posts(@Query('page') page: string, @Query('tag') tagId: string, @Req() req: any) {
    const tid = tagId ? parseInt(tagId, 10) : undefined;
    return this.ctx(req, {
      tab: 'posts',
      ...this.blogService.findAllPosts(parseInt(page, 10) || 1, tid),
      allTags: this.blogService.getAllTags(),
      filterTag: tid || null,
    });
  }

  @Get('posts/new')
  @Render('blog/posts/form')
  newPost(@Req() req: any) {
    return this.ctx(req, { tab: 'posts', post: null, allTags: this.blogService.getAllTags(), isEdit: false });
  }

  @Post('posts')
  createPost(@Body() body: any, @Req() req: any, @Res() res: any) {
    const tagIds = body.tag_ids ? (Array.isArray(body.tag_ids) ? body.tag_ids : [body.tag_ids]).map(Number) : [];
    this.blogService.createPost({ ...body, tag_ids: tagIds });
    req.session._flashMessages = { success: 'Post created.' };
    return res.redirect('/admin/blog');
  }

  @Get('posts/:id/edit')
  @Render('blog/posts/form')
  editPost(@Param('id') id: string, @Req() req: any) {
    return this.ctx(req, { tab: 'posts', post: this.blogService.findPostById(+id), allTags: this.blogService.getAllTags(), isEdit: true });
  }

  @Get('posts/:id/preview')
  @Render('blog/posts/preview')
  previewPost(@Param('id') id: string, @Req() req: any) {
    return this.ctx(req, { tab: 'posts', post: this.blogService.findPostById(+id) });
  }

  @Post('posts/:id')
  updatePost(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const tagIds = body.tag_ids ? (Array.isArray(body.tag_ids) ? body.tag_ids : [body.tag_ids]).map(Number) : [];
    this.blogService.updatePost(+id, { ...body, tag_ids: tagIds });
    req.session._flashMessages = { success: 'Post updated.' };
    return res.redirect('/admin/blog');
  }

  @Post('posts/:id/delete')
  deletePost(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    this.blogService.deletePost(+id);
    req.session._flashMessages = { success: 'Post deleted.' };
    return res.redirect('/admin/blog');
  }

  // ── Tags ─────────────────────────────────────────────────────────────

  @Get('tags')
  @Render('blog/tags/index')
  tags(@Req() req: any) {
    return this.ctx(req, { tab: 'tags', items: this.blogService.findAllTags() });
  }

  @Post('tags')
  createTag(@Body() body: any, @Req() req: any, @Res() res: any) {
    this.blogService.createTag(body.name);
    req.session._flashMessages = { success: 'Tag created.' };
    return res.redirect('/admin/blog/tags');
  }

  @Post('tags/:id')
  updateTag(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    this.blogService.updateTag(+id, body.name);
    req.session._flashMessages = { success: 'Tag updated.' };
    return res.redirect('/admin/blog/tags');
  }

  @Post('tags/:id/delete')
  deleteTag(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    this.blogService.deleteTag(+id);
    req.session._flashMessages = { success: 'Tag deleted.' };
    return res.redirect('/admin/blog/tags');
  }
}
