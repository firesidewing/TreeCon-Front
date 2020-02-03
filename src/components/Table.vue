<template>
  <v-row>
    <v-col>
      <v-data-table 
        :headers="Headers" 
        :items="value"
        hide-default-footer
        :sort-by="['tree']"
        ><template v-slot:item.action="{ item }">
          <v-icon 
          small
          color="error"
          @click="DeleteTree(item)"
        >mdi-delete</v-icon>
        </template>
        
        <template v-slot:item.tree_species="props">
          <v-edit-dialog 
            @save="save(props.item)" 
            @cancel="cancel">
            {{ Species[props.item.tree_species -1].species_name }}
            <template v-slot:input>
              <v-select
                v-model="props.item.tree_species"
                label="Species"
                :items="Species"
                item-text="species_name"
                item-value="id"
                single-line
              ></v-select>
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.dbh="props">
          <v-edit-dialog 
            @save="save(props.item)" 
            @cancel="cancel">
            {{ props.item.dbh }}
            <template v-slot:input>
              <v-text-field
                v-model="props.item.dbh"
                label="DBH"               
                single-line
              ></v-text-field>
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.height="props">
          <v-edit-dialog 
            @save="save(props.item)" 
            @cancel="cancel">
            {{ props.item.height }}
            <template v-slot:input>
              <v-text-field
                v-model="props.item.height"
                label="Height"               
                single-line
              ></v-text-field>
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.gross_piece_size="props">
          <v-edit-dialog 
            @save="save(props.item)" 
            @cancel="cancel">
            {{ props.item.gross_piece_size }}
            <template v-slot:input>
              <v-text-field
                v-model="props.item.gross_piece_size"
                label="Gross PS"               
                single-line
              ></v-text-field>
            </template>
          </v-edit-dialog>
        </template>

        <template v-slot:item.net_piece_size="props">
          <v-edit-dialog 
            @save="save(props.item)" 
            @cancel="cancel">
            {{ props.item.net_piece_size }}
            <template v-slot:input>
              <v-text-field
                v-model="props.item.net_piece_size"
                label="Net PS"               
                single-line
              ></v-text-field>
            </template>
          </v-edit-dialog>
        </template>
        
      </v-data-table>
      
      <v-btn 
        class="my-5" 
        color="secondary" 
        @click="AddTree"
      >Add Tree</v-btn>

      <v-snackbar v-model="snack" :timeout="3000" :color="snackColor">
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
    snack: false,
    snackColor: "",
    snackText: "",
    Headers: [
      { text: 'Actions', value: 'action', sortable: false },
      { text: "Tree", value: "tree" },
      { text: "Species", value: "tree_species" },
      { text: "DBH", value: "dbh" },
      { text: "Height", value: "height" },
      { text: "Gross PS", value: "gross_piece_size" },
      { text: "Net PS", value: "net_piece_size" },      
    ]
  }),
  methods: {
    save: function(Changed) {
      this.snack = true;
      this.snackColor = "success";
      this.snackText = "Data saved";
      this.SaveTreeData(Changed)        
    },
    cancel: function() {
      this.snack = true;
      this.snackColor = "error";
      this.snackText = "Canceled";
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
        tree_species: 1,
        dbh: 0,
        height: 0,
        gross_piece_size: 0,
        net_piece_size: 0
      };

      if (v.Internet) {
        v.SaveTreeData(NewData)
        v.value.push(NewData)        
      } else {
        v.value.push(NewData);
      }
    },
    DeleteTree: function(item) {
      let v = this
      const index = v.value.indexOf(item)
      v.value.splice(index, 1)

      axios.delete("https://tree-con.herokuapp.com/api/v1/core/plot-datas/" + item.id + '/', v.Config)
        .then(function(response) {
          if(response.status == 204){
            v.value = v.value.filter(function( obj ) {
              return obj.id !== item.id;
            });
          }          
        })
        .catch(function(error) {
          alert(error);
          v.RetryLogin();
        });
    },
    SaveTreeData: function(data) {
      let v = this
      axios
        .post(
          "https://tree-con.herokuapp.com/api/v1/core/plot-datas/",
          data,
          v.Config
        )
        .then(function(response) {
          if (response.data.id) {
            return response.data.id
          }
        })
        .catch(function(error) {
          alert(error);
        });
    }
  }
};
</script>

<style>
</style>