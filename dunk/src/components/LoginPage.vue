<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <form @submit.prevent="handleSubmit" class="bg-white p-8 rounded shadow-md w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>

      <div class="mb-4">
        <label for="email" class="block mb-1 font-semibold">Email</label>
        <input
          id="email"
          type="email"
          v-model="email"
          placeholder="you@example.com"
          class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div class="mb-6">
        <label for="password" class="block mb-1 font-semibold">Password</label>
        <input
          id="password"
          type="password"
          v-model="password"
          placeholder="Enter your password"
          class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Sign In
      </button>

      <p v-if="error" class="mt-4 text-red-600 text-center">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const error = ref('')

function handleSubmit() {
  error.value = ''

  // Simple validation example
  if (!email.value.includes('@')) {
    error.value = 'Please enter a valid email address.'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }

  // Here you can add your API call or Firebase sign-in logic
  console.log('Logging in with:', email.value, password.value)

  // Simulate success
  alert('Login successful!')

  // Clear form after login
  email.value = ''
  password.value = ''
}
</script>

<style scoped>
</style>
