// Simple mock for useUserSession composable
// This provides basic session functionality for the therapy guide app

export const useUserSession = () => {
  const session = ref<{
    user?: {
      login?: string
      name?: string
      id?: string
    }
  } | null>(null)

  const clear = () => {
    session.value = null
  }

  const setUser = (user: any) => {
    session.value = { user }
  }

  return {
    session: readonly(session),
    clear,
    setUser
  }
}