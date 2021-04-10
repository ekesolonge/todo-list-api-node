const express = require("express");
const router = express.Router();
const { Task, validate } = require("../models/tasks");
const { User } = require("../models/user");
const validateObjectId = require("../middleware/validateObjectId");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).select("-__v");
    res.send(tasks);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

router.get("/:id", auth, validateObjectId, async (req, res) => {
  const task = await Task.findById(req.params.id).select("-__v");

  if (!task)
    return res.status(404).send("The task with the given ID was not found.");

  res.send(task);
});

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const task = new Task({
    name: req.body.name,
    userId: req.user._id,
  });

  try {
    const result = await task.save();
    res.send(result);
  } catch (ex) {
    res.status(400).send(ex.message);
    console.log(ex);
  }
});

router.put("/:id", auth, validateObjectId, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { id } = req.params;
  const task = await Task.findByIdAndUpdate(
    id,
    { name: req.body.name },
    { new: true }
  );

  if (!task)
    return res.status(404).send("The task with the given ID was not found.");

  res.send(task);
});

router.delete("/:id", auth, validateObjectId, async (req, res) => {
  const task = await Task.findByIdAndRemove(req.params.id);

  if (!task)
    return res.status(404).send("The task with the given ID was not found.");

  res.send(task);
});

module.exports = router;
