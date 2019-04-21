<template>
  <v-container>
    <v-form>
      <v-container>
        <v-layout text-xs-center wrap>
          <v-flex xs6 sm2 d-flex>
            <v-select
              :items="dataFiles"
              item-text="text"
              item-value="value"
              label="Data File"
              v-model="selectedData"
            ></v-select>
          </v-flex>
          <v-flex xs5 sm2 d-flex>
            <v-select
              :items="availableModels"
              label="Model"
              v-model="selectedModel"
            ></v-select>
          </v-flex>
        </v-layout>
      </v-container>
    </v-form>
    <v-flex sm12 d-flex>
      <v-card>
        <v-card-title>
          <span class="title font-weight-light">Charted Data</span>
        </v-card-title>
        <v-container>
          <tensorflow-example
            :sales-data-container="filteredSalesDataContainer"
          />
        </v-container>
      </v-card>
    </v-flex>
    <v-flex sm12 d-flex>
      <v-expansion-panel>
        <v-expansion-panel-content>
          <template v-slot:header>
            <div>Metrics</div>
          </template>
          <v-flex xs12 sm6 md4 lg3>
            <v-container>
              <v-card>
                <v-card-title>
                  <h4>Scaling</h4>
                </v-card-title>
                <v-divider />
                <v-list dense>
                  <v-list-tile>
                    <v-list-tile-content>Min Units Sold:</v-list-tile-content>
                    <v-list-tile-content class="align-end">{{
                      filteredSalesDataContainer.minUnitsSold
                    }}</v-list-tile-content>
                  </v-list-tile>
                  <v-list-tile>
                    <v-list-tile-content>Max Units Sold:</v-list-tile-content>
                    <v-list-tile-content class="align-end">{{
                      filteredSalesDataContainer.maxUnitsSold
                    }}</v-list-tile-content>
                  </v-list-tile>
                </v-list>
              </v-card>
            </v-container>
          </v-flex>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-flex>
    <v-flex xs12 sm12 d-flex>
      <v-expansion-panel>
        <v-expansion-panel-content>
          <template v-slot:header>
            <div>Sales Data</div>
          </template>
          <v-flex xs12 sm4 d-flex>
            <v-container>
              <v-card>
                <v-data-table
                  :headers="salesDataHeaders"
                  :items="filteredData"
                  class="elevation-1"
                >
                  <template v-slot:items="props">
                    <td>{{ props.item.yearMonthString }}</td>
                    <td class="text-xs-right">{{ props.item.unitsSold }}</td>
                  </template>
                </v-data-table>
              </v-card>
            </v-container>
          </v-flex>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-flex>
  </v-container>
</template>
<script>
import DataMixin from "../mixins/DataMixin";
import TensorflowExample from "../components/TensorflowJS";

export default {
  mixins: [DataMixin],
  components: {
    TensorflowExample
  },
  data() {
    return {
      salesDataHeaders: [
        {
          text: "Month",
          align: "left",
          sortable: true,
          value: "salesMonth"
        },
        { text: "Units Sold", value: "unitsSold" }
      ]
    };
  }
};
</script>
<style lang="sass" scoped></style>
