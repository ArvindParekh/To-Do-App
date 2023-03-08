// Using templates, you can do all the calculations in the backend and then insert those values into the variables in your html files. This elimates the use of having to write individual res.write's and writing the html code in them and then sending all of them using a res.send. 
// So now, create a separate html file the way you like with variables, which will be rendered by the server using the res.render method and will provide the data to the variables.


const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const password = encodeURIComponent("aru@291013"); //as all special characters in the connection string should be uri encoded
const date = require(__dirname + '/date.js');
const _ = require('lodash');
const app = express();

app.use(express.static('public')); //to serve up all the static files which developers generally keep in the public folders. We are using it here to server up our styles.css file.
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); //when you do this, create a views (exact same name) folder and keep your ejs files in that folder 

//establish the mongodb connection
mongoose.connect(`mongodb+srv://admin-arvind:${password}@arvind0.ayhtxwg.mongodb.net/todoListDb`);

//Make the schema
const itemSchema = new mongoose.Schema({
    item: String,
})

//Make the model
const Tasks = new mongoose.model('Task', itemSchema);


const item1 = new Tasks({
    item: "Welcome to your TodoList! 🚀"
})

const item2 = new Tasks({
    item: "Hit the + button to add a new item",
})

const item3 = new Tasks({
    item: "<-- Hit this to mark an item as complete!"
})

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

let insertFlag = true; //This flag prevents loading of the the default items again in the home route after they have been deleted

app.get('/', function (req, res) {
    let day = date.getDay();

    Tasks.find().then((data) => {

        console.log(insertFlag);
        if(data.length === 0 && insertFlag){
            insertFlag = false;
            console.log("Inside: ", insertFlag);
            Tasks.insertMany(defaultItems);
            res.redirect('/');
        }
        else{
        res.render('list', {
            listTitle: day,
            tasksList: data
        })
    }
    });  //this looks up 'day.ejs' file inside the views directory and replaces 'todaysDay' in that file with the 'day' variable in our app.js file
})


app.get('/:customListName', function(req,res){
    let listName = _.capitalize(req.params.customListName); //we use lodash here to capitalize the first letter of every custom list, so that for eg when user goes to '/home' and '/Home', he sees the same list and not two different lists with name 'home' and 'Home'. So here, both '/home' and '/Home' route creates the same single list called 'Home' in the database. This maintains uniformity

    List.findOne({name: listName}).then(function(foundList){

        if(foundList){
            res.render('list', {tasksList: foundList.items, listTitle: foundList.name});
        }
        else{
            const customList = new List({
                name: listName,
                items: defaultItems
            })
            customList.save();

            res.render('list', {tasksList: customList.items, listTitle: customList.name});
        }

    })
})

app.get('/about', function (req, res) {
    res.render('about');
})


app.post('/', function (req, res) {

    const listName = req.body.list;
    const task = new Tasks({
        item: req.body.newTask,
    })

    if (listName === date.getDay()) {
        
        task.save();
        res.redirect('/');
    
    }
    else {
        List.findOne({name: listName}).then(function(data){
            data.items.push(task);
            data.save();
            res.redirect('/' + listName);
        })
        
    }
})


// app.post('/delete', async function(req,res){
//     const checkedItemId = req.body.checkbox;  //This in a way completes a whole loop. We send the list data array from our server which goes through the forEach loop in out list.ejs file which we then send back to our server when that particular list is pressed

//     await Tasks.findOneAndDelete({_id: checkedItemId}); //REMEMBER: All mongoose functions use async/wait or promises!
//     res.redirect('/');
// })

app.post('/delete', async function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === date.getDay()){
        await Tasks.findOneAndDelete({_id: checkedItemId});
        res.redirect('/');
    }
    else{
        await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}); //$pull operator is used to remove documents from arrays
        res.redirect('/' + listName);
    }
})


app.listen(process.env.PORT || 3000, function () {
    console.log("The server is running on port 3000");
})