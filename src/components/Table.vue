<template>
  <v-row>
    <v-col>
      <v-data-table :headers="Headers" :items="value" hide-default-footer :sort-by="['tree']">
        <template v-slot:item.action="{ item }">
          <v-icon small color="error" @click="DeleteTree(item)">mdi-delete</v-icon>
        </template>

        <template v-slot:item.tree_species="props">
          <v-edit-dialog @save="save(props.item)" @close="save(props.item)" @cancel="cancel">
            {{ Species.find(e => e.id == props.item.tree_species) ? Species.find(e => e.id == props.item.tree_species).species_name : '' }}
            <template
              v-slot:input
            >
              <v-select
                v-model="props.item.tree_species"
                label="Species"
                :items="SpeciesList"
                item-text="species_name"
                item-value="id"
                single-line
              ></v-select>
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.blowdown="props">
          <v-edit-dialog @save="save(props.item)" @close="save(props.item)" @cancel="cancel">
            {{ props.item.blowdown ? "Yes": "No" }}
            <template v-slot:input>
              <v-checkbox v-model="props.item.blowdown" label="Blowdown" color="success"></v-checkbox>
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.alive="props">
          <v-edit-dialog @save="save(props.item)" @close="save(props.item)" @cancel="cancel">
            {{ props.item.alive ? "Yes": "No" }}
            <template v-slot:input>
              <v-checkbox v-model="props.item.alive" label="Alive" color="success"></v-checkbox>
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.dbh="props">
          <v-edit-dialog @save="save(props.item)" @close="save(props.item)" @cancel="cancel">
            {{ props.item.dbh }}
            <template v-slot:input>
              <v-text-field v-model="props.item.dbh" label="DBH" single-line autofocus></v-text-field>
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.height="props">
          <v-edit-dialog @save="save(props.item)" @close="save(props.item)" @cancel="cancel">
            {{ props.item.height }}
            <template v-slot:input>
              <v-text-field v-model="props.item.height" label="Height" single-line autofocus></v-text-field>
            </template>
          </v-edit-dialog>
        </template>
      </v-data-table>

      <v-btn class="my-5" color="secondary" @click="AddTree">Add Tree</v-btn>

      <v-snackbar v-model="snack" :timeout="2000" :color="snackColor">
        {{ snackText }}
        <v-btn text @click="snack = false">Close</v-btn>
      </v-snackbar>
    </v-col>
  </v-row>
</template>

<script>
import axios from "axios";
export default {
  name: "PlotTable",
  props: ["value", "Internet", "Config", "PlotKey", "Species"],
  data: () => ({
    SelectedSpecies: null,
    snack: false,
    snackColor: "",
    snackText: "",
    Headers: [
      { text: "Actions", value: "action", sortable: false },
      { text: "Tree", value: "tree" },
      { text: "Species", value: "tree_species" },
      { text: "BD", value: "blowdown" },
      { text: "Alive", value: "alive" },
      { text: "DBH", value: "dbh" },
      { text: "Height", value: "height" },
      { text: "Merch m^3", value: "net_piece_size" },
      { text: "Total m^3", value: "gross_piece_size" }
    ]
  }),
  computed: {
    SpeciesList: function() {
      const result = [];
      const map = new Map();
      for (const item of this.Species) {
        if (!map.has(item.species_name)) {
          map.set(item.species_name, true); // set any value to Map
          result.push({
            species_name: item.species_name,
            id: item.id
          });
        }
      }
      return result;
    }
  },
  methods: {
    save: function(Changed) {
      this.snack = true;
      this.snackColor = "success";
      this.snackText = "Data saved";
      this.UpdateVols(Changed);
    },
    cancel: function() {
      this.snack = true;
      this.snackColor = "error";
      this.snackText = "Canceled";
    },
    UpdateVols: function(Row) {
      let name = this.SpeciesList.find(e => e.id == Row.tree_species)
        .species_name;
      let data = this.Species.filter(s => s.species_name === name);
      let merch = data.filter(d => d.vol_type === "Merch")[0];
      let total = data.filter(t => t.vol_type === "Total")[0];

      Row.gross_piece_size = (
        Math.exp(total.vol_const_a) *
        Math.pow(Row.dbh, total.vol_const_b) *
        Math.pow(Row.height, total.vol_const_c)
      ).toFixed(3);
      Row.net_piece_size = (
        Math.exp(merch.vol_const_a) *
        Math.pow(Row.dbh, merch.vol_const_b) *
        Math.pow(Row.height, merch.vol_const_c)
      ).toFixed(3);

      this.UpdateTreeData(Row);
    },
    AddTree: function() {
      let v = this;

      let UnusedId = 1;
      let Used = this.value.reduce(function(o, v) {
        o[v["tree"]] = true;
        return o;
      }, {});
      for (var i = 1; Used[i]; i++) {
        UnusedId = i <= 0 ? 1 : i + 1;
      }

      let NewData = {
        plot_key: v.PlotKey,
        tree: UnusedId,
        tree_species: v.SpeciesList[0].id,
        dbh: 0,
        height: 0,
        gross_piece_size: 0.0,
        net_piece_size: 0.0,
        blowdown: false,
        alive: true
      };

      if (v.Internet) {
        axios
          .post(
            "https://tree-con.herokuapp.com/api/v1/core/plot-datas/",
            NewData,
            v.Config
          )
          .then(function(response) {
            if (response.data.id) {
              NewData["id"] = response.data.id;
              v.value.push(NewData);
            }
          })
          .catch(function(error) {
            alert(error);
            return null;
          });
      } else {
        v.value.push(NewData);
      }
    },
    DeleteTree: function(item) {
      let v = this;
      const index = v.value.indexOf(item);

      axios
        .delete(
          "https://tree-con.herokuapp.com/api/v1/core/plot-datas/" +
            item.id +
            "/",
          v.Config
        )
        .then(function(response) {
          if (response.status == 204) {
            v.value.splice(index, 1);
          }
        })
        .catch(function(error) {
          alert(error);
        });
    },
    UpdateTreeData: function(data) {
      let v = this;
      axios
        .post(
          "https://tree-con.herokuapp.com/api/v1/core/plot-datas/",
          data,
          v.Config
        )
        .then(function(response) {
          if (response.data.id) {
            return response.data.id;
          }
        })
        .catch(function(error) {
          alert(error);
          return null;
        });
    }
  }
};
</script>

<style>
</style>