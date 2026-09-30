# Перенос hidden-doors.ru с GitHub Pages на VPS

Дата подготовки: 2026-09-30.

## Проверенный сервер

Целевой VPS:

- host: `hiplet-127827`;
- IPv4: `185.161.69.253`;
- Ubuntu 24.04;
- web server: Nginx 1.24;
- Caddy не установлен;
- 80/443 уже обслуживаются Nginx;
- UFW разрешает 22/80/443;
- Certbot установлен, timer активен;
- Docker не установлен.

Основной сайт добавляется как отдельный Nginx virtual host и не должен менять существующие upstream-сервисы на 127.0.0.1:8787 и 127.0.0.1:8788.

## Схема публикации

```
GitHub main
  -> GitHub Actions
  -> /srv/hidden-doors/releases/<git-sha>
  -> /srv/hidden-doors/current
  -> Nginx
  -> hidden-doors.ru
```

Публикация атомарная: новый релиз загружается в отдельный каталог, после проверки `index.html` переключается симлинк `current`. Хранятся пять последних релизов.

## Файлы миграции

- `.github/workflows/deploy-to-vps.yml` — ручной deploy на VPS;
- `ops/nginx/hidden-doors.bootstrap.conf` — HTTP-only bootstrap до выпуска сертификата;
- `ops/nginx/hidden-doors.conf` — финальный HTTPS virtual host;
- `ops/server-preflight.sh` — подготовка `/srv/hidden-doors`.

Текущий GitHub Pages workflow пока не изменяется. До DNS cutover он остаётся резервным вариантом.

## GitHub Secrets

Перед первым deploy добавить:

- `PROD_SSH_HOST=185.161.69.253`;
- `PROD_SSH_PORT=22`;
- `PROD_SSH_USER` — отдельный deploy user;
- `PROD_SSH_PRIVATE_KEY`;
- `PROD_SSH_KNOWN_HOSTS`;
- `PROD_HEALTHCHECK_URL` — необязательно, лучше добавить уже после DNS cutover.

## Подготовка сервера

1. Создать отдельного deploy user без root-доступа.
2. Добавить публичный SSH-ключ в его `authorized_keys`.
3. Выполнить от root:

```bash
sudo bash ops/server-preflight.sh <deploy-user>
```

4. Проверить права на `/srv/hidden-doors/releases`.
5. Выполнить первый ручной GitHub Actions deploy.
6. Проверить наличие:

```
/srv/hidden-doors/releases/<sha>/index.html
/srv/hidden-doors/current
```

## Bootstrap Nginx до DNS cutover

Скопировать `ops/nginx/hidden-doors.bootstrap.conf` в:

```
/etc/nginx/sites-available/hidden-doors
```

Затем создать symlink:

```bash
ln -s /etc/nginx/sites-available/hidden-doors /etc/nginx/sites-enabled/hidden-doors
nginx -t
systemctl reload nginx
```

Это не требует сертификата и безопасно до переключения DNS.

Локальная проверка на VPS:

```bash
curl -I -H 'Host: hidden-doors.ru' http://127.0.0.1/
curl -I -H 'Host: hidden-doors.ru' http://127.0.0.1/robots.txt
```

## DNS cutover

После успешного server-side теста изменить только записи корневого сайта:

- `hidden-doors.ru` -> A `185.161.69.253`;
- `www.hidden-doors.ru` -> CNAME `hidden-doors.ru` либо A `185.161.69.253`.

Не менять:

- `catalog.hidden-doors.ru`;
- `shop.hidden-doors.ru`;
- `info.hidden-doors.ru`;
- `lk.hidden-doors.ru`.

Дождаться, пока публичные резолверы начнут отдавать `185.161.69.253`.

## Выпуск TLS

После распространения DNS:

```bash
certbot certonly --webroot   -w /srv/hidden-doors/current   -d hidden-doors.ru   -d www.hidden-doors.ru
```

Проверить:

```bash
certbot certificates
test -s /etc/letsencrypt/live/hidden-doors.ru/fullchain.pem
test -s /etc/letsencrypt/live/hidden-doors.ru/privkey.pem
```

## Переход на финальный HTTPS virtual host

После успешного выпуска сертификата заменить содержимое:

```
/etc/nginx/sites-available/hidden-doors
```

на `ops/nginx/hidden-doors.conf`, затем:

```bash
nginx -t && systemctl reload nginx
```

Используется именно reload, не stop/start.

## Контроль

- `https://hidden-doors.ru/` -> 200;
- `http://hidden-doors.ru/` -> HTTPS;
- `https://www.hidden-doors.ru/` -> redirect на основной host;
- `/hiddendoors` и `/hiddendoors/` -> 301 на `/hidden-doors/`;
- `/robots.txt` -> 200;
- `/sitemap.xml` -> 200;
- неизвестный URL -> фирменная `404.html`;
- существующие Bitrix MCP и Telegram endpoints остаются доступны.

## Откат

До отключения GitHub Pages быстрый DNS rollback — вернуть прежние GitHub Pages A/CNAME записи.

На VPS откат контента — переключить `/srv/hidden-doors/current` на предыдущий каталог в `/srv/hidden-doors/releases/`.
