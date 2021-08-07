const express = require("express");
const app = express();

app.use(express.json());

const path = require("path");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const dbPath = path.join(__dirname, "moviesData.db");

let dataBase = null;

const initialDBandServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initialDBandServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

///get all movies API

app.get("/movies/", async (request, response) => {
  const getAllMoviesQuery = `
    SELECT
        movie.movie_name
    FROM 
        movie`;
  const moviesArray = await dataBase.all(getAllMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});

//Posting new movies

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const addNewMovieQuery = `
  INSERT INTO 
        movie(director_id,movie_name,lead_actor)
  VALUES
  (
      ${directorId},
      '${movieName}',
      '${leadActor}'
  );`;
  await dataBase.run(addNewMovieQuery);
  response.send("Movie Successfully Added");
});

//Getting a particular movie
app.get("/movies/:movieId/", async (request, response) => {
  let { movieId } = request.params;
  const getMovieQuery = `
    SELECT 
      * 
    FROM 
      movie
    WHERE
      movie_id = ${movieId};`;
  const movie = await dataBase.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

//update a movie Details

app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updateMovieQuery = `
  UPDATE
    movie
  SET
    director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
  WHERE
    movie_id = ${movieId};`;

  await dataBase.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

///Deleting a movie
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deletingQuery = `
    SELECT *
    FROM movie
    WHERE movie_id = ${movieId};`;

  await dataBase.run(deletingQuery);
  response.send("Movie Removed");
});

///get list of directors
app.get("/directors/", async (request, response) => {
  const getAlldirectorsQuery = `
    SELECT
        *
    FROM 
        director`;
  const moviesArray = await dataBase.all(getAlldirectorsQuery);
  response.send(
    moviesArray.map((eachdirector) =>
      convertDirectorDbObjectToResponseObject(eachdirector)
    )
  );
});

const logMovieName = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const allMoviesByDirector = `
    SELECT
        *
    FROM 
        director INNER JOIN movie ON director.director_id = movie.director_id
    WHERE 
        director.director_id = ${directorId};`;
  const moviesByDirector = await dataBase.all(allMoviesByDirector);
  response.send(moviesByDirector.map((eachMovie) => logMovieName(eachMovie)));
});

module.exports = app;
