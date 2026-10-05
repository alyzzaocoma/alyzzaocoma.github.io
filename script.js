document.getElementById("year").textContent = new Date().getFullYear();

// for mobile navigation

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".nav a").forEach(link => {
    link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});


// Interactive profile image
const canvas = document.getElementById("profileCanvas");
const ctx = canvas.getContext("2d");

const profileImage = new Image();
profileImage.src = "assets/profile/profile-pixels1.png";

let canvasWidth = 0;
let canvasHeight = 0;
let tiles = [];

const pointer = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    active: false
};

const mouseRadius = 135;
const pushForce = 4.8;
const swirlForce = 1.25;
const springStrength = 0.052;
const friction = 0.80;

// Fewer tiles = much less work per animation frame, so the
// portrait reacts immediately instead of feeling delayed.
const columns = 36;
const rows = 36;

function getImageLayout() {
    const imageRatio =
        profileImage.naturalWidth /
        profileImage.naturalHeight;

    const containerRatio = canvasWidth / canvasHeight;

    let drawWidth;
    let drawHeight;

    if (imageRatio > containerRatio) {
        drawWidth = canvasWidth * 0.86;
        drawHeight = drawWidth / imageRatio;
    } else {
        drawHeight = canvasHeight * 0.92;
        drawWidth = drawHeight * imageRatio;
    }

    return {
        drawWidth,
        drawHeight,
        offsetX: (canvasWidth - drawWidth) / 2,
        offsetY: (canvasHeight - drawHeight) / 2
    };
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvasWidth = rect.width;
    canvasHeight = rect.height;

    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createTiles();
}

function createTiles() {
    tiles = [];

    if (!profileImage.complete || !profileImage.naturalWidth) {
        return;
    }

    const {
        drawWidth,
        drawHeight,
        offsetX,
        offsetY
    } = getImageLayout();

    const tileWidth = drawWidth / columns;
    const tileHeight = drawHeight / rows;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const x = offsetX + col * tileWidth;
            const y = offsetY + row * tileHeight;

            tiles.push({
                x,
                y,
                originalX: x,
                originalY: y,
                width: tileWidth + 1,
                height: tileHeight + 1,
                vx: 0,
                vy: 0
            });
        }
    }
}

function setPointerPosition(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();

    pointer.targetX = clientX - rect.left;
    pointer.targetY = clientY - rect.top;
    pointer.active = true;
}

function updateTiles() {
    // Follow the cursor quickly. A low smoothing value here
    // makes the interaction feel delayed, especially on fast
    // mouse movements, so keep the response close to immediate.
    pointer.x += (pointer.targetX - pointer.x) * 0.65;
    pointer.y += (pointer.targetY - pointer.y) * 0.65;

    for (const tile of tiles) {
        const homeDX = tile.originalX - tile.x;
        const homeDY = tile.originalY - tile.y;

        tile.vx += homeDX * springStrength;
        tile.vy += homeDY * springStrength;

        if (pointer.active) {
            const centerX = tile.x + tile.width / 2;
            const centerY = tile.y + tile.height / 2;

            const dx = centerX - pointer.x;
            const dy = centerY - pointer.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < mouseRadius && distance > 0.001) {
                const proximity = 1 - distance / mouseRadius;
                const strength = proximity * proximity;

                // Radial push.
                tile.vx += (dx / distance) * strength * pushForce;
                tile.vy += (dy / distance) * strength * pushForce;

                // Small tangential force for a more organic motion.
                tile.vx += -((dy / distance) * strength * swirlForce);
                tile.vy += ((dx / distance) * strength * swirlForce);
            }
        }

        tile.vx *= friction;
        tile.vy *= friction;

        tile.x += tile.vx;
        tile.y += tile.vy;
    }
}

function drawImage() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (!profileImage.complete || !profileImage.naturalWidth) {
        return;
    }

    const {
        drawWidth,
        drawHeight
    } = getImageLayout();

    const sourceTileWidth = profileImage.naturalWidth / columns;
    const sourceTileHeight = profileImage.naturalHeight / rows;

    let index = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const tile = tiles[index++];

            const sourceX = col * sourceTileWidth;
            const sourceY = row * sourceTileHeight;

            ctx.drawImage(
                profileImage,
                sourceX,
                sourceY,
                sourceTileWidth + 1,
                sourceTileHeight + 1,
                tile.x,
                tile.y,
                tile.width,
                tile.height
            );
        }
    }
}

