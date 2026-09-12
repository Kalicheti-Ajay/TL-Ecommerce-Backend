require("dotenv/config")
const express = require("express")
const mongoose = require("mongoose")
const productRoutes = require("./routes/productRoutes")
const userRoutes = require("./routes/userRoutes")

const app = express();
app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/auth", userRoutes);


const  PORT = process.env.PORT || 3000
//const MONGO_URI = process.env.MONGO_DB_URI;

const MONGO_URI = "mongodb://localhost:27017/ecommerceDB";

async function main(){
    await mongoose.connect(MONGO_URI).then(()=> {
        console.log("Connected to MongoDB:", MONGO_URI)
        app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`))
    }) 
    .catch((err) => {
        console.error("MongoDB connection error:", err.message)
        process.exit(1)
    })
};


main()


