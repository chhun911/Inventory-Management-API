<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { suppliersApi } from '../api/suppliers';
import { extractErrorMessage } from '../api/client';

const router = useRouter();
const suppliers = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');
const deleteTarget = ref(null);
const deleting = ref(false);

async function load() {
  loading.value = true;
  errorMessage.value = '';
  try {
    suppliers.value = await suppliersApi.list();
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Failed to load suppliers');
  } finally {
    loading.value = false;
  }
}

function goToDetails(id) {
  router.push({ name: 'supplier-details', params: { id } });
}

function confirmDelete(supplier) {
  deleteTarget.value = supplier;
}

function cancelDelete() {
  deleteTarget.value = null;
}

async function performDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  const name = deleteTarget.value.name;
  try {
    await suppliersApi.remove(deleteTarget.value.id);
    suppliers.value = suppliers.value.filter((s) => s.id !== deleteTarget.value.id);
    deleteTarget.value = null;
    successMessage.value = `Supplier "${name}" deleted`;
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'Failed to delete supplier');
  } finally {
    deleting.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="container">
    <div class="page-header">
      <h1 data-test="suppliers-heading">Suppliers</h1>
      <RouterLink
        :to="{ name: 'supplier-new' }"
        class="btn btn-primary"
        data-test="suppliers-new-link"
      >
        New supplier
      </RouterLink>
    </div>

    <div
      v-if="successMessage"
      class="alert alert-success"
      data-test="suppliers-success"
    >
      {{ successMessage }}
    </div>
    <div
      v-if="errorMessage"
      class="alert alert-error"
      data-test="suppliers-error"
    >
      {{ errorMessage }}
    </div>

    <div v-if="loading" class="muted" data-test="suppliers-loading">Loading…</div>

    <div v-else-if="suppliers.length === 0" class="empty-state" data-test="suppliers-empty">
      No suppliers yet. Create your first one.
    </div>

    <table v-else data-test="suppliers-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Contact email</th>
          <th>Phone</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="supplier in suppliers"
          :key="supplier.id"
          :data-test="`supplier-row-${supplier.id}`"
        >
          <td>
            <a
              href="#"
              :data-test="`supplier-name-${supplier.id}`"
              @click.prevent="goToDetails(supplier.id)"
            >{{ supplier.name }}</a>
          </td>
          <td>{{ supplier.contactEmail }}</td>
          <td>{{ supplier.phone || '—' }}</td>
          <td>
            <div class="btn-row">
              <RouterLink
                :to="{ name: 'supplier-edit', params: { id: supplier.id } }"
                class="btn"
                :data-test="`supplier-edit-${supplier.id}`"
              >Edit</RouterLink>
              <button
                type="button"
                class="btn btn-danger"
                :data-test="`supplier-delete-${supplier.id}`"
                @click="confirmDelete(supplier)"
              >Delete</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="deleteTarget"
      class="modal-backdrop"
      data-test="delete-modal"
    >
      <div class="modal">
        <h2>Delete supplier?</h2>
        <p>
          This will permanently delete
          <strong data-test="delete-modal-name">{{ deleteTarget.name }}</strong>.
        </p>
        <div class="btn-row" style="justify-content:flex-end">
          <button
            type="button"
            class="btn"
            :disabled="deleting"
            data-test="delete-cancel"
            @click="cancelDelete"
          >Cancel</button>
          <button
            type="button"
            class="btn btn-danger"
            :disabled="deleting"
            data-test="delete-confirm"
            @click="performDelete"
          >
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
