# Ana Portal Dockerfile
FROM nginx:alpine

# Metadata
LABEL maintainer="KapTaze Team <info@kaptazeapp.com.tr>"
LABEL description="KapTaze Ana Portal - Production Ready"
LABEL version="1.0.0"

# Çalışma dizini
WORKDIR /usr/share/nginx/html

# Portal dosyalarını kopyala
COPY index.html .
COPY css/ ./css/
COPY js/ ./js/
COPY assets/ ./assets/

# Nginx konfigürasyonu
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Dosya izinlerini ayarla
RUN chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Port açık
EXPOSE 80

# Nginx başlat
CMD ["nginx", "-g", "daemon off;"]