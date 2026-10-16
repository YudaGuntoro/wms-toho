# Project deployment instructions

When the user asks for VPS update commands, read `docs/deploy-vps.md` and use
`deploy/update-vps.sh`. This is an existing installation: do not repeat setup,
ask again for known ports/database details, or replace its working configuration.

- VPS checkout: `/www/wwwroot/wms-toho`, branch `main`, run commands as root.
- Domain: `https://wms.toho.my.id`.
- Frontend: `wms-toho-fe:latest`, container `wms-toho-fe`, port `8098:3000`.
- Backend: `wms-toho-api:latest`, container `wms-toho-api`, port `5279:8080`.
- API network: `wms-toho-net`. MySQL container/host: `mysql_vps`, database
  `wms-system-toho`, port 3306. Both containers share `wms-toho-net`.
- Preserve live API credentials/environment. Do not print, commit, guess, or
  request passwords for routine updates. `/root/wms-toho-api.env` is an existing
  server-side configuration file; the update script snapshots live container env.
- Browser API requests are same-origin `/api`; do not introduce a public API host.
- Existing VPS Dockerfiles are `Dockerfile.fe` and `Dockerfile.api` at checkout
  root; they are not currently versioned in this repository.
- Commands: pull `origin/main`, then `bash deploy/update-vps.sh fe`, `be`, or `both`.
- A frontend-only update must not restart the API/MySQL or run migrations.
- Routine updates do not run migrations, replace Nginx config, reset networks,
  or change database credentials. Apply new migrations only when a change requires
  them; the part-location removal was already applied manually on the VPS.
- Do not claim to have executed a VPS update without actual SSH access/results.
