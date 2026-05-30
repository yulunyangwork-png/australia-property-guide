<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: 'zh-Hant',
  },
  titleTemplate: (title) =>
    title ? `${title} | Angela Liao` : 'Angela Liao | Brisbane Property & Lifestyle',
  meta: [
    {
      name: 'description',
      content:
        'Angela Liao Brisbane Property & Lifestyle 提供中文買房、投資與安家指南，協助你理解布里斯本房產與生活。',
    },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&family=Playfair+Display:wght@500;700&display=swap',
    },
  ],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>
