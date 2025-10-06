<template>
  <div>
    <h1>Welcome to Vue + Firebase</h1>
    <button @click="login">Login with Google</button>
    <h2 v-if="uploadOK">
      <router-link to="/upload/">Upload</router-link>
    </h2>
  </div>
</template>

<script setup>
import { loginWithGoogle } from '../firebase/auth'
</script>

<script>
export default {
  data() {
    return {
      uploadOK: false
    }
  },
  methods: {
    async login() {
      try {
        await loginWithGoogle()
        alert('Logged in!')
        this.uploadOK = true
      } catch (err) {
        console.error(err)
      }
    }
  }
}
</script>
