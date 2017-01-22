
// const mongodb = require('./db');
const mongodb = require('mongodb').MongoClient;
const settings = require('../settings');

 class Comment{
	constructor(name,day,title,comment){
		this.name = name;
		this.day = day;
		this.title = title;
		this.comment = comment;
	}

	save(callback){
		let name = this.name;
		let day = this.day;
		let title = this.title;
		let comment = this.comment;
		// mongodb.open(function(error ,db){
		mongodb.connect(settings.url,function(error,db){
			if(error){
				return callback(error);
			}
			db.collection('posts',function(error,collection){
				if(error){
					db.close();
					return callback(error);
				}
				collection.update({
					'name':name,
					'time.day':day,
					'title':title,
				},{
					$push:{'comments':comment}
				},function(error){
					db.close();
					if(error){
						return callback(error);
					}
					callback(null);
				});

			});
		});
	}
}

module.exports = Comment;