import Vue from "vue";
import VueRouter from "vue-router";
import Upload from "../views/Upload.vue";
import Analyze from "../views/Analyze.vue";
import Results from "../views/Results.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Upload",
    component: Upload,
  },
  {
    path: "/analyze",
    name: "Analyze",
    component: Analyze,
  },
  {
    path: "/results",
    name: "Results",
    component: Results,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
