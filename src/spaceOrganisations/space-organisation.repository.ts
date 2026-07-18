import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, Repository } from "typeorm";
import { SpaceOrganisation } from "./space-organisations.entity";
import { PaginationService } from '../shared/pagination/pagination.service';
import { PaginationDto } from '../shared/pagination/pagination-dto';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { privateDecrypt } from "crypto";
import { promises } from "dns";


@Injectable()
export class SpaceOrganisationRepository { 
    constructor(
        @InjectRepository(SpaceOrganisation)
        private readonly spaceOrganisationRepository: Repository<SpaceOrganisation>,
        private readonly PaginationService: PaginationService
    ){}

    async findPaginated(options: PaginationDto): Promise<PaginationResult<SpaceOrganisation>> {
        return this.PaginationService.paginate(this.spaceOrganisationRepository, options);
    }

    async findOne(options: FindOneOptions<SpaceOrganisation>) : Promise<SpaceOrganisation | null >{
        return this.spaceOrganisationRepository.findOne(options);
    }

    async findOneById(id: number): Promise<SpaceOrganisation | null>{
        return this.spaceOrganisationRepository.findOneBy({id});
    }

    async createSpaceOrganisation(SpaceOrganisationData: Partial<SpaceOrganisation>): Promise<SpaceOrganisation | null >{
        const spaceOrganisation = await this.spaceOrganisationRepository.create(SpaceOrganisationData)
        return await this.spaceOrganisationRepository.save(spaceOrganisation)
    }

    async updateSpaceOrganisation(id: number, updateData: Partial<SpaceOrganisation>): Promise<SpaceOrganisation | null >{
        await this.spaceOrganisationRepository.update(id, updateData);
        return await this.findOneById(id);
    }

    async deleteSpaceOrganisation(id: number): Promise<void>{
        await this.spaceOrganisationRepository.delete(id);
    }
}
