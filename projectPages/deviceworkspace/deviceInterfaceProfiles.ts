import profiles from './deviceInterfaceProfiles.json';

export interface DeviceInterfaceProfile {
    model: string;
    source: string;
    sourceNote: string;
    faces: {
        id: string;
        title: string;
        image: string;
        width: number;
        height: number;
        minWidth: number;
        ports: {
            id: string;
            aliases: string[];
            label: string;
            kind: 'ethernet' | 'serial' | 'dido' | 'power';
            x: number;
            y: number;
        }[];
    }[];
}

export function getDeviceInterfaceProfile(model: string): DeviceInterfaceProfile | undefined {
    const key = model.replace(/\s+/g, '').toUpperCase();
    const canonicalKey = key === 'PBOX6218A' ? 'PBOX6218A/ZK' : key;
    return Object.prototype.hasOwnProperty.call(profiles, canonicalKey)
        ? (profiles as Record<string, DeviceInterfaceProfile>)[canonicalKey] : undefined;
}
