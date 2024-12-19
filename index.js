const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

     //Auth related apis
     app.post('/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, 'secret', {expiresIn: '1h'});
      res.send(token);

     })

    //Jobs collections

    //get all data
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const cursor = jobsCollection.find(query);
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

    app.post("/jobs", async (req, res) => {
      const newJobs = req.body;
      const result = await jobsCollection.insertOne(newJobs);
      res.send(result);
    });

    //job applications  apis==================>>>>>>>>>>>>>

    //get all applicant data for a specific job
    app.get("/job-applications/jobs/:job_id", async (req, res) => {
      const jobId = req.params.job_id;
      const query = { job_id: jobId };
      const result = await jobsApplicationCollection.find(query).toArray();

      // console.log(result);
      res.send(result);
    });

    //get specific applicant data using email
    app.get("/job-application", async (req, res) => {
      const email = req.query.email;
      const query = {
        applicant_email: email,
      };
      const result = await jobsApplicationCollection.find(query).toArray();

      //fokira way for aggregate data
      for (const application of result) {
        // console.log(application.job_id);
        const myJobQuery = { _id: new ObjectId(application.job_id) };
        const job = await jobsCollection.findOne(myJobQuery);
        if (job) {
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

      //find the job using job_id
      const id = application.job_id;
      const query = { _id: new ObjectId(id) };
      const job = await jobsCollection.findOne(query);
      console.log(job);

      let count = 0;
      if (job.jobApplicant) {
        count = job.jobApplicant + 1;
      } else {
        count = 1;
      }

      // Update job info with applicant count
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          jobApplicant: count,
        },
      };
      const applicant = await jobsCollection.updateOne(filter, updateDoc);
      console.log(applicant);

      res.send(result);
    });

    //Update application status
    app.patch("/job-applications/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: data.status,
        },
      };
      const result = await jobsApplicationCollection.updateOne(
        filter,
        updatedDoc
      );
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
