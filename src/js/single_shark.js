const canvas = document.getElementById("fishCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
let mouse = { x: -1000, y: -1000 }; // Start offscreen
let mouseReady = false; // Flag to track real mouse movement

let dragging = false;

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

function updateParticles() {
    // Update global school movement
    globalSchoolAngle += 0.008;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        // Calculate distance to shark
        const dx = particle.x - fish.x;
        const dy = particle.y - fish.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Clear avoidance state first
        particle.isAvoiding = false;

        // Strong avoidance behavior with larger, clearer radius
        if (distance < avoidanceRadius && distance > 0) {
            particle.isAvoiding = true;
            const avoidanceStrength = Math.pow((avoidanceRadius - distance) / avoidanceRadius, 2);
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;

            // Stronger avoidance force
            particle.avoidanceX = normalizedDx * avoidanceStrength * maxAvoidanceForce;
            particle.avoidanceY = normalizedDy * avoidanceStrength * maxAvoidanceForce;
        } else {
            particle.avoidanceX *= 0.9;
            particle.avoidanceY *= 0.9;
        }

        // Coordinated circular schooling motion when not avoiding
        if (!particle.isAvoiding) {
            // Calculate position in global circular school movement
            const schoolAngle = globalSchoolAngle + (i / particleCount) * Math.PI * 2;
            const schoolCenterX = centerX + Math.cos(globalSchoolAngle * 0.3) * 100;
            const schoolCenterY = centerY + Math.sin(globalSchoolAngle * 0.3) * 60;

            const targetX = schoolCenterX + Math.cos(schoolAngle) * particle.schoolRadius;
            const targetY = schoolCenterY + Math.sin(schoolAngle) * particle.schoolRadius * 0.6;

            // Gentle movement toward school position
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
            particle.opacity = Math.min(0.9, particle.opacity + 0.02);
        } else {
            particle.opacity = Math.max(0.3, particle.opacity - 0.01);
        }
    }
}

function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        ctx.save();
        ctx.globalAlpha = particle.opacity;

        // Draw as small fish-like shapes
        ctx.translate(particle.x, particle.y);

        // Calculate angle based on velocity
        const angle = Math.atan2(particle.vy, particle.vx);
        ctx.rotate(angle);

        // Draw tiny fish
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 0.8;

        ctx.beginPath();
        ctx.moveTo(particle.size, 0);
        ctx.lineTo(-particle.size * 0.5, -particle.size * 0.3);
        ctx.lineTo(-particle.size * 0.5, particle.size * 0.3);
        ctx.closePath();
        ctx.stroke();

        // Small tail
        ctx.beginPath();
        ctx.moveTo(-particle.size * 0.5, 0);
        ctx.lineTo(-particle.size, -particle.size * 0.2);
        ctx.lineTo(-particle.size, particle.size * 0.2);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}

// Initialize body segments and position history
for (let i = 0; i < 8; i++) {
    fish.bodySegments.push({
        x: fish.x - i * 6,
        y: fish.y,
        angle: 0
    });
}

