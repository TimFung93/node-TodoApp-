const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');


const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed')


beforeEach(populateUsers)
beforeEach(populateTodos)


describe("POST /todos", () => {
	it('should created a new todo', (done) => {
		const text = 'Test todo text';

		request(app)
			.post("/todos")
			.set('x-auth', users[0].tokens[0].token)
			.send({
				text
			})
			.expect(200)
			.expect(res => {
				expect(res.body.text).toBe(text);
			})
			.end((err, res) => {
				if (err) return done(err)
				Todo.find({text}).then(todos => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe(text);
					done();
				}).catch(err => {
					done(err)
			})
		});
	});

	it('Shoud not created todo with invaild body data', (done) => {
		request(app)
			.post("/todos")
			.set('x-auth', users[0].tokens[0].token)
			.send({})
			.expect(400)
			.end((err, res) => {
				if (err) return done(err)
				Todo.find().then(todos => {
					expect(todos.length).toBe(2)
					done();
				}).catch(err => {
					done(err)
			});
		});
	});
});



describe('GET /todos', () => {
	it('Should get all todos', (done) => {
		request(app)
			.get("/todos")
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect(res => {
				expect(res.body.todos.length).toBe(1);
			})
			.end(done);
	});
});



describe('GET /todos/:id', () => {
	it("Should return todo doc", (done) => {
		request(app)
			.get(`/todos/${todos[0]._id.toHexString()}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect(res => {
				expect(res.body.todo.text).toBe(todos[0].text);
			})
			.end(done);
	});
	it("Should return not a todo doc created by another user", (done) => {
		request(app)
			.get(`/todos/${todos[1]._id.toHexString()}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done);
	});

	it('should return 404 if todo not found', (done) => {
		const hexId = new ObjectID().toHexString();
		request(app)
			.get(`/todos/${hexId}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done)

	});

	it('should return 404 for non-object ids', (done) => {
		request(app)
			.get("/todos/123")
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done)
	});

});


describe('DELETE /todos/:id', () => {
	it('should remove a todo', (done) => {
		let hexId = todos[1]._id.toHexString();

		request(app)
			.delete(`/todos/${hexId}`)
			.set('x-auth', users[1].tokens[0].token)
			.expect(200)
			.expect(res => {
				expect(res.body.todo._id).toBe(hexId);
			})
			.end((err, res) =>{
				if (err) return done(err)
				Todo.findById(hexId).then(todo => {
					expect(todo).toNotExist();
					done();
				}).catch(e =>{
					done(e)
				})
			});

	});

	it('should not remove a todo created by another user', (done) => {
		let hexId = todos[0]._id.toHexString();

		request(app)
			.delete(`/todos/${hexId}`)
			.set('x-auth', users[1].tokens[0].token)
			.expect(404)
			.end((err, res) =>{
				if (err) return done(err)
				Todo.findById(hexId).then(todo => {
					expect(todo).toExist();
					done();
				}).catch(e =>{
					done(e)
				})
			});

	});

	it('Should return 404 it todo not found',(done) => {
		const hexId = new ObjectID().toHexString();
		
		request(app)
			.delete(`/todos/${hexId}`)
			.set('x-auth', users[1].tokens[0].token)
			.expect(404)
			.end(done)
	});

	it('Should return 404 if objectId is invalid' , (done) => {
		request(app)
			.delete("/todos/123")
			.set('x-auth', users[1].tokens[0].token)
			.expect(404)
			.end(done)
	});
});


describe('PATCH /todos/:id', () => {
	it('Should update a todo', (done) => {
		const hexId = todos[0]._id.toHexString();
		const text = 'This should be new text'
		const date = new Date().getTime();
		request(app)
			.patch(`/todos/${hexId}`)
			.set('x-auth', users[0].tokens[0].token)
			.send({
				completed: true,
				text
			})
			.expect(200)
			.expect(res => {
				expect(res.body.todo.text).toBe(text);
				expect(res.body.todo.completed).toBe(true);
				expect(res.body.todo.completedAt).toEqual(res.body.todo.completedAt);
			})
			.end(done);
	});
	it('Should not update a todo created by different user', (done) => {
		const hexId = todos[0]._id.toHexString();
		const text = 'This should be new text'
		const date = new Date().getTime();
		request(app)
			.patch(`/todos/${hexId}`)
			.set('x-auth', users[1].tokens[0].token)
			.send({
				completed: true,
				text
			})
			.expect(404)
			.end(done);
	});

	it('should clear compeltedAt when it is not completed', (done) =>{
		const hexId = todos[1]._id.toHexString();
		const text = 'This should be new text!!!!!!!!!!!!'

		request(app)
			.patch(`/todos/${hexId}`)
			.set('x-auth', users[1].tokens[0].token)
			.send({
				completed: false,
				text
			})
			.expect(200)
			.expect(res => {
				expect(res.body.todo.text).toBe(text)
				expect(res.body.todo.completed).toBe(false)
				expect(res.body.todo.completedAt).toNotExist()
			})
			.end(done)
	});
});


describe('GET /users/me', () => {
	it('Should return user if authenticated', (done) =>{
		request(app)
			.get('/users/me')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect(res => {
				expect(res.body._id).toBe(users[0]._id.toHexString())
				expect(res.body.email).toBe(users[0].email)
			})
			.end(done);
	});

	it('Should return a 401 if not authenticated', (done) => {
		request(app)
			.get('/users/me')
			.expect(401)
			.expect(res => {
				expect(res.body).toEqual({})
			})
			.end(done)
	});
});


describe('POST users/me', () => {
	it('Should create a user', (done) =>{
		const email = 'example@example.com'
		const password = '123456789'

		request(app)
			.post('/users')
			.send({
				email,
				password
			})
			.expect(200)
			.expect(res => {
				expect(res.headers['x-auth']).toExist()
				expect(res.body._id).toExist()
				expect(res.body.email).toBe(email)
			})
			.end(err => {
				if (err) return done(err)
				User.findOne({
					email
				}).then(user => {
					expect(user).toExist()
					expect(user.password).toNotBe(password)
					done()
				}).catch(err => {
					done(err)
				})
			});

	});

	it('Should return validation errors if request invalid', (done) => {
		const email = 'notavalidemail.com'
		const password = '123456789'

		request(app)
			.post('/users')
			.send({
				email,
				password
			})
			.expect(400)
			.end(done)

	});

	it('Should not create user if email in use', (done) => {
		// const email = 'timothy@example.com'
		// const password = '123456789'

		// request(app)
		// 	.post('/users')
		// 	.send({
		// 		email,
		// 		password
		// 	})
		// 	.expect(400)
		// 	.expect(res => {
		// 		User.findOne({
		// 			email
		// 		}).then(user => {
		// 			expect(user.email).toEqual(email)
		// 		})
		// 	})
		// 	.end(done)

		request(app)
			.post('/users')
			.send({
				email: users[0].email,
				password: '123456789'
			})
			.expect(400)
			.end(done)
	});
});


describe('POST /users/login', () => {
	it('Should login user and return auth token', (done) => {
		request(app)
			.post('/users/login')
			.set('x-auth', users[1].tokens[0].token)
			.send({
				email: users[1].email,
				password: users[1].password
			})
			.expect(200)
			.expect(res => {
				expect(res.headers['x-auth']).toExist()
			})
			.end((err, res) => {
				if (err) return done()

				User.findById(users[1]._id)
					.then(user => {
						expect(user.tokens[1]).toInclude({
							access: 'auth',
							token: res.headers['x-auth'],
						})
						done();
					}).catch(err => {
						done(err)
					});
			})
	});

	it('Should reject invalid login', (done) => {
		request(app)
			.post('/users/login')
			.send({
				email: users[1].email,
				password: 'notpassword'
			})
			.expect(400)
			.expect(res => {
				expect(res.headers['x-auth']).toNotExist()
			})
			.end((err, res) => {
				if (err) return done()

				User.findById(users[1]._id)
					.then(user => {
						expect(users[1].tokens.length).toBe(1)
						done()
					}).catch(err => {
						done(err)
					});
					
			});
	});

});


describe('DELETE /users/me/token', () => {
	it('Should remove auth token on logout', (done) => {
		request(app)
			.delete('/users/me/token')
			.set('x-auth', users[0].tokens[0].token)
			.send({
				email:users[0].email,
				password: users[0].password

			})
			.expect(200)
			.end((err, res) => {
				if(err) return done()

				User.findById(users[0]._id)
				.then(user => {
					expect(users.tokens).toNotExist()
					done()
				}).catch(err => {
					done(err)
				})
			})
	})
});







