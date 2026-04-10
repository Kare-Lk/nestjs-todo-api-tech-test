import { Body, Controller, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipelines/zod-validation.pipeline';
import { AuthService } from './auth.service';
import {
  AuthCredentialsSchema,
  type AuthCredentialsDto,
} from './schemas/auth.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(AuthCredentialsSchema))
    body: AuthCredentialsDto,
  ) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  login(
    @Body(new ZodValidationPipe(AuthCredentialsSchema))
    body: AuthCredentialsDto,
  ) {
    return this.authService.login(body.email, body.password);
  }
}
