const {mongoose} = require('./../db/mongoose')


const Todo = mongoose.model('Todo', {
	text: {
		type: String,
		required: true,
		minLength: 1,
		trim: true
	},
	completed: {
		type: Boolean,
		default: false
	},
	completedAt: {
		type: String,
		default: null
	},
	_user: {
		required: true,
		type: mongoose.Schema.Types.ObjectId,
	}
});

module.exports = {
	Todo
};