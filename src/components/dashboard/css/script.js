$.getJSON('integrations.json', function(data) {
  for (var i = 0; i < 300; i++) {
    data.push(data[Math.floor(Math.random() * 4)]);
  }

  header = [
    '<tr>',
    '<th rowspan="3">Name</th>',
    '<th colspan="3" rowspan="2">API</th>',
    '<th colspan="4">Reading access</th>',
    '<th colspan="3" rowspan="2">Writing access</th>',
    '<th rowspan="3">Note</th>',
    '</tr>',
    '<tr>',
    '<th>Current</th>',
    '<th colspan="3">History</th>',
    '</tr>',
    '<tr>',
    '<th>Exists</th>',
    '<th>Readonly</th>',
    '<th>Rate</th>',
    '<th>Balances</th>',
    '<th>Trade</th>',
    '<th>Withdraw</th>',
    '<th>Deposit</th>',
    '<th>Trade</th>',
    '<th>Withdraw</th>',
    '<th>Deposit</th>',
    '</tr>'
  ].join('');

  $('#content').html([
    '<table>',
    data.map(function (exchange, i) {
      head = i % 25 === 0 ? header : '';
      return head + '<tr class="status-' + exchange.status + '">' + [
        '<td>' + exchange.label + '</td>',
        '<td class="trl-' + exchange.trl.api + '"></td>',
        '<td class="trl-' + exchange.trl.readonly + '"></td>',
        '<td class="trl-' + exchange.trl.rates + '"></td>',
        '<td class="trl-' + exchange.trl.current_balance + '"></td>',
        '<td class="trl-' + exchange.trl.trade_history + '"></td>',
        '<td class="trl-' + exchange.trl.withdraw_history + '"></td>',
        '<td class="trl-' + exchange.trl.deposit_history + '"></td>',
        '<td class="trl-' + exchange.trl.initiate_trade + '"></td>',
        '<td class="trl-' + exchange.trl.initiate_withdraw + '"></td>',
        '<td class="trl-' + exchange.trl.initiate_deposit + '"></td>',
        '<td>' + exchange.note + '</td>'
      ].join('') + '</tr>';
    }).join(''),
    '</table>'
  ].join(''));
});
