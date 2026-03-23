import {
  Controller,
  Get,
  Post,
  Render,
  Req,
  Res,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { MeetupsService } from './meetups.service';

@Controller('admin/meetups')
@UseGuards(AuthenticatedGuard)
export class MeetupsController {
  constructor(private readonly meetupsService: MeetupsService) {}

  @Get()
  @Render('meetups/index')
  index(@Query('page') page: string, @Req() req: any) {
    const p = parseInt(page, 10) || 1;
    const result = this.meetupsService.findAll(p);
    return {
      layout: 'layouts/main',
      currentRoute: 'meetups',
      user: req.user,
      flash: req.session._flashMessages,
      ...result,
    };
  }

  @Get('new')
  @Render('meetups/form')
  newForm(@Req() req: any) {
    const profiles = this.meetupsService.getProfiles();
    return {
      layout: 'layouts/main',
      currentRoute: 'meetups',
      user: req.user,
      flash: req.session._flashMessages,
      meetup: null,
      profiles,
      isEdit: false,
    };
  }

  @Post()
  create(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.meetupsService.create({
        starts_at: body.starts_at,
        location: body.location,
        meetup_type: body.meetup_type,
        workshop_title: body.workshop_title || undefined,
        workshop_theme: body.workshop_theme || undefined,
        presenter_id: body.presenter_id ? parseInt(body.presenter_id, 10) : undefined,
        agenda: body.agenda || undefined,
      });
      req.flash('success', 'Meetup created successfully.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/meetups');
  }

  @Get(':id/edit')
  @Render('meetups/form')
  editForm(@Param('id') id: string, @Req() req: any) {
    const meetup = this.meetupsService.findById(parseInt(id, 10));
    const profiles = this.meetupsService.getProfiles();
    return {
      layout: 'layouts/main',
      currentRoute: 'meetups',
      user: req.user,
      flash: req.session._flashMessages,
      meetup,
      profiles,
      isEdit: true,
    };
  }

  @Post(':id')
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      this.meetupsService.update(parseInt(id, 10), {
        starts_at: body.starts_at,
        location: body.location,
        meetup_type: body.meetup_type,
        workshop_title: body.workshop_title || undefined,
        workshop_theme: body.workshop_theme || undefined,
        presenter_id: body.presenter_id ? parseInt(body.presenter_id, 10) : undefined,
        agenda: body.agenda || undefined,
      });
      req.flash('success', 'Meetup updated successfully.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/meetups');
  }

  @Post(':id/delete')
  delete(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.meetupsService.delete(parseInt(id, 10));
      req.flash('success', 'Meetup deleted.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/meetups');
  }
}
