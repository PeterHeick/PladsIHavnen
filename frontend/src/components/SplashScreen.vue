<template>
  <div class="splash-screen">
    <div class="content-wrapper"> 
      <h1 class="header">Er der plads i havnen?</h1> 
      <img src="/splashscreen.png" alt="Splash Screen" />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.splash-screen {
  display: flex;
  justify-content: center; /* Centrer indholdet vandret */
  align-items: center; /* Centrer indholdet lodret */
  height: 100vh;
  background-color: #fff; 
}

.content-wrapper {
  display: flex;
  flex-direction: column; /* Arranger elementer lodret */
  align-items: center; /* Centrer indholdet vandret inden i wrapperen */
}

.header {
  margin-bottom: 20px; 
  font-size: 2.5rem; 
  text-align: center; 
}

img {
  max-width: 100%;
  height: auto;
}
</style>