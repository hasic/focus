

const mongodb = require('./db');
const markdown = require('markdown').markdown;

const POST_DB_NAME = 'posts';


function Post(name,head,title,tags,post){
	this.name = name;
	this.title = title;
	this.post = post;
	this.tags = tags;
	this.head = head;
}

module.exports = Post;

Post.prototype.save = function(callback){
	let date = new Date();
	let time = {
		date:date,
		year:date.getFullYear(),
		month:date.getFullYear()+'-'+(date.getMonth() +1),
		day:date.getFullYear()+'-'+(date.getMonth() +1)+'-'+date.getDate(),
		minute:date.getFullYear()+'-'+(date.getMonth() +1)+'-'+date.getDate()+' '+date.getHours()+':'+(date.getMinutes()<10 ? '0' + date.getMinutes() : date.getMinutes()),
	}

	let post = {
		name:this.name,
		time:time,
		title:this.title,
		post:this.post,
		comments:[],
		tags:this.tags,
		pv:0,
		head:this.head,
		reprint_info:{},
	};
	mongodb.open(function(error ,db){
		if(error){
			return callback(error);
		}
		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			collection.insert(post,{
				safe:true
			},function(error,user){
				mongodb.close();
				if(error){
					return callback(error);
				}
				callback(null);
			})
		});
	});
};

Post.getAll = function(name,callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}

		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			let query = {};
			if(name){
				query.name = name;
			}

			collection.find(query).sort({
				time:-1
			}).toArray(function(error,docs){
				mongodb.close();
				if(error){
					return callback(error);
				}
				console.log('getAll docs=='+docs);
				docs.forEach(function(doc){
					doc.post = markdown.toHTML(doc.post);
					doc.tags = doc.tags ? doc.tags : new Array();
				});
				callback(null,docs);
			});
		});
	})
};

Post.getLimit = function(name,page,limitNum,callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}

		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			let query = {};
			if(name){
				query.name = name;
			}
			console.log('getLimit limitNum=='+limitNum);
			collection.count(query,function(error,total){
				collection.find(query,{
					skip:(page -1)*10,
					limit:parseInt(limitNum),
				}).sort({
					time:-1
				}).toArray(function(error,docs){
					mongodb.close();
					if(error){
						return callback(error);
					}
					docs.forEach(function(doc){
						doc.post = markdown.toHTML(doc.post);
					});
					callback(null,docs,total);
				});
			});
		});
	})
};

Post.getOne = function(name,day,title,callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}
		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			collection.findOne({
				'name':name,
				'time.day':day,
				'title':title,
			},function(error,doc){
				if(error){
					mongodb.close();
					return callback(error);
				}

				if(doc){
					collection.update({
						'name':name,
						'time.day':day,
						'title':title,
					},{
						$inc:{'pv':1}
					},function(error){
						mongodb.close();
						if(error){
							console.log('pv error=='+error);
						}
					});	
				}

				doc.post = markdown.toHTML(doc.post);
				callback(null,doc);
			});
		});
	});
};

Post.edit = function(name,day,title,callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}

		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			collection.findOne({
				'name':name,
				'time.day':day,
				'title':title,
			},function(error,doc){
				mongodb.close();
				if(error){
					return callback(error);
				}
				//doc.post = markdown.toHTML(doc.post);
				callback(null,doc);
			});
		});
	});
}

Post.update = function(name,day,title,post,callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}

		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			collection.update({
				'name':name,
				'time.day':day,
				'title':title,
			},{
				$set:{post:post}
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


Post.remove = function(name,day,title,callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}
		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}

			collection.findOne({
				'name':name,
				'time.day':day,
				'title':title,
			},function(error,doc){
				if(error){
					mongodb.close();
					console.log('post remove find error'+error);
				}
				let reprint_from = '';
				if(doc.reprint_info.reprint_from){
					reprint_from = doc.reprint_info.reprint_from;
				}
				if(reprint_from != ''){
					collection.update({
						'name':reprint_from.name,
						'time.day':reprint_from.day,
						'title':reprint_from.title,
					},{
						$pull:{
							'reprint_info.reprint_to':{
								'name':name,
								'day':day,
								'title':title,
							}
						}
					},function(error){
						if(error){
							mongodb.close();
							return callback(error);
						}
					});
				}

				let reprint_to = '';
				if(doc.reprint_info.reprint_to){
					reprint_to = doc.reprint_info.reprint_to;
				}
				console.log('remove reprint_to=='+JSON.stringify(reprint_to));
				if(reprint_to != ''){
					reprint_to.forEach(function(toPost,index){
						collection.update({
							'name':toPost.name,
							'time.day':toPost.day,
							'title':toPost.title,
							},{
								$set:{
									'reprint_info':{
										'reprint_from':undefined
									}
								}
							},function(error){
								console.log('remove reprint_to error=='+JSON.stringify(error));
								if(error){
									mongodb.close();
									//return callback(error);
								}
						});
					});
					
				}

				collection.remove({
					'name':name,
					'time.day':day,
					'title':title,
					},{
						w:1
					},function(error){
						mongodb.close();
						if(error){
							return callback(error);
						}
						callback(null);
					});
				});
		});
	});
}

