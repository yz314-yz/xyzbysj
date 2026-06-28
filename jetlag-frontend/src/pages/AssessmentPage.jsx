import { useMemo, useState } from 'react';
import { Camera, RotateCcw, Sprout, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

import { emptyFiles, emptyProfile, createEmptyResult } from '../constants/app';
import { FileDrop } from '../components/FileDrop';
import { ExportButton } from '../components/ExportButton';
import { MeridianActions } from '../components/MeridianActions';
import { PlanTable } from '../components/PlanTable';
import { ProfileForm } from '../components/ProfileForm';
import { ResultCard } from '../components/ResultCard';
import { SymptomsPanel } from '../components/SymptomsPanel';
import { VisionPanel } from '../components/VisionPanel';
import { submitDiagnosis } from '../services/api';

export function AssessmentPage({ auth, modelName, symptomOptions, visionConfigured }) {
  const [selected, setSelected] = useState([]);
  const [files, setFiles] = useState(emptyFiles);
  const [profile, setProfile] = useState(emptyProfile);
  const [result, setResult] = useState(() => createEmptyResult(modelName));
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

  function updateFile(key, file) {
    setFormError('');
    setFiles((current) => ({ ...current, [key]: file }));
  }

  function removeFile(key) {
    setFormError('');
    setFiles((current) => ({ ...current, [key]: null }));
  }

  function updateProfile(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setSelected([]);
    setFiles(emptyFiles);
    setProfile(emptyProfile);
    setResult(createEmptyResult(modelName));
    setFormError('');
    setFileInputVersion((current) => current + 1);
  }

  async function submit() {
    if (!hasInput) {
      setFormError('请至少选择一个症状或上传一张图片。');
      return;
    }

    setLoading(true);
    setFormError('');
    const form = new FormData();
    form.append('symptoms', JSON.stringify(selected));
    form.append('profile', JSON.stringify(profile));
    form.append('hour', new Date().getHours());
    Object.entries(files).forEach(([key, value]) => {
      if (value) form.append(key, value);
    });

    try {
      const payload = await submitDiagnosis(form, auth.token);
      setResult(payload.data);
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
            <div className="drops">
              <FileDrop
                key={`tongue-${fileInputVersion}`}
                id="tongue"
                title="舌像"
                hint="自然光、伸舌平拍"
                icon={Upload}
                file={files.tongue}
                onChange={(file) => updateFile('tongue', file)}
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
                onChange={(file) => updateFile('face', file)}
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
                onChange={(file) => updateFile('palm', file)}
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
              },
            },
          }} />
        </div>

        <PlanTable result={result} />
      </div>

      <section className="footnote">
        <p>{result.disclaimer}</p>
        {result.modelVisionError && <p>{result.modelVisionError}</p>}
      </section>
    </>
  );
}
