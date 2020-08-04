import loadImage from "blueimp-load-image";
import 'blueimp-canvas-to-blob/js/canvas-to-blob.min';

export const fixImageOrientation = (file) => {
  return new Promise((resolve) => {
    loadImage(file, (img) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        if (canvas.toBlob) {
          canvas.toBlob((blob) => {
            const newFile = new File(
              [blob],
              file.name,
              {
                type: file.type,
                lastModified: file.lastModified
              }
            );
            resolve(newFile)
          }, file.type);
        }
      }, { orientation: true }
    )
  })
};