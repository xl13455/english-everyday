export type UploadResult = {
  ok: boolean;
  status: number;
  data: { error?: string; count?: number; ok?: boolean };
};

/** 带上传进度的 FormData POST（XHR）。 */
export function uploadWithProgress(
  url: string,
  form: FormData,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      let data: UploadResult["data"] = {};
      try {
        data = JSON.parse(xhr.responseText) as UploadResult["data"];
      } catch {
        /* ignore */
      }
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        data,
      });
    };
    xhr.onerror = () => reject(new Error("网络错误，上传中断"));
    xhr.onabort = () => reject(new Error("上传已取消"));
    xhr.send(form);
  });
}
