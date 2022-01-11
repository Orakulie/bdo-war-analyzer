<template>
  <v-app id="inspire" class="page">
    <v-main class="pt-0" style="display: flex; align-items: center">
      <div class="d-flex justify-center">
        <v-btn outlined x-large color="primary" ref="analyzeButton" dark
          >You vs {{ getGuildNames() }}</v-btn
        >
      </div>

      <v-container>
        <v-row>
          <v-col cols="12" sm="2">
            <v-sheet rounded="lg" min-height="268" class="sideContainer">
              <v-card
                v-for="member in results.members"
                :key="member.name"
                class="ma-2"
                style="border: solid #2196f3 2px"
              >
                <v-card-title primary-title>
                  <div>
                    <h3 class="headline mb-0">{{ member.name }}</h3>
                    <div>{{ member.kills }}-{{ member.deaths }}</div>
                  </div>
                </v-card-title>
              </v-card>
            </v-sheet>
          </v-col>

          <v-col cols="12" sm="8">
            <v-sheet
              min-height="70vh"
              rounded
              style="
                overflow: hidden;
                background-color: #121212;
                border: solid #2196f3 2px;
              "
            >
              <canvas ref="graph"> </canvas>
            </v-sheet>
          </v-col>

          <v-col
            cols="12"
            sm="2"
            style="
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            "
          >
            <v-sheet rounded="lg" v-for="guild in results.guilds" :key="guild" color="#121212">
              <div class="d-flex justify-center mb-1">
                <v-btn outlined color="primary" ref="analyzeButton" dark>{{
                  guild
                }}</v-btn>
              </div>
              <div
                :style="`overflow-y:auto;max-height:calc(60vh/${results.guilds.length})`"
              >
                <v-card
                  v-for="enemy in results.enemies.filter(
                    (e) => e.guild == guild
                  )"
                  :key="enemy.name"
                  class="ma-2"
                  style="border: solid #2196f3 2px"
                >
                  <v-card-title primary-title>
                    <div>
                      <h3 class="headline mb-0">{{ enemy.name }}</h3>
                      <div>{{ enemy.kills }}-{{ enemy.deaths }}</div>
                    </div>
                  </v-card-title>
                </v-card>
              </div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
<style scoped>
.sideContainer {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
<script>
/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "registerables" }]*/
const { Chart, registerables } = require("chart.js");
export default {
  data() {
    return {
      results: {
        members: [],
        enemies: [],
        guilds: [],
        errors: 0,
        messages: 0,
        logs: [],
      },
      timeData: [],
    };
  },
  async mounted() {
    if (!this.$route.params.results) return;

    this.results = this.$route.params.results;

    this.getTimeData();
  },
  methods: {
    getGuildNames() {
      return this.results.guilds.join(", ");
    },
    getTimeData() {
      const timePoints = [];
      this.results.logs.map((log) => {
        if (
          log.time != null &&
          !timePoints.find((point) => point.getTime() == log.time.getTime())
        )
          timePoints.push(log.time);
      });
      timePoints.forEach((point) => {
        const logs = this.results.logs.filter((log) =>
          log.time != null ? log.time.getTime() == point.getTime() : false
        );
        const direction = logs.reduce(
          (a, b) => (b.person1.guild == "" ? a + 1 : a - 1),
          0
        );
        this.timeData.push({
          time: point.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          direction: direction,
        });
      });

      const labels = this.timeData.map((p) => p.time);
      const dir = this.timeData.map((p) => p.direction);
      /* const labels = [
        "21:08",
        "21:09",
        "21:10",
        "21:11",
        "21:12",
        "21:13",
        "21:14",
        "21:15",
        "21:16",
        "21:17",
        "21:18",
        "21:19",
        "21:20",
        "21:21",
        "21:22",
        "21:23",
        "21:24",
        "21:25",
        "21:26",
        "21:27",
        "21:28",
        "21:29",
        "21:31",
        "21:34",
        "21:35",
      ];
      const dir = [
        0, -7, 0, -1, -2, -6, 3, -3, -3, -2, -9, -8, -7, -11, -5, -5, -3, -7,
        -1, -3, 1, -1, -1, -1, 1,
      ]; */
      console.log(labels);
      console.log(dir);
      const data = {
        labels: labels,
        datasets: [
          {
            label: "Performance",
            backgroundColor: "rgba(0,0,0,0)",
            borderColor: "rgba(0,0,0,0)",
            fill: {
              target: "origin",
              above: "#03A9F4", 
              below: "#F44336", 
            },
            data: dir,
            tension: 0.1,
          },
        ],
      };
      const config = {
        type: "line",
        data: data,
        options: {},
      };
      Chart.register(...registerables);
      new Chart(this.$refs.graph, config);
    },
  },
};
</script>
