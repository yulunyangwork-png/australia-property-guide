<script setup lang="ts">
const navItems = [
  { label: '澳洲買房', to: '/#property' },
  { label: '澳洲生活', to: '/#lifestyle' },
  { label: 'Blog', to: '/blog' },
  { label: '關於我', to: '/#about' },
]
</script>

<template>
  <header class="top">
    <nav class="nav" aria-label="主要導覽">
      <NuxtLink class="brand" to="/" aria-label="Angela Liao 首頁">
        Angela <span>Liao</span>
      </NuxtLink>

      <div class="links">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to">
          {{ item.label }}
        </NuxtLink>
      </div>

      <NuxtLink class="cta" to="/#contact">預約諮詢</NuxtLink>
    </nav>
  </header>
</template>
