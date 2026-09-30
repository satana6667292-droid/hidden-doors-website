# Миграция hidden-doors.ru — 2026-09-30

## Корневой домен

| Старый URL | Новый URL | Действие |
| --- | --- | --- |
| https://hidden-doors.ru/ | https://hidden-doors.ru/ | сохранить URL |
| https://hidden-doors.ru/hiddendoors | https://hidden-doors.ru/hidden-doors/ | 301 |
| https://hidden-doors.ru/hiddendoors/ | https://hidden-doors.ru/hidden-doors/ | 301 |

По поисковой выдаче перед миграцией у корневого домена подтверждены главная и /hiddendoors. Главная старого сайта является одностраничным лендингом; большинство ссылок внутри ведут на якоря, а не на отдельные индексируемые страницы.

## Не затрагивать

Эти поддомены являются отдельными действующими ресурсами и не входят в миграцию корневого сайта:

- https://catalog.hidden-doors.ru/
- https://shop.hidden-doors.ru/
- https://info.hidden-doors.ru/
- https://lk.hidden-doors.ru/

## Контроль после переключения

- / возвращает 200.
- /hiddendoors и /hiddendoors/ возвращают 301 на /hidden-doors/ на серверном уровне.
- /robots.txt возвращает 200 и указывает https://hidden-doors.ru/sitemap.xml.
- /sitemap.xml возвращает 200 и содержит только production URL.
- www.hidden-doors.ru перенаправляется 301 на https://hidden-doors.ru/.
- HTTP перенаправляется на HTTPS.
- Старые поддомены остаются доступными.
