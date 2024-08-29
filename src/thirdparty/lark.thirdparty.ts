import axios from 'axios'

class LarkThirdparty {
  constructor() {}
  async sendMessage(content) {
    return axios.post(
      'https://open.larksuite.com/open-apis/bot/v2/hook/d12b4c94-e345-4119-ac80-4e2d92ebf93b',
      {
        msg_type: 'text',
        content: {
          text: content
        }
      }
    )
  }

  async sendGroqMessage(content) {
    return axios.post(
      'https://open.larksuite.com/open-apis/bot/v2/hook/ad419701-0a9a-479f-bec6-699dc4318ed4',
      {
        msg_type: 'text',
        content: {
          text: content
        }
      }
    )
  }
}

export default new LarkThirdparty()
