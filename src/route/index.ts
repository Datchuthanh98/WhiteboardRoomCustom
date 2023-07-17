import ImgController from "../controller/index";
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
export const ImgRouter = Router();

const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        let dest: string;
        const idRoom = req.query.idRoom;
        dest = path.join(__dirname, "../public/upload/" + idRoom);
        fs.mkdirsSync(dest);
        cb(null, dest);
    },
    filename: (req: any, file: any, cb: any) => {
        const filename =
            Date.now() + "-" + Math.round(Math.random() * 1e9) + ".jpg";
        cb(null, filename);
    },
});

const upload = multer({ storage });
const cpUpload = upload.fields([{ name: "image", maxCount: 1 }]);

ImgRouter.post("/upload", cpUpload, ImgController.upload);
ImgRouter.get("/getfile", ImgController.getImg);

export default ImgRouter;