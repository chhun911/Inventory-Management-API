<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');
const submitting = ref(false);
const errorMessage = ref('');
const fieldErrors = ref({});

function validate() {
  const errors = {};
  if (!name.value || name.value.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!email.value) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) errors.email = 'Enter a valid email';
  if (!password.value) errors.password = 'Password is required';
  else if (password.value.length < 6) errors.password = 'Password must be at least 6 characters';
  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function onSubmit() {
  errorMessage.value = '';
  if (!validate()) return;
  submitting.value = true;
  const result = await auth.register(email.value, password.value, name.value);
  submitting.value = false;
  if (result.ok) {
    router.push({ name: 'suppliers' });
  } else {
    errorMessage.value = result.error;
  }
}
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card">
      <h1>Create account</h1>
      <p class="subtitle">Sign up to manage suppliers</p>

      <div
        v-if="errorMessage"
        class="alert alert-error"
        data-test="register-error"
      >
        {{ errorMessage }}
      </div>

      <form novalidate @submit.prevent="onSubmit">
        <div class="form-group">
          <label for="name">Full name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            autocomplete="name"
            data-test="register-name"
          />
          <span
            v-if="fieldErrors.name"
            class="field-error"
            data-test="register-name-error"
          >{{ fieldErrors.name }}</span>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            data-test="register-email"
          />
          <span
            v-if="fieldErrors.email"
            class="field-error"
            data-test="register-email-error"
          >{{ fieldErrors.email }}</span>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            data-test="register-password"
          />
          <span
            v-if="fieldErrors.password"
            class="field-error"
            data-test="register-password-error"
          >{{ fieldErrors.password }}</span>
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          style="width:100%"
          :disabled="submitting"
          data-test="register-submit"
        >
          {{ submitting ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="form-footer">
        Already have an account?
        <RouterLink :to="{ name: 'login' }" data-test="go-login">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>
