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
        'Angela Liao 為華人買家與新移民提供布里斯班房產、地區與生活方式指南。',
    },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;600;700&family=Noto+Sans+TC:wght@400;500;700;900&display=swap',
    },
  ],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>
