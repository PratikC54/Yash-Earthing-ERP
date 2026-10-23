import { useState, useEffect } from 'react'
import authService from './authService'
import { AuthContext } from './authContextDef'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('yash_auth_user') || sessionStorage.getItem('yash_auth_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => {
    return localStorage.getItem('yash_auth_token') || sessionStorage.getItem('yash_auth_token') || null
  })

  const [pendingUser, setPendingUser] = useState(() => {
    try {
      const stored = localStorage.getItem('yash_pending_registration') || sessionStorage.getItem('yash_pending_registration')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [loading, setLoading] = useState(true)

  // Verify session on initial load if token exists
  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      if (!token) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        const res = await authService.getMe()
        if (isMounted && res.success && res.data?.user) {
          setUser(res.data.user)
          if (localStorage.getItem('yash_auth_token')) {
            localStorage.setItem('yash_auth_user', JSON.stringify(res.data.user))
          } else {
            sessionStorage.setItem('yash_auth_user', JSON.stringify(res.data.user))
          }
        }
      } catch {
        if (isMounted) {
          localStorage.removeItem('yash_auth_token')
          localStorage.removeItem('yash_auth_user')
          sessionStorage.removeItem('yash_auth_token')
          sessionStorage.removeItem('yash_auth_user')
          setToken(null)
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [token])

  const login = async (email, password, remember = true) => {
    const res = await authService.login(email, password)
    if (res.data?.isPending) {
      const pendingData = {
        name: res.data.user?.name || 'Registered User',
        email: res.data.user?.email || email,
        department: res.data.user?.department || 'Sales',
        role: res.data.user?.role || 'User',
        requestedAt: new Date().toISOString(),
      }
      setPendingUser(pendingData)
      if (remember) {
        localStorage.setItem('yash_pending_registration', JSON.stringify(pendingData))
        sessionStorage.removeItem('yash_pending_registration')
      } else {
        sessionStorage.setItem('yash_pending_registration', JSON.stringify(pendingData))
        localStorage.removeItem('yash_pending_registration')
      }
      return { isPending: true, data: pendingData }
    }

    if (res.data?.token) {
      setToken(res.data.token)
      setUser(res.data.user)
      if (remember) {
        localStorage.setItem('yash_auth_token', res.data.token)
        localStorage.setItem('yash_auth_user', JSON.stringify(res.data.user))
        sessionStorage.removeItem('yash_auth_token')
        sessionStorage.removeItem('yash_auth_user')
      } else {
        sessionStorage.setItem('yash_auth_token', res.data.token)
        sessionStorage.setItem('yash_auth_user', JSON.stringify(res.data.user))
        localStorage.removeItem('yash_auth_token')
        localStorage.removeItem('yash_auth_user')
      }
      clearPendingUser()
      return { isPending: false, data: res.data.user }
    }

    return { isPending: false, data: res.data }
  }

  const register = async (formData) => {
    const res = await authService.register(formData)
    const pendingData = {
      name: res.data?.user?.name || formData.name,
      email: res.data?.user?.email || formData.email,
      department: res.data?.user?.department || formData.department,
      designation: res.data?.user?.designation || formData.designation,
      requestedAt: new Date().toISOString(),
    }
    setPendingUser(pendingData)
    localStorage.setItem('yash_pending_registration', JSON.stringify(pendingData))
    return { isPending: true, data: pendingData }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('yash_auth_token')
      localStorage.removeItem('yash_auth_user')
      sessionStorage.removeItem('yash_auth_token')
      sessionStorage.removeItem('yash_auth_user')
    }
  }

  const clearPendingUser = () => {
    setPendingUser(null)
    localStorage.removeItem('yash_pending_registration')
    sessionStorage.removeItem('yash_pending_registration')
  }

  const markApprovedAndLogin = (approvedToken, approvedUserData, remember = true) => {
    if (approvedToken) {
      setToken(approvedToken)
      if (remember) {
        localStorage.setItem('yash_auth_token', approvedToken)
      } else {
        sessionStorage.setItem('yash_auth_token', approvedToken)
      }
    }
    if (approvedUserData) {
      setUser(approvedUserData)
      if (remember) {
        localStorage.setItem('yash_auth_user', JSON.stringify(approvedUserData))
      } else {
        sessionStorage.setItem('yash_auth_user', JSON.stringify(approvedUserData))
      }
    }
    clearPendingUser()
  }

  const value = {
    user,
    token,
    loading,
    pendingUser,
    login,
    register,
    logout,
    clearPendingUser,
    markApprovedAndLogin,
    isAuthenticated: Boolean(token && user),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
