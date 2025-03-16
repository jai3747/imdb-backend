// // src/routes/movie.js
const Movie = require("../models/movieSchema");
const router = require("express").Router();

// Status endpoint for movie API
router.get("/status", async (req, res) => {
  try {
    res.json({
      status: "success",
      message: "Movie API is operational"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message || "Movie API status check failed"
    });
  }
});

// Get all movies
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find().populate("actors").populate("producer");
    res.json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch movies"
    });
  }
});

// Get movie by ID
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).populate("actors").populate("producer");
    if (!movie) {
      return res.status(404).json({ 
        status: "error", 
        message: "Movie not found" 
      });
    }
    res.json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to fetch movie"
    });
  }
});

// Add a new movie
router.post("/add-movie", async (req, res) => {
  try {
    const { name, desc, director, yearOfRelease, poster, producer, actors } = req.body;
    const movie = new Movie({
      name,
      desc,
      director,
      yearOfRelease,
      poster,
      producer,
      actors,
    });
    await movie.save();
    res.status(201).json({
      status: "success",
      data: movie
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to add movie"
    });
  }
});

// Update a movie
router.put("/edit-movie/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, desc, director, yearOfRelease, poster, producer, actors } = req.body;
    const updatedMovie = await Movie.findByIdAndUpdate(
      id,
      {
        name,
        desc,
        director,
        yearOfRelease,
        poster,
        producer,
        actors,
      },
      { new: true }
    );
    
    if (!updatedMovie) {
      return res.status(404).json({
        status: "error",
        message: "Movie not found"
      });
    }
    
    res.json({
      status: "success",
      data: updatedMovie
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to update movie"
    });
  }
});

// Delete a movie
router.delete("/delete-movie/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMovie = await Movie.findByIdAndDelete(id);
    
    if (!deletedMovie) {
      return res.status(404).json({
        status: "error",
        message: "Movie not found"
      });
    }
    
    res.json({ 
      status: "success",
      message: "Movie deleted successfully" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to delete movie"
    });
  }
});

module.exports = router;