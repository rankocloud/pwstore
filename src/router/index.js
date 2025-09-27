import { createRouter, createWebHashHistory } from 'vue-router'
import SetupWizard from '../components/SetupWizard.vue'
import UnlockScreen from '../components/UnlockScreen.vue'
import MainInterface from '../components/MainInterface.vue'
import PageRecognitionSettings from '../components/PageRecognitionSettings.vue'

// 创建一个简单的默认组件
const DefaultView = {
  template: '<div></div>'
}

const routes = [
  {
    path: '/',
    name: 'DefaultView',
    component: DefaultView
  },
  {
    path: '/setup',
    name: 'SetupWizard',
    component: SetupWizard
  },
  {
    path: '/unlock',
    name: 'UnlockScreen',
    component: UnlockScreen
  },
  {
    path: '/main',
    name: 'MainInterface',
    component: MainInterface
  },
  {
    path: '/page-recognition-settings',
    name: 'PageRecognitionSettings',
    component: PageRecognitionSettings
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router