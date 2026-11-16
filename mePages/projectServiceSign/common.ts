// 项目服务验收单：app 端公共常量与工具
import { copyText } from '@/utils/copyText';
import { BASE_URL } from '@/utils/request';

// 状态定义（0 待签名 / 1 已签名 / 2 已过期 / 3 已撤销）
export const STATUS_MAP: Record<number, { label: string; type: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'default' }> = {
  0: { label: '待签名', type: 'primary' },
  1: { label: '已签名', type: 'success' },
  2: { label: '已过期', type: 'danger' },
  3: { label: '已撤销', type: 'warning' }
};

// 服务意见（DB service_opinion 1~6）
export const OPINION_MAP: Record<number, string> = {
  1: '非常满意',
  2: '满意',
  3: '基本满意',
  4: '基本接受',
  5: '勉强接受',
  6: '非常不满'
};

export function statusInfo(status: number) {
  return STATUS_MAP[status] || { label: '未知', type: 'default' as const };
}

export function opinionText(v: any): string {
  if (v == null) return '-';
  return OPINION_MAP[v] != null ? OPINION_MAP[v] : String(v);
}

// 状态提示文案
export function statusHint(status: number): string {
  const hints: Record<number, string> = {
    0: '等待客户打开链接并签名。可下拉刷新查看最新状态。',
    1: '客户已完成签名，签名图片与最终 Word 可下载归档。',
    2: '链接已过期，客户无法继续签名，请重新生成新的服务单。',
    3: '链接已撤销，客户无法继续签名，请重新生成新的服务单。'
  };
  return hints[status] || '';
}

// 生成服务单文件名：xxxx项目（合同编号）的已签名/未签名服务单.docx
// 组合完整名称：客户名称 + 项目名称（项目名已含客户名时避免重复）
export function buildFullName(row: any): string {
  const customer = row?.customerName || row?.customername || '';
  const project = row?.projectName || row?.proname || row?.project_name || '';
  if (!customer) return project || '项目';
  if (!project) return customer;
  return project.includes(customer) ? project : `${customer}${project}`;
}

export function buildDocName(row: any, signed: boolean): string {
  const main = buildFullName(row);
  const contract = row?.contractNo || row?.contract_no || row?.contractnum || row?.contractNum || '';
  const label = signed ? '已签名服务单' : '未签名服务单';
  return `${main}${contract ? `（${contract}）` : ''}的${label}.docx`;
}

// 生成签名证据包文件名：项目名（合同编号）签名证据包.zip
export function buildEvidenceZipName(row: any): string {
  const main = buildFullName(row);
  const contract = row?.contractNo || row?.contract_no || row?.contractnum || row?.contractNum || '';
  return `${main}${contract ? `（${contract}）` : ''}签名证据包.zip`;
}

// 合同下拉 label：合同名称 + 合同编号
export function contractLabel(c: any): string {
  const name = c?.contractname || c?.contractName || '';
  const num = c?.contractnum || c?.contractNum || '';
  return name && num ? `${name}(${num})` : name || num || '';
}

// 设备展示文本：名称 + 型号 + 数量
export function deviceText(d: any): string {
  const name = d?.devname || d?.deviceName || d?.name || `设备#${d?.id}`;
  const parts = [name];
  if (d?.model) parts.push(`型号:${d.model}`);
  if (d?.quantity != null) parts.push(`数量:${d.quantity}${d.unit || ''}`);
  return parts.join(' ');
}

// 统一复制，带 toast 反馈
export async function copySignText(text: string, emptyTip = '内容不存在，无法复制') {
  if (!text) {
    uni.showToast({ title: emptyTip, icon: 'none' });
    return false;
  }
  try {
    await copyText(text);
    uni.showToast({ title: '复制成功', icon: 'success' });
    return true;
  } catch (e: any) {
    uni.showToast({ title: e?.message || '复制失败', icon: 'none' });
    return false;
  }
}

