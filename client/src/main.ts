import 'balloon-css/balloon.min.css'
import './app.css'
import App from './App.svelte'

import { appPath, route } from './lib/nav'

// Compare against the path *inside* the app, not the raw URL — the app is
// served from a sub-path and every one of these would otherwise miss.
const path = appPath();

if (path.startsWith('/room/')) {
  window.location.pathname = route(path.replace('/room/', '/join/'));
  throw new Error('REDIRECT');
}

const allowedPaths = [
  '/',
  '/rules',
  '/auth/callback/discord',
  '/auth/callback/google',
];

if (!path.startsWith('/join/') && !allowedPaths.includes(path)) {
  window.location.pathname = route('/');
  throw new Error('REDIRECT');
}

const app = new App({
  target: document.getElementById('app')!,
})

export default app
