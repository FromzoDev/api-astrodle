import {Controller, Get, Request, Param, Post, Body, Patch, ParseIntPipe, Delete, HttpStatus, Query} from '@nestjs/common';
import { SpaceOrganisation } from './space-organisations.entity';
import { SuccessMessage } from '../common/enum/success.enum';
import { ApiResponse } from '../common/interfaces/response.interface';
import { PaginationDto } from '../shared/pagination/pagination-dto';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { Role } from '../common/enum/roles.enum';


@Controller('space-organisations')
export class SpaceOrganisationController{

    
}