import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, MinLength, MaxLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectPriority } from '@pdca/database';

export class CreateProjectDto {
  @ApiProperty({ example: 'Redução de Lead Time de Entrega' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 'PDCA', enum: ['PDCA', 'DMAIC', 'KAIZEN', 'LEAN'] })
  @IsOptional()
  @IsString()
  methodology?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  areaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sponsorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  problemStatement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  goals?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outOfScope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedSavings?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capexBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  opexBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  financialImpact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  slaHours?: number;

  @ApiPropertyOptional({ enum: ProjectPriority, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
