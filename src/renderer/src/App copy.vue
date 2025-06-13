<script setup>
// const ipcHandle = () => window.electron.ipcRenderer.send("ping");
function addHost() {
  window.devkitAPI.addHost(123123).then((msg) =>
    Swal.fire({
      icon: "success",
      title: "成功",
      text: msg,
      timer: 1500,
      showConfirmButton: false,
    })
  );
}
</script>

<template>
  
</template>
