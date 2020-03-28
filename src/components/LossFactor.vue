<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title>Loss Factors</v-card-title>
        <v-card-text>
          <v-row>
            <v-col>
              <v-data-table
                :headers="Headers"
                :items="SpeciesList"
                hide-default-footer
                :sort-by="['species_name']"
              >
                <template v-slot:item.loss_factor="props">
                  <v-edit-dialog
                    @save="save(props.item)"
                    @close="save(props.item)"
                    @cancel="cancel"
                  >
                    {{ props.item.loss_factor }}%
                    <template v-slot:input>
                      <v-text-field
                        v-model="props.item.loss_factor"
                        label="Alive"
                        single-line
                        autofocus
                      ></v-text-field>
                    </template>
                  </v-edit-dialog>
                </template>

                <template v-slot:item.loss_factor_dead="props">
                  <v-edit-dialog
                    @save="save(props.item)"
                    @close="save(props.item)"
                    @cancel="cancel"
                  >
                    {{ props.item.loss_factor_dead }}%
                    <template v-slot:input>
                      <v-text-field
                        v-model="props.item.loss_factor_dead"
                        label="Dead"
                        single-line
                        autofocus
                      ></v-text-field>
                    </template>
                  </v-edit-dialog>
                </template>
              </v-data-table>

              <v-snackbar v-model="snack" :timeout="2000" :color="snackColor">
                {{ snackText }}
                <v-btn text @click="snack = false">Close</v-btn>
              </v-snackbar>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import axios from "axios";
export default {
  name: "LossFactorTable",
  props: ["value", "Internet", "Config"],
  data: () => ({
    SelectedSpecies: null,
    snack: false,
    snackColor: "",
    snackText: "",
    Headers: [
      { text: "Species Name", value: "species_name" },
      { text: "Loss Factor Alive", value: "loss_factor" },
      { text: "Loss Factor Dead", value: "loss_factor_dead" }
    ]
  }),
  computed: {
    SpeciesList: function() {
      const result = [];
      const map = new Map();
      for (const item of this.value) {
        if (!map.has(item.species_name)) {
          map.set(item.species_name, true); // set any value to Map
          result.push({
            species_name: item.species_name,
            loss_factor: item.loss_factor,
            loss_factor_dead: item.loss_factor_dead
          });
        }
      }
      return result;
    }
  },
  methods: {
    save: function(Changed) {
      this.UpdateTreeData(Changed);
    },
    cancel: function() {
      this.snack = true;
      this.snackColor = "error";
      this.snackText = "Canceled";
    },
    UpdateTreeData: function(data) {
      let v = this;
      axios
        .post(
          "https://tree-con.herokuapp.com/api/v1/core/species/",
          data,
          v.Config
        )
        .then(function(response) {
          if (response.data.id) {
            v.snack = true;
            v.snackColor = "success";
            v.snackText = "Data saved";
          }
        })
        .catch(function(error) {
          v.snack = true;
          v.snackColor = "error";
          v.snackText = error;
          alert(error);
          return null;
        });
    }
  }
};
</script>

<style>
</style>