import {
  Controller,
  Get,
  Post,
  Render,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('admin')
export class AuthController {
  @Get('login')
  @Render('auth/login')
  loginPage(@Req() req: any) {
    if (req.isAuthenticated()) {
      return { redirect: '/admin' };
    }
    return {
      flash: req.session._flashMessages,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: any, @Res() res: any) {
    req.flash('success', `Welcome, ${req.user.username}!`);
    res.redirect('/admin');
  }

  @Get('logout')
  logout(@Req() req: any, @Res() res: any) {
    req.logout(() => {
      res.redirect('/admin/login');
    });
  }
}
