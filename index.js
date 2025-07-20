import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 5000;

var db = new pg.Client({
  user: "alphamert_user",
  host: "dpg-d050fcmuk2gs73e4h7d0-a", // host name if node server is running on render.com
  database: "alphamert",
  password: "alphamert",
  port: 5432 // include "ssl:true" as additional parameter if node server is not running on render.com
  });
db.connect();

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", async (req, res) => {
  const result = await db.query(
    "SELECT id, name FROM alphamert.nodes " +
    "ORDER BY name, id ASC;"
  );
  let nodes = [];
  result.rows.forEach((result) => {
    nodes.push({
                id: result.id,
                name: result.name
              });
    // console.log("id:" + result.id);
    });
  res.render("index.ejs", {
              nodes: nodes,
            });
});

app.post("/show-best-route", async (req, res) => {

  const result = await db.query(
    "SELECT best_routes.node_id as node_id, " +
    "nodes.name as node_name, " +
    "best_routes.cost as cost " +
    "FROM alphamert.best_routes INNER JOIN alphamert.nodes ON nodes.id = best_routes.node_id " +
    "WHERE route_mapping_id = (SELECT id FROM alphamert.route_mappings " +
    "WHERE start_node_id = $1 AND end_node_id = $2 AND is_peak_hour = $3) " +
    "ORDER BY route_index ASC;", [req.body.startNodeId, req.body.endNodeId, req.body.period]
  );

  const result_node = await db.query(
    "SELECT id, name FROM alphamert.nodes " +
    "ORDER BY name, id ASC;"
  );

  let bestRoute = [];
  let duration = 0;
  result.rows.forEach((result) => {
    duration += parseFloat(result.cost);
    bestRoute.push({
                node_id: result.node_id,
                node_name: result.node_name,
                cost: result.cost
              });
  });

  let nodes = [];
  result_node.rows.forEach((result_node) => {
    nodes.push({
                id: result_node.id,
                name: result_node.name
              });
  });

  res.render("index.ejs", {
              nodes: nodes,
              bestRoute: bestRoute,
              duration: duration,
              period: req.body.period,
              startNodeId: req.body.startNodeId,
              endNodeId: req.body.endNodeId
            });
});