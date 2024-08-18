<template>
  <div class="search-container">
    <div class="search-icon" @click="toggleSearch">
      🔍
    </div>
    <div v-if="showSearch" class="search-bar">
      <input 
        type="text" 
        v-model="searchQuery" 
        @keyup.enter="emitSearch" 
        placeholder="Søg efter havn..." 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['search']);

const showSearch = ref(false);
const searchQuery = ref('');

const toggleSearch = () => {
  showSearch.value = !showSearch.value;
};

const emitSearch = () => {
  if (searchQuery.value.trim() !== '') {
    emit('search', searchQuery.value.trim());
    searchQuery.value = ''; // Nulstil søgefeltet efter søgning
    showSearch.value = false; // Skjul søgefeltet efter søgning
  }
};
</script>

<style scoped>
.search-container {
  display: flex;
  align-items: center;
}

.search-icon {
  cursor: pointer;
  background: white;
  padding: 5px;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.search-bar {
  background: white;
  padding: 5px 10px;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  margin-left: 10px;
}

.search-bar input {
  border: none;
  outline: none;
  width: 200px;
}
</style>
