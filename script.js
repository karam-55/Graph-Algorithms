// Graph Data
let courses = [
    { id: 1, name: "Programming 1" },
    { id: 2, name: "Programming 2" },
    { id: 3, name: "Data Structures" },
    { id: 4, name: "Algorithms" }
];

let edges = [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 }
];

let nextId = 5;
let nodePositions = {};
let animatingNodes = new Set();
let doneNodes = new Set();

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateCourseSelects();
    calculateNodePositions();
    drawGraph();
    setupScrollAnimations();
    setupCanvasResize();
    startAnimationLoop();
});

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
        observer.observe(card);
    });
}

function setupCanvasResize() {
    window.addEventListener('resize', function() {
        calculateNodePositions();
        drawGraph();
    });
}

function getCanvas() {
    const canvas = document.getElementById('graphCanvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 16;
    canvas.height = rect.height - 16;
    return canvas;
}

function calculateNodePositions() {
    const canvas = getCanvas();
    const width = canvas.width;
    const height = canvas.height;
    const n = courses.length;

    let cols = width < 350 ? 2 : 3;
    let rows = Math.ceil(n / cols);

    const marginX = 45;
    const marginY = 40;
    const availableWidth = width - 2 * marginX;
    const availableHeight = height - 2 * marginY;

    const spacingX = cols > 1 ? availableWidth / (cols - 1) : 0;
    const spacingY = rows > 1 ? availableHeight / (rows - 1) : 0;

    courses.forEach((course, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        let x = cols > 1 ? marginX + col * spacingX : width / 2;
        let y = rows > 1 ? marginY + row * spacingY : height / 2;

        x = Math.max(35, Math.min(x, width - 35));
        y = Math.max(35, Math.min(y, height - 35));

        nodePositions[course.id] = { x, y };
    });
}

function drawGraph() {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    for (let i = 0; i < height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }

    // Draw edges
    edges.forEach(edge => {
        const from = nodePositions[edge.from];
        const to = nodePositions[edge.to];
        if (!from || !to) return;
        drawArrow(ctx, from.x, from.y + 22, to.x, to.y - 22);
    });

    // Draw nodes
    courses.forEach(course => {
        const pos = nodePositions[course.id];
        if (!pos) return;

        const isAnimating = animatingNodes.has(course.id);
        const isDone = doneNodes.has(course.id);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(pos.x - 10, pos.y - 10, 0, pos.x, pos.y, 28);
        if (isAnimating) {
            gradient.addColorStop(0, '#fbbf24');
            gradient.addColorStop(1, '#d97706');
        } else if (isDone) {
            gradient.addColorStop(0, '#4ade80');
            gradient.addColorStop(1, '#16a34a');
        } else {
            gradient.addColorStop(0, '#60a5fa');
            gradient.addColorStop(1, '#2563eb');
        }
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const words = course.name.split(' ');
        if (words.length > 1 && course.name.length > 8) {
            ctx.fillText(words.slice(0, Math.ceil(words.length/2)).join(' '), pos.x, pos.y - 5);
            ctx.fillText(words.slice(Math.ceil(words.length/2)).join(' '), pos.x, pos.y + 5);
        } else {
            ctx.fillText(course.name, pos.x, pos.y);
        }
    });
}

function drawArrow(ctx, fromX, fromY, toX, toY) {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -Date.now() / 40;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.fillStyle = '#60a5fa';
    ctx.fill();
}

function startAnimationLoop() {
    function animate() {
        drawGraph();
        requestAnimationFrame(animate);
    }
    animate();
}

// Course Management
function updateCourseSelects() {
    const fromSelect = document.getElementById('fromCourse');
    const toSelect = document.getElementById('toCourse');

    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    courses.forEach(course => {
        const option1 = document.createElement('option');
        option1.value = course.id;
        option1.textContent = course.name;
        fromSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = course.id;
        option2.textContent = course.name;
        toSelect.appendChild(option2);
    });
}

function addCourse() {
    const input = document.getElementById('courseName');
    const name = input.value.trim();

    if (!name) {
        showSimOutput('⚠️ الرجاء إدخال اسم المادة');
        return;
    }

    courses.push({ id: nextId, name: name });
    nextId++;
    input.value = '';

    updateCourseSelects();
    calculateNodePositions();
    drawGraph();
    showSimOutput(`✅ تمت إضافة المادة: ${name}`);
}

function addEdge() {
    const fromId = parseInt(document.getElementById('fromCourse').value);
    const toId = parseInt(document.getElementById('toCourse').value);

    if (fromId === toId) {
        showSimOutput('⚠️ المادة لا يمكن أن تكون متطلب لنفسها');
        return;
    }

    const exists = edges.some(e => e.from === fromId && e.to === toId);
    if (exists) {
        showSimOutput('⚠️ هذا الرابط موجود مسبقاً');
        return;
    }

    edges.push({ from: fromId, to: toId });
    calculateNodePositions();
    drawGraph();

    const fromName = courses.find(c => c.id === fromId).name;
    const toName = courses.find(c => c.id === toId).name;
    showSimOutput(`✅ تم ربط: ${fromName} → ${toName}`);
}

function resetGraph() {
    courses = [
        { id: 1, name: "Programming 1" },
        { id: 2, name: "Programming 2" },
        { id: 3, name: "Data Structures" },
        { id: 4, name: "Algorithms" }
    ];
    edges = [
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 }
    ];
    nextId = 5;
    animatingNodes.clear();
    doneNodes.clear();

    updateCourseSelects();
    calculateNodePositions();
    drawGraph();
    showSimOutput('🔄 تم إعادة الضبط');
}

