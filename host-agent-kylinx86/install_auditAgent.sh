#!/bin/bash

# 安装脚本：install_auditAgent.sh
# 功能：部署auditAgent到系统并设置为服务

set -e  # 遇到错误立即退出

# 检查是否为root用户
if [ "$(id -u)" -ne 0 ]; then
    echo "请使用root用户运行此脚本！"
    exit 1
fi

# 定义安装目录
INSTALL_DIR="/usr/local/auditAgent"
SERVICE_NAME="auditAgent"

# 创建安装目录
echo "创建安装目录: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# 复制文件（假设当前目录所有文件都需要）
echo "复制文件到安装目录..."
cp -r ./* "$INSTALL_DIR/"

# 复制audit服务 规则到/etc/audit/rules.d
if [ -d "./conf" ]; then
    shopt -s nullglob
    RULES_FILES=(./conf/*.rules)

    if [ ${#RULES_FILES[@]} -gt 0 ]; then
        cp -v "./conf/"*.rules "/etc/audit/rules.d/" || {
            echo "复制audit规则失败" >&2
            exit 1
        }
        # 合并规则
        echo "加载audit规则..."
        augenrules --load || {
            echo "加载audit规则失败" >&2
            exit 1
        }
    else
        echo "未找到任何.rules文件，跳过规则部署"
    fi
else
    echo "conf目录不存在，跳过规则部署" >&2
fi
# 合并规则
augenrules --load

# 复制开关机服务配置到/etc/systemd/system
echo "复制开关机服务配置..."
if [ -d "./conf" ]; then
    SERVICE_FILES=(./conf/*.service)
    if [ ${#SERVICE_FILES[@]} -gt 0 ]; then
        cp -v "./conf/"*.service "/etc/systemd/system/" || {
            echo "复制服务文件失败" >&2
            exit 1
        }
    else
        echo "未找到任何.service文件，跳过服务配置部署"
    fi
else
    echo "conf目录不存在，跳过服务配置部署" >&2
fi

# 设置可执行权限
chmod +x "$INSTALL_DIR/auditAgent"

# 创建systemd服务文件
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
echo "创建systemd服务: $SERVICE_FILE"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Audit Agent Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/auditAgent
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

# 重载systemd配置
echo "重载systemd配置..."
systemctl daemon-reload

echo "重启auditd服务"
systemctl restart auditd

echo "开启开关机信息上报..."
systemctl enable systemboot.service
systemctl enable systemshutdown.service

# 启用并启动服务
echo "启用服务..."
systemctl enable "$SERVICE_NAME"

echo "启动服务..."
systemctl start "$SERVICE_NAME"

# 检查服务状态
echo -e "\n服务状态："
systemctl status "$SERVICE_NAME" --no-pager

echo -e "\n安装完成！"
echo "服务管理命令："
echo "  启动服务: systemctl start $SERVICE_NAME"
echo "  停止服务: systemctl stop $SERVICE_NAME"
echo "查看日志: journalctl -u $SERVICE_NAME -f"

