// Get canvas elements and their contexts
const canvas = document.getElementById('glitchCanvas');
const ctx = canvas.getContext('2d');
const circleCanvas = document.getElementById('circleCanvas');
const circleCtx = circleCanvas.getContext('2d');


document.addEventListener('DOMContentLoaded', function () {
  const aboutBtn = document.getElementById('about-button');
  const aboutSection = document.getElementById('about');
  const menuToggle = document.getElementById('title');
  const menu = document.getElementById('menu');

  if (aboutBtn && aboutSection) {
    aboutBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      // Open the "OFFLINE" submenu directly when About is clicked
      if (window.menuItemsList) {
        const offlineItem = window.menuItemsList.find(
          m => m.label && m.label.toUpperCase() === 'OFFLINE'
        );
        if (offlineItem) {
          simulateMenuClickByLabel('OFFLINE');
        }
      }
      aboutSection.classList.toggle('active');
    });
  }
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.classList.toggle('active');
    });
  }

  document.addEventListener('click', function (event) {
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
    // Make menuItemsList globally available
    window.menuItemsList = menuItems;

    menuLinks.forEach(link => {
      link.addEventListener('click', function (e) {
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
          subMenuText.querySelector('p#synopsis').textContent = item.synopsis || '';
          subMenuText.querySelector('p#authors').textContent = item.authors || '';
          let contentHtml = '';
          if (item.content) {
            if (Array.isArray(item.content)) {
              contentHtml += item.content.map(src =>
                `<img src="${src}" alt="${item.label} content">`
                //`<img src="${src}" alt="${item.label} content" style="max-width:100%;margin-bottom:8px;">`
              ).join('');
            } else {
              contentHtml += `<img src="${item.content}" alt="${item.label} content" >`;
              //contentHtml += `<img src="${item.content}" alt="${item.label} content" style="max-width:100%;margin-bottom:8px;">`;
            }
          }
          if (item.poster) {
            //contentHtml += `<img src="${item.poster}" alt="${item.label} poster" style="max-width:100%;margin-top:8px;">`;
            contentHtml += `<img src="${item.poster}" alt="${item.label} poster">`;
          }
          subMenuContent.innerHTML = contentHtml;
        }
        lastActiveLink = link;
        menu.classList.remove('active');
      });
    });
    loadImagesAndInit();
  })
  .catch(error => {
    console.error('Failed to load menu items:', error);
  });



