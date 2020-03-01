import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import './registerServiceWorker'
import VueLocalStorage from 'vue-localstorage'
import '@mdi/font/css/materialdesignicons.css'
import * as Sentry from '@sentry/browser';
import * as Integrations from '@sentry/integrations';

Vue.use(VueLocalStorage)

Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')

Sentry.init({
  dsn: 'https://751eefde68d040bb860ca5bf083db014@sentry.io/3308001',
  integrations: [new Integrations.Vue({ Vue, attachProps: true, logErrors: true })],
});