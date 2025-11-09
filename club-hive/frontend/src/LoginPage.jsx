import { useState } from 'react'
import { getMe, login } from './api'

export default function LoginPage({ onLogin, setError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await login(email, password)
      const me = await getMe(res.token)
      onLogin(res.token, me)
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
    }
  }

  return (
    <form onSubmit={handleLogin} style={{marginBottom: 16, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-start'}}>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:8, borderRadius:4, border:'1px solid #ccc', width:'100%'}} />
      <div style={{position:'relative', width:'100%'}}>
        <input
          placeholder="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e=>setPassword(e.target.value)}
          style={{padding:8, borderRadius:4, border:'1px solid #ccc', width:'100%'}}
        />
        <button
          type="button"
          onClick={()=>setShowPassword(v=>!v)}
          style={{position:'absolute', right:8, top:8, background:'none', border:'none', cursor:'pointer', color:'#1976d2'}}
        >
          {showPassword ? 'Hide' : 'View'}
        </button>
      </div>
      <button type="submit" style={{padding:'8px 16px', borderRadius:4, background:'#2a3d66', color:'#fff', border:'none'}}>Login</button>
    </form>
  )
}
