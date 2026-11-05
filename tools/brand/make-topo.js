// Harbor Mind contour pattern (stands in for the reference topography.svg, same 1441x1085 frame):
// rings of gently wobbling closed curves around three "depth" centers, like a harbor chart.
// node tools/brand/make-topo.js -> media/topography.svg
const fs = require('fs'), path = require('path');
const W = 1441, H = 1085;
const centers = [[260, 300, 15], [1120, 720, 17], [760, 160, 9]];
let paths = '';
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (const [cx, cy, rings] of centers) {
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  for (let r = 1; r <= rings; r++) {
    const R = r * 34; let d = '';
    for (let k = 0; k <= 120; k++) {
      const a = (k / 120) * Math.PI * 2;
      const wob = 1 + 0.09 * Math.sin(3 * a + ph[0] + r * 0.15) + 0.05 * Math.sin(5 * a + ph[1]) + 0.03 * Math.sin(8 * a + ph[2] + r * 0.3);
      const x = cx + Math.cos(a) * R * wob * 1.18, y = cy + Math.sin(a) * R * wob;
      d += (k ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    paths += `<path d="${d} Z"/>`;
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><g fill="none" stroke="#0b0503" stroke-opacity=".14" stroke-width="1.1">${paths}</g></svg>\n`;
fs.writeFileSync(path.join(__dirname, '../../media/topography.svg'), svg);
console.log('topography', (svg.length / 1024).toFixed(1) + 'KB');
