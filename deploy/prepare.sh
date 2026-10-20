#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -e .env ]]; then
  echo 'Файл .env уже существует. Существующие настройки сохранены.'
  exit 1
fi
domain="${1:-}"
if [[ ! "$domain" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$ ]]; then
  echo 'Использование: bash deploy/prepare.sh team.example.ru' >&2
  exit 1
fi
umask 077
setup_secret="$(openssl rand -hex 32)"
printf 'APP_DOMAIN=%s\nSETUP_TOKEN=%s\n' "$domain" "$setup_secret" > .env
echo 'Настройки сохранены в .env. Код первого входа — SETUP_TOKEN; не публикуйте этот файл.'
echo 'Следующий шаг: docker compose up -d --build'
