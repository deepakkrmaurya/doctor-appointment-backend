// import multer from 'multer'

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'public')
//     },
//     filename: function (req, file, cb) {
//         // console.log('dsjh');
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 10)
//         cb(null, uniqueSuffix + '-' + file.originalname);
//     }
// });

// const upload = multer({ storage });
// export default upload

import path from 'path'
import multer from 'multer'

const upload = multer({
    dest: "uploads/",
    limits:{fileSize: 300*1024*1024},
    storage: multer.diskStorage({
        destination:'uploads/',
        filename:(_req,file,cb)=>{
            cb(null,file.originalname)
        }
    }),

    fileFilter:(_req,file,cb)=>{
        let ext = path.extname(file.originalname);
        if(
            ext!=".jpg"&&
            ext!=".jpeg"&&
            ext!=".webp"&&
            ext!=".png"&&
            ext!=".mp4"

        ){
            cb("Invalid file",false)
            return;
        }
        cb(null,true)
    }

})

export default upload;