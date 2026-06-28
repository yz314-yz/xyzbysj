export function ProfileForm({ profile, onChange }) {
  return (
    <div className="profile-row">
      <label>
        年龄
        <input
          type="number"
          min="1"
          max="120"
          inputMode="numeric"
          value={profile.age}
          onChange={(event) => onChange('age', event.target.value)}
        />
      </label>
      <label>
        性别
        <select value={profile.gender} onChange={(event) => onChange('gender', event.target.value)}>
          <option value="">请选择</option>
          <option value="女">女</option>
          <option value="男">男</option>
          <option value="其他">其他</option>
        </select>
      </label>
      <label>
        常睡时间
        <input type="time" value={profile.bedtime} onChange={(event) => onChange('bedtime', event.target.value)} />
      </label>
      <label>
        起床时间
        <input type="time" value={profile.wakeTime} onChange={(event) => onChange('wakeTime', event.target.value)} />
      </label>
    </div>
  );
}
