import express from 'express';
import cors from 'cors';
import {Collection, MongoClient} from 'mongodb';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: '*', 
  })
);

const start = async () => {
  try {
    const database =  new MongoClient(process.env.MONGO_URI!)
    console.log('connecting to db')
    database.connect();
    console.log('connected to db')
    const db = database.db('maciek-db');
    const collection = db.collection('products');
    // await collection.insertMany([
    //     { productName: 'Product 1', strainName: 'Strain 1', genetics: 'Genetics 1', thcLevel: '20%', cbdLevel: '5%', terpen: 'Terpen 1' },
    //     { productName: 'Product 2', strainName: 'Strain 2', genetics: 'Genetics 2', thcLevel: '18%', cbdLevel: '3%', terpen: 'Terpen 2' },
    //     { productName: 'Product 3', strainName: 'Strain 3', genetics: 'Genetics 3', thcLevel: '22%', cbdLevel: '2%', terpen: 'Terpen 3' }
    // ])
    app.get('/products', async(req, res) => {
        const products = await collection.find().toArray();
        return res.status(200).send(products)
    })
    app.listen(process.env.PORT);
    console.log(`Server with Mongo running on port ${process.env.PORT}`);
  } catch (error) {
    console.log(error);
  }
};

start();
