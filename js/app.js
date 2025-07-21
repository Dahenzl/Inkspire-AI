import { Client } from 'https://esm.sh/@gradio/client';

let canvas;
let isDrawing = false;
let currentTool = 'pencil';
let gridLayer;
let drawingLayer;
let currentColor = '#000000';
let isDark = false;

const container = document.getElementById('canvas-container');

function drawGrid(g, spacing = 30) {
    isDark = document.body.classList.contains('dark');
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
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas = createCanvas(width, height);
    canvas.parent('canvas-container');

    gridLayer = createGraphics(width, height);
    drawingLayer = createGraphics(width, height);

    drawGrid(gridLayer);

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

    // Get the new dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;

    resizeCanvas(width, height);
    gridLayer = createGraphics(width, height);
    drawGrid(gridLayer);
    drawingLayer = createGraphics(width, height);

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

document.getElementById('pencil-btn').addEventListener('click', () => selectTool('pencil'));
document.getElementById('eraser-btn').addEventListener('click', () => selectTool('eraser'));

function clearCanvas() {
    drawingLayer.clear();
}

function getSwalThemeClasses() {
    return isDark ? 'bg-gray-800 text-white' : '';
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

function getDrawingWithBackground(bgColor) {
    const { width, height } = drawingLayer.canvas;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;

    const ctx = tempCanvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(drawingLayer.canvas, 0, 0, width, height);

    return tempCanvas;
}

document.getElementById('download-btn').addEventListener('click', () => {
    saveCanvas(getDrawingWithBackground(isDark ? '#1a202c' : '#f7fafc'), 'inkspire_sketch', 'png');
});

async function enhanceWithAI(imageDataUrl) {
    const { value: formValues } = await Swal.fire({
        title: 'Enhance with AI',
        html: `
            <img src="${imageDataUrl}" alt="Preview" class="mx-auto mb-4 max-h-40 border-2">
            <input id="prompt-input" class="swal2-input" placeholder="Enter a prompt (optional)">
        `,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => document.getElementById('prompt-input').value,
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Enhance',
        customClass: getSwalThemeClasses()
    });

    if (formValues === undefined) return; // User cancelled

    Swal.fire({ title: 'Enhancing...', text: 'Please wait...', didOpen: () => Swal.showLoading(), customClass: getSwalThemeClasses() });

    try {
        const blob = await (await fetch(imageDataUrl)).blob();

        const client = await Client.connect("hysts/ControlNet-v1-1");
        const result = await client.predict("/lineart", {
            image: blob,
            prompt: formValues || 'Make it realistic',
            num_images: 1,
            preprocess_resolution: 768,
            image_resolution: 512,
            num_steps: 60,
            guidance_scale: 20,
            seed: 42,
            preprocessor_name: 'None'
        });

        const enhancedUrl = result.data[0][1].image.url;

        Swal.fire({
            title: 'Enhanced Result',
            html: `<img src="${enhancedUrl}" alt="Preview" class="mx-auto mb-4 max-h-40 border-2">`,
            showCancelButton: true,
            cancelButtonText: 'OK',
            confirmButtonText: 'Download',
            customClass: getSwalThemeClasses()
        }).then(result => {
            if (result.isConfirmed) {
                const a = document.createElement('a');
                a.href = enhancedUrl;
                a.download = 'enhanced_sketch.png';
                a.click();
            }
        });

    } catch (err) {
        Swal.fire({ title: 'Error', text: err.message, icon: 'error', customClass: getSwalThemeClasses() });
    }
}

document.getElementById('enhance-btn').addEventListener('click', () => {
    const dataURL = getDrawingWithBackground(isDark ? '#1a202c' : '#f7fafc').toDataURL();
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

// Select the pencil tool by default
selectTool('pencil');

// Export functions for p5.js
window.setup = setup;
window.draw = draw;
window.mousePressed = mousePressed;
window.mouseReleased = mouseReleased;
window.windowResized = windowResized;