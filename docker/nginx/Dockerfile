# Production Nginx Server for Safaqat PWA
FROM nginx:1.25-alpine

# Copy optimized React PWA build directly into Nginx web root
COPY client/dist /usr/share/nginx/html

# Copy Nginx server configuration
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
