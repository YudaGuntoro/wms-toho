# WMS-Demo

Basic warehouse management demo system for **PT YKK AP Indonesia**.

## Included modules

- JWT login with the existing authentication flow
- Production dashboard and daily achievement
- PIC ID card verification
- Cutting list master data
- Production work order control
- Start, output update, and complete workflow
- Production activity log
- MySQL schema and demo data

## Default demo access

```text
Username: admin
Password: admin123
```

Demo PIC card:

```text
YKK-PIC-0001
```

## Database

MySQL 8 is required. From the repository root, run:

```powershell
mysql -u root -p -e "source database/production_control_monitoring.sql"
```

The script creates `wms-system-toho`, the login user, production tables,
and starter records. The production-only migration is also available at:

```text
WMS-Demo/WMS-Demo.Persistence/Migrations/20260707_001_production_control_monitoring.sql
```

## Run locally

API:

```powershell
$env:ConnectionStrings__DefaultConnection="Server=127.0.0.1;Port=3306;User ID=root;Password=YOUR_PASSWORD;Database=wms-system-toho;SslMode=None;AllowPublicKeyRetrieval=True;"
dotnet run --project WMS-Demo.WebAPI\WMS-Demo.WebAPI.csproj
```

Frontend, in another terminal:

```powershell
Set-Location Frontend
npm install
$env:API_PROXY_TARGET="http://localhost:5241"
npm run dev
```

Open `http://localhost:3000`.

## Core API

Core endpoints:

- `GET /api/production/dashboard`
- `GET|POST /api/production/work-orders`
- `POST /api/production/work-orders/scan`
- `POST /api/production/work-orders/{id}/scan-pic`
- `POST /api/production/work-orders/{id}/operators/{operatorId}/remove`
- `POST /api/production/work-orders/{id}/start`
- `POST /api/production/work-orders/{id}/finish`
- `POST /api/production/work-orders/{id}/cancel-finish`
- `GET|POST /api/production/cutting-lists`
- `GET /api/production/pic-cards`
- `GET /api/production/activity-logs`

## Master part import

For an existing warehouse database, apply `database/remove_part_location.sql`
before running the updated API. New installations use `database/parts.sql`. Master parts have no location
column; locations belong to stock movements. Existing stock movement locations are preserved.

In Master Data > Parts, choose **Import** and download the Excel template. Fill the first
worksheet starting at row 2; examples are on a separate reference worksheet. Import
`.xlsx` (first worksheet) or `.csv` with `Part Number` and `Part Name` as the
first two column headers. Imports accept up to 5 MB / 5,000 parts. Invalid rows or
duplicate part numbers reject the entire import. Location is entered during stock
in and stored on stock movements. Master parts do not define a standard location.

## Page and API caching

All application pages render dynamically and return no-store response headers.
Browser requests use same-origin `/api/...` and `cache: "no-store"`; static JS,
CSS, images and fonts keep separate caching rules. Local API forwarding is set
with `API_PROXY_TARGET` (default `http://127.0.0.1:5243`).

See `docs/deploy-vps.md` for the Nginx configuration and deployment checks.
After a production build, run `npm run check:cache -- http://localhost:3000`
from `Frontend` against the running production server.

## Routine VPS updates

Permanent FE-only, BE-only and combined update commands are in
[docs/deploy-vps.md](docs/deploy-vps.md). Pull `origin/main`, then run
`bash deploy/update-vps.sh fe`, `be`, or `both` as root on the VPS.
The script reuses live configuration and does not rerun setup or migrations.
