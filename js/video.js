document.addEventListener('DOMContentLoaded', function () {
      const videoHeaders = document.querySelectorAll('.video-header');

      videoHeaders.forEach(header => {
        header.addEventListener('click', () => {
          const currentlyActiveItem = document.querySelector('.video-item.active');
          const clickedItem = header.parentElement;

          
          if (currentlyActiveItem && currentlyActiveItem !== clickedItem) {
            currentlyActiveItem.classList.remove('active');
          }

          
          clickedItem.classList.toggle('active');
        });
      });
    });

const user = JSON.parse(localStorage.getItem('loggedUser'));


document.addEventListener('DOMContentLoaded', function () {
  const videoElements = document.querySelectorAll('.video-player');


  const user = JSON.parse(localStorage.getItem('loggedUser'));

  if (!user) {
    console.warn("No logged user found. Redirecting to login...");
    window.location.href = "../index.html";
    return;
  }

  videoElements.forEach((video, index) => {
    let watched = false;

    video.addEventListener('timeupdate', () => {
      if (!watched && video.currentTime >= 30) {
        watched = true;

        
        const userName = user.name || "Unknown User";
        console.log(`${userName} watched 30 seconds of video ${index + 1}`);

        
        saveVideoProgress(userName, user.email, `video${index + 1}`);
      }
    });
  });
});

function saveVideoProgress(userName, userEmail, videoName) {
  const progress = JSON.parse(localStorage.getItem('videoProgress')) || [];

  
  progress.push({
    userName,
    userEmail,
    videoName,
    watchedAt: new Date().toISOString()
  });

  localStorage.setItem('videoProgress', JSON.stringify(progress));
}
