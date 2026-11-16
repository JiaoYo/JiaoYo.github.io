export interface DeviceIssue {
    id: string;
    model: string;
    category: string;
    tags: string[];
    title: string;
    symptoms: string;
    cause: string;
    solutions: string[];
    resolvedAt: string;
    resolution: string;
    projectId?: string;
    projectName?: string;
    investigation?: string;
    solution?: string;
    status?: 'pending' | 'resolved';
}

export interface CreateDeviceIssueInput {
    projectId: string;
    projectName: string;
    model: string;
    symptoms: string;
    investigation: string;
    solution: string;
    tags: string[];
}

export const DEVICE_ISSUE_TAGS = ['网络连接', '数据采集', '测点配置', '平台上送', '供电接线', '设备配置', '其他'];

const LOCAL_ISSUES_KEY = 'device-issues:local';

function readLocalIssues(): DeviceIssue[] {
    const stored = uni.getStorageSync(LOCAL_ISSUES_KEY);
    return Array.isArray(stored) ? stored : [];
}

export function createDeviceIssue(input: CreateDeviceIssueInput): DeviceIssue {
    const issue: DeviceIssue = {
        id: `local-${Date.now()}`,
        model: input.model.trim(),
        category: '现场反馈',
        tags: [...input.tags],
        title: input.symptoms.trim(),
        symptoms: input.symptoms.trim(),
        cause: '',
        solutions: [],
        resolvedAt: '',
        resolution: '',
        projectId: input.projectId,
        projectName: input.projectName.trim(),
        investigation: input.investigation.trim(),
        solution: input.solution.trim(),
        status: 'pending',
    };
    uni.setStorageSync(LOCAL_ISSUES_KEY, [issue, ...readLocalIssues()]);
    return issue;
}

const mockIssues: DeviceIssue[] = [
    {
        id: 'PBOX6140H-NET-001',
        model: 'PBox6140H',
        category: '网络与连接',
        tags: ['网络连接', '管理页面'],
        title: '网关地址可达，管理页面访问超时',
        symptoms: '电脑可以 ping 通网关，但浏览器无法打开管理页面，现场无法继续配置采集参数。',
        cause: '电脑代理转发了内网请求，或访问端口与网关实际配置的管理端口不一致。',
        solutions: [
            '确认电脑与网关接入同一网络，记录网关实际 IP 地址。',
            '暂时关闭电脑代理和 VPN，避免内网地址被转发到其他网络。',
            '向设备管理员核对管理端口，使用正确的 IP 和端口重新访问。',
        ],
        resolvedAt: '2026-10-27',
        resolution: '关闭电脑代理并使用正确的管理端口后，管理页面恢复访问。',
        status: 'resolved',
    },
    {
        id: 'PBOX6140H-DATA-002',
        model: 'PBox6140H',
        category: '数据采集',
        tags: ['数据采集', '测点配置'],
        title: '串口设备有响应，但平台上没有测点数据',
        symptoms: '采集日志中能看到设备响应，平台测点却长期不更新，也未出现新的告警。',
        cause: '测点配置中的从站地址、寄存器地址或数据类型与现场设备不一致。',
        solutions: [
            '核对现场设备的从站地址和通信参数，确保与采集通道配置一致。',
            '按设备点表逐项检查寄存器偏移、数据类型和字节序。',
            '重新下发配置，观察原始报文与平台测点，确认数据恢复上送。',
        ],
        resolvedAt: '2026-10-19',
        resolution: '修正寄存器偏移和字节序后，测点数据恢复正常更新。',
        status: 'resolved',
    },
    {
        id: 'PBOX6140H-NET-003',
        model: 'PBox6140H',
        category: '网络与连接',
        tags: ['网络连接', '平台上送'],
        title: '平台间歇性离线，重启后短时间恢复',
        symptoms: '网关本地运行正常，但平台连接反复中断，断电重启后只能维持一段时间。',
        cause: '现场上行网络不稳定，同时平台地址或心跳参数未按项目要求配置。',
        solutions: [
            '检查网线、交换机和运营商网络，排除供电及链路接触不良。',
            '核对平台地址、端口和心跳周期，避免连接到旧项目环境。',
            '恢复配置后持续观察在线状态和重连日志，确认链路稳定。',
        ],
        resolvedAt: '2026-09-28',
        resolution: '更换异常网线并修正平台连接参数后，设备持续稳定在线。',
        status: 'resolved',
    },
];

export function fetchDeviceIssues(model: string): Promise<DeviceIssue[]> {
    const normalizedModel = model.trim().toLowerCase();
    const result = [...readLocalIssues(), ...mockIssues].filter(issue => issue.model.toLowerCase() === normalizedModel);
    return new Promise(resolve => {
        setTimeout(() => resolve(result.map(issue => ({ ...issue, tags: [...(issue.tags || [])], solutions: [...(issue.solutions || [])] }))), 350);
    });
}
