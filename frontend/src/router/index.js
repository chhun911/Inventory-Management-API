import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/suppliers',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/suppliers',
    name: 'suppliers',
    component: () => import('../views/SuppliersListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/suppliers/new',
    name: 'supplier-new',
    component: () => import('../views/SupplierCreateView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/suppliers/:id',
    name: 'supplier-details',
    component: () => import('../views/SupplierDetailsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/suppliers/:id/edit',
    name: 'supplier-edit',
    component: () => import('../views/SupplierEditView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'suppliers' };
  }
});

export default router;
