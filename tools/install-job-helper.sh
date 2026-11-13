#!/bin/bash
# Ставит помощника для вакансий на автозапуск (Linux, systemd): запускается при входе в систему,
# слушает только этот компьютер (127.0.0.1:8766). Убрать:  bash tools/install-job-helper.sh --remove
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
UNIT="$HOME/.config/systemd/user/kabinet-jobs.service"

if [ "$1" = "--remove" ]; then
  systemctl --user disable --now kabinet-jobs.service 2>/dev/null || true
  rm -f "$UNIT"
  systemctl --user daemon-reload
  echo "Помощник убран из автозапуска."
  exit 0
fi

mkdir -p "$(dirname "$UNIT")"
cat > "$UNIT" <<EOF
[Unit]
Description=Рабочий кабинет: помощник для поиска вакансий (только 127.0.0.1)

[Service]
ExecStart=$(command -v python3) -I "$DIR/tools/job-helper.py"
Restart=on-failure
RestartSec=30
Nice=10

[Install]
WantedBy=default.target
EOF
systemctl --user daemon-reload
systemctl --user enable --now kabinet-jobs.service
sleep 1
systemctl --user is-active --quiet kabinet-jobs.service && echo "Готово: помощник работает и будет запускаться сам." || echo "Что-то не так — посмотри: systemctl --user status kabinet-jobs"
