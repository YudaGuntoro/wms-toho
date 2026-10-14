# WMS-Toho Backend

Layered .NET 8 backend for WMS-Toho warehouse operations.

## Projects

- `WMS-Demo.Domain`: authentication, response, and warehouse domain models.
- `WMS-Demo.Persistence`: EF Core context, auth service, and warehouse database mappings.
- `../WMS-Demo.WebAPI`: ASP.NET Core Web API.

## Database

Use the on-premise MySQL database:

```text
Server=127.0.0.1;Port=3306;User ID=root;Password=YOUR_PASSWORD;Database=wms-system-toho;SslMode=None;AllowPublicKeyRetrieval=True;
```

Apply the warehouse schema from:

```text
../database/production_control_monitoring.sql
../database/locations.sql
../database/parts.sql
../database/stock_movements.sql
WMS-Demo.Persistence/Migrations/20260708_001_shift_master_and_no_target.sql
```

## API Modules

- `POST /api/auth/login`
- `GET|POST|PUT|DELETE /api/parts`
- `GET|POST|PUT|DELETE /api/locations`
- `GET|POST|DELETE /api/stock-movements`
- `GET /api/production/pic-cards`
- `GET /api/production/shift-masters`

## Run

```powershell
$env:ConnectionStrings__DefaultConnection="Server=127.0.0.1;Port=3306;User ID=root;Password=YOUR_PASSWORD;Database=wms-system-toho;SslMode=None;AllowPublicKeyRetrieval=True;"
dotnet run --project ..\WMS-Demo.WebAPI\WMS-Demo.WebAPI.csproj --urls http://localhost:5241
```
