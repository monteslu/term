function attach(term, connection, bidirectional, buffered) {
  console.log('termm', term, connection, bidirectional, buffered);
  var addonTerminal = term;
  bidirectional = (typeof bidirectional === 'undefined') ? true : bidirectional;
  addonTerminal.__connection = connection;
  addonTerminal.__flushBuffer = function () {
      addonTerminal.write(addonTerminal.__attachconnectionBuffer);
      addonTerminal.__attachconnectionBuffer = null;
  };
  addonTerminal.__pushToBuffer = function (data) {
      if (addonTerminal.__attachconnectionBuffer) {
          addonTerminal.__attachconnectionBuffer += data;
      }
      else {
          addonTerminal.__attachconnectionBuffer = data;
          setTimeout(addonTerminal.__flushBuffer, 10);
      }
  };
  const myTextDecoder = new TextDecoder();
  addonTerminal.__getMessage = function (data) {
    console.log('get data', data);
    displayData(myTextDecoder.decode(data));
  };
  function displayData(str, data) {
      if (buffered) {
          addonTerminal.__pushToBuffer(str || data);
      }
      else {
          addonTerminal.write(str || data);
      }
  }
  addonTerminal.__sendData = function (data) {
    console.log('send data', data, connection);
      if (!connection.isOpen) {
          return;
      }
      const buf = stringToArray(data);
      console.log('sending', buf);
      connection.write(buf , function() {});
  };
  addonTerminal._core.register(addconnectionListener(connection, 'data', addonTerminal.__getMessage));
  if (bidirectional) {
      addonTerminal.__dataListener = addonTerminal.onData(addonTerminal.__sendData);
      addonTerminal._core.register(addonTerminal.__dataListener);
  }
  addonTerminal._core.register(addconnectionListener(connection, 'close', function () { return detach(addonTerminal, connection); }));
  // addonTerminal._core.register(addconnectionListener(connection, 'error', function () { return detach(addonTerminal, connection); }));
}


function stringToArray(bufferString) {
	let uint8Array = new TextEncoder("utf-8").encode(bufferString);
	return uint8Array;
}

function addconnectionListener(connection, type, handler) {
  connection.on(type, handler);
  return {
      dispose: function () {
          if (!handler) {
              return;
          }
          connection.removeEventListener(type, handler);
          handler = null;
      }
  };
}

function apply(terminalConstructor) {
  terminalConstructor.prototype.attach = function (connection, bidirectional, buffered) {
      attach(this, connection, bidirectional, buffered);
  };
  terminalConstructor.prototype.detach = function (connection) {
      detach(this, connection);
  };
}
  
function detach(term, connection) {
  var addonTerminal = term;
  addonTerminal.__dataListener.dispose();
  addonTerminal.__dataListener = undefined;
  connection = (typeof connection === 'undefined') ? addonTerminal.__connection : connection;
  if (connection) {
      connection.removeEventListener('message', addonTerminal.__getMessage);
  }
  delete addonTerminal.__connection;
}

export default {attach, apply, detach};