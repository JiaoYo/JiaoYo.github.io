# -*- coding: utf-8 -*-
"""
系统监控主框架 (适用于基于 Debian 的麒麟系统)
监控事件:
 - 用户身份鉴别
 - 登录登出
 - 文件变更
 - 用户管理变更
 - 关键路径
 - 开关机
 - 进程/服务启停
 - 软件安装卸载
 - 系统更新
 - 系统时间
 - 硬件配置
 - 外设接口
 - 网络连接
"""
import json
import pwd
import signal
import socket
import subprocess
import sys
import threading
import time
import os
import uuid
from collections import defaultdict
import hashlib
from pathlib import Path

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import psutil
import dbus
import dbus.mainloop.glib
from gi.repository import GLib
import re
from datetime import datetime
import stat
from collections import deque
import pyudev
import logging
import logging.handlers
import gzip
import shutil


# 获取系统信息
def get_os_info():
    info = {}
    try:
        with open("/etc/os-release", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                info[k] = v.strip('"')
    except Exception as e:
        print("读取 os-release 失败:", e)
    return info


OS_INFO = get_os_info()
print(OS_INFO)

with open('/etc/hostname', 'r') as f:
    hostname = f.read().strip()

PID = os.getpid()
LOGIN_INFO = {}
MONITOR_DIR = []
AUDIT_KEY = "mainDir_watch"

# === Syslog 配置 ===
with open("conf/auditAgent.json", "r") as f:
    config = json.loads(f.readline().strip())

with open("conf/importConf_watch.rules") as f:
    for line in f:
        config_line = line.strip()
        if not config_line:
            continue
        part = config_line.split(" ")
        MONITOR_DIR.append(part[1])
LOG_SERVER = config['remote_host']  # 替换为你的 syslog 服务器地址
LOG_PORT = config['remote_port']
MODE = config['mode']
LOG_PATH = config['log_file']
MAX_LOG_SIZE = 100 * 1024 * 1024
BACKUP_COUNT = 3

# EVENT_TYPE_DICT = {"5": True, "6": True, "7": True, "8": True, "9": True, "10": True,
#                    "11": True, "12": True, "13": True, "14": True, "15": True, "16": True,
#                    "17": True, "18": True, "19": True, "20": True, "21": True, "22": True,
#                    "28": True, "29": True, "30": True, "31": True, "33": True,
#                    "35": True, "36": True}


with open('conf/event_type_dict.json', 'r', encoding='utf-8') as f:
    EVENT_TYPE_DICT = json.loads(f.readline().strip())


def save_event_type_dict():
    global EVENT_TYPE_DICT
    try:
        with open('conf/event_type_dict.json', 'w', encoding='utf-8') as f:
            f.write(json.dumps(EVENT_TYPE_DICT, ensure_ascii=False))
        # print("字典已成功保存到 event_type_dict.json")
    except Exception as e:
        print(f"保存文件时出错: {e}")


def setup_logging():
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    handler = logging.handlers.RotatingFileHandler(
        filename=LOG_PATH,
        maxBytes=MAX_LOG_SIZE,
        backupCount=BACKUP_COUNT,
        encoding="utf-8"
    )
    formatter = logging.Formatter('%(message)s')
    handler.setFormatter(formatter)

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)

    compress_old_logs()

def compress_old_logs():
    log_dir = os.path.dirname(LOG_PATH)
    log_name = os.path.basename(LOG_PATH)

    for i in range(1, BACKUP_COUNT + 1):
        old_log = f"{LOG_PATH}.{i}"
        if os.path.exists(old_log):
            with open(old_log, "rb") as f_in:
                with gzip.open(f"{old_log}.gz", "wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)
            os.remove(old_log)


# sock = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM)
# sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
history_log = deque()


def is_ipv4(ip_str):
    """判断是否是IPv4地址"""
    try:
        socket.inet_pton(socket.AF_INET, ip_str)
        return True
    except socket.error:
        return False


def is_ipv6(ip_str):
    """判断是否是IPv6地址"""
    try:
        socket.inet_pton(socket.AF_INET6, ip_str)
        return True
    except socket.error:
        return False

sock = None
if is_ipv4(LOG_SERVER):
    print("ipv4")
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
elif is_ipv6(LOG_SERVER):
    print("ipv6")
    sock = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM)


