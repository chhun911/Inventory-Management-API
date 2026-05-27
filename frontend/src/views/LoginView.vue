<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const submitting = ref(false);
const errorMessage = ref('');
const fieldErrors = ref({});

const sessionExpired = computed(() => route.query.session === 'expired');

function validate() {
  const errors = {};
  if (!email.value) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) errors.email = 'Enter a valid email';
  if (!password.value) errors.password = 'Password is required';
  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function onSubmit() {
  errorMessage.value = '';
  if (!validate()) return;
  submitting.value = true;
  const result = await auth.login(email.value, password.value);
  submitting.value = false;
  if (result.ok) {
    const redirect = route.query.redirect || { name: 'suppliers' };
    router.push(redirect);
  } else {
    errorMessage.value = result.error;
  }
}
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card">
      <h1>Sign in</h1>
      <p class="subtitle">Access your inventory dashboard</p>

      <div
        v-if="sessionExpired"
        class="alert alert-info"
        data-test="session-expired"
      >
        Your session has expired. Please sign in again.
      </div>

      <div
        v-if="errorMessage"
        class="alert alert-error"
        data-test="login-error"
      >
        {{ errorMessage }}
      </div>

      <form novalidate @submit.prevent="onSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            data-test="login-email"
          />
          <span
            v-if="fieldErrors.email"
            class="field-error"
            data-test="login-email-error"
          >{{ fieldErrors.email }}</span>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            data-test="login-password"
          />
          <span
            v-if="fieldErrors.password"
            class="field-error"
            data-test="login-password-error"
          >{{ fieldErrors.password }}</span>
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          style="width:100%"
          :disabled="submitting"
          data-test="login-submit"
        >
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="form-footer">
        Need an account?
        <RouterLink :to="{ name: 'register' }" data-test="go-register">Create one</RouterLink>
      </p>
    </div>
  </div>
</template>
