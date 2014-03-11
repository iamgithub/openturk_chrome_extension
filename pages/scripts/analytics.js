var ROWS = [];

(function() {
  $.get('https://workersandbox.mturk.com/mturk/status', {}, function(data) {
    var rows = $(data).find('tr');
    console.log(rows);

    var data = [];
    var data2 = [];
    var data3 = [];
    var data4 = [];
    var data5 = [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];

      if (row.cells.length != 6)
        continue;
      if (row.className.match('grayHead')) {
        continue;
      }
      if (row.className.match('odd|even') == null) {
        continue;
      }

      var odd = row.className.match('odd');
      var approved = parseInt(row.cells[2].innerHTML);
      var rejected = parseInt(row.cells[3].innerHTML);
      var pending = parseInt(row.cells[4].innerHTML);
      var earnings = row.cells[5].childNodes[0].innerHTML;
      var dollars = parseFloat(earnings.slice(earnings.search('\\$') + 1));
      var date = row.cells[0].childNodes[1].href.substr(53);

      ROWS.push({
        element: row,
        earnings: dollars,
        pending: pending
      });

      data.unshift(pending);
      data2.unshift(rejected);
      data3.unshift(approved);
      data4.unshift(dollars);

      data5.unshift($.trim(row.cells[0].textContent.replace(/, 20../, "")));

    }
    console.log(data, data2, data3, data4, data5)
    console.log(ROWS);
  });
})();
