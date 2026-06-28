import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

export function ExportButton({ disabled, targetId = 'export-report' }) {
  async function exportPdf() {
    try {
      const target = document.getElementById(targetId);
      if (!target) throw new Error('未找到可导出的报告区域。');
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(target, { backgroundColor: '#ffffff', scale: 2 });
      const image = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;
      let remainingHeight = imageHeight;
      let position = 0;

      pdf.addImage(image, 'PNG', 0, position, pageWidth, imageHeight);
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(image, 'PNG', 0, position, pageWidth, imageHeight);
        remainingHeight -= pageHeight;
      }

      pdf.save('岐养七日-调理计划.pdf');
      toast.success('PDF 已导出。');
    } catch (error) {
      toast.error(error.message || '导出失败，请稍后重试。');
    }
  }

  return (
    <button className="ghost" type="button" onClick={exportPdf} disabled={disabled}>
      <Download size={16} /> 导出 PDF
    </button>
  );
}
