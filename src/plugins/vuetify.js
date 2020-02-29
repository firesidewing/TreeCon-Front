import '@mdi/font/css/materialdesignicons.css'
import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import VueApexCharts from 'vue-apexcharts'

Vue.use(Vuetify);
Vue.use(VueApexCharts)

Vue.component('apexchart', VueApexCharts)

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: '#474747',
        secondary: '#216073',
        accent: '#FF5722',
        error: '#c55e5e',
        success: '#368141',
        warning: '#ffe033'
      },
    },
  },
  icons: {
    iconfont: 'mdi'
  },
});
