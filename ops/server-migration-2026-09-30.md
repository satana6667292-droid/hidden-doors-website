# Перенос hidden-doors.ru с GitHub Pages на VPS

Дата подготовки: 2026-09-30.

## Что уже подготовлено

Сайт остаётся статическим и продолжает храниться в `site/`. Для миграции добавлены:

- ручной workflow `.github/workflows/deploy-to-vps.yml`;
- Caddy-конфигурация `ops/hidden-doors-site.caddy`;
- идемпотентная подготовка каталога `ops/server-preflight.sh`.

Текущий GitHub Pages workflow намеренно не изменён. До переключения DNS GitHub Pages остаётся резервным действующим хостингом.

## Схема на VPS

```
GitHub main
  -> GitHub Actions
  -> /srv/hidden-doors/releases/<git-sha>
  -> /srv/hidden-doors/current
  -> Caddy
  -> hidden-doors.ru
```

Публикация атомарная: новый релиз загружается в отдельный каталог, после проверки `index.html` переключается симлинк `current`. Хранятся пять последних релизов.

## Что workflow не переносит

Из server payload исключаются два файла, нужные только GitHub Pages:

- `site/CNAME`;
- `site/.nojekyll`.

Они пока остаются в репозитории, чтобы не ломать текущий Pages до cutover.

## Репозиторные secrets

Перед первым серверным deploy необходимо добавить:

- `PROD_SSH_HOST` — адрес VPS;
- `PROD_SSH_PORT` — SSH-порт, можно оставить 22;
- `PROD_SSH_USER` — отдельный пользователь deploy;
- `PROD_SSH_PRIVATE_KEY` — приватный ED25519-ключ GitHub Actions;
- `PROD_SSH_KNOWN_HOSTS` — закреплённая строка host key VPS;
- `PROD_HEALTHCHECK_URL` — необязательно. После DNS cutover можно поставить `https://hidden-doors.ru/`.

Workflow специально не использует `ssh-keyscan` во время deploy: host key должен быть закреплён заранее.

## Подготовка сервера

1. Создать отдельного пользователя deploy без root-доступа.
2. Добавить его публичный SSH-ключ в `authorized_keys`.
3. Выполнить от root:

```bash
sudo bash ops/server-preflight.sh <deploy-user>
```

4. Проверить, что deploy-user может писать в `/srv/hidden-doors/releases`.
5. Скопировать `ops/hidden-doors-site.caddy` в каталог Caddy, который уже импортируется основной конфигурацией.
6. До финального переключения DNS Caddy-блок можно держать подготовленным, но не включать, если это вызывает преждевременные попытки выпуска TLS.

## Первый тест без переключения DNS

Первый deploy запускается только вручную:

Actions -> Deploy Hidden Doors to VPS (manual) -> Run workflow.

В поле подтверждения ввести:

```
DEPLOY
```

После выполнения на сервере должны существовать:

```
/srv/hidden-doors/releases/<sha>/index.html
/srv/hidden-doors/current -> /srv/hidden-doors/releases/<sha>
```

Это ещё не переключает посетителей с GitHub Pages.

## Cutover

После успешной загрузки файлов и проверки Caddy:

1. Включить Caddy-конфигурацию сайта и проверить `caddy validate`.
2. Перезагрузить Caddy без остановки остальных сервисов.
3. В REG.RU заменить только DNS корневого сайта:
   - `hidden-doors.ru` -> A-запись VPS;
   - `www.hidden-doors.ru` -> CNAME на `hidden-doors.ru` либо A на тот же VPS.
4. Не менять DNS поддоменов `catalog`, `shop`, `info`, `lk`.
5. После распространения DNS проверить HTTPS и редиректы.
6. Только после стабильной работы убрать GitHub Pages deployment из основного workflow.

## Контроль после переключения

- `https://hidden-doors.ru/` -> 200;
- `http://hidden-doors.ru/` -> HTTPS;
- `https://www.hidden-doors.ru/` -> 301/308 на `https://hidden-doors.ru/`;
- `/hiddendoors` и `/hiddendoors/` -> 301 на `/hidden-doors/`;
- `/robots.txt` -> 200;
- `/sitemap.xml` -> 200;
- неизвестный URL -> фирменная `404.html`;
- `catalog.hidden-doors.ru`, `shop.hidden-doors.ru`, `info.hidden-doors.ru`, `lk.hidden-doors.ru` не затронуты.

## Откат

Пока DNS TTL не повышен и GitHub Pages не отключён, быстрый откат — вернуть A/CNAME корневого сайта на GitHub Pages.

На самом VPS откат релиза выполняется переключением `/srv/hidden-doors/current` на предыдущий каталог из `/srv/hidden-doors/releases/`.
