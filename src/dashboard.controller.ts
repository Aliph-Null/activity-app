import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from './auth/authenticated.guard';
import { DatabaseService } from './database/database.service';

@Controller('admin')
@UseGuards(AuthenticatedGuard)
export class DashboardController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  @Render('dashboard/index')
  index(@Req() req: any) {
    const stats = this.db.getDb().prepare(`
      SELECT
        (SELECT COUNT(*) FROM profiles) AS totalProfiles,
        (SELECT COUNT(*) FROM members) AS totalMembers,
        (SELECT COUNT(*) FROM aspiring_members) AS aspiringMembers,
        (SELECT COUNT(*) FROM full_members) AS fullMembers,
        (SELECT COUNT(*) FROM meetups WHERE starts_at >= datetime('now')) AS upcomingMeetups,
        (SELECT starts_at FROM meetups WHERE starts_at >= datetime('now') ORDER BY starts_at LIMIT 1) AS nextMeetup
    `).get() as any;

    return {
      layout: 'layouts/main',
      currentRoute: 'dashboard',
      user: req.user,
      flash: req.session._flashMessages,
      stats,
    };
  }
}
