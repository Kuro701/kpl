import 'balloon-css/balloon.min.css'
import './app.css'
import App from './App.svelte'

const path = window.location.pathname;

if (path.startsWith('/room/')) {
  window.location.pathname = path.replace('/room/', '/join/');
  throw new Error('REDIRECT');
}

const allowedPaths = [
  '/',
  '/rules',
  '/auth/callback/discord',
];

if (!path.startsWith('/join/') && !allowedPaths.includes(path)) {
  window.location.pathname = '/';
  throw new Error('REDIRECT');
}

const app = new App({
  target: document.getElementById('app')!,
})

export default app
