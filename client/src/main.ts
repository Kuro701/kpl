import 'balloon-css/balloon.min.css'
import './app.css'
import App from './App.svelte'

const allowedDirectPaths = [
  '/',
  '/rules',
];

if (!allowedDirectPaths.includes(window.location.pathname)) {
  window.location.pathname = '/';
  throw new Error('Invalid path');
}

const app = new App({
  target: document.getElementById('app')!,
})

export default app
