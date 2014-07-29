'use strict';

/**
	Serviço criado para gerenciar conexão WebSocket
	@author Cristofer Domingues

	Ex.:
	var opts = {
		url:'wss://echo.websocket.org'
		reconnectOnClose:true
	}
	$websocket.openConnection(opts).then(function(){
		console.log('Está Conectado!');
	},function(err){
		console.error('Não conectou')
	});

	//sendMessage(message,waitResponse)
	$websocket.sendMessage('Hello WebSocket',true).then(function(response){
		console.log(response);
	});

*/
var webSocketApp = angular.module('websocket.service', []);

webSocketApp.constant('STATUS_CONEXAO', {
  CONECTADO: 'CONECTADO',
  DESCONECTADO: 'DESCONECTADO',
  RECONECTANDO: 'RECONECTANDO'
});

webSocketApp.factory('$websocket', function($rootScope, $q, STATUS_CONEXAO, $timeout) {
  var _ws;
  var _connStatus;
  var _url;

  var _openConnection = function(opts) {

    var deferred = $q.defer();

    _url = opts.url;

    _ws = new WebSocket(opts.url);

    if (opts.binaryType) {
      _ws.binaryType = opts.binaryType;
    }

    _ws.onopen = function(evt) {
      _onOpen(evt);

    };

    _ws.onclose = function(evt) {
      _onClose(evt);
    };

    _ws.onmessage = function(evt) {
      _onMessage(evt);
    };

    _ws.onerror = function(evt) {
      _onError(evt);
      deferred.reject({
        message: 'Erro ao tentar conectar no WebSocket com a url ' + _url
      });
    };

    $rootScope.$on('WS_CLOSED', function() {
      if (opts.reconnectOnClose && opts.reconnectOnClose === true) {
        $timeout(function() {
          _openConnection({
            url: _url,
            reconnectOnClose: true
          });
        }, 1000);
      }
    });

    $rootScope.$on('WS_OPENNED', function() {
      deferred.resolve();
    });



    return deferred.promise;

  };

  var _closeConnection = function() {
    var deferred = $q.defer();
    if (_ws) {
      _ws.close();
      deferred.resolve();
    } else {
      deferred.reject({
        message: 'A conexão com o WebSocket ainda não foi estabelecida'
      });
    }

    return deferred.promise;
  };

  var _sendMessage = function(message, waitResponse) {
    var deferred = $q.defer();

    if (_ws) {

      _ws.send(message);

      if (waitResponse && waitResponse === true) {
        $rootScope.$on('WS_MESSAGE', function(evt, response) {
          deferred.resolve(response.data);
        });
      } else {
        deferred.resolve();
      }

      $rootScope.$on('WS_ERROR', function(ev, error) {
        deferred.reject({
          message: 'Ocorreu um erro ao enviar a mensagem: ' + error.data
        });
      });

    } else {
      deferred.reject({
        message: 'A conexão com o WebSocket ainda não foi estabelecida'
      });
    }

    return deferred.promise;
  };

  var _onOpen = function() {

    console.log('WS Conectado!');

    _connStatus = STATUS_CONEXAO.CONECTADO;

    $rootScope.$broadcast('WS_OPENNED');
  };

  var _onMessage = function(evt) {
    console.log('WS Message: ' + evt.data);
    $rootScope.$broadcast('WS_MESSAGE', evt);
  };

  var _onError = function(evt) {

    console.error('WS Error: ' + evt.data);
    console.error(evt);

    _connStatus = STATUS_CONEXAO.DESCONECTADO;

    $rootScope.$broadcast('WS_ERROR', evt);
  };

  var _onClose = function() {

    console.log('WS Fechado');

    _connStatus = STATUS_CONEXAO.DESCONECTADO;

    $rootScope.$broadcast('WS_CLOSED');
  };

  return {
    openConnection: _openConnection,
    sendMessage: _sendMessage,
    closeConnection: _closeConnection
  };

});
