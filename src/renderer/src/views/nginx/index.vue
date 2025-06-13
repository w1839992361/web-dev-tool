<template>
  <div class="nginx-config">
    <h1 class="page-title">Nginx 配置</h1>

    <div class="config-section">
      <div class="section-header">
        <h2>服务器状态</h2>
        <div class="status-controls">
          <div class="status-indicator">
            <div class="status-dot" :class="{ active: nginxStatus.running }"></div>
            <span>{{ nginxStatus.running ? "运行中" : "已停止" }}</span>
          </div>
          <button
            class="action-button"
            :class="nginxStatus.running ? 'stop-btn' : 'start-btn'"
            @click="toggleNginxService"
          >
            {{ nginxStatus.running ? "停止" : "启动" }}
          </button>
          <button class="action-button restart-btn" @click="restartNginx">
            <RefreshCwIcon :size="16" />
            重启
          </button>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">版本:</span>
          <span class="info-value">{{ nginxStatus.version }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">端口:</span>
          <span class="info-value">{{ nginxStatus.port }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">配置文件:</span>
          <span class="info-value">{{ nginxStatus.configPath }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">日志目录:</span>
          <span class="info-value">{{ nginxStatus.logPath }}</span>
        </div>
      </div>
    </div>

    <div class="config-section">
      <div class="section-header">
        <h2>虚拟主机</h2>
        <button class="action-button add-btn" @click="showAddVhostModal = true">
          <PlusIcon :size="16" />
          添加虚拟主机
        </button>
      </div>

      <div class="vhost-list">
        <div v-for="vhost in vhosts" :key="vhost.id" class="vhost-card">
          <div class="vhost-header">
            <h3>{{ vhost.serverName }}</h3>
            <div class="vhost-badge" :class="{ active: vhost.enabled }">
              {{ vhost.enabled ? "已启用" : "已禁用" }}
            </div>
          </div>

          <div class="vhost-details">
            <div class="detail-item">
              <span class="detail-label">根目录:</span>
              <span class="detail-value">{{ vhost.root }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">端口:</span>
              <span class="detail-value">{{ vhost.port }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">SSL:</span>
              <span class="detail-value">{{ vhost.ssl ? "启用" : "禁用" }}</span>
            </div>
          </div>

          <div class="vhost-actions">
            <button
              class="action-btn"
              :class="vhost.enabled ? 'warning-btn' : 'success-btn'"
              @click="toggleVhost(vhost.id)"
            >
              {{ vhost.enabled ? "禁用" : "启用" }}
            </button>
            <button class="action-btn secondary-btn" @click="editVhost(vhost.id)">
              <FileEditIcon :size="16" />
              编辑
            </button>
            <button class="action-btn danger-btn" @click="deleteVhost(vhost.id)">
              <TrashIcon :size="16" />
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h2>配置文件编辑器</h2>

      <div class="config-tabs">
        <button
          v-for="file in configFiles"
          :key="file.id"
          class="tab-btn"
          :class="{ active: activeConfigFile === file.id }"
          @click="activeConfigFile = file.id"
        >
          {{ file.name }}
        </button>
      </div>

      <div class="editor-container">
        <div class="editor-toolbar">
          <button class="toolbar-btn" @click="saveConfigFile">
            <SaveIcon :size="16" />
            保存
          </button>
          <button class="toolbar-btn" @click="reloadConfig">
            <RefreshCwIcon :size="16" />
            重新加载配置
          </button>
        </div>
        <textarea class="code-editor" v-model="currentConfigContent"></textarea>
      </div>
    </div>

    <!-- Add Virtual Host Modal -->
    <div
      class="modal-overlay"
      v-if="showAddVhostModal"
      @click="showAddVhostModal = false"
    >
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>添加虚拟主机</h3>
          <button class="close-btn" @click="showAddVhostModal = false">
            <XIcon :size="20" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>服务器名称</label>
            <input
              type="text"
              v-model="newVhost.serverName"
              class="form-input"
              placeholder="example.com"
            />
          </div>

          <div class="form-group">
            <label>根目录</label>
            <input
              type="text"
              v-model="newVhost.root"
              class="form-input"
              placeholder="C:\\xampp\\htdocs\\example"
            />
          </div>

          <div class="form-group">
            <label>端口</label>
            <input
              type="number"
              v-model="newVhost.port"
              class="form-input"
              placeholder="80"
            />
          </div>

          <div class="form-group checkbox">
            <input type="checkbox" id="ssl-enabled" v-model="newVhost.ssl" />
            <label for="ssl-enabled">启用 SSL</label>
          </div>

          <div class="form-group checkbox">
            <input type="checkbox" id="vhost-enabled" v-model="newVhost.enabled" />
            <label for="vhost-enabled">立即启用</label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="action-btn secondary-btn" @click="showAddVhostModal = false">
            取消
          </button>
          <button class="action-btn primary-btn" @click="addVhost">添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
  FileEdit as FileEditIcon,
  Trash as TrashIcon,
  Save as SaveIcon,
  X as XIcon,
} from "lucide-vue-next";

const showAddVhostModal = ref(false);
const activeConfigFile = ref("nginx");

const nginxStatus = ref({
  running: true,
  version: "1.21.6",
  port: "8080",
  configPath: "C:\\nginx\\conf\\nginx.conf",
  logPath: "C:\\nginx\\logs\\",
});

const vhosts = ref([
  {
    id: 1,
    serverName: "localhost",
    root: "C:\\xampp\\htdocs",
    port: 80,
    ssl: false,
    enabled: true,
  },
  {
    id: 2,
    serverName: "example.local",
    root: "C:\\xampp\\htdocs\\example",
    port: 80,
    ssl: false,
    enabled: true,
  },
  {
    id: 3,
    serverName: "secure.local",
    root: "C:\\xampp\\htdocs\\secure",
    port: 443,
    ssl: true,
    enabled: false,
  },
]);

const configFiles = ref([
  { id: "nginx", name: "nginx.conf" },
  { id: "mime", name: "mime.types" },
  { id: "fastcgi", name: "fastcgi.conf" },
]);

const configContents = ref({
  nginx: `# Nginx Configuration
  user nginx;
  worker_processes auto;
  error_log /var/log/nginx/error.log;
  pid /run/nginx.pid;
  
  events {
      worker_connections 1024;
  }
  
  http {
      log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
  
      access_log /var/log/nginx/access.log main;
  
      sendfile on;
      tcp_nopush on;
      tcp_nodelay on;
      keepalive_timeout 65;
      types_hash_max_size 2048;
  
      include /etc/nginx/mime.types;
      default_type application/octet-stream;
  
      include /etc/nginx/conf.d/*.conf;
  
      server {
          listen 80 default_server;
          listen [::]:80 default_server;
          server_name _;
          root /usr/share/nginx/html;
  
          location / {
              index index.html index.htm;
          }
  
          error_page 404 /404.html;
              location = /40x.html {
          }
  
          error_page 500 502 503 504 /50x.html;
              location = /50x.html {
          }
      }
  }`,
  mime: `types {
      text/html                             html htm shtml;
      text/css                              css;
      text/xml                              xml;
      image/gif                             gif;
      image/jpeg                            jpeg jpg;
      application/javascript                js;
      application/atom+xml                  atom;
      application/rss+xml                   rss;
  
      text/mathml                           mml;
      text/plain                            txt;
      text/vnd.sun.j2me.app-descriptor      jad;
      text/vnd.wap.wml                      wml;
      text/x-component                      htc;
  
      image/png                             png;
      image/tiff                            tif tiff;
      image/vnd.wap.wbmp                    wbmp;
      image/x-icon                          ico;
      image/x-jng                           jng;
      image/x-ms-bmp                        bmp;
      image/svg+xml                         svg svgz;
      image/webp                            webp;
  
      application/font-woff                 woff;
      application/java-archive              jar war ear;
      application/json                      json;
      application/mac-binhex40              hqx;
      application/msword                    doc;
      application/pdf                       pdf;
      application/postscript                ps eps ai;
      application/rtf                       rtf;
      application/vnd.apple.mpegurl         m3u8;
      application/vnd.ms-excel              xls;
      application/vnd.ms-fontobject         eot;
      application/vnd.ms-powerpoint         ppt;
      application/vnd.wap.wmlc              wmlc;
      application/vnd.google-earth.kml+xml  kml;
      application/vnd.google-earth.kmz      kmz;
      application/x-7z-compressed           7z;
      application/x-cocoa                   cco;
      application/x-java-archive-diff       jardiff;
      application/x-java-jnlp-file          jnlp;
      application/x-makeself                run;
      application/x-perl                    pl pm;
      application/x-pilot                   prc pdb;
      application/x-rar-compressed          rar;
      application/x-redhat-package-manager  rpm;
      application/x-sea                     sea;
      application/x-shockwave-flash         swf;
      application/x-stuffit                 sit;
      application/x-tcl                     tcl tk;
      application/x-x509-ca-cert            der pem crt;
      application/x-xpinstall               xpi;
      application/xhtml+xml                 xhtml;
      application/xspf+xml                  xspf;
      application/zip                       zip;
  
      application/octet-stream              bin exe dll;
      application/octet-stream              deb;
      application/octet-stream              dmg;
      application/octet-stream              iso img;
      application/octet-stream              msi msp msm;
  
      application/vnd.openxmlformats-officedocument.wordprocessingml.document    docx;
      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet          xlsx;
      application/vnd.openxmlformats-officedocument.presentationml.presentation  pptx;
  
      audio/midi                            mid midi kar;
      audio/mpeg                            mp3;
      audio/ogg                             ogg;
      audio/x-m4a                           m4a;
      audio/x-realaudio                     ra;
  
      video/3gpp                            3gpp 3gp;
      video/mp2t                            ts;
      video/mp4                             mp4;
      video/mpeg                            mpeg mpg;
      video/quicktime                       mov;
      video/webm                            webm;
      video/x-flv                           flv;
      video/x-m4v                           m4v;
      video/x-mng                           mng;
      video/x-ms-asf                        asx asf;
      video/x-ms-wmv                        wmv;
      video/x-msvideo                       avi;
  }`,
  fastcgi: `fastcgi_param  SCRIPT_FILENAME    $document_root$fastcgi_script_name;
  fastcgi_param  QUERY_STRING       $query_string;
  fastcgi_param  REQUEST_METHOD     $request_method;
  fastcgi_param  CONTENT_TYPE       $content_type;
  fastcgi_param  CONTENT_LENGTH     $content_length;
  
  fastcgi_param  SCRIPT_NAME        $fastcgi_script_name;
  fastcgi_param  REQUEST_URI        $request_uri;
  fastcgi_param  DOCUMENT_URI       $document_uri;
  fastcgi_param  DOCUMENT_ROOT      $document_root;
  fastcgi_param  SERVER_PROTOCOL    $server_protocol;
  fastcgi_param  REQUEST_SCHEME     $scheme;
  fastcgi_param  HTTPS              $https if_not_empty;
  
  fastcgi_param  GATEWAY_INTERFACE  CGI/1.1;
  fastcgi_param  SERVER_SOFTWARE    nginx/$nginx_version;
  
  fastcgi_param  REMOTE_ADDR        $remote_addr;
  fastcgi_param  REMOTE_PORT        $remote_port;
  fastcgi_param  SERVER_ADDR        $server_addr;
  fastcgi_param  SERVER_PORT        $server_port;
  fastcgi_param  SERVER_NAME        $server_name;
  
  # PHP only, required if PHP was built with --enable-force-cgi-redirect
  fastcgi_param  REDIRECT_STATUS    200;`,
});

const newVhost = ref({
  serverName: "",
  root: "",
  port: 80,
  ssl: false,
  enabled: true,
});

const currentConfigContent = computed({
  get() {
    return configContents.value[activeConfigFile.value] || "";
  },
  set(value) {
    configContents.value[activeConfigFile.value] = value;
  },
});

const toggleNginxService = () => {
  nginxStatus.value.running = !nginxStatus.value.running;
  // 在实际应用中，这里会调用 Electron API 来启动或停止 Nginx
};

const restartNginx = () => {
  // 在实际应用中，这里会调用 Electron API 来重启 Nginx
  console.log("Restarting Nginx...");
};

const toggleVhost = (id) => {
  const vhost = vhosts.value.find((v) => v.id === id);
  if (vhost) {
    vhost.enabled = !vhost.enabled;
  }
};

const editVhost = (id) => {
  // 在实际应用中，这里会打开编辑虚拟主机的模态框
  console.log("Edit vhost:", id);
};

const deleteVhost = (id) => {
  if (confirm("确定要删除此虚拟主机吗？")) {
    vhosts.value = vhosts.value.filter((v) => v.id !== id);
  }
};

const addVhost = () => {
  if (!newVhost.value.serverName || !newVhost.value.root) {
    alert("请填写必要的字段");
    return;
  }

  const id = Math.max(...vhosts.value.map((v) => v.id)) + 1;
  vhosts.value.push({
    id,
    ...newVhost.value,
  });

  // 重置表单
  newVhost.value = {
    serverName: "",
    root: "",
    port: 80,
    ssl: false,
    enabled: true,
  };

  showAddVhostModal.value = false;
};

const saveConfigFile = () => {
  // 在实际应用中，这里会保存配置文件
  console.log("Saving config file:", activeConfigFile.value);
};

const reloadConfig = () => {
  // 在实际应用中，这里会重新加载 Nginx 配置
  console.log("Reloading Nginx config...");
};
</script>

<style scoped>
.nginx-config {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.status-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #64748b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-dot.active {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
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

.restart-btn {
  background: #f59e0b;
  color: white;
}

.restart-btn:hover {
  background: #d97706;
}

.add-btn {
  background: #10b981;
  color: white;
}

.add-btn:hover {
  background: #059669;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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

.vhost-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vhost-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vhost-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vhost-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.vhost-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #e5e7eb;
  color: #4b5563;
}

.vhost-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.vhost-details {
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

.vhost-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.success-btn {
  background: #10b981;
  color: white;
}

.success-btn:hover {
  background: #059669;
}

.warning-btn {
  background: #f59e0b;
  color: white;
}

.warning-btn:hover {
  background: #d97706;
}

.secondary-btn {
  background: #f3f4f6;
  color: #1e293b;
}

.secondary-btn:hover {
  background: #e5e7eb;
}

.danger-btn {
  background: #ef4444;
  color: white;
}

.danger-btn:hover {
  background: #dc2626;
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

.editor-container {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border-bottom: 1px solid #d1d5db;
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

.code-editor {
  width: 100%;
  height: 400px;
  padding: 12px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  border: none;
  resize: none;
  background: white;
}

.code-editor:focus {
  outline: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 20px;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.primary-btn {
  background: #10b981;
  color: white;
}

.primary-btn:hover {
  background: #059669;
}

@media (prefers-color-scheme: dark) {
  .page-title {
    color: #f1f5f9;
  }

  .config-section {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .status-indicator {
    color: #94a3b8;
  }

  .info-label {
    color: #94a3b8;
  }

  .vhost-card {
    background: rgba(30, 41, 59, 0.5);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .vhost-badge {
    background: #334155;
    color: #cbd5e1;
  }

  .vhost-badge.active {
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

  .tab-btn {
    color: #94a3b8;
  }

  .tab-btn:hover {
    color: #f1f5f9;
  }

  .editor-toolbar {
    background: #1e293b;
    border-bottom-color: #475569;
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

  .modal-container {
    background: #1e293b;
  }

  .modal-header {
    border-bottom-color: #475569;
  }

  .modal-header h3 {
    color: #f1f5f9;
  }

  .close-btn:hover {
    background: #334155;
  }

  .form-input {
    background: #334155;
    border-color: #475569;
    color: #f1f5f9;
  }

  .modal-footer {
    border-top-color: #475569;
  }
}
</style>
