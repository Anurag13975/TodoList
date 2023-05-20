const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://Anurag0Singhal:<password>@cluster0.sdaa1ce.mongodb.net/todolistDB');
// see 'imp.txt' file offline
const itemsSchema = new mongoose.Schema({
  name: String
})
const Item = mongoose.model("Item",itemsSchema);
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
})
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
const defaultItems = [item1,item2,item3];


const listSchema = {  // for express routing dynamic page
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List",listSchema);


async function getItems(){
  const Items = await Item.find({});
  return Items;
}

app.get("/", function(req, res) {
  getItems().then(function(foundItems){
    if(foundItems.length === 0)
    {
      Item.insertMany(defaultItems)
        .then(function () {
          console.log("Successfully saved defult items to DB");
        })
        .catch(function (err) {
          console.log(err);
      });
      res.redirect("/");
    }
    else
      res.render("list", {listTitle: "Today", newListItems:foundItems});
  });
});

app.get("/:customListName",(req,res)=>{
  const customListName = _.capitalize(req.params.customListName);


// but what if the user already have a saved list at that route
// then we don't want to display default items everytime 
// if user already have a saved list we will display that otherwise we will display default list for that we will use findOne method
  async function checkCustomList(customListName) {
    try {
      const foundList = await List.findOne({ name: customListName }).exec();
      if (!foundList) 
      {
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else 
      {
        // show an existing list
        res.render("list", {listTitle: foundList.name, newListItems:foundList.items});
      }
    } catch (error) {
      console.error(error);
    }
  }
  checkCustomList(customListName);
}) // use of express routing parameters


app.post("/", async (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  try {
    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred");
  }
});


app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await Item.findByIdAndDelete(checkedItemId);
      console.log("Successfully deleted item");
      res.redirect("/");
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting item");
  }
});




app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});




let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started Successfully");
});
