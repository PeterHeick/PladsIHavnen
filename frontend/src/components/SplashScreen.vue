<template>
  <div  class="splash-screen">
    <img src="/splashscreen.png" alt="Splash Screen" />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.splash-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #fff; /* Tilføj en baggrundsfarve efter behov */
}

img {
  max-width: 100%;
  height: auto;
}
</style>
