<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { suppliersApi } from '../api/suppliers';
import { extractErrorMessage } from '../api/client';

const router = useRouter();

const form = ref({
  name: '',
  contactEmail: '',
  phone: '',
  address: '',
});
const fieldErrors = ref({});
const errorMessage = ref('');
const submitting = ref(false);

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
    };
    if (form.value.phone.trim()) payload.phone = form.value.phone.trim();
    if (form.value.address.trim()) payload.address = form.value.address.trim();
    const created = await suppliersApi.create(payload);
    router.push({ name: 'supplier-details', params: { id: created.id } });
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Failed to create supplier');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="container">
    <div class="page-header">
      <h1 data-test="create-heading">New supplier</h1>
      <RouterLink
        :to="{ name: 'suppliers' }"
        class="btn"
        data-test="create-cancel"
      >Cancel</RouterLink>
    </div>

    <div class="card">
      <div
        v-if="errorMessage"
        class="alert alert-error"
        data-test="create-error"
      >{{ errorMessage }}</div>

      <form novalidate @submit.prevent="onSubmit">
        <div class="form-group">
          <label for="name">Name *</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            data-test="supplier-name"
          />
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
          <input
            id="phone"
            v-model="form.phone"
            type="text"
            data-test="supplier-phone"
          />
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
            {{ submitting ? 'Creating…' : 'Create supplier' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
