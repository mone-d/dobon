import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/lobby',
      name: 'lobby',
      component: () => import('@/views/Lobby.vue')
    },
    {
      path: '/room/:roomId',
      name: 'room',
      component: () => import('@/views/Room.vue')
    },
    {
      path: '/game/:gameId',
      name: 'game',
      component: () => import('@/views/Game.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue')
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: () => import('@/views/Statistics.vue')
    }
  ]
})

export default router
