# Toho Technology Indonesia - VPS Deployment

Run these commands as `root` on the VPS. Commit and push local changes to
`origin/main` first; the VPS cannot pull uncommitted changes.

This uses the existing VPS Dockerfiles `Dockerfile.api` and `Dockerfile.fe`.
They are not included in this local checkout. Preserve existing database/proxy
settings and any extra container environment, network, or volume options.

All browser API requests now use same-origin `/api/...`. `NEXT_PUBLIC_API_BASE_URL`
is no longer used. In local development, Next.js proxies `/api` to
`API_PROXY_TARGET` (default `http://127.0.0.1:5243`). On this VPS, Nginx proxies
`/api/` directly to `127.0.0.1:5279` as configured below.

The API must share the `wms-toho-net` Docker network with `mysql_vps`.
Its connection string is stored in `/root/wms-toho-api.env` with mode 600.
Configure this using the database connection commands below before updating.
Do not use `127.0.0.1` as the database host inside the API container.

```bash
set -e
cd /www/wwwroot/wms-toho
git pull --ff-only origin main

# Build both images before stopping the API.
test -f Dockerfile.api
test -f Dockerfile.fe
test -f database/remove_part_location.sql
docker build -f Dockerfile.api -t wms-toho-api:latest .
docker build -f Dockerfile.fe \
  --build-arg NEXT_PUBLIC_API_BASE_URL="" \
  -t wms-toho-fe:latest .

# Stop writes, back up, then migrate. Enter the DB password when prompted.
mkdir -p /root/wms-backups
chmod 700 /root/wms-backups
docker stop wms-toho-api
mysqldump -h 127.0.0.1 -P 3306 -u yudaguntoro -p \
  --single-transaction --no-tablespaces wms-system-toho \
  > "/root/wms-backups/wms-toho-$(date +%Y%m%d-%H%M%S).sql"

mysql -h 127.0.0.1 -P 3306 -u yudaguntoro -p \
  wms-system-toho < database/remove_part_location.sql
docker rm wms-toho-api
docker run -d --name wms-toho-api \
  --restart unless-stopped \
  --network wms-toho-net \
  --env-file /root/wms-toho-api.env \
  -p 5279:8080 \
  wms-toho-api:latest

# Restart the frontend. Empty API URL uses the existing /api proxy.
docker stop wms-toho-fe
docker rm wms-toho-fe
docker run -d --name wms-toho-fe \
  --restart unless-stopped \
  -p 8098:3000 \
  wms-toho-fe:latest

nginx -t
/etc/init.d/nginx reload

# Verify both containers and endpoints.
docker ps | grep wms-toho
curl --retry 10 --retry-connrefused --retry-delay 2 -fsS \
  -o /dev/null -w 'Frontend HTTP %{http_code}\n' http://127.0.0.1:8098/signin
curl -I https://wms.toho.my.id/
docker logs --tail 30 wms-toho-api
```

If the API Dockerfile has a different name on the VPS, keep the existing API build command and only update the image/container using the commands above.

The migration removes `parts.location_id` and its foreign key. Stock transaction
locations remain intact. The migration can be run again safely. Do not run
legacy normalization after removing this column.

If backup or migration fails, stop at that error. Before the column is removed,
resume the previous API with `docker start wms-toho-api`. After migration, use
the new API image because the previous API expects that column.

For an older database without customer master, apply `database/add_customers.sql`
once before this update.

## Configure the VPS database connection

The existing VPS database container is `mysql_vps`. This procedure adds it to
an application network without removing its existing networks. Enter the exact
MySQL username and password at the prompts. Credentials are not committed here.
The connection test must succeed before recreating the API. Run as root in Bash.

