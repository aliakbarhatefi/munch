// Ensure the Google namespace is typed but optional at runtime.
export {}

declare global {
  interface Window {
    google?: typeof google
  }
}
