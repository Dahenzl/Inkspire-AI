let canvas;
let isDrawing = false;
let currentTool = 'pencil';
let gridLayer;
let drawingLayer;
let currentColor = '#000000';

function drawGrid(g, spacing = 30) {
    const isDark = document.body.classList.contains('dark');
    g.clear();
    g.background(isDark ? '#1a202c' : '#f7fafc');
    g.stroke(isDark ? '#4a5568' : '#cbd5e0');
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
            drawingLayer.stroke(currentColor);
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

function getSwalThemeClasses() {
    return document.body.classList.contains('dark') ? 'bg-gray-800 text-white' : '';
}

document.getElementById('clear-btn').addEventListener('click', () => {
    Swal.fire({
        title: 'Clear canvas?',
        text: "This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, clear it!',
        customClass: getSwalThemeClasses()
    }).then((result) => {
        if (result.isConfirmed) {
            clearCanvas();
            Swal.fire({
                title: 'Cleared!',
                text: 'Your canvas has been cleared.',
                icon: 'success',
                customClass: getSwalThemeClasses()
            });
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
    drawGrid(gridLayer);

    // Invert the current color if it's black or white
    if (document.body.classList.contains('dark') && currentColor === '#000000') {
        currentColor = '#ffffff';
    } else if (!document.body.classList.contains('dark') && currentColor === '#ffffff') {
        currentColor = '#000000';
    }

    // Invert the color of the black/white button
    const blackBtn = document.querySelector('.color-btn[data-original="black"]');
    if (blackBtn) {
        if (document.body.classList.contains('dark')) {
            blackBtn.style.backgroundColor = '#ffffff';
            blackBtn.setAttribute('data-color', '#ffffff');
        } else {
            blackBtn.style.backgroundColor = '#000000';
            blackBtn.setAttribute('data-color', '#000000');
        }
    }

    // Invert colors in the drawing layer
    const fromColor = document.body.classList.contains('dark') ? [0, 0, 0, 255] : [255, 255, 255, 255];
    const toColor = document.body.classList.contains('dark') ? [255, 255, 255, 255] : [0, 0, 0, 255];

    drawingLayer.loadPixels();
    for (let i = 0; i < drawingLayer.pixels.length; i += 4) {
        if (drawingLayer.pixels[i] === fromColor[0] &&
            drawingLayer.pixels[i + 1] === fromColor[1] &&
            drawingLayer.pixels[i + 2] === fromColor[2] &&
            drawingLayer.pixels[i + 3] === fromColor[3]) {
            drawingLayer.pixels[i] = toColor[0];
            drawingLayer.pixels[i + 1] = toColor[1];
            drawingLayer.pixels[i + 2] = toColor[2];
            drawingLayer.pixels[i + 3] = toColor[3];
        }
    }
    drawingLayer.updatePixels();
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

// Apply consistent styles to color buttons
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentColor = btn.getAttribute('data-color');
        selectTool('pencil');

        // Visually indicate the selected color
        document.querySelectorAll('.color-btn').forEach(b =>
            b.classList.remove('ring-4', 'ring-offset-2', 'ring-indigo-500')
        );
        btn.classList.add('ring-4', 'ring-offset-2', 'ring-indigo-500');
    });
});

// Add custom color input functionality
const customColorInput = document.getElementById('custom-color');

function handleCustomColor(e) {
    const selectedColor = e.target.value;

    currentColor = selectedColor;
    currentTool = 'pencil';
    selectTool('pencil');

    customColorInput.parentElement.style.backgroundColor = selectedColor;
}

customColorInput.addEventListener('input', handleCustomColor);

// Render Lucide icons
lucide.createIcons();