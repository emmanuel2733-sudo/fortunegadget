import { MAX_IMAGE_UPLOAD_BYTES } from "./storage";

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_MAX_HEIGHT = 1600;
const DEFAULT_QUALITY = 0.82;
const MIN_QUALITY = 0.55;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read the selected image."));
    };

    image.src = objectUrl;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to compress the selected image."));
        return;
      }

      resolve(blob);
    }, type, quality);
  });

const getScaledDimensions = (
  width,
  height,
  maxWidth = DEFAULT_MAX_WIDTH,
  maxHeight = DEFAULT_MAX_HEIGHT
) => {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

const renameFile = (name, type) => {
  const extension = type === "image/webp" ? "webp" : "jpg";
  const baseName = name.includes(".") ? name.replace(/\.[^.]+$/, "") : name;
  return `${baseName}.${extension}`;
};

export const compressImageFile = async (
  file,
  options = {}
) => {
  const {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
    targetBytes = MAX_IMAGE_UPLOAD_BYTES,
  } = options;

  if (!file?.type?.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  const { width, height } = getScaledDimensions(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    maxWidth,
    maxHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, width, height);

  const outputType =
    file.type === "image/webp" ? "image/webp" : "image/jpeg";

  let currentQuality = quality;
  let blob = await canvasToBlob(canvas, outputType, currentQuality);

  while (
    blob.size > targetBytes &&
    currentQuality > MIN_QUALITY &&
    outputType !== "image/png"
  ) {
    currentQuality = Math.max(
      MIN_QUALITY,
      Number((currentQuality - 0.08).toFixed(2))
    );
    blob = await canvasToBlob(canvas, outputType, currentQuality);
  }

  if (blob.size >= file.size) {
    return file;
  }

  return new File([blob], renameFile(file.name, outputType), {
    type: outputType,
    lastModified: Date.now(),
  });
};
