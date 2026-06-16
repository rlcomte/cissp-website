#!/usr/bin/env bash
set -e

echo "[target] Starting Apache..."
service apache2 start

echo "[target] Starting SSH..."
exec /usr/sbin/sshd -D -e
