// imports
var $ = require("jquery");
var Handlebars = require("handlebars");

// global vars
var clientId = "45f7d54407b04085a00ec732235ae188";
var responseType = "token";
var redirectUri = window.location.origin;

var login = "https://accounts.spotify.com/authorize?client_id=" + clientId + "&redirect_uri=" + redirectUri + "&response_type=" + responseType;
var accessToken = "";
var loggedIn = false;

var source = null;
var template = null;

// if there is a hash, user has logged in
if (window.location.hash) {
  loggedIn = true;
  var splitHash = window.location.hash.split(/=|&/g);
  accessToken = splitHash[1];
}

$(document).ready(function() {
  if (loggedIn) {
    $('#recommendations-panel').show();
    $('#submit').click(requestRecommendations);

    source = $('#song-template').html();
    template = Handlebars.compile(source);

    $('#autofill').click(function(event) {
      console.log('click');
      $('form input').each(function(index, el) {
        $(this).attr('value', $(this).attr('placeholder'));
      });
      requestRecommendations();
    });
  } else {
    $('#login').attr('href', login);
    $('#login-panel').show();
  }
});

function requestRecommendations() {

  var url = "https://api.spotify.com/v1/recommendations?seed_artists=";
  // get all form information
  var artists = [];
  var genres = [];
  $('.artists input').each(function(index, el) {
    if (this.value !== '') {
      $.ajax({
       url: 'https://api.spotify.com/v1/search?q=' + this.value + '&type=artist',
       headers: {
           'Authorization': 'Bearer ' + accessToken
       },
       success: function(response) {
          var id = response.artists.items[0].id;
          console.log(id);
          artists.push(id);
          url += id + ',';
       }
    });
    }
  });

  // hacky way of ensuring our previous ajax calls have completed, must only let it happen once
  var ajax = false;
  $(document).ajaxStop(function () {
    // add genres after artists have finished loading
    url +="&seed_genres=";
    $('.genres input').each(function(index, el) {
      if (this.value !== '') {
        genres.push(this.value);
        url += this.value.toLowerCase() + ','; // add genres
      }
    });
    if (!ajax) { // hacky ajax continued
      url += '&max_popularity=20';
      console.log(accessToken);
      $.ajax({
       url: url,
       headers: {
           'Authorization': 'Bearer ' + accessToken
       },
       success: function(response) {
          $('.head').show(); // display table top row
           console.log(response);
           for (var i = 0; i < response.tracks.length; i++) {
             var data = {
               album: response.tracks[i].album.name,
               song: response.tracks[i].name,
               artist: response.tracks[i].artists[0].name,
               albumSrc: response.tracks[i].album.images[1].url
             };
             var result = template(data); // handlebars do it thing
             $('#results').append(result);
           }
       }
    });
    ajax = true;
  }
  });
}
