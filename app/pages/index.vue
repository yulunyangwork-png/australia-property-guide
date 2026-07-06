<script setup lang="ts">
interface Article {
  id: string
  title: string
  category: string
  heroImage: string
  excerpt: string
  createdAt: string
}

const { data: featuredArticles, pending: articlesPending } = await useFetch<Article[]>(
  '/api/articles',
  {
    query: { limit: 3 },
    default: () => [],
  },
)

const trustItems = [
  { icon: '人', title: '華人視角，專業建議', text: '10+ 年市場與客戶經驗' },
  { icon: '家', title: '獨立中立，客觀分析', text: '不急賣，只為您的決策服務' },
  { icon: '盾', title: '流程清晰，降低風險', text: '從選區到交屋全程支持' },
  { icon: '葉', title: '安家無憂，生活融入', text: '教育、醫療、社區資源一站式指南' },
]

const insightCards = [
  {
    category: '市場解讀',
    title: '2024 布里斯班房地產市場趨勢與機會',
    text: '利率、供應與人口增長如何影響未來的房價走勢。',
    image: '/images/brisbane-river-hero-concept.png',
  },
  {
    category: '地區分析',
    title: '熱門區域深度對比：內城 vs 東南 vs 西區',
    text: '學區、交通、生活配套與增值潛力全面對比。',
    image: '/images/brisbane-property-hero.png',
  },
  {
    category: '買房步驟',
    title: '首次置業完整流程：一步一步不踩坑',
    text: '從貸款預批到交割入住，關鍵步驟與注意事項。',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80',
  },
]

const lifestyleGuides = [
  {
    icon: '學',
    title: '教育與學校',
    text: '公立、私立與國際學校選擇，學區房洞察。',
    image: '/images/brisbane-river-hero-concept.png',
  },
  {
    icon: '咖',
    title: '生活與休閒',
    text: '咖啡、美食、購物與週末去處，發現布里斯班的美好日常。',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    icon: '心',
    title: '醫療與健康',
    text: '醫療資源、保險與長照指南，守護您和家人的健康。',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    icon: '車',
    title: '交通與出行',
    text: '公共交通、駕照指南與通勤區域全面解析。',
    image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80',
  },
]

const consultPoints = [
  { icon: '群', title: '一對一深度溝通', text: '了解您的需求與目標' },
  { icon: '圖', title: '量身定制方案', text: '基於預算與地點的建議' },
  { icon: '檔', title: '全程陪伴支持', text: '從決策到落地的每一步' },
]

const leadForm = reactive({
  name: '',
  email: '',
  messenger: '',
})

const leadStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const leadMessage = ref('')

async function submitLead() {
  leadStatus.value = 'loading'
  leadMessage.value = ''

  try {
    await $fetch('/api/leads', {
      method: 'POST',
      body: leadForm,
    })

    leadForm.name = ''
    leadForm.email = ''
    leadForm.messenger = ''
    leadStatus.value = 'success'
    leadMessage.value = '謝謝您，Angela 會盡快與您聯繫。'
  } catch {
    leadStatus.value = 'error'
    leadMessage.value = '送出失敗，請稍後再試或直接聯繫 Angela。'
  }
}

useSeoMeta({
  title: '布里斯班房產與生活指南',
  description:
    '為華人買家與新移民提供專業、透明、實用的布里斯班房產與生活指南。',
})
</script>

