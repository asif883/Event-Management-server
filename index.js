const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.osztyuf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const usersCollection = client.db("e-manager").collection("users")
const eventsCollection = client.db("e-manager").collection("events")


const connectDB = async()=>{
    try {
        await client.connect()
        console.log("Db Connected");


        // add user to db
        app.post('/add-user', async(req, res) => {
            const user = await req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        // get single user
        app.get('/user/:email', async( req, res ) => {
            const query = {email: req.params.email}
            const user = await usersCollection.findOne(query)
            res.send(user)
        })

        // add event 
        app.post('/add-event', async(req, res) =>{
            const data = req.body
            const event = {
                title: data.title,
                name: data.name,
                datetime: new Date(data.datetime),
                location: data.location,
                description: data.description,
                attendeeCount: Number(data.attendeeCount) || 0,
                email: data.email, 
            };
            const result = await eventsCollection.insertOne(event)
            res.send(result)
        })

        // all event 
        app.get('/events' , async(req, res) => {
            const events = await eventsCollection.find().sort({datetime : 1}).toArray()
            res.send(events)
        })

        
    } catch (error) {
        console.log(error);
    }
}

connectDB()



app.get('/' , async(req, res) =>{
    res.send("server is running")
})

app.listen(port ,()=> {
    console.log(`Server is running on The port: ${port}`);
})


