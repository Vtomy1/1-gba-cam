/**
 * Synthetic retro test pattern generator.
 * Provides a dynamic animated scene when camera is offline or for benchmarking PPU dithering.
 */
export function renderTestPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestamp: number
): void {
  const t = timestamp * 0.001;

  // Background gradient with scrolling checker
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0a192f');
  bgGrad.addColorStop(0.5, '#1e293b');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Moving checkerboard grid
  const gridSize = 16;
  const offsetX = (t * 20) % gridSize;
  const offsetY = (t * 15) % gridSize;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let y = -gridSize; y < height + gridSize; y += gridSize) {
    for (let x = -gridSize; x < width + gridSize; x += gridSize) {
      if (((Math.floor((x + offsetX) / gridSize) + Math.floor((y + offsetY) / gridSize)) % 2) === 0) {
        ctx.fillRect(x + offsetX, y + offsetY, gridSize, gridSize);
      }
    }
  }

  // Smooth color gradient bars (ideal for showcasing Bayer and Atkinson dithering)
  const barHeight = 22;
  const barY = height - barHeight - 8;
  const barGrad = ctx.createLinearGradient(8, 0, width - 16, 0);
  barGrad.addColorStop(0.0, '#000000');
  barGrad.addColorStop(0.2, '#ff0055');
  barGrad.addColorStop(0.4, '#ffaa00');
  barGrad.addColorStop(0.6, '#00ff88');
  barGrad.addColorStop(0.8, '#00aaff');
  barGrad.addColorStop(1.0, '#ffffff');

  ctx.fillStyle = barGrad;
  ctx.fillRect(8, barY, width - 16, barHeight);

  // Rotating 3D Wireframe Cube in center
  const centerX = width * 0.35;
  const centerY = height * 0.42;
  const size = 32;

  const rotX = t * 1.2;
  const rotY = t * 1.6;

  // 8 vertices of cube [-1, 1]
  const vertices = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1],
  ];

  // Project vertices
  const projected = vertices.map(([x, y, z]) => {
    // Rotate Y
    let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
    let z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
    // Rotate X
    let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
    let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

    // Perspective projection
    const d = 3;
    const f = d / (d + z2);
    return [centerX + x1 * size * f, centerY + y2 * size * f];
  });

  // Draw cube edges
  const edges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7]
  ];

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  edges.forEach(([i, j]) => {
    ctx.moveTo(projected[i][0], projected[i][1]);
    ctx.lineTo(projected[j][0], projected[j][1]);
  });
  ctx.stroke();

  // Bouncing shaded sphere (highlights smooth dithering on curved geometry)
  const sphereX = width * 0.72;
  const sphereY = centerY + Math.sin(t * 3) * 18;
  const radius = 24;

  const sphereGrad = ctx.createRadialGradient(
    sphereX - 7, sphereY - 7, 2,
    sphereX, sphereY, radius
  );
  sphereGrad.addColorStop(0, '#ffffff');
  sphereGrad.addColorStop(0.3, '#f43f5e');
  sphereGrad.addColorStop(0.8, '#881337');
  sphereGrad.addColorStop(1, '#1e050f');

  ctx.fillStyle = sphereGrad;
  ctx.beginPath();
  ctx.arc(sphereX, sphereY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Retro text watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('TEST SIGNAL · GBA PPU 240x160', 10, 14);
}
