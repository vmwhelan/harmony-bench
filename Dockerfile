# Harmony Bench: a tiny Node server that serves the app (http and https) and stores the shared library
FROM node:20-alpine
# openssl creates the self-signed certificate for https on first start
RUN apk add --no-cache openssl
WORKDIR /app
COPY server.js ./
COPY index.html theory.js app.js playing.js band.js inputs.js print.js sections.js genres.js patterns.js docs.js ./public/
COPY vendor ./public/vendor/
# /data holds library.json and the certificate; the compose file mounts a named volume here so they survive updates
RUN mkdir -p /data && chown node:node /data
ENV PORT=8080 HTTPS_PORT=8443 DATA_DIR=/data
USER node
EXPOSE 8080 8443
VOLUME /data
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/api/health || exit 1
CMD ["node", "server.js"]