// 归一化文件 URL：相对路径拼上服务地址
export function normalizeFileUrl(url?: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return BASE_URL + (url.startsWith('/') ? url : `/${url}`);
}

/**
 * 下载并打开 docx 服务单
 * 优先 uni.downloadFile + uni.openDocument（微信小程序内可预览，APP 会用系统应用打开），
 * 失败时降级为系统浏览器直接打开链接。
 */
export function openDocx(url?: string, name?: string) {
  const fullUrl = normalizeFileUrl(url);
  if (!fullUrl) {
    uni.showToast({ title: '文件地址不存在', icon: 'none' });
    return;
  }
  // H5 端没有系统文档预览能力，直接走浏览器下载
  // #ifdef H5
  downloadFileH5(fullUrl, name);
  // #endif
  // #ifndef H5
  uni.showLoading({ title: '正在下载...', mask: true });
  uni.downloadFile({
    url: fullUrl,
    header: { token: uni.getStorageSync('token') },
    success(res) {
      if (res.statusCode !== 200) {
        uni.hideLoading();
        uni.showToast({ title: '下载失败', icon: 'none' });
        return;
      }
      uni.openDocument({
        filePath: res.tempFilePath,
        fileType: 'docx',
        showMenu: true,
        success: () => uni.hideLoading(),
        fail: () => {
          uni.hideLoading();
          // 无法用系统打开时不再静默跳浏览器，提示用户选择保存/分享
          uni.showToast({ title: '无法直接预览，请选择「保存到手机」或「分享到微信」', icon: 'none' });
        }
      });
    },
    fail() {
      uni.hideLoading();
      uni.showToast({ title: '下载失败，请检查网络', icon: 'none' });
    }
  });
  // #endif
}

/** 复制文件链接（备用，方便发到微信等） */
export function copyDocxUrl(url?: string) {
  copySignText(normalizeFileUrl(url), '文件地址不存在');
}

/**
 * 文件操作菜单（Android）：预览 / 保存到手机 / 分享到微信 / 浏览器打开
 * 替换原来的"查看/下载"按钮，避免直接预览失败时静默跳浏览器。
 */
export function showFileActions(opts: { url?: string; name?: string }) {
  const fullUrl = normalizeFileUrl(opts.url);
  if (!fullUrl) {
    uni.showToast({ title: '文件地址不存在', icon: 'none' });
    return;
  }
  // #ifdef APP-PLUS
  uni.showActionSheet({
    itemList: ['预览文件', '保存到手机', '分享到微信','用浏览器打开'],//, 
    success: (res) => {
      const i = res.tapIndex;
      if (i === 0) openDocx(opts.url, opts.name);
      else if (i === 1) saveToPhone(opts.url, opts.name);
      else if (i === 2) shareLocalFileToWeixin(opts.url, opts.name);
      else if (i === 3) openInBrowser(opts.url);
    },
    fail: () => {}
  });
  // #endif
  // #ifdef MP-WEIXIN
  // 小程序无文件分享能力，直接预览（openDocument 自带保存/转发菜单）
  uni.showActionSheet({
    itemList: ['预览文件'],
    success: () => openDocx(opts.url, opts.name),
    fail: () => {}
  });
  // #endif
  // #ifdef H5
  downloadFileH5(fullUrl, opts.name);
  // #endif
}

