const mongoose = require('mongoose');
const Chance = require('chance');
const chance =Chance();
const Document = require("./document.model")

// Connect to Mongo DB
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/nodeTemplate";
mongoose.connect(
    dbUrl,
    { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
    (err) => {
      if (!err) {
        console.log("Connection Successful");
      } else {
        console.log("Connection not successful", err);
      }
    }
  );
mongoose.Promise = global.Promise;

async function createDocument(){
    try{
        const doc =new Document ({
            _id:new mongoose.Types.ObjectId(),
            name:chance.name(),
            description: chance.sentence({words:11}),
            file:"default.png",
            parent: null,
            isDeleted: false,
            deletedAt: null
        })
        const createdDoc =await  doc.save();
        createdDoc.parent = createdDoc._id;
        await createdDoc.save();
        console.log(createdDoc);
    }
    catch(err){
        console.error("Error seeding document:", err);
    }
}
createDocument();