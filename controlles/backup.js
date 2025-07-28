import config from "../connectionData.js";
import {exec} from "child_process";
import multer from "multer";
import path from "path";

//set default place for save files from frontend
const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, "/home/inter_pares/backups/");
    },
    filename: (req, file, cb)=>{
        cb(null, "backup.sql");
    }
})

//set upload with default storage
export const upload = multer({storage});

export const exportDB = (req, res)=>{
    try
    {
        //set place to save file
        const dumpPath = `/usr/bin/mysqldump`; 
        const filePath = '/home/inter_pares/backups/databaseBackup.sql';
        //set command
        const command = `${dumpPath} -u ${config.user} -p${config.password} -h ${config.host} ${config.database} > ${filePath}`;
        //execute command 
        exec(command, (error, stdout, stderr)=>{
            if(error)
            {
                //if error throw it
                throw new Error(error);
            }
            //now export is ready to send it to react as download
            return res.download("/home/inter_pares/backups/databaseBackup.sql", (error)=>{
                if(error)
                {
                    //if error throw it
                    throw new Error("Błąd podczas pobierania");
                }
            })
        })
        
    }
    catch(error)
    {
        return res.json({"message":error.message,"success":false})
    }
} 

export const importDB = (req, res)=>{
    try
    {
        //set path to temporary save file
        const mysql = "/usr/bin/mysql";
        const filePath = path.resolve("/home/inter_pares/backups/databaseBackup.sql");
        //command to import db
        const command = `${mysql} -u ${config.user} -p${config.password} -h ${config.host} ${config.database} < ${filePath}`;
        exec(command, (error,stdout, stderr)=>{
            if(error)
            {
                throw new Error(error);
            }
            //db exported, return success
            return res.json({"message":"Baza danych została zaaktualizowana","success":true});
        })
    }
    catch(error)
    {
        return res.json({"message":error.message,"success":false});
    }
}
