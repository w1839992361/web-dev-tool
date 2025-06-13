<template>
  <div class="app-container">
    <!-- Custom Titlebar -->
    <div class="titlebar">
      <!-- Drag Region -->
      <div class="drag-region">
        <div class="titlebar-content">
          <div class="app-icon">
            <div class="icon-glow"></div>
          </div>
          <span class="app-title">Web Dev Tool</span>
        </div>
      </div>

      <!-- Window Controls -->
      <div class="window-controls">
        <button @click="minimize" class="control-btn minimize-btn" title="最小化">
          <Minimize2 :size="14" />
        </button>
        <button
          @click="toggleMaximize"
          class="control-btn maximize-btn"
          :title="isMaximized ? '还原' : '最大化'"
        >
          <Square v-if="isMaximized" :size="14" />
          <Maximize2 v-else :size="14" />
        </button>
        <button @click="close" class="control-btn close-btn" title="关闭">
          <X :size="14" />
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <!-- Sidebar Navigation -->
      <div class="sidebar">
        <div class="sidebar-header">
          <ServerIcon :size="20" />
          <span>服务管理</span>
        </div>

        <div class="sidebar-items">
          <router-link to="/" class="sidebar-item" exact-active-class="active">
            <LayoutDashboardIcon :size="18" />
            <span>控制面板</span>
          </router-link>

          <router-link to="/php" class="sidebar-item" active-class="active">
            <CodeIcon :size="18" />
            <span>PHP 版本</span>
          </router-link>

          <router-link to="/nginx" class="sidebar-item" active-class="active">
            <ServerIcon :size="18" />
            <span>Nginx 配置</span>
          </router-link>

          <router-link to="/apache" class="sidebar-item" active-class="active">
            <ServerIcon :size="18" />
            <span>Apache 配置</span>
          </router-link>

          <router-link to="/database" class="sidebar-item" active-class="active">
            <DatabaseIcon :size="18" />
            <span>数据库配置</span>
          </router-link>
        </div>

        <div class="sidebar-footer">
          <router-link to="/settings" class="sidebar-item" active-class="active">
            <SettingsIcon :size="18" />
            <span>设置</span>
          </router-link>
        </div>
      </div>

      <div class="content-wrapper">
        <router-view></router-view>
      </div>

      <!-- Status Bar -->
      <div class="status-bar">
        <div class="status-left">
          <div class="status-indicator">
            <div class="status-dot"></div>
            <span>应用运行中</span>
          </div>
          <div class="status-divider"></div>
          <div class="status-version">版本 1.0.0</div>
        </div>
        <div class="status-right">{{ currentTime }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import {
  Minimize2,
  Maximize2,
  Square,
  X,
  Server as ServerIcon,
  Code as CodeIcon,
  Database as DatabaseIcon,
  Settings as SettingsIcon,
  LayoutDashboard as LayoutDashboardIcon,
} from "lucide-vue-next";
import Swal from "sweetalert2";

const isMaximized = ref(false);
const currentTime = ref("");

let isHide = window.electronStorage.get('isHide');

// 更新时间
const updateTime = () => {
  currentTime.value = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 窗口控制函数
const minimize = () => {
  if (window.electronAPI) {
    window.electronAPI.minimize();
  } else {
    console.log("Minimize window");
  }
};

const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value;
  if (window.electronAPI) {
    window.electronAPI.maximize();
  } else {
    console.log("Toggle maximize window");
  }
};

const close = () => {
  if (window.electronAPI) {
    let _window = window.electronAPI;
    if (isHide === null)  {
      Swal.fire({
        title: "确定关闭窗口？",
        text: "你可以选择最小化并记住选择，或直接关闭窗口。",
        icon: "warning",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "最小化并记住",
        denyButtonText: "关闭并记住",
        cancelButtonText: "取消",
      }).then((result) => {
        if (result.isConfirmed) {
          isHide = 1;
          window.electronStorage.set('isHide', isHide);
          _window.minihide();
        } else if (result.isDenied) {
          isHide = 0;
          window.electronStorage.set('isHide', isHide);
          _window.close();
        }
      });
    } else if (isHide == 1) {
      window.electronAPI.minihide();
    } else if (isHide == 0) {
      window.electronAPI.close();
    }
  } else {
    console.log("Close window");
  }
};

// 生命周期
let timer = null;

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  user-select: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu",
    "Cantarell", sans-serif;
  overflow: hidden;
}

