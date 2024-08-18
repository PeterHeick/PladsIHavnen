<template>
  <div class="home-container">
    <!--
    <div class="header">Header</div>
    -->
    <div class="map-wrapper">
      <MapView />
    </div>
  </div>
</template>

<script setup lang="ts">
import MapView from './MapView.vue';
</script>

<style scoped>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* Fjern scroll på body */
}

.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Fyld hele vinduets højde */
  margin: 0;
}

.header {
  background-color: #f8f9fa;
  padding: 10px;
  text-align: center;
  font-weight: bold;
  flex-shrink: 0; /* Forhindrer headeren i at krympe */
}

.map-wrapper {
  flex: 1; /* Fyld resten af pladsen */
  overflow: hidden; /* Forhindrer scrollbars */
  position: relative;
}

.map-wrapper > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>