def send_to_syslog(msg: str):
    logging.info(msg[msg.find(">") + 1:].strip())
    if MODE == 0:
        print(msg)
    elif MODE == 1:
        global sock
        try:
            raw_data = json.dumps({"type": 0, "uuid": str(uuid.uuid4()), "time": int(time.time() * 1000),  "data": msg})
            print(raw_data)
            sock.sendto(raw_data.encode("utf-8"), (LOG_SERVER, LOG_PORT))
            print("send success")
        except Exception as e:
            history_log.append(msg)
            print(e)


def send_history_log():
    while True:
        if len(history_log) != 0:
            msg = history_log.pop()  # 从右端取出
            try:
                send_to_syslog(msg)
            except Exception as e:
                print(e)
                history_log.appendleft(msg)  # 失败则放回左端
        time.sleep(2)


# login success
def on_session_new(session_id, session_path):
    global LOGIN_INFO, EVENT_TYPE_DICT
    try:
        bus = dbus.SystemBus()
        session_obj = bus.get_object("org.freedesktop.login1", session_path)
        session_props = dbus.Interface(session_obj, "org.freedesktop.DBus.Properties")

        user = session_props.Get("org.freedesktop.login1.Session", "Name")
        remote_host = session_props.Get("org.freedesktop.login1.Session", "RemoteHost")
        service = session_props.Get("org.freedesktop.login1.Session", "Service")

        if user == "lightdm":
            return

        if not remote_host:
            remote_host = "127.0.0.1"

        if service == "lightdm":
            service = "localhost"

        date_now = datetime.now().strftime("%b %d %H:%M:%S")
        pri = 63
        if EVENT_TYPE_DICT["14"]:
            send_to_syslog(f"<{pri}>{date_now} {hostname} agent[{PID}]: {user} {remote_host} {service} login success")
        LOGIN_INFO[session_id] = {"user": user, "remote": remote_host, "service": service}

    except Exception as e:
        print("[!] Failed to get session details:", e)


# logout success
def on_session_removed(session_id, session_path):
    global LOGIN_INFO, EVENT_TYPE_DICT
    try:
        session_info = LOGIN_INFO[session_id]
        date_now = datetime.now().strftime("%b %d %H:%M:%S")
        pri = 64
        if EVENT_TYPE_DICT["15"]:
            send_to_syslog(f"<{pri}>{date_now} {hostname} agent[{PID}]: {session_info['user']} {session_info['remote']} {session_info['service']} logout success")
        del LOGIN_INFO[session_id]
    except:
        pass


# 登录成功监测
def agentLoginMonit():
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    bus = dbus.SystemBus()

    bus.add_signal_receiver(
        on_session_new,
        signal_name="SessionNew",
        dbus_interface="org.freedesktop.login1.Manager"
    )
    bus.add_signal_receiver(
        on_session_removed,
        signal_name="SessionRemoved",
        dbus_interface="org.freedesktop.login1.Manager"
    )

    loop = GLib.MainLoop()
    loop.run()


# === 登录失败、su切换至root监测
def parse_change_user_date(msg: str):
    part = msg.split()
    new_user = part[4]
    old_user = part[6]

    uid_match = re.search(r'\buid=(\d+)\b', old_user)
    uid = int(uid_match.group(1))
    old_user = pwd.getpwuid(uid).pw_name

    return f"{old_user} to {new_user}"


