
<script setup>
import { ref } from 'vue'
import { loginWithGoogle, saveUserToDatabase } from '../firebase/auth.js'

// form state
const email = ref('')
const password = ref('')
const error = ref('')

async function handleSubmit() {
  error.value = ''
  if (!email.value || !email.value.includes('@')) {
    error.value = 'Please enter a valid email.'
    return
  }
  if (!password.value || password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }

  
}

async function handleGoogleSignIn() {
  error.value = ''
  try {
    // loginWithGoogle returns a UserCredential
    const result = await loginWithGoogle()
    const user = result.user
    console.log(result)

    if (user && user.uid) {
      // save the user to your DB (pass the Firebase User object)
      await saveUserToDatabase(user)
      alert('Signed in with Google!')
    } else {
      error.value = 'No user returned from Google sign-in'
    }

  } catch (e) {
    error.value = 'Google sign-in failed'
    console.error(e)
  }
}

// async function handleGoogleSignIn() {
//   error.value = ''
//   try {
//     await loginWithGoogle() 
//     await saveUserToDatabase()
//     alert('Signed in with Google!')
    
//   } catch (e) {
//     error.value = 'Google sign-in failed'
//     console.error(e)
//   }
// }


</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0d0f13]">
    <form @submit.prevent="handleSubmit" class="bg-[#111318] w-full max-w-md p-8 rounded-2xl border border-gray-800 shadow-lg">
      <h2 class="text-2xl font-semibold mb-2 text-white">Login</h2>
      <p class="text-gray-400 mb-8 text-sm text-center">Enter your credentials to sign in.</p>

      <div class="mb-5">
        <label for="email" class="block text-sm font-medium mb-1 text-gray-300">Email</label>
        <input
          id="email"
          type="email"
          v-model="email"
          placeholder="your@email.com"
          class="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-100"
          required
        />
      </div>

      <div class="mb-8">
        <label for="password" class="block text-sm font-medium mb-1 text-gray-300">Password</label>
        <input
          id="password"
          type="password"
          v-model="password"
          placeholder="********"
          class="w-full bg-[#1a1d24] border border-gray-700 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-100"
          required
        />
      </div>

<button
  type="submit"
  class="w-full bg-orange-500 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
>
  Sign In
</button>

<button
  type="button"
  class="w-full flex items-center justify-center gap-2 border border-gray-700 py-2.5 mt-6 rounded-lg hover:bg-[#1a1d24] transition-colors"
  @click="handleGoogleSignIn"
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" class="h-4 w-4 fill-white">
    <path
      d="M488 261.8C488 403.3 391.2 512 248 512 111 512 0 401 0 264S111 16 248 16a230 230 0 01158 61l-64 61a138 138 0 00-94-36c-79 0-144 66-144 146s65 146 144 146c69 0 114-39 123-93H248v-74h240c2 13 4 26 4 40z"
    />
  </svg>
  <span class="text-sm font-medium text-gray-200">Google</span>
</button>

      <p v-if="error" class="mt-4 text-center text-red-500 text-sm">{{ error }}</p>
    </form>
  </div>
</template>

