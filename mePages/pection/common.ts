import { BASE_URL } from '@/utils/request';

/**
 * 从URL中获取文件名(取?后边的参数)
 */
export function getFileNameFromUrl(url: string): string {
  if (!url) return '-';
  try {
    // 取?后边的内容
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const queryString = url.substring(queryIndex + 1);
      // 尝试获取filename参数
      const params = new URLSearchParams(queryString);
      const filename = params.get('filename');
      if (filename) return decodeURIComponent(filename);
      // 如果没有filename参数，取?后第一段内容（可能无参数名，如 xxx.pdf?文件名.xlsx）
      const firstPart = queryString.split('&')[0] || '';
      if (firstPart.includes('=')) {
        return decodeURIComponent(firstPart.split('=')[1] || url.split('/').pop() || '-');
      }
      return decodeURIComponent(firstPart || url.split('/').pop() || '-');
    }
    return url.split('/').pop() || '-';
  } catch {
    return url.split('/').pop() || '-';
  }
}

/**
 * 标准化文件URL
 */
export function normalizeFileUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return BASE_URL + url;
}

/**
 * 显示文件操作菜单
 */
export function showFileActions(options: { url: string; name?: string }) {
  const { url, name } = options;
  if (!url) {
    uni.showToast({ title: '文件不存在', icon: 'none' });
    return;
  }

  const fileName = name || getFileNameFromUrl(url);

  uni.showActionSheet({
    itemList: ['保存到手机', '分享到微信'],///, '分享到微信'
    success: async (res) => {
      if (res.tapIndex === 0) {
        // 保存到手机
        await openInBrowser(url);
      } else if (res.tapIndex === 1) {
        // 分享到微信
        shareLocalFileToWeixin(url, fileName);
      }
    }
  });
}

/**
 * 保存文件到本地
 */
async function saveFileToDevice(url: string, fileName: string) {
  // #ifndef H5
  try {
    // 如果URL不是http/https开头，添加BASE_URL
    const fullUrl = url.startsWith('http') ? url : normalizeFileUrl(url);

    uni.showLoading({ title: '下载中...' });

    const downloadTask = uni.downloadFile({
      url: fullUrl,
      success: (downloadRes) => {
        uni.hideLoading();
        if (downloadRes.statusCode === 200) {
          // 保存到下载目录
          uni.saveFile({
            tempFilePath: downloadRes.tempFilePath,
            success: (saveRes) => {
              uni.showToast({ title: '已保存到: 下载/', icon: 'success' });
              console.log('文件保存成功:', saveRes.savedFilePath);
            },
            fail: (err) => {
              console.error('保存文件失败', err);
              uni.showToast({ title: '保存失败', icon: 'none' });
            }
          });
        } else {
          uni.showToast({ title: '下载失败', icon: 'none' });
        }
      },
      fail: (err) => {
        uni.hideLoading();
        console.error('下载文件失败', err);
        uni.showToast({ title: '下载失败', icon: 'none' });
      }
    });

    downloadTask.onProgressUpdate((res) => {
      // 可以在这里更新下载进度
      if (res.progress < 100) {
        uni.showLoading({ title: `下载中 ${res.progress}%` });
      }
    });
  } catch (err) {
    uni.hideLoading();
    console.error('保存文件异常', err);
    uni.showToast({ title: '保存失败', icon: 'none' });
  }
  // #endif

  // #ifdef H5
  // H5 环境直接下载
  const fullUrl = url.startsWith('http') ? url : normalizeFileUrl(url);
  const a = document.createElement('a');
  a.href = fullUrl;
  a.download = fileName;
  a.click();
  uni.showToast({ title: '下载开始', icon: 'success' });
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
/**
 * 根据文件名获取 MIME Type
 */
function getMimeType(fileName: string): string {
  if (!fileName) {
    return 'application/octet-stream';
  }

  // 去掉 ?xxx 和 #xxx
  const cleanName = fileName
    .split('?')[0]
    .split('#')[0];

  const ext = cleanName
    .substring(cleanName.lastIndexOf('.') + 1)
    .toLowerCase();

  const mimeMap: Record<string, string> = {
    // =========================
    // Excel
    // =========================
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
    xlsb: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
    csv: 'text/csv',

    // =========================
    // Word
    // =========================
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    docm: 'application/vnd.ms-word.document.macroEnabled.12',
    rtf: 'application/rtf',

    // =========================
    // PowerPoint
    // =========================
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    pptm: 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',

    // =========================
    // PDF
    // =========================
    pdf: 'application/pdf',

    // =========================
    // 文本
    // =========================
    txt: 'text/plain',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    htm: 'text/html',
    md: 'text/markdown',

    // =========================
    // 图片
    // =========================
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    tif: 'image/tiff',
    tiff: 'image/tiff',

    // =========================
    // 音频
    // =========================
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    aac: 'audio/aac',

    // =========================
    // 视频
    // =========================
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    webm: 'video/webm',
    m4v: 'video/x-m4v',

    // =========================
    // 压缩包
    // =========================
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    gzip: 'application/gzip',

    // =========================
    // APK / Android
    // =========================
    apk: 'application/vnd.android.package-archive',

    // =========================
    // 其他常见文件
    // =========================
    epub: 'application/epub+zip',
    sql: 'application/sql',
    js: 'application/javascript',
    ts: 'application/typescript',
    css: 'text/css',

    // =========================
    // 二进制
    // =========================
    bin: 'application/octet-stream',
    dat: 'application/octet-stream'
  };

  return mimeMap[ext] || 'application/octet-stream';
}
/**
 * 获取 FileProvider content:// URI
 */
// function getFileProviderUri(filePath: string): string {
// 	try {
// 		const main =
// 			plus.android.runtimeMainActivity();

// 		const packageName =
// 			main.getPackageName();

// 		const authority =
// 			packageName + '.fileprovider';

// 		console.log(
// 			'========== FileProvider 检查 =========='
// 		);

// 		console.log(
// 			'packageName:',
// 			packageName
// 		);

// 		console.log(
// 			'authority:',
// 			authority
// 		);

// 		console.log(
// 			'filePath:',
// 			filePath
// 		);

// 		const FileProvider =
// 			plus.android.importClass(
// 				'androidx.core.content.FileProvider'
// 			);

// 		const File =
// 			plus.android.importClass(
// 				'java.io.File'
// 			);

// 		const file =
// 			new File(filePath);

// 		console.log(
// 			'file:',
// 			file
// 		);

// 		console.log(
// 			'filePath exists:',
// 			plus.android.invoke(
// 				file,
// 				'exists'
// 			)
// 		);

// 		const uri =
// 			FileProvider.getUriForFile(
// 				main,
// 				authority,
// 				file
// 			);

// 		console.log(
// 			'FileProvider uri:',
// 			uri
// 		);

// 		if (!uri) {
// 			throw new Error(
// 				'FileProvider.getUriForFile() 返回 null'
// 			);
// 		}

// 		return uri.toString();

// 	} catch (error) {

// 		console.error(
// 			'getFileProviderUri:',
// 			error
// 		);

// 		throw error;
// 	}
// }
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
 * 复制文本
 */
export function copyText(text: string, failTip?: string) {
  // #ifndef H5
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({ title: '已复制', icon: 'success' });
    },
    fail: () => {
      uni.showToast({ title: failTip || '复制失败', icon: 'none' });
    }
  });
  // #endif

  // #ifdef H5
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  uni.showToast({ title: '已复制', icon: 'success' });
  // #endif
}
