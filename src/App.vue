<template>
  <v-app id="inspire">

    <Login v-on:auth-success="LoggedOn = true" v-show="ShowOnline && !LoggedOn"></Login>

    <v-navigation-drawer v-model="drawer" app clipped dark color="primary">
      <v-list v-if="SelectedLocation">
        <v-list-item 
          link 
          v-for="Plot in PlotList" 
          v-bind:key="Plot.PlotNumber">
          <v-list-item-action @click="SelectPlot(Plot)">
            <v-icon>mdi-pine-tree</v-icon>
          </v-list-item-action>
          <v-list-item-content @click="SelectPlot(Plot)">
            <v-list-item-title>Plot {{Plot.plot_number}}</v-list-item-title>
          </v-list-item-content>
          <v-btn 
            @click.stop="DeletePlot(Plot.plot_number)"
            text 
            icon 
            color="accent">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-list-item>
        
      </v-list>
      <template v-slot:append>
        <div class="pa-2" v-if="SelectedLocation">
          <v-btn 
            block
            @click.stop="AddPlot"
            color="secondary"
          >Add Plot</v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar app clipped-left color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>Tree - Con</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-autocomplete
            v-model="SelectedLocation"
            :items="Locations"
            label="Location"
            item-text="name"
            item-value="id"
            @change="LocationChange"
            class="mt-3"
            clearable
            dense
          ></v-autocomplete>
    </v-app-bar>

    <v-overlay :value="Loading">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>

    <v-content>
      <v-container fluid>
        <v-row v-if="SelectedLocation">
          <v-col sm=3 md=2 lg=2 v-if="SelectedLocation">
            <v-fade-transition>
              <v-card>
                <v-card-title class="text-no-wrap">BAF</v-card-title>
                <v-card-text class="headline text-no-wrap">{{ BAF }}</v-card-text>
              </v-card>
            </v-fade-transition>
          </v-col>
          <v-col sm=3 md=2 lg=2 v-if="PlotStats">
            <v-fade-transition>
              <v-card>
                <v-card-title class="text-no-wrap">Slope</v-card-title>
                <v-card-text class="headline text-no-wrap">{{ PlotStats.slope }}%</v-card-text>
              </v-card>
            </v-fade-transition>
          </v-col>
          <v-col sm=3 md=2 lg=2 v-if="PlotStats">
            <v-fade-transition>
              <v-card>
                <v-card-title class="text-no-wrap">Alive</v-card-title>
                <v-card-text class="headline text-no-wrap">{{ PlotStats.alive_trees }}</v-card-text>
              </v-card>
            </v-fade-transition>
          </v-col>
          <v-col sm=3 md=2 lg=2 v-if="PlotStats">
            <v-fade-transition>
              <v-card>
                <v-card-title class="text-no-wrap">Dead</v-card-title>
                <v-card-text class="headline text-no-wrap">{{ PlotStats.dead_pine }}</v-card-text>
              </v-card>
            </v-fade-transition>
          </v-col>
          <v-col sm=3 md=2 lg=2 v-if="PlotStats">
            <v-fade-transition>
              <v-card>
                <v-card-title class="text-no-wrap">Type</v-card-title>
                <v-card-text class="headline text-no-wrap">{{ PlotStats.timber_type }}</v-card-text>
              </v-card>
            </v-fade-transition>
          </v-col>
          <v-col sm=3 md=2 lg=2 v-if="PlotStats">
            <v-fade-transition>
              <v-card>
                <v-card-title class="text-no-wrap">BD</v-card-title>
                <v-card-text class="headline text-no-wrap">{{ PlotStats.bd_percent }}%</v-card-text>
              </v-card>
            </v-fade-transition>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-fade-transition>
              <Table 
                v-if="SelectedPlotData" 
                v-model="SelectedPlotData"
                :Config="Config"
                :Internet="Internet"
                :PlotKey="SelectedPlot"
                :Species="Species"
              ></Table>
            </v-fade-transition>            
          </v-col>
        </v-row>
      </v-container>
    </v-content>

    <v-footer app>
      <span>Josh Dollinger &copy; 2019</span>
    </v-footer>

  </v-app>
