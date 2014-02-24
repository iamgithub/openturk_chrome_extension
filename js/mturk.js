$(document).ready(function() {
  (function() {

    var form = '';
    var openturk_endpoint = 'http://alpha.openturk.com/endpoint/redirect';
    var autoaccept = true;

    function get_worker_id(callback) {
      $.get('https://workersandbox.mturk.com/mturk/dashboard', {}, function(data) {
        var spanText = $(data).filter("table").find("span:contains('Worker ID')").text();
        var workerIdPattern = /Worker ID: (.*)$/;
        var workerId = spanText.match(workerIdPattern)[1];
        callback(workerId);
      });
    }

    /* usage : get_url_params()['groupId'] */
    function get_url_params() {
      var params = [],
        hash;
      var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
      for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        params.push(hash[0]);
        params[hash[0]] = hash[1];
      }
      return params;
    }

    function set_group_id() {
      var group_id = get_url_params()['groupId'];
      if (typeof group_id !== "undefined") {
        chrome.runtime.sendMessage({
          group_id: group_id
        }, function(response) {});
      }
      return group_id;
    }
    set_group_id();

    function get_group_id(callback) {
      chrome.runtime.sendMessage({
        group_id_get: true
      }, function(response) {
        group_id = response.group_id;
        if (typeof group_id === "undefined") {
          group_id = "undefined";
        } else {}
        callback(group_id);
      });
    }

    function set_autoaccept(autoaccept) {
      if ($('input[name=autoAcceptEnabled]').length > 0) {
        chrome.runtime.sendMessage({
          autoaccept: autoaccept
        });
      }
    }

    function get_autoaccept(callback) {
      chrome.runtime.sendMessage({
        autoaccept_get: true
      }, function(response) {
        callback(response.autoaccept);
      });
    }

    function post_and_redirect(form) {
      request = $.ajax({
        url: form.attr('action'),
        type: "POST",
        data: form.serialize()
      }).done(function() {
        log(redirect, false, false);
      });
    }

    function redirect() {
      var jqxhr = $.getJSON(openturk_endpoint).done(function(data) {
        var redirect_url = data.url[0];
        window.top.location.href = redirect_url;
      });
    }

    function log(callback, hit_skipped, batch_skipped) {
      get_worker_id(function(worker_id) {
        if (typeof worker_id === "undefined") {
          worker_id = "undefined";
        }
        get_group_id(function(group_id) {
          data = {
            worker_id: worker_id,
            group_id: group_id,
            hit_skipped: hit_skipped,
            batch_skipped: batch_skipped
          };
          request = $.ajax({
            url: 'http://alpha.openturk.com/endpoint/log',
            type: "POST",
            data: data
          }).always(function() {
            callback();
          });
        });
      });
    }

    //Always check auto accept next HIT
    $('input[name=autoAcceptEnabled]').prop('checked', true);
    set_autoaccept(true);
    $('input[name=autoAcceptEnabled]').click(function(event) {
      set_autoaccept($('input[name=autoAcceptEnabled]').is(':checked'));
    });

    if ($('#mturk_form').length > 0) {
      $('#mturk_form').on("submit", function(e, hint) {
        if (typeof hint === "undefined") {
          e.preventDefault();
          get_autoaccept(function(autoaccept) {
            if (autoaccept) {
              log(function() {
                $('#mturk_form').trigger("submit", true);
              }, false, false);
            } else {
              $($(this).find('input[type=submit]')[0]).prop('disabled', true);
              post_and_redirect($(this));
            }
          });
        }
      });
    } else if ($('form[name=hitForm]').length > 0) {
      form = $('form[name=hitForm]')[0];
      $('input[name="/submit"]').on("click", function(e, hint) {
        if (typeof hint === "undefined") {
          e.preventDefault();
          get_autoaccept(function(autoaccept) {
            if (autoaccept) {
              log(function() {
                $('input[name="/submit"]').trigger("submit", true);
              }, false, false);
            } else {
              $(this).prop('disabled', true);
              post_and_redirect($(form));
            }
          });
        }
      });
    }

    //Add like and dislike buttons
    var caps = $('.capsule_field_title');
    for (var i = 0; i < caps.length; i++) {
      $(caps[i]).find("a:contains('Requester:')").after('<button id="dislike">dislike</button>').after('<button id="like">like</button>');
    }
    $('#dislike,#like').click(function(e) {
      e.preventDefault();
      alert('Not yet implemented');
    });
    //Add I'm feeling lucky button
    $('input[value="/searchbar"]').after('<br><button id="lucky">I\'m feeling lucky</button>');
    $('#lucky').click(function(e) {
      e.preventDefault();
      redirect();
    });

    //Add the star
    get_group_id(function(group_id) {
      var jqxhr = $.getJSON('http://alpha.openturk.com/endpoint/username').done(function(result) {
        if (typeof result.username !== "undefined") {
          $('td[colspan=11]')
            .after('<span id="star" style="font-size: 36px; color: orange; cursor: pointer">★</span>')
            .after('<div id="modal" style="display:none;position:absolute;background-color:#fff;width:350px;padding:15px;text-align:left;border:2px solid #333;opacity:1;-moz-border-radius:6px;-webkit-border-radius:6px;-moz-box-shadow: 0 0 50px #ccc;-webkit-box-shadow: 0 0 50px #ccc;"><h2>We will post the following message on mturkforum.com</h2><textarea style="width: 340px; height: 100px" disabled>OpenTurk user ' + (result.username) + ' recommended the following task: ' + group_id + '</textarea><br /><input id="modal_submit" type="submit" value="ok"><input id="modal_cancel" type="submit" value="cancel"></div>');
        } else {
          $('td[colspan=11]')
            .after('<span id="star" style="font-size: 36px; color: orange; cursor: pointer">★</span>')
            .after('<div id="modal" style="display:none;position:absolute;background-color:#fff;width:350px;padding:15px;text-align:left;border:2px solid #333;opacity:1;-moz-border-radius:6px;-webkit-border-radius:6px;-moz-box-shadow: 0 0 50px #ccc;-webkit-box-shadow: 0 0 50px #ccc;"><h2>Please log in on <a href="http://alpha.openturk.com/accounts/login/">OpenTurk.com</a></h2></div>');
        }
        $('#star').click(function(e) {
          var left = Math.max($(window).width() - $('#modal').outerWidth(), 0) / 2;
          $('#modal').css({
            left: left + $(window).scrollLeft()
          });
          $('#modal').toggle();
        });
        $('#modal_cancel').click(function(e) {
          e.preventDefault();
          $('#modal').toggle();
        });
        $('#modal_submit').click(function(e) {
          e.preventDefault();
          $('#modal').toggle();
          alert('Not implemented yet.');
        });
      });
    });

  }).call(this);
});
