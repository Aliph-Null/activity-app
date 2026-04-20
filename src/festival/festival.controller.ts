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
    const ed = extra.edition as { id?: number } | undefined;
    if (ed?.id != null) {
      req.session.festivalAdminEditionId = ed.id;
    }
    return {
      layout: 'layouts/main',
      currentRoute: 'festival',
      user: req.user,
      flash: req.session._flashMessages,
      festivalNavEditionId: req.session?.festivalAdminEditionId ?? null,
      ...extra,
    };
  }

  private parsePresenterIds(body: any): number[] {
    if (!body.presenter_ids) return [];
    const raw = Array.isArray(body.presenter_ids) ? body.presenter_ids : [body.presenter_ids];
    return raw.map((x) => parseInt(String(x), 10)).filter((n) => Number.isFinite(n));
  }

  /** Resolve optional guest: new profile+guest (name filled), else existing guest id, or none. */
  private resolveGuestIdForActivity(body: any, editionId: number): number | null {
    const newName = typeof body.new_guest_name === 'string' ? body.new_guest_name.trim() : '';
    if (newName) {
      const roles = body.new_guest_roles
        ? (Array.isArray(body.new_guest_roles) ? body.new_guest_roles : [body.new_guest_roles])
        : ['speaker'];
      return this.festivalService.createProfileAndGuest(
        editionId,
        {
          name: newName,
          email: body.new_guest_email || undefined,
          phone: body.new_guest_phone || undefined,
        },
        roles.filter((r: string) => typeof r === 'string' && r.length),
      );
    }
    if (body.guest_id != null && body.guest_id !== '') {
      return parseInt(String(body.guest_id), 10);
    }
    return null;
  }

  private programDatetimeForInput(val: string | null | undefined): string {
    if (!val) return '';
    return String(val).replace(' ', 'T').slice(0, 16);
  }

  // ── Editions ─────────────────────────────────────────────────────────

  @Get()
  @Render('festival/editions/index')
  editions(@Req() req: any) {
    return this.ctx(req, { festivalSubsection: 'editions', items: this.festivalService.findAllEditions() });
  }

  @Get('editions/new')
  @Render('festival/editions/form')
  newEdition(@Req() req: any) {
    return this.ctx(req, { festivalSubsection: 'editions', edition: null, blogTags: this.festivalService.getAllBlogTags(), isEdit: false });
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
    return this.ctx(req, { festivalSubsection: 'editions', festivalSubnav: 'edit', edition, blogTags: this.festivalService.getAllBlogTags(), isEdit: true });
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

  // ── Edition hubs (must be registered before GET editions/:id) ────────

  @Get('editions/:id/activities')
  @Render('festival/editions/activities-hub')
  editionActivitiesHub(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    if (!edition) {
      req.flash('error', 'Edition not found.');
      return this.ctx(req, { festivalSubsection: 'activities', festivalSubnav: 'activities', edition: null, items: [], sections: [] });
    }
    return this.ctx(req, {
      festivalSubsection: 'activities',
      festivalSubnav: 'activities',
      edition,
      items: this.festivalService.getActivitiesForEdition(eid),
      sections: this.festivalService.getSections(eid),
    });
  }

  @Get('editions/:id/activities/new')
  @Render('festival/activities/form')
  newActivityForEdition(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    if (!edition) {
      req.flash('error', 'Edition not found.');
      return this.ctx(req, { edition: null, section: null, sections: [], activity: {} as any, guests: [], isEdit: false, activityHub: true });
    }
    const sections = this.festivalService.getSections(eid);
    return this.ctx(req, {
      edition,
      section: null,
      sections,
      activity: {} as any,
      guests: this.festivalService.getGuests(eid),
      isEdit: false,
      activityHub: true,
      cancelHref: `/admin/festival/editions/${eid}/activities`,
    });
  }

  @Post('editions/:id/activities')
  createActivityForEdition(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const eid = parseInt(id, 10);
    const sectionId = parseInt(body.section_id, 10);
    try {
      if (!Number.isFinite(sectionId)) throw new Error('Section is required.');
      const section = this.festivalService.getSectionById(sectionId);
      if (!section || section.edition_id !== eid) throw new Error('Invalid section for this edition.');
      const guestId = this.resolveGuestIdForActivity(body, eid);
      this.festivalService.createActivity({ section_id: sectionId, ...body, guest_id: guestId });
      req.flash('success', 'Activity created.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/festival/editions/${id}/activities`);
  }

  @Get('editions/:id/locations')
  @Render('festival/editions/locations-hub')
  editionLocationsHub(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    if (!edition) {
      req.flash('error', 'Edition not found.');
      return this.ctx(req, { festivalSubsection: 'locations', festivalSubnav: 'locations', edition: null, items: [] });
    }
    return this.ctx(req, {
      festivalSubsection: 'locations',
      festivalSubnav: 'locations',
      edition,
      items: this.festivalService.getLocations(eid),
    });
  }

  @Get('editions/:id/program')
  @Render('festival/editions/program-hub')
  editionProgramHub(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    if (!edition) {
      req.flash('error', 'Edition not found.');
      return this.ctx(req, { festivalSubsection: 'program', festivalSubnav: 'program', edition: null, program: [] });
    }
    return this.ctx(req, {
      festivalSubsection: 'program',
      festivalSubnav: 'program',
      edition,
      program: this.festivalService.getProgram(eid),
    });
  }

  @Get('editions/:id/sponsors')
  @Render('festival/editions/sponsors-hub')
  editionSponsorsHub(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    if (!edition) {
      req.flash('error', 'Edition not found.');
      return this.ctx(req, { festivalSubsection: 'sponsors', festivalSubnav: 'sponsors', edition: null, items: [] });
    }
    return this.ctx(req, {
      festivalSubsection: 'sponsors',
      festivalSubnav: 'sponsors',
      edition,
      items: this.festivalService.getSponsors(eid),
    });
  }

  // ── Edition Detail (overview) ────────────────────────────────────────

  @Get('editions/:id')
  @Render('festival/editions/show')
  showEdition(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    return this.ctx(req, {
      festivalSubsection: 'edition',
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
    const edition = section ? this.festivalService.findEditionById(section.edition_id) : null;
    return this.ctx(req, {
      section,
      edition,
      sections: section ? this.festivalService.getSections(section.edition_id) : [],
      activity: {} as any,
      guests: section ? this.festivalService.getGuests(section.edition_id) : [],
      isEdit: false,
      activityHub: false,
      cancelHref: `/admin/festival/sections/${sectionId}/activities`,
    });
  }

  @Post('sections/:sectionId/activities')
  createActivity(@Param('sectionId') sectionId: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const sid = parseInt(sectionId, 10);
    const section = this.festivalService.getSectionById(sid);
    try {
      const guestId = section ? this.resolveGuestIdForActivity(body, section.edition_id) : null;
      this.festivalService.createActivity({ section_id: sid, ...body, guest_id: guestId });
      req.flash('success', 'Activity created.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    const dest = body.return_to === 'hub' && section
      ? `/admin/festival/editions/${section.edition_id}/activities`
      : `/admin/festival/sections/${sectionId}/activities`;
    res.redirect(dest);
  }

  @Get('activities/:id/edit')
  @Render('festival/activities/form')
  editActivity(@Param('id') id: string, @Query('returnTo') returnTo: string, @Req() req: any) {
    const activity = this.festivalService.findActivityById(parseInt(id, 10)) as any;
    const section = this.festivalService.getSectionById(activity?.section_id);
    const edition = section ? this.festivalService.findEditionById(section.edition_id) : null;
    const cancelHref = returnTo === 'hub' && edition
      ? `/admin/festival/editions/${edition.id}/activities`
      : (section ? `/admin/festival/sections/${section.id}/activities` : '/admin/festival');
    return this.ctx(req, {
      section,
      edition,
      sections: section ? this.festivalService.getSections(section.edition_id) : [],
      activity,
      guests: section ? this.festivalService.getGuests(section.edition_id) : [],
      isEdit: true,
      activityHub: returnTo === 'hub',
      returnTo: returnTo === 'hub' ? 'hub' : '',
      cancelHref,
    });
  }

  @Post('activities/:id')
  updateActivity(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const activity = this.festivalService.findActivityById(parseInt(id, 10)) as any;
    const section = this.festivalService.getSectionById(activity?.section_id);
    try {
      const guestId = section ? this.resolveGuestIdForActivity(body, section.edition_id) : null;
      this.festivalService.updateActivity(parseInt(id, 10), { ...body, guest_id: guestId });
      req.flash('success', 'Activity updated.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    const dest = body.return_to === 'hub' && section
      ? `/admin/festival/editions/${section.edition_id}/activities`
      : `/admin/festival/sections/${activity?.section_id}/activities`;
    res.redirect(dest);
  }

  @Post('activities/:id/delete')
  deleteActivity(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const activity = this.festivalService.findActivityById(parseInt(id, 10)) as any;
    const section = this.festivalService.getSectionById(activity?.section_id);
    try {
      this.festivalService.deleteActivity(parseInt(id, 10));
      req.flash('success', 'Activity deleted.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    const dest = body.return_to === 'hub' && section
      ? `/admin/festival/editions/${section.edition_id}/activities`
      : `/admin/festival/sections/${activity?.section_id}/activities`;
    res.redirect(dest);
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
    return this.ctx(req, {
      edition,
      location: null,
      volunteers: this.festivalService.getVolunteers(eid),
      isEdit: false,
      cancelHref: `/admin/festival/editions/${eid}/locations`,
    });
  }

  @Post('editions/:id/locations')
  createLocation(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const eid = parseInt(id, 10);
    try {
      let coordinatorId: number | null = body.coordinator_id ? parseInt(body.coordinator_id, 10) : null;
      if (body.coordinator_mode === 'new') {
        const name = typeof body.coord_profile_name === 'string' ? body.coord_profile_name.trim() : '';
        if (!name) throw new Error('Coordinator name is required.');
        coordinatorId = this.festivalService.createProfileAndVolunteer(eid, {
          name,
          email: body.coord_profile_email || undefined,
          phone: body.coord_profile_phone || undefined,
        });
      }
      this.festivalService.createLocation({
        edition_id: eid,
        ...body,
        coordinator_id: coordinatorId,
      });
      req.flash('success', 'Location created.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/festival/editions/${id}/locations`);
  }

  @Get('locations/:id/edit')
  @Render('festival/locations/form')
  editLocation(@Param('id') id: string, @Req() req: any) {
    const location = this.festivalService.findLocationById(parseInt(id, 10)) as any;
    const edition = this.festivalService.findEditionById(location?.edition_id);
    return this.ctx(req, {
      edition,
      location,
      volunteers: this.festivalService.getVolunteers(location?.edition_id),
      isEdit: true,
      cancelHref: `/admin/festival/editions/${location?.edition_id}/locations`,
    });
  }

  @Post('locations/:id')
  updateLocation(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const location = this.festivalService.findLocationById(parseInt(id, 10)) as any;
    try {
      let coordinatorId: number | null = body.coordinator_id ? parseInt(body.coordinator_id, 10) : null;
      if (body.coordinator_mode === 'new') {
        const name = typeof body.coord_profile_name === 'string' ? body.coord_profile_name.trim() : '';
        if (!name) throw new Error('Coordinator name is required.');
        coordinatorId = this.festivalService.createProfileAndVolunteer(location.edition_id, {
          name,
          email: body.coord_profile_email || undefined,
          phone: body.coord_profile_phone || undefined,
        });
      }
      this.festivalService.updateLocation(parseInt(id, 10), {
        ...body,
        coordinator_id: coordinatorId,
      });
      req.flash('success', 'Location updated.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/festival/editions/${location?.edition_id}/locations`);
  }

  @Post('locations/:id/delete')
  deleteLocation(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const location = this.festivalService.findLocationById(parseInt(id, 10)) as any;
    try {
      this.festivalService.deleteLocation(parseInt(id, 10));
      req.flash('success', 'Location deleted.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/festival/editions/${location?.edition_id}/locations`);
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
    return this.ctx(req, {
      edition,
      sponsor: null,
      isEdit: false,
      cancelHref: `/admin/festival/editions/${id}/sponsors`,
    });
  }

  @Post('editions/:id/sponsors')
  createSponsor(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.createSponsor({ edition_id: parseInt(id, 10), ...body });
      req.flash('success', 'Sponsor created.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/festival/editions/${id}/sponsors`);
  }

  @Get('sponsors/:id/edit')
  @Render('festival/sponsors/form')
  editSponsor(@Param('id') id: string, @Req() req: any) {
    const sponsor = this.festivalService.findSponsorById(parseInt(id, 10)) as any;
    const edition = this.festivalService.findEditionById(sponsor?.edition_id);
    return this.ctx(req, {
      edition,
      sponsor,
      isEdit: true,
      cancelHref: `/admin/festival/editions/${sponsor?.edition_id}/sponsors`,
    });
  }

  @Post('sponsors/:id')
  updateSponsor(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const sponsor = this.festivalService.findSponsorById(parseInt(id, 10)) as any;
    try {
      this.festivalService.updateSponsor(parseInt(id, 10), body);
      req.flash('success', 'Sponsor updated.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/festival/editions/${sponsor?.edition_id}/sponsors`);
  }

  @Post('sponsors/:id/delete')
  deleteSponsor(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const sponsor = this.festivalService.findSponsorById(parseInt(id, 10)) as any;
    try {
      this.festivalService.deleteSponsor(parseInt(id, 10));
      req.flash('success', 'Sponsor deleted.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/festival/editions/${sponsor?.edition_id}/sponsors`);
  }

  // ── Sponsor Discount Locations ───────────────────────────────────────

  @Get('sponsors/:id/discounts')
  @Render('festival/sponsors/discounts')
  sponsorDiscounts(@Param('id') id: string, @Req() req: any) {
    const sponsor = this.festivalService.findSponsorById(parseInt(id, 10)) as any;
    const edition = this.festivalService.findEditionById(sponsor?.edition_id);
    return this.ctx(req, {
      edition,
      sponsor,
      festivalSubnav: 'sponsors',
      festivalSubsection: 'sponsors',
      items: this.festivalService.getDiscountLocations(parseInt(id, 10)),
    });
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
      festivalSubnav: 'program',
      program: { presenter_ids: [] as number[] },
      locations: this.festivalService.getLocations(eid),
      activities: this.festivalService.getAllActivitiesForEdition(eid),
      guests: this.festivalService.getGuests(eid),
      isProgramEdit: false,
      cancelHref: `/admin/festival/editions/${eid}/program`,
    });
  }

  @Post('editions/:id/program')
  createProgramEntry(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.createProgramEntry({
        edition_id: parseInt(id, 10),
        location_id: parseInt(body.location_id, 10),
        activity_id: parseInt(body.activity_id, 10),
        starts_at: body.starts_at,
        ends_at: body.ends_at || null,
        presenter_ids: this.parsePresenterIds(body),
      });
      req.flash('success', 'Program entry created.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/festival/editions/${id}/program`);
  }

  @Get('program/:id/edit')
  @Render('festival/program/form')
  editProgramEntryForm(@Param('id') id: string, @Req() req: any) {
    const pid = parseInt(id, 10);
    const row = this.festivalService.findProgramEntryById(pid);
    if (!row) {
      req.flash('error', 'Program entry not found.');
      return this.ctx(req, {
        edition: null,
        program: null,
        locations: [],
        activities: [],
        guests: [],
        isProgramEdit: true,
      });
    }
    const eid = row.edition_id;
    const edition = this.festivalService.findEditionById(eid);
    const presenterIds = this.festivalService.getProgramPresenterGuestIds(pid);
    const program = {
      ...row,
      id: row.id,
      presenter_ids: presenterIds,
      starts_at: this.programDatetimeForInput(row.starts_at),
      ends_at: this.programDatetimeForInput(row.ends_at),
    };
    return this.ctx(req, {
      edition,
      festivalSubnav: 'program',
      program,
      locations: this.festivalService.getLocations(eid),
      activities: this.festivalService.getAllActivitiesForEdition(eid),
      guests: this.festivalService.getGuests(eid),
      isProgramEdit: true,
      cancelHref: `/admin/festival/editions/${eid}/program`,
    });
  }

  @Post('program/:id')
  updateProgramEntryPost(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const prog = this.festivalService.findProgramEntryById(parseInt(id, 10));
    try {
      if (!prog) throw new Error('Program entry not found.');
      this.festivalService.updateProgramEntry(parseInt(id, 10), {
        location_id: parseInt(body.location_id, 10),
        activity_id: parseInt(body.activity_id, 10),
        starts_at: body.starts_at,
        ends_at: body.ends_at || null,
        presenter_ids: this.parsePresenterIds(body),
      });
      req.flash('success', 'Program entry updated.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(prog ? `/admin/festival/editions/${prog.edition_id}/program` : '/admin/festival');
  }

  @Post('program/:id/delete')
  deleteProgramEntry(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const prog = this.festivalService.findProgramEntryById(parseInt(id, 10));
    try {
      this.festivalService.deleteProgramEntry(parseInt(id, 10));
      req.flash('success', 'Program entry deleted.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    const eid = prog?.edition_id;
    res.redirect(eid ? `/admin/festival/editions/${eid}/program` : (req.headers.referer || '/admin/festival'));
  }

  // ── Tickets ──────────────────────────────────────────────────────────

  @Get('editions/:id/tickets')
  @Render('festival/tickets/index')
  tickets(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('tab') tab: string,
    @Req() req: any,
  ) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    const activeTab = tab === 'redeemings' ? 'redeemings' : 'tickets';
    const p = parseInt(page, 10) || 1;
    const ticketData = this.festivalService.getTickets(eid, activeTab === 'tickets' ? p : 1);
    const redeemData = this.festivalService.getDiscountRedeemings(eid, activeTab === 'redeemings' ? p : 1);
    return this.ctx(req, {
      festivalSubsection: 'tickets',
      festivalSubnav: 'tickets',
      edition,
      activeTab,
      profiles: this.festivalService.getProfiles(),
      ...ticketData,
      redeemItems: redeemData.items,
      redeemTotal: redeemData.total,
      redeemPage: redeemData.page,
      redeemTotalPages: redeemData.totalPages,
      ticketsExtraQuery: undefined as string | undefined,
      redeemExtraQuery: 'tab=redeemings',
    });
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
