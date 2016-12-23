var express = require('express');
var router = express.Router();
var path = require('path');

//require request and cheerio to scrape
var request = require('request');
var cheerio = require('cheerio');

//Require models
var Comment = require('../models/Comment.js');
var Article = require('../models/Article.js');

//index
router.get('/', function(req, res) {
    res.redirect('/articles');
});

router.get('/scrape', function(req, res) {
  // first, we grab the body of the html with request
  request('http://www.espn.com/nfl/', function(error, response, html) {
    // then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);

    var titlesArray = [];
    $('article .text-container').each(function(i, element) {
        var result = {};
  
        result.title = $(this).children('.item-info-wrap').children('h1').text();
        // result.summary = $(this).children('.item-info-wrap').children('p').text();
        result.link = $(this).children('.item-info-wrap').children('h1').children('a').attr('href');
   
    // console.log(this)

    // var entry = new Article (result);
        if(result.title !=="" && result.link !== ""){
          console.log("title " + result.title);
          console.log("link " + result.link);
          // console.log("summary " + result.summary);
          if(titlesArray.indexOf(result.title) == -1){
    
            titlesArray.push(result.title);

            Article.count({ title: result.title}, function (err, test){
              if(test == 0){

                var entry = new Article(result);
                entry.save(function(err, doc) {
                  // log any errors
                  if (err) {
                    console.log(err);
                  } 
                  // or log the doc
                  else {
                    console.log(doc);
                  }
                })
              }
            })
          }

        else{
          console.log("Already have it");
        }
      }
      else{
        console.log("Not saved to DB, missing data")
      }

    });
    res.redirect('/');
  });
});

router.get('/articles', function (req, res){

  // Query MongoDB for all article entries (sort newest to top, assuming Ids increment)
  Article.find().sort({_id: -1})

    // Then, send them to the handlebars template to be rendered
    .exec(function(err, doc){
      // log any errors
      if (err){
        console.log(err);
      } 
      // or send the doc to the browser as a json object
      else {
        var artcl = {article: doc};
        res.render('index', artcl);
        // res.json(hbsObject)
      }
    });

});

router.get('/articles-json', function(req, res) {
    Article.find({}, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});

router.post('/comment/:id', function(req, res) {
  var user = req.body.name;
  var content = req.body.comment;
  var articleId = req.params.id;

  //submitted form
  var commentObj = {
    name: user,
    body: content
  };
 
  //using the Comment model, create a new comment
  var newComment = new Comment(commentObj);

  newComment.save(function(err, doc) {
      if (err) {
          console.log(err);
      } else {
          console.log(doc._id)
          console.log(articleId)
          Article.findOneAndUpdate({ "_id": req.params.id }, {$push: {'comment':doc._id}}, {new: true})
            //execute everything
            .exec(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/readArticle/' + articleId);
                }
            });
        }
  });
});

router.get('/readArticle/:id', function(req, res){
  var articleId = req.params.id;
  var hbsObj = {
    article: [],
    body: []
  };



    // //find the article at the id
    Article.findOne({ _id: articleId })
      .populate('comment')
      .exec(function(err, doc){

      if(err){

      } else {
        hbsObj.article = doc;
        var link = doc.link;
        //grab article from link
        request("http://www.espn.com/" + link, function(error, response, html) {
          var $ = cheerio.load(html);

          $('article .article-body').each(function(i, element){
            hbsObj.body = $(this).children('p').text();
            console.log()
            //send article body and comments to article.handlbars through hbObj
            res.render('article', hbsObj);
            //prevents loop through so it doesn't return an empty hbsObj.body
            return false;
          });
        });
      }

    });
});

module.exports = router;