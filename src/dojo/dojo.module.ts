import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { DojoController } from './dojo.controller';
import { DojoService } from './dojo.service';

@Module({
  imports: [ProfilesModule],
  controllers: [DojoController],
  providers: [DojoService],
  exports: [DojoService],
})
export class DojoModule {}
