// ===== Graph Simulation Data =====
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

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', function() {
    updateCourseSelects();
    calculateNodePositions();
    drawGraph();
    setupScrollAnimations();
    setupCanvasResize();
});

// ===== Scroll Animations =====
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.code-card').forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
}

// ===== Canvas Setup =====
function setupCanvasResize() {
    window.addEventListener('resize', function() {
        calculateNodePositions();
        drawGraph();
    });
}

function getCanvas() {
    const canvas = document.getElementById('graphCanvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width - 60;
    canvas.height = Math.max(rect.height - 60, 450);
    return canvas;
}

function calculateNodePositions() {
    const canvas = getCanvas();
    const width = canvas.width;
    const height = canvas.height;
    const n = courses.length;

    // تحديد عدد الأعمدة بناءً على حجم الشاشة
    let cols;
    if (width < 400) {
        cols = 2;
    } else if (width < 600) {
        cols = 3;
    } else {
        cols = Math.ceil(Math.sqrt(n));
    }

    let rows = Math.ceil(n / cols);

    const nodeRadius = 35;
    const marginX = nodeRadius + 15;
    const marginY = nodeRadius + 20;
    const availableWidth = width - 2 * marginX;
    const availableHeight = height - 2 * marginY;

    const spacingX = cols > 1 ? availableWidth / (cols - 1) : 0;
    const spacingY = rows > 1 ? availableHeight / (rows - 1) : availableHeight / 2;

    courses.forEach((course, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        let x = cols > 1 ? marginX + col * spacingX : width / 2;
        let y = rows > 1 ? marginY + row * spacingY : height / 2;

        // تأكد إن العقدة ما تطلع برا Canvas
        x = Math.max(nodeRadius, Math.min(x, width - nodeRadius));
        y = Math.max(nodeRadius + 10, Math.min(y, height - nodeRadius - 10));

        nodePositions[course.id] = { x, y };
    });
}

function drawGraph() {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear with gradient
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.3)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    for (let i = 0; i < height; i += 40) {
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

        drawArrow(ctx, from.x, from.y + 25, to.x, to.y - 25, edge.from, edge.to);
    });

    // Draw nodes
    courses.forEach(course => {
        const pos = nodePositions[course.id];
        if (!pos) return;

        const isAnimating = animatingNodes.has(course.id);
        const isDone = doneNodes.has(course.id);

        // Glow effect
        if (isAnimating) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#f59e0b';
        } else if (isDone) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#10b981';
        } else {
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
        const nodeGradient = ctx.createLinearGradient(pos.x - 30, pos.y - 30, pos.x + 30, pos.y + 30);
        if (isAnimating) {
            nodeGradient.addColorStop(0, '#f59e0b');
            nodeGradient.addColorStop(1, '#d97706');
        } else if (isDone) {
            nodeGradient.addColorStop(0, '#10b981');
            nodeGradient.addColorStop(1, '#059669');
        } else {
            nodeGradient.addColorStop(0, '#6366f1');
            nodeGradient.addColorStop(1, '#4f46e5');
        }
        ctx.fillStyle = nodeGradient;
        ctx.fill();

        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Cairo';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Wrap text if too long
        const words = course.name.split(' ');
        if (words.length > 1 && course.name.length > 8) {
            ctx.fillText(words.slice(0, Math.ceil(words.length/2)).join(' '), pos.x, pos.y - 6);
            ctx.fillText(words.slice(Math.ceil(words.length/2)).join(' '), pos.x, pos.y + 6);
        } else {
            ctx.fillText(course.name, pos.x, pos.y);
        }
    });
}

function drawArrow(ctx, fromX, fromY, toX, toY, fromId, toId) {
    const headLength = 12;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw animated dashed line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -Date.now() / 30;
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.fillStyle = '#6366f1';
    ctx.fill();
}

// Animate graph continuously
function startGraphAnimation() {
    function animate() {
        drawGraph();
        requestAnimationFrame(animate);
    }
    animate();
}

startGraphAnimation();

// ===== Course Management =====
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
    showSimOutput('🔄 تم إعادة ضبط الـ Graph');
}

function showSimOutput(text) {
    const output = document.getElementById('simOutput');
    output.textContent = text;
    output.style.animation = 'none';
    setTimeout(() => {
        output.style.animation = 'pulse 0.5s ease';
    }, 10);
}

// ===== Topological Sort with Animation =====
async function runTopologicalSort() {
    if (detectCycleLogic()) {
        showSimOutput('🚫 لا يمكن الترتيب: يوجد حلقة في المتطلبات!\nاستخدم "كشف الحلقة" لمعرفة التفاصيل.');
        return;
    }

    animatingNodes.clear();
    doneNodes.clear();

    let visited = new Set();
    let topoStack = [];

    showSimOutput('⏳ جاري حساب الترتيب المناسب باستخدام DFS...');

    async function topoDFS(u) {
        visited.add(u);
        animatingNodes.add(u);
        drawGraph();
        await sleep(800);

        // نجيب المواد التابعة للمادة u
        let dependents = edges.filter(e => e.from === u).map(e => e.to);

        for (let v of dependents) {
            if (!visited.has(v)) {
                await topoDFS(v);
            }
        }

        animatingNodes.delete(u);
        doneNodes.add(u);
        topoStack.push(u);
        drawGraph();
        await sleep(400);
    }

    for (let c of courses) {
        if (!visited.has(c.id)) {
            await topoDFS(c.id);
        }
    }

    // طباعة المكدس بالعكس
    const orderText = topoStack.slice().reverse().map((id, index) => {
        const course = courses.find(c => c.id === id);
        return `${index + 1}. ${course.name}`;
    }).join('\n');

    showSimOutput('✅ الترتيب الموصى به (DFS Topological Sort):\n' + orderText);
}