/** 保存到手机：Android 写入系统下载目录，用户在文件管理 / 微信"文件"里可见 */
export function saveToPhone(url?: string, name?: string) {
  const fullUrl = normalizeFileUrl(url);
  if (!fullUrl) {
    uni.showToast({ title: '文件地址不存在', icon: 'none' });
    return;
  }
  const fileName = name || `file_${Date.now()}.docx`;
  // #ifdef APP-PLUS
  uni.showLoading({ title: '正在保存...', mask: true });
  try {
    const dtask = plus.downloader.createDownload(
      fullUrl,
      { filename: `_downloads/${fileName}` },
      (d: any, status: number) => {
        uni.hideLoading();
        if (status === 200) {
          uni.showToast({ title: '已保存到手机下载目录', icon: 'none' });
          try {
            // @ts-ignore
            plus.runtime.openFile(d.filename, () => {}, (e: any) => console.error('打开文件失败', e));
          } catch (e) {
            console.error('打开文件失败', e);
          }
        } else {
          uni.showToast({ title: '保存失败', icon: 'none' });
        }
      }
    );
    dtask.start();
  } catch (e) {
    uni.hideLoading();
    console.error('保存失败', e);
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
  // #endif
  // #ifdef MP-WEIXIN
  // 小程序无法直接写入手机存储，改为预览（预览界面自带保存菜单）
  openDocx(fullUrl, fileName);
  // #endif
  // #ifdef H5
  downloadFileH5(fullUrl, fileName);
  // #endif
}
/**
 * 规范化文件名
 *
 * 示例：
 * 上能SP70kW-modbus点表.xls?xxx
 *   ↓
 * 上能SP70kW-modbus点表.xls
 *
 * https://xxx.com/test/文件.xls?xxx
 *   ↓
 * 文件.xls
 */
function normalizeFileName(fileName: string): string {
	if (!fileName) {
		return '';
	}

	let name = String(fileName).trim();

	// -----------------------------------------
	// 1. 如果传进来的是完整 URL
	// -----------------------------------------
	if (/^https?:\/\//i.test(name)) {
		try {
			const url = new URL(name);

			// URL pathname 最后一段
			name = url.pathname.split('/').pop() || '';

			// URL 解码
			try {
				name = decodeURIComponent(name);
			} catch (e) {
				// decode 失败就继续使用原名称
			}
		} catch (e) {
			// URL 解析失败，继续按普通文件名处理
		}
	}

	// -----------------------------------------
	// 2. 去掉 ? 后面的参数
	// -----------------------------------------
	if (name.includes('?')) {
		name = name.split('?')[0];
	}

	// -----------------------------------------
	// 3. 去掉 # 后面的 hash
	// -----------------------------------------
	if (name.includes('#')) {
		name = name.split('#')[0];
	}

	// -----------------------------------------
	// 4. 如果是路径，只保留最后的文件名
	// -----------------------------------------
	name = name
		.replace(/\\/g, '/')
		.split('/')
		.pop() || '';

	// -----------------------------------------
	// 5. URL 解码
	// -----------------------------------------
	try {
		name = decodeURIComponent(name);
	} catch (e) {
		// 可能已经是正常中文，不处理
	}

	// -----------------------------------------
	// 6. 去掉 Android / Windows 不允许的字符
	// -----------------------------------------
	name = name.replace(/[\\/:*?"<>|]/g, '_');

	// -----------------------------------------
	// 7. 去掉控制字符
	// -----------------------------------------
	name = name.replace(/[\u0000-\u001F\u007F]/g, '');

	// -----------------------------------------
	// 8. 去掉首尾空格和句号
	// -----------------------------------------
	name = name.trim();
	name = name.replace(/[. ]+$/, '');

	// -----------------------------------------
	// 9. 防止文件名为空
	// -----------------------------------------
	if (!name) {
		return '未命名文件';
	}

	return name;
}
function getFileProviderUri(filePath: string): string {
	try {
		const main =
			plus.android.runtimeMainActivity();

		const packageName =
			main.getPackageName();

		const authority =
			packageName + '.fileprovider';

		console.log('========== FileProvider 检查 ==========');

		console.log(
			'packageName:',
			packageName
		);

		console.log(
			'authority:',
			authority
		);

		// ==========================================
		// ① 检查 Provider 是否注册到当前 APK
		// ==========================================

		const packageManager =
			main.getPackageManager();

		const providerInfo =
			plus.android.invoke(
				packageManager,
				'resolveContentProvider',
				authority,
				0
			);

		console.log(
			'========== Provider 检查 =========='
		);

		console.log(
			'providerInfo:',
			providerInfo
		);

		// ==========================================
		// ② 检查文件
		// ==========================================

		const File =
			plus.android.importClass(
				'java.io.File'
			);

		const file =
			new File(filePath);

		const exists =
			plus.android.invoke(
				file,
				'exists'
			);

		console.log(
			'filePath:',
			filePath
		);

		console.log(
			'file exists:',
			exists
		);

		if (!exists) {
			throw new Error(
				'文件不存在：' + filePath
			);
		}

		// ==========================================
		// ③ 获取 FileProvider URI
		// ==========================================

		const FileProvider =
			plus.android.importClass(
				'androidx.core.content.FileProvider'
			);

		const uri =
			FileProvider.getUriForFile(
				main,
				authority,
				file
			);

		console.log(
			'FileProvider uri:',
			uri
		);

		if (!uri) {
			throw new Error(
				'FileProvider.getUriForFile() 返回 null'
			);
		}

		const uriString =
			plus.android.invoke(
				uri,
				'toString'
			);

		console.log(
			'content URI:',
			uriString
		);

		return uriString;

	} catch (error) {

		console.error(
			'getFileProviderUri 失败:',
			error
		);

		throw error;
	}
}
/**
 * 分享在线文件到微信
 *
 * @param fileUrl  在线文件地址
 * @param fileName 文件名称
 */
function shareLocalFileToWeixin(
	fileUrl: string,
	fileName: string
) {
	// #ifdef APP-PLUS

	try {
		if (plus.os.name !== 'Android') {
			uni.showToast({
				title: '目前仅支持 Android',
				icon: 'none'
			});
			return;
		}

		// 1. 处理在线地址
		const fullUrl = fileUrl?.startsWith('http')
			? fileUrl
			: normalizeFileUrl(fileUrl);

		if (!fullUrl) {
			uni.showToast({
				title: '文件地址不存在',
				icon: 'none'
			});
			return;
		}

		// 2. 清理文件名
		const cleanFileName =
			normalizeFileName(fileName);

		if (!cleanFileName) {
			uni.showToast({
				title: '文件名称不存在',
				icon: 'none'
			});
			return;
		}

		console.log('========== 开始微信文件分享 ==========');
		console.log('在线地址:', fullUrl);
		console.log('文件名称:', cleanFileName);

		uni.showLoading({
			title: '准备分享...',
			mask: true
		});

		// 3. 下载在线文件
		uni.downloadFile({
			url: fullUrl,

			success: (res) => {

				console.log('下载结果:', res);

				if (
					res.statusCode !== 200 ||
					!res.tempFilePath
				) {
					uni.hideLoading();

					console.error(
						'文件下载失败:',
						res
					);

					uni.showToast({
						title: '文件获取失败',
						icon: 'none'
					});

					return;
				}

				const localFilePath =
					res.tempFilePath;

				console.log(
					'下载后的本地文件:',
					localFilePath
				);

				// 4. 确认文件存在
				plus.io.resolveLocalFileSystemURL(
					localFilePath,

					(entry) => {

						console.log(
							'本地文件存在:',
							entry.fullPath
						);

						// ==================================================
						// 重点：这里调用 copyFileToShareDir
						// ==================================================

						copyFileToShareDir(
							entry.fullPath,
							cleanFileName,

							(shareFilePath) => {

								console.log(
									'========== 分享文件准备完成 =========='
								);

								console.log(
									'分享文件路径:',
									shareFilePath
								);

								try {

									// 5. 获取 FileProvider URI
									const contentUri =
										getFileProviderUri(
											shareFilePath
										);

									console.log(
										'FileProvider URI:',
										contentUri
									);

									// 6. 分享到微信
									shareContentUriToWeixin(
										contentUri,
										cleanFileName
									);

								} catch (error) {

									uni.hideLoading();

									console.error(
										'获取 FileProvider URI 失败:',
										error
									);

									uni.showModal({
										title: '分享失败',
										content:
											'无法生成文件共享地址，请检查 FileProvider 配置',
										showCancel: false
									});
								}
							},

							(error) => {

								uni.hideLoading();

								console.error(
									'复制分享文件失败:',
									error
								);

								uni.showToast({
									title: '文件准备失败',
									icon: 'none'
								});
							}
						);
					},

					(error) => {

						uni.hideLoading();

						console.error(
							'解析本地文件失败:',
							error
						);

						uni.showToast({
							title: '文件解析失败',
							icon: 'none'
						});
					}
				);
			},

			fail: (error) => {

				uni.hideLoading();

				console.error(
					'文件下载失败:',
					error
				);

				uni.showToast({
					title: '文件下载失败',
					icon: 'none'
				});
			}
		});

	} catch (error) {

		uni.hideLoading();

		console.error(
			'微信文件分享异常:',
			error
		);

		uni.showModal({
			title: '分享失败',
			content: '文件分享异常',
			showCancel: false
		});
	}

	// #endif
}
/**
 * 将 content:// URI 分享到微信
 */
function shareContentUriToWeixin(
	contentUri: string,
	fileName: string
) {
	try {

		const main =
			plus.android.runtimeMainActivity();

		const Intent =
			plus.android.importClass(
				'android.content.Intent'
			);

		const Uri =
			plus.android.importClass(
				'android.net.Uri'
			);

		const intent =
			new Intent(Intent.ACTION_SEND);

		const mimeType =
			getMimeType(fileName);

		const uri =
			Uri.parse(contentUri);

		console.log(
			'========== 微信文件分享 =========='
		);

		console.log(
			'文件名称:',
			fileName
		);

		console.log(
			'MIME:',
			mimeType
		);

		console.log(
			'Content URI:',
			contentUri
		);

		// MIME
		intent.setType(
			mimeType
		);

		// 文件
		intent.putExtra(
			Intent.EXTRA_STREAM,
			uri
		);

		// 授权微信读取文件
		intent.addFlags(
			Intent.FLAG_GRANT_READ_URI_PERMISSION
		);

		// 指定微信
		intent.setPackage(
			'com.tencent.mm'
		);

		uni.hideLoading();

		// 启动微信
		main.startActivity(intent);

	} catch (error) {

		uni.hideLoading();

		console.error(
			'启动微信失败:',
			error
		);

		uni.showModal({
			title: '分享失败',
			content:
				'无法打开微信文件分享',
			showCancel: false
		});
	}
}
/**
 * 将文件复制到 Android App 的 external files 目录
 * 用于 FileProvider 分享
 */
function copyFileToShareDir(
	sourcePath: string,
	fileName: string,
	success: (path: string) => void,
	fail: (error: any) => void
) {
	try {
		console.log('========== 开始准备分享文件 ==========');
		console.log('源文件:', sourcePath);
		console.log('文件名:', fileName);

		// 直接使用当前 App 的 _doc 目录
		// plus.io.PRIVATE_DOC 是 HBuilder/uni-app 可访问的应用文档目录
		plus.io.resolveLocalFileSystemURL(
			'_doc/',

			(docDir) => {

				console.log(
					'App 文档目录:',
					docDir.fullPath
				);

				const targetName =
					`${Date.now()}_${fileName}`;

				console.log(
					'目标文件名:',
					targetName
				);

				// 解析源文件
				plus.io.resolveLocalFileSystemURL(
					sourcePath,

					(sourceEntry) => {

						console.log(
							'源文件解析成功:',
							sourceEntry.fullPath
						);

						// 复制到 App 文档目录
						sourceEntry.copyTo(
							docDir,
							targetName,

							(newEntry) => {

								console.log(
									'========== 文件复制成功 =========='
								);

								console.log(
									'分享文件:',
									newEntry.fullPath
								);

								success(
									newEntry.fullPath
								);
							},

							(error) => {

								console.error(
									'copyTo 失败:',
									error
								);

								fail(error);
							}
						);
					},

					(error) => {

						console.error(
							'源文件解析失败:',
							error
						);

						fail(error);
					}
				);
			},

			(error) => {

				console.error(
					'App 文档目录解析失败:',
					error
				);

				fail(error);
			}
		);

	} catch (error) {

		console.error(
			'copyFileToShareDir 异常:',
			error
		);

		fail(error);
	}
}
/** 调用系统分享面板发送文件（Android，FileProvider + Intent.ACTION_SEND） */
function shareFileViaSystem(filePath: string) {
  // #ifdef APP-PLUS
  try {
    const main = plus.android.runtimeMainActivity();
    // androidx 与 support 兼容
    let FileProvider;
    try {
      FileProvider = plus.android.importClass('androidx.core.content.FileProvider');
    } catch (e) {
      FileProvider = plus.android.importClass('android.support.v4.content.FileProvider');
    }
    const Intent = plus.android.importClass('android.content.Intent');
    const javaFile = plus.android.importClass('java.io.File');
    // d.filename 是相对路径（如 _doc/xxx.docx），java.io.File 按进程根目录解析会找不到真实文件，
    // 必须先转成绝对路径再给 FileProvider，否则微信收到 content:// 后报「获取资源失败」
    let absPath = filePath;
    if (!/^(file:|\/)/.test(absPath)) {
      absPath = plus.io.convertLocalFileSystemURL(absPath).replace(/^file:\/\//, '');
    }
    const fileObj = new javaFile(absPath);
    const packageName = main.getPackageName();
    // authority 必须与打包后的 FileProvider 声明一致（nativeResources/android/AndroidManifest.xml）
    const uri = FileProvider.getUriForFile(main, `${packageName}.fileprovider`, fileObj);
    const intent = new Intent(Intent.ACTION_SEND);
    intent.setType(mimeFromName(absPath));
    intent.putExtra(Intent.EXTRA_STREAM, uri);
    // ClipData + READ 授权：保证 content:// 的读权限能穿透 createChooser 授予微信（Android 11+ 必须）
    const ClipData = plus.android.importClass('android.content.ClipData');
    intent.setClipData(ClipData.newRawUri('', uri));
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    main.startActivity(Intent.createChooser(intent, '分享文件'));
  } catch (e) {
    console.error('分享失败', e);
    uni.showToast({ title: '分享失败，请重试', icon: 'none' });
  }
  // #endif
}

/** 根据文件扩展名推断 MIME（docx/zip 等），让微信等接收方正确识别文档类型 */
function mimeFromName(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    pdf: 'application/pdf',
    zip: 'application/zip',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    txt: 'text/plain'
  };
  return map[ext] || 'application/octet-stream';
}

/** 用系统浏览器打开（保留为兜底选项） */
export function openInBrowser(url?: string) {
  const fullUrl = normalizeFileUrl(url);
  if (!fullUrl) {
    uni.showToast({ title: '文件地址不存在', icon: 'none' });
    return;
  }
  // #ifdef APP-PLUS
  try {
    // @ts-ignore
    plus.runtime.openURL(fullUrl);
  } catch (e) {
    uni.showToast({ title: '打开失败', icon: 'none' });
  }
  // #endif
  // #ifdef H5
  window.open(fullUrl, '_blank');
  // #endif
  // #ifdef MP-WEIXIN
  uni.showToast({ title: '小程序端暂不支持浏览器打开', icon: 'none' });
  // #endif
}

/** H5 下载文件 */
function downloadFileH5(url: string, name?: string) {
  // #ifdef H5
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'download';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    console.error('下载失败', e);
    uni.showToast({ title: '下载失败', icon: 'none' });
  }
  // #endif
}

/**
 * 导出签名证据包（zip）
 * 走 arraybuffer 请求：能还原后端返回的错误提示（如"签署证据不完整"），
 * 是 zip 则写入本地文件并尝试打开。
 */
/**
 * 证据包操作菜单（Android）：下载后弹「保存到手机 / 分享到微信」
 * 复用 fetchExportSignEvidence 的 arraybuffer，不重复请求。
 */
export function showEvidenceActions(row: any) {
  const id = row?.id;
  if (!id) { uni.showToast({ title: '任务ID不存在', icon: 'none' }); return; }
  const fileName = buildEvidenceZipName(row);
  // #ifdef APP-PLUS
  uni.showActionSheet({
    itemList: ['保存到手机', '分享到微信'],
    success: (res) => {
      const i = res.tapIndex;
      const onBuf = (buf: ArrayBuffer | null, err?: string) => {
        if (!buf) { uni.showToast({ title: err || '导出失败', icon: 'none' }); return; }
        const head = arrayBufferToText(buf).slice(0, 2);
        if (head !== 'PK') {
          uni.showToast({ title: decodeErrorText(buf) || '导出失败', icon: 'none' }); return;
        }
        if (i === 0) saveEvidenceZip(buf, fileName);
        else shareEvidenceZip(buf, fileName);
      };
      // 发起一次请求，两个操作复用结果
      fetchEvidenceBuf(id).then(buf => onBuf(buf), e => onBuf(null, '导出失败'));
    },
    fail: () => {}
  });
  // #endif
  // #ifndef APP-PLUS
  // 非 App 端直接导出（已有能力）
  exportEvidence(id, fileName);
  // #endif
}

async function fetchEvidenceBuf(id: number): Promise<ArrayBuffer | null> {
  const { fetchExportSignEvidenceDebug } = await import('@/service/projectServiceSign');
  const result = await fetchExportSignEvidenceDebug(id);
  if (result.type === 'arraybuffer') return result.data;
  uni.showToast({ title: result.msg || '导出失败', icon: 'none' });
  return null;
}

/** 保存证据包 zip 到手机下载目录 */
function saveEvidenceZip(buf: ArrayBuffer, fileName: string) {
  // #ifdef APP-PLUS
  uni.showLoading({ title: '正在保存...', mask: true });
  saveZip(buf, fileName).then(() => {
    uni.hideLoading();
    uni.showToast({ title: '已保存到手机下载目录', icon: 'none' });
  }).catch(() => {
    uni.hideLoading();
    uni.showToast({ title: '保存失败', icon: 'none' });
  });
  // #endif
  // #ifdef MP-WEIXIN
  uni.showLoading({ title: '正在导出...', mask: true });
  saveZip(buf, fileName).then(() => {
    uni.hideLoading();
    uni.showToast({ title: '导出成功', icon: 'success' });
  }).catch(() => {
    uni.hideLoading();
    uni.showToast({ title: '保存文件失败', icon: 'none' });
  });
  // #endif
  // #ifdef H5
  downloadFileH5(BASE_URL + '/projectServiceSign/exportEvidence.do?id=' + (arguments[0] || ''), fileName);
  // #endif
}

/** 分享证据包 zip 到微信 */
function shareEvidenceZip(buf: ArrayBuffer, fileName: string) {
  // #ifdef APP-PLUS
  uni.showLoading({ title: '正在准备分享...', mask: true });
  saveZipToDoc(buf, fileName).then(absPath => {
    uni.hideLoading();
    shareFileViaSystem(absPath);
  }).catch(() => {
    uni.hideLoading();
    uni.showToast({ title: '分享失败', icon: 'none' });
  });
  // #endif
  // #ifndef APP-PLUS
  uni.showToast({ title: '当前端暂不支持分享文件', icon: 'none' });
  // #endif
}

export function exportEvidence(id: number, fileName: string) {
  return new Promise<void>(async (resolve) => {
    let buf: ArrayBuffer | null = null;
    try {
      const { fetchExportSignEvidence } = await import('@/service/projectServiceSign');
      const data = await fetchExportSignEvidence(id);
      buf = data instanceof ArrayBuffer ? data : null;
    } catch (e: any) {
      // request 工具已 toast，若能从响应里解析出具体原因再补充提示
      const detail = e?.data ? decodeErrorText(e.data) : '';
      if (detail) uni.showToast({ title: detail, icon: 'none' });
      resolve();
      return;
    }
    if (!buf) {
      uni.showToast({ title: '导出失败', icon: 'none' });
      resolve();
      return;
    }

    // 判断是否为 zip（PK 头）
    const head = arrayBufferToText(buf).slice(0, 2);
    if (head !== 'PK') {
      const detail = decodeErrorText(buf);
      uni.showToast({ title: detail || '导出失败', icon: 'none' });
      resolve();
      return;
    }

    uni.showLoading({ title: '正在导出...', mask: true });
    try {
      await saveZip(buf, fileName);
      uni.hideLoading();
      uni.showToast({ title: '导出成功', icon: 'success' });
    } catch (e) {
      uni.hideLoading();
      uni.showToast({ title: '保存文件失败', icon: 'none' });
    }
    resolve();
  });
}

function arrayBufferToText(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8').decode(buf);
  } catch {
    return '';
  }
}

// 后端错误 JSON：{code,msg,data}，data 通常是具体原因
function decodeErrorText(buf: ArrayBuffer): string {
  const text = arrayBufferToText(buf);
  try {
    const json = JSON.parse(text);
    if (json?.data) return json.msg && json.msg !== 'fail' ? `${json.msg}：${json.data}` : String(json.data);
    if (json?.msg) return String(json.msg);
    return text;
  } catch {
    return text;
  }
}

// 将 zip 写入本地文件并尝试打开（分平台）
function saveZip(buf: ArrayBuffer, fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    // @ts-ignore
    plus.io.resolveLocalFileSystemURL('_downloads/', (fs: any) => {
      fs.getFile(fileName, { create: true }, (fileEntry: any) => {
        fileEntry.createWriter(
          (writer: any) => {
            writer.onwrite = () => {
              // @ts-ignore
              plus.runtime.openFile(fileEntry.toLocalURL(), () => resolve(), () => resolve());
            };
            writer.onerror = () => reject(new Error('write error'));
            writer.write(new Blob([buf], { type: 'application/zip' }));
          },
          () => reject(new Error('createWriter error'))
        );
      }, reject);
    }, reject);
    // #endif

    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
    fs.writeFile({
      filePath,
      data: buf,
      success: () => resolve(),
      fail: () => reject(new Error('writeFile error'))
    });
    // #endif

/** 将 ArrayBuffer zip 写入 _doc/（FileProvider 暴露路径），返回绝对路径；失败 reject */
function saveZipToDoc(buf: ArrayBuffer, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    // @ts-ignore
    plus.io.resolveLocalFileSystemURL('_doc/', (fs: any) => {
      fs.getFile(fileName, { create: true }, (fileEntry: any) => {
        fileEntry.createWriter(
          (writer: any) => {
            writer.onwrite = () => resolve(fileEntry.toLocalURL().replace(/^file:\/\//, ''));
            writer.onerror = () => reject(new Error('write error'));
            writer.write(new Blob([buf], { type: 'application/zip' }));
          },
          () => reject(new Error('createWriter error'))
        );
      }, reject);
    }, reject);
    // #endif
    // #ifndef APP-PLUS
    reject(new Error('not supported'));
    // #endif
  });
}

    // #ifdef H5
    const blob = new Blob([buf], { type: 'application/zip' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    resolve();
    // #endif
  });
}
