<script setup lang="ts">
const navItems = [
  { label: '首頁', to: '/' },
  { label: '買房指南', to: '/#property' },
  { label: '地區解讀', to: '/blog' },
  { label: '生活方式', to: '/#lifestyle' },
  { label: '資源工具', to: '/blog' },
  { label: '關於我', to: '/#contact' },
  { label: '聯繫我們', to: '/#contact' },
]
</script>

<template>
  <header class="top">
    <nav class="nav" aria-label="主要導覽">
      <NuxtLink class="brand" to="/" aria-label="Angela Liao 首頁">
        <strong>Angela Liao</strong>
        <span>Brisbane Property & Lifestyle</span>
      </NuxtLink>

      <div class="links">
        <NuxtLink v-for="item in navItems" :key="item.label" :to="item.to">
          {{ item.label }}
        </NuxtLink>
      </div>

      <NuxtLink class="cta" to="/#contact">▣ Book a Consult</NuxtLink>
    </nav>
  </header>
</template>
