import { Module } from '@nestjs/common';
import { DojoController } from './dojo.controller';
import { DojoService } from './dojo.service';

@Module({
  controllers: [DojoController],
  providers: [DojoService],
  exports: [DojoService],
})
export class DojoModule {}
