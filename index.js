const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//routes
app.get("/", (req, res) => {
  res.send("Job portal is running.");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jo4on.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
//job related apis
const jobsCollection = client.db("jobPortal").collection("jobs");
const jobsApplicationCollection = client
  .db("jobPortal")
  .collection("job_applications");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //Jobs collections

    //get all data
    app.get("/jobs", async (req, res) => {
      const cursor = jobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //get a specific data
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

   

    //job applications apis

    //get specific applicant data
    app.get("/job-application", async (req, res) => {
      const email = req.query.email;
      const query = {
        applicant_email: email,
      };
      const result = await jobsApplicationCollection.find(query).toArray();

      //fokira way for aggregate data
      for(const application of result) {
        // console.log(application.job_id);
        const myJobQuery = {_id: new ObjectId(application.job_id)};
        const job = await jobsCollection.findOne(myJobQuery);
        if(job){
          application.title = job.title;
          application.company = job.company;
          application.company_logo = job.company_logo;
          application.location = job.location;
        }
        // console.log(application);
      }
      res.send(result);
    });

    //insert applicant data to database
    app.post("/job-applications", async (req, res) => {
      const application = req.body;
      const result = await jobsApplicationCollection.insertOne(application);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//2uGqLj5sM1xgX6I4
//job_hunter

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
