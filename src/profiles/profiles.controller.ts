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
import { ProfilesService } from './profiles.service';

@Controller('admin/profiles')
@UseGuards(AuthenticatedGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @Render('profiles/index')
  index(@Query('page') page: string, @Req() req: any) {
    const p = parseInt(page, 10) || 1;
    const result = this.profilesService.findAll(p);
    return {
      layout: 'layouts/main',
      currentRoute: 'profiles',
      user: req.user,
      flash: req.session._flashMessages,
      ...result,
    };
  }

  @Get('new')
  @Render('profiles/form')
  newForm(@Req() req: any) {
    return {
      layout: 'layouts/main',
      currentRoute: 'profiles',
      user: req.user,
      flash: req.session._flashMessages,
      profile: null,
      isEdit: false,
    };
  }

  @Post()
  create(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.profilesService.create(body);
      req.flash('success', 'Profile created successfully.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/profiles');
  }

  @Get(':id/edit')
  @Render('profiles/form')
  editForm(@Param('id') id: string, @Req() req: any) {
    const profile = this.profilesService.findById(parseInt(id, 10));
    return {
      layout: 'layouts/main',
      currentRoute: 'profiles',
      user: req.user,
      flash: req.session._flashMessages,
      profile,
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
      this.profilesService.update(parseInt(id, 10), body);
      req.flash('success', 'Profile updated successfully.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/profiles');
  }

  @Post(':id/delete')
  delete(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.profilesService.delete(parseInt(id, 10));
      req.flash('success', 'Profile deleted.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/profiles');
  }
}
