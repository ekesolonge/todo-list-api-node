const express = require("express");
const router = express.Router();
const Task = require("../models/tasks");
const validateObjectId = require("../middleware/validateObjectId");

router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().select("-__v");
    res.send(tasks);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

router.get("/:id", validateObjectId, async (req, res) => {
  const task = await Task.findById(req.params.id).select("-__v");

  if (!task)
    return res.status(404).send("The task with the given ID was not found.");

  res.send(task);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!req.body) return res.status(400).send("Fill required inputs");
  if (name.length < 2 || name.length > 255)
    return res.status(400).send("Input must be between 2 to 255 characters");
  const task = new Task({ name });

  try {
    const result = await task.save();
    res.send(result);
  } catch (ex) {
    res.status(400).send("Fill required inputs");
    console.log(ex);
  }
});

router.put("/:id", validateObjectId, async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  const task = await Task.findByIdAndUpdate(id, { name }, { new: true });

  if (!task)
    return res.status(404).send("The task with the given ID was not found.");

  res.send(task);
});

router.delete("/:id", validateObjectId, async (req, res) => {
  const task = await Task.findByIdAndRemove(req.params.id);

  if (!task)
    return res.status(404).send("The task with the given ID was not found.");

  res.send(task);
});

module.exports = router;