<template>
  <div>
    <SiteHeader />

    <main>
      <section class="hero">
        <div class="hero-content" v-reveal>
          <h1>Property clarity for your next Brisbane move</h1>
          <p>
            為華人買家與新移民，提供專業、透明、實用的布里斯班房產與生活指南。
          </p>

          <div class="actions">
            <NuxtLink class="btn primary" to="/blog">Explore Guides</NuxtLink>
            <NuxtLink class="btn terracotta" to="#contact">Book a Consult</NuxtLink>
          </div>
        </div>
      </section>

      <section class="trust-strip" aria-label="服務特色" v-reveal>
        <article v-for="item in trustItems" :key="item.title">
          <span>{{ item.icon }}</span>
          <div>
            <strong>{{ item.title }}</strong>
            <small>{{ item.text }}</small>
          </div>
        </article>
      </section>

      <section id="property" class="section insight-section" v-reveal>
        <div class="section-intro">
          <p class="eyebrow">布里斯班房產洞察</p>
          <h2>布里斯班<br>房產洞察</h2>
          <p>深入的市場解讀與地區分析，幫助您在對的時間，做對的選擇。</p>
          <NuxtLink class="btn outline" to="/blog">查看全部指南</NuxtLink>
        </div>

        <div class="insight-grid">
          <article
            v-for="(card, index) in insightCards"
            :key="card.title"
            class="insight-card"
            v-reveal="index * 90"
          >
            <div class="insight-image">
              <img :src="card.image" :alt="card.title" loading="lazy" decoding="async">
              <span>{{ card.category }}</span>
            </div>
            <div class="insight-body">
              <h3>{{ card.title }}</h3>
              <p>{{ card.text }}</p>
              <NuxtLink class="arrow-link" to="/blog">閱讀指南</NuxtLink>
            </div>
          </article>
        </div>
      </section>

      <section id="lifestyle" class="section lifestyle-guide" v-reveal>
        <div class="section-intro">
          <p class="eyebrow">生活方式指南</p>
          <h2>生活方式指南</h2>
          <p>落地布里斯班，不只是買房，更是開啟理想生活。</p>
          <NuxtLink class="btn outline" to="/blog">探索生活指南</NuxtLink>
        </div>

        <div class="lifestyle-grid">
          <article
            v-for="(item, index) in lifestyleGuides"
            :key="item.title"
            v-reveal="index * 80"
          >
            <img :src="item.image" :alt="item.title" loading="lazy" decoding="async">
            <span>{{ item.icon }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
            <NuxtLink class="arrow-link" to="/blog">了解更多</NuxtLink>
          </article>
        </div>
      </section>

      <section id="blog" class="section article-section" v-reveal>
        <div class="section-row">
          <div>
            <p class="eyebrow">最新文章</p>
            <h2>最新房產與生活筆記</h2>
          </div>
          <NuxtLink class="btn outline" to="/blog">查看全部</NuxtLink>
        </div>

        <div v-if="articlesPending" class="empty-state">文章載入中...</div>
        <div v-else-if="!featuredArticles?.length" class="empty-state">目前尚無文章。</div>
        <div v-else class="article-grid">
          <ArticleCard
            v-for="(article, index) in featuredArticles"
            :key="article.id"
            :article="article"
            v-reveal="index * 90"
          />
        </div>
      </section>

      <section id="contact" class="consult-section" v-reveal>
        <div class="consult-copy">
          <p class="eyebrow">個性化建議</p>
          <h2>個性化建議，助您安心決策</h2>
          <p>
            無論您是自住、投資或規劃未來，我都能為您提供清晰、可靠的建議。
            預約一次諮詢，聊聊您的目標與計劃。
          </p>

          <div class="consult-points">
            <article v-for="item in consultPoints" :key="item.title">
              <span>{{ item.icon }}</span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.text }}</small>
            </article>
          </div>
        </div>

        <form class="consult-form" @submit.prevent="submitLead">
          <h3>預約諮詢</h3>
          <label>
            您的姓名
            <input v-model="leadForm.name" type="text" name="name" autocomplete="name" required>
          </label>
          <label>
            您的郵箱
            <input v-model="leadForm.email" type="email" name="email" autocomplete="email" required>
          </label>
          <label>
            您的微信 / LINE / WhatsApp
            <input v-model="leadForm.messenger" type="text" name="messenger" autocomplete="tel" required>
          </label>
          <button class="btn terracotta" type="submit" :disabled="leadStatus === 'loading'">
            {{ leadStatus === 'loading' ? '送出中...' : 'Book a Consult' }}
          </button>
          <p v-if="leadMessage" class="form-message" :class="leadStatus">{{ leadMessage }}</p>
        </form>

        <img
          class="consult-portrait"
          src="/images/angela-consult-portrait.png"
          alt="Angela Liao"
          loading="lazy"
          decoding="async"
        >
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