```bash
set -e
docker network inspect wms-toho-net >/dev/null 2>&1 || docker network create wms-toho-net
if ! docker network inspect wms-toho-net --format '{{range .Containers}}{{println .Name}}{{end}}' | grep -qx mysql_vps; then
  docker network connect wms-toho-net mysql_vps
fi

read -rp 'MySQL username: ' WMS_DB_USER
read -rsp 'MySQL password: ' WMS_DB_PASSWORD
echo

MYSQL_PWD="$WMS_DB_PASSWORD" docker run --rm --network wms-toho-net \
  -e MYSQL_PWD mysql:8.0 \
  mysql -h mysql_vps -u "$WMS_DB_USER" -D wms-system-toho -e 'SELECT 1 AS connection_ok;'

umask 077
printf 'ConnectionStrings__DefaultConnection=Server=mysql_vps;Port=3306;Database=wms-system-toho;User ID=%s;Password=%s;SslMode=None;AllowPublicKeyRetrieval=True;\n' \
  "$WMS_DB_USER" "$WMS_DB_PASSWORD" > /root/wms-toho-api.env
chmod 600 /root/wms-toho-api.env
unset WMS_DB_PASSWORD WMS_DB_USER

docker stop wms-toho-api
docker rm wms-toho-api
docker run -d --name wms-toho-api \
  --restart unless-stopped \
  --network wms-toho-net \
  --env-file /root/wms-toho-api.env \
  -p 5279:8080 wms-toho-api:latest
docker logs --tail 30 wms-toho-api
```

Retry login after the API starts. If the connection test reports `Access denied`,
check the exact username and its MySQL host grants before recreating the API.
If other runtime options are needed, retain them in the `docker run` command.

## Disable page and API caching on ALL routes

The production build renders all application routes dynamically through root
`dynamic = "force-dynamic"` and `revalidate = 0`. This includes `/`, `/signin`,
`/parts`, `/locations`, `/customers`, `/pic-cards`, `/users`, `/stock-in`,
`/stock-out`, and `/item-check`. Fetch requests use `cache: "no-store"`.
The API also returns no-store headers, including unauthorized responses.

After pulling, update the existing aaPanel virtual host at
`/www/server/panel/vhost/nginx/wms.toho.my.id.conf`:

1. Back up the existing virtual host configuration.
2. Preserve SSL certificates, HTTPS redirects, logging and ACME verification.
3. Remove the existing application proxy locations (`/`, `/api/`, `/_next/static/`)
   and competing static-extension locations. Check included proxy files as well.
4. Inside the site's `server` block include the checked-in configuration:

```nginx
include /www/wwwroot/wms-toho/deploy/nginx/wms-toho.locations.conf;
```

This file disables Nginx proxy caching and overrides stale upstream cache headers
for pages and `/api/`. Hashed JS/CSS retain one-year immutable caching, public
images/fonts can cache for seven days, and optimized images retain Next.js caching.
Do not apply no-store rules at server level to static assets. Do not add a second
`location /` or duplicate `/api/` block.

Validate and reload only after the configuration test succeeds:

```bash
nginx -t && /etc/init.d/nginx reload
```

Pulling application code alone does not update the active Nginx virtual host.
This repository does not contain the live VPS configuration or SSH credentials.

### Verify after deployment

```bash
for page in / /signin /parts /locations /customers /pic-cards /users /stock-in /stock-out /item-check; do
  curl -sSI "https://wms.toho.my.id$page"
done
curl -sSI https://wms.toho.my.id/api/parts
```

Every page must return `Cache-Control: no-store, no-cache, must-revalidate,
proxy-revalidate`, `Pragma: no-cache`, and `Expires: 0`. There must be no
`s-maxage=31536000`. An unauthenticated API request should return 401 with the
same no-store headers. Static assets should retain their own caching policy.

For repeatable production checks:

```bash
cd Frontend
npm run check:cache -- https://wms.toho.my.id
```

In browser Developer Tools > Network, login and navigate the admin pages.
Requests must target `https://wms.toho.my.id/api/...`, with no localhost, separate
API port, or mixed HTTP URL in the browser.

### Standalone production startup

With `output: "standalone"`, the frontend Docker runtime must copy
`.next/standalone` plus `.next/static` and `public`, and launch its `server.js`
with `HOSTNAME=0.0.0.0` and `PORT=3000`. Do not run `next start` for this output.

References: [Next.js headers](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
and [Nginx proxy cache](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache).
