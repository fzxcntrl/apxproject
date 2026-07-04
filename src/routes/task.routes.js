const { Router } = require("express");
const verifyToken = require("../middleware/auth.middleware");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  restoreTask,
} = require("../controllers/task.controller");

const router = Router();

// Every route in this file requires authentication
router.use(verifyToken);

router.post("/", createTask);
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id/restore", restoreTask);

module.exports = router;
