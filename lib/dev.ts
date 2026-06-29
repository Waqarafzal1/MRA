/** True when running on a local dev host (not production). */
export function isLocalhost(hostname?: string): boolean {
  const h =
    hostname ??
    (typeof window !== 'undefined' ? window.location.hostname : '');
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}
