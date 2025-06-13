<template>
  <div class="php-config">
    <h1 class="page-title">PHP 版本管理</h1>

    <div class="config-section">
      <div class="section-header">
        <h2>已安装的 PHP 版本</h2>
        <button class="action-button add-btn">
          <PlusIcon :size="16" />
          安装新版本
        </button>
      </div>

      <div class="version-list">
        <div
          v-for="version in phpVersions"
          :key="version.id"
          class="version-card"
          :class="{ active: version.active }"
        >
          <div class="version-header">
            <div class="version-name">PHP {{ version.version }}</div>
            <div class="version-badge" :class="version.active ? 'active-badge' : ''">
              {{ version.active ? "当前使用" : "已安装" }}
            </div>
          </div>

          <div class="version-details">
            <div class="detail-item">
              <span class="detail-label">安装路径:</span>
              <span class="detail-value">{{ version.path }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">模式:</span>
              <span class="detail-value">{{ version.mode }}</span>
            </div>
            <!-- <div class="detail-item">
              <span class="detail-label">扩展:</span>
              <span class="detail-value">{{ version.extensions.length }} 个已启用</span>
            </div> -->
          </div>

          <div class="version-actions">
            <button
              class="action-btn"
              :class="{ 'primary-btn': !version.active, 'disabled-btn': version.active }"
              :disabled="version.active"
              @click="activateVersion(version.id)"
            >
              {{ version.active ? "当前使用中" : "切换到此版本" }}
            </button>

            <div class="action-dropdown">
              <button
                class="action-btn secondary-btn"
                @click="toggleDropdown(version.id)"
              >
                更多操作
                <ChevronDownIcon :size="16" />
              </button>

              <div class="dropdown-menu" v-if="activeDropdown === version.id">
                <button class="dropdown-item" @click="configureExtensions(version.id)">
                  <SettingsIcon :size="16" />
                  配置扩展
                </button>
                <button class="dropdown-item" @click="editPhpIni(version.id)">
                  <FileEditIcon :size="16" />
                  编辑 php.ini
                </button>
                <button
                  class="dropdown-item danger"
                  @click="uninstallVersion(version.id)"
                >
                  <TrashIcon :size="16" />
                  卸载
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h2>PHP 配置</h2>

      <div class="config-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'general'" class="general-settings">
          <div class="form-group">
            <label>最大执行时间 (秒)</label>
            <input
              type="number"
              v-model="phpConfig.maxExecutionTime"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>内存限制</label>
            <input type="text" v-model="phpConfig.memoryLimit" class="form-input" />
          </div>

          <div class="form-group">
            <label>上传文件大小限制</label>
            <input type="text" v-model="phpConfig.uploadMaxFilesize" class="form-input" />
          </div>

          <div class="form-group">
            <label>POST 数据大小限制</label>
            <input type="text" v-model="phpConfig.postMaxSize" class="form-input" />
          </div>

          <div class="form-group checkbox">
            <input
              type="checkbox"
              id="display-errors"
              v-model="phpConfig.displayErrors"
            />
            <label for="display-errors">显示错误</label>
          </div>

          <div class="form-actions">
            <button class="action-btn primary-btn">保存配置</button>
            <button class="action-btn secondary-btn">重置</button>
          </div>
        </div>

        <div v-else-if="activeTab === 'extensions'" class="extensions-list">
          <div class="search-bar">
            <SearchIcon :size="16" />
            <input
              type="text"
              placeholder="搜索扩展..."
              v-model="searchExtension"
              class="search-input"
            />
          </div>

          <div class="extension-items">
            <div v-for="ext in filteredExtensions" :key="ext.name" class="extension-item">
              <div class="extension-info">
                <div class="extension-name">{{ ext.name }}</div>
                <div class="extension-version">v{{ ext.version }}</div>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="ext.enabled" />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'phpini'" class="php-ini-editor">
          <div class="editor-toolbar">
            <button class="toolbar-btn">
              <SaveIcon :size="16" />
              保存
            </button>
            <button class="toolbar-btn">
              <RotateCcwIcon :size="16" />
              重置
            </button>
          </div>
          <div class="editor-container">
            <textarea class="code-editor" v-model="phpIniContent"></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  Plus as PlusIcon,
  ChevronDown as ChevronDownIcon,
  Settings as SettingsIcon,
  FileEdit as FileEditIcon,
  Trash as TrashIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  RotateCcw as RotateCcwIcon,
} from "lucide-vue-next";

