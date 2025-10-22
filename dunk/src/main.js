import { createApp } from 'vue' 
import router from './route/routes.js' // for routing 
import './style.css' 
import App from './App.vue' 
import 'bootstrap/dist/css/bootstrap.min.css'
import { handleRedirectResult } from './firebase/auth'

const app = createApp(App) 
// Temporary: show runtime errors on the page to avoid a white screen
function createErrorOverlay() {
	let el = document.getElementById('__error_overlay__')
	if (!el) {
		el = document.createElement('div')
		el.id = '__error_overlay__'
		Object.assign(el.style, {
			position: 'fixed',
			left: '8px',
			right: '8px',
			top: '8px',
			padding: '12px',
			background: 'rgba(20,20,20,0.95)',
			color: 'white',
			fontFamily: 'monospace',
			whiteSpace: 'pre-wrap',
			zIndex: 99999,
			borderRadius: '6px',
			maxHeight: '60vh',
			overflow: 'auto'
		})
		document.body.appendChild(el)
	}
	return el
}

function showErrorOverlay(message) {
	try {
		const el = createErrorOverlay()
		el.textContent = message
	} catch (e) {
		console.error('Error overlay failed', e)
	}
}

window.addEventListener('error', (ev) => {
	const msg = ev?.error?.stack || ev?.message || String(ev)
	console.error('Captured window error:', ev.error || ev)
	showErrorOverlay(msg)
})

window.addEventListener('unhandledrejection', (ev) => {
	const reason = ev?.reason
	const msg = reason?.stack || reason?.message || String(reason)
	console.error('Unhandled rejection:', reason)
	showErrorOverlay('Unhandled promise rejection:\n' + msg)
})

;(async () => {
	try {
		const redirect = await handleRedirectResult()
		if (redirect) console.log('Firebase redirect sign-in completed')
	} catch (e) {
		console.warn('Redirect handling failed', e)
	}
	// register a Vue error handler to capture component context for hard-to-find unmount errors
	app.config.errorHandler = (err, vm, info) => {
		try {
			console.error('Vue error:', err, vm, info)
			const compName = vm && vm.$options && (vm.$options.name || vm.$options._componentTag) ? (vm.$options.name || vm.$options._componentTag) : (vm && vm.$el && vm.$el.tagName) || 'unknown'
			showErrorOverlay('Vue error:\n' + (err && (err.stack || err.message)) + '\ninfo: ' + info + '\ncomponent: ' + compName)
		} catch (e) {
			console.error('Failed to show Vue error overlay', e)
		}
	}

	app.config.warnHandler = (msg, vm, trace) => {
		try { console.warn('Vue warn:', msg, trace); } catch (e) {}
	}

	app.use(router).mount('#app')
})()