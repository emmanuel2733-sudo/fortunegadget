export const MAX_IMAGE_SOURCE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;

export const validateImageFile = (
  file,
  maxBytes = MAX_IMAGE_SOURCE_BYTES
) => {
  if (!file) {
    return "Please choose an image file.";
  }

  if (!file.type?.startsWith("image/")) {
    return "Only image files are allowed.";
  }

  if (file.size > maxBytes) {
    return "Image is too large. Use an image smaller than 10MB.";
  }

  return "";
};

export const getStorageErrorMessage = (error) => {
  if (error?.code === "storage/quota-exceeded") {
    return "Firebase Storage quota exceeded. Delete old uploaded images in Firebase Storage, use smaller images, or upgrade your Firebase plan.";
  }

  return error?.message || "Image upload failed.";
};
