import { useMemo, useState } from 'react';
import { ArrowUp, Camera, RotateCcw, Sprout, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  INFERENCE_MODE_OFFLINE_QWEN, INFERENCE_MODE_PUBLIC,
  emptyFiles, emptyProfile, createEmptyResult,
} from '../constants/app';
import { ChatPanel } from '../components/ChatPanel';
import { CheckinPanel } from '../components/CheckinPanel';
import { FileDrop } from '../components/FileDrop';
import { ExportButton } from '../components/ExportButton';
import { InferenceModeSelector } from '../components/InferenceModeSelector';
import { MeridianActions } from '../components/MeridianActions';
import { PlanTable } from '../components/PlanTable';
import { ProfileForm } from '../components/ProfileForm';
import { ResultCard } from '../components/ResultCard';
import { ShareCard } from '../components/ShareCard';
import { SymptomsPanel } from '../components/SymptomsPanel';
import { VisionPanel } from '../components/VisionPanel';
import { submitDiagnosis } from '../services/api';

export function AssessmentPage({ auth, modelName, requireModelEvidence = false, symptomOptions, visionConfigured }) {
  const [inferenceMode, setInferenceMode] = useState(INFERENCE_MODE_PUBLIC);
  const [selected, setSelected] = useState([]);
  const [files, setFiles] = useState(emptyFiles);
  const [browserFeatures, setBrowserFeatures] = useState({});
  const [profile, setProfile] = useState(emptyProfile);
  const [result, setResult] = useState(() => createEmptyResult(modelName, INFERENCE_MODE_PUBLIC));
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fileInputVersion, setFileInputVersion] = useState(0);
  const fileCount = useMemo(() => Object.values(files).filter(Boolean).length, [files]);
  const hasInput = selected.length > 0 || fileCount > 0;
  const canSubmit = hasInput && !loading;
  const completion = useMemo(
    () => (symptomOptions.length ? Math.round((selected.length / symptomOptions.length) * 100) : 0),
    [selected.length, symptomOptions.length]
  );

  function toggleSymptom(id) {
    setFormError('');
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function updateInferenceMode(nextMode) {
    if (nextMode === INFERENCE_MODE_OFFLINE_QWEN && !visionConfigured) {
      toast.error('离线增强模式需要先连接本机 Qwen2.5-VL 服务。');
      return;
    }
    setInferenceMode(nextMode);
    setResult(createEmptyResult(modelName, nextMode));
  }

  function updateFile(key, file, features) {
    setFormError('');
    setFiles((current) => ({ ...current, [key]: file }));
    if (features) setBrowserFeatures((current) => ({ ...current, [key]: features }));
  }

  function removeFile(key) {
    setFormError('');
    setFiles((current) => ({ ...current, [key]: null }));
    setBrowserFeatures((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateProfile(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setSelected([]);
    setFiles(emptyFiles);
    setBrowserFeatures({});
    setProfile(emptyProfile);
    setResult(createEmptyResult(modelName, inferenceMode));
    setFormError('');
    setFileInputVersion((current) => current + 1);
  }

  async function submit() {
    if (!hasInput) {
      setFormError('请至少选择一个症状或上传一张图片。');
      return;
    }
    if (requireModelEvidence && inferenceMode === INFERENCE_MODE_PUBLIC) {
      const message = '上线严格模式要求公网体验版加载浏览器端多模态模型。当前仅有轻量图片特征，不能生成上线级方案。';
      setFormError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    setFormError('');
    const form = new FormData();
    form.append('inferenceMode', inferenceMode);
    form.append('symptoms', JSON.stringify(selected));
    form.append('profile', JSON.stringify(profile));
    form.append('hour', new Date().getHours());
    form.append('browserFeatures', JSON.stringify(browserFeatures));
    if (inferenceMode === INFERENCE_MODE_OFFLINE_QWEN) {
      Object.entries(files).forEach(([key, value]) => {
        if (value) form.append(key, value);
      });
    }

    try {
      const payload = await submitDiagnosis(form, auth.token);
      setResult({ ...payload.data, savedId: payload.savedId || null });
      toast.success(payload.savedId ? '方案已生成并保存到历史记录。' : '方案已生成。登录后可保存历史记录。');
    } catch (error) {
      const message = error.name === 'AbortError'
        ? '请求超时，请稍后重试。'
        : error.message || '请求失败，请稍后重试。';
      setFormError(message);
      setResult((current) => ({ ...current, modelVisionError: `本次请求未完成：${message}` }));
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>望诊与七日养生计划</h1>
          <p>上传舌像、面相、手相，结合症状生成饮食、运动与作息建议。</p>
        </div>
        <div className="topbar-actions">
          <ExportButton disabled={!result.sevenDayPlan.length} />
          <button className="ghost" type="button" onClick={resetForm}>
            <RotateCcw size={16} /> 清空表单
          </button>
        </div>
      </header>

      <div id="export-report">
        <div className="grid">
          <section className="panel collector" id="collection">
            <div className="section-title">
              <Camera size={20} />
              <h2>图像采集</h2>
              <span>{fileCount}/3</span>
            </div>
            <InferenceModeSelector
              disabled={loading}
              requireModelEvidence={requireModelEvidence}
              offlineAvailable={visionConfigured}
              onChange={updateInferenceMode}
              value={inferenceMode}
            />
            <div className="drops">
              <FileDrop
                key={`tongue-${fileInputVersion}`}
                id="tongue"
                title="舌像"
                hint="自然光、伸舌平拍"
                icon={Upload}
                file={files.tongue}
                onChange={(file, features) => updateFile('tongue', file, features)}
                onRemove={() => removeFile('tongue')}
                onError={setFormError}
              />
              <FileDrop
                key={`face-${fileInputVersion}`}
                id="face"
                title="面相"
                hint="正脸、无遮挡"
                icon={Camera}
                file={files.face}
                onChange={(file, features) => updateFile('face', file, features)}
                onRemove={() => removeFile('face')}
                onError={setFormError}
              />
              <FileDrop
                key={`palm-${fileInputVersion}`}
                id="palm"
                title="手相"
                hint="掌心展开、光线均匀"
                icon={Sprout}
                file={files.palm}
                onChange={(file, features) => updateFile('palm', file, features)}
                onRemove={() => removeFile('palm')}
                onError={setFormError}
              />
            </div>

            <ProfileForm profile={profile} onChange={updateProfile} />
          </section>

          <SymptomsPanel
            canSubmit={canSubmit}
            completion={completion}
            formError={formError}
            hasInput={hasInput}
            loading={loading}
            onSubmit={submit}
            onToggle={toggleSymptom}
            selected={selected}
            symptomOptions={symptomOptions}
          />

          <ResultCard result={result} />
          <MeridianActions result={result} />
          <VisionPanel result={{
            ...result,
            engineStatus: {
              ...result.engineStatus,
              vision: {
                ...result.engineStatus.vision,
                configured: visionConfigured || result.engineStatus.vision.configured,
                model: modelName || result.engineStatus.vision.model,
                requested: inferenceMode === INFERENCE_MODE_OFFLINE_QWEN || result.engineStatus.vision.requested,
              },
            },
          }} />
        </div>

        <PlanTable result={result} />
      </div>

      <CheckinPanel diagnosisId={result.savedId} result={result} token={auth.token} />
      <ChatPanel result={result} token={auth.token} />
      <ShareCard result={result} />

      <section className="footnote">
        <p>{result.disclaimer}</p>
        {result.modelVisionError && <p>{result.modelVisionError}</p>}
      </section>

      <button
        className="back-top"
        type="button"
        aria-label="返回页面顶部"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp size={18} />
      </button>
    </>
  );
}
