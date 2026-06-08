#!/usr/bin/env bun

export {};

const G = '\x1b[32m';
const B = '\x1b[1m';
const D = '\x1b[2m';
const X = '\x1b[0m';

function printHelp() {
  console.log('');
  console.log(`  ${B}amigmi${X} — track your AI coding spend`);
  console.log('');
  console.log(`  ${B}Commands:${X}`);
  console.log(`    ${G}init <token>${X}   ${D}authenticate this machine with your API key${X}`);
  console.log(`    ${G}sync${X}           ${D}push latest usage data to amigmi.xyz${X}`);
  console.log(`    ${G}help${X}           ${D}show this help message${X}`);
  console.log('');
  console.log(`  ${B}Examples:${X}`);
  console.log(`    ${D}$${X} bunx amigmi init amb_xxxxxxxxxxxxxxxx`);
  console.log(`    ${D}$${X} bunx amigmi sync`);
  console.log('');
  console.log(`  ${D}Get your token at https://amigmi.xyz${X}`);
  console.log('');
}

const cmd = process.argv[2];

switch (cmd) {
  case 'init':
    await import('./init');
    break;
  case 'sync':
    await import('./sync');
    break;
  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;
  default:
    printHelp();
    process.exit(cmd ? 1 : 0);
}
