// assetLoader.js
// Simple async loader & cache for image assets
export const AssetLoader = (function () {
  const cache = {};
  return {
    load(name, url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { cache[name] = img; resolve(img); };
        img.onerror = reject;
        img.src = url;
      });
    },
    get(name) { return cache[name]; }
  };
})();
