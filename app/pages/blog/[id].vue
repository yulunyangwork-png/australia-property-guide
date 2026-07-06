<script setup lang="ts">
interface Article {
  id: string
  title: string
  category: string
  heroImage: string
  excerpt: string
  content: string
  createdAt: string
}

const route = useRoute()
const { data: article, error } = await useFetch<Article>(`/api/articles/${route.params.id}`)

if (error.value || !article.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Article not found',
  })
}

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.value.createdAt)),
)

const heroSrc = computed(() => article.value?.heroImage || '/images/brisbane-property-hero.png')

useSeoMeta({
  title: () => article.value?.title || 'Articles',
  description: () => article.value?.excerpt || '布里斯班房產與生活指南。',
  ogImage: () => heroSrc.value,
})
</script>

<template>
  <div>
    <SiteHeader />

    <main>
      <article class="article-page">
        <header class="article-header">
          <NuxtLink class="text-link" to="/blog">返回文章列表</NuxtLink>
          <p class="eyebrow">{{ article.category }}</p>
          <h1>{{ article.title }}</h1>
          <time :datetime="article.createdAt">{{ formattedDate }}</time>
        </header>

        <img class="article-hero-image" :src="heroSrc" :alt="article.title">

        <div class="article-content" v-html="article.content" />
      </article>
    </main>

    <SiteFooter />
  </div>
</template>
