import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express(); // tutaj przypisujemy express() czyli funkcje tworzaca aplikacje express do zmiennej
app.use(express.json()); // tego uzywamy tylko po to, aby request.body bylo w JSON'ie
app.use(
  cors({
    origin: "*",
  })
);
/* to jest opcja CORS (cross origin resource sharing), to jest po to, aby zdjac blokade expressa
Express z defaultu blokuje requesty z innych adresow, poprzez danie gwiazdki pozwalamy mu na przyjmowanie
requestow z innych adresow (twoja aplikacja reactowa wysyla request z adresu http://localhost:3000, a nasz serwis ma adres http://localhost:4000)
*/

const start = async () => {
  try {
    const database = new MongoClient(process.env.MONGO_URI!); //tutaj tworzymy interfejs mongodb(nierelacyjna BD), clienta, ktory zwraca nam funckje do obslugi bazy danych
    console.log("connecting to db");
    await database.connect(); //laczymy sie z baza danych na podstawie URL'a ktorego podalismy przy tworzeniu clienta
    console.log("connected to db");
    const db = database.db("maciek-db"); // tworzymy baze danych (jesli jeszcze nie istnieje) o nazwie maciek-db w naszej bazie danych
    const collection = db.collection("products"); // tworzymy kolekcje o nazwie products wewnatrz naszej bazy danych maciek-db o nazwie products
    //baza danych (db) -> zawiera kolekcje -> kolekcje zawieraja rekordy
    // rekordy musza miec _id i posiadaja strukture JSON'a
    app.get("/products", async (request, response) => {
      //app.get to funkcja express js, złozona pod spodem, tworzy endpoint, do ktorego moge wyslac requesty
      const products = await collection
        .find({ productName: "Product 2" })
        .toArray();
      //przypisujemy do zmiennej products wynik zapytania do bazy danych
      // zapytanie wykonujemy do konkretnej kolekcji w tej bazie danych dlatego uzywamy collection
      //.find() to metoda wbudowana w collection w mongoDB
      // sluzy do szukania wielu elementow w BD
      // jak nie ma argumentow to zwroci wszystkie elementy
      // na koncu dodajemy .toArray(), zeby te dane zaprezentowac jako JSowy array dla lepszej czytelnosci
      return response.status(200).send(products);
    });
    /*
    - za pomoca app.<nazwa_metody_http> tworzymy nowy endpoint.
    - pierwszym argumentem jest string - nazwa endpointa, np: '/products'
      * jest to czesc url'a, na ktorego potem wysylasz zapytanie z frontu- pelen url bedzie wygladal http://localhost:<PORT_SERVERA>/products
    - drugim argumentem jest funkcja, ale troszke inna niz zwykla funkcja js.
      * jest to funkcja, ktora jest elementem endpointu w zwiazku z tym z automatu przyjmuje dwa argumenty:
        - request -> to co przychodzi z frontu (jest tam duzo roznych rzeczy mozesz sobie porobic console.log(request.<cos_tam>))
        - response -> to co bedziemy chcieli zwrocic do clienta (aplikacji frontendowej)
      * wewnatrz tej funkcji mozemy zrobic cokolwiek, w naszym przypadku wykonujemy zapytanie do bazy danych 
        nastepnie zwracamy wynik tego zapytania za pomoca return response.status(200).send(<nasz_wynik_zapytania>) w tym przypadku array productow
    */
    app.post("/create-product", async (request, response) => {
      const data = request.body; //body requestu, ktore jest obiektem
      console.log("console log w endpoincie create-product", data);
      const newProduct = {
        _id: new ObjectId(),
        producentName: data.producentName,
        strainName: data.strainName,
        genetics: data.genetics,
        thcLevel: data.thcLevel,
        cbdLevel: data.cbdLevel,
        terpen: data.terpen,
      };
      try {
        await collection.insertOne(newProduct);
        return response.status(201).send("Created!");
      } catch (err) {
        return response.status(504).send(err);
      }
    });

    app.listen(process.env.PORT); //app.listen() jest funkcja, ktora odpala nasz serwer -> sprawia, ze mozna wysylac zapytania na endpointy // port na ktorym serwer ma nasluc
    console.log(`Server with Mongo running on port ${process.env.PORT}`);
  } catch (error) {
    console.log(error);
  }
};

start();
// baza danych składa sie  z kolekcji(lista, tablica), zawierająca rekordy(elementy listy, obiekty)
//requesty moge sprawdzic w zkaladce network w inspect element w przeglądarce
// api - interfejs pozwalający na modyfikacje danych z innego zrodla
// porty sieciowe, zazwyczaj jeden port przypada jednej aplikacji
//mikroserwisy - odpowiadaja za dystrybucję odpowiedzialnosci - np. jesli wyjebie się dodawanie nowych uzytkownikow, nie zaburzy to realizacji zamowien
// kazdy mikrosewrwis odpowiada za inna funkcjonalnosc
// endpoint - miejsce w serwerze na ktore trafia request, ma nazwę i funkcję okreslajaca co robi gdy dostaje ten reqeust
//AXIOS- wysyłanie zoaytan di backendu
//express,js - handling zapytan
//poza exportem rzeczy sa niezmienne, natomiast miedzy exportem,a  returnem to rzeczy ktore sie rerenderuja i moga sie zmieniac
