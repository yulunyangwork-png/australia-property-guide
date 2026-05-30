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
    statusMessage: '找不到這篇文章',
  })
}

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.value.createdAt)),
)

useSeoMeta({
  title: () => article.value?.title || 'Blog',
  description: () => article.value?.excerpt || 'Angela Liao 的 Brisbane 房產文章。',
  ogImage: () => article.value?.heroImage,
})
</script>

<template>
  <div>
    <SiteHeader />

    <main>
      <article class="article-page">
        <header class="article-header">
          <NuxtLink class="text-link" to="/blog">返回 Blog</NuxtLink>
          <p class="eyebrow">{{ article.category }}</p>
          <h1>{{ article.title }}</h1>
          <time :datetime="article.createdAt">{{ formattedDate }}</time>
        </header>

        <img class="article-hero-image" :src="article.heroImage" :alt="article.title">

        <div class="article-content" v-html="article.content" />
      </article>
    </main>

    <SiteFooter />
  </div>
</template>
