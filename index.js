const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
            const query = { email : user.email}
            const existingUser = await usersCollection.findOne(query)
            if(existingUser){
                return res.send({message :'User already exists'})
            }
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

        // get all and filtered events
        app.get('/events', async (req, res) => {
            const { title, filterType, startDate, endDate } = req.query;

            const query = {};

            if (title) {
            query.title = { $regex: new RegExp(title, 'i') };
            }


            const now = new Date();
            let start, end;

            const setStartEnd = (s, e) => {
            start = new Date(s);
            end = new Date(e);
            query.datetime = { $gte: start, $lte: end };
            };

            const dayStart = new Date(now.setHours(0, 0, 0, 0));
            const dayEnd = new Date(now.setHours(23, 59, 59, 999));

            const getMonday = (d) => {
            d = new Date(d);
            const day = d.getDay(),
                data = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(data));
            };

            const getFirstDay = (y, m) => new Date(y, m, 1);
            const getLastDay = (y, m) => new Date(y, m + 1, 0, 23, 59, 59, 999);

    
            if (filterType) {
            const today = new Date();
            switch (filterType) {
                case 'today':
                setStartEnd(dayStart, dayEnd);
                break;

                case 'current_week': {
                const monday = getMonday(new Date());
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                setStartEnd(monday, new Date(sunday.setHours(23, 59, 59, 999)));
                break;
                }

                case 'last_week': {
                const monday = getMonday(new Date());
                monday.setDate(monday.getDate() - 7);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                setStartEnd(monday, new Date(sunday.setHours(23, 59, 59, 999)));
                break;
                }

                case 'current_month': {
                const y = today.getFullYear();
                const m = today.getMonth();
                setStartEnd(getFirstDay(y, m), getLastDay(y, m));
                break;
                }

                case 'last_month': {
                const y = today.getFullYear();
                const m = today.getMonth() - 1;
                setStartEnd(getFirstDay(y, m), getLastDay(y, m));
                break;
                }
            }
            }

            else if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
        
            if (startDate.length <= 10 && endDate.length <= 10) {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
            }

            query.datetime = { $gte: start, $lte: end };
            }

            const events = await eventsCollection.find(query).sort({ datetime: 1 }).toArray();
            res.send(events);
            
        });

        // update event 
        app.patch('/events/join/:id', async( req, res ) => {
        const { id } = req.params;
        const { email }  = req.body;

        const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

        if (event.joinedUsers?.includes(email)) {
            return res.status(400).send({ message: 'User already joined this event' });
        }
            
        const filter ={ _id: new ObjectId(id) }

        const updateDoc ={ 
          $inc: { attendeeCount: 1 }, 
          $addToSet: { joinedUsers: email }
        }

         const result = await eventsCollection.updateOne(filter,updateDoc);

         res.send(result);
        })

        // get event by email
        app.get('/event/:email', async( req, res )=> {
            const email = req.params.email
            const query = {email : email}
            const result = await eventsCollection.find(query).toArray()
            res.send(result)
        })

        app.patch('/update/:id' , async ( req , res ) => {
            const id = req.params.id;
            const filter= {_id: new ObjectId(id)};
            const options ={upsert: true};
            const updateData = req.body
            const update ={
                $set:{
                    title:updateData.title,
                    name:updateData.name,
                    datetime: new Date(updateData.datetime),
                    location:updateData.location,
                    description:updateData.description,
                }}
            const result = await eventsCollection.updateOne(filter, update, options)
            res.send(result)
        })

        app.delete('/delete/:id' , async( req, res ) => {
           const id = req.params.id
           const query = {_id : new ObjectId(id)} 
           const result = await eventsCollection.deleteOne(query)
           res.send(result)
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


