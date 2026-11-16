import { computed, ref } from 'vue';
import { fetchGetAllUserDataList } from '@/service/member';

/**
 * 运营—销售模块：统一用户字典（ID → 姓名，模块级缓存多页共用）
 * 列表/详情里的 created_by、origin_user_id 等均为 sys_user.id，
 * 后端只回 ID，前端统一经此字典映射成姓名展示。
 * usertype 编码：0 超级管理员 / 1 销售人员 / 2 项目负责人 / 3 调试工程师 / 4 综合管理 /
 * 5 研发 / 6 生产 / 7 厂家 / 8 测试 / 9 组长 / 10 只读 / 11 财务 / 12 运营
 */
const allUsers = ref<any[]>([]);
let loading: Promise<void> | null = null;

/** 字典覆盖我司全部在职员工类型（厂家 7、只读 10 不参与线索/展会业务） */
const STAFF_USERTYPES = '0,1,2,3,4,5,6,8,9,11,12';

export function useOpUserMap() {
    const userMap = computed(() => {
        const map: Record<string, string> = {};
        allUsers.value.forEach((u: any) => {
            map[String(u.id)] = u.username;
        });
        return map;
    });

    /** usertypes 支持单值或逗号串；缓存命中时忽略后续参数 */
    const load = (usertypes: string = STAFF_USERTYPES) => {
        if (loading) return loading;
        loading = (async () => {
            try {
                const data: any = await fetchGetAllUserDataList({ page: 1, limit: 999, usertypes });
                allUsers.value = data?.list ?? [];
            } catch (err) {
                console.error('获取用户字典失败', err);
            }
            loading = null;
        })();
        return loading;
    };

    /** ID → 姓名，缺失时回退显示 用户#ID */
    const nameOf = (id: any) => (id == null || id === '' ? '-' : userMap.value[String(id)] || `用户#${id}`);

    /** 全部有效（status=0）用户选项：展会参展人多选、线索提供人选择用 */
    const activeUserOptions = computed(() => allUsers.value.filter((u: any) => Number(u?.status) === 0));

    return { userMap, allUsers, load, nameOf, activeUserOptions };
}

/** 按人员类型拉取有效（status=0）用户列表（销售/线索提供人/参展人候选用），缺省取全部员工类型 */
export async function fetchActiveUsers(usertypes: string = STAFF_USERTYPES): Promise<any[]> {
    try {
        const data: any = await fetchGetAllUserDataList({ page: 1, limit: 999, usertypes });
        return (data?.list ?? []).filter((u: any) => Number(u?.status) === 0);
    } catch (err) {
        console.error('获取用户列表失败', err);
        return [];
    }
}
