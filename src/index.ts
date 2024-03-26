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
  
    app.get('/products', async(req, res) => {
        const products = await collection.find().toArray();
        return res.status(200).send(products)
    })
    app.post('/create-product', async(req, res) => {
      const product = req.body.product;
      try {
        await collection.insertOne(product)
        return res.status(200).send('Product created')
      }catch(err) {
        return res.status(504).send(err)
      }
    })
    app.listen(process.env.PORT);
    console.log(`Server with Mongo running on port ${process.env.PORT}`);
  } catch (error) {
    console.log(error);
  }
};

start();
