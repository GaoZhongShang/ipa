import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.company.officeassistant',
  appName: '移动办公助手',
  webDir: 'dist',
  server: {
    // 开发时允许从本地服务器加载（生产构建不需要）
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    // 允许访问 HTTP 接口（非 HTTPS API）
    allowsLinkPreview: false,
  },
};

export default config;
