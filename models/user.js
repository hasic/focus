
var mongodb = require('./db');
const crypto = require('crypto');

function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
}

module.exports = User;

User.prototype.save = function(callback){

	let md5 = crypto.createHash('md5');
	let email_md5 = md5.update(this.email.toLowerCase()).digest('hex');
	let head_icon = 'http://www.gravatar.com/avatar/'+email_md5+'?s=48';
	//console.log('user save head=='+head);
	let user = {
		name:this.name,
		password:this.password,
		email:this.email,
		head:head_icon,
	};
	mongodb.open(function(error ,db){
		if(error){
			return callback(error);
		}
		db.collection('users',function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			collection.insert(user,{
				safe:true
			},function(error,user){
				mongodb.close();
				if(error){
					return callback(error);
				}
				console.log('save user=='+JSON.stringify(user));
				callback(null,user.ops[0]);
			})
		});
	});
};

User.get = function(name,callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}

		db.collection('users',function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			collection.findOne({
				name:name
			},function(error,user){
				mongodb.close();
				if(error){
					return callback(error);
				}
				callback(null,user);
			})
		});
	});
}



