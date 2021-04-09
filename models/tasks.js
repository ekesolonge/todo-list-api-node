const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255,
  },
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
