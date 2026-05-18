// SELECT CHART ELEMENT
const chartEl = document.querySelector(".chart");

// CREATE CANVAS ELEMENT
const canvas = document.createElement("canvas");
canvas.width = 50;
canvas.height = 50;

chartEl.appendChild(canvas);

// TO DRAW ON CANVAS, WE NEED TO GET CONTEXT OF CANVAS
const ctx = canvas.getContext("2d");

// CHANGE LINE WIDTH
ctx.lineWidth = 8;

// CIRCLE RADIUS
const R = 20;

function drawCircle(color, ratio, anticlockwise) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(
    canvas.width / 2,
    canvas.height / 2,
    R,
    0,
    ratio * 2 * Math.PI,
    anticlockwise
  );
  ctx.stroke();
}

function updateChart(income, outcome) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const total = income + outcome;
  const ratio = total > 0 ? income / total : 0;

  drawCircle("#FFF", -ratio, true);
  drawCircle("#F0624D", 1 - ratio, false);
}

// Keep the classic-script browser API available when the file is loaded as a module in tests.
globalThis.updateChart = updateChart;
