// Cloud shader setup
const cloudCanvas = document.getElementById('cloudCanvas');
const gl = cloudCanvas.getContext('webgl');

// Shark canvas setup
const sharkCanvas = document.getElementById('sharkCanvas');
const ctx = sharkCanvas.getContext('2d');

function resizeCanvases() {
    cloudCanvas.width = window.innerWidth;
    cloudCanvas.height = window.innerHeight;
    sharkCanvas.width = window.innerWidth;
    sharkCanvas.height = window.innerHeight;
}

resizeCanvases();

if (!gl) {
    alert('WebGL not supported');
}

// Shark variables
//let mouse = { x: sharkCanvas.width / 2, y: sharkCanvas.height / 2 };
let mouse = { x: -1000, y: -1000 }; // Start offscreen
let mouseReady = false; // Flag to track real mouse movement

let dragging = false;

let fish = {
    x: sharkCanvas.width / 2,
    y: sharkCanvas.height / 2,
    angle: 0,
    speed: 2,
    targetX: sharkCanvas.width / 2,
    targetY: sharkCanvas.height / 2,
    time: 0,
    idleT: 0,
    pathQueue: [],
    currentCurve: null,
    lastX: sharkCanvas.width / 2,
    lastY: sharkCanvas.height / 2,
    bodySegments: [],
    positionHistory: []
};

// Initialize body segments and position history
for (let i = 0; i < 8; i++) {
    fish.bodySegments.push({
        x: fish.x - i * 6,
        y: fish.y,
        angle: 0
    });
}

for (let i = 0; i < 40; i++) {
    fish.positionHistory.push({
        x: fish.x,
        y: fish.y,
        angle: fish.angle
    });
}

// WebGL shader setup
const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

