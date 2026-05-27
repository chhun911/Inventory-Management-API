<script setup>
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
</script>

<template>
  <div class="container">
    <div class="error-page" data-test="not-found">
      <h1 data-test="not-found-code">404</h1>
      <h2 data-test="not-found-title">Page not found</h2>
      <p data-test="not-found-message">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <RouterLink
        :to="{ name: auth.isAuthenticated ? 'suppliers' : 'login' }"
        class="btn btn-primary"
        data-test="not-found-home"
      >Go to {{ auth.isAuthenticated ? 'suppliers' : 'sign in' }}</RouterLink>
    </div>
  </div>
</template>
