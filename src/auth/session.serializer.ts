import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(user: any, done: (err: Error | null, user: any) => void): void {
    done(null, user.id);
  }

  deserializeUser(
    userId: number,
    done: (err: Error | null, payload: any) => void,
  ): void {
    const user = this.authService.findById(userId);
    done(null, user);
  }
}
