document.addEventListener('DOMContentLoaded', function () {
      const audioHeaders = document.querySelectorAll('.audio-header');

      audioHeaders.forEach(header => {
        header.addEventListener('click', () => {
          const currentlyActiveItem = document.querySelector('.audio-item.active');
          const clickedItem = header.parentElement;

          
          if (currentlyActiveItem && currentlyActiveItem !== clickedItem) {
            currentlyActiveItem.classList.remove('active');
            
            const audioPlayer = currentlyActiveItem.querySelector('audio');
            if (audioPlayer) {
              audioPlayer.pause();
            }
          }

          
          clickedItem.classList.toggle('active');
        });
      });
    });
    
const user = JSON.parse(localStorage.getItem('loggedUser'));


document.addEventListener('DOMContentLoaded', function () {
  const audioElements = document.querySelectorAll('.audio-player');

  const user = JSON.parse(localStorage.getItem('loggedUser'));

  if (!user) {
    console.warn("No logged user found. Redirecting to login...");
    window.location.href = "../index.html";
    return;
  }

  audioElements.forEach((audio, index) => {
    let listened = false;

    
    audio.addEventListener('timeupdate', () => {
      if (!listened && audio.currentTime >= 30) {
        listened = true;

        const userName = user.name || "Unknown User";
        const audioTitle = audio.getAttribute('audio-title') || `audio ${index + 1}`;

        console.log(`${userName} listened 30 seconds of ${audioTitle}`);

        
        saveAudioProgress(userName, user.email, audioTitle);
      }
    });
  });
});

function saveAudioProgress(userName, userEmail, audioName) {
  const progress = JSON.parse(localStorage.getItem('audioProgress')) || [];


  progress.push({
    userName,
    userEmail,
    audioName,
    listenedAt: new Date().toISOString()
  });

  localStorage.setItem('audioProgress', JSON.stringify(progress));
}