function loadImagesAndInit() {
  const images = [];
  let loadedImages = 0;
  let placedImages = [];
  let canvasCenter = { x: canvas.width / 2, y: canvas.height / 2 };
  let imageCenters = [];

  // Set both canvases to fill the screen
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  circleCanvas.width = window.innerWidth;
  circleCanvas.height = window.innerHeight;

  // DO NOT shuffle images before drawing! Keep the order as in menuItemsList
  menuItemsList.forEach((item, index) => {
    const img = new Image();
    img.src = item.poster;
    img.onload = () => {
      if (img.width > 0 && img.height > 0) {
        images[index] = img;
        loadedImages++;
        if (loadedImages === menuItemsList.length) {
          initializeCanvas();
        }
      }
    };
    img.onerror = () => { };
  });

  // Seeded random number generator
  let seed = 1234;
  function seededRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function initializeCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // DO NOT shuffle images here, just use the original order
    placedImages = [];
    imageCenters = [];

    images.forEach((img, index) => {
      let perc = 0.25 + seededRandom() * 0.2;
      let imageHeight = canvas.height * perc;
      let imageWidth = imageHeight * 0.70;
      let randomX, randomY, overlapCount;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        randomX = Math.random() * (canvas.width - imageWidth);
        randomY = Math.random() * (canvas.height - imageHeight);
        overlapCount = placedImages.reduce((count, { x, y, width, height }) =>
          randomX < x + width &&
            randomX + imageWidth > x &&
            randomY < y + height &&
            randomY + imageHeight > y ? count + 1 : count, 0);
        attempts++;
      } while (overlapCount > 2 && attempts < maxAttempts);

      if (attempts < maxAttempts) {
        placedImages.push({ img, x: randomX, y: randomY, width: imageWidth, height: imageHeight });
        imageCenters.push({ x: randomX + imageWidth / 2, y: randomY + imageHeight / 2 });
        ctx.drawImage(img, randomX, randomY, imageWidth, imageHeight);
      } else {
        console.warn(`Skipped placing image due to too many attempts: ${img.src}`);
      }
    });

    glitch();
    move();
  }

  // Modify drawCircles to use circleCanvas
  function drawCircles() {
    const MAXCONNECTIONS = 10; // Maximum number of connections
    circleCtx.clearRect(0, 0, circleCanvas.width, circleCanvas.height); // Clear previous shapes

    let totalConnections = 0; // Track total connections

    // Connect rectangles with lines
    imageCenters.forEach((center, index) => {
      if (totalConnections >= MAXCONNECTIONS) return; // Stop if max connections reached

      const numConnections = Math.min(Math.floor(seededRandom() * 3) + 1, MAXCONNECTIONS - totalConnections); // Limit remaining connections
      const connectedPoints = [];

      for (let i = 0; i < numConnections; i++) {
        if (totalConnections >= MAXCONNECTIONS) break; // Stop if max connections reached

        let randomIndex;
        do {
          randomIndex = Math.floor(seededRandom() * imageCenters.length);
        } while (randomIndex === index || connectedPoints.includes(randomIndex)); // Avoid self-linking or duplicates
        connectedPoints.push(randomIndex);

        const target = imageCenters[randomIndex];

        // Draw black line (background line)
        circleCtx.strokeStyle = 'black'; // Set line color to black
        circleCtx.lineWidth = 3; // Slightly larger width for the black line
        circleCtx.beginPath();
        circleCtx.moveTo(center.x, center.y);
        circleCtx.lineTo(target.x, target.y);
        circleCtx.stroke();

        // Draw white line (foreground line)
        circleCtx.strokeStyle = 'white'; // Set line color to white
        circleCtx.lineWidth = 2; // Original width for the white line
        circleCtx.beginPath();
        circleCtx.moveTo(center.x, center.y);
        circleCtx.lineTo(target.x, target.y);
        circleCtx.stroke();

        totalConnections++; // Increment total connections
      }
    });

    // Add slight movement to the points
    imageCenters.forEach(center => {
      const dx = seededRandom() * 2 - 1; // Random horizontal movement
      const dy = seededRandom() * 2 - 1; // Random vertical movement

      center.x = Math.max(0, Math.min(circleCanvas.width, center.x + dx)); // Ensure within bounds
      center.y = Math.max(0, Math.min(circleCanvas.height, center.y + dy)); // Ensure within bounds
    });

    // Draw rectangles
    imageCenters.forEach(center => {
      const rectWidth = 10; // Width of the rectangle
      const rectHeight = 10; // Height of the rectangle

      // Draw larger black rectangle (background)
      circleCtx.fillStyle = 'black'; // Set the fill color to black
      circleCtx.fillRect(
        center.x - rectWidth / 2 - 1, // Offset by 1 pixel
        center.y - rectHeight / 2 - 1, // Offset by 1 pixel
        rectWidth + 2, // Increase width by 2 pixels
        rectHeight + 2 // Increase height by 2 pixels
      );

      // Draw smaller white rectangle (foreground)
      circleCtx.fillStyle = 'white'; // Set the fill color to white
      circleCtx.fillRect(
        center.x - rectWidth / 2,
        center.y - rectHeight / 2,
        rectWidth,
        rectHeight
      );
    });
  }



  // Modify move to include drawCircles
  function move() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    placedImages.forEach((image, index) => {
      const center = imageCenters[index];
      const dx = seededRandom() * 150 - 2;
      const dy = seededRandom() * 150 - 2;

      image.x += dx;
      image.y += dy;

      image.x = Math.max(0, Math.min(canvas.width - image.width, image.x));
      image.y = Math.max(0, Math.min(canvas.height - image.height, image.y));

      // Ensure the center remains unaffected
      const currentCenterX = image.x + image.width / 2;
      const currentCenterY = image.y + image.height / 2;
      image.x += center.x - currentCenterX;
      image.y += center.y - currentCenterY;

      ctx.drawImage(image.img, image.x, image.y, image.width, image.height);

      const spliceWidth = Math.max(1, seededRandom() * image.width * 0.5); // Ensure minimum width of 1
      const spliceHeight = Math.max(1, seededRandom() * image.height * 0.5); // Ensure minimum height of 1
      const offsetX = seededRandom() * 20 * (seededRandom() < 0.5 ? -1 : 1);
      const offsetY = seededRandom() * 20 * (seededRandom() < 0.5 ? -1 : 1);

      if (spliceWidth > 0 && spliceHeight > 0 && image.width > 0 && image.height > 0) { // Ensure valid dimensions
        const pixels = ctx.getImageData(
          image.x,
          image.y,
          Math.min(spliceWidth, image.width), // Clamp width to image width
          Math.min(spliceHeight, image.height) // Clamp height to image height
        );
        ctx.putImageData(pixels, image.x + offsetX, image.y + offsetY);
      }
    });

    drawCircles(); // Draw circles after moving images
    throw new Error('Glitch effect'); // Trigger the glitch effect
    requestAnimationFrame(move);
  }

  // Modify glitch to include drawCircles
  function glitch() {
    //let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 10; i++) {
      let x, y;
      do {
        x = Math.floor(seededRandom() * canvas.width);
        y = Math.floor(seededRandom() * canvas.height);
      } while (Math.abs(x - canvasCenter.x) < 50 && Math.abs(y - canvasCenter.y) < 50); // Exclude canvas center

      const spliceWidth = Math.max(1, canvas.width - x); // Ensure minimum width of 1
      const spliceHeight = Math.max(1, seededRandom() * 5 + 10); // Ensure minimum height of 1

      if (spliceWidth > 0 && spliceHeight > 0) { // Ensure valid dimensions
        const pixels = ctx.getImageData(x, y, spliceWidth, spliceHeight);
        const offsetX = seededRandom() * 20 * (seededRandom() < 0.5 ? -1 : 1);
        const offsetY = seededRandom() * 20 * (seededRandom() < 0.5 ? -1 : 1);
        ctx.putImageData(pixels, x + offsetX, y + offsetY);
      }
    }

    drawCircles(); // Draw circles after glitch effect
    setTimeout(glitch, 50);
  }

  // Add hover detection for rectangles
  circleCanvas.addEventListener('mousemove', (event) => {
    const rect = circleCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (menu.classList.contains('active')) {
    }


    imageCenters.forEach((center, index) => {
      const rectWidth = 20; // Increased width of the rectangle
      const rectHeight = 20; // Increased height of the rectangle
      const rectX = center.x - rectWidth / 2;
      const rectY = center.y - rectHeight / 2;
      if (
        mouseX >= rectX &&
        mouseX <= rectX + rectWidth &&
        mouseY >= rectY &&
        mouseY <= rectY + rectHeight
      ) {
      }
    });
  });

  // Remove creation and appending of hoverImage and hoverText, use elements from HTML
  const hoverImage = document.getElementById('hoverImage');
  const hoverText = document.getElementById('hoverText');

  // Update hover logic to use placedImages
  circleCanvas.addEventListener('mousemove', (event) => {
    const rect = circleCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let hovered = false;

    imageCenters.forEach((center, index) => {
      const rectWidth = 50; // Width of the rectangle
      const rectHeight = 50; // Height of the rectangle
      const rectX = center.x - rectWidth / 2;
      const rectY = center.y - rectHeight / 2;

      if (
        mouseX >= rectX &&
        mouseX <= rectX + rectWidth &&
        mouseY >= rectY &&
        mouseY <= rectY + rectHeight
      ) {
        hoverImage.src = placedImages[index].img.src; // Use the correct image from placedImages
        hoveredIndex = index; // Store the hovered index
        // Calculate intended position
        const hoverWidth = 250; // px, matches hoverImage.style.width
        const padding = 10; // px, distance from cursor
        let left = event.clientX + padding;
        let top = event.clientY;

        // If image would overflow right, show on left
        if (left + hoverWidth > window.innerWidth) {
          left = event.clientX - hoverWidth - padding;
        }
        // Prevent from going off left edge
        if (left < 0) left = 0;

        hoverImage.style.left = `${left}px`;
        hoverImage.style.top = `${top}px`;
        hoverImage.style.width = hoverWidth + 'px'; // Set smaller width
        hoverImage.style.height = 'auto'; // Maintain aspect ratio
        hoverImage.style.display = 'block'; // Show the image

        // Position hover text above the image, horizontally aligned
        hoverText.textContent = `${menuItemsList[index].label}`; // Set text content
        hoverText.style.left = `${left}px`;
        hoverText.style.top = `${top - 40}px`; // 40px above the image
        hoverText.style.display = 'block'; // Show the text

        // --- Console log when hovering a circle ---
        if (!hovered) {
          console.log(`Hovered circle index: ${index}, label: ${menuItemsList[index].label}`);
          const menuList = document.getElementById('menu-list');
          if (menuList) {
            const menuLinks = menuList.querySelectorAll('li a');
            menuLinks.forEach(link => {
              if (link.textContent.trim().toUpperCase() === menuItemsList[index].label.toUpperCase()) {
                // Highlight the hovered link
                link.textContent = `> ${menuItemsList[index].label}`;
                // Remove '>' from all other links
                menuLinks.forEach(otherLink => {
                  if (otherLink !== link && otherLink.textContent.startsWith('> ')) {
                    otherLink.textContent = otherLink.textContent.replace(/^>\s*/, '');
                  }
                });
                // --- Add click event to simulate click on this link ---
                circleCanvas.onclick = function () {
                  simulateMenuClickByLabel(menuItemsList[index].label);
                };
              }
            });
          }
          hovered = true;
        }


        // --- Add click event to open submenu-item directly ---
        circleCanvas.onclick = null;
        circleCanvas.onclick = function (clickEvent) {
          const clickRect = circleCanvas.getBoundingClientRect();
          const clickX = clickEvent.clientX - clickRect.left;
          const clickY = clickEvent.clientY - clickRect.top;
          if (
            clickX >= rectX &&
            clickX <= rectX + rectWidth &&
            clickY >= rectY &&
            clickY <= rectY + rectHeight
          ) {
            console.log(`Clicked circle index: ${index}, label: ${menuItemsList[index].label}`);
            // Simulate click on the corresponding submenu <a>
            simulateMenuClickByLabel(menuItemsList[index].label);
          } else {
            const subMenu = document.getElementById('sub-menu');
            const hoverImage = document.getElementById('hoverImage');
            const hoverText = document.getElementById('hoverText');
            menu.classList.remove('active');
            if (subMenu) subMenu.classList.add('hidden');
            if (hoverImage) hoverImage.style.display = 'none';
            if (hoverText) hoverText.style.display = 'none';
          }

        };
        // --- end click event ---
      }
    });

    if (!hovered) {
      hoverImage.style.display = 'none'; // Hide the image if not hovering
      hoverText.style.display = 'none'; // Hide the text if not hovering
      // Reset menu links to remove highlight
      const menuList = document.getElementById('menu-list');
      if (menuList) {
        const menuLinks = menuList.querySelectorAll('li a');
        menuLinks.forEach(link => {
          if (link.textContent.startsWith('> ')) {
            link.textContent = link.textContent.replace(/^>\s*/, ''); // Remove '>' from highlighted links
          }
        });
      }
    }
  });
}

