<script setup>
import { reactive } from "vue";
import Swal from "sweetalert2";


const versions = reactive({ ...window.electron.process.versions });
</script>

<template>
  <ul class="versions">
    <li class="electron-version" @click="addHost">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
  </ul>
</template>
