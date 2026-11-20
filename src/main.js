import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')

export default mount(App, { target: document.getElementById('app') })
