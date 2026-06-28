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

const propertyCards = [
  {
    label: 'PROPERTY',
    title: 'Brisbane 哪些區域適合亞洲家庭？',
    text: '從學校、交通、生活機能與預算角度，整理適合家庭居住的區域。',
  },
  {
    label: 'FIRST HOME',
    title: '澳洲首次購屋完整攻略',
    text: '整理首購補助、貸款準備、頭期款與看房流程。',
  },
  {
    label: 'INVESTMENT',
    title: 'Logan 還值得投資嗎？',
    text: '用租金、成長性、交通與人口結構分析投資潛力。',
  },
]

const heroHighlights = ['Brisbane 區域判斷', '首次購屋流程', '學校與生活規劃']

const lifestyleGuides = [
  {
    title: '學校與學區',
    text: 'School catchment、私校、公校選擇。',
  },
  {
    title: '剛到澳洲',
    text: 'SIM 卡、銀行、交通、生活準備。',
  },
  {
    title: '住宿與 Airbnb',
    text: '短租、安家、投資型住宿內容。',
  },
  {
    title: '買房流程',
    text: '看房、貸款、合約、交屋。',
  },
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
    leadMessage.value = '已收到你的資料，Angela 會盡快與你聯繫。'
  } catch {
    leadStatus.value = 'error'
    leadMessage.value = '送出失敗，請確認三個欄位都已填寫。'
  }
}

useSeoMeta({
  title: '澳洲置產與生活指南',
  description: '幫助亞洲家庭在布里斯本更安心地買房、投資、安家與規劃澳洲生活。',
})
</script>

<template>
  <div>
    <a class="floating-contact" href="#contact">WhatsApp 諮詢</a>
    <SiteHeader />

    <main>
      <section class="hero">
        <div class="hero-content" v-reveal>
          <p class="eyebrow">Brisbane Property & Lifestyle</p>
          <h1>澳洲置產與生活指南</h1>
          <p>
            幫助亞洲家庭在布里斯本更安心地買房、投資、安家與規劃澳洲生活。
          </p>
          <div class="hero-highlights" aria-label="服務重點">
            <span v-for="item in heroHighlights" :key="item">{{ item }}</span>
          </div>
          <div class="actions">
            <NuxtLink class="btn primary" to="/blog">閱讀買房攻略</NuxtLink>
            <NuxtLink class="btn gold" to="#contact">免費初步諮詢</NuxtLink>
          </div>
        </div>

        <aside class="hero-card hero-panel" aria-label="Brisbane property overview" v-reveal="140">
          <p class="eyebrow">Angela's Focus</p>
          <b>不是只看房子，而是規劃一個澳洲生活。</b>
          <div class="hero-path">
            <div class="hero-path-item">
              <span>01</span>
              <div>
                <strong>Property</strong>
                <small>買房／投資</small>
              </div>
            </div>
            <div class="hero-path-item">
              <span>02</span>
              <div>
                <strong>Life</strong>
                <small>學校／生活</small>
              </div>
            </div>
            <div class="hero-path-item">
              <span>03</span>
              <div>
                <strong>Guide</strong>
                <small>中文顧問</small>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section id="property" class="section home-section" v-reveal>
        <div class="section-row home-section-row">
          <div class="section-copy">
            <p class="eyebrow">Property Guide</p>
            <h2>房產指南</h2>
            <p>
              從區域、學校、交通、預算與買房流程切入，幫你把澳洲置產拆成可以一步一步理解的決策。
            </p>
          </div>
          <NuxtLink class="btn outline" to="/blog">閱讀全部文章</NuxtLink>
        </div>

        <div class="property-feature-grid">
          <article
            v-for="(card, index) in propertyCards"
            :key="card.title"
            class="property-feature"
            v-reveal="index * 90"
          >
            <small>{{ card.label }}</small>
            <h3>{{ card.title }}</h3>
            <p>{{ card.text }}</p>
          </article>
        </div>
      </section>

      <section id="lifestyle" class="dark lifestyle-section" v-reveal>
        <div class="dark-inner">
          <p class="eyebrow">Lifestyle Guide</p>
          <h2>生活指南</h2>

          <div class="guide">
            <article
              v-for="(item, index) in lifestyleGuides"
              :key="item.title"
              v-reveal="index * 80"
            >
              <h3>{{ item.title }}</h3>
              <p>{{ item.text }}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="blog" class="section home-section" v-reveal>
        <div class="section-row">
          <div class="section-copy">
            <p class="eyebrow">Featured Articles</p>
            <h2>精選文章 Featured Articles</h2>
            <p>最新三篇文章會從資料庫自動更新。</p>
          </div>
          <NuxtLink class="btn outline" to="/blog">前往 Blog</NuxtLink>
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

      <section id="about" class="section split" v-reveal>
        <div class="portrait" />
        <div class="about-box">
          <p class="eyebrow">About Angela</p>
          <h2>關於 Angela</h2>
          <p>
            Angela 專注協助海外華人與亞洲家庭理解澳洲房地產、布里斯本區域、學校生活與移居流程。
          </p>
          <div class="chips">
            <span>布里斯本房產</span>
            <span>首次購屋</span>
            <span>投資區域</span>
            <span>澳洲生活</span>
            <span>學生家庭</span>
          </div>
        </div>
      </section>

      <section id="contact" class="section contact-section" v-reveal>
        <div class="lead-panel">
          <div>
            <p class="eyebrow">Free Download</p>
            <h2>免費下載 Brisbane 買房指南</h2>
            <p>留下聯絡方式，取得適合首次了解 Brisbane 房產與生活規劃的中文指南。</p>
          </div>

          <form class="form-card" @submit.prevent="submitLead">
            <input v-model="leadForm.name" type="text" name="name" autocomplete="name" placeholder="姓名 Name" aria-label="姓名 Name" required>
            <input v-model="leadForm.email" type="email" name="email" autocomplete="email" placeholder="Email" aria-label="Email" required>
            <input v-model="leadForm.messenger" type="text" name="messenger" autocomplete="tel" placeholder="WhatsApp / LINE" aria-label="WhatsApp / LINE" required>
            <button class="btn primary" type="submit" :disabled="leadStatus === 'loading'">
              {{ leadStatus === 'loading' ? '送出中...' : '送出索取指南' }}
            </button>
            <p v-if="leadMessage" class="form-message" :class="leadStatus">{{ leadMessage }}</p>
          </form>
        </div>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