function animate() {
    updateTiles();
    drawImage();
    requestAnimationFrame(animate);
}

// Mouse + touch are both handled through Pointer Events.
canvas.addEventListener("pointermove", event => {
    setPointerPosition(event.clientX, event.clientY);
});

canvas.addEventListener("pointerenter", event => {
    setPointerPosition(event.clientX, event.clientY);
});

canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
});

canvas.addEventListener("pointerdown", event => {
    setPointerPosition(event.clientX, event.clientY);
    canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointerup", event => {
    pointer.active = false;

    if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
    }
});

canvas.addEventListener("pointercancel", () => {
    pointer.active = false;
});

window.addEventListener("resize", resizeCanvas);

profileImage.addEventListener("load", () => {
    resizeCanvas();
    requestAnimationFrame(animate);
});


// projects carousel animation

const carousel = document.querySelector("[data-carousel]");
const track = carousel?.querySelector(".project-track");
const prevButtons = document.querySelectorAll("[data-carousel-prev]");
const nextButtons = document.querySelectorAll("[data-carousel-next]");
const progressFill = document.querySelector(".carousel-progress-fill");

if (carousel && track) {
    const cards = [...track.querySelectorAll(".project-card")];

    function updateCarouselUI() {
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        const currentScroll = carousel.scrollLeft;
        const ratio = maxScroll > 0 ? currentScroll / maxScroll : 0;

        prevButtons.forEach(button => {
            button.disabled = currentScroll <= 2;
        });

        nextButtons.forEach(button => {
            button.disabled = currentScroll >= maxScroll - 2;
        });

        if (progressFill) {
            progressFill.style.width = `${Math.max(8, ratio * 92 + 8)}%`;
        }
    }

    function scrollOneCard(direction) {
        const card = cards[0];
        if (!card) return;

        const cardWidth = card.getBoundingClientRect().width;
        const gap = parseFloat(getComputedStyle(track).gap) || 0;

        carousel.scrollBy({
            left: direction * (cardWidth + gap),
            behavior: "smooth"
        });
    }

    prevButtons.forEach(button => {
        button.addEventListener("click", () => scrollOneCard(-1));
    });

    nextButtons.forEach(button => {
        button.addEventListener("click", () => scrollOneCard(1));
    });

    carousel.addEventListener("scroll", updateCarouselUI, { passive: true });
    window.addEventListener("resize", updateCarouselUI);

    updateCarouselUI();
}


// project horizontal scroll (left-right)

const projectTrack = document.querySelector(".projects-track");
const projectCards = projectTrack
    ? Array.from(projectTrack.querySelectorAll(".project-card"))
    : [];

const projectPrev = document.querySelector(".projects-prev");
const projectNext = document.querySelector(".projects-next");

function getProjectStep() {
    if (!projectTrack || !projectCards.length) return 0;

    const cardWidth = projectCards[0].getBoundingClientRect().width;
    const styles = getComputedStyle(projectTrack);
    const gap = parseFloat(styles.gap) || 0;

    return cardWidth + gap;
}

function updateProjectButtons() {
    if (!projectTrack) return;

    const maxScroll =
        projectTrack.scrollWidth - projectTrack.clientWidth;

    if (projectPrev) {
        projectPrev.disabled =
            projectTrack.scrollLeft <= 2;
    }

    if (projectNext) {
        projectNext.disabled =
            projectTrack.scrollLeft >= maxScroll - 2;
    }
}

function moveProjects(direction) {
    if (!projectTrack) return;

    const step = getProjectStep();

    if (!step) return;

    projectTrack.scrollBy({
        left: direction * step,
        behavior: "smooth"
    });
}

projectNext?.addEventListener("click", (event) => {
    event.preventDefault();
    moveProjects(1);
});

projectPrev?.addEventListener("click", (event) => {
    event.preventDefault();
    moveProjects(-1);
});

projectTrack?.addEventListener(
    "scroll",
    updateProjectButtons,
    { passive: true }
);

window.addEventListener(
    "resize",
    updateProjectButtons
);

updateProjectButtons();
