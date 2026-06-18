FROM php:8.5-fpm-alpine

# Install dependencies and extensions
RUN apk add --no-cache \
    nginx \
    nodejs \
    npm \
    postgresql-dev \
    curl \
    python3 \
    py3-pip \
    python3-dev \
    gcc \
    musl-dev \
    libffi-dev \
    jpeg-dev \
    zlib-dev \
    $PHPIZE_DEPS \
    && docker-php-ext-install pdo_pgsql pcntl bcmath \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && pip3 install --no-cache-dir pikepdf --break-system-packages \
    && rm -rf /var/cache/apk/* /tmp/*

WORKDIR /var/www/html
COPY . .

# Nginx config
RUN mkdir -p /run/nginx && \
    echo "server {" > /etc/nginx/http.d/default.conf && \
    echo "    listen 80;" >> /etc/nginx/http.d/default.conf && \
    echo "    root /var/www/html/public;" >> /etc/nginx/http.d/default.conf && \
    echo "    index index.php index.html;" >> /etc/nginx/http.d/default.conf && \
    echo "    location / {" >> /etc/nginx/http.d/default.conf && \
    echo "        try_files \$uri \$uri/ /index.php?\$query_string;" >> /etc/nginx/http.d/default.conf && \
    echo "    }" >> /etc/nginx/http.d/default.conf && \
    echo "    location ~ \.php$ {" >> /etc/nginx/http.d/default.conf && \
    echo "        fastcgi_pass 127.0.0.1:9000;" >> /etc/nginx/http.d/default.conf && \
    echo "        fastcgi_index index.php;" >> /etc/nginx/http.d/default.conf && \
    echo "        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;" >> /etc/nginx/http.d/default.conf && \
    echo "        include fastcgi_params;" >> /etc/nginx/http.d/default.conf && \
    echo "    }" >> /etc/nginx/http.d/default.conf && \
    echo "}" >> /etc/nginx/http.d/default.conf

# Start script
RUN echo "#!/bin/sh" > /start.sh && \
    echo "php-fpm -D" >> /start.sh && \
    echo "nginx -g 'daemon off;'" >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
