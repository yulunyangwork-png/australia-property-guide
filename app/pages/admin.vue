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

const categories = ['市場解讀', '地區分析', '買房步驟', '生活方式']
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
      loginError.value = 'The password did not work. Please check it and try again.'
    }
  }
}

function logoutAdmin() {
  window.sessionStorage.removeItem('angela-admin-password')
  password.value = ''
  unlocked.value = false
  loginError.value = ''
  activeTab.value = 'articles'
  articleMessage.value = ''
  articleListError.value = ''
  leadMessage.value = ''
  leadListError.value = ''
  articles.value = []
  leads.value = []
  deletingArticleId.value = null
  deletingLeadId.value = null
  resetArticleForm()
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
    articleListError.value = 'Articles could not be loaded. Please refresh and try again.'
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
  const url = window.prompt('Paste the link URL')

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
      ? `"${savedArticle.title}" was updated.`
      : `"${savedArticle.title}" was published.`
  } catch {
    publishError.value = wasEditing
      ? 'The article could not be updated. Please check the fields and try again.'
      : 'The article could not be published. Please check the fields and try again.'
  } finally {
    publishing.value = false
  }
}

async function deleteArticleItem(article: Article) {
  const firstConfirm = window.confirm(`Delete "${article.title}"?`)

  if (!firstConfirm) {
    return
  }

  const secondConfirm = window.confirm('This cannot be undone. Delete this article permanently?')

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
    articleMessage.value = `"${article.title}" was deleted.`
  } catch {
    articleListError.value = 'The article could not be deleted. Please try again.'
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
    leadListError.value = 'Leads could not be loaded. Please refresh and try again.'
  } finally {
    loadingLeads.value = false
  }
}

async function deleteLeadItem(lead: Lead) {
  const firstConfirm = window.confirm(`Delete the lead for ${lead.name}?`)

  if (!firstConfirm) {
    return
  }

  const secondConfirm = window.confirm('This cannot be undone. Delete this lead permanently?')

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
    leadMessage.value = `${lead.name}'s lead was deleted.`
  } catch {
    leadListError.value = 'The lead could not be deleted. Please try again.'
  } finally {
    deletingLeadId.value = null
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-AU', {
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
          <h1>Angela content studio</h1>
          <p>Sign in to publish articles and review guide requests.</p>

          <form @submit.prevent="unlockAdmin()">
            <label>
              Password
              <input
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="Enter admin password"
                required
              >
            </label>
            <button class="btn primary" type="submit">Unlock admin</button>
            <p v-if="loginError" class="form-message error">{{ loginError }}</p>
          </form>

          <NuxtLink class="btn outline login-home-link" to="/">Back to site</NuxtLink>
        </div>
      </section>

      <section v-else class="admin-shell">
        <header class="admin-header">
          <div>
            <p class="eyebrow">Admin</p>
            <h1>Content dashboard</h1>
          </div>

          <div class="admin-header-actions">
            <NuxtLink class="btn outline" to="/">Back to site</NuxtLink>
            <button class="btn logout" type="button" @click="logoutAdmin">Log out</button>
          </div>
        </header>

        <div class="admin-tabs">
          <button
            class="tab-button"
            :class="{ active: activeTab === 'articles' }"
            type="button"
            @click="activeTab = 'articles'; loadArticles()"
          >
            Articles
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'publish' }"
            type="button"
            @click="startNewArticle"
          >
            Write
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'leads' }"
            type="button"
            @click="activeTab = 'leads'; loadLeads()"
          >
            Leads
          </button>
        </div>

        <section v-if="activeTab === 'articles'" class="admin-panel">
          <div class="panel-heading panel-heading-row">
            <div>
              <h2>Published articles</h2>
              <p>Review, edit, or remove public articles from the Brisbane guide.</p>
            </div>
            <button class="btn primary" type="button" @click="startNewArticle">New article</button>
          </div>

          <p v-if="articleMessage" class="form-message success">{{ articleMessage }}</p>
          <p v-if="articleListError" class="form-message error">{{ articleListError }}</p>

          <div v-if="loadingArticles" class="empty-state">Loading articles...</div>
          <div v-else-if="!articles.length" class="empty-state">No articles yet.</div>
          <div v-else class="lead-table-wrap">
            <table class="lead-table article-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Created</th>
                  <th>Actions</th>
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
                      <NuxtLink class="btn small outline" :to="`/blog/${article.id}`">View</NuxtLink>
                      <button class="btn small gold" type="button" @click="editArticle(article)">
                        Edit
                      </button>
                      <button
                        class="btn small danger"
                        type="button"
                        :disabled="deletingArticleId === article.id"
                        @click="deleteArticleItem(article)"
                      >
                        {{ deletingArticleId === article.id ? 'Deleting...' : 'Delete' }}
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
              <h2>{{ isEditingArticle ? 'Edit article' : 'Write article' }}</h2>
              <p>
                {{
                  isEditingArticle
                    ? 'Update the article and save your changes.'
                    : 'Draft a practical guide with a clear title, category, image, and body copy.'
                }}
              </p>
            </div>
            <button class="btn outline" type="button" @click="activeTab = 'articles'; loadArticles()">
              Back to articles
            </button>
          </div>

          <form class="publish-form" @submit.prevent="publishArticle">
            <label>
              Title
              <input
                v-model="articleForm.title"
                type="text"
                placeholder="Example: How to compare Brisbane school catchments"
                required
              >
            </label>

            <label>
              Category
              <select v-model="articleForm.category" required>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </label>

            <label>
              Hero image URL
              <input
                v-model="articleForm.heroImage"
                type="text"
                placeholder="/images/brisbane-property-hero.png or https://images.unsplash.com/..."
              >
            </label>

            <label>
              Article body
              <div class="editor-shell">
                <div class="editor-toolbar" aria-label="Article formatting tools">
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
                  data-placeholder="Write the guide content here..."
                  @input="syncEditorContent"
                  @blur="syncEditorContent"
                />
              </div>
            </label>

            <div v-if="articleForm.heroImage" class="image-preview">
              <img :src="articleForm.heroImage" alt="Article hero preview">
            </div>

            <div class="admin-inline-actions">
              <button class="btn primary" type="submit" :disabled="publishing">
                {{
                  publishing
                    ? isEditingArticle
                      ? 'Updating...'
                      : 'Publishing...'
                    : isEditingArticle
                      ? 'Save changes'
                      : 'Publish article'
                }}
              </button>
              <button v-if="isEditingArticle" class="btn outline" type="button" @click="startNewArticle">
                Start new article
              </button>
            </div>
            <p v-if="publishError" class="form-message error">{{ publishError }}</p>
          </form>
        </section>

        <section v-else class="admin-panel">
          <div class="panel-heading">
            <h2>Guide requests</h2>
            <p>Review the people who requested the Brisbane planning guide.</p>
          </div>

          <p v-if="leadMessage" class="form-message success">{{ leadMessage }}</p>
          <p v-if="leadListError" class="form-message error">{{ leadListError }}</p>

          <div v-if="loadingLeads" class="empty-state">Loading leads...</div>
          <div v-else-if="!leads.length" class="empty-state">No leads yet.</div>
          <div v-else class="lead-table-wrap">
            <table class="lead-table lead-management-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>LINE / WhatsApp</th>
                  <th>Created</th>
                  <th>Actions</th>
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
                      {{ deletingLeadId === lead.id ? 'Deleting...' : 'Delete' }}
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
