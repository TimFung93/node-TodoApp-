const {mongoose} = require('./../db/mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		trim: true,
		minlength: 1,
		unique: true,
		validate: {
			validator: validator.isEmail,
			message: '{VALUE} is not a valid email'
		}
	},
	password: {
		type: String,
		require: true,
		minlength: 6
	},
	tokens: [{
		access: {
			type: String,
			required: true
		},
		token: {
			type: String,
			required: true
		}
	}]
});

UserSchema.methods.toJSON = function() {
	const user = this;
	const userObject = user.toObject();

	return _.pick(userObject, ['_id', 'email'])
};

UserSchema.methods.generateAuthToken = function() {
	const user = this;
	const access = 'auth';
	const token = jwt.sign({
		_id: user._id.toHexString(),
		access
	}, 'abc123').toString();

	user.tokens.push({
		access,
		token
	});

	return user.save().then(() => {
		return token
	});
};

UserSchema.statics.findByToken = function(token) {
	let decoded;
	const User = this;


	try {
		decoded = jwt.verify(token, 'abc123')
	} catch(err) {
		// return new Promise((resolve, reject) => {
		// 	reject();
		// });
		return Promise.reject();
	}

	return User.findOne({
		'_id': decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
};

UserSchema.statics.findByCredentials = function(Email, PW) {
	const User = this;

	return User.findOne({
		"email": Email
	}).then(user => {
		if (!user) return Promise.reject('User not found')
		
		return new Promise((resolve, reject) => {
			bcrypt.compare(PW, user.password, (err, res) => {
				if (res) resolve(user)
				else reject('The email or password did not match')
				
			});
		});
	});
};

UserSchema.pre('save', function(next) { 
	const user = this;
	if(user.isModified('password')){
		bcrypt.genSalt((err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				if (err) {
					return err
				}
				user.password = hash
				next();	
			});
		});
	} else {
		next();
	}

});

const User = mongoose.model('User', UserSchema)

module.exports = {
	User
}