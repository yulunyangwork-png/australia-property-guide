<script setup lang="ts">
interface Article {
  id: string
  title: string
  category: string
  heroImage: string
  excerpt: string
  createdAt: string
}

const categories = ['全部', '市場解讀', '地區分析', '買房步驟', '生活方式']
const selectedCategory = ref('全部')

const { data: articles } = await useFetch<Article[]>('/api/articles', {
  default: () => [],
})

const filteredArticles = computed(() => {
  if (selectedCategory.value === '全部') {
    return articles.value
  }

  return articles.value.filter((article) => article.category === selectedCategory.value)
})

useSeoMeta({
  title: '房產指南',
  description:
    'Angela Liao 的布里斯班房產、地區、買房流程與生活方式指南。',
})
</script>

<template>
  <div>
    <SiteHeader />

    <main>
      <section class="page-hero compact-hero">
        <p class="eyebrow">房產指南</p>
        <h1>布里斯班房產與生活筆記。</h1>
        <p>
          從市場趨勢、區域比較到買房流程與安家生活，幫助您做出更安心的決策。
        </p>
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
        <div v-else class="empty-state">這個分類目前尚無文章。</div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
