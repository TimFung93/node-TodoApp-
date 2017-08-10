const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');



const userOneId = new ObjectID()
const userTwoId = new ObjectID()

const users = [{
	//valid jwt token
	_id: userOneId,
	email: 'timothy@example.com',
	password: '123456',
	tokens: [{
		access:'auth',
		token: jwt.sign({
			_id: userOneId,
			access: 'auth'
		}, process.env.jwt_secret).toString()
	}]
}, {
	//invalid jwt token
	_id: userTwoId,
	email: 'molly@example.com',
	password: '1234567',
		tokens: [{
		access:'auth',
		token: jwt.sign({
			_id: userTwoId,
			access: 'auth'
		}, process.env.jwt_secret).toString()
	}]

}]



const todos = [{
	_id: new ObjectID(),
	text: "First test todo",
	_user: userOneId
}, {
	_id: new ObjectID(),
	text: "Second test todo",
	completed: true,
	completedAt: 333,
	_user: userTwoId
}];



const populateTodos = (done) => {
	Todo.remove({}).then(() => {
		return Todo.insertMany(todos);
	}).then(() => {
		done();
	})
};


const populateUsers = (done) => {
	User.remove({}).then(() => {
		const userOne = new User(users[0]).save();
		const userTwo = new User(users[1]).save();

		return Promise.all([userOne, userTwo])
	}).then(() =>{
		done()
	})
}




module.exports = {todos, populateTodos, users, populateUsers}


