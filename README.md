# Chatty

Chatty is a single-origin, real-time chat application built with React, Express, MongoDB,
Socket.IO, and Cloudinary. It supports cookie-based authentication, profiles, presence,
one-to-one text/image messages, and local theme preferences.

## Requirements

- Node.js 24 and npm 11
- MongoDB
- A Cloudinary account for image uploads

## Setup

```bash
npm ci
cp backend/.env.example backend/.env
npm run dev
```

Fill every value in `backend/.env` before starting. `JWT_SECRET` must contain at least 32
characters. The development frontend runs at `http://localhost:5173` and the API at
`http://localhost:5001` by default.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the API and Vite development servers |
| `npm run lint` | Lint both workspaces |
| `npm test` | Run backend and frontend tests |
| `npm run test:e2e` | Run the two-user browser smoke test |
| `npm run test:coverage` | Generate coverage reports |
| `npm run build` | Build the production frontend |
| `npm start` | Start the production server |
| `npm run audit:prod` | Audit production dependencies |
| `npm run seed --workspace backend` | Insert development demo users idempotently |

## Production

Set `NODE_ENV=production`, configure all environment variables, run `npm ci` and
`npm run build`, then start with `npm start`. Express serves `frontend/dist`, `/api`, and
Socket.IO from the same origin. TLS must terminate at the application or its reverse proxy
so the secure session cookie can be used.

The application refuses to listen until configuration is valid and MongoDB is connected.
Use `GET /api/health` for readiness checks. Deployments should allow up to ten seconds for
SIGTERM shutdown.

Image uploads accept JPEG, PNG, WebP, and GIF files up to 5 MiB. For multiple backend
instances, add a Socket.IO Redis adapter and shared presence before scaling horizontally.

## Legacy seed password repair

Older versions stored demo seed passwords in plaintext. Preview affected records:

```bash
npm run repair:passwords --workspace backend
```

After reviewing the count and taking a database backup, apply the repair:

```bash
npm run repair:passwords --workspace backend -- --apply
```

## Backup and recovery

Back up MongoDB before schema maintenance or password repair using the managed provider's
snapshot tooling or `mongodump`. Test `mongorestore` in a non-production environment.
Cloudinary assets are external to the database and require a separate Cloudinary backup or
retention policy.

## Troubleshooting

- A startup configuration error names each missing or invalid environment value.
- A `503` response from `/api/health` means MongoDB is not ready.
- Browser login failures in production usually indicate missing HTTPS or a reverse proxy
  that is not forwarding the original host/protocol.
- Image upload failures require valid Cloudinary credentials and a supported file under
  5 MiB.

## License

MIT
