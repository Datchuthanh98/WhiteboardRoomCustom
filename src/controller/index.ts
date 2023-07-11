import Img from "../model/Image";
import { Request, Response } from "express";
import path from "path";
import fs from "fs";

interface Image {
    _id: object;
    url: string;
}

export const ImgController = {
    upload: async (req: any, res: Response) => {
        try {
            const idField = req.query.idField
            // console.log(req.files["images"]);
            await Img.create({ url: req.files["image"][0].path, idField: idField });
            return res.status(200).json({
                message: "Thành công",
            });
        } catch (error) {
            return res.status(500).json({
                message: "Server error",
                error: error,
            });
        }
    },
    getImg: async (req: Request, res: Response) => {
        try {
            const idField = req.query.idField
            const img: Image | null = await Img.findOne({ idField: idField });
            console.log(img);
            if (img?.url !== undefined && img !== null) {
                let url: string = img.url;
                fs.readFile(url, (err: any, data: any) => {
                    if (err) {
                        console.log("ERROR READ PATH FILE")
                        return res.status(500).json({
                            message: "Server error: Error reading file",
                            error: err,
                        });
                    }

                    console.log("START BUFFERR")
                    const buffer = Buffer.from(data);
                    return res.send(buffer)
                });
            } else {
                return res.status(404).json({
                    message: "Image not found",
                });
            }
        } catch (error) {
            return res.status(500).json({
                message: "Server error",
                error: error,
            });
        }
    },
};

export default ImgController;
