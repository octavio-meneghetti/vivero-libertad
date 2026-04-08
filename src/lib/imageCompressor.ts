export const compressImage = async (file: File, maxWidth = 800): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular el aspecto ratio y encoger si excede el maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Si falla, devuelve archivo original seguro
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Comprimir destructivamente a formato WEBP con calidad 80%
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file); // Si falla, devuelve el original
            return;
          }
          // Transmutar de vuelta a formato de archivo
          const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(newFile);
        }, 'image/webp', 0.8);
      };
      img.onerror = () => reject(new Error('Failed to load image.'));
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
  });
};
