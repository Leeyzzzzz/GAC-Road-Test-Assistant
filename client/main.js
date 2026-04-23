import App from './App'
import { createSSRApp } from 'vue'
import 'tdesign-uniapp/common/style/theme/index.css'

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