Post.getArchive = function(callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}

		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			collection.find({},{
				"name":1,
				"time":1,
				"title":1,
			}).sort({
				time:-1
			}).toArray(function(error,docs){
				mongodb.close();
				if(error){
					return callback(error);
				}
				callback(null,docs);
			});
		});
	});
}

Post.getTags = function(callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}

		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}

			collection.distinct('tags',function(error,docs){
				mongodb.close();
				if(error){
					return callback(error);
				}

				callback(null,docs);
			});
		});
	});
}

Post.getOneTag = function(tag,callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}

		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			collection.find({
				'tags':tag
			},{
				'name':1,
				'time':1,
				'title':1,
			}).toArray(function(error,docs){
				mongodb.close();
				if(error){
					return callback(error);
				}
				callback(null,docs);
			});

		});

	});
}

Post.search = function(keyword,callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}
		console.log('search keyword=='+keyword);
		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			let pattern = new RegExp(keyword,'i');
			console.log('search pattern=='+pattern);
			collection.find({
				'title':pattern,
			},{
				'name':1,
				'time':1,
				'title':1,
			}).sort({
				time:-1
			}).toArray(function(error,docs){
				mongodb.close();
				console.log('search result =='+JSON.stringify(docs));
				if(error){
					return callback(error);
				}
				callback(null,docs);
			});
		});
	});
}

Post.reprint = function(reprint_from,reprint_to,callback){
	mongodb.open(function(error,db){
		if(error){
			return callback(error);
		}
		db.collection(POST_DB_NAME,function(error,collection){
			if(error){
				mongodb.close();
				return callback(error);
			}
			console.log('reprint reprint_from=='+JSON.stringify(reprint_from));
			collection.findOne({
				'name':reprint_from.name,
				'time.day':reprint_from.day,
				'title':reprint_from.title,
			},function(error,doc){
				if(error){
					mongodb.close();
					return callback(error);
				}
				let date_now = new Date();
				let time = {
					date:date_now,
					year:date_now.getFullYear(),
					month:date_now.getMonth(),
					day:date_now.getFullYear()+'-'+(date_now.getMonth()+1)+'-'+date_now.getDate(),
					minute:date_now.getFullYear()+'-' + (date_now.getMonth()+1)+'-'+date_now.getDate()+' '+date_now.getHours()+':'+(date_now.getMinutes() < 10 ? '0'+date_now.getMinutes() : date_now.getMinutes()),
				}
				console.log('reprint doc=='+doc);
				delete doc._id;
				doc.name = reprint_to.name;
				doc.head = reprint_to.head;
				doc.time = time;
				doc.title = (doc.title.search(/[转载]/)> -1) ? doc.title : '[转载]'+doc.title;
				doc.comments = [];
				doc.reprint_info = {'reprint_from':reprint_from};
				doc.pv =0;
				collection.update({
					'name':reprint_from.name,
					'time.day':reprint_from.day,
					'title':reprint_from.title,
				},{
					$push:{
						'reprint_info.reprint_to':{
							'name':doc.name,
							'day':time.day,
							'title':doc.title,
						}
					}
				},function(error){
					if(error){
						month.close();
						return callback(error);
					}
				});

				collection.insert(doc,{
					safe:true
				},function(error,post){
					mongodb.close();
					if(error){
						return callback(error);
					}
					console.log('reprint success post=='+JSON.stringify(post));
					callback(null,post.ops[0]);
				});
			});
		});
	});
}






