#!/usr/bin/env node
// Read-only static-resource concurrency smoke test. Never submits questionnaire data.
import { performance } from 'node:perf_hooks';

const origin = process.argv[2] || 'http://127.0.0.1:8011';
const url = new URL(origin);
if (!['http:', 'https:'].includes(url.protocol)) throw new Error('需要 HTTP(S) URL');
const resources = [
  'index.html',
  'experiment.html',
  'assets/experiment.js',
  'assets/questionnaire-step13c7.css',
  'assets/survey-xlsx-export.js',
  'assets/vendor/xlsx-js-style.min.js',
  'assets/vendor/jszip.min.js',
  'assets/stimuli/formal/formal-task-pool-v4.json',
  'assets/stimuli/formal/formal-time-color.svg',
  'assets/stimuli/formal/formal-category-color.svg',
  'assets/welcome/v2/welcome-01-mono.png',
  'assets/welcome/v2/welcome-02-time.png',
  'assets/welcome/v2/welcome-03-category.png'
];
const sizes = [10, 25, 50, 100];
const percentile = (values, p) => values.length ? values[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)].toFixed(1) : '-';

for (const size of sizes) {
  const results = await Promise.all(Array.from({ length: size }, (_, client) => Promise.all(resources.map(async resource => {
    const started = performance.now();
    try {
      const target = new URL(resource, url);
      target.searchParams.set('loadtest', String(client));
      const response = await fetch(target, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
      await response.arrayBuffer();
      return { resource, status: response.status, elapsed: performance.now() - started };
    } catch (error) {
      return { resource, status: 'NETWORK', elapsed: performance.now() - started, error: error.message };
    }
  })))).then(groups => groups.flat());
  const times = results.map(result => result.elapsed).sort((a, b) => a - b);
  const counts = Object.fromEntries([...new Set(results.map(result => result.status))].sort().map(status => [status, results.filter(result => result.status === status).length]));
  const errors = results.filter(result => result.status !== 200);
  console.log(JSON.stringify({ concurrentClients: size, requests: results.length, success: results.length - errors.length, errors: errors.length,
    p50Ms: percentile(times, 0.5), p95Ms: percentile(times, 0.95), maxMs: times.at(-1)?.toFixed(1), httpStatusCounts: counts,
    failedResources: [...new Set(errors.map(result => `${result.resource} (${result.status}${result.error ? `: ${result.error}` : ''})`))] }));
}
