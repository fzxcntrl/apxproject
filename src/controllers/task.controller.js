const prisma = require("../config/db");

/**
 * POST /api/tasks
 * Creates a new task for the authenticated user.
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority: priority || undefined, // falls back to schema default (MEDIUM)
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.userId,
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks
 * Returns all non-deleted tasks belonging to the authenticated user.
 *
 * Query params (all optional, combinable):
 *   status   = PENDING | COMPLETED
 *   priority = LOW | MEDIUM | HIGH
 *   search   = <string>  (case-insensitive match on title)
 *   sortBy   = dueDate | createdAt  (default: createdAt)
 *   order    = asc | desc            (default: desc)
 */
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, search, sortBy, order } = req.query;

    // ── Build WHERE clause ──
    const where = { userId: req.userId, isDeleted: false };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    // ── Build ORDER BY clause ──
    const allowedSortFields = ["dueDate", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/:id
 * Returns a single task if it belongs to the authenticated user.
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId, isDeleted: false },
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tasks/:id
 * Updates an existing task owned by the authenticated user.
 */
const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;

    // Ensure ownership
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId, isDeleted: false },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tasks/:id
 * Soft-deletes a task (sets isDeleted = true).
 */
const deleteTask = async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId, isDeleted: false },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    await prisma.task.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });

    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tasks/:id/restore
 * Restores a soft-deleted task (sets isDeleted = false).
 */
const restoreTask = async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.userId, isDeleted: true },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found or not deleted" });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { isDeleted: false },
    });

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  restoreTask,
};
