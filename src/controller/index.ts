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
            const idField = req.query.idField;
            const idRoom = req.query.idRoom;
            console.log("idRoom: " + idRoom);
            console.log("idField: " + idField);
            // console.log(req.files["images"]);
            await Img.create({
                url: req.files["image"][0].path,
                idField: idField,
                idRoom: idRoom,
            });
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
            const idField = req.query.idField;
            const idRoom = req.query.idRoom;
            const img: Image | null = await Img.findOne({
                idField: idField,
                idRoom: idRoom,
            });
            console.log(img);
            if (img?.url !== undefined && img !== null) {
                let url: string = img.url;
                fs.readFile(url, (err: any, data: any) => {
                    if (err) {
                        return res.status(500).json({
                            message: "Server error: Error reading file",
                            error: err,
                        });
                    }

                    const buffer = Buffer.from(data);
                    return res.send(data);
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
    deleteRoom: async (roomID: string) => {
        try {
            const fs = require("fs-extra");
            const path = require("path");
            const folderPath = path.join(__dirname, "../public/upload", roomID);
            if (fs.existsSync(folderPath)) {
                fs.removeSync(folderPath);
                console.log("Folder and its contents deleted successfully");
            } else {
                console.log("Folder does not exist");
            }
            let img: Image | null = null;
            while (true) {
                img = await Img.findOneAndDelete({
                    idRoom: roomID,
                });
                if (img === null) {
                    break;
                }
            }
        } catch (error) {
            console.log("Error:", error);
        }
    },
};

export default ImgController;