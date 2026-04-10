import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/pipelines/zod-validation.pipeline';
import { AuthService } from './auth.service';
import {
  AuthCredentialsSchema,
  type AuthCredentialsDto,
} from './schemas/auth.schema';
import {
  AccessTokenSwaggerDto,
  AuthCredentialsSwaggerDto,
} from './dto/swagger-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: AuthCredentialsSwaggerDto })
  @ApiCreatedResponse({
    description: 'Usuario registrado correctamente',
    type: AccessTokenSwaggerDto,
  })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'El usuario ya existe' })
  @Post('register')
  register(
    @Body(new ZodValidationPipe(AuthCredentialsSchema))
    body: AuthCredentialsDto,
  ) {
    return this.authService.register(body.email, body.password);
  }

  @ApiOperation({ summary: 'Iniciar sesion' })
  @ApiBody({ type: AuthCredentialsSwaggerDto })
  @ApiCreatedResponse({
    description: 'Login exitoso',
    type: AccessTokenSwaggerDto,
  })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas' })
  @Post('login')
  login(
    @Body(new ZodValidationPipe(AuthCredentialsSchema))
    body: AuthCredentialsDto,
  ) {
    return this.authService.login(body.email, body.password);
  }
}
