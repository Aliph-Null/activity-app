import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
