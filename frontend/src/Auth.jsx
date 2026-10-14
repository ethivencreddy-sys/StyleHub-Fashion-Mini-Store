
import { useState } from 'react'

const API_URL = 'http://127.0.0.1:8000'

export default function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const body = isRegister
        ? { name, email, password }
        : { email, password }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed.')
      }

      if (isRegister) {
        setIsRegister(false)
        setPassword('')
        setMessage('Account created! Please log in.')
        return
      }

      if (!data.access_token) {
        throw new Error('The server did not return an access token.')
      }

      onLogin(data.access_token, email)
    } catch (error) {
      setMessage(error.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={styles.main}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <p style={styles.eyebrow}>WELCOME TO STYLEHUB</p>

        <h1 style={styles.heading}>
          {isRegister ? 'Create account' : 'Welcome back'}
        </h1>

        <p style={styles.description}>
          {isRegister
            ? 'Create an account to start shopping.'
            : 'Log in to access your shopping bag and orders.'}
        </p>

        {isRegister && (
          <label style={styles.label}>
            Full name
            <input
              required
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              style={styles.input}
              placeholder="Your name"
            />
          </label>
        )}

        <label style={styles.label}>
          Email address
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            style={styles.input}
            placeholder="you@example.com"
          />
        </label>

        <label style={styles.label}>
          Password
          <input
            required
            type="password"
            minLength={isRegister ? 8 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            style={styles.input}
            placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
          />
        </label>

        {message && (
          <p role="status" style={styles.message}>
            {message}
          </p>
        )}

        <button type="submit" disabled={loading} style={styles.submit}>
          {loading
            ? 'Please wait...'
            : isRegister
              ? 'Create account'
              : 'Log in'}
        </button>

        <p style={styles.footer}>
          {isRegister
            ? 'Already have an account? '
            : "Don't have an account? "}

          <button
            type="button"
            onClick={() => {
              setIsRegister((previous) => !previous)
              setMessage('')
              setPassword('')
            }}
            style={styles.toggle}
          >
            {isRegister ? 'Log in' : 'Register'}
          </button>
        </p>
      </form>
    </main>
  )
}

const styles = {
  main: {
    minHeight: '75vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    background: '#f7f5ef',
  },
  form: {
    width: '100%',
    maxWidth: 525,
    boxSizing: 'border-box',
    padding: 40,
    background: '#fff',
    border: '1px solid #e9e6df',
  },
  eyebrow: {
    letterSpacing: 2,
    fontSize: 12,
    textAlign: 'center',
  },
  heading: {
    color: '#25251f',
    textAlign: 'center',
    fontSize: 42,
    marginBottom: 12,
  },
  description: {
    color: '#74736c',
    fontSize: 14,
    textAlign: 'center',
  },
  label: {
    display: 'block',
    marginTop: 24,
    fontSize: 16,
  },
  input: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 10,
    padding: 16,
    border: '1px solid #d8d5cc',
    background: '#fff',
    color: '#25251f',
    fontSize: 16,
  },
  message: {
    fontSize: 14,
    marginTop: 16,
    color: '#294c3b',
  },
  submit: {
    width: '100%',
    marginTop: 28,
    padding: 16,
    border: 0,
    background: '#294c3b',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
  },
  footer: {
    marginTop: 28,
    fontSize: 14,
    textAlign: 'center',
  },
  toggle: {
    border: 0,
    background: 'transparent',
    color: '#294c3b',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: 14,
  },
}