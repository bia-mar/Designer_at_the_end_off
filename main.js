document.addEventListener('DOMContentLoaded', function() {
    const aboutBtn = document.getElementById('about-button');
    const aboutSection = document.getElementById('about');
    const menuToggle = document.getElementById('title');
    const menu = document.getElementById('menu');

    if (aboutBtn && aboutSection) {
        aboutBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            aboutSection.classList.toggle('active');
        });
    }
    if (menuToggle && menu) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            menu.classList.toggle('active');
        });
    }

    document.addEventListener('click', function(event) {
        if (
            menu && menu.classList.contains('active') &&
            !menu.contains(event.target) &&
            event.target !== menuToggle
        ) {
            menu.classList.remove('active');
        }
        if (
            aboutSection && aboutSection.classList.contains('active') &&
            !aboutSection.contains(event.target) &&
            event.target !== aboutBtn
        ) {
            aboutSection.classList.remove('active');
        }
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
    const resizer = document.getElementById('resizer');
    const menu = document.getElementById('menu');
    let lastActiveLink = null;

    menuLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const label = link.textContent.trim().toUpperCase();

        // If clicking the same link, toggle sub-menu
        if (lastActiveLink === link) {
          const isHidden = subMenu.classList.toggle('hidden');
          resizer.classList.toggle('hidden', isHidden);
          menu.classList.remove('active');
          if (isHidden) {
            lastActiveLink = null;
            return;
          }
        } else {
          subMenu.classList.remove('hidden');
          resizer.classList.remove('hidden');
        }

        // Update content if opening or switching links
        const item = menuItems.find(
          m => m.label && m.label.toUpperCase() === label
        );
        if (item) {
          subMenuText.querySelector('h4').textContent = item.label;
          subMenuText.querySelector('p').textContent = item.synopsis || '';
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
        }
        lastActiveLink = link;
        menu.classList.remove('active');
      });
    });
  })
  .catch(error => {
    console.error('Failed to load menu items:', error);
  });