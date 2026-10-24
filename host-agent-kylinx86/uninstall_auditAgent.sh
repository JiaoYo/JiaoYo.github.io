#!/bin/bash

set -e

# 检查是否为root用户
if [ "$(id -u)" -ne 0 ]; then
    echo "请使用root用户运行此脚本！"
    exit 1
fi

SERVICE_NAME="auditAgent"
INSTALL_DIR="/usr/local/auditAgent"

# 从JSON文件提取 remote_host 的IP（假设JSON格式严格）
REMOTE_IP=$(grep -o '"remote_host": *"[^"]*"' ./conf/auditAgent.json | awk -F'"' '{print $4}')

# 检查IP是否有效（简单验证）
if [[ ! $REMOTE_IP =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "错误：无效的IP地址"
    exit 1
fi

# 提取 remote_port 的端口号（假设JSON格式严格）
REMOTE_PORT=$(grep -o '"remote_port": *[0-9]*' ./conf/auditAgent.json | awk '{print $2}')

# 检查端口是否有效（1-65535）
if [[ ! $REMOTE_PORT =~ ^[0-9]+$ ]] || [ $REMOTE_PORT -lt 1 ] || [ $REMOTE_PORT -gt 65535 ]; then
    echo "错误：无效的端口号"
    exit 1
fi

CURRENT_TIME="$(LC_TIME=en_US.UTF-8 date +"%b %d %H:%M:%S")"
HOSTNAME=$(hostname)

echo "$CURRENT_TIME $HOSTNAME audit[10001]: auditAgent uninstall offline" > /var/log/auditAgent.log
echo -n "<102>$CURRENT_TIME $HOSTNAME audit[10001]: auditAgent uninstall offline" | nc -u -w1 "$REMOTE_IP" "$REMOTE_PORT"

systemctl stop "$SERVICE_NAME" || true
systemctl disable "$SERVICE_NAME" || true
systemctl stop systemboot.service || true
systemctl disable systemboot.service || true
systemctl stop systemshutdown.service || true
systemctl disable systemshutdown.service || true
rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
rm -f "/etc/systemd/system/systemboot.service"
rm -f "/etc/systemd/system/systemshutdown.service"

rm "/etc/audit/rules.d/dpkg.rules"
rm "/etc/audit/rules.d/importConf_watch.rules"
rm "/etc/audit/rules.d/time_change.rules"

augenrules --load

systemctl daemon-reload
systemctl restart auditd
rm -rf "$INSTALL_DIR"

echo "卸载完成！"

