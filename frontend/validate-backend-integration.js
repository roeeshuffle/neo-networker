#!/usr/bin/env node

/**
 * Backend Integration Validation Script
 * Validates that frontend tests match actual backend API structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating Frontend Tests Against Backend API Structure');
console.log('========================================================');

// Backend API endpoints structure
const backendEndpoints = {
  auth: [
    'POST /api/auth/register',
    'POST /api/auth/login', 
    'GET /api/auth/me',
    'POST /api/auth/logout'
  ],
  people: [
    'GET /api/people',
    'POST /api/people',
    'GET /api/people/:id',
    'PUT /api/people/:id',
    'DELETE /api/people/:id'
  ],
  tasks: [
    'GET /api/tasks',
    'POST /api/tasks',
    'GET /api/tasks/:id',
    'PUT /api/tasks/:id',
    'DELETE /api/tasks/:id',
    'GET /api/projects'
  ],
  events: [
    'GET /api/events',
    'POST /api/events',
    'GET /api/events/:id',
    'PUT /api/events/:id',
    'DELETE /api/events/:id'
  ],
  csv: [
    'POST /api/csv/preview',
    'POST /api/csv/preview-simple',
    'POST /api/csv/import'
  ],
  customFields: [
    'GET /api/custom-fields',
    'POST /api/custom-fields',
    'PUT /api/custom-fields/:id',
    'DELETE /api/custom-fields/:id'
  ],
  admin: [
    'GET /api/admin/pending-users',
    'GET /api/admin/users',
    'POST /api/admin/approve-user/:id',
    'POST /api/admin/reject-user/:id',
    'DELETE /api/admin/users/:id'
  ],
  userPreferences: [
    'GET /api/user-preferences',
    'PUT /api/user-preferences'
  ]
};

// Expected test files
const testFiles = [
  'src/__tests__/api.test.ts',
  'src/__tests__/components.test.tsx',
  'src/__tests__/csv-import.test.tsx',
  'src/__tests__/custom-fields.test.tsx',
  'src/__tests__/e2e.test.tsx'
];

// Validation functions
function validateTestFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Missing test file: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  console.log(`✅ Found test file: ${filePath}`);
  
  // Check for basic test structure
  const hasDescribe = content.includes('describe(');
  const hasTest = content.includes('test(') || content.includes('it(');
  const hasExpect = content.includes('expect(');
  
  if (!hasDescribe) {
    console.log(`  ⚠️  Warning: No describe blocks found in ${filePath}`);
  }
  
  if (!hasTest) {
    console.log(`  ⚠️  Warning: No test cases found in ${filePath}`);
  }
  
  if (!hasExpect) {
    console.log(`  ⚠️  Warning: No assertions found in ${filePath}`);
  }
  
  return hasDescribe && hasTest && hasExpect;
}

function validateAPIEndpoints() {
  console.log('\n📡 Validating API Endpoint Coverage...');
  
  const apiTestContent = fs.readFileSync(
    path.join(__dirname, 'src/__tests__/api.test.ts'), 
    'utf8'
  );
  
  let coverage = 0;
  let total = 0;
  
  Object.entries(backendEndpoints).forEach(([category, endpoints]) => {
    console.log(`\n  ${category.toUpperCase()}:`);
    endpoints.forEach(endpoint => {
      total++;
      const [method, path] = endpoint.split(' ');
      const pathPattern = path.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`${method}.*${pathPattern.replace(/\//g, '\\/')}`, 'i');
      
      if (regex.test(apiTestContent)) {
        console.log(`    ✅ ${endpoint}`);
        coverage++;
      } else {
        console.log(`    ❌ ${endpoint} - Not tested`);
      }
    });
  });
  
  const coveragePercent = Math.round((coverage / total) * 100);
  console.log(`\n📊 API Endpoint Coverage: ${coverage}/${total} (${coveragePercent}%)`);
  
  return coveragePercent >= 80; // Require 80% coverage
}

function validateComponentTests() {
  console.log('\n🧩 Validating Component Test Coverage...');
  
  const componentTestContent = fs.readFileSync(
    path.join(__dirname, 'src/__tests__/components.test.tsx'), 
    'utf8'
  );
  
  const expectedComponents = [
    'ContactsPage',
    'TasksPage', 
    'EventsPage',
    'ContactViewModal',
    'DynamicContactForm'
  ];
  
  let found = 0;
  expectedComponents.forEach(component => {
    if (componentTestContent.includes(component)) {
      console.log(`  ✅ ${component} - Tested`);
      found++;
    } else {
      console.log(`  ❌ ${component} - Not tested`);
    }
  });
  
  const coveragePercent = Math.round((found / expectedComponents.length) * 100);
  console.log(`\n📊 Component Coverage: ${found}/${expectedComponents.length} (${coveragePercent}%)`);
  
  return coveragePercent >= 80;
}

function validateCSVTests() {
  console.log('\n📄 Validating CSV Import Tests...');
  
  const csvTestContent = fs.readFileSync(
    path.join(__dirname, 'src/__tests__/csv-import.test.tsx'), 
    'utf8'
  );
  
  const csvFeatures = [
    'file upload',
    'CSV preview',
    'column mapping',
    'Hebrew content',
    'error handling',
    'authentication'
  ];
  
  let found = 0;
  csvFeatures.forEach(feature => {
    if (csvTestContent.toLowerCase().includes(feature.toLowerCase())) {
      console.log(`  ✅ ${feature} - Tested`);
      found++;
    } else {
      console.log(`  ❌ ${feature} - Not tested`);
    }
  });
  
  const coveragePercent = Math.round((found / csvFeatures.length) * 100);
  console.log(`\n📊 CSV Feature Coverage: ${found}/${csvFeatures.length} (${coveragePercent}%)`);
  
  return coveragePercent >= 80;
}

function validateCustomFieldsTests() {
  console.log('\n🔧 Validating Custom Fields Tests...');
  
  const customFieldsTestContent = fs.readFileSync(
    path.join(__dirname, 'src/__tests__/custom-fields.test.tsx'), 
    'utf8'
  );
  
  const customFieldsFeatures = [
    'field creation',
    'field management',
    'contact integration',
    'validation',
    'persistence',
    'API integration'
  ];
  
  let found = 0;
  customFieldsFeatures.forEach(feature => {
    if (customFieldsTestContent.toLowerCase().includes(feature.toLowerCase())) {
      console.log(`  ✅ ${feature} - Tested`);
      found++;
    } else {
      console.log(`  ❌ ${feature} - Not tested`);
    }
  });
  
  const coveragePercent = Math.round((found / customFieldsFeatures.length) * 100);
  console.log(`\n📊 Custom Fields Coverage: ${found}/${customFieldsFeatures.length} (${coveragePercent}%)`);
  
  return coveragePercent >= 80;
}

function validateE2ETests() {
  console.log('\n🌐 Validating End-to-End Tests...');
  
  const e2eTestContent = fs.readFileSync(
    path.join(__dirname, 'src/__tests__/e2e.test.tsx'), 
    'utf8'
  );
  
  const e2eWorkflows = [
    'registration',
    'login',
    'contact management',
    'task management',
    'CSV import',
    'custom fields',
    'error recovery'
  ];
  
  let found = 0;
  e2eWorkflows.forEach(workflow => {
    if (e2eTestContent.toLowerCase().includes(workflow.toLowerCase())) {
      console.log(`  ✅ ${workflow} - Tested`);
      found++;
    } else {
      console.log(`  ❌ ${workflow} - Not tested`);
    }
  });
  
  const coveragePercent = Math.round((found / e2eWorkflows.length) * 100);
  console.log(`\n📊 E2E Workflow Coverage: ${found}/${e2eWorkflows.length} (${coveragePercent}%)`);
  
  return coveragePercent >= 80;
}

function validateTestConfiguration() {
  console.log('\n⚙️  Validating Test Configuration...');
  
  const configFiles = [
    'jest.config.js',
    'src/__tests__/setup.ts',
    'src/__tests__/__mocks__/fileMock.js'
  ];
  
  let allExist = true;
  configFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${file} - Found`);
    } else {
      console.log(`  ❌ ${file} - Missing`);
      allExist = false;
    }
  });
  
  // Check package.json for test scripts
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const testScripts = packageJson.scripts || {};
    
    const requiredScripts = ['test', 'test:watch', 'test:coverage', 'test:ci'];
    requiredScripts.forEach(script => {
      if (testScripts[script]) {
        console.log(`  ✅ ${script} - Found`);
      } else {
        console.log(`  ❌ ${script} - Missing`);
        allExist = false;
      }
    });
  }
  
  return allExist;
}

// Main validation
function main() {
  console.log('Starting validation...\n');
  
  let allValid = true;
  
  // Validate test files exist and have basic structure
  console.log('📁 Validating Test Files...');
  testFiles.forEach(file => {
    if (!validateTestFile(file)) {
      allValid = false;
    }
  });
  
  // Validate specific test areas
  const apiValid = validateAPIEndpoints();
  const componentValid = validateComponentTests();
  const csvValid = validateCSVTests();
  const customFieldsValid = validateCustomFieldsTests();
  const e2eValid = validateE2ETests();
  const configValid = validateTestConfiguration();
  
  allValid = allValid && apiValid && componentValid && csvValid && customFieldsValid && e2eValid && configValid;
  
  console.log('\n🎯 Validation Summary');
  console.log('====================');
  console.log(`API Endpoints: ${apiValid ? '✅' : '❌'}`);
  console.log(`Components: ${componentValid ? '✅' : '❌'}`);
  console.log(`CSV Import: ${csvValid ? '✅' : '❌'}`);
  console.log(`Custom Fields: ${customFieldsValid ? '✅' : '❌'}`);
  console.log(`E2E Workflows: ${e2eValid ? '✅' : '❌'}`);
  console.log(`Configuration: ${configValid ? '✅' : '❌'}`);
  
  if (allValid) {
    console.log('\n🎉 All validations passed! Frontend tests are properly configured.');
    process.exit(0);
  } else {
    console.log('\n❌ Some validations failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run validation
main();
