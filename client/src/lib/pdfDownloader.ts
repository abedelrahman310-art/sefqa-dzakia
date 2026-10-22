import { api } from './api';

/**
 * دالة مساعدة لتنزيل وثائق ومحاضر PDF الرسمية الموثقة بـ Bearer Token
 * @param url مسار نقطة النهاية (API Endpoint)
 * @param defaultFilename الاسم الافتراضي للملف المنبثق عند التنزيل
 */
export async function downloadPdfBlob(url: string, defaultFilename: string): Promise<boolean> {
  try {
    const res = await api.get(url, { responseType: 'blob' });

    let filename = defaultFilename;
    const disposition = res.headers?.['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1500);
    return true;
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw error;
  }
}
