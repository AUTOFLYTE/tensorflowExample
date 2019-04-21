import Vue from "vue";
import "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import HighCharts from "highcharts";
import HighChartsMore from "highcharts/highcharts-more";
import HighchartsVue from "highcharts-vue";

import devtools from "@vue/devtools";

// Load the extra chart options
HighChartsMore(HighCharts);

Vue.config.productionTip = false;
Vue.use(HighchartsVue);

new Vue({
  router,
  render: h => h(App)
}).$mount("#app");

/* global process */
/*
 * To get devtools working (from terminal):
 * sudo npm install -g @vue/devtools
 * IF THAT DOES NOT WORK
 * sudo npm install -g @vue/devtools --unsafe-perm=true --allow-root
 *
 * Then from terminal
 * 'vue-devtools'
 */
if (process.env.NODE_ENV === "development") {
  devtools.connect(/* host, port */);
}
