const express = require("express");         //import dependencies
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();                      /// access app express
const PORT = process.env.PORT || 5000;      //set the port #

app.use(cors());                    // user cors to link backend to webpage
app.use(bodyParser.json());        //use body parser

//URL MongoDB
mongoose.connect("mongodb+srv://NathanStock:nathan.nguyen89@cluster0.xqvvmir.mongodb.net/Nathanstocks?retryWrites=true&w=majority", {                      
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
// data representation for collection of custom stocks
const stockSchema = new mongoose.Schema(
    {
        company: String,
        description: String,
        initial_price: Number,
        symbol: String,
    },
    {collection: "stocks"}  // collection name
);

const Stock = mongoose.model("Stock", stockSchema);

// empty data representation for collection of watchlist stocks to be added
const watchlistSchema = new mongoose.Schema(
    {
        company: String,
        description: String,
        initial_price: Number,
        symbol: String,
    },
    {collection: "watchlist"}  // collection name
);

const Watchlist = mongoose.model("Watchlist", watchlistSchema);


//Get API to grab the Stock Data
app.get("/api/stocks", async (req,res)=>{   ///Get API call of stocks in the Backend
    try{
        const stocks = await Stock.find();
        res.json(stocks)
    } catch (error){
        console.error(error);
        res.status(500).json({error: "Internal Server Error"});
    }
});

// update the stock price

const updatePrices = async () =>{
    try{
        const stocks = await Stock.find();
        for (const stock of stocks) {
            const randomChange = (Math.random()* .1 + .01).toFixed(2); //generate random price between .01 and .1 cents
            const changeDirection = Math.random() < .5 ? -1 : 1;      //Randomly between adding or subtracting the change 
            stock.initial_price = Math.max(0, (stock.initial_price + changeDirection * parseFloat(randomChange)).toFixed(2)); // update the stock price
            await stock.save();
        }
        console.log("Stock did Updated");
    }catch (error){
        console.error("Stock Not Updated", error);
    }
};
setInterval(updatePrices, 3000); // set timer 3 sec updates
// make a watchlist section to store the stocks that you want on this page
// also route it to backend too
// POST API to add stock to watchlist
app.post("/api/watchlist", async (req, res) => {
    try {
        const {
            company,
            description,
            initial_price,
            symbol,
        } = req.body;

        // Save to stocks collection
        const stock = new Stock({
            company,
            description,
            initial_price,
            symbol,
        });
        await stock.save();

        // Save to watchlist collection
        const watchlistItem = new Watchlist({
            company,
            description,
            initial_price,
            symbol,
        });
        await watchlistItem.save();

        res.json({ message: "Stock added to watchlist successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//get the watchlist items 
app.get("/api/watchlist", async (req, res)=>{
    try{
        const watchlistStocks = await Watchlist.find();
        res.json(watchlistStocks);
    }catch (error){
        console.error("Error fetching watchlist:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// remove stock from watchlist
app.delete("/api/watchlist/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log("ID to delete:", id); // Debugging log
        const result = await Watchlist.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ message: "Stock not found in watchlist" });
        }
        res.json({ message: "Stock removed from watchlist" });
    } catch (error) {
        console.error("Error removing stock from watchlist:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.listen(PORT, () => {
    console.log('Server running on port 5000');
});