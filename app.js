const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server is Running"));
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//GET API To Returns a list of all states in the state table

const convertToCamelCase = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const getStatesResponse = await db.all(getStatesQuery);
  const changeSnakeCaseToCamelCase = getStatesResponse.map((eachState) => {
    const getCamelCase = convertToCamelCase(eachState);
    return getCamelCase;
  });
  response.send(changeSnakeCaseToCamelCase);
});

//GET API To Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const getStateResponse = await db.get(getStateQuery);
  const getCamelCase = convertToCamelCase(getStateResponse);
  response.send(getCamelCase);
});

//POST API To Create a district in the district table, district_id is auto-incremented.

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `INSERT INTO 
                              district(district_name, state_id, cases, cured, active, deaths)
                              VALUES(
                                  '${districtName}',
                                   ${stateId},
                                   ${cases},
                                   ${cured},
                                   ${active},
                                   ${deaths});`;
  const getDistrictResponse = await db.run(addDistrictQuery);
  const districtDBObject = getDistrictResponse.lastID;
  response.send("District Successfully Added");
});

//GET API To Returns a district based on the district ID

const convertDistrictTableToCamelCase = (districtDetails) => {
  return {
    districtId: districtDetails.district_id,
    districtName: districtDetails.district_name,
    stateId: districtDetails.state_id,
    cases: districtDetails.cases,
    cured: districtDetails.cured,
    active: districtDetails.active,
    deaths: districtDetails.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictBYIdQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const getDistrictResponse = await db.get(getDistrictBYIdQuery);
  const getCamelCaseToDistrictTable = convertDistrictTableToCamelCase(
    getDistrictResponse
  );
  response.send(getCamelCaseToDistrictTable);
});

//DELETE API To Deletes a district from the district table based on the district ID.

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  const getDeleteResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//PUT API To Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `UPDATE district 
                              SET 
                                district_name = '${districtName}',
                                state_id = ${stateId},
                                cases = ${cases},
                                cured = ${cured},
                                active = ${active},
                                deaths = ${deaths}
                             WHERE 
                                district_id = ${districtId};`;
  const getDistrictResponse = await db.run(addDistrictQuery);
  response.send("District Details Updated");
});

//GET API TO Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const totalQuery = `SELECT 
                            SUM(cases) AS totalCases, 
                            SUM(cured) AS totalCured, 
                            SUM(active) AS totalActive, 
                            SUM(deaths) AS totalDeaths
                        FROM district  
                        WHERE state_id = ${stateId};`;
  const getTotal = await db.all(totalQuery);
  //const getSumOfAll = getTotalInCamelCases(getTotal);
  response.send(getTotal[0]);
});

//Returns an object containing the state name of a district based on the district ID

const getStateId = async (id) => {
  const stateId = id.state_id;
  //console.log(stateId);
  const getStateNameQuery = `SELECT state_name FROM state WHERE state_id = ${stateId};`;
  const getStateResponse = await db.get(getStateNameQuery);
  return getStateResponse;
};

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getDistrictBYIdQuery = `SELECT state_id FROM district WHERE district_id = ${districtId};`;
  const getDistrictResponse = await db.get(getDistrictBYIdQuery);
  const getStateName = getStateId(getDistrictResponse);
  const stateName = await getStateName;
  const camelCase = convertToCamelCase(stateName);
  response.send(camelCase);
});

module.exports = app;
