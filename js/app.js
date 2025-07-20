let canvas;
let isDrawing = false;
let currentTool = 'pencil';
let gridLayer;
let drawingLayer;

function drawGrid(g, spacing = 30) {
    g.clear();
    g.background(255);
    g.stroke(230);
    g.strokeWeight(1);

    for (let x = 0; x < g.width; x += spacing) {
        g.line(x, 0, x, g.height);
    }

    for (let y = 0; y < g.height; y += spacing) {
        g.line(0, y, g.width, y);
    }
}

function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');

    gridLayer = createGraphics(windowWidth, windowHeight);
    drawingLayer = createGraphics(windowWidth, windowHeight);

    drawGrid(gridLayer);

    // Prevent right-click context menu on canvas
    canvas.elt.addEventListener('contextmenu', e => e.preventDefault());
}

function draw() {
    clear();
    image(gridLayer, 0, 0);
    image(drawingLayer, 0, 0);

    if (isDrawing) {
        if (currentTool === 'pencil') {
            drawingLayer.noErase();
            drawingLayer.stroke(0);
            drawingLayer.strokeWeight(4);
        } else if (currentTool === 'eraser') {
            drawingLayer.erase();
            drawingLayer.strokeWeight(20);
        }

        drawingLayer.line(pmouseX, pmouseY, mouseX, mouseY);
        drawingLayer.noErase();
    }
}

function mousePressed() {
    if (Swal.isVisible()) return;  // Prevent drawing if a modal is open
    isDrawing = true;
}

function mouseReleased() {
    isDrawing = false;
}

function windowResized() {
    // Keep the previous drawing and resize the canvas
    const prevDrawing = drawingLayer.get();

    resizeCanvas(windowWidth, windowHeight);
    initLayers();

    // Restore the previous drawing
    drawingLayer.image(prevDrawing, 0, 0);
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

function clearCanvas() {
    drawingLayer.clear();
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

document.getElementById('download-btn').addEventListener('click', () => {
    saveCanvas(canvas, 'inkspire_sketch', 'png');
});

function enhanceWithAI(imageDataUrl) {
    console.log('placeholder for AI enhancement logic');
}

document.getElementById('enhance-btn').addEventListener('click', () => {
    const dataURL = canvas.elt.toDataURL();
    enhanceWithAI(dataURL);
});

document.getElementById('toggle-theme').addEventListener('click', () => {
    document.body.classList.toggle('dark');
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