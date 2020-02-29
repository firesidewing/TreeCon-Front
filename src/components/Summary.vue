<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Summary of Plots</v-card-title>
        <v-card-text>
          <v-row>
            <v-col>
              <apexchart
                v-if="TreeType && Options"
                ref="TreePie"
                width="100%"
                type="donut"
                :options="Options"
                :series="Object.values(TreeType)"
              ></apexchart>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: "Summary",
  props: ["Plots", "Species"],
  data: function() {
    return {};
  },
  computed: {
    TreeType: function() {
      if (this.Plots) {
        let res = {};
        let v = this;

        v.Plots.forEach(Plot => {
          Plot.PlotData.forEach(d => {
            res[v.Species[d.tree_species]] =
              (res[v.Species[d.tree_species]] || 0) + 1;
          });
        });
        return res;
      } else {
        return null;
      }
    },
    Options: function() {
      if (this.TreeType) {
        let chartOptions = {
          labels: Object.keys(this.TreeType),
          legend: { position: "top" }
        };
        return chartOptions;
      } else {
        return null;
      }
    }
  }
};
</script>