/* ==================== Titlebar Styles ==================== */
.titlebar {
  height: 40px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1000;
}

.titlebar::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  pointer-events: none;
}

.drag-region {
  flex: 1;
  -webkit-app-region: drag;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

.titlebar-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  position: relative;
  box-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
}

.icon-glow {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  opacity: 0.3;
  filter: blur(4px);
  z-index: -1;
}

.app-title {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
  position: relative;
  z-index: 1;
}

.control-btn {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.control-btn::before {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.control-btn:hover::before {
  opacity: 1;
}

.control-btn:hover {
  color: white;
}

.control-btn:hover svg {
  transform: scale(1.1);
}

.close-btn:hover::before {
  background: rgba(239, 68, 68, 0.8);
}

.close-btn:hover {
  color: white;
}

/* ==================== Content Styles ==================== */
.content {
  flex: 1;
  display: flex;
  /* flex-direction: column; */
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
  flex-wrap: wrap;
}

.content::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
      circle at 20% 80%,
      rgba(120, 119, 198, 0.3) 0%,
      transparent 50%
    ),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
  pointer-events: none;
}

/* ==================== Sidebar Styles ==================== */
.sidebar {
  width: 220px;
  height: calc(100% - 32px);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-weight: 600;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  gap: 10px;
}

.sidebar-items {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(0, 0, 0, 0.7);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  font-size: 13px;
}

.sidebar-item:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.9);
}

.sidebar-item.active {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.9);
  border-left-color: #4facfe;
}

.sidebar-footer {
  padding: 12px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.content {
  display: flex;
  flex: 1;
}

.content-wrapper {
  flex: 1;
  height: calc(100% - 50px);
  padding: 20px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  margin: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* ==================== Status Bar Styles ==================== */
.status-bar {
  width: 100%;
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-size: 12px;
  position: relative;
  z-index: 100;
}

.status-bar::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.5) 50%,
    transparent 100%
  );
}

.status-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-weight: 500;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
  animation: pulse 2s infinite;
}

.status-divider {
  width: 1px;
  height: 12px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.2) 50%,
    transparent 100%
  );
}

.status-version {
  color: #64748b;
  font-weight: 500;
}

.status-right {
  color: #64748b;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }

  .sidebar-item span,
  .sidebar-header span {
    display: none;
  }

  .sidebar-header {
    justify-content: center;
    padding: 0;
  }

  .sidebar-item {
    justify-content: center;
    padding: 12px 0;
  }

  .content-wrapper {
    padding: 16px;
  }

  .app-title {
    display: none;
  }

  .status-left {
    gap: 8px;
  }

  .status-version {
    display: none;
  }
}

/* ==================== 深色模式支持 ==================== */
@media (prefers-color-scheme: dark) {
  .content {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  }

  .content-wrapper {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .sidebar {
    background: rgba(0, 0, 0, 0.3);
    border-right-color: rgba(255, 255, 255, 0.1);
  }

  .sidebar-header {
    color: rgba(255, 255, 255, 0.9);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .sidebar-item {
    color: rgba(255, 255, 255, 0.7);
  }

  .sidebar-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  .sidebar-item.active {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.9);
  }

  .sidebar-footer {
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  .status-bar {
    background: rgba(0, 0, 0, 0.8);
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  .status-indicator,
  .status-version,
  .status-right {
    color: #94a3b8;
  }
}
</style>
