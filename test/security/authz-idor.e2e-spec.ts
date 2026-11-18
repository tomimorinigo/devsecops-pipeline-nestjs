import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { ALICE, BOB, createTestApp, login } from '../helpers/app.js';

describe('VULN-02 IDOR: notes are only accessible by their owner', () => {
  let app: NestExpressApplication;
  let aliceCookie: string;
  let bobCookie: string;
  let aliceNoteId: number;

  beforeAll(async () => {
    app = await createTestApp();
    aliceCookie = await login(app, ALICE);
    bobCookie = await login(app, BOB);
    const res = await request(app.getHttpServer())
      .post('/notes')
      .set('Cookie', aliceCookie)
      .send({ title: 'idor-test', body: 'private to alice' })
      .expect(201);
    aliceNoteId = res.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('the owner can read their note', async () => {
    await request(app.getHttpServer())
      .get(`/notes/${aliceNoteId}`)
      .set('Cookie', aliceCookie)
      .expect(200);
  });

  it("user B gets 404 when reading user A's note", async () => {
    const res = await request(app.getHttpServer())
      .get(`/notes/${aliceNoteId}`)
      .set('Cookie', bobCookie);
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain('private to alice');
  });

  it("user B cannot delete user A's note", async () => {
    await request(app.getHttpServer())
      .delete(`/notes/${aliceNoteId}`)
      .set('Cookie', bobCookie)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/notes/${aliceNoteId}`)
      .set('Cookie', aliceCookie)
      .expect(200);
  });

  it("the notes list only contains the user's own notes", async () => {
    const res = await request(app.getHttpServer())
      .get('/notes')
      .set('Cookie', bobCookie)
      .expect(200);
    const ids = (res.body as { id: number }[]).map((note) => note.id);
    expect(ids).not.toContain(aliceNoteId);
  });

  it('without a session the notes are not accessible', async () => {
    await request(app.getHttpServer()).get('/notes').expect(401);
  });
});
