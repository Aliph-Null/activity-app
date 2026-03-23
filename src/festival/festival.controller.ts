import {
  Controller, Get, Post, Render, Req, Res,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { FestivalService } from './festival.service';

@Controller('admin/festival')
@UseGuards(AuthenticatedGuard)
export class FestivalController {
  constructor(private readonly festivalService: FestivalService) {}

  private ctx(req: any, extra: Record<string, any> = {}) {
    return { layout: 'layouts/main', currentRoute: 'festival', user: req.user, flash: req.session._flashMessages, ...extra };
  }

  // ── Editions ─────────────────────────────────────────────────────────

  @Get()
  @Render('festival/editions/index')
  editions(@Req() req: any) {
    return this.ctx(req, { items: this.festivalService.findAllEditions() });
  }

  @Get('editions/new')
  @Render('festival/editions/form')
  newEdition(@Req() req: any) {
    return this.ctx(req, { edition: null, blogTags: this.festivalService.getAllBlogTags(), isEdit: false });
  }

  @Post('editions')
  createEdition(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.createEdition({ ...body, year: parseInt(body.year, 10), blog_tag_id: body.blog_tag_id ? parseInt(body.blog_tag_id, 10) : null });
      req.flash('success', 'Edition created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/festival');
  }

  @Get('editions/:id/edit')
  @Render('festival/editions/form')
  editEdition(@Param('id') id: string, @Req() req: any) {
    const edition = this.festivalService.findEditionById(parseInt(id, 10));
    return this.ctx(req, { festivalSubnav: 'edit', edition, blogTags: this.festivalService.getAllBlogTags(), isEdit: true });
  }

  @Post('editions/:id')
  updateEdition(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.updateEdition(parseInt(id, 10), { ...body, year: parseInt(body.year, 10), blog_tag_id: body.blog_tag_id ? parseInt(body.blog_tag_id, 10) : null });
      req.flash('success', 'Edition updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/festival');
  }

  @Post('editions/:id/delete')
  deleteEdition(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.deleteEdition(parseInt(id, 10));
      req.flash('success', 'Edition deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/festival');
  }

  // ── Edition Detail (overview) ────────────────────────────────────────

  @Get('editions/:id')
  @Render('festival/editions/show')
  showEdition(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    return this.ctx(req, {
      festivalSubnav: 'edition',
      edition,
      sections: this.festivalService.getSections(eid),
      volunteers: this.festivalService.getVolunteers(eid),
      volunteerCandidates: this.festivalService.getProfilesNotVolunteer(eid),
      locations: this.festivalService.getLocations(eid),
      guests: this.festivalService.getGuests(eid),
      sponsors: this.festivalService.getSponsors(eid),
      program: this.festivalService.getProgram(eid),
      staffMembers: this.festivalService.getStaffMembers(eid),
      staffCandidates: this.festivalService.getMembersNotStaff(eid),
    });
  }

  // ── Sections ─────────────────────────────────────────────────────────

  @Post('editions/:id/sections')
  createSection(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    try {
      if (!name) throw new Error('Section name is required.');
      this.festivalService.createSection(parseInt(id, 10), name);
      req.flash('success', 'Section created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${id}`);
  }

  @Post('sections/:id')
  updateSection(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const section = this.festivalService.getSectionById(parseInt(id, 10));
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    try {
      if (!name) throw new Error('Section name cannot be empty.');
      this.festivalService.updateSection(parseInt(id, 10), name);
      req.flash('success', 'Section updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${section?.edition_id}`);
  }

  @Post('sections/:id/delete')
  deleteSection(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const section = this.festivalService.getSectionById(parseInt(id, 10));
    try {
      this.festivalService.deleteSection(parseInt(id, 10));
      req.flash('success', 'Section deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${section?.edition_id}`);
  }

  // ── Activities ───────────────────────────────────────────────────────

  @Get('sections/:sectionId/activities')
  @Render('festival/activities/index')
  activities(@Param('sectionId') sectionId: string, @Req() req: any) {
    const section = this.festivalService.getSectionById(parseInt(sectionId, 10));
    return this.ctx(req, { section, items: this.festivalService.getActivities(parseInt(sectionId, 10)) });
  }

  @Get('sections/:sectionId/activities/new')
  @Render('festival/activities/form')
  newActivity(@Param('sectionId') sectionId: string, @Req() req: any) {
    const section = this.festivalService.getSectionById(parseInt(sectionId, 10));
    return this.ctx(req, { section, activity: null, isEdit: false });
  }

  @Post('sections/:sectionId/activities')
  createActivity(@Param('sectionId') sectionId: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.createActivity({ section_id: parseInt(sectionId, 10), ...body });
      req.flash('success', 'Activity created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/sections/${sectionId}/activities`);
  }

  @Get('activities/:id/edit')
  @Render('festival/activities/form')
  editActivity(@Param('id') id: string, @Req() req: any) {
    const activity = this.festivalService.findActivityById(parseInt(id, 10)) as any;
    const section = this.festivalService.getSectionById(activity?.section_id);
    return this.ctx(req, { section, activity, isEdit: true });
  }

  @Post('activities/:id')
  updateActivity(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const activity = this.festivalService.findActivityById(parseInt(id, 10)) as any;
    try {
      this.festivalService.updateActivity(parseInt(id, 10), body);
      req.flash('success', 'Activity updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/sections/${activity?.section_id}/activities`);
  }

  @Post('activities/:id/delete')
  deleteActivity(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const activity = this.festivalService.findActivityById(parseInt(id, 10)) as any;
    try {
      this.festivalService.deleteActivity(parseInt(id, 10));
      req.flash('success', 'Activity deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/sections/${activity?.section_id}/activities`);
  }

  // ── Volunteers ───────────────────────────────────────────────────────

  @Post('editions/:id/volunteers')
  addVolunteer(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.createVolunteer(parseInt(id, 10), parseInt(body.profile_id, 10));
      req.flash('success', 'Volunteer added.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${id}`);
  }

  @Post('volunteers/:id/delete')
  removeVolunteer(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.deleteVolunteer(parseInt(id, 10));
      req.flash('success', 'Volunteer removed.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(req.headers.referer || '/admin/festival');
  }

  // ── Locations ────────────────────────────────────────────────────────

  @Get('editions/:id/locations/new')
  @Render('festival/locations/form')
  newLocation(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    return this.ctx(req, { edition, location: null, volunteers: this.festivalService.getVolunteers(eid), isEdit: false });
  }

  @Post('editions/:id/locations')
  createLocation(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.createLocation({ edition_id: parseInt(id, 10), ...body, coordinator_id: body.coordinator_id ? parseInt(body.coordinator_id, 10) : null });
      req.flash('success', 'Location created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${id}`);
  }

  @Get('locations/:id/edit')
  @Render('festival/locations/form')
  editLocation(@Param('id') id: string, @Req() req: any) {
    const location = this.festivalService.findLocationById(parseInt(id, 10)) as any;
    const edition = this.festivalService.findEditionById(location?.edition_id);
    return this.ctx(req, { edition, location, volunteers: this.festivalService.getVolunteers(location?.edition_id), isEdit: true });
  }

  @Post('locations/:id')
  updateLocation(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const location = this.festivalService.findLocationById(parseInt(id, 10)) as any;
    try {
      this.festivalService.updateLocation(parseInt(id, 10), { ...body, coordinator_id: body.coordinator_id ? parseInt(body.coordinator_id, 10) : null });
      req.flash('success', 'Location updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${location?.edition_id}`);
  }

  @Post('locations/:id/delete')
  deleteLocation(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const location = this.festivalService.findLocationById(parseInt(id, 10)) as any;
    try {
      this.festivalService.deleteLocation(parseInt(id, 10));
      req.flash('success', 'Location deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${location?.edition_id}`);
  }

  // ── Guests ───────────────────────────────────────────────────────────

  @Get('editions/:id/guests/new')
  @Render('festival/guests/form')
  newGuest(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    return this.ctx(req, { edition, guest: null, profiles: this.festivalService.getProfilesNotGuest(eid), isEdit: false });
  }

  @Post('editions/:id/guests')
  createGuest(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      const roles = body.roles ? (Array.isArray(body.roles) ? body.roles : [body.roles]) : [];
      this.festivalService.createGuest(parseInt(id, 10), parseInt(body.profile_id, 10), roles);
      req.flash('success', 'Guest added.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${id}`);
  }

  @Get('guests/:id/edit')
  @Render('festival/guests/form')
  editGuest(@Param('id') id: string, @Req() req: any) {
    const guest = this.festivalService.findGuestById(parseInt(id, 10));
    const edition = this.festivalService.findEditionById(guest?.edition_id);
    return this.ctx(req, { edition, guest, profiles: [], isEdit: true });
  }

  @Post('guests/:id')
  updateGuest(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const guest = this.festivalService.findGuestById(parseInt(id, 10));
    try {
      const roles = body.roles ? (Array.isArray(body.roles) ? body.roles : [body.roles]) : [];
      this.festivalService.updateGuestRoles(parseInt(id, 10), roles);
      req.flash('success', 'Guest updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${guest?.edition_id}`);
  }

  @Post('guests/:id/delete')
  deleteGuest(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const guest = this.festivalService.findGuestById(parseInt(id, 10));
    try {
      this.festivalService.deleteGuest(parseInt(id, 10));
      req.flash('success', 'Guest removed.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${guest?.edition_id}`);
  }

  // ── Sponsors ─────────────────────────────────────────────────────────

  @Get('editions/:id/sponsors/new')
  @Render('festival/sponsors/form')
  newSponsor(@Param('id') id: string, @Req() req: any) {
    const edition = this.festivalService.findEditionById(parseInt(id, 10));
    return this.ctx(req, { edition, sponsor: null, isEdit: false });
  }

  @Post('editions/:id/sponsors')
  createSponsor(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.createSponsor({ edition_id: parseInt(id, 10), ...body });
      req.flash('success', 'Sponsor created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${id}`);
  }

  @Get('sponsors/:id/edit')
  @Render('festival/sponsors/form')
  editSponsor(@Param('id') id: string, @Req() req: any) {
    const sponsor = this.festivalService.findSponsorById(parseInt(id, 10)) as any;
    const edition = this.festivalService.findEditionById(sponsor?.edition_id);
    return this.ctx(req, { edition, sponsor, isEdit: true });
  }

  @Post('sponsors/:id')
  updateSponsor(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const sponsor = this.festivalService.findSponsorById(parseInt(id, 10)) as any;
    try {
      this.festivalService.updateSponsor(parseInt(id, 10), body);
      req.flash('success', 'Sponsor updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${sponsor?.edition_id}`);
  }

  @Post('sponsors/:id/delete')
  deleteSponsor(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const sponsor = this.festivalService.findSponsorById(parseInt(id, 10)) as any;
    try {
      this.festivalService.deleteSponsor(parseInt(id, 10));
      req.flash('success', 'Sponsor deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${sponsor?.edition_id}`);
  }

  // ── Sponsor Discount Locations ───────────────────────────────────────

  @Get('sponsors/:id/discounts')
  @Render('festival/sponsors/discounts')
  sponsorDiscounts(@Param('id') id: string, @Req() req: any) {
    const sponsor = this.festivalService.findSponsorById(parseInt(id, 10)) as any;
    const edition = this.festivalService.findEditionById(sponsor?.edition_id);
    return this.ctx(req, { edition, sponsor, items: this.festivalService.getDiscountLocations(parseInt(id, 10)) });
  }

  @Post('sponsors/:id/discounts')
  createDiscount(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.createDiscountLocation({
        sponsor_id: parseInt(id, 10), name: body.name, address: body.address,
        discount_percent: parseInt(body.discount_percent, 10), redeem_max: parseInt(body.redeem_max, 10),
      });
      req.flash('success', 'Discount location added.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/sponsors/${id}/discounts`);
  }

  @Post('discounts/:id/delete')
  deleteDiscount(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.deleteDiscountLocation(parseInt(id, 10));
      req.flash('success', 'Discount location removed.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(req.headers.referer || '/admin/festival');
  }

  // ── Program ──────────────────────────────────────────────────────────

  @Get('editions/:id/program/new')
  @Render('festival/program/form')
  newProgramEntry(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    return this.ctx(req, {
      edition,
      locations: this.festivalService.getLocations(eid),
      activities: this.festivalService.getAllActivitiesForEdition(eid),
      guests: this.festivalService.getGuests(eid),
    });
  }

  @Post('editions/:id/program')
  createProgramEntry(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      const presenterIds = body.presenter_ids
        ? (Array.isArray(body.presenter_ids) ? body.presenter_ids : [body.presenter_ids]).map(Number)
        : [];
      this.festivalService.createProgramEntry({
        edition_id: parseInt(id, 10),
        location_id: parseInt(body.location_id, 10),
        activity_id: parseInt(body.activity_id, 10),
        starts_at: body.starts_at,
        ends_at: body.ends_at || null,
        presenter_ids: presenterIds,
      });
      req.flash('success', 'Program entry created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${id}`);
  }

  @Post('program/:id/delete')
  deleteProgramEntry(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.deleteProgramEntry(parseInt(id, 10));
      req.flash('success', 'Program entry deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(req.headers.referer || '/admin/festival');
  }

  // ── Tickets ──────────────────────────────────────────────────────────

  @Get('editions/:id/tickets')
  @Render('festival/tickets/index')
  tickets(@Param('id') id: string, @Query('page') page: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    return this.ctx(req, { festivalSubnav: 'tickets', edition, ...this.festivalService.getTickets(eid, parseInt(page, 10) || 1), profiles: this.festivalService.getProfiles() });
  }

  @Post('editions/:id/tickets')
  createTicket(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.createTicket({
        edition_id: parseInt(id, 10),
        holder_profile_id: parseInt(body.holder_profile_id, 10),
        code: body.code,
        guest_count: parseInt(body.guest_count, 10) || 0,
      });
      req.flash('success', 'Ticket created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${id}/tickets`);
  }

  @Post('tickets/:id/delete')
  deleteTicket(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.deleteTicket(parseInt(id, 10));
      req.flash('success', 'Ticket deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(req.headers.referer || '/admin/festival');
  }

  // ── Staff Members ────────────────────────────────────────────────────

  @Post('editions/:id/staff')
  addStaff(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.addStaffMember(parseInt(id, 10), parseInt(body.member_id, 10));
      req.flash('success', 'Staff member added.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${id}`);
  }

  @Post('editions/:id/staff/:memberId/delete')
  removeStaff(@Param('id') id: string, @Param('memberId') memberId: string, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.removeStaffMember(parseInt(id, 10), parseInt(memberId, 10));
      req.flash('success', 'Staff member removed.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${id}`);
  }

  // ── Blog Tags ────────────────────────────────────────────────────────

  @Get('blog-tags')
  @Render('festival/blog-tags/index')
  blogTags(@Req() req: any) {
    return this.ctx(req, { items: this.festivalService.findAllBlogTags() });
  }

  @Post('blog-tags')
  createBlogTag(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.createBlogTag(body.name);
      req.flash('success', 'Tag created.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/festival/blog-tags');
  }

  @Post('blog-tags/:id/delete')
  deleteBlogTag(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.deleteBlogTag(parseInt(id, 10));
      req.flash('success', 'Tag deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect('/admin/festival/blog-tags');
  }
}
