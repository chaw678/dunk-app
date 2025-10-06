<script setup> 
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import MainMenu from './components/MainMenu.vue'
const product = ref('Socks')
const inventory = ref(8)
const details = ref(['80% cotton', '20% polyester'])
const variants = ref([
    { id: 2234, color: 'green', quantity: 10 ,color: 'red'},
    { id: 2235, color: 'blue',  quantity: 0 , color: 'yellow'}
])
const cart = ref(0)
</script> 

<template> 
<h1>{{ product }}</h1>
<div >Cart({{ cart }})</div>
<p v-if="inventory > 10">In Stock</p>
<p v-else-if="inventory <=10">Out of Stock</p>
<p v-else>Inventory data not available</p>
<ul> <li v-for="detail in details" :key="detail">{{ detail }}</li> </ul>
<div v-for="(variant, index) in variants" :key="variant.id" 
 :style="{ backgroundColor: variant.color }" 
 @mouseover="selectedVariant = index"> 
 </div>
 <button v-on:click="cart+=1">Add to cart</button>
<MainMenu></MainMenu>
<RouterView></RouterView> 
</template> 
<style scoped> </style>