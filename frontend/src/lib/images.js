export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImageFile(file) {
  if (!file) return "No image selected";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Please select a JPEG, PNG, WebP, or GIF image";
  }
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 5 MiB or smaller";
  return null;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected image"));
    reader.readAsDataURL(file);
  });
}
