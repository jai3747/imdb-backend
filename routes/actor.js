// // src/routes/actor.js
const Actor = require("../models/actorSchema");
const router = require("express").Router();

// Status endpoint for actor API
router.get("/status", async (req, res) => {
  try {
    res.json({
      status: "success",
      message: "Actor API is operational"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Actor API status check failed"
    });
  }
});

// Get all actors
router.get("/", async (req, res) => {
  try {
    const actors = await Actor.find();
    res.json(actors);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch actors"
    });
  }
});

// Get actor by ID
router.get("/:id", async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id);
    if (!actor) {
      return res.status(404).json({ 
        status: "error",
        message: "Actor not found" 
      });
    }
    res.json(actor);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch actor"
    });
  }
});

// Add a new actor
router.post("/add-actor", async (req, res) => {
  try {
    const { name, gender, bio, DOB, image } = req.body;
    const actor = new Actor({
      name,
      gender,
      bio,
      DOB,
      image
    });
    await actor.save();
    res.status(201).json({
      status: "success",
      data: actor
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to add actor"
    });
  }
});

// Update an actor
router.put("/edit-actor/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, bio, DOB, image } = req.body;
    const updatedActor = await Actor.findByIdAndUpdate(
      id,
      {
        name,
        gender,
        bio,
        DOB,
        image
      },
      { new: true }
    );
    
    if (!updatedActor) {
      return res.status(404).json({
        status: "error",
        message: "Actor not found"
      });
    }
    
    res.json({
      status: "success",
      data: updatedActor
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to update actor"
    });
  }
});

// Delete an actor
router.delete("/delete-actor/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedActor = await Actor.findByIdAndDelete(id);
    
    if (!deletedActor) {
      return res.status(404).json({
        status: "error",
        message: "Actor not found"
      });
    }
    
    res.json({
      status: "success",
      message: "Actor deleted successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to delete actor"
    });
  }
});

module.exports = router;