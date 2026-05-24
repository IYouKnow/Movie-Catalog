# Movie Catalog

A small personal app to track movies and series you have watched.

Features:

- Email/password login
- Search titles with OMDb
- Save watched entries with your rating
- Import and export your catalog
- SQLite storage for simple self-hosting

## Local Development

1. Create a `.env` file based on `.env.example`.
2. Install dependencies:

```bash
npm install
```

3. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Docker / CasaOS

This project includes a lightweight Docker setup for self-hosting.

1. Set `AUTH_SECRET` in `docker-compose.yml`.
2. Set `OMDB_API_KEY` in `docker-compose.yml`.
3. Start the container:

```bash
docker compose up -d --build
```

Open `http://localhost:3000`.

Notes:

- The SQLite database is stored in a Docker volume.
- On first boot, the container creates the database automatically.
- For CasaOS, import `docker-compose.yml` and edit the environment values in the UI.

## CasaOS

For CasaOS, use [docker-compose.casaos.yml](/d:/3DEV/Code/1Projects/8MovieCatalog/docker-compose.casaos.yml:1) instead of the local development compose file.

It is different in two important ways:

- It uses a published image: `ghcr.io/iyouknow/catalog:latest`
- It stores the database in `/DATA/AppData/movie-catalog` on the host

If you install it manually in CasaOS, use:

- Docker Image: `ghcr.io/iyouknow/catalog`
- Tag: `latest` or a newer fixed release such as `v0.1.1`
- Host port: `3000`
- Container port: `3000`
- Volume: `/DATA/AppData/movie-catalog` -> `/app/data`
- `DATABASE_URL=file:/app/data/movie-catalog.db`
- `AUTH_SECRET=...`
- `OMDB_API_KEY=...`
