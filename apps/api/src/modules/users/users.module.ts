import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [MeController],
  providers: [UsersService],
  // Exported for the access-token guard, which loads the caller on every request.
  exports: [UsersService],
})
export class UsersModule {}