// ===== Cycle Detection =====
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
        drawGraph();
        await sleep(600);

        for (let i = 0; i < edges.length; i++) {
            if (edges[i].from === u) {
                let v = edges[i].to;
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
        drawGraph();
        return false;
    }

    for (let i = 0; i < courses.length; i++) {
        if (state[courses[i].id] === 0) {
            if (await dfs(courses[i].id, [])) break;
        }
    }

    if (cycleFound) {
        const cycleText = cyclePath.map(id => {
            const course = courses.find(c => c.id === id);
            return course ? course.name : id;
        }).join(' → ');
        showSimOutput('🚫 تم اكتشاف حلقة!\nالمسار: ' + cycleText + '\nهذا يعني مادة تعتمد على نفسها بشكل غير مباشر.');
    } else {
        showSimOutput('✅ لا توجد حلقات في الـ Graph.\nالخطة الدراسية صحيحة.');
    }
}

function detectCycleLogic() {
    let state = {};
    courses.forEach(c => state[c.id] = 0);

    function dfs(u) {
        state[u] = 1;
        for (let i = 0; i < edges.length; i++) {
            if (edges[i].from === u) {
                let v = edges[i].to;
                if (state[v] === 1) return true;
                if (state[v] === 0 && dfs(v)) return true;
            }
        }
        state[u] = 2;
        return false;
    }

    for (let i = 0; i < courses.length; i++) {
        if (state[courses[i].id] === 0) {
            if (dfs(courses[i].id)) return true;
        }
    }
    return false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== C++ Code Runner (Simulation) =====
function runCppCode() {
    const code = document.getElementById('cppEditor').value;
    const outputDiv = document.getElementById('consoleOutput');

    outputDiv.innerHTML = '<div class="loading"></div> Compiling and running...';

    setTimeout(() => {
        const output = simulateCppOutput(code);
        outputDiv.textContent = output;
    }, 1500);
}

function clearOutput() {
    document.getElementById('consoleOutput').textContent = 'اضغط "تشغيل الكود" لرؤية الناتج هنا...';
}

function simulateCppOutput(code) {
    // This function simulates the C++ compiler output based on the visible code
    // It analyzes simple patterns without actually compiling

    const lines = code.split('\n');
    let output = [];
    let hasMain = code.includes('int main()');
    let hasIncludes = code.includes('#include');
    
    // Try to find cout statements
    const coutRegex = /cout\s*<<\s*"([^"]*)"|cout\s*<<\s*([^;]+)/g;
    let coutMatches = [];
    let match;
    while ((match = coutRegex.exec(code)) !== null) {
        coutMatches.push(match);
    }

    if (!hasIncludes && hasMain) {
        return 'error: iostream not included\nerror: expected declaration before ...';
    }

    if (!hasMain) {
        return 'error: undefined reference to `WinMain\'\nerror: ld returned 1 exit status';
    }

    // Detect priority queue / heap example
    if (code.includes('priority_queue') && code.includes('minHeap')) {
        // Extract pushed values
        const pushRegex = /minHeap\.push\((\d+)\)/g;
        let values = [];
        let m;
        while ((m = pushRegex.exec(code)) !== null) {
            values.push(parseInt(m[1]));
        }
        
        if (values.length > 0) {
            values.sort((a, b) => a - b);
            
            if (code.includes('Study order')) {
                output.push('Study order by priority: ' + values.join(' '));
            } else {
                output.push('Min Heap: ' + values.join(' '));
            }
        }
    }

    // Detect project code with predefined data
    if (code.includes('=== All Courses ===') || code.includes('showPrerequisites')) {
        output.push('=== All Courses ===');
        output.push('101 - Programming 1 (3 hours)');
        output.push('102 - Programming 2 (3 hours)');
        output.push('103 - Data Structures (3 hours)');
        output.push('104 - Algorithms (3 hours)');
        output.push('');
        output.push('=== Prerequisites for Algorithms ===');
        output.push('- 103 - Data Structures');
        output.push('- 102 - Programming 2');
        output.push('- 101 - Programming 1');
        output.push('');
        output.push('=== Recommended Study Order ===');
        output.push('101 - Programming 1');
        output.push('102 - Programming 2');
        output.push('103 - Data Structures');
        output.push('104 - Algorithms');
    }

    // Detect simple cout text outputs
    if (output.length === 0) {
        // Default: try to find literal strings in cout
        const stringRegex = /cout\s*<<\s*"([^"]*)"/g;
        let strings = [];
        let sm;
        while ((sm = stringRegex.exec(code)) !== null) {
            strings.push(sm[1]);
        }
        
        if (strings.length > 0) {
            output.push(strings.join(''));
        } else {
            output.push('Program finished with exit code 0');
        }
    }

    return output.join('\n') + '\n\nProcess finished with exit code 0';
}
