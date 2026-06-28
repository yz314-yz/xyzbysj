import { BookOpen } from 'lucide-react';

export function AboutPage() {
  return (
    <section className="panel page-panel">
      <div className="section-title">
        <BookOpen size={20} />
        <h2>关于系统</h2>
      </div>
      <p>
        本系统为毕业设计演示项目，围绕中医养生辅助场景实现图像特征记录、症状归类、七日计划、用户认证、
        历史记录、PDF 导出、API 文档与容器化部署。
      </p>
      <p>系统输出仅用于学术展示与日常养生参考，不能替代执业医师诊断、治疗或处方。</p>
    </section>
  );
}
