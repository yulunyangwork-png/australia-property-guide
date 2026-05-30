<script setup lang="ts">
interface Article {
  id: string
  title: string
  category: string
  heroImage: string
  excerpt: string
  createdAt: string
}

const categories = ['全部文章', '布里斯本房產', '首次購屋', '投資區域', '澳洲生活']
const selectedCategory = ref('全部文章')

const { data: articles } = await useFetch<Article[]>('/api/articles', {
  default: () => [],
})

const filteredArticles = computed(() => {
  if (selectedCategory.value === '全部文章') {
    return articles.value
  }

  return articles.value.filter((article) => article.category === selectedCategory.value)
})

useSeoMeta({
  title: 'Blog',
  description: 'Angela Liao 的 Brisbane 買房、投資與澳洲生活文章列表。',
})
</script>

<template>
  <div>
    <SiteHeader />

    <main>
      <section class="page-hero compact-hero">
        <p class="eyebrow">Blog</p>
        <h1>Brisbane 買房攻略與生活文章</h1>
        <p>所有後台發布的文章都會集中在這裡，方便客戶閱讀、分享與回訪。</p>
      </section>

      <section class="section">
        <div class="filter-bar" aria-label="文章分類">
          <button
            v-for="category in categories"
            :key="category"
            class="filter-pill"
            :class="{ active: selectedCategory === category }"
            type="button"
            @click="selectedCategory = category"
          >
            {{ category }}
          </button>
        </div>

        <div v-if="filteredArticles.length" class="article-grid">
          <ArticleCard
            v-for="article in filteredArticles"
            :key="article.id"
            :article="article"
          />
        </div>
        <div v-else class="empty-state">目前沒有這個分類的文章。</div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
