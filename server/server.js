const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');


const app = express();
const port = process.env.PORT || 8080;


//parse the body as json
//send json to our express application
app.use(bodyParser.json());

app.post('/todos', (req, res) => {
	const todo = new Todo({
		text: req.body.text,
		completed:req.body.completed,
		completedAt: req.body.completedAt
	});

	todo.save().then(doc => {
		res.send(doc)
		console.log(doc)
	}).catch(e => {
		res.status(400).send(e)
		console.log(e)
	});
});


app.get('/todos', (req, res) => {
	Todo.find().then(todos => {
		res.send({
			todos
		})
	}).catch(err => {
		res.status(400).send(err)
	});
});


app.get('/todos/:id', (req, res) => {
	let id = req.params.id;
	if (!ObjectID.isValid(id)) {
		console.log('ID not valid')
		return res.status(404).send()
	}

	Todo.findById(id).then(todo => {
		if(!todo) return res.status(404).send()
		console.log('Found todo', todo)
		res.status(200).send({
			todo
		})
	}).catch(e => {
		console.log('ID not found')
		return res.status(404).send(e)
	});


	

});


app.listen(port, () => {
	console.log(`"Started on port " ${port}`)
});


module.exports = {
	app
};