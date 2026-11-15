# Pipeline DevSecOps para la detección automática de vulnerabilidades web

**Seguridad en el Desarrollo de Software** — UTN FRC — Ingeniería en Sistemas de Información
**Comisión:** 4K3A — **Año:** 2026

| Integrante | Legajo |
|---|---|
| Fabrizio Torres | 94231 |
| Tomas Morinigo | 95639 |
| Gonzalo Majlis | 95047 |
| Francisco Ochoa | 96065 |

## Qué es

Una app NestJS con dos ramas, `fixed` (segura) y `vulnerable` (con fallas a propósito), y un pipeline de GitHub Actions que analiza el código y **bloquea el merge a `main`** si encuentra vulnerabilidades.

## Requisitos

- Node.js 26 (ver `.nvmrc`)
- Docker y Docker Compose

## Cómo levantarlo

```bash
cp .env.example .env          # y cambiar JWT_SECRET: openssl rand -hex 32
docker compose up -d --build  # levanta app + Postgres
curl http://localhost:3000/health   # → {"status":"ok","db":"up"}
docker compose down
```

## Desarrollo local (sin contenedor para la app)

```bash
npm ci
docker compose up -d db   # solo la base
npm run start:dev
npm run test:e2e
```
