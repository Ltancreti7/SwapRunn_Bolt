import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function DealerSignup() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    dealership_name: '',
    contact_name: '',
    business_email: '',
    address: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Step 1 — Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setMessage(`Signup failed: ${signUpError.message}`)
      setLoading(false)
      return
    }

    const userId = authData.user?.id

    // Step 2 — Call the RPC to create dealer profile
    const { error: rpcError } = await supabase.rpc('create_dealer_profile', {
      p_user_id: userId,
      dealership_name: form.dealership_name,
      contact_name: form.contact_name,
      business_email: form.business_email,
      address: form.address,
      phone: form.phone,
    })

    if (rpcError) {
      setMessage(`Dealer profile creation failed: ${rpcError.message}`)
    } else {
      setMessage('✅ Dealer account created successfully!')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Dealership Signup
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Login Email"
            className="w-full p-2 border rounded-md"
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded-md"
            onChange={handleChange}
            required
          />
          <input
            name="dealership_name"
            placeholder="Dealership Name"
            className="w-full p-2 border rounded-md"
            onChange={handleChange}
            required
          />
          <input
            name="contact_name"
            placeholder="Contact Name"
            className="w-full p-2 border rounded-md"
            onChange={handleChange}
            required
          />
          <input
            name="business_email"
            type="email"
            placeholder="Business Email"
            className="w-full p-2 border rounded-md"
            onChange={handleChange}
            required
          />
          <input
            name="address"
            placeholder="Business Address"
            className="w-full p-2 border rounded-md"
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="Phone Number"
            className="w-full p-2 border rounded-md"
            onChange={handleChange}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </div>
  )
}
