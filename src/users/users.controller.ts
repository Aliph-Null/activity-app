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
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(AuthenticatedGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Render('users/index')
  index(@Query('page') page: string, @Req() req: any) {
    const p = parseInt(page, 10) || 1;
    const result = this.usersService.findAll(p);
    const roles = this.usersService.getAllRoles();
    return {
      layout: 'layouts/main',
      currentRoute: 'users',
      user: req.user,
      flash: req.session._flashMessages,
      roles,
      ...result,
    };
  }

  @Get('new')
  @Render('users/form')
  newForm(@Req() req: any) {
    const profiles = this.usersService.getProfilesWithoutUser();
    const roles = this.usersService.getAllRoles();
    return {
      layout: 'layouts/main',
      currentRoute: 'users',
      user: req.user,
      flash: req.session._flashMessages,
      editUser: null,
      profiles,
      roles,
      isEdit: false,
    };
  }

  @Post()
  create(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      const roleIds = body.role_ids
        ? (Array.isArray(body.role_ids) ? body.role_ids : [body.role_ids]).map(Number)
        : [];
      this.usersService.create({
        profile_id: parseInt(body.profile_id, 10),
        username: body.username,
        password: body.password,
        role_ids: roleIds,
      });
      req.flash('success', 'User created successfully.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/users');
  }

  @Get(':id/edit')
  @Render('users/form')
  editForm(@Param('id') id: string, @Req() req: any) {
    const editUser = this.usersService.findById(parseInt(id, 10));
    const roles = this.usersService.getAllRoles();
    return {
      layout: 'layouts/main',
      currentRoute: 'users',
      user: req.user,
      flash: req.session._flashMessages,
      editUser,
      profiles: [],
      roles,
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
      const roleIds = body.role_ids
        ? (Array.isArray(body.role_ids) ? body.role_ids : [body.role_ids]).map(Number)
        : [];
      this.usersService.update(parseInt(id, 10), {
        username: body.username,
        password: body.password || undefined,
        role_ids: roleIds,
      });
      req.flash('success', 'User updated successfully.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/users');
  }

  @Post(':id/delete')
  delete(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.usersService.delete(parseInt(id, 10));
      req.flash('success', 'User deleted.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/users');
  }

  @Post('roles/create')
  createRole(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.usersService.createRole(body.name);
      req.flash('success', `Role "${body.name}" created.`);
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/users');
  }

  @Post('roles/:id/delete')
  deleteRole(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.usersService.deleteRole(parseInt(id, 10));
      req.flash('success', 'Role deleted.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/users');
  }
}
