import { HelpCircle } from 'lucide-react';

export function HelpPage() {
  return (
    <section className="panel page-panel">
      <div className="section-title">
        <HelpCircle size={20} />
        <h2>用户手册</h2>
      </div>
      <div className="doc-grid">
        <article>
          <strong>1. 采集信息</strong>
          <p>选择症状，按需上传舌像、面相、手相图片，并填写基础作息信息。</p>
        </article>
        <article>
          <strong>2. 生成方案</strong>
          <p>点击生成按钮后，系统会结合本地规则和可选 Qwen2.5-VL 图像特征生成七日计划。</p>
        </article>
        <article>
          <strong>3. 保存与导出</strong>
          <p>登录后结果会保存为历史记录，也可以将报告区域导出为 PDF。</p>
        </article>
      </div>
    </section>
  );
}

