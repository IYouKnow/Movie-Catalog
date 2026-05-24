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
