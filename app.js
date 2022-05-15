//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistdb", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {
    name: String
};
const listSchema = {
    name: String,
    items: [itemsSchema]
};

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
    name: "This is your todo list"
});
const item2 = new Item({
    name: "Add a new item by clicking + or pressing enter on your keyboard after entering a new item"
});
const item3 = new Item({
    name: "<== Mark the checkbox to delete the item"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
    Item.find({}, function(err, foundItems){
        if(foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err1) {
                if(err1) {
                    console.log(err1);
                }
                else {
                    console.log("success");
                }
            });
            res.redirect("/");
        }
        else 
            res.render("list", {items: foundItems, listTitle: "Today"});
    });
});

app.get("/:customListName", function(req, res) {
    const customListName = req.params.customListName;
    List.findOne({name: customListName}, function(err, foundList) {
        if(!err) {
            if(!foundList) {
                const newList = new List({
                    name: customListName,
                    items: defaultItems
                });
                console.log(newList.name);
                newList.save();
                res.redirect("/" + customListName);
            }
            else {
                res.render("list", {items: foundList.items, listTitle: foundList.name});
            }
        }
    });
});

app.post("/delete", function(req, res){
    const id = req.body.id;
    const listName = req.body.listName;
    if(listName === "Today") {
        Item.findByIdAndDelete(id, function(err){
            console.log("hello");
            if(err) console.log("cannot delete item");
            else console.log("item deleted successfuly");
            res.redirect("/");
        });
    }
    else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: id}}}, function(err, foundList) {
            if(!err) res.redirect("/" + listName);
        });
    }
});

app.post("/", function(req, res) {
    const customListName = req.body.listTitle;
    const item = new Item({
        name: req.body.item
    });
    if(customListName === "Today") {
        item.save();
        res.redirect("/");
    }
    else {
        List.findOne({name: customListName}, function(err, foundlist) {
            foundlist.items.push(item);
            foundlist.save();
            res.redirect("/" + customListName);
        });
    }
});


app.listen(3000, function() {
    console.log("running on port 3000");
});