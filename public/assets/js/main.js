fetch('assets/js/songs.json')
  .then(response => response.json())
  .then(songs => {
    // Elementos del DOM (sin cambios)
    const input = document.getElementById('guess-input');
    const suggestions = document.getElementById('autocomplete-suggestions');
    const grid = document.getElementById('game-grid');
    const shareBtn = document.getElementById('share-btn');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeHelp = document.getElementById('close-help');
    const statsBtn = document.getElementById('stats-btn');
    const statsModal = document.getElementById('stats-modal');
    const closeStats = document.getElementById('close-stats');

    // Autocompletado dinámico (sin cambios)
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      suggestions.innerHTML = '';
      if (query.length < 2) return;
      const matches = songs.filter(song => song.title.toLowerCase().includes(query)).slice(0, 5);
      matches.forEach(song => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = song.title;
        div.addEventListener('click', () => {
          input.value = song.title;
          suggestions.innerHTML = '';
          handleGuess();
        });
        suggestions.appendChild(div);
      });
    });

    document.addEventListener('click', e => {
      if (!suggestions.contains(e.target) && e.target !== input) {
        suggestions.innerHTML = '';
      }
    });

    // Modales (sin cambios)
    helpBtn.addEventListener('click', () => {
      helpModal.style.display = 'flex';
    });
    closeHelp.addEventListener('click', () => {
      helpModal.style.display = 'none';
    });
    statsBtn.addEventListener('click', () => {
      statsModal.style.display = 'flex';
      document.getElementById('games-played').textContent = stats.gamesPlayed;
      document.getElementById('wins').textContent = stats.wins;
      document.getElementById('streak').textContent = stats.streak;
      document.getElementById('max-streak').textContent = stats.maxStreak;
    });
    closeStats.addEventListener('click', () => {
      statsModal.style.display = 'none';
    });

    // Selección diaria
    const getDailySong = () => {
      const date = new Date().toDateString();
      const seed = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return songs[seed % songs.length];
    };

    // Estado del juego
    let guesses = JSON.parse(localStorage.getItem('guesses')) || [];
    let gameWon = false;
    let stats = JSON.parse(localStorage.getItem('stats')) || {
      gamesPlayed: 0,
      wins: 0,
      streak: 0,
      maxStreak: 0
    };
    const lastPlayed = localStorage.getItem('lastPlayed');
    const today = new Date().toDateString();

    // Reinicia el juego
    const resetGame = () => {
      guesses = [];
      gameWon = false;
      shareBtn.disabled = true;
      localStorage.setItem('guesses', JSON.stringify(guesses));
      localStorage.setItem('lastPlayed', today);
      renderGrid();
      console.log('Game reset for', today); // Para depuración
    };

    // Verifica si es un nuevo día (más robusto)
    if (!lastPlayed || lastPlayed !== today) {
      resetGame();
    }

    const dailySong = getDailySong();

    // Renderiza el grid
    const renderGrid = () => {
      grid.innerHTML = `
        <div class="header-cell">Song</div>
        <div class="header-cell">Album</div>
        <div class="header-cell">Track #</div>
        <div class="header-cell">Duration</div>
        <div class="header-cell">Features</div>
      `;
      guesses.forEach(guess => {
        const row = document.createElement('div');
        row.className = 'row';
        ['title', 'album', 'trackNumber', 'duration', 'features'].forEach(key => {
          const cell = document.createElement('div');
          cell.className = 'cell';
          if (key === 'features') {
            cell.textContent = guess[key].length ? guess[key].join(', ') : 'None';
          } else {
            cell.textContent = guess[key] || '-';
          }
          if (guess[key] === dailySong[key]) {
            cell.classList.add('correct');
          } else if (key === 'trackNumber' && guess[key] && Math.abs(guess[key] - dailySong[key]) <= 2) {
            cell.classList.add('close');
            cell.textContent += guess[key] > dailySong[key] ? ' ↓' : ' ↑';
          } else if (key === 'duration' && guess[key]) {
            const guessSec = toSeconds(guess[key]);
            const dailySec = toSeconds(dailySong[key]);
            if (Math.abs(guessSec - dailySec) <= 30) {
              cell.classList.add('close');
              cell.textContent += guessSec > dailySec ? ' ↓' : ' ↑';
            }
          } else if (key === 'features' && guess[key].length && dailySong[key].length &&
                     guess[key].some(f => dailySong[key].includes(f))) {
            cell.classList.add('close');
          }
          grid.appendChild(cell);
        });
      });
    };

    const toSeconds = time => {
      const [min, sec] = time.split(':').map(Number);
      return min * 60 + sec;
    };

    const handleGuess = () => {
      const guessTitle = input.value.trim();
      const guessSong = songs.find(song => song.title.toLowerCase() === guessTitle.toLowerCase());
      if (!guessSong || guesses.length >= 8 || gameWon) return;

      guesses.push(guessSong);
      localStorage.setItem('guesses', JSON.stringify(guesses));

      if (guessSong.title === dailySong.title) {
        gameWon = true;
        stats.gamesPlayed++;
        stats.wins++;
        stats.streak++;
        stats.maxStreak = Math.max(stats.streak, stats.maxStreak);
        shareBtn.disabled = false;
      } else if (guesses.length === 8) {
        stats.gamesPlayed++;
        stats.streak = 0;
        shareBtn.disabled = false;
      }
      localStorage.setItem('stats', JSON.stringify(stats));
      renderGrid();
      input.value = '';
      suggestions.innerHTML = '';
    };

    const generateShareText = () => {
      let text = `Juicezle ${new Date().toLocaleDateString()} ${guesses.length}/8\n`;
      guesses.forEach((guess, i) => {
        text += `Guess ${i + 1}: `;
        ['title', 'album', 'trackNumber', 'duration', 'features'].forEach(key => {
          if (guess[key] === dailySong[key]) {
            text += '🟪 ';
          } else if (key === 'trackNumber' && guess[key] && Math.abs(guess[key] - dailySong[key]) <= 2) {
            text += '🟧 ';
          } else if (key === 'duration' && guess[key]) {
            const guessSec = toSeconds(guess[key]);
            const dailySec = toSeconds(dailySong[key]);
            if (Math.abs(guessSec - dailySec) <= 30) {
              text += '🟧 ';
            } else {
              text += '⬜ ';
            }
          } else if (key === 'features' && guess[key].length && dailySong[key].length &&
                     guess[key].some(f => dailySong[key].includes(f))) {
            text += '🟧 ';
          } else {
            text += '⬜ ';
          }
        });
        text += '\n';
      });
      return text;
    };

    input.addEventListener('change', handleGuess);
    shareBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(generateShareText());
      alert('Result copied to clipboard!');
    });

    // Forzar reinicio para pruebas
    window.resetGame = resetGame; // Ejecuta resetGame() en consola para probar

    renderGrid();
  })
  .catch(error => console.error('Error loading songs:', error));