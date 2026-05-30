<script setup lang="ts">
interface Article {
  id: string
  title: string
  category: string
  heroImage: string
  content: string
}

interface Lead {
  id: string
  name: string
  email: string
  messenger: string
  createdAt: string
}

const categories = ['布里斯本房產', '首次購屋', '投資區域', '澳洲生活']
const password = ref('')
const unlocked = ref(false)
const loginError = ref('')
const activeTab = ref<'publish' | 'leads'>('publish')
const editor = ref<HTMLElement | null>(null)
const publishing = ref(false)
const publishError = ref('')
const leads = ref<Lead[]>([])
const loadingLeads = ref(false)

const articleForm = reactive({
  title: '',
  category: categories[0],
  heroImage: '',
  content: '',
})

onMounted(async () => {
  const storedPassword = window.sessionStorage.getItem('angela-admin-password')

  if (storedPassword) {
    password.value = storedPassword
    await unlockAdmin(false)
  }
})

function adminHeaders() {
  return {
    'x-admin-password': password.value,
  }
}

async function unlockAdmin(showError = true) {
  loginError.value = ''

  try {
    await $fetch('/api/admin/verify', {
      method: 'POST',
      headers: adminHeaders(),
    })

    unlocked.value = true
    window.sessionStorage.setItem('angela-admin-password', password.value)
    await loadLeads()
  } catch {
    unlocked.value = false

    if (showError) {
      loginError.value = '密碼不正確，請再試一次。'
    }
  }
}

function syncEditorContent() {
  articleForm.content = editor.value?.innerHTML || ''
}

function runCommand(command: string, value?: string) {
  editor.value?.focus()
  document.execCommand(command, false, value)
  syncEditorContent()
}

function setBlock(tag: 'p' | 'h2' | 'h3' | 'blockquote') {
  runCommand('formatBlock', tag)
}

function addLink() {
  const url = window.prompt('貼上連結 URL')

  if (url) {
    runCommand('createLink', url)
  }
}

async function publishArticle() {
  syncEditorContent()
  publishError.value = ''
  publishing.value = true

  try {
    await $fetch<Article>('/api/articles', {
      method: 'POST',
      headers: adminHeaders(),
      body: articleForm,
    })

    articleForm.title = ''
    articleForm.category = categories[0]
    articleForm.heroImage = ''
    articleForm.content = ''

    if (editor.value) {
      editor.value.innerHTML = ''
    }

    await navigateTo('/')
  } catch {
    publishError.value = '發布失敗，請確認標題、分類與內文都已填寫。'
  } finally {
    publishing.value = false
  }
}

async function loadLeads() {
  if (!unlocked.value) {
    return
  }

  loadingLeads.value = true

  try {
    leads.value = await $fetch<Lead[]>('/api/leads', {
      headers: adminHeaders(),
    })
  } finally {
    loadingLeads.value = false
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

useSeoMeta({
  title: 'Admin',
  robots: 'noindex,nofollow',
})
</script>

<template>
  <div>
    <main class="admin-page">
      <section v-if="!unlocked" class="admin-login">
        <div class="login-card">
          <p class="eyebrow">Private Admin</p>
          <h1>Angela Blog 後台</h1>
          <p>請輸入管理員密碼以發布文章與查看客戶名單。</p>

          <form @submit.prevent="unlockAdmin()">
            <label>
              管理員密碼
              <input
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="Angela2026"
                required
              >
            </label>
            <button class="btn primary" type="submit">解鎖後台</button>
            <p v-if="loginError" class="form-message error">{{ loginError }}</p>
          </form>
        </div>
      </section>

      <section v-else class="admin-shell">
        <header class="admin-header">
          <div>
            <p class="eyebrow">Admin</p>
            <h1>內容管理後台</h1>
          </div>

          <NuxtLink class="btn outline" to="/">回到首頁</NuxtLink>
        </header>

        <div class="admin-tabs">
          <button
            class="tab-button"
            :class="{ active: activeTab === 'publish' }"
            type="button"
            @click="activeTab = 'publish'"
          >
            發布新文章
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'leads' }"
            type="button"
            @click="activeTab = 'leads'; loadLeads()"
          >
            客戶名單
          </button>
        </div>

        <section v-if="activeTab === 'publish'" class="admin-panel">
          <div class="panel-heading">
            <h2>發布新文章</h2>
            <p>填入標題、分類、主圖與內文，發布後會自動回到首頁並顯示在最新文章中。</p>
          </div>

          <form class="publish-form" @submit.prevent="publishArticle">
            <label>
              文章標題
              <input v-model="articleForm.title" type="text" placeholder="例如：第一次在 Brisbane 買房要注意什麼？" required>
            </label>

            <label>
              文章分類
              <select v-model="articleForm.category" required>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </label>

            <label>
              主圖 URL
              <input
                v-model="articleForm.heroImage"
                type="url"
                placeholder="https://images.unsplash.com/..."
              >
            </label>

            <label>
              文章內文
              <div class="editor-shell">
                <div class="editor-toolbar" aria-label="富文本工具列">
                  <button type="button" @click="setBlock('p')">P</button>
                  <button type="button" @click="setBlock('h2')">H2</button>
                  <button type="button" @click="runCommand('bold')"><b>B</b></button>
                  <button type="button" @click="runCommand('italic')"><i>I</i></button>
                  <button type="button" @click="runCommand('insertUnorderedList')">UL</button>
                  <button type="button" @click="addLink">Link</button>
                </div>
                <div
                  ref="editor"
                  class="rich-editor"
                  contenteditable="true"
                  data-placeholder="在這裡撰寫文章內容，可斷行、加粗、加入列表與連結..."
                  @input="syncEditorContent"
                  @blur="syncEditorContent"
                />
              </div>
            </label>

            <div v-if="articleForm.heroImage" class="image-preview">
              <img :src="articleForm.heroImage" alt="文章主圖預覽">
            </div>

            <button class="btn primary" type="submit" :disabled="publishing">
              {{ publishing ? '發布中...' : '發布文章' }}
            </button>
            <p v-if="publishError" class="form-message error">{{ publishError }}</p>
          </form>
        </section>

        <section v-else class="admin-panel">
          <div class="panel-heading">
            <h2>免費下載買房指南名單</h2>
            <p>首頁底部表單送出的姓名、Email 與 LINE / WhatsApp 會出現在這裡。</p>
          </div>

          <div v-if="loadingLeads" class="empty-state">名單載入中...</div>
          <div v-else-if="!leads.length" class="empty-state">目前尚無客戶名單。</div>
          <div v-else class="lead-table-wrap">
            <table class="lead-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>Email</th>
                  <th>LINE / WhatsApp</th>
                  <th>送出時間</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lead in leads" :key="lead.id">
                  <td>{{ lead.name }}</td>
                  <td><a :href="`mailto:${lead.email}`">{{ lead.email }}</a></td>
                  <td>{{ lead.messenger }}</td>
                  <td>{{ formatDate(lead.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>
