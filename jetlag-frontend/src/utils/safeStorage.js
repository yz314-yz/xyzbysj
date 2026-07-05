// localStorage 安全封装：隐私模式或存储被禁用时 setItem 抛 QuotaExceededError
// 会直接导致 useState 初始化崩溃。所有读写均 try/catch，失败时降级到内存 Map。

const memoryFallback = new Map();

const memoryStorage = {
  getItem(key) {
    return memoryFallback.has(key) ? memoryFallback.get(key) : null;
  },
  setItem(key, value) {
    memoryFallback.set(key, String(value));
  },
  removeItem(key) {
    memoryFallback.delete(key);
  },
};

let cachedStorage = null;
function getStorage() {
  if (cachedStorage) return cachedStorage;
  try {
    // 探测 localStorage 是否可用（Safari 隐私模式访问会抛错）
    const testKey = '__safe_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    cachedStorage = window.localStorage;
  } catch {
    cachedStorage = memoryStorage;
  }
  return cachedStorage;
}

export const safeStorage = {
  getItem(key) {
    try {
      return getStorage().getItem(key);
    } catch {
      return memoryStorage.getItem(key);
    }
  },
  setItem(key, value) {
    try {
      getStorage().setItem(key, value);
    } catch {
      memoryStorage.setItem(key, value);
    }
  },
  removeItem(key) {
    try {
      getStorage().removeItem(key);
    } catch {
      memoryStorage.removeItem(key);
    }
  },
};