const activeDropdown = ref(null);
const activeTab = ref("general");

const phpVersions = ref([
  // {
  //   id: 1,
  //   version: "8.1.6",
  //   active: true,
  //   path: "C:\\xampp\\php",
  //   mode: "FPM",
  //   extensions: ["mysqli", "pdo", "gd", "curl", "mbstring", "xml", "zip"],
  // },
]);

window.api.getSubfolders("src/php").then(async (res) => {
  phpVersions.value = await Promise.all(
    await res.map(async (item, i) => {
      const d = await window.api.getPhpInfo(item.fullPath.replaceAll("\\", "/"));
      // const dd = await window.api.getPhpExtensionStatus(
      //   `./${item.fullPath.replaceAll("\\", "/")}/php.exe`,
      //   `./${item.fullPath.replaceAll("\\", "/")}/ext`
      // );
      return {
        id: i,
        version: item.folderName.split("-")[1],
        active: false,
        path: item.fullPath,
        mode: d.mode,
        extensions: d.extensions,
      };
    })
  );
});

const tabs = ref([
  { id: "general", name: "常规设置" },
  { id: "extensions", name: "扩展管理" },
  { id: "phpini", name: "php.ini 编辑器" },
]);

const phpConfig = ref({
  maxExecutionTime: 30,
  memoryLimit: "128M",
  uploadMaxFilesize: "2M",
  postMaxSize: "8M",
  displayErrors: true,
});

const extensions = ref([
  { name: "mysqli", version: "8.1.0", enabled: true },
  { name: "pdo", version: "8.1.0", enabled: true },
  { name: "pdo_mysql", version: "8.1.0", enabled: true },
  { name: "gd", version: "2.3.0", enabled: true },
  { name: "curl", version: "7.80.0", enabled: true },
  { name: "mbstring", version: "8.1.0", enabled: true },
  { name: "xml", version: "8.1.0", enabled: true },
  { name: "zip", version: "1.19.5", enabled: true },
  { name: "intl", version: "8.1.0", enabled: false },
  { name: "soap", version: "8.1.0", enabled: false },
  { name: "ldap", version: "8.1.0", enabled: false },
  { name: "exif", version: "8.1.0", enabled: false },
]);

const searchExtension = ref("");

const phpIniContent = ref(`; PHP Configuration File
  date.timezone = "Asia/Shanghai"
  display_errors = On
  error_reporting = E_ALL
  max_execution_time = 30
  memory_limit = 128M
  upload_max_filesize = 2M
  post_max_size = 8M
  
  ; Extensions
  extension=mysqli
  extension=pdo_mysql
  extension=gd
  extension=curl
  extension=mbstring
  extension=xml
  extension=zip
  ;extension=intl
  ;extension=soap
  ;extension=ldap
  ;extension=exif`);

const filteredExtensions = computed(() => {
  if (!searchExtension.value) return extensions.value;
  return extensions.value.filter((ext) =>
    ext.name.toLowerCase().includes(searchExtension.value.toLowerCase())
  );
});

const toggleDropdown = (id) => {
  if (activeDropdown.value === id) {
    activeDropdown.value = null;
  } else {
    activeDropdown.value = id;
  }
};

const activateVersion = (id) => {
  phpVersions.value.forEach((version) => {
    version.active = version.id === id;
  });
  activeDropdown.value = null;
};

const configureExtensions = (id) => {
  activeTab.value = "extensions";
  activeDropdown.value = null;
};

const editPhpIni = (id) => {
  activeTab.value = "phpini";
  activeDropdown.value = null;
};

