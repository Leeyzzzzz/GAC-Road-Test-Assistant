import { defineConfig, loadEnv } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

// NOTE: In HBuilderX projects, __dirname must be used (not process.cwd())
// See: https://uniapp.dcloud.net.cn/collocation/vite-config
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname);

  return {
    plugins: [uni()],
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
      'process.env.VITE_API_TIMEOUT': JSON.stringify(env.VITE_API_TIMEOUT || '10000'),
    },
  };
});
