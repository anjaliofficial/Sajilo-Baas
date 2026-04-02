import mongoose from "mongoose";
import { connectToDatabase } from "../database/mongodb";


//  before all tests, connect to the database
beforeAll(async () => {
    //  can connect new datatbase for tesitng 
    // or use the same db as development
  await connectToDatabase();
});

//  after all tests, disconnect from the database
afterAll(async () => {
    //  closedb  connection after all tests 
      await mongoose.connection.close();
});