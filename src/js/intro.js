// === PARTICLES ===
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// Create more subtle, elegant particles
const particles = Array.from({length:100}, () => ({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: Math.random()*1+0.2,  // Smaller particles
    dx: (Math.random()-0.5)*0.2,  // Slower movement
    dy: (Math.random()-0.5)*0.2,
    alpha: Math.random()*0.3 + 0.1  // More subtle opacity
}));

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,2*Math.PI);
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if(p.x<0||p.x>canvas.width) p.dx*=-1;
        if(p.y<0||p.y>canvas.height) p.dy*=-1;
    });
    requestAnimationFrame(draw);
}
draw();

// === SKILL LOOP ===
// More professional skills that align with the minimal aesthetic
const words = [
    "Developer", "Designer", "Machine Learning",
    "Web Development", "AI Engineering",
    "NextJS", "ReactJS", "Deep Learning"
];
const wordEl = document.getElementById("word");
const nameEl = document.getElementById("name");
let index = 0;
let isAnimating = true;

// Remove sound effect for a more elegant experience
function flicker() {
    if (!isAnimating) return;

    wordEl.textContent = words[index];

    gsap.to(wordEl, {
        opacity: 0.5, // More subtle opacity change
        duration: 0.2, // Slower transition
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut", // More subtle easing
        onComplete: () => {
            index = (index + 1) % words.length;
            setTimeout(flicker, 100); // Slower flicker rate
        }
    });
}

// Wait until all fonts are fully rendered
document.fonts.ready.then(() => {
    flicker();
});

// === NAME TRANSITION ===
// More elegant, subtle animation with reduced timing
const tl = gsap.timeline();

tl.to(nameEl, {
    duration: 2, // Reduced from 3 to 2 seconds
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    ease: "power2.out",
    delay: 1 // Reduced from 1.5 to 1 second
}, "start")

    .to(wordEl, {
        duration: 2, // Reduced from 3 to 2 seconds
        opacity: 0,
        scale: 0.9,
        filter: "blur(2px)",
        ease: "power2.in",
        delay: 2, // Reduced from 3 to 2 seconds
        onComplete: () => {
            isAnimating = false;
        }
    }, "start")

    .to(nameEl, {
        duration: 1.5, // Reduced from 2 to 1.5 seconds
        textShadow: "0 0 20px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.2)",
        ease: "power2.out",
        delay: 2 // Reduced from 3 to 2 seconds
    }, "start")

    .to(".intro", {
        duration: 1.5, // Reduced from 2 to 1.5 seconds
        opacity: 0,
        scale: 1.05,
        ease: "power2.inOut",
        delay: 3, // Reduced from 4.5 to 3 seconds
        onComplete: () => {
            window.location.href = "cloud_parting.html";
        }
    });

gsap.to(particles, {
    duration: 6,
    delay: 2,
    onUpdate: function() {
        const progress = this.progress();
        particles.forEach(p => {
            p.alpha = (1 - progress) * 0.3; // More subtle fade
        });
    }
});