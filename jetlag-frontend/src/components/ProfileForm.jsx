export function ProfileForm({ profile, errors = {}, onChange }) {
  return (
    <div className="profile-row">
      <label>
        年龄
        <input
          aria-describedby={errors.age ? 'profile-age-error' : undefined}
          aria-invalid={Boolean(errors.age)}
          type="number"
          min="1"
          max="120"
          inputMode="numeric"
          required
          value={profile.age}
          onChange={(event) => onChange('age', event.target.value)}
        />
        {errors.age && <span className="field-error" id="profile-age-error">{errors.age}</span>}
      </label>
      <label>
        性别
        <select
          aria-describedby={errors.gender ? 'profile-gender-error' : undefined}
          aria-invalid={Boolean(errors.gender)}
          required
          value={profile.gender}
          onChange={(event) => onChange('gender', event.target.value)}
        >
          <option value="">请选择</option>
          <option value="女">女</option>
          <option value="男">男</option>
          <option value="其他">其他</option>
        </select>
        {errors.gender && <span className="field-error" id="profile-gender-error">{errors.gender}</span>}
      </label>
      <label>
        常睡时间
        <input
          aria-describedby={errors.bedtime ? 'profile-bedtime-error' : undefined}
          aria-invalid={Boolean(errors.bedtime)}
          required
          type="time"
          value={profile.bedtime}
          onChange={(event) => onChange('bedtime', event.target.value)}
        />
        {errors.bedtime && <span className="field-error" id="profile-bedtime-error">{errors.bedtime}</span>}
      </label>
      <label>
        起床时间
        <input
          aria-describedby={errors.wakeTime ? 'profile-wake-error' : undefined}
          aria-invalid={Boolean(errors.wakeTime)}
          required
          type="time"
          value={profile.wakeTime}
          onChange={(event) => onChange('wakeTime', event.target.value)}
        />
        {errors.wakeTime && <span className="field-error" id="profile-wake-error">{errors.wakeTime}</span>}
      </label>
    </div>
  );
}
