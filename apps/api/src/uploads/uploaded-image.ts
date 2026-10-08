   // The parts of an uploaded file that we use (provided by multer's memory storage)
   export interface UploadedImage {
     originalname: string;
     mimetype: string;
     size: number;
     buffer: Buffer;
   }