function showSimOutput(text) {
    document.getElementById('simOutput').textContent = text;
}

// Topological Sort
async function runTopologicalSort() {
    if (detectCycleLogic()) {
        showSimOutput('🚫 يوجد حلقة في المتطلبات!');
        return;
    }

    animatingNodes.clear();
    doneNodes.clear();

    let visited = new Set();
    let topoStack = [];

    showSimOutput('⏳ جاري الترتيب...');

    async function topoDFS(u) {
        visited.add(u);
        animatingNodes.add(u);
        await sleep(500);

        let dependents = edges.filter(e => e.from === u).map(e => e.to);
        for (let v of dependents) {
            if (!visited.has(v)) {
                await topoDFS(v);
            }
        }

        animatingNodes.delete(u);
        doneNodes.add(u);
        topoStack.push(u);
        await sleep(300);
    }

    for (let c of courses) {
        if (!visited.has(c.id)) {
            await topoDFS(c.id);
        }
    }

    const orderText = topoStack.slice().reverse().map((id, index) => {
        const course = courses.find(c => c.id === id);
        return `${index + 1}. ${course.name}`;
    }).join('\n');

    showSimOutput('✅ الترتيب الموصى به:\n' + orderText);
}

// Cycle Detection
async function detectCycle() {
    animatingNodes.clear();
    doneNodes.clear();

    let state = {};
    courses.forEach(c => state[c.id] = 0);

    let cycleFound = false;
    let cyclePath = [];

    async function dfs(u, path) {
        state[u] = 1;
        animatingNodes.add(u);
        await sleep(400);

        for (let e of edges) {
            if (e.from === u) {
                let v = e.to;
                if (state[v] === 1) {
                    cycleFound = true;
                    cyclePath = [...path, u, v];
                    return true;
                }
                if (state[v] === 0) {
                    if (await dfs(v, [...path, u])) return true;
                }
            }
        }

        state[u] = 2;
        animatingNodes.delete(u);
        doneNodes.add(u);
        return false;
    }

    for (let c of courses) {
        if (state[c.id] === 0) {
            if (await dfs(c.id, [])) break;
        }
    }

    if (cycleFound) {
        const cycleText = cyclePath.map(id => {
            const course = courses.find(c => c.id === id);
            return course ? course.name : id;
        }).join(' → ');
        showSimOutput('🚫 حلقة: ' + cycleText);
    } else {
        showSimOutput('✅ لا توجد حلقات');
    }
}

function detectCycleLogic() {
    let state = {};
    courses.forEach(c => state[c.id] = 0);

    function dfs(u) {
        state[u] = 1;
        for (let e of edges) {
            if (e.from === u) {
                let v = e.to;
                if (state[v] === 1) return true;
                if (state[v] === 0 && dfs(v)) return true;
            }
        }
        state[u] = 2;
        return false;
    }

    for (let c of courses) {
        if (state[c.id] === 0) {
            if (dfs(c.id)) return true;
        }
    }
    return false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// C++ Code Runner (Simulation)
function runCppCode() {
    const outputDiv = document.getElementById('consoleOutput');
    outputDiv.innerHTML = '<div class="loading"></div> Running...';

    setTimeout(() => {
        outputDiv.textContent = '=== All Courses ===\n' +
            '101 - Programming 1\n' +
            '102 - Programming 2\n' +
            '103 - Data Structures\n' +
            '104 - Algorithms\n\n' +
            '=== Prerequisites for Algorithms ===\n' +
            '- 103 - Data Structures\n' +
            '- 102 - Programming 2\n' +
            '- 101 - Programming 1\n\n' +
            '=== Recommended Study Order ===\n' +
            '101 - Programming 1\n' +
            '102 - Programming 2\n' +
            '103 - Data Structures\n' +
            '104 - Algorithms\n\n' +
            'Process finished with exit code 0';
    }, 1000);
}

function clearOutput() {
    document.getElementById('consoleOutput').textContent = 'اضغط "تشغيل" لرؤية الناتج...';
}
