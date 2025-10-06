<script setup>
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage' // Google's Firebase library
import { storage } from '../firebase/firebase' // your local firebase setup
</script>

<script>
export default {
  data() {
    return {}
  },
  methods: {
    async upload(event) {
      // Get the selected file
      const file = event.target.files[0]
      // Create a reference to the file in Firebase Storage
      const fileRef = storageRef(storage, `uploads/${file.name}`)
      // Upload the file
      await uploadBytes(fileRef, file)
      // Get the URL to download the file
      const url = await getDownloadURL(fileRef)
      alert(`File uploaded: ${url}`)
    }
  }
}
</script>

<template>
  <div>
    <h1>Welcome to Vue + Firebase</h1>
    <input type="file" @change="upload" />
  </div>
</template>
