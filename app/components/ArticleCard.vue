<script setup lang="ts">
interface Article {
  id: string
  title: string
  category: string
  heroImage: string
  excerpt: string
  createdAt: string
}

const props = defineProps<{
  article: Article
}>()

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(props.article.createdAt)),
)
</script>

<template>
  <article class="article-card">
    <NuxtLink class="article-image-link" :to="`/blog/${article.id}`">
      <img :src="article.heroImage" :alt="article.title" loading="lazy" decoding="async">
    </NuxtLink>

    <div class="article-card-body">
      <div class="article-meta">
        <span>{{ article.category }}</span>
        <time :datetime="article.createdAt">{{ formattedDate }}</time>
      </div>

      <h3>
        <NuxtLink :to="`/blog/${article.id}`">{{ article.title }}</NuxtLink>
      </h3>
      <p>{{ article.excerpt }}</p>
      <NuxtLink class="text-link" :to="`/blog/${article.id}`">閱讀文章</NuxtLink>
    </div>
  </article>
</template>
