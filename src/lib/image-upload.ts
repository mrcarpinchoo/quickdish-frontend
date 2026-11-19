/** Largest side, in pixels, of a dish photo sent to the API. */
const MAX_SIDE = 800;
/** JPEG quality: a good balance between size and look. */
const QUALITY = 0.82;

/**
 * Reads a photo chosen by the admin, shrinks it to fit MAX_SIDE and returns a
 * JPEG file ready to upload. Shrinking keeps uploads small (about 100 KB).
 */
export function shrinkDishPhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(
      new Error("Choose an image file, such as JPG or PNG.")
    );
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("This browser could not prepare the photo."));
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob =>
          blob ?
            resolve(blob)
          : reject(new Error("This browser could not prepare the photo.")),
        "image/jpeg",
        QUALITY
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That photo could not be read. Try another file."));
    };
    image.src = url;
  });
}
