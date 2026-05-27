<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { suppliersApi } from '../api/suppliers';
import { extractErrorMessage } from '../api/client';

const route = useRoute();
const router = useRouter();
const id = Number(route.params.id);

const form = ref({ name: '', contactEmail: '', phone: '', address: '' });
const loading = ref(true);
const submitting = ref(false);
const errorMessage = ref('');
const fieldErrors = ref({});
const notFound = ref(false);

async function load() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const supplier = await suppliersApi.get(id);
    form.value = {
      name: supplier.name,
      contactEmail: supplier.contactEmail,
      phone: supplier.phone || '',
      address: supplier.address || '',
    };
  } catch (error) {
    if (error?.response?.status === 404) notFound.value = true;
    else errorMessage.value = extractErrorMessage(error, 'Failed to load supplier');
  } finally {
    loading.value = false;
  }
}

function validate() {
  const errors = {};
  const name = form.value.name.trim();
  const contactEmail = form.value.contactEmail.trim();
  if (!name) errors.name = 'Name is required';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer';
  if (!contactEmail) errors.contactEmail = 'Contact email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) errors.contactEmail = 'Enter a valid email';
  if (form.value.phone && form.value.phone.length > 30) errors.phone = 'Phone must be 30 characters or fewer';
  if (form.value.address && form.value.address.length > 255) errors.address = 'Address must be 255 characters or fewer';
  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function onSubmit() {
  errorMessage.value = '';
  if (!validate()) return;
  submitting.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      contactEmail: form.value.contactEmail.trim(),
      phone: form.value.phone.trim(),
      address: form.value.address.trim(),
    };
    await suppliersApi.update(id, payload);
    router.push({ name: 'supplier-details', params: { id } });
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Failed to update supplier');
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <div class="page-header">
      <h1 data-test="edit-heading">Edit supplier</h1>
      <RouterLink
        :to="{ name: 'suppliers' }"
        class="btn"
        data-test="edit-cancel"
      >Cancel</RouterLink>
    </div>

    <div v-if="loading" class="muted" data-test="edit-loading">Loading…</div>

    <div v-else-if="notFound" class="alert alert-error" data-test="edit-notfound">
      Supplier not found.
    </div>

    <div v-else class="card">
      <div
        v-if="errorMessage"
        class="alert alert-error"
        data-test="edit-error"
      >{{ errorMessage }}</div>

      <form novalidate @submit.prevent="onSubmit">
        <div class="form-group">
          <label for="name">Name *</label>
          <input id="name" v-model="form.name" type="text" data-test="supplier-name" />
          <span
            v-if="fieldErrors.name"
            class="field-error"
            data-test="supplier-name-error"
          >{{ fieldErrors.name }}</span>
        </div>
        <div class="form-group">
          <label for="contactEmail">Contact email *</label>
          <input
            id="contactEmail"
            v-model="form.contactEmail"
            type="email"
            data-test="supplier-contactEmail"
          />
          <span
            v-if="fieldErrors.contactEmail"
            class="field-error"
            data-test="supplier-contactEmail-error"
          >{{ fieldErrors.contactEmail }}</span>
        </div>
        <div class="form-group">
          <label for="phone">Phone</label>
          <input id="phone" v-model="form.phone" type="text" data-test="supplier-phone" />
          <span
            v-if="fieldErrors.phone"
            class="field-error"
            data-test="supplier-phone-error"
          >{{ fieldErrors.phone }}</span>
        </div>
        <div class="form-group">
          <label for="address">Address</label>
          <textarea
            id="address"
            v-model="form.address"
            rows="3"
            data-test="supplier-address"
          />
          <span
            v-if="fieldErrors.address"
            class="field-error"
            data-test="supplier-address-error"
          >{{ fieldErrors.address }}</span>
        </div>
        <div class="btn-row">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="submitting"
            data-test="supplier-submit"
          >
            {{ submitting ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
