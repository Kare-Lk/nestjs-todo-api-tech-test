import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type AuthenticatedUser = {
  userId: string;
  email: string;
};

type RequestWithUser = {
  user?: AuthenticatedUser;
};

export const CurrentUser = createParamDecorator<
  keyof AuthenticatedUser | undefined
>((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  const user = request.user;

  if (data === undefined) return user;

  return user?.[data];
});
