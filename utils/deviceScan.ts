export type DeviceScanType = 'barCode' | 'qrCode';

let scanStarting = false;

export function openDeviceWorkspace(code: string, type: DeviceScanType) {
    uni.navigateTo({
        url: `/projectPages/deviceworkspace/Index?code=${encodeURIComponent(code)}&type=${type}`,
    });
}

export function startDeviceScan(type?: DeviceScanType) {
    if (scanStarting) return;
    scanStarting = true;
    const query = type ? `?type=${type}` : '';
    uni.navigateTo({
        url: `/projectPages/devicescan/Index${query}`,
        complete: () => {
            scanStarting = false;
        },
    });
}
