<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { suppliersApi } from '../api/suppliers';
import { extractErrorMessage } from '../api/client';

const route = useRoute();
const router = useRouter();
const id = Number(route.params.id);

const supplier = ref(null);
const loading = ref(true);
const errorMessage = ref('');
const notFound = ref(false);
const showDeleteModal = ref(false);
const deleting = ref(false);

async function load() {
  loading.value = true;
  errorMessage.value = '';
  try {
    supplier.value = await suppliersApi.get(id);
  } catch (error) {
    if (error?.response?.status === 404) notFound.value = true;
    else errorMessage.value = extractErrorMessage(error, 'Failed to load supplier');
  } finally {
    loading.value = false;
  }
}

async function confirmDelete() {
  deleting.value = true;
  try {
    await suppliersApi.remove(id);
    router.push({ name: 'suppliers' });
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Failed to delete supplier');
    showDeleteModal.value = false;
  } finally {
    deleting.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <div class="page-header">
      <h1 data-test="details-heading">Supplier details</h1>
      <RouterLink
        :to="{ name: 'suppliers' }"
        class="btn"
        data-test="details-back"
      >Back to list</RouterLink>
    </div>

    <div v-if="loading" class="muted" data-test="details-loading">Loading…</div>

    <div v-else-if="notFound" class="alert alert-error" data-test="details-notfound">
      Supplier not found.
    </div>

    <div v-else-if="errorMessage" class="alert alert-error" data-test="details-error">
      {{ errorMessage }}
    </div>

    <div v-else-if="supplier" class="card">
      <h2 data-test="details-name" style="margin-top:0">{{ supplier.name }}</h2>
      <p data-test="details-contactEmail">
        <strong>Email:</strong> {{ supplier.contactEmail }}
      </p>
      <p data-test="details-phone">
        <strong>Phone:</strong> {{ supplier.phone || '—' }}
      </p>
      <p data-test="details-address">
        <strong>Address:</strong> {{ supplier.address || '—' }}
      </p>
      <p class="muted">
        Created {{ new Date(supplier.createdAt).toLocaleString() }}
      </p>

      <div class="btn-row">
        <RouterLink
          :to="{ name: 'supplier-edit', params: { id: supplier.id } }"
          class="btn btn-primary"
          data-test="details-edit"
        >Edit</RouterLink>
        <button
          type="button"
          class="btn btn-danger"
          data-test="details-delete"
          @click="showDeleteModal = true"
        >Delete</button>
      </div>
    </div>

    <div
      v-if="showDeleteModal"
      class="modal-backdrop"
      data-test="delete-modal"
    >
      <div class="modal">
        <h2>Delete supplier?</h2>
        <p>
          This will permanently delete
          <strong data-test="delete-modal-name">{{ supplier?.name }}</strong>.
        </p>
        <div class="btn-row" style="justify-content:flex-end">
          <button
            type="button"
            class="btn"
            :disabled="deleting"
            data-test="delete-cancel"
            @click="showDeleteModal = false"
          >Cancel</button>
          <button
            type="button"
            class="btn btn-danger"
            :disabled="deleting"
            data-test="delete-confirm"
            @click="confirmDelete"
          >
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
