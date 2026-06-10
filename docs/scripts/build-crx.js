const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ChromeExtension = require('../../chrome-extension/node_modules/crx');

const rootDir = path.resolve(__dirname, '../..');
const extDir = path.join(rootDir, 'chrome-extension');
const packageJsonPath = path.join(extDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

console.log(`Starting CRX build process for version: ${version}...`);

// 1. Run build to bundle the service worker
console.log('Building extension assets...');
execSync('npm run build', { cwd: extDir, stdio: 'inherit' });

// 2. Create a clean temporary build directory
const tempDir = path.join(extDir, 'build-temp');
if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir);

// 3. Copy only runtime files (exclude node_modules, source code, key.pem, etc.)
const filesToCopy = [
    'manifest.json',
    'content.js',
    'privacy.html',
    'terms.html'
];

const dirsToCopy = [
    'popup',
    'signing',
    'assets'
];

function copyFolderRecursiveSync(source, target) {
    if (!fs.existsSync(source)) return;
    let files = [];
    const targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }

    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(file => {
            const curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                fs.copyFileSync(curSource, path.join(targetFolder, file));
            }
        });
    }
}

// Copy individual files
filesToCopy.forEach(file => {
    const src = path.join(extDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(tempDir, file));
    }
});

// Copy directories
dirsToCopy.forEach(dir => {
    const src = path.join(extDir, dir);
    if (fs.existsSync(src)) {
        copyFolderRecursiveSync(src, tempDir);
    }
});

// Copy bundled background script specifically (in background/service-worker.bundle.js)
const bgSrcDir = path.join(extDir, 'background');
const bgDestDir = path.join(tempDir, 'background');
if (fs.existsSync(bgSrcDir)) {
    fs.mkdirSync(bgDestDir, { recursive: true });
    const bundleFile = 'service-worker.bundle.js';
    if (fs.existsSync(path.join(bgSrcDir, bundleFile))) {
        fs.copyFileSync(path.join(bgSrcDir, bundleFile), path.join(bgDestDir, bundleFile));
    }
}

// 4. Pack the extension into CRX
const keyPath = path.join(extDir, 'key.pem');
if (!fs.existsSync(keyPath)) {
    console.error(`Error: Private key not found at ${keyPath}`);
    process.exit(1);
}

const crx = new ChromeExtension({
    privateKey: fs.readFileSync(keyPath),
    codebase: `https://tsign.vnot.my.id/releases/trustlesssign-v${version}.crx`
});

console.log('Packaging extension to CRX...');
crx.load(tempDir)
    .then(crx => crx.pack())
    .then(crxBuffer => {
        const outputDir = path.resolve(rootDir, 'docs/releases');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const crxName = `trustlesssign-v${version}.crx`;
        const outputPath = path.join(outputDir, crxName);
        fs.writeFileSync(outputPath, crxBuffer);
        console.log(`✅ Successfully generated clean CRX: docs/releases/${crxName}`);
        
        // Clean up temp dir
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('Cleanup complete.');
    })
    .catch(err => {
        console.error('❌ Error packaging CRX:', err);
        // Clean up temp dir
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        process.exit(1);
    });
