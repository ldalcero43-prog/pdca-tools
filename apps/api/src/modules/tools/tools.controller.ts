import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tools')
@ApiBearerAuth()
@Controller('projects/:projectId/tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as ferramentas do projeto' })
  getAll(@Param('projectId') projectId: string, @CurrentUser() user: any) {
    return this.toolsService.getToolsForProject(projectId, user);
  }

  @Get(':toolType')
  @ApiOperation({ summary: 'Dados de uma ferramenta específica' })
  getOne(@Param('projectId') projectId: string, @Param('toolType') toolType: string, @CurrentUser() user: any) {
    return this.toolsService.getToolData(projectId, toolType, user);
  }

  @Post(':toolType')
  @ApiOperation({ summary: 'Criar ou atualizar dados de uma ferramenta' })
  save(
    @Param('projectId') projectId: string,
    @Param('toolType') toolType: string,
    @Body() body: { data: any; name?: string; isDraft?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.toolsService.saveToolData(projectId, toolType, body.data, user, body.name, body.isDraft);
  }

  @Put(':toolType')
  @ApiOperation({ summary: 'Atualizar dados de uma ferramenta (alias de POST)' })
  update(
    @Param('projectId') projectId: string,
    @Param('toolType') toolType: string,
    @Body() body: { data: any; name?: string; isDraft?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.toolsService.saveToolData(projectId, toolType, body.data, user, body.name, body.isDraft);
  }

  @Delete(':toolType')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover ferramenta do projeto' })
  delete(@Param('projectId') projectId: string, @Param('toolType') toolType: string, @CurrentUser() user: any) {
    return this.toolsService.deleteToolData(projectId, toolType, user);
  }
}
