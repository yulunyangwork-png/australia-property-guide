export default defineNuxtPlugin((nuxtApp) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  document.documentElement.classList.add('reveal-ready')

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return
        }

        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    },
    {
      rootMargin: '0px 0px -70px 0px',
      threshold: 0.14,
    },
  )

  nuxtApp.vueApp.directive<HTMLElement, number | undefined>('reveal', {
    mounted(el, binding) {
      el.classList.add('reveal-on-scroll')

      if (typeof binding.value === 'number') {
        el.style.setProperty('--reveal-delay', `${binding.value}ms`)
      }

      if (prefersReducedMotion) {
        el.classList.add('is-visible')
        return
      }

      observer.observe(el)
    },
    unmounted(el) {
      observer.unobserve(el)
    },
  })
})
