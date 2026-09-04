import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import { ErrorMessage } from '../enum/error.enum';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected errorMessage = ErrorMessage.TOO_MANY_REQUESTS;
}
