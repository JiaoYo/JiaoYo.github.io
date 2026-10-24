### 麒麟V10版本

#### 环境配置以及安装
开发环境配置

pip install -r requirements.txt

#### 部署以及安装
1、打包

    pyinstaller -F -w auditAgent.py

2、部署
    
    复制dist目录下的可执行文件到主目录下（与conf同级）

    配置 修改conf/importConf——watch.rules文件中的路径 修改成要监测的文件或者目录后安装程序(标识符勿修改)

    修改conf/auditAgent.json中的参数
    remote_host: 审计主机IP
    remote_port": 审计主机端口号, 
    mode: 0, 0：不发送只再程序内打印（调试用） 1：发送至主机（生产环境使用） 
    log_file: 日志文件路径

    执行./install_auditAgent.sh 即可安装启动
    
    执行./uninstall_auditAgent.sh 卸载

    ./restart_auditAgent.sh 重启

3、tip
    
    最终安装包内只有conf目录，auditAgent可执行文件，install_auditAgent.sh、uninstall_auditAgent.sh、restart_auditAgent.sh、start_auditAgent.sh、status_auditAgent.sh、stop_auditAgent.sh

国内镜像站: https://pypi.tuna.tsinghua.edu.cn/simple/
