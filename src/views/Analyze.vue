<template>
  <v-app id="inspire" class="page">
    <v-main class="pt-0" style="display: flex; align-items: center">
      <v-container
        style="display: flex; flex-direction: column; align-items: center"
      >
        <v-sheet
          rounded
          :height="stepper != 3 ? '40vh' : ''"
          width="40%"
          class="ma-5"
          style="
            overflow: hidden;
            background-color: #121212;
            border: solid #2196f3 2px;
          "
        >
          <v-stepper
            alt-labels
            elevation="0"
            style="text-align: center; background-color: #121212"
            v-model="stepper"
          >
            <v-stepper-header>
              <v-stepper-step step="1"> Scaling Images </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step step="2"> Tesseract analyzing </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step step="3"> Results </v-stepper-step>
            </v-stepper-header>
          </v-stepper>
          <v-container style="height: 100%; text-align: center"
            ><div v-if="stepper == 2" class="pb-3">{{ getProgress() }}%</div>
            <div
              v-if="stepper < 3"
              style="
                display: flex;
                justify-content: space-evenly;
                max-height: 60%;
                overflow-y: auto;
                flex-wrap: wrap;
              "
            >
              <v-card
                style="width: 115px"
                v-for="img in images"
                :key="img.name"
                class="ma-1"
              >
                <v-app-bar dense flat color="rgba(0, 0, 0, 0)" elevation="0">
                  <v-toolbar-title
                    class="white--text pl-0 text-center"
                    style="width: 100%"
                  >
                    {{ img.name }}
                  </v-toolbar-title>
                </v-app-bar>
                <v-card-text class="text-center pt-0">
                  <v-progress-linear
                    :ref="img.name"
                    :value="100"
                    :indeterminate="!img.finished"
                  ></v-progress-linear>
                </v-card-text>
              </v-card>
              <v-card
                flat
                style="background-color: transparent"
                class="mx-1"
                height="0"
                width="115"
                v-for="i in 10"
                :key="i"
              />
            </div>

            <div v-if="stepper == 3 && results.messages">
              <p>
                Correctly recognized {{ results.messages - results.errors }}/{{
                  results.messages
                }}
                ({{
                  Math.floor(
                    ((results.messages - results.errors) / results.messages) *
                      100
                  )
                }}%) messages in {{ Math.round(time) }} seconds.
              </p>
              <p>
                Found
                {{ results.enemies.length + results.members.length }} players,
                distributed over {{ results.guilds.length + 1 }} guilds.
              </p>
              <p>
                The war started
                {{
                  results.logs[0].time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }}
                and ended at
                {{
                  getLastLogTime()
                    ? getLastLogTime().time.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"
                }}.
              </p>
            </div>
            <v-row
              class="justify-center mt-5"
              v-if="results.messages"
              style="display: flex; flex-direction: column; align-items: center"
            >
              <v-btn
                outlined
                color="primary"
                ref="analyzeButton"
                class="mb-2"
                dark
                @click="
                  $router.push({
                    name: 'Results',
                    params: { results: results },
                  })
                "
                >Show details</v-btn
              >
              <v-btn
                outlined
                color="yellow darken-2"
                dark
                @click="exportResults()"
                >Export</v-btn
              >
            </v-row>
          </v-container>
          <div class="d-flex justify-center mt-5">
            <v-progress-circular
              v-show="false"
              :value="forceUpdate"
              color="primary"
            ></v-progress-circular>
          </div>
        </v-sheet>
      </v-container>
    </v-main>
  </v-app>
</template>
<style>
.v-progress-linear__bar,
.v-progress-linear__bar__determinate {
  transition: none;
}
.v-application--is-ltr .v-stepper__label {
  text-align: center !important;
}
</style>
<script>
const Tesseract = require("tesseract.js");
class Log {
  constructor(person1, person2, time) {
    this.person1 = person1;
    this.person2 = person2;
    this.time = time;
  }

