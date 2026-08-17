import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, In, Repository } from "typeorm";
import { SpaceOrganisation } from "./space-organisations.entity";
import { PaginationService } from '../shared/pagination/pagination.service';
import { PaginationResult } from '../shared/pagination/pagination.interface';
import { FilterService } from "../shared/filter/filter.service";
import { SpaceOrganisationQueryDto } from "./DTO/space-organisation-query-dto";



@Injectable()
export class SpaceOrganisationRepository { 
    constructor(
        @InjectRepository(SpaceOrganisation)
        private readonly spaceOrganisationRepository: Repository<SpaceOrganisation>,
        private readonly PaginationService: PaginationService,
        private readonly filterService: FilterService
    ){}

    async findPaginated(options: SpaceOrganisationQueryDto): Promise<PaginationResult<SpaceOrganisation>> {
        let queryBuilder = this.spaceOrganisationRepository.createQueryBuilder('spaceOrganisation');

        queryBuilder = this.filterService.applySearch(queryBuilder, options.search, ['spaceOrganisation.name', 'spaceOrganisation.country']);

          const exactFilters: Array<{ field: string; value: unknown }> = [
            { field: 'spaceOrganisation.country', value: options.country },
        ];

        for (const { field, value } of exactFilters) {
            queryBuilder = this.filterService.applyExactFilter(queryBuilder, value, field);
        }

        queryBuilder = this.filterService.applyOrderFilter(queryBuilder, options.orderBy, options.orderDirection);

        return this.PaginationService.paginate(queryBuilder, options);
    }

    async findOne(options: FindOneOptions<SpaceOrganisation>) : Promise<SpaceOrganisation | null >{
        return this.spaceOrganisationRepository.findOne(options);
    }

    async findOneById(id: number): Promise<SpaceOrganisation | null>{
        return this.spaceOrganisationRepository.findOneBy({id});
    }

    async findByIds(ids: number[]): Promise<SpaceOrganisation[]> {
        return this.spaceOrganisationRepository.findBy({ id: In(ids) });
    }

    async findbyName(name: string): Promise<SpaceOrganisation | null>{
        return this.spaceOrganisationRepository.findOneBy({name});
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
