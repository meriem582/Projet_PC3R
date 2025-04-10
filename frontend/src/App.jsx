import React, { useState } from "react";
import Search from "./components/Search";
import Favorites from "./components/Favorites";
import axios from "axios";

function App() {
  const [favorites, setFavorites] = useState([]);

  const addFavorite = async (track) => {
    await axios.post("/api/favorites", { id: track.id, title: track.title });
    setFavorites([...favorites, track]);
  };

  return (
    <div>
      <h1>🎵 Deezer Search App 🎵</h1>
      <Search onAddFavorite={addFavorite} />
      <Favorites favorites={favorites} />
    </div>
  );
}

export default App;
