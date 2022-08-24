import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  DbItem
} from "./db";
import filePath from "./filePath";
import pg, {Client} from "pg";

const app = express();
/** Parses JSON data in a request automatically */
app.use(express.json());
/** To allow 'Cross-Origin Resource Sharing': https://en.wikipedia.org/wiki/Cross-origin_resource_sharing */
app.use(cors());


// read in contents of any environment variables in the .env file
dotenv.config();
if (!process.env.DATABASE_URL) {
  throw "No DATABASE_URL env var!  Have you made a .env file?  And set up dotenv?";
}
const PORT_NUMBER = process.env.PORT ?? 4000;
// API info page
app.get("/", (req, res) => {
  const pathToFile = filePath("../public/index.html");
  res.sendFile(pathToFile);
});

// GET to-dos
app.get("/todos", async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  await client.connect();
  const queryText = "SELECT * FROM todos";
  const allToDos = await client.query(queryText);
  res.status(200).json(allToDos.rows);
  await client.end();
});

// POST to-dos
app.post<{}, {}, DbItem>("/todos", async (req, res) => {
  if (typeof(req.body.title) !== 'string' || typeof(req.body.description) !== 'string') {
    res.status(400).json({
      status: "fail",
      data: "String values are required for both title and description in your JSON body"
    })
  } else {
    const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
    await client.connect();
    const queryText = "INSERT INTO todos (title, description, completed) VALUES ($1, $2, $3) RETURNING *";
    const values: (string|boolean)[] = [req.body.title, req.body.description, false];
    const postedToDo = await client.query(queryText, values);
    res.status(201).json(postedToDo.rows);
    await client.end();
  }
  
});

// GET to-dos/:id
app.get<{ id: string }>("/todos/:id", async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  await client.connect();
  const queryText = "SELECT * FROM todos WHERE id = $1";
  const id: number = parseInt(req.params.id);
  const oneToDo = await client.query(queryText, [id]);
  if (oneToDo) {
    res.status(200).json(oneToDo.rows);
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a to-do with that id",
      },
    });
  }
  await client.end();
});

// DELETE /items/:id
app.delete<{ id: string }>("/todos/:id", async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  await client.connect();
  const queryText = "DELETE FROM todos WHERE id = $1";
  const id: number = parseInt(req.params.id);
  const deleteOneToDo = await client.query(queryText, [id]);
  if (deleteOneToDo.rowCount === 1) {
    res.status(200).json({
      status: "success",
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: "Could not find a to-do with that id"
    });
  }
  await client.end();
});

// PUT to-dos/:id
app.put<{ id: string }, {}, Partial<DbItem>>("/todos/:id", async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  await client.connect();
  const id: number = parseInt(req.params.id);
  const searchQueryText = "SELECT * FROM todos WHERE id = $1";
  const toDoToUpdate = await client.query(searchQueryText, [id]);
  if (toDoToUpdate.rowCount === 1) {
    const previousToDoValues = toDoToUpdate.rows[0]
    const values = [...updateValues(req.body, previousToDoValues), id];
    const queryText = "UPDATE todos SET title = $1, description = $2, completed = $3 WHERE id = $4 RETURNING *";
    const updatedToDo = await client.query(queryText, values);
    res.status(404).json({
      status: "success",
      data: updatedToDo.rows,
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: "Could not find a to-do with that id"
    });
  }
  await client.end();
});


function updateValues(requestBody: Partial<DbItem>, previousToDoValues: DbItem): (string|boolean)[] {
  const updatedTitle: string = requestBody.title || previousToDoValues.title;
  const updatedDescription: string = requestBody.description || previousToDoValues.description;
  let updatedCompletion: boolean = previousToDoValues.completed;
  if ((requestBody.completed === true) || (requestBody.completed === false)) {
    updatedCompletion = requestBody.completed;
  }
  return [updatedTitle, updatedDescription, updatedCompletion];
}

app.listen(PORT_NUMBER, () => {
  console.log(`Server is listening on port ${PORT_NUMBER}!`);
});
