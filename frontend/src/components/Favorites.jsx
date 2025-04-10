import React, { useEffect, useState } from "react";
import axios from "axios";

function Favorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    axios.get("/api/favorites").then((res) => setFavorites(res.data));
  }, []);

  const removeFavorite = async (id) => {
    await axios.delete(`/api/favorites/${id}`);
    setFavorites(favorites.filter((fav) => fav.id !== id));
  };

  return (
    <div>
      <h2>Favoris</h2>
      <ul>
        {favorites.map((fav) => (
          <li key={fav.id}>
            {fav.title}
            <button onClick={() => removeFavorite(fav.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Favorites;
