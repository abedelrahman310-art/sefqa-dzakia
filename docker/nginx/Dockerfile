# Production Nginx Server for Safaqat PWA
FROM nginx:1.25-alpine

# Ensure SSL directories exist and copy self-signed / production certificates
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

COPY docker/nginx/ssl/safaqat.crt /etc/ssl/certs/safaqat.crt
COPY docker/nginx/ssl/safaqat.key /etc/ssl/private/safaqat.key
RUN chmod 600 /etc/ssl/private/safaqat.key && chmod 644 /etc/ssl/certs/safaqat.crt

# Copy optimized React PWA build directly into Nginx web root
COPY client/dist /usr/share/nginx/html

# Copy Nginx server configuration
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
