#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function checkFile(filePath, description) {
  const fullPath = join(rootDir, filePath);
  if (existsSync(fullPath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description}: ${filePath} (missing)`);
    return false;
  }
}

function checkPackageJson() {
  try {
    const packagePath = join(rootDir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    console.log('\n📦 Package.json checks:');
    
    const required = ['name', 'version', 'description', 'main', 'author', 'license'];
    let valid = true;
    
    required.forEach(field => {
      if (packageJson[field]) {
        console.log(`✅ ${field}: ${JSON.stringify(packageJson[field])}`);
      } else {
        console.log(`❌ ${field}: missing`);
        valid = false;
      }
    });
    
    // Check whether author information needs updating
    if (packageJson.author && packageJson.author.name === 'Your Name') {
      console.log(`⚠️  author.name needs updating: ${packageJson.author.name}`);
      valid = false;
    }
    
    // Check whether repository information needs updating
    if (packageJson.repository && packageJson.repository.url.includes('yourusername')) {
      console.log(`⚠️  repository.url needs updating: ${packageJson.repository.url}`);
      valid = false;
    }
    
    return valid;
  } catch (error) {
    console.log(`❌ Package.json parse error: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔍 NPM prepublish checks\n');
  
  let allValid = true;
  
  // Check required files
  console.log('📄 Required file checks:');
  allValid &= checkFile('package.json', 'Package configuration');
  allValid &= checkFile('README.md', 'Project documentation');
  allValid &= checkFile('LICENSE', 'License file');
  allValid &= checkFile('index.js', 'Entry point');
  allValid &= checkFile('FEATURES.md', 'Feature description');
  
  // Check package.json contents
  allValid &= checkPackageJson();
  
  // Check environment
  console.log('\n🔧 Environment checks:');
  console.log(`✅ Node.js version: ${process.version}`);
  
  console.log('\n' + '='.repeat(50));
  
  if (allValid) {
    console.log('🎉 All checks passed; ready to publish to npm');
    console.log('\n📝 Publishing steps:');
    console.log('1. npm login');
    console.log('2. npm publish');
  } else {
    console.log('⚠️  Fix the issues above before publishing');
    process.exit(1);
  }
}

main(); 