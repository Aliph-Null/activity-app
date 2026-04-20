import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { FestivalController } from './festival.controller';
import { FestivalService } from './festival.service';

@Module({
  imports: [ProfilesModule],
  controllers: [FestivalController],
  providers: [FestivalService],
  exports: [FestivalService],
})
export class FestivalModule {}
