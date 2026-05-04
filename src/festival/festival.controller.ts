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
    const returnPath =
      typeof req.originalUrl === 'string' ? req.originalUrl.split('?')[0] : '/admin/festival';
    return {
      layout: 'layouts/main',
      currentRoute: 'festival',
      user: req.user,
      flash: req.session._flashMessages,
      festivalNavEditionId: req.session?.festivalAdminEditionId ?? null,
      allEditions: extra.allEditions ?? this.festivalService.findAllEditions(),
      switchEditionReturnTo: extra.switchEditionReturnTo ?? returnPath,
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

  /** Resolve current admin edition: ?edition=, then session if valid, else latest. Updates session when resolved. */
  private resolveCurrentEditionId(req: any, queryEdition?: string): number | null {
    const q = queryEdition != null && queryEdition !== '' ? parseInt(String(queryEdition), 10) : NaN;
    if (Number.isFinite(q)) {
      const ed = this.festivalService.findEditionById(q);
      if (ed) {
        req.session.festivalAdminEditionId = q;
        return q;
      }
    }
    const sid = req.session?.festivalAdminEditionId;
    if (sid != null && this.festivalService.findEditionById(sid)) {
      return sid;
    }
    const latest = this.festivalService.findLatestEditionId();
    if (latest != null) {
      req.session.festivalAdminEditionId = latest;
      return latest;
    }
    return null;
  }

  private buildScheduleByDay(
    rows: any[],
    presenterRows: { program_id: number; guest_id: number; profile_name: string }[],
  ) {
    const presMap = new Map<number, { guest_id: number; profile_name: string }[]>();
    for (const pr of presenterRows) {
      const list = presMap.get(pr.program_id) ?? [];
      list.push({ guest_id: pr.guest_id, profile_name: pr.profile_name });
      presMap.set(pr.program_id, list);
    }
    const scheduleByDay: { program_date: string; rows: any[] }[] = [];
    for (const row of rows) {
      const d = row.program_date ?? '';
      let bucket = scheduleByDay[scheduleByDay.length - 1];
      if (!bucket || bucket.program_date !== d) {
        bucket = { program_date: d, rows: [] };
        scheduleByDay.push(bucket);
      }
      bucket.rows.push({ ...row, presenters: presMap.get(row.program_id) ?? [] });
    }
    return scheduleByDay;
  }

  // ── Short aliases (session / latest edition) ─────────────────────────

  @Get('program')
  programAlias(@Req() req: any, @Res() res: any) {
    const id = this.resolveCurrentEditionId(req);
    return id ? res.redirect(`/admin/festival/editions/${id}/program`) : res.redirect('/admin/festival');
  }

  @Get('guests')
  guestsAlias(@Req() req: any, @Res() res: any) {
    const id = this.resolveCurrentEditionId(req);
    return id ? res.redirect(`/admin/festival/editions/${id}/guests`) : res.redirect('/admin/festival');
  }

  @Get('locations')
  locationsAlias(@Req() req: any, @Res() res: any) {
    const id = this.resolveCurrentEditionId(req);
    return id ? res.redirect(`/admin/festival/editions/${id}/locations`) : res.redirect('/admin/festival');
  }

  @Get('sponsors')
  sponsorsAlias(@Req() req: any, @Res() res: any) {
    const id = this.resolveCurrentEditionId(req);
    return id ? res.redirect(`/admin/festival/editions/${id}/sponsors`) : res.redirect('/admin/festival');
  }

  @Get('tickets')
  ticketsAlias(@Req() req: any, @Res() res: any) {
    const id = this.resolveCurrentEditionId(req);
    return id ? res.redirect(`/admin/festival/editions/${id}/tickets`) : res.redirect('/admin/festival');
  }

  @Post('current-edition')
  switchCurrentEdition(@Body() body: any, @Req() req: any, @Res() res: any) {
    const id = parseInt(String(body.edition_id), 10);
    const returnTo = typeof body.return_to === 'string' && body.return_to.startsWith('/admin/festival')
      ? body.return_to
      : '/admin/festival';
    if (Number.isFinite(id) && this.festivalService.findEditionById(id)) {
      req.session.festivalAdminEditionId = id;
      req.flash('success', 'Edition updated.');
    } else {
      req.flash('error', 'Invalid edition.');
    }
    res.redirect(returnTo);
  }

  // ── Editions ─────────────────────────────────────────────────────────

  @Get()
  @Render('festival/dashboard')
  festivalDashboard(@Req() req: any, @Query('edition') editionQuery: string) {
    const eid = this.resolveCurrentEditionId(req, editionQuery);
    if (!eid) {
      return this.ctx(req, {
        festivalSubsection: 'overview',
        festivalSubnav: 'overview',
        edition: null,
        ticketCount: 0,
        scheduleByDay: [] as { program_date: string; rows: any[] }[],
        sponsors: [],
      });
    }
    const edition = this.festivalService.findEditionById(eid);
    const scheduleRows = this.festivalService.getProgramScheduleRows(eid);
    const presenterRows = this.festivalService.getProgramPresenterRowsForEdition(eid);
    const scheduleByDay = this.buildScheduleByDay(scheduleRows, presenterRows);
    const ticketCount = this.festivalService.countTicketsForEdition(eid);
    const sponsors = this.festivalService.getSponsors(eid);
    return this.ctx(req, {
      festivalSubsection: 'overview',
      festivalSubnav: 'overview',
      edition,
      ticketCount,
      scheduleByDay,
      sponsors,
    });
  }

  @Get('editions')
  editionsCatalog(@Res() res: any) {
    res.redirect('/admin/festival');
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
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    return this.ctx(req, {
      edition,
      blogTags: this.festivalService.getAllBlogTags(),
      sections: edition ? this.festivalService.getSections(eid) : [],
      isEdit: true,
    });
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

  @Get('editions/:id/guests')
  @Render('festival/editions/guests-hub')
  editionGuestsHub(@Param('id') id: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    if (!edition) {
      req.flash('error', 'Edition not found.');
      return this.ctx(req, { festivalSubsection: 'guests', edition: null, items: [] });
    }
    return this.ctx(req, {
      festivalSubsection: 'guests',
      edition,
      items: this.festivalService.getGuests(eid),
    });
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
  editionProgramHub(@Param('id') id: string, @Query('page') page: string, @Req() req: any) {
    const eid = parseInt(id, 10);
    const edition = this.festivalService.findEditionById(eid);
    if (!edition) {
      req.flash('error', 'Edition not found.');
      return this.ctx(req, {
        festivalSubsection: 'program',
        festivalSubnav: 'program',
        edition: null,
        scheduleByDay: [],
        page: 1,
        totalPages: 1,
      });
    }
    const p = parseInt(page, 10) || 1;
    const { rows, total, page: pg, totalPages } = this.festivalService.getProgramScheduleRowsPaginated(eid, p, 25);
    const presenterRows = this.festivalService.getProgramPresenterRowsForEdition(eid);
    const idsOnPage = new Set(rows.map((r) => r.program_id));
    const filteredPresenters = presenterRows.filter((pr) => idsOnPage.has(pr.program_id));
    const scheduleByDay = this.buildScheduleByDay(rows, filteredPresenters);
    return this.ctx(req, {
      festivalSubsection: 'program',
      festivalSubnav: 'program',
      edition,
      scheduleByDay,
      page: pg,
      totalPages,
      totalRows: total,
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
    res.redirect(`/admin/festival/editions/${id}/edit`);
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
    res.redirect(`/admin/festival/editions/${section?.edition_id}/edit`);
  }

  @Post('sections/:id/delete')
  deleteSection(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const section = this.festivalService.getSectionById(parseInt(id, 10));
    try {
      this.festivalService.deleteSection(parseInt(id, 10));
      req.flash('success', 'Section deleted.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${section?.edition_id}/edit`);
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
    const cancelHref = returnTo === 'dashboard'
      ? '/admin/festival'
      : returnTo === 'program' && edition
        ? `/admin/festival/editions/${edition.id}/program`
        : returnTo === 'hub' && edition
          ? `/admin/festival/editions/${edition.id}/activities`
          : (section ? `/admin/festival/sections/${section.id}/activities` : '/admin/festival');
    const rt =
      returnTo === 'hub' ? 'hub' : returnTo === 'dashboard' ? 'dashboard' : returnTo === 'program' ? 'program' : '';
    return this.ctx(req, {
      section,
      edition,
      sections: section ? this.festivalService.getSections(section.edition_id) : [],
      activity,
      guests: section ? this.festivalService.getGuests(section.edition_id) : [],
      isEdit: true,
      activityHub: returnTo === 'hub',
      returnTo: rt,
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
    const dest = body.return_to === 'dashboard'
      ? '/admin/festival'
      : body.return_to === 'program' && section
        ? `/admin/festival/editions/${section.edition_id}/program`
        : body.return_to === 'hub' && section
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
    const dest = body.return_to === 'dashboard'
      ? '/admin/festival'
      : body.return_to === 'program' && section
        ? `/admin/festival/editions/${section.edition_id}/program`
        : body.return_to === 'hub' && section
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
      previousLocations: this.festivalService.getLocationsFromPreviousEdition(eid),
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
    return this.ctx(req, {
      edition,
      guest: null,
      profiles: this.festivalService.getProfilesNotGuest(eid),
      isEdit: false,
      cancelHref: `/admin/festival/editions/${eid}/guests`,
    });
  }

  @Post('editions/:id/guests')
  createGuest(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const eid = parseInt(id, 10);
    try {
      const roles = body.roles ? (Array.isArray(body.roles) ? body.roles : [body.roles]) : [];
      if (body.profile_mode === 'new') {
        const name = typeof body.new_profile_name === 'string' ? body.new_profile_name.trim() : '';
        if (!name) throw new Error('Profile name is required.');
        this.festivalService.createProfileAndGuest(eid, {
          name,
          email: body.new_profile_email || undefined,
          phone: body.new_profile_phone || undefined,
        }, roles.length ? roles : ['other']);
      } else {
        if (!body.profile_id) throw new Error('Please select a profile.');
        this.festivalService.createGuest(eid, parseInt(body.profile_id, 10), roles);
      }
      req.flash('success', 'Guest added.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${id}/guests`);
  }

  @Get('guests/:id/edit')
  @Render('festival/guests/form')
  editGuest(@Param('id') id: string, @Req() req: any) {
    const guest = this.festivalService.findGuestById(parseInt(id, 10));
    const edition = this.festivalService.findEditionById(guest?.edition_id);
    return this.ctx(req, {
      edition,
      guest,
      profiles: [],
      isEdit: true,
      cancelHref: `/admin/festival/editions/${guest?.edition_id}/guests`,
    });
  }

  @Post('guests/:id')
  updateGuest(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    const guest = this.festivalService.findGuestById(parseInt(id, 10));
    try {
      const roles = body.roles ? (Array.isArray(body.roles) ? body.roles : [body.roles]) : [];
      this.festivalService.updateGuestRoles(parseInt(id, 10), roles);
      req.flash('success', 'Guest updated.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${guest?.edition_id}/guests`);
  }

  @Post('guests/:id/delete')
  deleteGuest(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const guest = this.festivalService.findGuestById(parseInt(id, 10));
    try {
      this.festivalService.deleteGuest(parseInt(id, 10));
      req.flash('success', 'Guest removed.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(`/admin/festival/editions/${guest?.edition_id}/guests`);
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
    const sid = parseInt(id, 10);
    const sponsor = this.festivalService.findSponsorById(sid) as any;
    const edition = this.festivalService.findEditionById(sponsor?.edition_id);
    return this.ctx(req, {
      edition,
      sponsor,
      discounts: sponsor ? this.festivalService.getDiscountLocations(sid) : [],
      festivalSubsection: 'sponsors',
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
    res.redirect(`/admin/festival/sponsors/${id}/edit`);
  }

  @Post('discounts/:id')
  updateDiscount(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.festivalService.updateDiscountLocation(parseInt(id, 10), {
        name: body.name, address: body.address,
        discount_percent: parseInt(body.discount_percent, 10),
        redeem_max: parseInt(body.redeem_max, 10),
      });
      req.flash('success', 'Discount location updated.');
    } catch (e: any) { req.flash('error', e.message); }
    const dl = this.festivalService.findDiscountLocationById(parseInt(id, 10));
    res.redirect(dl ? `/admin/festival/sponsors/${dl.sponsor_id}/edit` : (req.headers.referer || '/admin/festival'));
  }

  @Post('discounts/:id/delete')
  deleteDiscount(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    const dl = this.festivalService.findDiscountLocationById(parseInt(id, 10));
    try {
      this.festivalService.deleteDiscountLocation(parseInt(id, 10));
      req.flash('success', 'Discount location removed.');
    } catch (e: any) { req.flash('error', e.message); }
    res.redirect(dl ? `/admin/festival/sponsors/${dl.sponsor_id}/edit` : (req.headers.referer || '/admin/festival'));
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
