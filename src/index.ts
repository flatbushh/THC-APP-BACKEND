import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

const start = async () => {
  try {
    const database = new MongoClient(process.env.MONGO_URI!);
    await database.connect();
    console.log("connected to db");
    const db = database.db("maciek-db");
    const collection = db.collection("products");
    const usersCollection = db.collection("users");

    app.post("/products", async (request, response) => {
      const filterParams = request.body;
      console.log(filterParams);
      // to nasze filterParams moze zawierac kazdy parametr, po ktorym chcemy filtrowac
      const thcLevelRange = Array.isArray(filterParams.thcLevel);
      const cbdLevelRange = Array.isArray(filterParams.cbdLevel);

      const producentNameRegex = new RegExp(filterParams.producentName, "i");
      // Query the database

      const products = await collection
        .aggregate([
          {
            $match: {
              producentName: filterParams.producentName
                ? {
                    $regex: producentNameRegex,
                  }
                : {
                    $exists: true,
                  },
              genetics: filterParams.genetics ?? { $exists: true },
              terpen: filterParams.terpen ?? { $exists: true },
              thcLevel: thcLevelRange
                ? {
                    $gte: filterParams.thcLevel[0],
                    $lte: filterParams.thcLevel[1],
                  }
                : { $exists: true },
              cbdLevel: cbdLevelRange
                ? {
                    $gte: filterParams.cbdLevel[0],
                    $lte: filterParams.cbdLevel[1],
                  }
                : { $exists: true },
            },
          },
        ])
        .toArray();
      // aggregate pozwala nam na laczenie zapytan do bazy danych
      // $match to jedna z funkcji agregujacych, sluzy do szukania pasujacych (zmatchowanych)wartosci,
      // tak na prawde robi cos w stylu, for exmaple: name === 'Joe', $match: {name: 'Joe'}

      // patrz backend (note z frontu) -> wyzej masz wyjasnione co ta funkcja robi
      // musisz dorzucic tutaj swoj nowododany parametr, zeby filtrowac po wielu, a nie tylko po producentName
      // pomocne linki:
      // aggregate: https://www.mongodb.com/docs/manual/aggregation/
      // $match: https://www.mongodb.com/docs/manual/reference/operator/aggregation/match/
      // mongodb in 100 seconds: https://www.youtube.com/watch?v=-bt_y4Loofg *
      const mappedProducts = products.map(({ _id, ...rest }) => ({
        id: _id,
        ...rest,
      }));
      return response.status(200).send(mappedProducts);
    });

    app.post("/create-product", async (request, response) => {
      const data = request.body;
      console.log("console log w endpoincie create-product", data);
      const newProduct = {
        _id: new ObjectId(),
        producentName: data.producentName.toLowerCase(),
        strainName: data.strainName,
        genetics: data.genetics,
        thcLevel: data.thcLevel,
        cbdLevel: data.cbdLevel,
        terpen: data.terpen,
        description: data.description,
      };

      try {
        await collection.insertOne(newProduct);
        return response.status(201).send("Created!");
      } catch (err) {
        return response.status(504).send(err);
      }
    });

    app.post("/register", async (request, response) => {
      const data = request.body;
      console.log("console log w endpoincie register", data);
      const userExists = await usersCollection.findOne({ email: data.email });
      if (userExists) {
        return response.status(504).send("User already exists");
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const newUser = {
        email: data.email,
        password: hashedPassword,
      };
      try {
        await usersCollection.insertOne(newUser);
        return response.status(201).send("Created!");
      } catch (err) {
        return response.status(504).send(err);
      }
    });

    app.post("/login", async (request, response) => {
      // w req.body powinien byc email i haslo (string)
      const data = request.body;
      console.log("console log w endpoincie login", data);

      // tutaj musisz wyszukac uzytkownika po mailu (req.body.email)
      const user = await usersCollection.findOne({ email: data.email });
      if (!user) {
        return response.status(404).send("User not found");
      }

      const isPasswordMatch = await bcrypt.compare(
        data.password,
        user.password //haslo z bazy zaszyfrowan
      );
      if (!isPasswordMatch) {
        return response.status(504).send("Password does not match");
      }
      return response.status(200).send("User logged");
    });

    app.get("/product/:id", async (request, response) => {
      const id = new ObjectId(request.params.id);

      try {
        const product = await collection.findOne({ _id: id });
        return response.status(200).send(product);
      } catch (err) {
        return response.status(500).send(err);
      }
    });

    app.get("/users", async (request, response) => {
      try {
        const users = await usersCollection.find({}); //find pobiera wszystkich userów z kolekcji usersCollection, {} -nie filtruję, poniewa pobieram wszystkich userów istniejących w bazie danych
        const mappedUsers = users.map(({ _id, email }) => ({
          id: _id,
          email: email,
        }));
        return response.status(200).send(mappedUsers);
      } catch (err) {
        return response.status(500).send("Error while fetching users");
      }
    });

    app.listen(process.env.PORT);
    console.log(`Server with Mongo running on port ${process.env.PORT}`);
  } catch (error) {
    console.log(error);
  }
};

start();
