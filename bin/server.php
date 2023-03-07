<?php

use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory;
use React\Socket\Server;
use React\Socket\SecureServer;
use MyApp\Chat;

require_once dirname(__DIR__) . '/vendor/autoload.php';
require_once dirname(__DIR__) . '/core/classes/chat.php';


$loop = Factory::create();

$server = new Server('0.0.0.0:2083', $loop);

$dnsConnector = new \React\Socket\Connector($loop);

$secureServer = new SecureServer($server, $loop, [
    'local_cert'  => __DIR__  . '/ssl/cert.pem',
    'local_pk' => __DIR__  . '/ssl/key.pem',
    'verify_peer' => false,
]);

$httpServer = new HttpServer(
    new WsServer(
        new Chat()
    )
);

$ioServer = new IoServer($httpServer, $secureServer, $loop);
echo "\nServer is running on port 2083 \n";
$ioServer->run();