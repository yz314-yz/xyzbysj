import { loadSlim } from '@tsparticles/slim';

// 顶层 ParticlesProvider 的 init 回调，需稳定引用
// 拆出独立文件避免 react-refresh 警告
export const particlesInit = (engine) => loadSlim(engine);
