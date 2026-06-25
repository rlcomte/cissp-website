FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    openssh-server \
    apache2 \
    curl \
    net-tools \
    iproute2 \
    sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a demo user for authenticated checks if needed
RUN useradd -m -s /bin/bash student \
    && echo "student:student" | chpasswd \
    && usermod -aG sudo student

# Prepare SSH
RUN mkdir -p /run/sshd

# Simple web page for HTTP scanning
RUN echo '<html><head><title>Linux Target</title></head><body><h1>Demo Linux Target</h1><p>Vulnerability scanning lab target.</p></body></html>' \
    > /var/www/html/index.html

# Demo hidden directories for Gobuster
RUN mkdir -p /var/www/html/admin \
    && mkdir -p /var/www/html/backup \
    && mkdir -p /var/www/html/dev \
    && mkdir -p /var/www/html/old \
    && echo '<h1>Admin Area</h1><p>Restricted admin page.</p>' > /var/www/html/admin/index.html \
    && echo '<h1>Backup Area</h1><p>Old backup files should not be exposed.</p>' > /var/www/html/backup/index.html \
    && echo '<h1>Development Area</h1><p>Temporary development page.</p>' > /var/www/html/dev/index.html \
    && echo '<h1>Old Site</h1><p>Deprecated content.</p>' > /var/www/html/old/index.html

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 22 80

CMD ["/start.sh"]
