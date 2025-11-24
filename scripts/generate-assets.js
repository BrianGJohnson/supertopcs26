const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const brandingDir = path.join(__dirname, '../public/branding');

const tasks = [
  {
    input: 'icon-square.svg',
    outputs: [
      { width: 2048, height: 2048, name: 'icon-square-2048.png' },
      { width: 1024, height: 1024, name: 'icon-square-1024.png' },
      { width: 512, height: 512, name: 'icon-square-512.png' },
      { width: 128, height: 128, name: 'icon-square-128.png' },
    ]
  },
  {
    input: 'logo-horizontal.svg',
    outputs: [
      { width: 2400, height: 800, name: 'logo-horizontal-2400.png' },
      { width: 1600, height: 533, name: 'logo-horizontal-1600.png' },
      { width: 1200, height: 400, name: 'logo-horizontal-1200.png' },
    ]
  },
  {
    input: 'logo-horizontal-compact.svg',
    outputs: [
      { width: 2400, height: 800, name: 'logo-horizontal-compact-2400.png' },
      { width: 1600, height: 533, name: 'logo-horizontal-compact-1600.png' },
      { width: 1200, height: 400, name: 'logo-horizontal-compact-1200.png' },
    ]
  }
];

async function processTasks() {
  for (const task of tasks) {
    const inputPath = path.join(brandingDir, task.input);
    
    // Read SVG metadata to get viewBox or width/height if needed, 
    // but we can just load with a high density to ensure quality.
    // 72 dpi is standard. 
    // For 2400px width, if base is small, we need higher density.
    // Let's use a safe high density.
    
    for (const output of task.outputs) {
      const outputPath = path.join(brandingDir, output.name);
      
      console.log(`Generating ${output.name}...`);
      
      // Calculate density to ensure crisp render at target size
      // We don't know the exact viewBox here easily without parsing, 
      // but we can just use a high density.
      // Or better: sharp allows resizing SVG directly.
      
      try {
        await sharp(inputPath, { density: 300 }) // Load with high density
          .resize(output.width, output.height, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(outputPath);
      } catch (err) {
        console.error(`Error generating ${output.name}:`, err);
      }
    }
  }
  console.log('All assets generated successfully.');
}

processTasks();
