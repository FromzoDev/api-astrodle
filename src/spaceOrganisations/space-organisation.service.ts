import {Controller, Get, Request, Param, Post, Body, Patch, ParseIntPipe, Delete, HttpStatus, Query, Injectable} from '@nestjs/common';
import { SpaceOrganisation } from './space-organisations.entity';
import { SuccessMessage } from '../common/enum/success.enum';
import { ApiResponse } from '../common/interfaces/response.interface';
import { PaginationDto } from '../shared/pagination/pagination-dto';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { Role } from '../common/enum/roles.enum';
import { SpaceOrganisationRepository } from './space-organisation.repository';


@Injectable()
export class SpaceOrganisationService   {
    constructor(private readonly spaceOrganisationRepository: SpaceOrganisationRepository) {

    }
}