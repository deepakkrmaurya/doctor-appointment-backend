import app from "./app.js";
import connectDB from "./config/db.js";
import { v2 as cloudinary } from 'cloudinary';
const PORT = process.env.PORT || 3000;

cloudinary.config({
    cloud_name: 'jaymaurya',
    api_key: '985448536857411',
    api_secret: 'n3dfwlazpHJyXkcrrbwhq9nH0Hk'
});

app.listen(PORT, async () => {
    await connectDB()
    console.log(`Server is runing at http://localhost:${PORT}`)
})