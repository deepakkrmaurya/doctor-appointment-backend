import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 3000;
app.listen(PORT,async()=>{
   await connectDB()
    console.log(`Server is runing at http://localhost:${PORT}`)
})