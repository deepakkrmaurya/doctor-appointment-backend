import multer from 'multer'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public')
    },
    filename: function (req, file, cb) {
        // console.log('dsjh');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 10)
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage });
export default upload