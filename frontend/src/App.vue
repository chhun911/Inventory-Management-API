<script setup>
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const showNav = computed(() => auth.isAuthenticated && !['login', 'register'].includes(route.name));

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="app-shell">
    <nav v-if="showNav" class="navbar" data-test="navbar">
      <span class="brand">Inventory Management</span>
      <div class="nav-links">
        <RouterLink :to="{ name: 'suppliers' }" data-test="nav-suppliers">Suppliers</RouterLink>
      </div>
      <div class="spacer" />
      <span class="user-info" data-test="nav-user">{{ auth.user?.name }}</span>
      <button class="btn" type="button" data-test="nav-logout" @click="logout">Logout</button>
    </nav>
    <RouterView />
  </div>
</template>