def monitor_auth_fail():
    global EVENT_TYPE_DICT
    path = "/var/log/auth.log"
    last_size = os.path.getsize(path)
    while True:
        try:
            current_size = os.path.getsize(path)

            # 如果文件被轮转/清空（大小变小），重置last_size
            if current_size < last_size:
                last_size = 0

            # 只有在文件有新内容时才读取
            if current_size > last_size:
                with open(path, 'r') as f:
                    f.seek(last_size)
                    new_lines = f.readlines()
                    last_size = f.tell()
                    for line in new_lines:
                        if "authentication failure" in line:
                            data = parse_login_fail(line)
                            ts = to_syslog_time(data['time'])
                            pri = 66
                            send_info = f"<{pri}>{ts} {hostname} agent[{PID}]: {data['user']} {data['ip']} {data['service']} authentication failure"
                            if EVENT_TYPE_DICT["14"]:
                                send_to_syslog(send_info)
                        elif "su: pam_unix(su:session)" in line and "session opened" in line:
                            part = line.split("su: pam_unix(su:session):", 1)
                            msg = parse_change_user_date(part[1].strip())
                            pri = 65
                            if EVENT_TYPE_DICT["31"]:
                                send_to_syslog(f"<{pri}>{part[0].strip()} audit[{PID}]: su {msg}")
                        elif "useradd" in line and "new user" in line:
                            part = line.split("new user:", 1)
                            pri = 68
                            msg = part[1].strip()

                            items = [item.strip() for item in msg.split(',')]
                            user_data = {}
                            for item in items:
                                key, value = item.split('=', 1)
                                user_data[key] = value
                            user = user_data['name']
                            uid = user_data['UID']
                            if EVENT_TYPE_DICT["28"]:
                                send_to_syslog(f"<{pri}>{part[0].strip()} root useradd add user {user}")
                        elif "userdel" in line and "delete user" in line:
                            part = line.split("delete user", 1)
                            pri = 70
                            user = part[1].strip().replace("'", "")
                            if EVENT_TYPE_DICT["30"]:
                                send_to_syslog(f"<{pri}>{part[0].strip()} root userdel delete user {user}")
                        elif "passwd" in line and "password" in line:
                            part = line.split("pam_unix(passwd:chauthtok):", 1)
                            pri = 69
                            if EVENT_TYPE_DICT["33"]:
                                send_to_syslog(f"<{pri}>{part[0].strip()} root {part[1].strip()}")
            else:
                # 没有新内容时跳过
                time.sleep(3)
                continue

        except Exception as e:
            print(f"[ERROR] auth_log_monitor: {e}")

        time.sleep(3)


# === 示例模块: 文件变更 ===
def get_recent_audit_user(filepath):
    # 查找最近10秒内针对该路径的审计事件
    cmd = ['ausearch', '-k', AUDIT_KEY, '-ts', 'recent', '--format', 'raw']
    result = subprocess.run(cmd, capture_output=True, text=True)
    logs = result.stdout.strip().split('\n')

    for log in reversed(logs):
        if all(item in log for item in [AUDIT_KEY, 'auid']):
            try:
                uid_match = re.search(r'\buid=(\d+)\b', log)
                uid = int(uid_match.group(1))
                user = pwd.getpwuid(uid).pw_name

                time_str = next((line for line in log.splitlines() if 'audit(' in line), '')
                ts = time_str.split('audit(')[1].split(':')[0]
                timestamp = datetime.fromtimestamp(float(ts)).replace(microsecond=0)
                return user, to_syslog_time(str(timestamp))
            except Exception as e:
                return 'unknown', None
    return 'unknown', None

class FileChangeHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self.file_permissions = {}  # 保存文件路径和权限的映射
        self.last_modified = defaultdict(float)  # 记录文件最后处理时间
        self.just_created = set()

    def _handle(self, event, action):
        filepath = event.src_path
        if self.is_temp_file(filepath):
            return

        user, ts = get_recent_audit_user(filepath)
        pri = 51
        if EVENT_TYPE_DICT["20"]:
            send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: {user} {action} {filepath} success")

    def _handle_create(self, event, action):
        filepath = event.src_path
        if self.is_temp_file(filepath):
            return

        if not event.is_directory:
            try:
                self.file_permissions[event.src_path] = os.stat(event.src_path).st_mode
                self.just_created.add(event.src_path)
            except FileNotFoundError:
                pass

        user, ts = get_recent_audit_user(filepath)
        pri = 48
        if EVENT_TYPE_DICT["17"]:
            send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: {user} {action} {filepath} success")

    def _handle_modified(self, event, action):
        if event.is_directory:
            return
        filepath = event.src_path
        if filepath in self.just_created:
            self.just_created.remove(filepath)
            return

        user, ts = get_recent_audit_user(filepath)

        if self.is_temp_file(filepath):
            return

        try:
            current_mode = os.stat(filepath).st_mode
        except FileNotFoundError:
            return  # 文件已被删除

        previous_mode = self.file_permissions.get(filepath)

        if previous_mode is not None:
            if current_mode != previous_mode:
                # 打印权限变更信息（符号格式）
                old_perm = self._mode_to_str(previous_mode)
                new_perm = self._mode_to_str(current_mode)
                pri = 49
                action = "permission"
                if EVENT_TYPE_DICT["19"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: {user} {action} {filepath} {old_perm} {new_perm} success")
            else:
                pri = 50
                if EVENT_TYPE_DICT["18"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: {user} {action} {filepath} success")

        # 最后再更新权限记录
        self.file_permissions[filepath] = current_mode

    def is_temp_file(self, path):
        """判断是否是临时文件"""
        temp_patterns = ['.tmp', '.swp', '.bak', '.swpx', '.swx', '~', '4913']
        return any(path.endswith(p) for p in temp_patterns) or '~' in os.path.basename(path)


    @staticmethod
    def _mode_to_str(mode):
        """将权限模式转换为 rwx 字符串（例如 'rw-r--r--'）"""
        perm = stat.S_IMODE(mode)
        return (
                ('r' if perm & stat.S_IRUSR else '-') +
                ('w' if perm & stat.S_IWUSR else '-') +
                ('x' if perm & stat.S_IXUSR else '-') +
                ('r' if perm & stat.S_IRGRP else '-') +
                ('w' if perm & stat.S_IWGRP else '-') +
                ('x' if perm & stat.S_IXGRP else '-') +
                ('r' if perm & stat.S_IROTH else '-') +
                ('w' if perm & stat.S_IWOTH else '-') +
                ('x' if perm & stat.S_IXOTH else '-')
        )

    def on_modified(self, event): self._handle_modified(event, "modified")
    def on_created(self, event): self._handle_create(event, "created")
    def on_deleted(self, event): self._handle(event, "deleted")


def monitor_files(paths):
    observer = Observer()
    handler = FileChangeHandler()
    for path in paths:
        observer.schedule(handler, path=path, recursive=True)
    observer.start()
    try:
        # print("Monitoring started...")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

# === 网口监测 ===
def get_all_interfaces():
    interfaces = []
    for iface in os.listdir("/sys/class/net/"):
        # 过滤回环口和常见虚拟接口
        if iface == "lo" or iface.startswith(("veth", "docker", "br", "vir")):
            continue
        interfaces.append(iface)
    return interfaces

def get_interface_state(interface):
    path = f"/sys/class/net/{interface}/operstate"
    try:
        with open(path, 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return "not found"

def log_status_change(interface, old_state, new_state):
    global EVENT_TYPE_DICT
    pri = 136
    ts = datetime.now().strftime("%b %d %H:%M:%S")
    if EVENT_TYPE_DICT["13"]:
        send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: inet {interface} {new_state}")


def monitor_interfaces(interval=1):
    interfaces = get_all_interfaces()

    interface_states = {iface: get_interface_state(iface) for iface in interfaces}

    while True:
        for iface in interfaces:
            new_state = get_interface_state(iface)
            old_state = interface_states.get(iface)
            if new_state != old_state:
                log_status_change(iface, old_state, new_state)
                interface_states[iface] = new_state
        time.sleep(interval)


# === 网络连接 ===
# def monitor_network_connections(stop_event: threading.Event):
#     while not stop_event.is_set():
#         conns = set(psutil.net_connections(kind='inet'))
#         # new_conns = conns - prev_conns
#         for conn in conns:
#             if conn.status == "ESTABLISHED":
#                 resul_data = f"connection: {conn.laddr.ip} {conn.laddr.port} {conn.raddr.ip} {conn.raddr.port}"
#                 pri = 108
#                 now_time = to_syslog_time(get_system_time())
#                 print(f"<{pri}>{now_time} {hostname} audit[{PID}]: {resul_data}")
#         # prev_conns = conns
#         time.sleep(30)


# === 示例模块: 软件安装卸载 系统升级 ===
DPKG_LOG = "/var/log/dpkg.log"
APT_KEY = "pkg_manage"

def get_recent_apt_user():
    # 查找最近10秒内针对该路径的审计事件
    cmd = ['ausearch', '-k', APT_KEY, '-ts', 'recent', '--format', 'raw']
    result = subprocess.run(cmd, capture_output=True, text=True)
    logs = result.stdout.strip().split('\n')

    for log in reversed(logs):
        if all(item in log for item in [APT_KEY, 'auid']):
            try:
                uid_match = re.search(r'\buid=(\d+)\b', log)
                uid = int(uid_match.group(1))
                user = pwd.getpwuid(uid).pw_name

                return user
            except Exception as e:
                return 'unknown', None
    return 'unknown', None


def monitor_dpkg_log():
    global EVENT_TYPE_DICT
    install_pak = {}
    remove_pak = {}
    with open(DPKG_LOG, "r") as f:
        f.seek(0, 2)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.2)
                continue

            part = line.split()
            ts = f"{part[0]} {part[1]}"
            ts = to_syslog_time(ts)

            # 更新成功
            if "status installed kylin-system-updater" in line:
                pri = 105
                if EVENT_TYPE_DICT["7"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} audit[{PID}]: {part[4]} {part[5]} update success")
                continue

            # 更新失败
            if "failed kylin-system-updater" in line:
                pri = 106
                if EVENT_TYPE_DICT["7"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} audit[{PID}]: {part[3]} {part[4]} update failed")
                continue

            if part[2] == "install":
                pri = 96
                if EVENT_TYPE_DICT["21"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: root {part[3]} installing...")
                install_pak[part[3]] = ts
                continue

            if part[2] in ["remove", "purge"]:
                pri = 98
                if EVENT_TYPE_DICT["22"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: root {part[3]} removing...")
                remove_pak[part[3]] = ts
                continue

            if part[3] == "installed" and part[4] in install_pak.keys():
                pri = 97
                user = get_recent_apt_user()
                if EVENT_TYPE_DICT["21"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: root {part[4]} installed success")
                del install_pak[part[4]]
                continue

            if part[3] == "not-installed" and part[4] in remove_pak.keys():
                pri = 99
                user = get_recent_apt_user()
                if EVENT_TYPE_DICT["21"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: root {part[4]} removed success")
                continue


# === 服务启停、时间变更 ===
AUDIT_LOG = "/var/log/audit/audit.log"

def parse_time_change_line(line):
    # 提取时间戳
    time_match = re.search(r"audit\(([\d.]+):\d+\)", line)
    timestamp = float(time_match.group(1)) if time_match else None

    # 转换为人类可读时间
    time_str = datetime.fromtimestamp(timestamp).strftime("%b %d %H:%M:%S") if timestamp else "N/A"

    # 提取 uid
    uid_match = re.search(r'\buid=(\d+)\b', line)
    uid = int(uid_match.group(1)) if uid_match else -1

    try:
        username = pwd.getpwuid(uid).pw_name
    except KeyError:
        username = f"UID:{uid}"

    new_time_str = get_system_time()
    return time_str, username, new_time_str

def parse_service_log(line: str):
    # 提取时间戳（十进制秒数）
    ts_match = re.search(r"audit\((\d+)\.\d+:", line)
    timestamp = time.strftime("%b %d %H:%M:%S", time.localtime(int(ts_match.group(1)))) if ts_match else "?"

    # 提取 uid
    uid_match = re.search(r"uid=(\d+)", line)
    uid = uid_match.group(1) if uid_match else "?"

    # 提取 unit
    unit_match = re.search(r"unit=([^\s]+)", line)
    unit = unit_match.group(1) if unit_match else "?"

    # 提取 res（结果）
    res_match = re.search(r"res=(\w+)", line)
    res = res_match.group(1) if res_match else "?"

    return timestamp, uid, unit, res


def monitor_service_actions():
    global EVENT_TYPE_DICT
    with open(AUDIT_LOG, "r") as f:
        f.seek(0, 2)  # 移动到文件末尾
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.2)
                continue
            # 服务启停
            if line.startswith("type=SERVICE_START"):
                ts, uid, service, result = parse_service_log(line.strip())
                user = pwd.getpwuid(int(uid)).pw_name
                pri = 51
                if EVENT_TYPE_DICT["8"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: {user} {service}.service start {result}")
            if line.startswith("type=SERVICE_STOP"):
                ts, uid, service, result = parse_service_log(line.strip())
                user = pwd.getpwuid(int(uid)).pw_name
                pri = 52
                if EVENT_TYPE_DICT["9"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} agent[{PID}]: {user} {service}.service stop {result}")

            # 时间变更
            if "syscall=227" in line:
                ts, user, set_time = parse_time_change_line(line.strip())
                pri = 133
                if EVENT_TYPE_DICT["11"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} audit[{PID}]: {user} set-time {set_time} success")


# === 开关机记录 ===
'''
 * kylin系统和ubuntu系统文件内时间格式不同 
 * 需要特殊处理
'''
def monitor_power_events():
    global EVENT_TYPE_DICT
    cmd = ["journalctl", "-f", "-t", "SystemEvent", "-n", "2"]  # 只监控自定义的 tag
    with subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True) as proc:
        for line in proc.stdout:
            part = line.strip().split()
            if "System shutdown" in line:
                pri = 80
                ts = f"{part[0]} {part[1]} {part[2]}"
                if OS_INFO['ID'] == 'kylin':
                    ts = datetime.strptime(ts, "%m月 %d %H:%M:%S").strftime("%b %d %H:%M:%S")
                # elif OS_INFO['ID'] == 'ubuntu':
                #     ts = datetime.strptime(ts, "%m月 %d %H:%M:%S").strftime("%b %d %H:%M:%S")
                if EVENT_TYPE_DICT["5"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} {part[4]} System shutdown")
            if "System boot" in line:
                pri = 81
                ts = f"{part[0]} {part[1]} {part[2]}"
                if OS_INFO['ID'] == 'kylin':
                    ts = datetime.strptime(ts, "%m月 %d %H:%M:%S").strftime("%b %d %H:%M:%S")
                if EVENT_TYPE_DICT["6"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} {part[4]} System boot")


# === 外设接口使用usb ===
device_cache = {}

def monitor_devices():
    global EVENT_TYPE_DICT
    context = pyudev.Context()
    monitor = pyudev.Monitor.from_netlink(context)
    monitor.filter_by(subsystem='usb')

    for device in iter(monitor.poll, None):
        action = device.action
        devPath = device.device_path  # 设备路径作为唯一键

        if action == "add":
            # 设备插入时缓存所有信息
            serial = device.get('ID_SERIAL', 'unknown')
            if serial != "unknown":
                device_cache[devPath] = serial

                pri = 128
                ts = datetime.now().strftime("%b %d %H:%M:%S")
                msg = f"{action.upper()} {serial}"
                if EVENT_TYPE_DICT["12"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} audit[{PID}]: {msg}")

        if action == "remove":
            if devPath in device_cache.keys():
                serial = device_cache[devPath]
                del device_cache[devPath]

                pri = 129
                ts = datetime.now().strftime("%b %d %H:%M:%S")
                msg = f"{action.upper()} {serial}"
                if EVENT_TYPE_DICT["12"]:
                    send_to_syslog(f"<{pri}>{ts} {hostname} audit[{PID}]: {msg}")

# === cpu变更 ===
def get_cpuinfo_hash():
    # dmidecode -t processor | grep "ID"
    result = subprocess.run(['dmidecode', '-t', 'processor'], capture_output=True, text=True)
    content = "\n".join(line for line in result.stdout.splitlines() if "ID:" in line)
    return hashlib.md5(content.encode()).hexdigest()

def save_cpuinfo_snapshot():
    snapshot_path = Path('cpuinfo_snapshot.txt')
    result = subprocess.run(['dmidecode', '-t', 'processor'], capture_output=True, text=True)
    content = "\n".join(line for line in result.stdout.splitlines() if "ID:" in line)
    with open(snapshot_path, 'w') as dst:
        dst.write(content)
    return get_cpuinfo_hash()

def check_cpu_change():
    snapshot_path = Path('cpuinfo_snapshot.txt')

    # 如果快照文件不存在，创建并返回无变化
    if not snapshot_path.exists():
        current_hash = save_cpuinfo_snapshot()
        return False

    # 比较当前cpuinfo和快照
    current_hash = get_cpuinfo_hash()
    with open(snapshot_path, 'r') as f:
        snapshot_hash = hashlib.md5(f.read().encode()).hexdigest()

    if current_hash != snapshot_hash:
        # 更新快照文件
        save_cpuinfo_snapshot()
        return True
    else:
        return False


def monit_cpu_change():
    global EVENT_TYPE_DICT
    while True:
        if check_cpu_change():
            pri = 121
            ts = datetime.now().strftime("%b %d %H:%M:%S")
            if EVENT_TYPE_DICT["10"]:
                send_to_syslog(f"<{pri}>{ts} {hostname} audit[{PID}]: hardware cpu changed")
        time.sleep(5)

# === 内存变更 ===
def get_meminfo_key_metrics():
    """只提取内存总量、可用内存等关键指标"""
    with open('/proc/meminfo', 'r') as f:
        content = f.read()

    metrics = {}
    for line in content.splitlines():
        if any(key in line for key in ['MemTotal', 'SwapTotal']):
            key, value = line.split(':', 1)
            metrics[key.strip()] = value.strip()
    return metrics


def check_mem_change():
    snapshot_path = Path('meminfo_snapshot.txt')

    current_metrics = get_meminfo_key_metrics()

    if not snapshot_path.exists():
        with open(snapshot_path, 'w') as f:
            json.dump(current_metrics, f)
        return False

    with open(snapshot_path, 'r') as f:
        old_metrics = json.load(f)

    if current_metrics != old_metrics:
        with open(snapshot_path, 'w') as f:
            json.dump(current_metrics, f)
        return True
    return False


def monit_memory_changed():
    global EVENT_TYPE_DICT
    while True:
        if check_mem_change():
            pri = 122
            ts = datetime.now().strftime("%b %d %H:%M:%S")
            if EVENT_TYPE_DICT["10"]:
                send_to_syslog(f"<{pri}>{ts} {hostname} audit[{PID}]: hardware memory changed")
        time.sleep(5)


# === 硬盘变更 ===
def get_disk_info():
    try:
        output = subprocess.check_output(["fdisk", "-l"], text=True)
    except subprocess.CalledProcessError as e:
        print(f"Error running fdisk: {e}")
        return {}

    disk_info = {}
    current_disk = None

    for line in output.splitlines():
        # 匹配设备名（兼容中英文冒号）
        disk_match = re.match(r"Disk\s+(/dev/[^：:]+)[：:]", line.strip())
        if disk_match:
            current_disk = disk_match.group(1)
            disk_info[current_disk] = {"model": "Unknown", "identifier": "Unknown"}
            continue

        # 匹配 Disk model（兼容中文冒号和空格）
        model_match = re.search(r"Disk model[：:]\s+(.+)", line.strip())
        if model_match and current_disk:
            disk_info[current_disk]["model"] = model_match.group(1).strip("，")
            continue

        # 匹配磁盘标识符（兼容中文和十六进制）
        id_match = re.search(
            r"(Disk identifier|磁盘标识符)[：:]\s*([0-9a-fA-Fx-]+)",
            line
        )
        if id_match and current_disk:
            disk_info[current_disk]["identifier"] = id_match.group(2)
    return disk_info

def compare_disk_info(old, new):
    """比较两次检测结果，返回变化信息"""
    changes = defaultdict(dict)
    all_disks = set(old.keys()) | set(new.keys())

    for disk in all_disks:
        # 磁盘新增
        if disk not in old:
            changes[disk]["action"] = "added"
            changes[disk]["new"] = new[disk]
        # 磁盘移除
        elif disk not in new:
            changes[disk]["action"] = "removed"
            changes[disk]["old"] = old[disk]
        # 磁盘信息变化
        else:
            disk_changes = {}
            if old[disk]["model"] != new[disk]["model"]:
                disk_changes["model"] = {
                    "old": old[disk]["model"],
                    "new": new[disk]["model"]
                }
            if old[disk]["identifier"] != new[disk]["identifier"]:
                disk_changes["identifier"] = {
                    "old": old[disk]["identifier"],
                    "new": new[disk]["identifier"]
                }
            if disk_changes:
                changes[disk]["action"] = "modified"
                changes[disk].update(disk_changes)

    return dict(changes)


def monitor_disks(interval=5):
    global EVENT_TYPE_DICT
    last_info = get_disk_info()

    try:
        while True:
            time.sleep(interval)
            current_info = get_disk_info()
            changes = compare_disk_info(last_info, current_info)

            if changes:
                for disk, change in changes.items():
                    action = change.pop("action")
                    pri = 123
                    ts = datetime.now().strftime("%b %d %H:%M:%S")
                    if EVENT_TYPE_DICT["10"]:
                        send_to_syslog(f"<{pri}>{ts} {hostname} audit[{PID}]: hardware disk changed {disk} {action}")
                last_info = current_info
    except KeyboardInterrupt:
        pass

# tools
def parse_time(time_s: str):
    date_t = f"{datetime.now().year} {time_s}"
    return datetime.strptime(date_t, "%Y %b %d %H:%M:%S").strftime("%Y-%m-%d %H:%M:%S")

def parse_login_fail(line: str):
    pattern = re.compile(
        r'^(?P<time>\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+'           # 时间 time
        r'(?P<hostname>[\w\-.]+)\s+'                               # 主机名 hostname
        r'(?P<service>[\w\-]+)(?:\[\d+\])?:\s+'                    # 服务名和可选的 [PID] 
        r'pam_unix\([^\)]+\):\s+authentication failure;.*?'       # pam_unix(...) 部分
        r'tty=(?P<tty>[^\s]*)\s+'                                  # tty（可选）
        r'ruser=[^\s]*\s+'                                         # ruser（丢弃）
        r'rhost=(?P<ip>[^\s]*)\s+'                                 # rhost
        r'user=(?P<user>[^\s]+)'                                   # user
    )

    match = pattern.search(line)
    if match:
        result = match.groupdict()
        result['time'] = parse_time(result['time'])
        if result['service'] != "sshd":
            result['service'] = "localhost"
            result['ip'] = "127.0.0.1"
        return result
    else:
        return None


def get_system_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def to_syslog_time(date):
    return datetime.strptime(date, "%Y-%m-%d %H:%M:%S").strftime("%b %d %H:%M:%S")


def send_heart():
    while True:
        try:
            heart_data = {"type": 1, "uuid": str(uuid.uuid4()), "time": int(time.time() * 1000)}
            print(f"send heart ===== {heart_data}")
            if MODE == 1:
                sock.sendto(json.dumps(heart_data).encode("utf-8"), (LOG_SERVER, LOG_PORT))
        except Exception as e:
            print(f"send fail: {e}")

        time.sleep(20)


def start_udp_listen(port: int):
    try:
        if is_ipv4(LOG_SERVER):
            print("ipv4")
            sock_server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock_server.bind(("0.0.0.0", port))
        elif is_ipv6(LOG_SERVER):
            print("ipv6")
            sock_server = socket.socket(socket.AF_INET6, socket.SOCK_DGRAM)
            sock_server.bind(("::", port))

        send_thread = threading.Thread(target=send_heart)
        send_thread.daemon = True
        send_thread.start()

        # 接收采集策略
        while True:
            data, addr = sock_server.recvfrom(2048)
            callback_recv(data, addr)

    except Exception as e:
        raise e


def callback_recv(data, addr):
    global EVENT_TYPE_DICT
    try:
        msg = data.decode("utf-8")
        print(f"过滤的id：{msg}")
        EVENT_TYPE_DICT = {key: True for key in EVENT_TYPE_DICT}
        if msg == "-1":
            save_event_type_dict()
            return
        ids = msg.split(",")
        for item in ids:
            EVENT_TYPE_DICT[item] = False
        save_event_type_dict()
    except Exception as e:
        print(f"处理接收数据失败：{e}")


# === 主函数 ===
def main():

    init_thread = threading.Thread(target=start_udp_listen, args=(516,))
    init_thread.daemon = True
    init_thread.start()

    ts = datetime.now().strftime("%b %d %H:%M:%S")
    send_to_syslog(f"<101>{ts} {hostname} audit[{PID}]: auditAgent install online")

    threads = [
        threading.Thread(target=send_history_log),   # 发送错误时 记录日志 重发
        threading.Thread(target=monitor_auth_fail),  # 登陆失败、su切换、用户新增删除修改密码
        threading.Thread(target=agentLoginMonit),    # 登陆成功监测
        threading.Thread(target=monitor_files, args=(MONITOR_DIR,)),  # 文件变更
        threading.Thread(target=monitor_interfaces, args=(1, )),   # 网口监测
        # threading.Thread(target=monitor_network_connections),      # 网络活动检测
        threading.Thread(target=monitor_dpkg_log),                 # 软件安装卸载、系统升级
        threading.Thread(target=monitor_service_actions),          # 服务启停和时间变更
        threading.Thread(target=monitor_power_events),             # 开关机
        threading.Thread(target=monitor_devices),                  # 外设 usb设备记录
        threading.Thread(target=monit_cpu_change),                  # cpu 监测
        threading.Thread(target=monit_memory_changed),
        threading.Thread(target=monitor_disks)
    ]

    for t in threads:
        t.daemon = True
        t.start()

    def signal_handler(sig, frame):
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
    signal.signal(signal.SIGTERM, signal_handler)  # kill 命令

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("=" * 32)


if __name__ == '__main__':
    setup_logging()
    main()
