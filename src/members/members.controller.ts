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
import { MembersService } from './members.service';

@Controller('admin/members')
@UseGuards(AuthenticatedGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @Render('members/index')
  index(@Query('page') page: string, @Req() req: any) {
    const p = parseInt(page, 10) || 1;
    const result = this.membersService.findAll(p);
    return {
      layout: 'layouts/main',
      currentRoute: 'members',
      user: req.user,
      flash: req.session._flashMessages,
      ...result,
    };
  }

  @Get('new')
  @Render('members/form')
  newForm(@Req() req: any) {
    const profiles = this.membersService.getProfilesWithoutMember();
    return {
      layout: 'layouts/main',
      currentRoute: 'members',
      user: req.user,
      flash: req.session._flashMessages,
      member: null,
      profiles,
      isEdit: false,
    };
  }

  @Post()
  create(@Body() body: any, @Req() req: any, @Res() res: any) {
    try {
      this.membersService.create({
        profile_id: parseInt(body.profile_id, 10),
        joined_at: body.joined_at,
        member_category: body.member_category,
        full_member_kind: body.full_member_kind || undefined,
      });
      req.flash('success', 'Member created successfully.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/members');
  }

  @Get(':id/edit')
  @Render('members/form')
  editForm(@Param('id') id: string, @Req() req: any) {
    const member = this.membersService.findById(parseInt(id, 10));
    return {
      layout: 'layouts/main',
      currentRoute: 'members',
      user: req.user,
      flash: req.session._flashMessages,
      member,
      profiles: [],
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
      this.membersService.update(parseInt(id, 10), {
        joined_at: body.joined_at,
        member_category: body.member_category,
        full_member_kind: body.full_member_kind || undefined,
      });
      req.flash('success', 'Member updated successfully.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/members');
  }

  @Post(':id/delete')
  delete(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      this.membersService.delete(parseInt(id, 10));
      req.flash('success', 'Member deleted.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect('/admin/members');
  }

  @Get(':id/fees')
  @Render('members/fees')
  fees(@Param('id') id: string, @Req() req: any) {
    const member = this.membersService.findById(parseInt(id, 10)) as any;
    const fees = this.membersService.getFees(parseInt(id, 10));
    return {
      layout: 'layouts/main',
      currentRoute: 'members',
      user: req.user,
      flash: req.session._flashMessages,
      member,
      fees,
    };
  }

  @Post(':id/fees')
  createFee(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      this.membersService.createFee({
        member_id: parseInt(id, 10),
        year: parseInt(body.year, 10),
        amount: parseFloat(body.amount),
        status: body.status,
      });
      req.flash('success', 'Fee added.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/members/${id}/fees`);
  }

  @Post(':id/fees/:feeId')
  updateFee(
    @Param('id') id: string,
    @Param('feeId') feeId: string,
    @Body() body: any,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      this.membersService.updateFee(parseInt(feeId, 10), {
        amount: parseFloat(body.amount),
        status: body.status,
      });
      req.flash('success', 'Fee updated.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/members/${id}/fees`);
  }

  @Post(':id/fees/:feeId/delete')
  deleteFee(
    @Param('id') id: string,
    @Param('feeId') feeId: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    try {
      this.membersService.deleteFee(parseInt(feeId, 10));
      req.flash('success', 'Fee deleted.');
    } catch (e: any) {
      req.flash('error', e.message);
    }
    res.redirect(`/admin/members/${id}/fees`);
  }
}