  getObject() {
    return {
      person1: this.person1.name,
      person2: this.person2.name,
      time: this.time,
    };
  }
}
class Person {
  constructor(name, guild = "") {
    this.name = name;
    this.guild = guild;
    this.kills = 0;
    this.deaths = 0;
    this.logs = [];
  }

  addKill(killedPerson, time) {
    this.kills++;
    this.logs.push(new Log(this, killedPerson, time));
  }
  addDeath(diedToPerson, time) {
    this.deaths++;
    this.logs.push(new Log(diedToPerson, this, time));
  }

  static findOrCreatePerson(list, name, guild = "") {
    let result = list.find(
      (person) => compareTwoStrings(person.name, name) >= 0.6
    );
    if (result) return result;

    let p = new Person(name, guild);
    list.push(p);
    return p;
  }

  getInfo() {
    return `${this.name} | Kills: ${this.kills} | Deaths: ${this.deaths} | Guild: ${this.guild}`;
  }
  getObject() {
    return {
      name: this.name,
      guild: this.guild,
      kills: this.kills,
      deaths: this.deaths,
    };
  }
}
function compareTwoStrings(first, second) {
  first = first.replace(/\s+/g, "");
  second = second.replace(/\s+/g, "");

  if (first === second) return 1; // identical or empty
  if (first.length < 2 || second.length < 2) return 0; // if either is a 0-letter or 1-letter string

  let firstBigrams = new Map();
  for (let i = 0; i < first.length - 1; i++) {
    const bigram = first.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;

    firstBigrams.set(bigram, count);
  }

  let intersectionSize = 0;
  for (let i = 0; i < second.length - 1; i++) {
    const bigram = second.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;

    if (count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (first.length + second.length - 2);
}

export default {
  data() {
    return {
      images: [],
      currentImage: null,
      stepper: 0,
      forceUpdate: 0,
      forceUpdateInterval: null,
      results: {},
      scheduler: null,
      settings: {},
      time: 0,
      workers: [],
      finished: false,
    };
  },
  async mounted() {
    this.images = [];
    this.stepper = 2;
    this.forceUpdate = 0;
    this.results = {};
    clearInterval(this.forceUpdateInterval);
    this.forceUpdateInterval = null;
    if (this.scheduler) {
      await this.scheduler.terminate();
      this.scheduler = null;
    }

    this.forceUpdateInterval = setInterval(() => {
      this.forceUpdate++;
      if (this.forceUpdate == 100) this.forceUpdate = 0;
    }, 250);
    this.images = this.$route.params.images;
    this.settings = this.$route.params.settings;
    if (!this.images) return;
    this.images = this.images.map((img) => {
      img["loading"] = 0;
      img["finished"] = false;
      return img;
    });

    const startTime = new Date().getTime();

    let scaledImages = [];
    for (let i = 0; i < this.images.length; i++) {
      const img = this.images[i];
      scaledImages.push(await this.scaleImage(img));
      img.loading = 100;
    }

    this.stepper = 2;
    this.images.map((img) => (img.loading = 0));
    const textResults = await this.analyze(scaledImages);

    this.stepper = 3;
    this.results = this.analyzeResults(textResults);
    this.time = (new Date().getTime() - startTime) / 1000;
  },
  methods: {
    exportResults() {
      var element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8, " +
          encodeURIComponent(
            JSON.stringify({
              enemies: this.results.enemies.map((e) => e.getObject()),
              members: this.results.members.map((m) => m.getObject()),
              guilds: this.results.guilds,
              logs: this.results.logs.map((l) => l.getObject()),
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
    getLastLogTime() {
      for (let i = this.results.logs.length - 1; i >= 0; i--) {
        const log = this.results.logs[i];
        if (log.time != null) return log;
      }
      return null;
    },
    scaleImage(image) {
      const SCALE = this.settings.scale;
      return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onerror = reject;
        reader.onload = function (e) {
          var img = document.createElement("img");
          img.src = e.target.result;
          img.onload = () => {
            var canvas = document.createElement("canvas");
            var width = img.width;
            var height = img.height;

            canvas.width = width * SCALE;
            canvas.height = height * SCALE;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width * SCALE, height * SCALE);

            //let dataurl = canvas.toDataURL(image.type);
            //document.getElementById("output").src = dataurl;
            resolve(canvas);
          };
        };

        reader.readAsDataURL(image);
      });
    },
    getProgress() {
      if (!this.images) return 0;
      const currentProgress = this.workers.reduce(
        (a, b) => a + b.totalProgress + b.progress,
        0
      );
      return this.finished
        ? 100
        : Math.round((currentProgress / this.images.length) * 100);
    },
    async analyze(images) {
      if (images.length == 0) return;

      this.scheduler = Tesseract.createScheduler();

      const amountOfWorkers =
        this.settings.multipleWorkers > images.length
          ? images.length
          : this.settings.multipleWorkers;

      for (let i = 0; i < amountOfWorkers; i++) {
        const worker = Tesseract.createWorker({
          logger: (m) => {
            if (m.status != "recognizing text") return;

            if (m.workerId) {
              let w = this.workers.find((w) => w.id == m.workerId);
              if (!w) {
                w = {
                  id: m.workerId,
                  progress: m.progress,
                  totalProgress: 0,
                };
                this.workers.push(w);
              }
              w.progress = m.progress;
              if (w.progress == 1) {
                w.totalProgress += 1;
                w.progress = 0;
              }
            }
          },
        });
        await worker.load();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");
        this.scheduler.addWorker(worker);
      }

      const results = await Promise.all(
        images.map(async (img) => {
          const work = await this.scheduler.addJob("recognize", img);
          this.images[images.indexOf(img)].finished = true;
          return work;
        })
      );
      this.finished = true;
      await this.scheduler.terminate();
      this.scheduler = null;
      return results;

      /* if (this.settings.multipleWorkers) {
        this.scheduler = Tesseract.createScheduler();
        await Promise.all(
          images.map(async (i) => {
            const worker = Tesseract.createWorker({
              logger: (m) => {
                if (
                  this.images[images.indexOf(i)].loading ==
                    Math.round(m.progress * 100) ||
                  m.status != "recognizing text"
                )
                  return;
                this.images[images.indexOf(i)].loading = Math.round(
                  m.progress * 100
                );
              }, // Add logger here
            });
            await worker.load();
            await worker.loadLanguage("eng");
            await worker.initialize("eng");
            console.log(this.scheduler.addWorker(worker));
          })
        );
        console.log(this.scheduler);
        const results = await Promise.all(
          images.map(async (img) => {
            const work = await this.scheduler.addJob("recognize", img);
            console.log(work);
            return work;
          })
        );
        await this.scheduler.terminate();
        this.scheduler = null;
        return results;
      } else {
        this.currentImage = 0;
        const worker = Tesseract.createWorker({
          logger: (m) => {
            if (
              this.images[this.currentImage].loading ==
                Math.round(m.progress * 100) ||
              m.status != "recognizing text"
            )
              return;
            this.images[this.currentImage].loading = Math.round(
              m.progress * 100
            );
          },
        });
        await worker.load();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");

        let results = [];
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          results.push(await worker.recognize(img));
          this.currentImage++;
        }
        return results;
      } */
    },
    analyzeResults(data) {
      const NAME_CONFIDENCE = 0.6;
      let messages = 0;
      let errors = 0;

      let members = [];
      let enemies = [];
      let guilds = [];
      let logs = [];

      data.forEach((image) => {
        let currentLogs = [];
        image.data.lines.map((line) => {
          messages++;

          let msg = line.text;
          let removeTime = msg.match(/\(\w{2}:\w{2}\)/);
          let time = null;
          if (removeTime) {
            let timeString = removeTime[0];
            msg = msg.replace(removeTime[0], "");

            timeString = timeString.replaceAll("CO", "00");
            for (let i = 0; i < 10; i++) {
              timeString = timeString.replaceAll("C" + i, "0" + i);
            }
            /*eslint no-unused-vars: ["error", { "varsIgnorePattern": "_" }]*/
            const timeStringMatch = timeString.match(/\((\d{2}):(\d{2})\)/);
            if (timeStringMatch) {
              const [_, hours, minutes] = timeStringMatch;
              time = new Date(1, 1, 1);
              if (hours == "00") {
                time = new Date(1, 1, 2);
              }
              time.setHours(hours);
              time.setMinutes(minutes);
            }
          }
          msg = msg.replaceAll("(", "[");
          msg = msg.replaceAll(")", "]");
          msg = msg.replaceAll("}", "]");
          msg = msg.replaceAll("{", "[");
          msg = msg.replaceAll(" ", "");
          msg = msg.replaceAll("!", "I");
          msg = msg.replaceAll("$", "S");
          msg = msg.replaceAll("¥", "Y");
          msg = msg.replaceAll("1", "I");
          msg = msg.replaceAll(":", "");
          msg = msg.replaceAll("%", "");

          let results = [...msg.matchAll(/\[(\w*)\]/g)];
          results = results.map((r) => r[1]);
          if (
            results.length < 3 ||
            results[0].length < 2 ||
            results[1].length < 2 ||
            results[2].length < 2
          ) {
            if (results.length == 2) {
              let statusMsg = msg
                .replace(results[0], "")
                .replace(results[1], "")
                .split("]")[1]
                .split("[")[0];
              if (
                compareTwoStrings(statusMsg, "forcefullyslaughtered") >=
                  NAME_CONFIDENCE ||
                compareTwoStrings(statusMsg, "wasunfairlykilledjby") >=
                  NAME_CONFIDENCE
              )
                return;
            }
            errors++;
            return;
          }
          let statusMsg = msg
            .replace(results[0], "")
            .replace(results[1], "")
            .replace(results[2], "")
            .split("]")[1]
            .split("[")[0];
          const memberName = results[0];
          const killedName = results[1];
          let guild = results[2];
          const result = guilds.find(
            (g) => compareTwoStrings(guild, g) >= NAME_CONFIDENCE
          );
          if (result) guild = result;
          else guilds.push(guild);

          let member = Person.findOrCreatePerson(members, memberName);
          let enemy = Person.findOrCreatePerson(enemies, killedName, guild);

          if (statusMsg.length > 7) {
            member.addDeath(enemy, time);
            enemy.addKill(member, time);
            currentLogs.push(new Log(enemy, member, time));
          } else {
            member.addKill(enemy, time);
            enemy.addDeath(member, time);
            currentLogs.push(new Log(member, enemy, time));
          }
        });
        let prevLog = null;
        for (let i = 0; i < currentLogs.length; i++) {
          let log = currentLogs[i];
          if (!prevLog) prevLog = log;
          else {
            if (log.time < prevLog.time) {
              log.time = null;
            }
          }
        }
        logs = logs.concat(currentLogs);
      });
      logs.sort((a, b) => (a.time < b.time ? -1 : 1));
      members
        .concat(enemies)
        .map((m) => m.logs.sort((a, b) => (a.time < b.time ? -1 : 1)));
      members.sort((a, b) => b.kills - a.kills);
      enemies.sort((a, b) => b.kills - a.kills);
      /*       members.forEach((m) => console.log(m.getInfo()));
      enemies.forEach((e) => console.log(e.getInfo()));
      members.forEach((m) => console.log(m.logs));
      console.log(
        `Errors: ${errors}. Total analyzed messages: ${messages}. ${
          (messages - errors) / messages
        }`
      ); */
      /*  members = members.map((m) => m.getObject());
      enemies = enemies.map((e) => e.getObject());
      logs = logs.map((l) => l.getObject()); */
      return {
        members: members,
        enemies: enemies,
        guilds: guilds,
        errors: errors,
        messages: messages,
        logs: logs,
      };
    },
  },
};
</script>
