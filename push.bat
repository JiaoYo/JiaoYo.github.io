@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===== 当前目录: %cd% =====

git add .
if errorlevel 1 (
    echo [错误] git add 失败
    pause
    exit /b 1
)

git commit -m "1"
if errorlevel 1 (
    echo [提示] 没有新的变更可提交，继续尝试推送...
)

git push
if errorlevel 1 (
    echo [错误] git push 失败
    pause
    exit /b 1
)

echo ===== 提交并推送完成 =====
pause