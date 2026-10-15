# WMS-Toho VPS Deployment

Run these commands as `root` on the VPS. Execute the database migration only once.

```bash
cd /www/wwwroot/wms-toho
git pull origin main

# Customer master data migration. Run once.
mysql -h 127.0.0.1 -P 3306 \
  -u yudaguntoro \
  -p'P@ssword123#' \
  wms-system-toho < database/add_customers.sql

# Rebuild and restart the API.
docker build -f Dockerfile.api -t wms-toho-api:latest .
docker rm -f wms-toho-api 2>/dev/null || true
docker run -d --name wms-toho-api \
  --restart unless-stopped \
  -p 5279:8080 \
  wms-toho-api:latest

# Rebuild and restart the frontend. Empty API URL uses the same-origin /api proxy.
docker build -f Dockerfile.fe \
  --build-arg NEXT_PUBLIC_API_BASE_URL="" \
  -t wms-toho-fe:latest .
docker rm -f wms-toho-fe 2>/dev/null || true
docker run -d --name wms-toho-fe \
  --restart unless-stopped \
  -p 8098:3000 \
  wms-toho-fe:latest

/etc/init.d/nginx reload

# Verify both containers and endpoints.
docker ps | grep wms-toho
curl -I http://127.0.0.1:5279
curl -I http://127.0.0.1:8098
curl -I https://wms.toho.my.id/
```

If the API Dockerfile has a different name on the VPS, keep the existing API build command and only update the image/container using the commands above.
