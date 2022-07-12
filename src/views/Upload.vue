<template>
  <v-app id="inspire" class="page">
    <v-main class="pt-0" style="display: flex; align-items: center">
      <v-container
        style="display: flex; flex-direction: column; align-items: center"
      >
        <div class="text-center text-h2 mb-5">War Analyzer</div>

        <v-hover v-slot="{ hover }">
          <v-sheet
            rounded
            height="30vh"
            width="50%"
            class="ma-5"
            style="border: solid #2196f3 2px"
            :elevation="hover ? 6 : 2"
            @click="$refs.fileUpload.click()"
          >
            <div ref="dropContainer" style="height: 100%">
              <div class="dropContainer" v-if="images.length == 0">
                Drag or click to upload!
              </div>
              <v-container
                style="
                  display: flex;
                  flex-wrap: wrap;
                  justify-content: space-evenly;
                  max-height: 100%;
                  overflow-y: auto;
                "
              >
                <v-card
                  style="width: 115px"
                  v-for="img in images"
                  :key="img.name"
                  class="ma-1"
                >
                  <v-app-bar dense flat color="rgba(0, 0, 0, 0)" elevation="0">
                    <v-toolbar-title class="white--text pl-0">
                      {{ img.name }}
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="white"
                      icon
                      dense
                      small
                      @click.stop="images.splice(images.indexOf(img), 1)"
                    >
                      <v-icon small dense>mdi-close</v-icon>
                    </v-btn>
                  </v-app-bar>
                  <v-card-text class="text-center pt-0">
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
              </v-container>
            </div>
          </v-sheet>
        </v-hover>
        <input
          type="file"
          ref="fileUpload"
          accept="image/*, .json"
          hidden
          multiple="multiple"
        />
        <v-row class="justify-center mt-5">
          <v-btn
            outlined
            color="primary"
            ref="analyzeButton"
            dark
            :disabled="images.length == 0"
            @click="
              $router.push({
                name: 'Analyze',
                params: { images: images, settings: settings },
              })
            "
            >Analyze</v-btn
          >
        </v-row>
        <v-row class="justify-center mt-5">
          <v-dialog
            v-model="settingsDialog"
            transition="dialog-bottom-transition"
            width="50%"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn color="primary" dark v-bind="attrs" v-on="on" icon>
                <v-icon>mdi-cog</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-toolbar dark color="primary">
                <v-btn icon dark @click="settingsDialog = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
                <v-toolbar-title>Settings</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items> </v-toolbar-items>
              </v-toolbar>
              <v-divider></v-divider>
              <v-list three-line subheader>
                <v-subheader>General</v-subheader>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>Multiple Workers</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-row class="d-flex flex-wrap">
                        <p
                          class="ma-5"
                          style="bottom: -1.5px; position: relative"
                        >
                          {{ settings.multipleWorkers }}
                        </p>
                        <v-slider
                          @change="saveSettings"
                          dense
                          v-model="settings.multipleWorkers"
                          hide-details
                          max="10"
                          min="1"
                          style="align-items: center; max-width: 86%"
                        ></v-slider>
                      </v-row>
                      Speeds up the image processing. A high amount of workers
                      will cost alot of RAM, which might cause the website to
                      crash.</v-list-item-subtitle
                    >
                  </v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>Scale</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-row class="d-flex flex-wrap">
                        <p
                          class="ma-5"
                          style="bottom: -1.5px; position: relative"
                        >
                          {{ settings.scale }}
                        </p>
                        <v-slider
                          @change="saveSettings"
                          dense
                          v-model="settings.scale"
                          hide-details
                          max="5"
                          min="1"
                          style="align-items: center; max-width: 86%"
                        ></v-slider>
                      </v-row>
                      Amount of scaling that is applied to the images. It can
                      improve the results, but it will take more time to
                      process.</v-list-item-subtitle
                    >
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card>
          </v-dialog>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.dropContainer {
  font-size: 1.2rem !important;
  font-weight: 400;
  line-height: 2rem;
  letter-spacing: normal !important;
  font-family: "Roboto", sans-serif !important;
  text-align: center;
  align-items: center !important;
  justify-content: center !important;

  user-select: none;
  pointer-events: none;

  height: 100%;
  display: flex;
}
</style>
<style>
.v-slider__thumb:before {
  color: transparent !important;
}
</style>
<script>
export default {
  name: "Upload",
  data: () => ({
    images: [],
    settings: { multipleWorkers: 3, scale: 2 },
    settingsDialog: null,
  }),
  mounted() {
    this.loadSettings();

    this.$refs.dropContainer.ondragover = this.$refs.dropContainer.ondragenter =
      function (evt) {
        evt.preventDefault();
      };

    this.$refs.dropContainer.ondrop = async (evt) => {
      evt.preventDefault();
      const files = [...evt.dataTransfer.files];
      if (files.every((f) => f.type.match(/(application\/json)|(image\/)/))) {
        this.uploadFiles([...evt.dataTransfer.files]);
      }
    };

    this.$refs.fileUpload.onchange = (async (evt) => {
      this.uploadFiles([...evt.target.files]);
    }).bind(this);
  },
  methods: {
    saveSettings() {
      window.localStorage.setItem("settings", JSON.stringify(this.settings));
    },
    loadSettings() {
      if (window.localStorage.getItem("settings"))
        this.settings = JSON.parse(window.localStorage.getItem("settings"));
    },
    async uploadFiles(files) {
      const jsonFile = files.find((f) => f.type.match(/application\/json/));
      if (jsonFile) {
        let reader = new FileReader();
        reader.onload = function (e) {
          const results = JSON.parse(e.target.result);
          const allPlayers = results.members.concat(results.enemies);
          results.logs.map((log) => {
            const player1 = allPlayers.find((p) => p.name == log.person1);
            const player2 = allPlayers.find((p) => p.name == log.person2);
            log.person1 = player1;
            log.person2 = player2;
            if (!player1.logs) player1["logs"] = [];
            if (!player2.logs) player2["logs"] = [];
            player1.logs.push(log);
            player2.logs.push(log);
            log.time = log.time ? new Date(log.time) : null;
          });

          this.$router.push({
            name: "Results",
            params: { results: results },
          });
        }.bind(this);
        reader.readAsText(jsonFile);
        return;
      }
      let newImages = files.filter(
        (img) => !this.images.find((img2) => img2.name == img.name)
      );
      //this.$refs.analyzeButton.$el.disabled = true;
      //this.$refs.analyzeButton.$el.classList.add("v-btn--disabled");
      //newImages = await Promise.all(newImages.map((i) => this.scaleImage(i)));
      this.images = this.images.concat(newImages);
      //this.$refs.analyzeButton.$el.disabled = false;
      //this.$refs.analyzeButton.$el.classList.remove("v-btn--disabled");
    },
  },
};
</script>
