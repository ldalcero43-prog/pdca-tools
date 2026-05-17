import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './services/projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar projetos com filtros e paginação' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.projectsService.findAll(user, { status, search, page, limit });
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo projeto' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.create(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes completos do projeto' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar projeto' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateProjectDto>, @CurrentUser() user: any) {
    return this.projectsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Arquivar projeto (ADMIN/MANAGER)' })
  archive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.archive(id, user);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.getMembers(id, user);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role: string },
    @CurrentUser() user: any,
  ) {
    return this.projectsService.addMember(id, body.userId, body.role, user);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() user: any) {
    return this.projectsService.removeMember(id, userId, user);
  }

  @Get(':id/phases')
  getPhases(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.getPhases(id, user);
  }

  @Put(':id/phases/:phase')
  updatePhase(
    @Param('id') id: string,
    @Param('phase') phase: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.updatePhase(id, phase, data, user);
  }

  @Get(':id/milestones')
  getMilestones(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.getMilestones(id, user);
  }

  @Post(':id/milestones')
  createMilestone(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    return this.projectsService.createMilestone(id, data, user);
  }

  @Get(':id/activity')
  getActivity(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.getActivity(id, user);
  }
}
