import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('kanban')
  @ApiOperation({ summary: 'Kanban board — tarefas agrupadas por coluna' })
  getKanban(@Param('projectId') projectId: string, @CurrentUser() user: any) {
    return this.tasksService.getKanbanBoard(projectId, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tarefas com filtros' })
  getTasks(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('phase') phase?: string,
  ) {
    return this.tasksService.getTasks(projectId, { status, assigneeId, phase });
  }

  @Post()
  @ApiOperation({ summary: 'Criar tarefa' })
  create(@Param('projectId') projectId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.tasksService.createTask(projectId, dto, user);
  }

  @Put('reorder')
  @ApiOperation({ summary: 'Reordenar tarefa (drag & drop)' })
  reorder(@Param('projectId') projectId: string, @Body() dto: any) {
    return this.tasksService.reorderTask(projectId, dto);
  }

  @Get(':taskId')
  getTask(@Param('projectId') projectId: string, @Param('taskId') taskId: string) {
    return this.tasksService.getTask(projectId, taskId);
  }

  @Put(':taskId')
  update(@Param('projectId') projectId: string, @Param('taskId') taskId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.tasksService.updateTask(projectId, taskId, dto, user);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('projectId') projectId: string, @Param('taskId') taskId: string) {
    return this.tasksService.deleteTask(projectId, taskId);
  }
}
