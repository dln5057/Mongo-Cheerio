var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var Comment = require('../models/Comment.js');
var Article = require('../models/Article.js');

//index route that redirects to articles route
router.get('/', function(req, res) {
    res.redirect('/articles');
});

//scrape route that scrapes the articeles from ESPN.com/NFL
router.get('/scrape', function(req, res) {
  // body of html is grabbed with request
  request('http://www.espn.com/nfl/', function(error, response, html) {
    // html is loaded into cheerio and we save it as the variable $
    var $ = cheerio.load(html);
    //create a array for storing the article titles
    var titlesArray = [];
    $('article .text-container').each(function(i, element) {
        //result object to store articles and links to articles
        var result = {};
          //grab the title and link from the scrapped html and store in result
        result.title = $(this).children('.item-info-wrap').children('h1').text();
        result.link = $(this).children('.item-info-wrap').children('h1').children('a').attr('href');
   
        //checks that an empty articles arent pulled 
        if(result.title !=="" && result.link !== ""){
          console.log("title " + result.title);
          console.log("link " + result.link);

          // checks for empty articles 
          if(titlesArray.indexOf(result.title) == -1){
            //pushes result.title into titlesArray if not empty title
            titlesArray.push(result.title);
            //checks if article is already in database
            Article.count({ title: result.title}, function (err, test){
              if(test == 0){
                var entry = new Article(result);
                //save the artcle to the Mongo database
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
          //log article is in database
        else{
          console.log("Already have it");
        }
      }
        //empty article
      else{
        console.log("Not saved to DB, missing data")
      }

    });
        //redirect to the home page after scrapped 
    res.redirect('/');
  });
});

//route to show all the articles scrapped stored in the Mongo database
router.get('/articles', function (req, res){

  //query the database to sort all entries from new to oldest
  Article.find().sort({_id: -1})

    //execute the articles to handlebars and render
    .exec(function(err, doc){
      
      if (err){
        console.log(err);
      } 
 
      else {
        var artcl = {article: doc};
        res.render('index', artcl);
      }
    });

});

  //route to post comments to article
router.post('/comment/:id', function(req, res) {
  var user = req.body.name;
  var summary = req.body.comment;
  var articleId = req.params.id;

  var commentObj = {
    name: user,
    body: summary
  };
 
  //creates a new comment
  var newComment = new Comment(commentObj);

  //save comment to database to the ID of the article
  newComment.save(function(err, doc) {
      if (err) {
          console.log(err);
      } else {
          console.log("document ID: " + doc._id)
          console.log("Article ID: " + articleId)

          //find the article and push the comment in database to the ID 
          Article.findOneAndUpdate({ "_id": req.params.id }, {$push: {'comment':doc._id}}, {new: true})
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

//route to get the article that user wants to read
router.get('/readArticle/:id', function(req, res){
  var articleId = req.params.id;
  var articleObj = {
    article: [],
    body: []
  };

   //find the article at the id and populate comment 
    Article.findOne({ _id: articleId })
      .populate('comment')
      .exec(function(err, doc){

      if(err){
        console.log(err)

      } else {
        articleObj.article = doc;
        var link = doc.link;
        //grab article from link to grab the article story just like in the scrape route
        request("http://www.espn.com/" + link, function(error, response, html) {
          var $ = cheerio.load(html);

          $('article .article-body').each(function(i, element){
            articleObj.body = $(this).children('p').text();
            //render article and comments to the handlebars article file
            res.render('article', articleObj);
            return false;
          });
        });
      }
    });
});

module.exports = router;