<template>
  <v-app>
    <v-main>
      <transition name="slide-fade" mode="out-in">
        <router-view />
      </transition>
    </v-main>
  </v-app>
</template>
<style>
@import "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css";

.page {
  widows: inherit;
}
/* Enter and leave animations can use different */
/* durations and timing functions.              */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}
::-webkit-scrollbar {
  width: 1vh;
}

/* Track */
::-webkit-scrollbar-track {
  background: rgb(39 39 39);
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #2196f3;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #5ca7e3;
}
</style>
<script>
export default {
  name: "App",
  data: () => ({
    //
  }),
};
</script>
