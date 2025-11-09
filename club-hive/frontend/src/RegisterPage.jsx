import { useState } from 'react'
import { getMe, register } from './api'

export default function RegisterPage({ onRegister, setError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await register(email, password, name)
      const me = await getMe(res.token)
      onRegister(res.token, me)
    } catch (err) {
      setError('Registration failed')
    }
  }

  return (
    <form onSubmit={handleRegister} style={{marginBottom: 16, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-start'}}>
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
      <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={{padding:8, borderRadius:4, border:'1px solid #ccc', width:'100%'}} />
      <button type="submit" style={{padding:'8px 16px', borderRadius:4, background:'#4caf50', color:'#fff', border:'none'}}>Register</button>
    </form>
  )
}
