<template>
  <div class="dashboard">
    <h1 class="dashboard-title">控制面板</h1>

    <div class="service-grid">
      <div class="service-card" :class="{ active: services.apache.active }">
        <div class="service-header">
          <ServerIcon :size="24" />
          <h2>Apache</h2>
          <div class="service-status" :class="{ active: services.apache.active }"></div>
        </div>
        <div class="service-info">
          <p>版本: {{ services.apache.version }}</p>
          <p>端口: {{ services.apache.port }}</p>
        </div>
        <div class="service-actions">
          <button
            class="action-btn"
            :class="{
              'stop-btn': services.apache.active,
              'start-btn': !services.apache.active,
            }"
            @click="toggleService('apache')"
          >
            {{ services.apache.active ? "停止" : "启动" }}
          </button>
          <button class="action-btn config-btn" @click="goToConfig('apache')">
            配置
          </button>
        </div>
      </div>

      <div class="service-card" :class="{ active: services.nginx.active }">
        <div class="service-header">
          <ServerIcon :size="24" />
          <h2>Nginx</h2>
          <div class="service-status" :class="{ active: services.nginx.active }"></div>
        </div>
        <div class="service-info">
          <p>版本: {{ services.nginx.version }}</p>
          <p>端口: {{ services.nginx.port }}</p>
        </div>
        <div class="service-actions">
          <button
            class="action-btn"
            :class="{
              'stop-btn': services.nginx.active,
              'start-btn': !services.nginx.active,
            }"
            @click="toggleService('nginx')"
          >
            {{ services.nginx.active ? "停止" : "启动" }}
          </button>
          <button class="action-btn config-btn" @click="goToConfig('nginx')">配置</button>
        </div>
      </div>

      <div class="service-card" :class="{ active: services.php.active }">
        <div class="service-header">
          <CodeIcon :size="24" />
          <h2>PHP</h2>
          <div class="service-status" :class="{ active: services.php.active }"></div>
        </div>
        <div class="service-info">
          <p>版本: {{ services.php.version }}</p>
          <p>模式: {{ services.php.mode }}</p>
        </div>
        <div class="service-actions">
          <button
            class="action-btn"
            :class="{
              'stop-btn': services.php.active,
              'start-btn': !services.php.active,
            }"
            @click="toggleService('php')"
          >
            {{ services.php.active ? "停止" : "启动" }}
          </button>
          <button class="action-btn config-btn" @click="goToConfig('php')">配置</button>
        </div>
      </div>

      <div class="service-card" :class="{ active: services.mysql.active }">
        <div class="service-header">
          <DatabaseIcon :size="24" />
          <h2>MySQL</h2>
          <div class="service-status" :class="{ active: services.mysql.active }"></div>
        </div>
        <div class="service-info">
          <p>版本: {{ services.mysql.version }}</p>
          <p>端口: {{ services.mysql.port }}</p>
        </div>
        <div class="service-actions">
          <button
            class="action-btn"
            :class="{
              'stop-btn': services.mysql.active,
              'start-btn': !services.mysql.active,
            }"
            @click="toggleService('mysql')"
          >
            {{ services.mysql.active ? "停止" : "启动" }}
          </button>
          <button class="action-btn config-btn" @click="goToConfig('database')">
            配置
          </button>
        </div>
      </div>
    </div>

    <div class="system-info">
      <h2>系统信息</h2>
      <div class="info-grid" v-if="Object.keys(systemInfo).length > 0">
        <div class="info-item">
          <span class="info-label">操作系统:</span>
          <span class="info-value">
            {{ systemInfo.osInfo.distro }} {{ systemInfo.osInfo.release }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">主机名:</span>
          <span class="info-value">{{ systemInfo.osInfo.fqdn }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">内存使用:</span>
          <span class="info-value">
            {{ (systemInfo.mem.available / 1024 ** 3).toFixed(2) }} /
            {{ (systemInfo.mem.total / 1024 ** 3).toFixed(2) }} GB
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">磁盘空间:</span>
          <ul class="disk-list">
            <li v-for="d in systemInfo.disk" :key="d.device" class="disk-item">
              {{ d.name }} - {{ (d.size / 1024 ** 3).toFixed(2) }} GB
            </li>
          </ul>
        </div>
      </div>

      <div v-else>
        <Loader />
      </div>
    </div>
  </div>
</template>

<script setup>
import { Loader } from "lucide-vue-next";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import {
  Server as ServerIcon,
  Code as CodeIcon,
  Database as DatabaseIcon,
} from "lucide-vue-next";

const router = useRouter();

const services = ref({
  apache: {
    active: false,
    version: "2.4.54",
    port: "80",
  },
  nginx: {
    active: true,
    version: "1.21.6",
    port: "8080",
  },
  php: {
    active: true,
    version: "8.1.6",
    mode: "FPM",
  },
  mysql: {
    active: true,
    version: "8.0.29",
    port: "3306",
  },
});

const systemInfo = ref({});

const toggleService = (service) => {
  services.value[service].active = !services.value[service].active;
  // 在实际应用中，这里会调用 Electron API 来启动或停止服务
};

const goToConfig = (service) => {
  router.push(`/${service}`);
};
let timer = ref(null);

onMounted(() => {
  // 定义获取系统信息的函数
  const fetchInfo = async () => {
    const info = await window.electronAPI.getSystemInfo();
    systemInfo.value = info;
    console.log("系统信息：", info);
  };

  // 初次获取
  fetchInfo();

  // 每5秒获取一次
  timer.value = setInterval(fetchInfo, 5000);
});

// 页面卸载时清除定时器
onBeforeUnmount(() => {
  clearInterval(timer.value);
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dashboard-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e293b;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.service-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.service-card.active {
  border-left: 4px solid #10b981;
}

.service-header {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.service-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.service-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
  margin-left: auto;
}

.service-status.active {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.service-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-info p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.service-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
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
}

.start-btn {
  background: #10b981;
  color: white;
}

.start-btn:hover {
  background: #059669;
}

.stop-btn {
  background: #ef4444;
  color: white;
}

.stop-btn:hover {
  background: #dc2626;
}

.config-btn {
  background: #f3f4f6;
  color: #1e293b;
}

.config-btn:hover {
  background: #e5e7eb;
}

.system-info {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.system-info h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #64748b;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

@media (prefers-color-scheme: dark) {
  .dashboard-title {
    color: #f1f5f9;
  }

  .service-card {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .service-info p {
    color: #94a3b8;
  }

  .config-btn {
    background: #334155;
    color: #f1f5f9;
  }

  .config-btn:hover {
    background: #475569;
  }

  .system-info {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
