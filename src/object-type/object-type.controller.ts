import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../common/interfaces/response.interface';
import { ObjectType, ObjectTypeMetadata } from '../common/enum/object-type.enum';
import { SuccessMessage } from '../common/enum/success.enum';

interface ObjectTypeResponse {
  value: ObjectType;
  label: string;
  description: string;
}

@Controller('object-types')
export class ObjectTypeController {
  @Get()
  getObjectTypes(): ApiResponse<ObjectTypeResponse[]> {
    const data = Object.entries(ObjectTypeMetadata).map(([value, meta]) => ({
      value: value as ObjectType,
      ...meta,
    }));

    return {
      code: HttpStatus.OK,
      message: SuccessMessage.OBJECT_TYPES_FETCHED,
      data,
    };
  }
}