// Initialize position history for natural following
for (let i = 0; i < 40; i++) {
    fish.positionHistory.push({
        x: fish.x,
        y: fish.y,
        angle: fish.angle
    });
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

function updateBodySegments() {
    // Add current head position to history
    fish.positionHistory.unshift({
        x: fish.x,
        y: fish.y,
        angle: fish.angle
    });

    // Keep history at fixed length
    if (fish.positionHistory.length > 40) {
        fish.positionHistory.pop();
    }

    // Update body segments to maintain fixed distances while following natural path
    const segmentDistance = 6; // Fixed distance between segments
    const waveFrequency = 0.015;
    const waveAmplitude = dragging ? 1.5 : 0.8;

    // First segment follows head directly
    fish.bodySegments[0].x = fish.x;
    fish.bodySegments[0].y = fish.y;
    fish.bodySegments[0].angle = fish.angle;

    // Subsequent segments maintain fixed distance from previous segment
    for (let i = 1; i < fish.bodySegments.length; i++) {
        const prev = fish.bodySegments[i - 1];
        const curr = fish.bodySegments[i];

        // Calculate base position at fixed distance from previous segment
        const baseX = prev.x - Math.cos(prev.angle) * segmentDistance;
        const baseY = prev.y - Math.sin(prev.angle) * segmentDistance;

        // Apply subtle S-wave perpendicular to movement direction
        const waveOffset = Math.sin(fish.time * waveFrequency + i * 0.8) * waveAmplitude;
        const perpAngle = prev.angle + Math.PI / 2;

        // Final position with wave motion
        const targetX = baseX + Math.cos(perpAngle) * waveOffset;
        const targetY = baseY + Math.sin(perpAngle) * waveOffset;

        // Smooth interpolation to maintain natural movement
        const lerpFactor = 0.3;
        curr.x += (targetX - curr.x) * lerpFactor;
        curr.y += (targetY - curr.y) * lerpFactor;

        // Calculate angle based on direction to previous segment
        const targetAngle = Math.atan2(prev.y - curr.y, prev.x - curr.x);
        let angleDiff = targetAngle - curr.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        curr.angle += angleDiff * 0.15;
    }
}

function drawFish(x, y, angle, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

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

    // Draw body segments creating the S-wave effect
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.2;

    // Draw the body line connecting segments
    ctx.beginPath();
    ctx.moveTo(fish.bodySegments[0].x, fish.bodySegments[0].y);
    for (let i = 1; i < fish.bodySegments.length; i++) {
        ctx.lineTo(fish.bodySegments[i].x, fish.bodySegments[i].y);
    }
    ctx.stroke();

    // Draw the tail triangle at the last segment
    const tailSegment = fish.bodySegments[fish.bodySegments.length - 1];
    ctx.save();
    ctx.translate(tailSegment.x, tailSegment.y);
    ctx.rotate(tailSegment.angle);

    // Small triangle tail
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-18, -6);
    ctx.lineTo(-18, 6);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}

function drawCursor() {
    if(!mouseReady) return;

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

window.addEventListener("mousedown", (e) => {
    dragging = true;
    updateMouse(e);
});

window.addEventListener("mousemove", (e) => {
    updateMouse(e);
    if (dragging) {
        fish.targetX = mouse.x;
        fish.targetY = mouse.y;
    }
});

window.addEventListener("mouseup", () => {
    dragging = false;
    fish.idleT = 0;
    fish.pathQueue = [];
    fish.currentCurve = null;
    enqueueBezierPaths(3, { x: fish.x, y: fish.y });
});

function enqueueBezierPaths(count = 3, start = { x: fish.x, y: fish.y }) {
    for (let i = 0; i < count; i++) {
        const newPath = generateBezierPath(start);
        fish.pathQueue.push(newPath);
        start = newPath.p4;
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fish.time += 1;

    fish.lastX = fish.x;
    fish.lastY = fish.y;

    if (dragging) {
        const dx = mouse.x - fish.x;
        const dy = mouse.y - fish.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const followSpeed = Math.min(dist * 0.07, 5);
        if (dist > 1) {
            fish.x += (dx / dist) * followSpeed;
            fish.y += (dy / dist) * followSpeed;
        }
        fish.targetX = mouse.x;
        fish.targetY = mouse.y;
    } else {
        if (fish.pathQueue.length < 3) enqueueBezierPaths(2);

        if (!fish.currentCurve) fish.currentCurve = fish.pathQueue.shift();

        fish.idleT += 0.0010;

        if (fish.idleT >= 1) {
            fish.idleT = 0;
            fish.currentCurve = fish.pathQueue.shift();
        }

        const currentPos = bezierPoint(
            fish.idleT,
            fish.currentCurve.p1,
            fish.currentCurve.p2,
            fish.currentCurve.p3,
            fish.currentCurve.p4
        );

        const lerpFactor = 0.01;

        fish.x += (currentPos.x - fish.x) * lerpFactor;
        fish.y += (currentPos.y - fish.y) * lerpFactor;
        fish.targetX = currentPos.x;
        fish.targetY = currentPos.y;
    }

    const dx = fish.targetX - fish.x;
    const dy = fish.targetY - fish.y;
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        let targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - fish.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        fish.angle += angleDiff * 0.07;
    }

    // Update the body segments for S-wave motion
    updateBodySegments();

    // Update and draw particles first (so they appear behind the shark)
    updateParticles();
    drawParticles();

    // Draw shark on top
    drawFish(fish.x, fish.y, fish.angle, fish.time);
    drawCursor();
    requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    fish.pathQueue = [];
    fish.currentCurve = null;
    enqueueBezierPaths(3, { x: fish.x, y: fish.y });
    initParticles(); // Reinitialize particles on resize
});

// Initialize everything
initParticles();
enqueueBezierPaths(3);
animate();