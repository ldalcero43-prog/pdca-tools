import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KpisService } from './kpis.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('KPIs')
@ApiBearerAuth()
@Controller('projects/:projectId/kpis')
export class KpisController {
  constructor(private readonly kpisService: KpisService) {}

  @Get()
  @ApiOperation({ summary: 'Listar KPIs do projeto' })
  getKpis(@Param('projectId') projectId: string) {
    return this.kpisService.getKpis(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar KPI' })
  create(@Param('projectId') projectId: string, @Body() dto: any) {
    return this.kpisService.createKpi(projectId, dto);
  }

  @Put(':kpiId')
  update(@Param('projectId') projectId: string, @Param('kpiId') kpiId: string, @Body() dto: any) {
    return this.kpisService.updateKpi(projectId, kpiId, dto);
  }

  @Get(':kpiId/measurements')
  getMeasurements(@Param('projectId') projectId: string, @Param('kpiId') kpiId: string) {
    return this.kpisService.getMeasurements(projectId, kpiId);
  }

  @Post(':kpiId/measurements')
  addMeasurement(
    @Param('projectId') projectId: string,
    @Param('kpiId') kpiId: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.kpisService.addMeasurement(projectId, kpiId, dto, user.id);
  }

  @Get(':kpiId/spc')
  @ApiOperation({ summary: 'Dados SPC/CEP calculados' })
  getSpc(@Param('projectId') projectId: string, @Param('kpiId') kpiId: string) {
    return this.kpisService.getSpcData(projectId, kpiId);
  }
}
