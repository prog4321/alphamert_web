import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

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













app.get("/edit/:id", async (req, res) => {
  try {
    const ratings = await axios.get(`${apiURL}/rating`);
    const months = await axios.get(`${apiURL}/month`);
    const review = await axios.get(`${apiURL}/review/${req.params.id}`);
    res.render("modify.ejs", {
                ratings: ratings.data,
                months: months.data,
                review: review.data,
                heading: "Edit Review",
                submit: "Update" });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error });
  };
});

app.get("/data", async (req, res) => {
  try {
    var queryString = '';
    Object.entries(req.query).forEach(([key, value]) => {
      if (key === 'type') {
        queryString = '?type=' + value;
      } else {
        queryString = queryString + '&' + key + '=' + value;
      };
    });
    const result = await axios.get(`${apiURL}/data${queryString}`);
    res.json(result.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  };
});

app.post("/add-review", async (req, res) => {
  try {
    var queryString = '?';
    var initialKey = true;
    Object.entries(req.body).forEach(([key, value]) => {
      if (initialKey) {
        queryString = '?' + key + '=' + value;
        initialKey = false;
      } else {
        queryString = queryString + '&' + key + '=' + value;
      };
    });
    const result = await axios.get(`${apiURL}/validate-review${queryString}`);
    if (result.data.isValid) {
      await axios.post(`${apiURL}/add-review`, req.body);
      res.redirect("/");
    } else {
      throw result.data.error;
    };
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error });
  };
});

app.post("/update-review", async (req, res) => {
  try {
    var queryString = '?';
    var initialKey = true;
    Object.entries(req.body).forEach(([key, value]) => {
      if (initialKey) {
        queryString = '?' + key + '=' + value;
        initialKey = false;
      } else {
        queryString = queryString + '&' + key + '=' + value;
      };
    });
    const result = await axios.get(`${apiURL}/validate-review${queryString}`);
    if (result.data.isValid) {
      await axios.patch(`${apiURL}/update-review`, req.body);
      res.redirect("/");
    } else {
      throw result.data.error;
    };
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error });
  };
});

app.get("/delete-review/:id", async (req, res) => {
  try {
    axios.delete(`${apiURL}/delete-review/${req.params.id}`);
    res.redirect("/");
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error });
  };
});












// Partially update a post
app.post("/api/posts/:id", async (req, res) => {
  console.log("called");
  try {
    const response = await axios.patch(
      `${API_URL}/posts/${req.params.id}`,
      req.body
    );
    console.log(response.data);
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: "Error updating post" });
  }
});

// Delete a post
app.get("/api/posts/delete/:id", async (req, res) => {
  try {
    await axios.post(`${apiURL}/posts/${req.params.id}`);
    res.redirect("/");
  } catch (error) {
    res.status(500).json({ message: "Error deleting post" });
  }
});

app.listen(port, () => {
  console.log(`Backend webserver is running on http://localhost:${port}`);
});
