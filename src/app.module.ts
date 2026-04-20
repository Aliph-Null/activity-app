import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { FestivalViewLocalsInterceptor } from './festival/festival-view-locals.interceptor';

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
  providers: [
    { provide: APP_INTERCEPTOR, useClass: FestivalViewLocalsInterceptor },
  ],
})
export class AppModule {}
