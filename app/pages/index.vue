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
        <div v-reveal>
          <p class="eyebrow">Brisbane Property & Lifestyle</p>
          <h1>澳洲置產與生活指南</h1>
          <p>
            幫助亞洲家庭在布里斯本更安心地買房、投資、安家與規劃澳洲生活。
          </p>
          <div class="actions">
            <NuxtLink class="btn primary" to="/blog">閱讀買房攻略</NuxtLink>
            <NuxtLink class="btn gold" to="#contact">免費初步諮詢</NuxtLink>
          </div>
        </div>

        <div class="hero-card" aria-label="Brisbane property overview" v-reveal="140">
          <div class="sky" />
          <div class="glass">
            <b>不是只看房子，而是規劃一個澳洲生活。</b>
            <div class="stats">
              <div class="stat">
                <strong>Property</strong>
                買房／投資
              </div>
              <div class="stat">
                <strong>Life</strong>
                學校／生活
              </div>
              <div class="stat">
                <strong>Guide</strong>
                中文顧問
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="property" class="section" v-reveal>
        <div class="section-copy">
          <p class="eyebrow">Property</p>
          <h2>澳洲買房</h2>
          <p>
            從學校、交通、生活機能與預算角度，整理適合家庭居住的區域。
          </p>
        </div>

        <div class="grid3">
          <article
            v-for="(card, index) in propertyCards"
            :key="card.title"
            class="card"
            v-reveal="index * 90"
          >
            <small>{{ card.label }}</small>
            <h3>{{ card.title }}</h3>
            <p>{{ card.text }}</p>
          </article>
        </div>
      </section>

      <section id="lifestyle" class="dark" v-reveal>
        <div class="dark-inner">
          <p class="eyebrow">Lifestyle Guide</p>
          <h2>把房地產放進真實生活裡。</h2>
          <p>
            SIM 卡、接機、住宿、學校、租屋、生活指南都可以作為 Blog 子分類，不讓首頁過度複雜。
          </p>

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

      <section id="blog" class="section" v-reveal>
        <div class="section-row">
          <div class="section-copy">
            <p class="eyebrow">Featured Articles</p>
            <h2>精選文章 Featured Articles</h2>
          </div>
        </div>

        <div v-if="articlesPending" class="empty-state">文章載入中...</div>
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
          <h2>懂中文客戶，也懂澳洲在地市場。</h2>
          <p>
            Angela 專注協助海外華人與亞洲家庭理解澳洲房地產、布里斯本區域、學校生活與移居流程。網站將以 Blog 建立長期信任，讓客戶在聯絡前已經感受到專業度。
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

      <section id="contact" class="section" v-reveal>
        <div class="lead-panel">
          <div>
            <p class="eyebrow">Free Download</p>
            <h2>免費下載 Brisbane 買房指南</h2>
            <p>
              用免費 PDF 收集潛在客戶名單，再導入 WhatsApp / LINE 後續跟進。
            </p>
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
