import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuid } from "uuid";

import { generateToken } from "./auth.js";
import { authMiddleware } from "./middleware.js";
import { readData, writeData } from "./storage.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const USER = process.env.APP_USER;
const PASS = process.env.APP_PASS;

app.post("/login", (req, res) => {
  const { user, password } = req.body;

  if (user === USER && password === PASS) {
    const token = generateToken(user);

    return res.json({ token });
  }

  res.status(401).json({ error: "Credenciais inválidas" });
});

app.get("/items", authMiddleware, (req, res) => {
  res.json(readData());
});

app.post("/items", authMiddleware, (req, res) => {
  const data = readData();

  const item = {
    id: uuid(),
    categoria: req.body.categoria,
    nome: req.body.nome,
    quantidade: req.body.quantidade,
    checked: false,
  };

  data.push(item);

  writeData(data);

  res.json(item);
});

app.put("/items/:id", authMiddleware, (req, res) => {
  const data = readData();

  const index = data.findIndex((i) => i.id === req.params.id);

  data[index] = { ...data[index], ...req.body };

  writeData(data);

  res.json(data[index]);
});

app.delete("/items/:id", authMiddleware, (req, res) => {
  const data = readData().filter((i) => i.id !== req.params.id);

  writeData(data);

  res.sendStatus(204);
});

app.listen(process.env.PORT, () => {
  console.log("Servidor rodando");
});