const fragmentShaderSource = `
            precision mediump float;
            uniform vec2 iResolution;
            uniform float iTime;
            uniform vec2 sharkPos;
            uniform float avoidanceRadius;
            
            #define AA 1
            
            float hash(vec2 p) {
                p = fract(p * 0.6180339887);
                p *= 25.0;
                return fract(p.x * p.y * (p.x + p.y));
            }
            
            float noise(in vec2 x) {
                vec2 p = floor(x);
                vec2 f = fract(x);
                f = f * f * (3.0 - 2.0 * f);
                float a = hash(p + vec2(0, 0));
                float b = hash(p + vec2(1, 0));
                float c = hash(p + vec2(0, 1));
                float d = hash(p + vec2(1, 1));
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            const mat2 mtx = mat2(0.80, 0.60, -0.60, 0.80);
            
            float fbm4(vec2 p) {
                float f = 0.0;
                f += 0.5000 * (-1.0 + 2.0 * noise(p)); p = mtx * p * 2.02;
                f += 0.2500 * (-1.0 + 2.0 * noise(p)); p = mtx * p * 2.03;
                f += 0.1250 * (-1.0 + 2.0 * noise(p)); p = mtx * p * 2.01;
                f += 0.0625 * (-1.0 + 2.0 * noise(p));
                return f / 0.9375;
            }
            
            float fbm6(vec2 p) {
                float f = 0.0;
                f += 0.500000 * noise(p); p = mtx * p * 2.02;
                f += 0.250000 * noise(p); p = mtx * p * 2.03;
                f += 0.125000 * noise(p); p = mtx * p * 2.01;
                f += 0.062500 * noise(p); p = mtx * p * 2.04;
                f += 0.031250 * noise(p); p = mtx * p * 2.01;
                f += 0.015625 * noise(p);
                return f / 0.96875;
            }
            
            vec2 fbm4_2(vec2 p) {
                return vec2(fbm4(p + vec2(1.0)), fbm4(p + vec2(6.2)));
            }
            
            vec2 fbm6_2(vec2 p) {
                return vec2(fbm6(p + vec2(9.2)), fbm6(p + vec2(5.7)));
            }
            
            float func(vec2 q, out vec2 o, out vec2 n, vec2 sharkPosNorm, float avoidanceRadiusNorm) {
                // Calculate distance to shark for swirling effect
                vec2 toShark = q - sharkPosNorm;
                float distToShark = length(toShark);
                
                // Create swirling flow field around shark
                vec2 flowField = vec2(0.0);
                if (distToShark < avoidanceRadiusNorm * 1.5) {
                    float influence = 1.0 - smoothstep(0.0, avoidanceRadiusNorm * 1.5, distToShark);
                    
                    // Create swirling motion - perpendicular to direction from shark
                    vec2 perpendicular = vec2(-toShark.y, toShark.x);
                    
                    // Add spiral motion with varying intensity
                    float spiralStrength = influence * 0.8;
                    float radialPush = influence * 0.6;
                    
                    // Swirl effect - clouds spiral around shark
                    flowField += normalize(perpendicular) * spiralStrength;
                    
                    // Radial push - clouds get pushed away
                    if (distToShark > 0.001) {
                        flowField += normalize(toShark) * radialPush;
                    }
                    
                    // Add time-based turbulence for more organic motion
                    flowField += 0.3 * influence * vec2(
                        sin(iTime * 0.5 + distToShark * 8.0),
                        cos(iTime * 0.7 + distToShark * 6.0)
                    );
                }
                
                // Apply flow field to the base noise coordinates
                q += flowField;
                
                q += 0.05 * sin(vec2(0.11, 0.13) * iTime + length(q) * 4.0);
                q *= 0.7 + 0.2 * cos(0.05 * iTime);
                o = 0.5 + 0.5 * fbm4_2(q);
                o += 0.02 * sin(vec2(0.13, 0.11) * iTime * length(o));
                n = fbm6_2(4.0 * o);
                vec2 p = q + 2.0 * n + 1.0;
                float f = 0.5 + 0.5 * fbm4(2.0 * p);
                f = mix(f, f * f * f * 3.5, f * abs(n.x));
                f *= 1.0 - 0.5 * pow(0.5 + 0.5 * sin(8.0 * p.x) * sin(8.0 * p.y), 8.0);
                return f;
            }
            
            float funcs(in vec2 q, vec2 sharkPosNorm, float avoidanceRadiusNorm) {
                vec2 t1, t2;
                return func(q, t1, t2, sharkPosNorm, avoidanceRadiusNorm);
            }
            
            void main() {
                vec2 fragCoord = gl_FragCoord.xy;
                vec3 tot = vec3(0.0);
                
                vec2 q = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
                
                // Convert shark position from pixel coordinates to normalized coordinates
                vec2 sharkPosNorm = vec2(
                    (2.0 * sharkPos.x - iResolution.x) / iResolution.y,
                    (2.0 * (iResolution.y - sharkPos.y) - iResolution.y) / iResolution.y
                );
                float avoidanceRadiusNorm = avoidanceRadius / iResolution.y * 2.0;
                
                vec2 o, n;
                float f = func(q, o, n, sharkPosNorm, avoidanceRadiusNorm);
                
                // Calculate distance to shark for parting effect
                vec2 toShark = q - sharkPosNorm;
                float distToShark = length(toShark);
                
                // Create natural cloud parting effect around shark
                float partingRadius = avoidanceRadiusNorm * 0.6; // Inner clear area
                float partingFalloff = avoidanceRadiusNorm * 1.2; // Outer edge of parting effect
                
                // Smooth parting transition with natural edges
                float partingMask = 1.0;
                if (distToShark < partingFalloff) {
                    // Create irregular parting boundary using noise
                    float noiseEdge = 0.2 * (noise(q * 8.0 + iTime * 0.1) - 0.5);
                    float adjustedRadius = partingRadius + noiseEdge;
                    
                    if (distToShark < adjustedRadius) {
                        // Complete parting in the center
                        partingMask = 0.0;
                    } else {
                        // Smooth transition at the edges
                        float edgeTransition = (distToShark - adjustedRadius) / (partingFalloff - adjustedRadius);
                        partingMask = smoothstep(0.0, 1.0, edgeTransition);
                        
                        // Add some wispy cloud remnants in the transition zone
                        float wispy = 0.3 * noise(q * 12.0 + iTime * 0.05);
                        partingMask = min(partingMask + wispy * (1.0 - edgeTransition), 1.0);
                    }
                }
                
                // Apply parting effect to cloud density
                f *= partingMask;
                
                // Increase cloud density
                f *= 1.2;
                
                // Create white clouds on black background
                vec3 col = vec3(0.0);
                
                // Smoother cloud transitions
                float cloudiness = smoothstep(0.15, 0.85, f);
                col = mix(col, vec3(1.0), cloudiness);
                
                // Add subtle shading and depth
                vec2 ex = vec2(1.0 / iResolution.x, 0.0);
                vec2 ey = vec2(0.0, 1.0 / iResolution.y);
                vec3 nor = normalize(vec3(funcs(q + ex, sharkPosNorm, avoidanceRadiusNorm) - f, ex.x, funcs(q + ey, sharkPosNorm, avoidanceRadiusNorm) - f));
                
                vec3 lig = normalize(vec3(0.9, -0.2, -0.4));
                float dif = clamp(0.3 + 0.7 * dot(nor, lig), 0.0, 1.0);
                
                // Apply lighting with more contrast
                col *= 0.7 + 0.3 * dif;
                
                // Add some atmospheric perspective
                col *= 0.9 + 0.1 * (1.0 - cloudiness);
                
                tot = col;
                
                // Subtle vignette effect
                vec2 p = fragCoord / iResolution.xy;
                tot *= 0.6 + 0.4 * sqrt(16.0 * p.x * p.y * (1.0 - p.x) * (1.0 - p.y));
                
                gl_FragColor = vec4(tot, 1.0);
            }
        `;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
