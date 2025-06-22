// ...all JavaScript from <script> in dual_shark.html...
// (Paste the entire JS logic from the <script> tag here, unchanged)

const canvas = document.getElementById("fishCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
let mouse = { x: -1000, y: -1000 }; // Start offscreen
let mouseReady = false; // Flag to track real mouse movement

let dragging = false;

// Create the main shark
let fish = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    speed: 2,
    targetX: canvas.width / 2,
    targetY: canvas.height / 2,
    time: 0,
    idleT: 0,
    pathQueue: [],
    currentCurve: null,
    lastX: canvas.width / 2,
    lastY: canvas.height / 2,
    bodySegments: [],
    positionHistory: []
};

// Create the hammerhead shark
let hammerHead = {
    x: canvas.width / 2 + 150,
    y: canvas.height / 2 + 100,
    angle: 0,
    speed: 2,
    targetX: canvas.width / 2 + 150,
    targetY: canvas.height / 2 + 100,
    time: 0,
    idleT: 0,
    pathQueue: [],
    currentCurve: null,
    lastX: canvas.width / 2 + 150,
    lastY: canvas.height / 2 + 100,
    bodySegments: [],
    positionHistory: []
};

// Particle system for school of fish
let particles = [];
const particleCount = 200;
const avoidanceRadius = 140;
const maxAvoidanceForce = 4;
const returnSpeed = 0.015;
const flowSpeed = 0.3;
let globalSchoolAngle = 0;

// Initialize particles
function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            originalX: Math.random() * canvas.width,
            originalY: Math.random() * canvas.height,
            vx: 0,
            vy: 0,
            size: Math.random() * 1.8 + 0.8,
            opacity: Math.random() * 0.5 + 0.4,
            phase: Math.random() * Math.PI * 2,
            avoidanceX: 0,
            avoidanceY: 0,
            schoolRadius: Math.random() * 200 + 150,
            schoolSpeed: Math.random() * 0.8 + 0.4,
            isAvoiding: false
        });
    }
}

// Initialize body segments for both sharks
function initializeShark(shark) {
    shark.bodySegments = [];
    shark.positionHistory = [];

    for (let i = 0; i < 8; i++) {
        shark.bodySegments.push({
            x: shark.x - i * 6,
            y: shark.y,
            angle: 0
        });
    }

    for (let i = 0; i < 40; i++) {
        shark.positionHistory.push({
            x: shark.x,
            y: shark.y,
            angle: shark.angle
        });
    }
}

function updateParticles() {
    globalSchoolAngle += 0.008;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        // Calculate avoidance from both sharks
        let totalAvoidanceX = 0;
        let totalAvoidanceY = 0;
        let isAvoiding = false;

        [fish, hammerHead].forEach(shark => {
            const dx = particle.x - shark.x;
            const dy = particle.y - shark.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < avoidanceRadius && distance > 0) {
                isAvoiding = true;
                const avoidanceStrength = Math.pow((avoidanceRadius - distance) / avoidanceRadius, 2);
                const normalizedDx = dx / distance;
                const normalizedDy = dy / distance;

                totalAvoidanceX += normalizedDx * avoidanceStrength * maxAvoidanceForce;
                totalAvoidanceY += normalizedDy * avoidanceStrength * maxAvoidanceForce;
            }
        });

        particle.isAvoiding = isAvoiding;
        particle.avoidanceX = totalAvoidanceX;
        particle.avoidanceY = totalAvoidanceY;

        // Coordinated circular schooling motion when not avoiding
        if (!particle.isAvoiding) {
            const schoolAngle = globalSchoolAngle + (i / particleCount) * Math.PI * 2;
            const schoolCenterX = centerX + Math.cos(globalSchoolAngle * 0.3) * 100;
            const schoolCenterY = centerY + Math.sin(globalSchoolAngle * 0.3) * 60;

            const targetX = schoolCenterX + Math.cos(schoolAngle) * particle.schoolRadius;
            const targetY = schoolCenterY + Math.sin(schoolAngle) * particle.schoolRadius * 0.6;

            const schoolForceX = (targetX - particle.x) * 0.01;
            const schoolForceY = (targetY - particle.y) * 0.01;

            particle.vx += schoolForceX;
            particle.vy += schoolForceY;
        }

        // Apply avoidance forces
        particle.vx += particle.avoidanceX * 0.15;
        particle.vy += particle.avoidanceY * 0.15;

        // Apply damping
        particle.vx *= 0.95;
        particle.vy *= 0.95;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Update opacity based on avoidance state
        if (particle.isAvoiding) {
            particle.opacity = Math.min(1, particle.opacity + 0.02);
        } else {
            particle.opacity = Math.max(0.81, particle.opacity - 0.01);
        }
    }
}

function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        ctx.save();
        ctx.globalAlpha = particle.opacity;

        ctx.translate(particle.x, particle.y);

        const angle = Math.atan2(particle.vy, particle.vx);
        ctx.rotate(angle);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 0.8;

        ctx.beginPath();
        ctx.moveTo(particle.size, 0);
        ctx.lineTo(-particle.size * 0.5, -particle.size * 0.3);
        ctx.lineTo(-particle.size * 0.5, particle.size * 0.3);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-particle.size * 0.5, 0);
        ctx.lineTo(-particle.size, -particle.size * 0.2);
        ctx.lineTo(-particle.size, particle.size * 0.2);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}

