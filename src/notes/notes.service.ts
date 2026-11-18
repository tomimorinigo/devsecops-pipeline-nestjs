import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNoteDto } from './create-note.dto.js';
import { Note } from './note.entity.js';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private readonly notes: Repository<Note>,
  ) {}

  findAllByOwner(ownerId: number) {
    return this.notes.find({ where: { ownerId }, order: { id: 'ASC' } });
  }

  // VULN-02: the note is looked up only by id, the owner is never checked (IDOR)
  async findOneByOwner(id: number, _ownerId: number) {
    const note = await this.notes.findOneBy({ id });
    if (!note) {
      throw new NotFoundException();
    }
    return note;
  }

  create(dto: CreateNoteDto, ownerId: number) {
    return this.notes.save(
      this.notes.create({ title: dto.title, body: dto.body, ownerId }),
    );
  }

  async remove(id: number, ownerId: number) {
    const note = await this.findOneByOwner(id, ownerId);
    await this.notes.remove(note);
  }
}
