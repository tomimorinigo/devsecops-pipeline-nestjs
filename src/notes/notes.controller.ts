import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../auth/session.js';
import { CreateNoteDto } from './create-note.dto.js';
import { NotesService } from './notes.service.js';

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.notes.findAllByOwner(req.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notes.findOneByOwner(id, req.user.id);
  }

  @Post()
  create(@Body() dto: CreateNoteDto, @Req() req: AuthenticatedRequest) {
    return this.notes.create(dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notes.remove(id, req.user.id);
  }
}
