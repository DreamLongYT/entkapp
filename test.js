import { execa } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname);
const entkappCli = path.join(projectRoot, 'bin', 'cli.mjs');

const playgrounds = [
  'playgrounds/basic',
  'playgrounds/hard',
  'playgrounds/intermediate',
  'playgrounds/monorepo-basic/packages/app',
  'playgrounds/monorepo-basic/packages/ui',
  'playgrounds/monorepo-basic/packages/utils',
  'playgrounds/monorepo-hard/packages/api',
  'playgrounds/monorepo-hard/packages/app',
  'playgrounds/monorepo-hard/packages/domain',
  'playgrounds/monorepo-hard/packages/services',
  'playgrounds/monorepo-intermediate/packages/app',
  'playgrounds/monorepo-intermediate/packages/ui',
  'playgrounds/monorepo-intermediate/packages/utils',
  'playgrounds/monorepo-nightmare/packages/app',
  'playgrounds/monorepo-nightmare/packages/bridge',
  'playgrounds/monorepo-nightmare/packages/core',
  'playgrounds/monorepo-normal/packages/app',
  'playgrounds/monorepo-normal/packages/lib-a',
  'playgrounds/monorepo-normal/packages/lib-b',
  'playgrounds/nightmare',
  'playgrounds/normal',
];

async function runTest() {
  let allTestsPassed = true;

  for (const playground of playgrounds) {
    const cwd = path.join(projectRoot, playground);
    console.log(`\nRunning entkapp in: ${playground}`);
    try {
      const { stdout } = await execa('node', [entkappCli, '-r', '--cwd', cwd, '--yes'], { cwd: projectRoot });
      console.log(stdout);

      if (stdout.includes('Core optimization cycle completed smoothly')) {
        console.log(`✅ Test passed for ${playground}`);
      } else {
        console.error(`❌ Test failed for ${playground}: Expected success message not found.`);
        allTestsPassed = false;
      }

      // Add specific assertions for each playground if needed
      if (playground === 'playgrounds/basic') {
        if (!stdout.includes('Remove 1 unused dependencies:')) {
          console.error(`❌ Basic playground test failed: Expected unused dependency detection.`);
          allTestsPassed = false;
        }
      }

    } catch (error) {
      console.error(`❌ Test failed for ${playground}:`, error.message);
      console.error(error.stdout);
      allTestsPassed = false;
    }
  }

  if (allTestsPassed) {
    console.log('\n🎉 All playground tests completed successfully!');
    process.exit(0);
  } else {
    console.error('\n🔥 Some playground tests failed.');
    process.exit(1);
  }
}

runTest();
