let canvas;
let isDrawing = false;
let currentTool = 'pencil';

function drawGrid(spacing = 30) {
    background(255);
    stroke(230);
    strokeWeight(1);

    for (let x = 0; x < width; x += spacing) {
        line(x, 0, x, height);
    }

    for (let y = 0; y < height; y += spacing) {
        line(0, y, width, y);
    }
}

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    background(255);
    drawGrid();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    if (isDrawing) {
        if (currentTool === 'pencil') {
            stroke(0);
            strokeWeight(4);
        } else if (currentTool === 'eraser') {
            stroke(255);
            strokeWeight(20);
        }
        line(pmouseX, pmouseY, mouseX, mouseY);
    }
}

function mousePressed() {
    isDrawing = true;
}

function mouseReleased() {
    isDrawing = false;
}

function selectTool(tool) {
    currentTool = tool;

    // Reset all tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white', 'hover:bg-gray-600');
        btn.classList.add('hover:bg-gray-600');
    });

    // Apply active styles to the selected tool
    const btnId = tool === 'pencil' ? 'pencil-btn' : 'eraser-btn';
    const btn = document.getElementById(btnId);
    btn.classList.remove('hover:bg-gray-600');
    btn.classList.add('bg-indigo-600', 'text-white');
}

selectTool('pencil');

document.getElementById('pencil-btn').addEventListener('click', () => selectTool('pencil'));
document.getElementById('eraser-btn').addEventListener('click', () => selectTool('eraser'));

document.getElementById('download-btn').addEventListener('click', () => {
    saveCanvas(canvas, 'inkspire_sketch', 'png');
});

document.getElementById('toggle-theme').addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

function enhanceWithAI(imageDataUrl) {
    console.log('placeholder for AI enhancement logic');
}

document.getElementById('enhance-btn').addEventListener('click', () => {
    const dataURL = canvas.elt.toDataURL();
    enhanceWithAI(dataURL);
});

function clearCanvas() {
    background(255);
    drawGrid();
}

document.getElementById('clear-btn').addEventListener('click', () => {
    Swal.fire({
        title: 'Clear canvas?',
        text: "This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, clear it!'
    }).then((result) => {
        if (result.isConfirmed) {
            clearCanvas();
            Swal.fire('Cleared!', 'Your canvas has been cleared.', 'success');
        }
    });
});

// Apply consistent size and spacing to all buttons
document.querySelectorAll('.sidebar-btn, .tool-btn').forEach(btn => {
    btn.classList.add(
        'w-full', 'h-14', 'flex', 'items-center', 'justify-center',
        'transition', 'duration-200'
    );
});

document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.classList.add('hover:bg-gray-600');
});

// Render Lucide icons
lucide.createIcons();