import {
  Controller, Get, Post, Render, Req, Res,
  Param, Body, Query, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { DojoService } from './dojo.service';
import { StorageService } from '../storage/storage.service';

@Controller('admin/dojo')
@UseGuards(AuthenticatedGuard)
export class DojoController {
  constructor(
    private readonly dojoService: DojoService,
    private readonly storageService: StorageService,
  ) {}

  private ctx(req: any, extra: Record<string, any> = {}) {
    return { layout: 'layouts/main', currentRoute: 'dojo', user: req.user, flash: req.session._flashMessages, ...extra };
  }

  // ── Mentors ──────────────────────────────────────────────────────────

  @Get('mentors')
  @Render('dojo/mentors/index')
  mentors(@Query('page') page: string, @Req() req: any) {
    return this.ctx(req, { tab: 'mentors', ...this.dojoService.findAllMentors(parseInt(page, 10) || 1) });
  }

  @Get('mentors/new')
  @Render('dojo/mentors/form')
  newMentor(@Req() req: any) {
    return this.ctx(req, { mentor: null, profiles: this.dojoService.getProfilesWithoutMentor(), isEdit: false });
  }

  @Post('mentors')
  createMentor(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.createMentor({ profile_id: parseInt(body.profile_id, 10), description: body.description });
      req.flash('success', 'Mentor created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/mentors');
  }

  @Get('mentors/:id/edit')
  @Render('dojo/mentors/form')
  editMentor(@Param('id') id: string, @Req() req: any) {
    return this.ctx(req, { mentor: this.dojoService.findMentorById(parseInt(id, 10)), profiles: [], isEdit: true });
  }

  @Post('mentors/:id')
  updateMentor(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.updateMentor(parseInt(id, 10), { description: body.description });
      req.flash('success', 'Mentor updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/mentors');
  }

  @Post('mentors/:id/delete')
  deleteMentor(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.deleteMentor(parseInt(id, 10));
      req.flash('success', 'Mentor deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/mentors');
  }

  @Get('mentors/:id/signatures')
  @Render('dojo/signatures')
  mentorSignatures(@Param('id') id: string, @Req() req: any) {
    const mentor = this.dojoService.findMentorById(parseInt(id, 10));
    const signatures = this.dojoService.getMentorSignatures(parseInt(id, 10));
    const documents = this.dojoService.findAllDocuments();
    return this.ctx(req, { entity: mentor, entityType: 'mentor', entityId: id, signatures, documents });
  }

  @Post('mentors/:id/signatures')
  createMentorSignature(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.createMentorSignature(parseInt(id, 10), parseInt(body.document_id, 10), body.signed_at);
      req.flash('success', 'Signature recorded.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/dojo/mentors/${id}/signatures`);
  }

  @Post('mentors/:id/signatures/:sigId/delete')
  deleteMentorSignature(@Param('id') id: string, @Param('sigId') sigId: string, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.deleteMentorSignature(parseInt(sigId, 10));
      req.flash('success', 'Signature removed.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/dojo/mentors/${id}/signatures`);
  }

  // ── Tutors ───────────────────────────────────────────────────────────

  @Get('tutors')
  @Render('dojo/tutors/index')
  tutors(@Query('page') page: string, @Req() req: any) {
    return this.ctx(req, { tab: 'tutors', ...this.dojoService.findAllTutors(parseInt(page, 10) || 1) });
  }

  @Get('tutors/new')
  @Render('dojo/tutors/form')
  newTutor(@Req() req: any) {
    return this.ctx(req, { profiles: this.dojoService.getProfilesWithoutTutor() });
  }

  @Post('tutors')
  createTutor(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.createTutor({ profile_id: parseInt(body.profile_id, 10) });
      req.flash('success', 'Tutor created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/tutors');
  }

  @Post('tutors/:id/delete')
  deleteTutor(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.deleteTutor(parseInt(id, 10));
      req.flash('success', 'Tutor deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/tutors');
  }

  @Get('tutors/:id/signatures')
  @Render('dojo/signatures')
  tutorSignatures(@Param('id') id: string, @Req() req: any) {
    const tutor = this.dojoService.findTutorById(parseInt(id, 10));
    const signatures = this.dojoService.getTutorSignatures(parseInt(id, 10));
    const documents = this.dojoService.findAllDocuments();
    return this.ctx(req, { entity: tutor, entityType: 'tutor', entityId: id, signatures, documents });
  }

  @Post('tutors/:id/signatures')
  createTutorSignature(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.createTutorSignature(parseInt(id, 10), parseInt(body.document_id, 10), body.signed_at);
      req.flash('success', 'Signature recorded.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/dojo/tutors/${id}/signatures`);
  }

  @Post('tutors/:id/signatures/:sigId/delete')
  deleteTutorSignature(@Param('id') id: string, @Param('sigId') sigId: string, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.deleteTutorSignature(parseInt(sigId, 10));
      req.flash('success', 'Signature removed.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/dojo/tutors/${id}/signatures`);
  }

  // ── Ninjas ───────────────────────────────────────────────────────────

  @Get('ninjas')
  @Render('dojo/ninjas/index')
  ninjas(@Query('page') page: string, @Req() req: any) {
    return this.ctx(req, { tab: 'ninjas', ...this.dojoService.findAllNinjas(parseInt(page, 10) || 1) });
  }

  @Get('ninjas/new')
  @Render('dojo/ninjas/form')
  newNinja(@Req() req: any) {
    return this.ctx(req, { ninja: null, profiles: this.dojoService.getProfiles(), tutors: this.dojoService.getAllTutors(), isEdit: false });
  }

  @Post('ninjas')
  createNinja(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.createNinja({ profile_id: parseInt(body.profile_id, 10), tutor_id: parseInt(body.tutor_id, 10), useful_info: body.useful_info });
      req.flash('success', 'Ninja created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/ninjas');
  }

  @Get('ninjas/:id/edit')
  @Render('dojo/ninjas/form')
  editNinja(@Param('id') id: string, @Req() req: any) {
    return this.ctx(req, { ninja: this.dojoService.findNinjaById(parseInt(id, 10)), profiles: [], tutors: this.dojoService.getAllTutors(), isEdit: true });
  }

  @Post('ninjas/:id')
  updateNinja(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.updateNinja(parseInt(id, 10), { tutor_id: parseInt(body.tutor_id, 10), useful_info: body.useful_info });
      req.flash('success', 'Ninja updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/ninjas');
  }

  @Post('ninjas/:id/delete')
  deleteNinja(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.deleteNinja(parseInt(id, 10));
      req.flash('success', 'Ninja deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/ninjas');
  }

  // ── Sessions ─────────────────────────────────────────────────────────

  @Get('sessions')
  @Render('dojo/sessions/index')
  sessions(@Query('page') page: string, @Req() req: any) {
    return this.ctx(req, { tab: 'sessions', ...this.dojoService.findAllSessions(parseInt(page, 10) || 1) });
  }

  @Get('sessions/new')
  @Render('dojo/sessions/form')
  newSession(@Req() req: any) {
    return this.ctx(req, { session: null, mentors: this.dojoService.getAllMentors(), isEdit: false });
  }

  @Post('sessions')
  createSession(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.createSession({ starts_at: body.starts_at, location: body.location, theme: body.theme, mentor_id: parseInt(body.mentor_id, 10) });
      req.flash('success', 'Session created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/sessions');
  }

  @Get('sessions/:id/edit')
  @Render('dojo/sessions/form')
  editSession(@Param('id') id: string, @Req() req: any) {
    return this.ctx(req, { session: this.dojoService.findSessionById(parseInt(id, 10)), mentors: this.dojoService.getAllMentors(), isEdit: true });
  }

  @Post('sessions/:id')
  updateSession(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.updateSession(parseInt(id, 10), { starts_at: body.starts_at, location: body.location, theme: body.theme, mentor_id: parseInt(body.mentor_id, 10) });
      req.flash('success', 'Session updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/sessions');
  }

  @Post('sessions/:id/delete')
  deleteSession(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.dojoService.deleteSession(parseInt(id, 10));
      req.flash('success', 'Session deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/sessions');
  }

  // ── Blog posts ──────────────────────────────────────────────────────

  @Get('blog')
  @Render('dojo/blog/index')
  blogPosts(@Req() req: any) {
    return this.ctx(req, { tab: 'blog', posts: this.dojoService.getDojoRelatedPosts(), allTags: this.dojoService.getAllBlogTags() });
  }

  // ── Agreements overview ─────────────────────────────────────────────

  @Get('agreements')
  @Render('dojo/agreements/index')
  agreements(@Req() req: any) {
    return this.ctx(req, { tab: 'agreements', ...this.dojoService.getAgreementsOverview() });
  }

  // ── Agreement Documents ──────────────────────────────────────────────

  @Get('documents')
  @Render('dojo/documents/index')
  documents(@Req() req: any) {
    return this.ctx(req, { tab: 'documents', items: this.dojoService.findAllDocuments() });
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  async createDocument(@UploadedFile() file: Express.Multer.File, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      let filePath: string | undefined;
      let originalFilename: string | undefined;
      if (file) {
        filePath = await this.storageService.upload(file, 'agreements');
        originalFilename = file.originalname;
      }
      this.dojoService.createDocument({ name: body.name, file_path: filePath, original_filename: originalFilename });
      req.flash('success', 'Document created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/documents');
  }

  @Post('documents/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateDocument(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      let filePath: string | undefined;
      let originalFilename: string | undefined;
      if (file) {
        const existing = this.dojoService.findDocumentById(parseInt(id, 10));
        if (existing?.file_path) {
          await this.storageService.delete(existing.file_path);
        }
        filePath = await this.storageService.upload(file, 'agreements');
        originalFilename = file.originalname;
      }
      this.dojoService.updateDocument(parseInt(id, 10), { name: body.name, file_path: filePath, original_filename: originalFilename });
      req.flash('success', 'Document updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/documents');
  }

  @Get('documents/:id/download')
  async downloadDocument(@Param('id') id: string, @Res() res: any) {
    const doc = this.dojoService.findDocumentById(parseInt(id, 10));
    if (!doc?.file_path) {
      res.status(404).send('No file attached.');
      return;
    }
    const { buffer, mimetype } = await this.storageService.read(doc.file_path);
    res.set({
      'Content-Type': mimetype,
      'Content-Disposition': `inline; filename="${doc.original_filename || 'document'}"`,
    });
    res.send(buffer);
  }

  @Post('documents/:id/remove-file')
  async removeDocumentFile(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      const doc = this.dojoService.findDocumentById(parseInt(id, 10));
      if (doc?.file_path) {
        await this.storageService.delete(doc.file_path);
      }
      this.dojoService.clearDocumentFile(parseInt(id, 10));
      req.flash('success', 'File removed.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/documents');
  }

  @Post('documents/:id/delete')
  async deleteDocument(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      const doc = this.dojoService.findDocumentById(parseInt(id, 10));
      if (doc?.file_path) {
        await this.storageService.delete(doc.file_path);
      }
      this.dojoService.deleteDocument(parseInt(id, 10));
      req.flash('success', 'Document deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/dojo/documents');
  }
}
