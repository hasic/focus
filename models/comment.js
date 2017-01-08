
const mongodb = require('./db');

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
		mongodb.open(function(error,db){
			if(error){
				return callback(error);
			}
			db.collection('posts',function(error,collection){
				if(error){
					mongodb.close();
					return callback(error);
				}
				collection.update({
					'name':name,
					'time.day':day,
					'title':title,
				},{
					$push:{'comments':comment}
				},function(error){
					mongodb.close();
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