// Cache management utilities for nexus-mind-care
// Helps clear old styling and component caches

export class CacheManager {
  /**
   * Clear browser cache and force refresh
   */
  static async clearBrowserCache(): Promise<void> {
    try {
      // Clear localStorage items that might contain old styling
      const keysToRemove = Object.keys(localStorage).filter(
        (key) =>
          key.includes("calendar") ||
          key.includes("style") ||
          key.includes("theme")
      );

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Clear sessionStorage
      sessionStorage.clear();

      // If service worker is available, clear caches
      if ("serviceWorker" in navigator && "caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => {
            // Clear old caches
            if (cacheName.includes("static") || cacheName.includes("dynamic")) {
              return caches.delete(cacheName);
            }
          })
        );
      }

      console.log("Browser cache cleared successfully");
    } catch (error) {
      console.error("Error clearing browser cache:", error);
    }
  }

  /**
   * Force reload the page with cache bypass
   */
  static forceReload(): void {
    // Force reload bypassing cache
    window.location.reload();
  }

  /**
   * Clear component-specific cached data
   */
  static clearComponentCache(componentName: string): void {
    try {
      // Remove any localStorage items related to the component
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.toLowerCase().includes(componentName.toLowerCase())) {
          localStorage.removeItem(key);
        }
      });

      // Clear any cached styles by adding a cache-busting timestamp
      const timestamp = Date.now();
      localStorage.setItem(`${componentName}_cache_bust`, timestamp.toString());

      console.log(`Cache cleared for component: ${componentName}`);
    } catch (error) {
      console.error(`Error clearing cache for ${componentName}:`, error);
    }
  }

  /**
   * Add cache-busting query parameter to stylesheets
   */
  static bustStylesheetCache(): void {
    try {
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      const timestamp = Date.now();

      links.forEach((link: Element) => {
        const linkElement = link as HTMLLinkElement;
        const href = linkElement.href;

        // Add or update cache-busting parameter
        const url = new URL(href);
        url.searchParams.set("v", timestamp.toString());
        linkElement.href = url.toString();
      });

      console.log("Stylesheet cache busted");
    } catch (error) {
      console.error("Error busting stylesheet cache:", error);
    }
  }

  /**
   * Check if cache should be cleared based on version
   */
  static shouldClearCache(): boolean {
    const currentVersion = "1.0.0"; // Update this when styles change
    const cachedVersion = localStorage.getItem("app_cache_version");

    if (cachedVersion !== currentVersion) {
      localStorage.setItem("app_cache_version", currentVersion);
      return true;
    }

    return false;
  }
}

// Auto-clear cache if version changed
if (CacheManager.shouldClearCache()) {
  CacheManager.clearBrowserCache();
}