// Reload only the canvas after 90 seconds (90000 milliseconds)
setTimeout(function () {
  if (typeof loadImagesAndInit === 'function') {
    loadImagesAndInit();
  }
}, 90000);

window.addEventListener('resize', function () {
  location.reload();
});

function simulateMenuClickByLabel(label, link) {
  // Access variables from the global scope
  const menuItems = window.menuItemsList;
  const subMenuText = document.getElementById('sub-menu-text');
  const subMenuContent = document.querySelector('.sub-menu-content');
  const menu = document.getElementById('menu');
  const subMenu = document.getElementById('sub-menu');
  const resizer = document.getElementById('resizer');
  // lastActiveLink is only used for menu highlighting, so keep it as a global variable if needed
  window.lastActiveLink = link;

  // Ensure sub-menu and resizer are visible (open them if hidden)
  if (subMenu && subMenu.classList.contains('hidden')) {
    subMenu.classList.remove('hidden');
  }
  if (resizer && resizer.classList.contains('hidden')) {
    resizer.classList.remove('hidden');
  }

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
          `<img src="${src}" alt="${item.label} content">`
        ).join('');
      } else {
        contentHtml += `<img src="${item.content}" alt="${item.label} content" >`;
      }
    }
    if (item.poster) {
      contentHtml += `<img src="${item.poster}" alt="${item.label} poster">`;
    }
    subMenuContent.innerHTML = contentHtml;
  }
  menu.classList.remove('active');
}