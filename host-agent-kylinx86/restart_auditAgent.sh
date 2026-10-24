#!/bin/bash

set -e  # 遇到错误立即退出

# 检查是否为root用户
if [ "$(id -u)" -ne 0 ]; then
    echo "请使用root用户运行此脚本！"
    exit 1
fi

echo "agent restart"
systemctl restart auditAgent