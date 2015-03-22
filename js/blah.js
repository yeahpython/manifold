$( document ).ready(function() {
    var hash = window.location.hash.substring(1); // hash part of url withou the first letter (#)
    $("section").hide();
    if (hash == "") {
      $("#home").show();
    }else {
      $("#"+hash).show();
    }

  $(window).on("hashchange", function(){
    var hash = window.location.hash.substring(1); // hash part of url withou the first letter (#)
    $("section").hide();
    $("#"+hash).show();
    });
});