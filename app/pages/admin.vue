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
const activeTab = ref<'articles' | 'publish' | 'leads'>('articles')
const editor = ref<HTMLElement | null>(null)
const publishing = ref(false)
const publishError = ref('')
const articleMessage = ref('')
const articleListError = ref('')
const articles = ref<Article[]>([])
const loadingArticles = ref(false)
const deletingArticleId = ref<string | null>(null)
const editingArticleId = ref<string | null>(null)
const leads = ref<Lead[]>([])
const loadingLeads = ref(false)
const deletingLeadId = ref<string | null>(null)
const leadMessage = ref('')
const leadListError = ref('')
const isEditingArticle = computed(() => Boolean(editingArticleId.value))

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
    await Promise.all([loadArticles(), loadLeads()])
  } catch {
    unlocked.value = false

    if (showError) {
      loginError.value = '密碼不正確，請再試一次。'
    }
  }
}

async function loadArticles() {
  if (!unlocked.value) {
    return
  }

  loadingArticles.value = true
  articleListError.value = ''

  try {
    articles.value = await $fetch<Article[]>('/api/articles')
  } catch {
    articleListError.value = '文章列表載入失敗，請重新整理後再試一次。'
  } finally {
    loadingArticles.value = false
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

function resetArticleForm() {
  articleForm.title = ''
  articleForm.category = categories[0]
  articleForm.heroImage = ''
  articleForm.content = ''
  editingArticleId.value = null
  publishError.value = ''

  if (editor.value) {
    editor.value.innerHTML = ''
  }
}

async function startNewArticle() {
  articleMessage.value = ''
  activeTab.value = 'publish'
  await nextTick()
  resetArticleForm()
}

async function editArticle(article: Article) {
  articleMessage.value = ''
  publishError.value = ''
  editingArticleId.value = article.id
  articleForm.title = article.title
  articleForm.category = article.category
  articleForm.heroImage = article.heroImage
  articleForm.content = article.content
  activeTab.value = 'publish'
  await nextTick()

  if (editor.value) {
    editor.value.innerHTML = article.content
  }
}

async function publishArticle() {
  syncEditorContent()
  publishError.value = ''
  articleMessage.value = ''
  publishing.value = true
  const wasEditing = Boolean(editingArticleId.value)

  try {
    const savedArticle = editingArticleId.value
      ? await $fetch<Article>(`/api/articles/${editingArticleId.value}`, {
          method: 'PUT',
          headers: adminHeaders(),
          body: articleForm,
        })
      : await $fetch<Article>('/api/articles', {
          method: 'POST',
          headers: adminHeaders(),
          body: articleForm,
        })

    resetArticleForm()
    await loadArticles()
    activeTab.value = 'articles'
    articleMessage.value = wasEditing
      ? `已更新「${savedArticle.title}」。`
      : `已發布「${savedArticle.title}」，文章列表已更新。`
  } catch {
    publishError.value = wasEditing
      ? '儲存失敗，請確認標題、分類與內文都已填寫。'
      : '發布失敗，請確認標題、分類與內文都已填寫。'
  } finally {
    publishing.value = false
  }
}

async function deleteArticleItem(article: Article) {
  const firstConfirm = window.confirm(`確定要刪除「${article.title}」嗎？`)

  if (!firstConfirm) {
    return
  }

  const secondConfirm = window.confirm('再次確認：刪除後無法復原，仍要刪除這篇文章嗎？')

  if (!secondConfirm) {
    return
  }

  deletingArticleId.value = article.id
  articleMessage.value = ''
  articleListError.value = ''

  try {
    await $fetch(`/api/articles/${article.id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    })

    if (editingArticleId.value === article.id) {
      resetArticleForm()
    }

    await loadArticles()
    activeTab.value = 'articles'
    articleMessage.value = `已刪除「${article.title}」。`
  } catch {
    articleListError.value = '刪除失敗，請稍後再試一次。'
  } finally {
    deletingArticleId.value = null
  }
}

async function loadLeads() {
  if (!unlocked.value) {
    return
  }

  loadingLeads.value = true
  leadListError.value = ''

  try {
    leads.value = await $fetch<Lead[]>('/api/leads', {
      headers: adminHeaders(),
    })
  } catch {
    leadListError.value = '客戶名單載入失敗，請重新整理後再試一次。'
  } finally {
    loadingLeads.value = false
  }
}

async function deleteLeadItem(lead: Lead) {
  const firstConfirm = window.confirm(`確定要刪除「${lead.name}」的名單資料嗎？`)

  if (!firstConfirm) {
    return
  }

  const secondConfirm = window.confirm('再次確認：刪除後無法復原，仍要刪除這筆客戶名單嗎？')

  if (!secondConfirm) {
    return
  }

  deletingLeadId.value = lead.id
  leadMessage.value = ''
  leadListError.value = ''

  try {
    await $fetch(`/api/leads/${lead.id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    })

    await loadLeads()
    activeTab.value = 'leads'
    leadMessage.value = `已刪除「${lead.name}」的名單資料。`
  } catch {
    leadListError.value = '刪除失敗，請稍後再試一次。'
  } finally {
    deletingLeadId.value = null
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
            :class="{ active: activeTab === 'articles' }"
            type="button"
            @click="activeTab = 'articles'; loadArticles()"
          >
            文章列表
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'publish' }"
            type="button"
            @click="startNewArticle"
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

        <section v-if="activeTab === 'articles'" class="admin-panel">
          <div class="panel-heading panel-heading-row">
            <div>
              <h2>文章列表</h2>
              <p>先查看目前所有文章，再選擇查看、編輯或刪除。發布後也會留在這裡更新列表。</p>
            </div>
            <button class="btn primary" type="button" @click="startNewArticle">新增文章</button>
          </div>

          <p v-if="articleMessage" class="form-message success">{{ articleMessage }}</p>
          <p v-if="articleListError" class="form-message error">{{ articleListError }}</p>

          <div v-if="loadingArticles" class="empty-state">文章載入中...</div>
          <div v-else-if="!articles.length" class="empty-state">目前尚無文章，先新增第一篇吧。</div>
          <div v-else class="lead-table-wrap">
            <table class="lead-table article-table">
              <thead>
                <tr>
                  <th>文章</th>
                  <th>分類</th>
                  <th>建立時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="article in articles" :key="article.id">
                  <td class="article-table-title">
                    <strong>{{ article.title }}</strong>
                    <span>{{ article.excerpt }}</span>
                  </td>
                  <td>{{ article.category }}</td>
                  <td>{{ formatDate(article.createdAt) }}</td>
                  <td>
                    <div class="article-admin-actions">
                      <NuxtLink class="btn small outline" :to="`/blog/${article.id}`">查看</NuxtLink>
                      <button class="btn small gold" type="button" @click="editArticle(article)">
                        編輯
                      </button>
                      <button
                        class="btn small danger"
                        type="button"
                        :disabled="deletingArticleId === article.id"
                        @click="deleteArticleItem(article)"
                      >
                        {{ deletingArticleId === article.id ? '刪除中...' : '刪除' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-else-if="activeTab === 'publish'" class="admin-panel">
          <div class="panel-heading panel-heading-row">
            <div>
              <h2>{{ isEditingArticle ? '編輯文章' : '發布新文章' }}</h2>
              <p>
                {{
                  isEditingArticle
                    ? '修改後會留在後台並更新文章列表。'
                    : '填入標題、分類、主圖與內文，發布後會留在後台並更新文章列表。'
                }}
              </p>
            </div>
            <button class="btn outline" type="button" @click="activeTab = 'articles'; loadArticles()">
              返回列表
            </button>
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

            <div class="admin-inline-actions">
              <button class="btn primary" type="submit" :disabled="publishing">
                {{
                  publishing
                    ? isEditingArticle
                      ? '儲存中...'
                      : '發布中...'
                    : isEditingArticle
                      ? '儲存變更'
                      : '發布文章'
                }}
              </button>
              <button v-if="isEditingArticle" class="btn outline" type="button" @click="startNewArticle">
                取消編輯
              </button>
            </div>
            <p v-if="publishError" class="form-message error">{{ publishError }}</p>
          </form>
        </section>

        <section v-else class="admin-panel">
          <div class="panel-heading">
            <h2>免費下載買房指南名單</h2>
            <p>首頁底部表單送出的姓名、Email 與 LINE / WhatsApp 會出現在這裡。</p>
          </div>

          <p v-if="leadMessage" class="form-message success">{{ leadMessage }}</p>
          <p v-if="leadListError" class="form-message error">{{ leadListError }}</p>

          <div v-if="loadingLeads" class="empty-state">名單載入中...</div>
          <div v-else-if="!leads.length" class="empty-state">目前尚無客戶名單。</div>
          <div v-else class="lead-table-wrap">
            <table class="lead-table lead-management-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>Email</th>
                  <th>LINE / WhatsApp</th>
                  <th>送出時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lead in leads" :key="lead.id">
                  <td>{{ lead.name }}</td>
                  <td><a :href="`mailto:${lead.email}`">{{ lead.email }}</a></td>
                  <td>{{ lead.messenger }}</td>
                  <td>{{ formatDate(lead.createdAt) }}</td>
                  <td>
                    <button
                      class="btn small danger"
                      type="button"
                      :disabled="deletingLeadId === lead.id"
                      @click="deleteLeadItem(lead)"
                    >
                      {{ deletingLeadId === lead.id ? '刪除中...' : '刪除' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>