function generateBezierPath(start) {
    const radius = 300 + Math.random() * 300;
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = angle1 + Math.PI / 3 + Math.random() * (Math.PI / 2);
    const angle3 = angle2 + Math.PI / 4 + Math.random() * (Math.PI / 3);

    const p1 = start;
    const p2 = {
        x: p1.x + Math.cos(angle1) * radius * 0.6,
        y: p1.y + Math.sin(angle1) * radius * 0.4
    };
    const p3 = {
        x: p1.x + Math.cos(angle2) * radius * 0.8,
        y: p1.y + Math.sin(angle2) * radius * 0.6
    };
    const p4 = {
        x: p1.x + Math.cos(angle3) * radius,
        y: p1.y + Math.sin(angle3) * radius * 0.7
    };

    [p2, p3, p4].forEach(p => {
        p.x = Math.max(50, Math.min(canvas.width - 50, p.x));
        p.y = Math.max(50, Math.min(canvas.height - 50, p.y));
    });

    return { p1, p2, p3, p4 };
}

function bezierPoint(t, p0, p1, p2, p3) {
    const x = Math.pow(1 - t, 3) * p0.x +
        3 * Math.pow(1 - t, 2) * t * p1.x +
        3 * (1 - t) * t * t * p2.x +
        Math.pow(t, 3) * p3.x;
    const y = Math.pow(1 - t, 3) * p0.y +
        3 * Math.pow(1 - t, 2) * t * p1.y +
        3 * (1 - t) * t * t * p2.y +
        Math.pow(t, 3) * p3.y;
    return { x, y };
}

function updateBodySegments(shark) {
    shark.positionHistory.unshift({
        x: shark.x,
        y: shark.y,
        angle: shark.angle
    });

    if (shark.positionHistory.length > 40) {
        shark.positionHistory.pop();
    }

    const segmentDistance = 6;
    const waveFrequency = 0.015;
    const waveAmplitude = dragging ? 1.5 : 0.8;

    shark.bodySegments[0].x = shark.x;
    shark.bodySegments[0].y = shark.y;
    shark.bodySegments[0].angle = shark.angle;

    for (let i = 1; i < shark.bodySegments.length; i++) {
        const prev = shark.bodySegments[i - 1];
        const curr = shark.bodySegments[i];

        const baseX = prev.x - Math.cos(prev.angle) * segmentDistance;
        const baseY = prev.y - Math.sin(prev.angle) * segmentDistance;

        const waveOffset = Math.sin(shark.time * waveFrequency + i * 0.8) * waveAmplitude;
        const perpAngle = prev.angle + Math.PI / 2;

        const targetX = baseX + Math.cos(perpAngle) * waveOffset;
        const targetY = baseY + Math.sin(perpAngle) * waveOffset;

        const lerpFactor = 0.3;
        curr.x += (targetX - curr.x) * lerpFactor;
        curr.y += (targetY - curr.y) * lerpFactor;

        const targetAngle = Math.atan2(prev.y - curr.y, prev.x - curr.x);
        let angleDiff = targetAngle - curr.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        curr.angle += angleDiff * 0.15;
    }
}

function drawRegularShark(shark) {
    ctx.save();
    ctx.translate(shark.x, shark.y);
    ctx.rotate(shark.angle);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.2;

    // Head triangle
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(5, -8);
    ctx.lineTo(5, 8);
    ctx.closePath();
    ctx.stroke();

    // Side fins
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-8, -15);
    ctx.lineTo(-4, -5);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-8, 15);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    // Draw body segments
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(shark.bodySegments[0].x, shark.bodySegments[0].y);
    for (let i = 1; i < shark.bodySegments.length; i++) {
        ctx.lineTo(shark.bodySegments[i].x, shark.bodySegments[i].y);
    }
    ctx.stroke();

    // Draw tail
    const tailSegment = shark.bodySegments[shark.bodySegments.length - 1];
    ctx.save();
    ctx.translate(tailSegment.x, tailSegment.y);
    ctx.rotate(tailSegment.angle);

    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-18, -6);
    ctx.lineTo(-18, 6);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