const resolutionUniformLocation = gl.getUniformLocation(program, 'iResolution');
const timeUniformLocation = gl.getUniformLocation(program, 'iTime');
const sharkPosUniformLocation = gl.getUniformLocation(program, 'sharkPos');
const avoidanceRadiusUniformLocation = gl.getUniformLocation(program, 'avoidanceRadius');

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
    -1, -1,
    1, -1,
    -1,  1,
    -1,  1,
    1, -1,
    1,  1,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// Shark movement functions
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
        p.x = Math.max(50, Math.min(sharkCanvas.width - 50, p.x));
        p.y = Math.max(50, Math.min(sharkCanvas.height - 50, p.y));
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
    fish.positionHistory.unshift({
        x: fish.x,
        y: fish.y,
        angle: fish.angle
    });

    if (fish.positionHistory.length > 40) {
        fish.positionHistory.pop();
    }

    const segmentDistance = 6;
    const waveFrequency = 0.015;
    const waveAmplitude = dragging ? 1.5 : 0.8;

    fish.bodySegments[0].x = fish.x;
    fish.bodySegments[0].y = fish.y;
    fish.bodySegments[0].angle = fish.angle;

    for (let i = 1; i < fish.bodySegments.length; i++) {
        const prev = fish.bodySegments[i - 1];
        const curr = fish.bodySegments[i];

        const baseX = prev.x - Math.cos(prev.angle) * segmentDistance;
        const baseY = prev.y - Math.sin(prev.angle) * segmentDistance;

        const waveOffset = Math.sin(fish.time * waveFrequency + i * 0.8) * waveAmplitude;
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

function drawFish(x, y, angle, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 8;

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
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(fish.bodySegments[0].x, fish.bodySegments[0].y);
    for (let i = 1; i < fish.bodySegments.length; i++) {
        ctx.lineTo(fish.bodySegments[i].x, fish.bodySegments[i].y);
    }
    ctx.stroke();

    // Draw tail
    const tailSegment = fish.bodySegments[fish.bodySegments.length - 1];
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

    // Reset shadow
    ctx.shadowBlur = 0;
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

function enqueueBezierPaths(count = 3, start = { x: fish.x, y: fish.y }) {
    for (let i = 0; i < count; i++) {
        const newPath = generateBezierPath(start);
        fish.pathQueue.push(newPath);
        start = newPath.p4;
    }
}

// Event listeners
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

window.addEventListener("resize", () => {
    resizeCanvases();
    gl.viewport(0, 0, cloudCanvas.width, cloudCanvas.height);
    fish.pathQueue = [];
    fish.currentCurve = null;
    enqueueBezierPaths(3, { x: fish.x, y: fish.y });
});

// Animation loop
function animate(time) {
    // Update shark position
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

    updateBodySegments();

    // Render clouds
    gl.viewport(0, 0, cloudCanvas.width, cloudCanvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionUniformLocation, cloudCanvas.width, cloudCanvas.height);
    gl.uniform1f(timeUniformLocation, time * 0.001);
    gl.uniform2f(sharkPosUniformLocation, fish.x, fish.y);
    gl.uniform1f(avoidanceRadiusUniformLocation, 200); // Increased avoidance radius

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Render shark
    ctx.clearRect(0, 0, sharkCanvas.width, sharkCanvas.height);
    drawFish(fish.x, fish.y, fish.angle, fish.time);
    drawCursor();

    requestAnimationFrame(animate);
}

// Initialize
enqueueBezierPaths(3);
requestAnimationFrame(animate);