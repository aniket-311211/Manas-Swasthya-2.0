#!/usr/bin/env node

/**
 * Simple icon generation script for PWA development
 * This script creates placeholder icons for development purposes
 * For production, replace with actual designed icons
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const iconSizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Shortcut icon sizes
const shortcutSizes = [
  { size: 96, name: 'chat-icon-96x96.png' },
  { size: 96, name: 'assessment-icon-96x96.png' },
  { size: 96, name: 'resources-icon-96x96.png' }
];

// Create a simple SVG icon
function createSVGIcon(size, type = 'main') {
  const colors = {
    main: { primary: '#0d9488', secondary: '#14b8a6' },
    chat: { primary: '#3b82f6', secondary: '#60a5fa' },
    assessment: { primary: '#8b5cf6', secondary: '#a78bfa' },
    resources: { primary: '#f59e0b', secondary: '#fbbf24' }
  };
  
  const color = colors[type] || colors.main;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color.primary};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color.secondary};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
    <circle cx="${size * 0.5}" cy="${size * 0.4}" r="${size * 0.15}" fill="white" opacity="0.9"/>
    <path d="M${size * 0.3} ${size * 0.6} Q${size * 0.5} ${size * 0.7} ${size * 0.7} ${size * 0.6}" stroke="white" stroke-width="${size * 0.03}" fill="none" opacity="0.9"/>
    <text x="${size * 0.5}" y="${size * 0.85}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.1}" font-weight="bold">N</text>
  </svg>`;
}

// Convert SVG to PNG (simplified - in production use a proper library)
function createPNGFromSVG(svgContent, size, filename) {
  // This is a placeholder - in production, you would use a library like sharp or canvas
  // For now, we'll create a simple text file as a placeholder
  const placeholderContent = `# Placeholder for ${filename}
# Size: ${size}x${size}px
# This is a development placeholder. Replace with actual PNG icon.
# 
# To create the actual icon:
# 1. Use the SVG content below as a template
# 2. Convert to PNG using an image editor or online tool
# 3. Ensure the icon is ${size}x${size} pixels
# 4. Save as ${filename}

SVG Template:
${svgContent}
`;
  
  return placeholderContent;
}

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Generating PWA icon placeholders...');

// Generate main icons
iconSizes.forEach(({ size, name }) => {
  const svgContent = createSVGIcon(size, 'main');
  const placeholderContent = createPNGFromSVG(svgContent, size, name);
  
  const filePath = path.join(iconsDir, name.replace('.png', '.txt'));
  fs.writeFileSync(filePath, placeholderContent);
  console.log(`✅ Created placeholder for ${name}`);
});

// Generate shortcut icons
shortcutSizes.forEach(({ size, name }) => {
  const type = name.split('-')[0];
  const svgContent = createSVGIcon(size, type);
  const placeholderContent = createPNGFromSVG(svgContent, size, name);
  
  const filePath = path.join(iconsDir, name.replace('.png', '.txt'));
  fs.writeFileSync(filePath, placeholderContent);
  console.log(`✅ Created placeholder for ${name}`);
});

console.log(`
🎉 Icon placeholders generated successfully!

📝 Next Steps:
1. Replace the .txt files in public/icons/ with actual PNG icons
2. Use the SVG templates provided in each .txt file as a starting point
3. Ensure all icons maintain the same design language
4. Test the icons on different backgrounds and devices

🔧 Recommended Tools:
- Figma: For creating scalable vector icons
- Canva: For quick icon generation
- PWA Builder: Microsoft's tool for generating PWA assets
- Favicon.io: For generating favicon sets

💡 Mental Health App Considerations:
- Use calming, professional colors
- Maintain consistency across all sizes
- Ensure good contrast and accessibility
- Consider using wellness-related symbols
`);

// Create a simple favicon.ico placeholder
const faviconContent = `# Placeholder for favicon.ico
# This is a development placeholder. Replace with actual favicon.ico file.
# 
# To create the actual favicon:
# 1. Create a 32x32 pixel icon
# 2. Convert to .ico format using an online tool
# 3. Save as favicon.ico in the public directory
`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon-placeholder.txt'), faviconContent);
console.log('✅ Created favicon placeholder');
