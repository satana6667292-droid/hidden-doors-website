FROM nginx:alpine

COPY ops/website/nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/

RUN rm -f /usr/share/nginx/html/CNAME /usr/share/nginx/html/.nojekyll

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=6 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
