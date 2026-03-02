import { createReadStream, createWriteStream, existsSync, mkdirSync, rmSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const IMAGE_NAME = process.env.WEBDESK_DOCKER_IMAGE ?? 'webdesk-ui';
const IMAGE_TAG = process.env.WEBDESK_DOCKER_TAG ?? 'latest';
const OUT_DIR = process.env.WEBDESK_DOCKER_OUT_DIR ?? 'artifacts';
const TAR_NAME = `${IMAGE_NAME}-${IMAGE_TAG}.tar`;
const TARGZ_NAME = `${TAR_NAME}.gz`;

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const main = async () => {
  if (!existsSync('Dockerfile')) {
    throw new Error('Dockerfile not found in current directory.');
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const imageRef = `${IMAGE_NAME}:${IMAGE_TAG}`;
  const tarPath = path.join(OUT_DIR, TAR_NAME);
  const tarGzPath = path.join(OUT_DIR, TARGZ_NAME);

  if (existsSync(tarPath)) rmSync(tarPath);
  if (existsSync(tarGzPath)) rmSync(tarGzPath);

  console.log(`Building Docker image ${imageRef}...`);
  run('docker', ['build', '-t', imageRef, '.']);

  console.log(`Saving Docker image to ${tarPath}...`);
  run('docker', ['save', '-o', tarPath, imageRef]);

  console.log(`Compressing ${tarPath} -> ${tarGzPath}...`);
  await pipeline(createReadStream(tarPath), createGzip({ level: 9 }), createWriteStream(tarGzPath));

  rmSync(tarPath);

  console.log(`Done. Docker image package: ${tarGzPath}`);
  console.log(`Load with: docker load -i ${tarGzPath}`);
  console.log(`Run with: docker run --rm -p 8080:80 ${imageRef}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