</template>

<script>
import axios from "axios";
import Login from "./components/Login";
import Table from "./components/Table"

const Api = {
  Base: "https://tree-con.herokuapp.com/api/v1/",
  LatLong: "core/lat-longs/",
  Locations: "core/locations/",
  PlotData: "core/plot-datas/",
  Plots: "core/plot/",
  Species: "core/species/"
};

export default {
  name: "TreeCon",
  components: {
    Login,
    Table
  },
  data: () => ({
    drawer: false,
    Loading: false,
    Internet: navigator.onLine,
    ShowOnline: true,
    LoggedOn: false,
    Locations: [],
    SelectedLocation: '',
    Plots: [{}],
    SelectedPlot: '',
    SelectedPlotData: '',
    Species: {},    
    Config: {
      headers: {
        Authorization: ''
      }
    }
  }),
  localStorage: {
    LocalPlots: {
      type: Array
    },
    LocalSpecies: {
      type: Object
    },
    LocalLocation: {
      type: Object
    },
  },
  created() {},
  mounted() {
    window.addEventListener("online", this.UpdateOnlineStatus);
    window.addEventListener("offline", this.UpdateOnlineStatus);
    this.CheckLocal(); 
  },
  watch: {
    Internet(v) {
      if (v) {
        this.ShowOnline = true;
        setTimeout(() => {
          this.ShowOnline = false;
        }, 1000);
      }
    },
    LoggedOn() {
      if (this.LoggedOn) {
        this.Config = this.$localStorage.get("TokenConfig");
        this.GetLocations();
      }
    },
  },
  computed: {
    PlotList: function() {
      let Sorted = this.Plots.slice(0).sort(function(a, b){return a.plot_number - b.plot_number})
      this.$localStorage.set("LocalPlots", Sorted)
      return Sorted
    },
    BAF: function() {
      if(this.SelectedLocation && this.Internet){
        return this.Locations.find(o => o.id === this.SelectedLocation).baf
      } else{
        return this.Locations.baf;
      }      
    },
    PlotStats: function() {
      if(this.SelectedPlot){
        let obj = this.Plots.find(o => o.id === this.SelectedPlot)
        return Object.fromEntries(
          Object.entries(obj)
          .filter(([key]) => [
            'slope', 
            'alive_trees', 
            'dead_pine', 
            'bd_percent', 
            'gross_volume_ha', 
            'net_volume_ha', 
            'timber_type'
            ].includes(key))
        )
      } else {
        return null
      }
      
    }
  },
  methods: {
    updateOnlineStatus: function(e) {
      const { type } = e;
      this.Internet = type === "online";
    },
    GetLocations: function() {
      let v = this;      
      axios
        .get(Api.Base + Api.Locations + "?format=json", v.Config)
        .then(function(response) {
          v.Locations = response.data.results;
        })
        .catch(function(error) {
          alert(error);
          v.RetryLogin();
        });
    },
    GetPlotData: function() {
      let v = this;
      v.SelectedPlotData = ''
      if (v.Plots.length > 0 && v.Plots[0].id) {        
        v.Plots.forEach(Plot => {
          alert(JSON.stringify(Plot))
;          axios
            .get(Api.Base + Api.PlotData + "?plot_key=" + Plot.id + "&ordering=id&format=json", v.Config)
            .then(function(response) {
              v.$set(Plot, "PlotData", response.data.results);
              v.Loading = false
            })
            .catch(function(error) {
              alert(Api.Base + Api.PlotData + "?plot_key=" + Plot.id + "&ordering=id&format=json")
              alert(error);
              v.RetryLogin();
            });
        });
        v.$localStorage.set("LocalPlots", v.Plots)     
      } else {
        v.Loading = false
      }
    },
    GetSpecies: function() {
      let v = this
      axios
        .get(Api.Base + Api.Species + "?format=json", v.Config)
        .then(function(response) {
          v.Species = response.data.results
          v.$localStorage.set("LocalSpecies", v.Species)   
        })
        .catch(function(error) {
          alert(Api.Base + Api.Species + "?format=json");
          alert(error);
          v.RetryLogin();
        });
    },
    RetryLogin: function() {
      let v = this;
      v.LoggedOn = false;
      v.Loading = false;
    },
    LocationChange: function() {
      let v = this;
      if(!v.SelectedLocation) { return; }
      v.Loading = true
      axios
        .get(Api.Base + Api.Plots + "?location=" + v.SelectedLocation + "&ordering=id&format=json", v.Config)
        .then(function(response) {
          v.$set(v.Plots, response.data.results);    
          alert(response.data.results[0].id)      
          v.GetPlotData()
          v.GetSpecies()
          v.$localStorage.set("LocalLocation", v.Locations.find(o => o.id === v.SelectedLocation))
        })
        .catch(function(error) {
          alert(Api.Base + Api.Plots + "?location=" + v.SelectedLocation + "&ordering=id&format=json");
          alert(error);
          v.RetryLogin();
        });
    },
    SelectPlot: function(Plot) {
      this.SelectedPlotData = Plot.PlotData; 
      this.SelectedPlot = Plot.id
      this.drawer = false
    },
    AddPlot: function() {
      let UnusedId = 1;
      let v = this;
      let Used = this.Plots.reduce(function(o, v) {
          o[v['plot_number']] = true;
          return o;
      }, {});
      for (var i=1; Used[i]; i++){
        UnusedId = i <= 0 ? 1 : i + 1;
      }
      let PlotOb = {
        location: v.SelectedLocation,
        plot_number: UnusedId,
        PlotData: [],
        "slope": 0,
        "alive_trees": 0,
        "dead_pine": 0,
        "bd_percent": 0,
        "gross_volume_ha": 0,
        "net_volume_ha": 0,
        "timber_type": "Pi/Sx"
      }

      if(v.Internet){
        axios.post(Api.Base + Api.Plots, PlotOb, v.Config)
        .then(function(response) {
          if(response.data.id){
            PlotOb['id'] = response.data.id
            v.Plots.push(PlotOb)
          }         
          })
          .catch(function(error) {
            alert(error);
            v.RetryLogin();
          });
      } else{
        v.Plots.push(PlotOb)
      }
      
    },
    DeletePlot: function(PlotNumber) {
      let v = this
     
      if(v.Internet){
        let id = v.Plots.find(i => i.plot_number == PlotNumber).id
        axios.delete(Api.Base + Api.Plots + id + '/', v.Config)
        .then(function(response) {
          if(response.status == 204){
            v.Plots = v.Plots.filter(function( obj ) {
              return obj.plot_number !== PlotNumber;
            });
          }          
        })
        .catch(function(error) {
          alert(error);
          v.RetryLogin();
        });
      } else {
         v.Plots = v.Plots.filter(function( obj ) {
          return obj.plot_number !== PlotNumber;
        });
      }
    },
    CheckLocal: function() {
      if (localStorage.TokenConfig != "undefined") {
        this.Config = this.$localStorage.get("TokenConfig");
        this.LoggedOn = true;
      }
      if (localStorage.LocalPlots != "undefined") {
        this.Plots = this.$localStorage.get("LocalPlots");
      }
      if (localStorage.LocalSpecies != "undefined") {
        this.Species = this.$localStorage.get("LocalSpecies");
      }
      if (localStorage.LocalLocation != "undefined" && !this.Internet) {
        this.Locations = this.$localStorage.get("LocalLocation");
        this.SelectedLocation = this.$localStorage.get("LocalLocation").id;
      }
    }
  }
};
</script>

<style lang="sass">
  @import '../node_modules/roboto-fontface/css/roboto/roboto-fontface.css'
</style>
