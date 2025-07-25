import { CozeAPI, ChatEventType, RoleType, ContentType} from '@coze/api';

// Coze API客户端配置
const cozeClient = new CozeAPI({
  token: process.env.COZE_API_KEY || '',
  baseURL: process.env.COZE_BASE_URL || 'https://api.coze.cn',
});

// 检查API配置
export function checkCozeConfig(): boolean {
  return !!(process.env.COZE_API_KEY && process.env.COZE_BOT_ID);
}

// 获取环境变量
export const config = {
  apiKey: process.env.COZE_API_KEY,
  botId: process.env.COZE_BOT_ID,
  baseURL: process.env.COZE_BASE_URL || 'https://api.coze.cn',
};


export { cozeClient, ChatEventType, RoleType, type ContentType }; 