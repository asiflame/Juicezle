const songs = require('./songs.json');
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('guess-input');
  const datalist = document.getElementById('songs');
  // Llena el datalist con canciones
  songs.forEach(song => {
    const option = document.createElement('option');
    option.value = song.title;
    datalist.appendChild(option);
  });
  // TODO: Lógica para seleccionar canción diaria y validar adivinanzas
});