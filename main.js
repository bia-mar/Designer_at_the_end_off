document.addEventListener('DOMContentLoaded', function() {
    const aboutBtn = document.getElementById('btn-About');
    const aboutSection = document.getElementById('About');
    aboutBtn.addEventListener('click', function() {
        aboutSection.classList.toggle('active');
    });

    const menuLinks = document.querySelectorAll('.menu-list a');
    const subMenu = document.getElementById('sub-menu');
    const resizer = document.getElementById('resizer');
    let lastActiveLink = null;

    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (
                !subMenu.classList.contains('hidden') &&
                lastActiveLink === link
            ) {
                // Hide if already visible and same link clicked
                subMenu.classList.add('hidden');
                resizer.classList.add('hidden');
                lastActiveLink = null;
            } else {
                // Show and set as active
                subMenu.classList.remove('hidden');
                resizer.classList.remove('hidden');
                lastActiveLink = link;
            }
        });
    });
});

const resizer = document.getElementById('resizer');
const leftBox = document.getElementById('sub-menu');
const rightBox = document.getElementById('canvas-container');

resizer.addEventListener('mousedown', function (e) {
  e.preventDefault();

  if (leftBox.classList.contains('hidden')) {
    // Unhide and reset widths to 50% each
    leftBox.classList.remove('hidden');
    resizer.classList.remove('hidden'); // <-- Add this line
    leftBox.style.flex = '0 0 50%';
    rightBox.style.flex = '0 0 50%';
  }

  const startX = e.clientX;
  const startWidthLeft = leftBox.getBoundingClientRect().width;
  const startWidthRight = rightBox.getBoundingClientRect().width;
  const containerWidth = resizer.parentNode.getBoundingClientRect().width;

  function onMouseMove(e) {
    const dx = e.clientX - startX;
    let newLeftWidth = ((startWidthLeft + dx) / containerWidth) * 100;
    let newRightWidth = ((startWidthRight - dx) / containerWidth) * 100;

    // Clamp sizes so neither box disappears
    newLeftWidth = Math.max(10, newLeftWidth);
    newRightWidth = Math.max(10, newRightWidth);

    leftBox.style.flex = `0 0 ${newLeftWidth}%`;
    rightBox.style.flex = `0 0 ${newRightWidth}%`;
  }

  function onMouseUp() {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
});


// makes the menuItems.json work 

fetch('menuItems.json')
  .then(response => response.json())
  .then(menuItems => {
    const menuLinks = document.querySelectorAll('.menu-list a');
    const subMenu = document.getElementById('sub-menu');
    const subMenuText = document.getElementById('sub-menu-text');
    const subMenuContent = document.querySelector('.sub-menu-content');

    menuLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const label = link.textContent.trim().toUpperCase();
        // Find the menu item (case-insensitive)
        const item = menuItems.find(
          m => m.label.toUpperCase() === label
        );
        if (item) {
          // Update sub-menu-text
          subMenuText.querySelector('h4').textContent = item.label;
          subMenuText.querySelector('p').textContent = item.synopsis || '';

          // Update sub-menu-content
          let contentHtml = '';
          if (item.content) {
            if (Array.isArray(item.content)) {
              contentHtml += item.content.map(src =>
                `<img src="${src}" alt="${item.label} content" style="max-width:100%;margin-bottom:8px;">`
              ).join('');
            } else {
              contentHtml += `<img src="${item.content}" alt="${item.label} content" style="max-width:100%;margin-bottom:8px;">`;
            }
          }
          if (item.poster) {
            contentHtml += `<img src="${item.poster}" alt="${item.label} poster" style="max-width:100%;margin-top:8px;">`;
          }
          subMenuContent.innerHTML = contentHtml;

          // Show sub-menu
          subMenu.classList.remove('hidden');
          document.getElementById('resizer').classList.remove('hidden');
        }
      });
    });
  })
  .catch(error => {
    console.error('Failed to load menu items:', error);
  });