// renderer/router.js
import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '../views/home/index.vue';
import php from '../views/php/index.vue';
import nginx from '../views/nginx/index.vue';
import About from '../views/about/index.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/php', component: php },
  { path: '/nginx', component: nginx },
  { path: '/about', component: About }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
