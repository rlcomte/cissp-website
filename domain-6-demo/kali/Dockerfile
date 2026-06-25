FROM kalilinux/kali-rolling

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    nmap \
    nikto \
    curl \
    iputils-ping \
    dnsutils \
    netcat-openbsd \
    openssh-client \
    gobuster \
    ffuf \
    sqlmap \
    tcpdump \
    wireshark-common \
    zaproxy \
    metasploit-framework \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root

CMD ["/bin/bash"]
