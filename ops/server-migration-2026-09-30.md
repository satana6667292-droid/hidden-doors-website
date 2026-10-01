# Перенос hidden-doors.ru на hiplet-91815

Дата актуализации: 2026-10-01.

## Проверенный сервер

Целевой VPS:

- host: `hiplet-91815`;
- IPv4: `138.124.69.108`;
- Ubuntu 24.04.5 LTS;
- 4 vCPU;
- 7.8 GiB RAM;
- 77 GiB диск, около 50 GiB свободно;
- Docker 29.8;
- общий reverse proxy: Caddy 2.11.4 в контейнере `deploy-reverse-proxy-1`;
- Caddy импортирует `/data/runtime/*.caddy`;
- production app и PostgreSQL уже работают в Docker;
- на сервере уже есть два self-hosted GitHub Actions runner.

Корпоративный сайт размещается как отдельный статический Docker-контейнер и отдельная Docker-сеть. Production app, PostgreSQL, configurator, staging и preview-контейнеры не пересоздаются.

## Целевая схема

```
GitHub repository
   ↓
dedicated self-hosted runner
   ↓
root-owned wrapper
   ↓
Docker image hidden-doors-website:<sha>
   ↓
container hidden-doors-website :8080
   ↓
network hidden-doors-website-net
   ↓
shared production Caddy
   ↓
hidden-doors.ru
```

## Безопасность

Runner не получает прямой доступ к Docker socket.

Единственная разрешённая privileged-команда:

```
sudo /usr/local/sbin/hidden-doors-website ...
```

Root-owned wrapper:

- проверяет Git origin и commit SHA runner workspace;
- проверяет health production app/PostgreSQL/Caddy до и после операции;
- меняет только контейнер корпоративного сайта;
- пишет только свой Caddy runtime-файл;
- валидирует Caddy перед reload;
- восстанавливает предыдущий runtime route при ошибке;
- сохраняет предыдущий image как `hidden-doors-website:rollback`.

## Файлы

- `ops/website/Dockerfile` — статический image сайта;
- `ops/website/nginx.conf` — внутренний web server на 8080;
- `ops/hidden-doors-website-root.sh` — root-owned deploy wrapper;
- `ops/sudoers.hidden-doors-website` — минимальное sudo-правило;
- `.github/workflows/website-self-hosted.yml` — ручной workflow.

GitHub Pages workflow пока сохраняется как rollback до успешного DNS cutover.

## Отдельный runner

Рекомендуется создать третий runner только для `hidden-doors-website`.

Пользователь:

```
website-runner
```

Runner directory:

```
/opt/actions-runner-website
```

Required label:

```
hidden-doors-website
```

Не добавлять `website-runner` в группу `docker`.

После регистрации runner установить root wrapper:

```bash
install -o root -g root -m 0755 ops/hidden-doors-website-root.sh /usr/local/sbin/hidden-doors-website
install -o root -g root -m 0440 ops/sudoers.hidden-doors-website /etc/sudoers.d/hidden-doors-website
visudo -cf /etc/sudoers.d/hidden-doors-website
```

Проверка от `website-runner`:

```bash
sudo -n /usr/local/sbin/hidden-doors-website status
```

## Этап 1 — preview без изменения DNS

В GitHub Actions:

```
Hidden Doors website (hiplet-91815)
operation = deploy-preview
ref = main
```

Wrapper:

1. проверяет production stack;
2. строит новый image;
3. создаёт изолированную сеть `hidden-doors-website-net`;
4. подключает к ней production Caddy;
5. запускает только `hidden-doors-website`;
6. ждёт health check;
7. создаёт route:

```
https://hidden-doors-site.138.124.69.108.sslip.io/
```

DNS `hidden-doors.ru` при этом не меняется.

Preview закрыт по IP на уровне Caddy. Разрешён только VPN egress IP `5.183.253.169`; любой другой источник получает `403 Forbidden`. Production-домен этим ограничением не затрагивается.

На preview проверяются:

- главная;
- все основные разделы;
- CSS/JS/assets;
- формы;
- `robots.txt`;
- `sitemap.xml`;
- фирменная 404;
- мобильная версия;
- кабинет дилера;
- метрика.

## Этап 2 — DNS cutover

Только после полной проверки preview:

- `hidden-doors.ru` A -> `138.124.69.108`;
- `www.hidden-doors.ru` CNAME -> `hidden-doors.ru` либо A -> `138.124.69.108`.

Не менять DNS:

- `catalog.hidden-doors.ru`;
- `shop.hidden-doors.ru`;
- `info.hidden-doors.ru`;
- `lk.hidden-doors.ru`.

## Этап 3 — production route

После того как публичный DNS уже указывает на `138.124.69.108`:

```
operation = promote-production
confirm_production = PRODUCTION
```

Wrapper создаёт Caddy route для:

- `hidden-doors.ru`;
- `www.hidden-doors.ru`.

Caddy получает HTTPS автоматически из существующего production reverse proxy.

## Rollback

### Контент

GitHub Actions:

```
operation = rollback
```

Запускается предыдущий image `hidden-doors-website:rollback`. Caddy route не меняется.

### DNS

Пока GitHub Pages не отключён, аварийный внешний rollback — вернуть прежние GitHub Pages A/CNAME.

## Что не делать до cutover

- не отключать GitHub Pages;
- не удалять `site/CNAME`;
- не менять DNS корневого домена;
- не изменять production Caddyfile вручную;
- не подключать runner к Docker group;
- не выполнять `docker system prune -a`.

## Отдельно про место на диске

На сервере достаточно места, но Docker сейчас содержит заметный объём старых images/build cache. Перед миграцией можно выполнить отдельную безопасную уборку только после проверки, какие images нужны rollback/staging. Это не является обязательным условием переноса сайта.
