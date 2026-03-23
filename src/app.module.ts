import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { UsersModule } from './users/users.module';
import { MembersModule } from './members/members.module';
import { MeetupsModule } from './meetups/meetups.module';
import { DojoModule } from './dojo/dojo.module';
import { FestivalModule } from './festival/festival.module';
import { BlogModule } from './blog/blog.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    AuthModule,
    ProfilesModule,
    UsersModule,
    MembersModule,
    MeetupsModule,
    DojoModule,
    FestivalModule,
    BlogModule,
  ],
  controllers: [DashboardController],
})
export class AppModule {}
