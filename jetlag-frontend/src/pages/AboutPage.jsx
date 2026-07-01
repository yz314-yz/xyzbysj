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
      <p>⚠️ AI 分析仅供学术参考，不作为医疗诊断。请咨询执业中医师。</p>
    </section>
  );
}