const uninstallVersion = (id) => {
  if (confirm("确定要卸载此 PHP 版本吗？")) {
    phpVersions.value = phpVersions.value.filter((version) => version.id !== id);
  }
  activeDropdown.value = null;
};
</script>

<style scoped>
.php-config {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: calc(100vh - 32px);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e293b;
}

.config-section {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn {
  background: #10b981;
  color: white;
}

.add-btn:hover {
  background: #059669;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.version-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.version-card.active {
  border-left: 4px solid #10b981;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-name {
  font-size: 16px;
  font-weight: 600;
}

.version-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #e5e7eb;
  color: #4b5563;
}

.version-badge.active-badge {
  background: #d1fae5;
  color: #065f46;
}

.version-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.detail-label {
  width: 80px;
  color: #64748b;
}

.detail-value {
  font-weight: 500;
}

.version-actions {
  display: flex;
  gap: 10px;
  position: relative;
}

.action-btn {
  flex: 1;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.primary-btn {
  background: #10b981;
  color: white;
}

.primary-btn:hover {
  background: #059669;
}

.secondary-btn {
  background: #f3f4f6;
  color: #1e293b;
}

.secondary-btn:hover {
  background: #e5e7eb;
}

.disabled-btn {
  background: #d1fae5;
  color: #065f46;
  cursor: default;
}

.action-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  width: 160px;
  z-index: 10;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dropdown-item.danger {
  color: #ef4444;
}

.dropdown-item.danger:hover {
  background: #fee2e2;
}

.config-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.tab-btn {
  padding: 10px 16px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: #1e293b;
}

.tab-btn.active {
  color: #10b981;
  border-bottom-color: #10b981;
}

.tab-content {
  padding: 16px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.form-group.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group.checkbox label {
  margin-bottom: 0;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 0 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
}

.extension-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.extension-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.extension-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.extension-name {
  font-weight: 500;
  font-size: 14px;
}

.extension-version {
  font-size: 12px;
  color: #64748b;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.4s;
  border-radius: 22px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #10b981;
}

input:focus + .slider {
  box-shadow: 0 0 1px #10b981;
}

input:checked + .slider:before {
  transform: translateX(18px);
}

.php-ini-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-toolbar {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: #f3f4f6;
}

.editor-container {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.code-editor {
  width: 100%;
  height: 400px;
  padding: 12px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  border: none;
  resize: none;
  background: #f8fafc;
}

.code-editor:focus {
  outline: none;
}

@media (prefers-color-scheme: dark) {
  .page-title {
    color: #f1f5f9;
  }

  .config-section {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .version-card {
    background: rgba(30, 41, 59, 0.5);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .version-badge {
    background: #334155;
    color: #cbd5e1;
  }

  .version-badge.active-badge {
    background: #064e3b;
    color: #a7f3d0;
  }

  .detail-label {
    color: #94a3b8;
  }

  .secondary-btn {
    background: #334155;
    color: #f1f5f9;
  }

  .secondary-btn:hover {
    background: #475569;
  }

  .disabled-btn {
    background: #064e3b;
    color: #a7f3d0;
  }

  .dropdown-menu {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .dropdown-item:hover {
    background: #334155;
  }

  .dropdown-item.danger:hover {
    background: #7f1d1d;
  }

  .tab-btn {
    color: #94a3b8;
  }

  .tab-btn:hover {
    color: #f1f5f9;
  }

  .form-input {
    background: #1e293b;
    border-color: #475569;
    color: #f1f5f9;
  }

  .search-bar {
    background: #334155;
  }

  .search-input {
    color: #f1f5f9;
  }

  .extension-item {
    background: rgba(30, 41, 59, 0.5);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .extension-version {
    color: #94a3b8;
  }

  .toolbar-btn {
    background: #334155;
    border-color: #475569;
    color: #f1f5f9;
  }

  .toolbar-btn:hover {
    background: #475569;
  }

  .code-editor {
    background: #1e293b;
    color: #f1f5f9;
  }
}
</style>
