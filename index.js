const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors({
    origin:[
        "http://localhost:5173",
    ]
}))
app.use(express.json())




app.get('/' , async(req, res) =>{
    res.send("server is running")
})

app.listen(port ,()=> {
    console.log(`Server is running on The port: ${port}`);
})