function drawHammerShark(shark) {
    ctx.save();
    ctx.translate(shark.x, shark.y);
    ctx.rotate(shark.angle);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.2;

    // Hammerhead shape
    ctx.beginPath();
    ctx.moveTo(20, -8);
    ctx.lineTo(20, 8);
    ctx.lineTo(5, 4);
    ctx.lineTo(5, -4);
    ctx.closePath();
    ctx.stroke();

    // Side fins
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-8, -15);
    ctx.lineTo(-4, -5);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-8, 15);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Draw body
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(shark.bodySegments[0].x, shark.bodySegments[0].y);
    for (let i = 1; i < shark.bodySegments.length; i++) {
        ctx.lineTo(shark.bodySegments[i].x, shark.bodySegments[i].y);
    }
    ctx.stroke();

    // Tail
    const tail = shark.bodySegments[shark.bodySegments.length - 1];
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(tail.angle);
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-18, -6);
    ctx.lineTo(-18, 6);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function drawCursor() {
    // Only draw the custom cursor if it's visible and within reasonable bounds
    if (!mouseReady || !mouse.visible && (mouse.x < 0 || mouse.y < 0 || mouse.x > canvas.width || mouse.y > canvas.height)) return;

    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function updateMouse(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouseReady = true;
}

function enqueueBezierPaths(shark, count = 3, start = { x: shark.x, y: shark.y }) {
    for (let i = 0; i < count; i++) {
        const newPath = generateBezierPath(start);
        shark.pathQueue.push(newPath);
        start = newPath.p4;
    }
}

function updateShark(shark) {
    shark.lastX = shark.x;
    shark.lastY = shark.y;

    if (dragging) {
        const dx = mouse.x - shark.x;
        const dy = mouse.y - shark.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const followSpeed = Math.min(dist * 0.07, 5);
        if (dist > 1) {
            shark.x += (dx / dist) * followSpeed;
            shark.y += (dy / dist) * followSpeed;
        }
        shark.targetX = mouse.x;
        shark.targetY = mouse.y;
    } else {
        if (shark.pathQueue.length < 3) enqueueBezierPaths(shark, 2);

        if (!shark.currentCurve) shark.currentCurve = shark.pathQueue.shift();

        shark.idleT += 0.001;

        if (shark.idleT >= 1) {
            shark.idleT = 0;
            shark.currentCurve = shark.pathQueue.shift();
        }

        const currentPos = bezierPoint(
            shark.idleT,
            shark.currentCurve.p1,
            shark.currentCurve.p2,
            shark.currentCurve.p3,
            shark.currentCurve.p4
        );

        const lerpFactor = 0.01;

        shark.x += (currentPos.x - shark.x) * lerpFactor;
        shark.y += (currentPos.y - shark.y) * lerpFactor;
        shark.targetX = currentPos.x;
        shark.targetY = currentPos.y;
    }

    const dx = shark.targetX - shark.x;
    const dy = shark.targetY - shark.y;
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        let targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - shark.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        shark.angle += angleDiff * 0.07;
    }

    updateBodySegments(shark);
}

window.addEventListener("mousedown", (e) => {
    dragging = true;
    updateMouse(e);
});

window.addEventListener("mousemove", (e) => {
    updateMouse(e);
    if (dragging) {
        fish.targetX = mouse.x;
        fish.targetY = mouse.y;
        hammerHead.targetX = mouse.x;
        hammerHead.targetY = mouse.y;
    }
});

window.addEventListener("mouseup", () => {
    dragging = false;
    fish.idleT = 0;
    fish.pathQueue = [];
    fish.currentCurve = null;
    hammerHead.idleT = 0;
    hammerHead.pathQueue = [];
    hammerHead.currentCurve = null;
    enqueueBezierPaths(fish, 3, { x: fish.x, y: fish.y });
    enqueueBezierPaths(hammerHead, 3, { x: hammerHead.x, y: hammerHead.y });
});

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update time for both sharks
    fish.time += 1;
    hammerHead.time += 1;

    // Update both sharks
    updateShark(fish);
    updateShark(hammerHead);

    // Update and draw particles
    updateParticles();
    drawParticles();

    // Draw both sharks
    drawRegularShark(fish);
    drawHammerShark(hammerHead);
    drawCursor();

    requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    fish.pathQueue = [];
    fish.currentCurve = null;
    hammerHead.pathQueue = [];
    hammerHead.currentCurve = null;
    enqueueBezierPaths(fish, 3, { x: fish.x, y: fish.y });
    enqueueBezierPaths(hammerHead, 3, { x: hammerHead.x, y: hammerHead.y });
    initParticles();
});

// === Controller Integration ===
function initDualShark() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initializeShark(fish);
    initializeShark(hammerHead);
    fish.pathQueue = [];
    fish.currentCurve = null;
    hammerHead.pathQueue = [];
    hammerHead.currentCurve = null;
    fish.idleT = 0;
    hammerHead.idleT = 0;
    dragging = false;
    initParticles();
    enqueueBezierPaths(fish, 3);
    enqueueBezierPaths(hammerHead, 3);
}
function animateDualShark() {
    animate();
}
function resizeDualShark() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    fish.pathQueue = [];
    fish.currentCurve = null;
    hammerHead.pathQueue = [];
    hammerHead.currentCurve = null;
    enqueueBezierPaths(fish, 3, { x: fish.x, y: fish.y });
    enqueueBezierPaths(hammerHead, 3, { x: hammerHead.x, y: hammerHead.y });
    initParticles();
}
function cleanupDualShark() {
    // No-op for now
}

// Initialize everything
initializeShark(fish);
initializeShark(hammerHead);
initParticles();
enqueueBezierPaths(fish, 3);
enqueueBezierPaths(hammerHead, 3);
animate();