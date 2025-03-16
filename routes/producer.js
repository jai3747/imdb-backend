// // src/routes/producer.js
const Producer = require("../models/producerSchema");
const router = require("express").Router();

// Status endpoint for producer API
router.get("/status", async (req, res) => {
  try {
    res.json({
      status: "success",
      message: "Producer API is operational"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Producer API status check failed"
    });
  }
});

// Get all producers
router.get("/", async (req, res) => {
  try {
    const producers = await Producer.find();
    res.json(producers);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch producers"
    });
  }
});

// Get producer by ID
router.get("/:id", async (req, res) => {
  try {
    const producer = await Producer.findById(req.params.id);
    if (!producer) {
      return res.status(404).json({ 
        status: "error", 
        message: "Producer not found" 
      });
    }
    res.json(producer);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch producer"
    });
  }
});

// Add a new producer
router.post("/add-producer", async (req, res) => {
  try {
    const { name, gender, bio, DOB, image } = req.body;
    const producer = new Producer({
      name,
      gender,
      bio,
      DOB,
      image
    });
    await producer.save();
    res.status(201).json({
      status: "success",
      data: producer
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to add producer"
    });
  }
});

// Update a producer
router.put("/edit-producer/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, bio, DOB, image } = req.body;
    const updatedProducer = await Producer.findByIdAndUpdate(
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
    
    if (!updatedProducer) {
      return res.status(404).json({
        status: "error",
        message: "Producer not found"
      });
    }
    
    res.json({
      status: "success",
      data: updatedProducer
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to update producer"
    });
  }
});

// Delete a producer
router.delete("/delete-producer/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProducer = await Producer.findByIdAndDelete(id);
    
    if (!deletedProducer) {
      return res.status(404).json({
        status: "error",
        message: "Producer not found"
      });
    }
    
    res.json({
      status: "success",
      message: "Producer deleted successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to delete producer"
    });
  }
});

module.exports = router;