import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  addDummyDbItems,
  addDbItem,
  getAllDbItems,
  getDbItemById,
  DbItem,
  updateDbItemById,
  deleteDbItemById,
} from "./db";
import filePath from "./filePath";

// loading in some dummy items into the database
// (comment out if desired, or change the number)
addDummyDbItems(20);

const app = express();

/** Parses JSON data in a request automatically */
app.use(express.json());
/** To allow 'Cross-Origin Resource Sharing': https://en.wikipedia.org/wiki/Cross-origin_resource_sharing */
app.use(cors());

// read in contents of any environment variables in the .env file
dotenv.config();
const PORT_NUMBER = process.env.PORT ?? 4000;
// API info page
app.get("/", (req, res) => {
  const pathToFile = filePath("../public/index.html");
  res.sendFile(pathToFile);
});

// GET to-dos
app.get("/to-dos", (req, res) => {
  const allToDos = getAllDbItems();
  res.status(200).json(allToDos);
});

// POST to-dos
app.post<{}, {}, DbItem>("/to-dos", (req, res) => {
  // to be rigorous, ought to handle non-conforming request bodies
  // ... but omitting this as a simplification
  const postData = req.body;
  const createdToDo = addDbItem(postData);
  res.status(201).json(createdToDo);
});

// GET to-dos/:id
app.get<{ id: string }>("/to-dos/:id", (req, res) => {
  const matchingToDo = getDbItemById(parseInt(req.params.id));
  if (matchingToDo === "not found") {
    res.status(404).json(matchingToDo);
  } else {
    res.status(200).json(matchingToDo);
  }
});

// DELETE /items/:id
app.delete<{ id: string }>("to-dos/:id", (req, res) => {
  const matchingToDo = deleteDbItemById(parseInt(req.params.id));
  if (matchingToDo === "not found") {
    res.status(404).json(matchingToDo);
  } else {
    res.status(200).json(matchingToDo);
  }
});

// PATCH to-dos/:id
app.patch<{ id: string }, {}, Partial<DbItem>>("to-dos/:id", (req, res) => {
  const matchingToDo = updateDbItemById(parseInt(req.params.id), req.body);
  if (matchingToDo === "not found") {
    res.status(404).json(matchingToDo);
  } else {
    res.status(200).json(matchingToDo);
  }
});

app.listen(PORT_NUMBER, () => {
  console.log(`Server is listening on port ${PORT_NUMBER}!`);
});
