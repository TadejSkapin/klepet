function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jePng = sporocilo.indexOf('.png') > -1;
  var jeJpg = sporocilo.indexOf('.jpg') > -1;
  var jeGif = sporocilo.indexOf('.gif') > -1;
  
   if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else 
  return $('<div style="font-weight: bold"></div>').html(sporocilo);
  //itak ne dela (404, 403(?!))
  if(jeGif) {
   sporocilo = sporocilo.replace(new RegExp("<", "gi"), "&lt;").replace(new RegExp(">", "gi"), "&gt;").replace(new RegExp("&lt;img", "gi"), "<img")
   .replace(new RegExp('.gif\" hspace="20" width="200"&gt/>;', 'gi'), '.gif hspace="20" width="200"/>');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else if(jeJpg) {
   sporocilo = sporocilo.replace(new RegExp("<", "gi"), "&lt;").replace(new RegExp(">", "gi"), "&gt;").replace(new RegExp("&lt;img", "gi"), "<img")
   .replace(new RegExp('.jpg\" hspace="20" width="200"/&gt;', 'gi'), '.jpg hspace="20" width="200"/>');
   console.log(sporocilo);
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else if(jePng) {
   sporocilo = sporocilo.replace(new RegExp("<", "gi"), "&lt;").replace(new RegExp(">", "gi"), "&gt;").replace(new RegExp("&lt;img", "gi"), "<img")
   .replace(new RegExp('.png\" hspace="20" width="200"&gt;', 'gi'), '.png hspace="20" width="200"/>');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSliko(sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
/*    $("#novElement").each(function(){
          if(!$(this).find('img').length){
    }); */
        $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
        $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
      }
      $('#seznam-uporabnikov div').click(function() {
        $('#poslji-sporocilo').val('/zasebno "' + $(this).text() +'" ');
        $('#poslji-sporocilo').focus();
      });
    });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});
function dodajSliko(vhodnoBesedilo) {

    vhodnoBesedilo = vhodnoBesedilo.replace(new RegExp('(https?:\/\.+?\.(?:png|jpg|gif))', 'gi'), '$1 <img src="$1" hspace="20" width="200"/>');
    return vhodnoBesedilo;

}

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}