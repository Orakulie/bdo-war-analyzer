<template>
  <v-app id="inspire" class="page">
    <v-main class="pt-0" style="display: flex; align-items: center">
      <div class="d-flex justify-center">
        <v-btn outlined x-large color="primary" dark @click="changeGuild('')"
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
                @click="updateGraph(member)"
              >
                <v-card-title primary-title>
                  <div class="text-center" style="width: 100%">
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
              <v-sheet
                rounded
                min-height="40vh"
                style="
                  overflow: hidden;
                  background-color: #121212;
                  border: solid #2196f3 2px;
                "
              >
                <canvas ref="graph"> </canvas>
              </v-sheet>
              <v-container v-if="selectedPlayer.name">
                {{ selectedPlayer.name }}
                <v-divider></v-divider>
                <p>
                  Kills:
                  {{ selectedPlayer.kills }}
                  <br />
                  Deaths:
                  {{ selectedPlayer.deaths }}
                  <br />
                  Kd:
                  {{
                    (selectedPlayer.kills / selectedPlayer.deaths).toFixed(2)
                  }}
                  <br />
                </p>
                <div v-if="getLastLogTime(selectedPlayer.logs)">
                  {{ toLocalString(selectedPlayer.logs[0].time) }} -
                  {{ toLocalString(getLastLogTime(selectedPlayer.logs)) }}
                  ({{ getPlayedTime(selectedPlayer) }}
                  min,
                  {{
                    Math.round(
                      (getPlayedTime(selectedPlayer) /
                        ((getLastLogTime(results.logs).getTime() -
                          results.logs[0].time.getTime()) /
                          (1000 * 60))) *
                        100
                    )
                  }}%)
                </div>
              </v-container>
              <v-container v-else-if="results.logs.length > 0">
                {{ selectedGuild == "" ? "Your" : selectedGuild }} stats
                <v-divider></v-divider>
                <p>
                  Avg kills:
                  {{
                    (
                      getPlayersOfGuild(selectedGuild).reduce(
                        (total, m) => total + m.kills,
                        0
                      ) / getPlayersOfGuild(selectedGuild).length
                    ).toFixed(2)
                  }}
                  <br />
                  Avg deaths:
                  {{
                    (
                      getPlayersOfGuild(selectedGuild).reduce(
                        (total, m) => total + m.deaths,
                        0
                      ) / getPlayersOfGuild(selectedGuild).length
                    ).toFixed(2)
                  }}
                  <br />
                  Avg kd:
                  {{
                    (
                      getPlayersOfGuild(selectedGuild).reduce(
                        (total, m) => total + m.kills,
                        0
                      ) /
                      getPlayersOfGuild(selectedGuild).length /
                      (getPlayersOfGuild(selectedGuild).reduce(
                        (total, m) => total + m.deaths,
                        0
                      ) /
                        getPlayersOfGuild(selectedGuild).length)
                    ).toFixed(2)
                  }}
                  <br />
                  Avg time:
                  {{
                    Math.round(
                      getPlayersOfGuild(selectedGuild).reduce(
                        (total, m) => total + getPlayedTime(m),
                        0
                      ) / getPlayersOfGuild(selectedGuild).length
                    )
                  }}
                  min ({{
                    Math.round(
                      (getPlayersOfGuild(selectedGuild).reduce(
                        (total, m) => total + getPlayedTime(m),
                        0
                      ) /
                        getPlayersOfGuild(selectedGuild).length /
                        ((getLastLogTime(results.logs).getTime() -
                          results.logs[0].time.getTime()) /
                          (1000 * 60))) *
                        100
                    )
                  }}%)
                  <br />
                  Members: {{ getPlayersOfGuild(selectedGuild).length }}
                </p>
                <p v-if="selectedGuild == ''">
                  You had {{ results.members.length }} members and fought
                  {{ results.enemies.length }} people.
                </p>
              </v-container>
            </v-sheet>
            <div class="d-flex justify-center mt-5">
              <v-btn
                outlined
                x-large
                color="yellow darken-2"
                dark
                @click="exportResults()"
                >Export</v-btn
              >
            </div>
          </v-col>

          <v-col
            cols="12"
            sm="2"
            style="
              max-height: 70vh;
              overflow-y: auto;
              margin-top: 12px;
              padding-top: 0;
              padding-bottom: 0;
            "
          >
            <v-sheet
              rounded="lg"
              v-for="guild in results.guilds"
              :key="guild"
              color="#121212"
              class="mb-3"
            >
              <div class="d-flex justify-center mb-1">
                <v-btn
                  outlined
                  color="primary"
                  dark
                  @click="changeGuild(guild)"
                  >{{ guild }}</v-btn
                >
              </div>
              <div :style="calcContainerHeight()">
                <v-card
                  v-for="enemy in results.enemies.filter(
                    (e) => e.guild == guild
                  )"
                  :key="enemy.name"
                  class="ma-2"
                  style="border: solid #2196f3 2px"
                  @click="updateGraph(enemy)"
                >
                  <v-card-title primary-title>
                    <div class="text-center" style="width: 100%">
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
        allPlayers: [],
        guilds: [],
        errors: 0,
        messages: 0,
        logs: [],
      },
      timeData: [],
      selectedPlayer: {},
      selectedGuild: "",

      graph: null,
    };
  },
  async mounted() {
    if (!this.$route.params.results) return;

    this.results = this.$route.params.results;
    this.results["allPlayers"] = this.results.members.concat(
      this.results.enemies
    );

    this.getTimeData();
  },
  methods: {
    getLastLogTime(logs) {
      for (let i = logs.length - 1; i >= 0; i--) {
        const log = logs[i];
        if (log && log.time != null) return log.time;
      }
      return null;
    },
    getGuildNames() {
      return this.results.guilds.join(", ");
    },
    calcContainerHeight() {
      return this.results.guilds.length == 1
        ? `overflow-y:auto;max-height:65.7vh`
        : `overflow-y:auto;max-height:calc(60vh/${this.results.guilds.length})`;
    },
    getPlayedTime(person) {
      if (this.getLastLogTime(person.logs))
        return (
          (this.getLastLogTime(person.logs).getTime() -
            person.logs[0].time.getTime()) /
          (1000 * 60)
        );
      return 0;
    },
    exportResults() {
      var element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8, " +
          encodeURIComponent(
            JSON.stringify({
              enemies: this.results.enemies.map((e) => {
                return {
                  name: e.name,
                  kills: e.kills,
                  deaths: e.deaths,
                  guild: e.guild,
                };
              }),
              members: this.results.members.map((m) => {
                return {
                  name: m.name,
                  kills: m.kills,
                  deaths: m.deaths,
                  guild: m.guild,
                };
              }),
              guilds: this.results.guilds,
              logs: this.results.logs.map((l) => {
                return {
                  person1: l.person1.name,
                  person2: l.person2.name,
                  time: l.time,
                };
              }),
              errors: this.results.errors,
              messages: this.results.messages,
            })
          )
      );
      element.setAttribute(
        "download",
        `war-${this.results.guilds.join("-")}.json`
      );
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    changeGuild(guild) {
      this.selectedGuild = guild;
      if (this.graph.data.datasets.length > 1) {
        this.graph.data.datasets.pop();
        this.graph.update();
        this.selectedPlayer = {};
      }
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
            spanGaps: true,
            data: dir,
            tension: 0.1,
            order: 2,
          },
        ],
      };
      const config = {
        type: "line",
        data: data,
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      };
      Chart.register(...registerables);
      this.graph = new Chart(this.$refs.graph, config);
    },
    getPlayersOfGuild(guild) {
      return this.results.allPlayers.filter((e) => e.guild == guild);
    },
    updateGraph(person) {
      const data = this.timeData.map((p) => {
        const point = person.logs.find(
          (log) => this.toLocalString(log.time) == p.time
        );
        if (point) {
          const logs = person.logs.filter((log) =>
            log.time != null
              ? log.time.getTime() == point.time.getTime()
              : false
          );
          const direction = logs.reduce(
            (a, b) => (b.person1.guild == "" ? a + 1 : a - 1),
            0
          );
          return direction;
        }
        return null;
      });
      if (this.graph.data.datasets.length > 1) {
        const oldData = this.graph.data.datasets.pop();
        if (oldData.data.every((d, i) => d == data[i])) {
          this.graph.update();
          this.selectedPlayer = {};
          return;
        }
      }
      this.selectedPlayer = person;
      this.graph.data.datasets.push({
        label: person.name,
        backgroundColor: "rgba(50,125,180,1)",
        borderColor: "rgba(255,255,255,1)",

        spanGaps: true,
        data: data,
        tension: 0.1,
        order: 1,
      });
      this.graph.update();
    },
    toLocalString(date) {
      if (!date) return "";
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>
