import { ApiProperty } from '@nestjs/swagger';

export class AuthCredentialsSwaggerDto {
  @ApiProperty({ example: 'user@test.com' })
  email!: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  password!: string;
}

export class AccessTokenSwaggerDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  access_token!: string;
}
