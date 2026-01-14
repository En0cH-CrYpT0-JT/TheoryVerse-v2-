
import * as THREE from 'three';

export const hologramPipeline = {
  async loadHologram(imageUrl: string): Promise<{
    originalTexture: THREE.Texture;
    depthTexture: THREE.Texture;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = async () => {
        try {
          const originalTexture = new THREE.Texture(img);
          originalTexture.needsUpdate = true;
          originalTexture.minFilter = THREE.LinearFilter;
          originalTexture.magFilter = THREE.LinearFilter;

          const depthTexture = await this.generateDepthMap(img);

          resolve({
            originalTexture,
            depthTexture
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load holographic data stream.`));
      };

      img.src = imageUrl;
    });
  },

  async generateDepthMap(image: HTMLImageElement): Promise<THREE.Texture> {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) throw new Error("Canvas failure during depth synthesis");
    
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = data[i+1] = data[i+2] = luminance;
    }

    ctx.putImageData(imageData, 0, 0);
    
    const depthTexture = new THREE.CanvasTexture(canvas);
    depthTexture.minFilter = THREE.LinearFilter;
    depthTexture.magFilter = THREE.LinearFilter;
    depthTexture.needsUpdate = true;
    
    return depthTexture;
  }
};
