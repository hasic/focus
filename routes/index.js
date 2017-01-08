
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/user.js');
const Post = require('../models/post.js');
const Comment = require('../models/comment.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  Post.getAll(null,function(error,posts){
    if(error){
      posts = [];
    }

    res.render('index', { 
      title: '主页' ,
      user:req.session.user,
      posts:posts,
      needPaging:false,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
});

router.get('/paging', function(req, res, next) {
  let page = req.query.p ? parseInt(req.query.p) : 1;
  Post.getLimit(null,page,5,function(error,posts,total){
    if(error){
      posts = [];
    }
    res.render('index', { 
      title: '分页' ,
      user:req.session.user,
      posts:posts,
      needPaging:true,
      page:page,
      isFirstPage:(page-1) == 0,
      isLastPage:((page -1)*10 +posts.length) == total,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
});

router.get('/archive',function(req,res,next){
  Post.getArchive(function(error,posts){
    if(error){
      req.flash('error',error);
      res.redirect('/');
    }
    res.render('archive',{
      title:'存档',
      user:req.session.user,
      posts:posts,
      success:req.flash('success').toString(),
      error:req.flash('error').toString(),
    });
  });
});

router.get('/tags',function(req,res,next){
  Post.getTags(function(error,posts){
    if(error){
      req.flash('error',error);
      res.redirect('/');
    }
    res.render('tags',{
      title:'标签',
      posts:posts,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString(),
    });
  });
});

router.get('/links',function(req,res,next){
  res.render('links',{
    title:'友情链接',
    user:req.session.user,
    success:req.flash('success').toString(),
    error:req.flash('error').toString(),
  });
});

router.get('/tags/:tag',function(req,res,next){
  Post.getOneTag(req.params.tag,function(error,posts){
    if(error){
      req.flash('error',error);
      return res.redirect('/');
    }
    res.render('tag',{
      title:'TAG:' + req.params.tag,
      posts:posts,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString(),
    });
  });
});

router.get('/reg',isLogin);
router.get('/reg',function(req,res,next){
  console.log('user == '+req.session.user);
	res.render('reg', {
   title: '注册' ,
   user:req.session.user,
   success:req.flash('success').toString(),
   error:req.flash('success').toString()
 });
});

router.post('/reg',isLogin);
router.post('/reg', function(req, res, next) {
  var name = req.body.name;
  var password = req.body.password;
  var password_re = req.body['password-repeat'];
  console.log(req.flash);
  if(password != password_re){
  	req.flash('error','两次输入的密码不一样！');
  	return res.redirect('/reg');
  }

  console.log(password);
  var md5 = crypto.createHash('md5');
  var pwd = md5.update(password).digest('hex');
  var newUser = new User({
  	name:name,
  	password:pwd,
  	email:req.body.email
  });

  User.get(newUser.name,function(error,user){
  	if(error){
  		req.flash('error',err);
  		return res.redirect('/');
  	}
  	if(user){
  		req.flash('error','用户已存在！');
  		return res.redirect('/');
  	}

  	newUser.save(function(error,user){
  		if(error){
  			req.flash('error',error);
  			return res.redirect('/');
  		}
      console.log('reg user=='+user);
  		req.session.user = user;
  		req.flash('success','注册成功！');
  		res.redirect('/');
  	});
  });
});

router.get('/login',isLogin);
router.get('/login', function(req, res, next) {
  res.render('login', { 
    title: '登录' ,
    user:undefined,
    success:req.flash('success').toString(),
    error:req.flash('error').toString(),
  });
});

router.post('/login',isLogin);
router.post('/login',function(req,res,next){
  let md5 = crypto.createHash('md5');
  let password = md5.update(req.body.password).digest('hex');
  User.get(req.body.name,function(err,user){
    if(!user){
      req.flash('error','用户不存在！');
      return res.redirect('/login');
    }
    if(user.password != password){
      req.flash('error','密码错误!');
      return res.redirect('/login');
    }
    req.session.user = user;
    req.flash('success','登录成功...');
    res.redirect('/');
  });
});

router.get('/logout',needLogin);
router.get('/logout', function(req, res, next) {
  req.session.user = null;
  req.flash('success','登出成功');
  res.redirect('/');
});

router.get('/post',needLogin);
router.get('/post', function(req, res, next) {
  res.render('post', { 
    title: '发表' ,
    user:req.session.user,
    success:req.flash('success').toString(),
    error:req.flash('error').toString(),
  });
});

router.post('/post',needLogin);
router.post('/post',function(req,res,next){
  let currentUser = req.session.user;
  let tags = [req.body.tag1,req.body.tag2,req.body.tag3];
  let post = new Post(currentUser.name,currentUser.head,req.body.title,tags,req.body.post);
  post.save(function(error){
    if(error){
      req.flash('error',error);
      return res.redirect('/');
    }
    req.flash('success','发布成功...');
    res.redirect('/');
  });
});


router.get('/upload',needLogin);
router.get('/upload',function(req,res,next){
  res.render('upload',{
    title:'上传',
    user:req.session.user,
    success:req.flash('success').toString(),
    error:req.flash('error').toString(),
  });
});

router.post('/upload',needLogin);
router.post('/upload',function(req,res){
  req.flash('success','图片上传成功');
  res.redirect('/upload');
}); 

router.get('/search',function(req,res,next){
  Post.search(req.query.keyword,function(error,posts){
    if(error){
      req.flash('error',error);
      return res.redirect('/');
    }
    res.render('search',{
      title:"SEARCH－"+req.query.keyword+'－结果如下：',
      posts:posts,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString(),
    });
  });
});

router.get('/u/:name',function(req,res,next){
  User.get(req.params.name,function(error,user){
    if(!user){
      req.flash('error','用户不存在...');
      return res.redirect('/');
    }
    Post.getAll(user.name,function(error,posts){
      if(error){
        req.flash('error','error');
        return res.redirect('/');
      }
      res.render('user',{
        title:user.name,
        posts:posts,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString(),
      })
    });
  });
});

router.get('/u/:name/:day/:title',function(req,res,next){
  Post.getOne(req.params.name,req.params.day,req.params.title,function(error,post){
    if(error){
      req.flash('error',error);
      res.redirect('/');
    }
    res.render('article',{
      title:req.params.title,
      post:post,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString(),
    });
  });
});

router.get('/edit/:name/:day/:title',needLogin);
router.get('/edit/:name/:day/:title',function(req,res,next){
  let currentUser = req.session.user;
  Post.edit(currentUser.name,req.params.day,req.params.title,function(error,post){
    if(error){
      req.flash('error',error);
      return res.redirect('back');
    }
    res.render('edit',{
      title:'编辑',
      post:post,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString(),
    });
  });
});

router.post('/edit/:name/:day/:title',needLogin);
router.post('/edit/:name/:day/:title',function(req,res,next){
  let currentUser = req.session.user;
  Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(error){
    let articleUrl = encodeURI('/u/'+req.params.name+'/'+req.params.day+'/'+ req.params.title);
    if(error){
      req.flash('error',error);
      res.redirect(articleUrl);
    }
    req.flash('success','修改成功...');
    res.redirect(articleUrl);
  });
});

router.get('/remove/:name/:day/:title',needLogin);
router.get('/remove/:name/:day/:title',function(req,res,next){
  let currentUser =req.session.user;
  Post.remove(currentUser.name,req.params.day,req.params.title,function(error){
    if(error){
      req.flash('error',error);
      res.redirect('back');
    }
    req.flash('success','删除成功...');
    res.redirect('/');
  }); 
});

router.post('/u/:name/:day/:title',function(req,res){
  let date = new Date();
  let time = date.getFullYear()+'-'+(date.getMonth() +1)+'-'+date.getDate()+' '+
             date.getHours()+':'+(date.getMinutes()< 10 ? '0'+date.getMinutes() : date.getMinutes());
  let md5 = crypto.createHash('md5');
  let email_md5 = md5.update(req.body.email.toLowerCase()).digest('hex');
  let head_icon = 'http://www.gravatar.com/avatar/'+email_md5+'?s=48;'
  let comment = {
    name:req.body.name,
    email:req.body.email,
    website:req.body.website,
    time:time,
    content:req.body.content,
    head:head_icon,
  };

  let newComment = new Comment(req.params.name,req.params.day,req.params.title,comment);
  newComment.save(function(error){
    if(error){
      req.flash('error',error);
      return res.redirect('back');
    }
    req.flash('success','留言成功');
    res.redirect('back');
  });
});

router.get('/reprint/:name/:day/:title',needLogin);
router.get('/reprint/:name/:day/:title',function(req,res){
  Post.edit(req.params.name,req.params.day,req.params.title,function(error,doc){
    if(error){
      req.flash('error',error);
      return res.redirect('back');
    }
    let currentUser = req.session.user;
    let reprint_from = {
      name:doc.name,
      day:doc.time.day,
      title:doc.title,
    }
    let reprint_to = {
      name:currentUser.name,
      head:currentUser.head,
    }
    console.log('reprint index reprint_from=='+JSON.stringify(reprint_from)+'--post=='+JSON.stringify(doc))
    Post.reprint(reprint_from,reprint_to,function(error,post){
      if(error){
        req.flash('error',error);
        return res.redirect('back');
      }
      console.log('reprint success post =='+JSON.stringify(post));
      req.flash('success','转载成功...');
      let url = encodeURI('/u/'+post.name + '/' + post.time.day + '/' + post.title);
      res.redirect(url);
    });
  });
});



function needLogin(req,res,next){
  if(!req.session.user){
    req.flash('error','请先登录...');
    res.redirect('/login');
  }
  next();
}

function isLogin(req,res,next){
  if(req.session.user){
    req.flash('error','已经登录...');
    return res.redirect('back');
  }
  next();
}

module.exports = router;

// module.exports = function(app){
// 	app.get('/',function(req,res){
// 		res.render('index',{title:'Express'});
// 	});
// 	app.get('/hasic',function(req,res){
// 		res.render('index',{title:'Welcome Hasic'});
// 	});
// }