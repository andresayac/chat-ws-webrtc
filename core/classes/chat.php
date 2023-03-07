<?php
namespace MyApp;
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class Chat implements MessageComponentInterface {
    protected $clients;
    public $userObj, $data, $messageObj;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->userObj = new \MyApp\User;
        $this->messageObj = new \MyApp\Message;

    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection to send messages to later
        $queryString = $conn->httpRequest->getUri()->getQuery();
        parse_str($queryString, $query);

        if($data = $this->userObj->getUserBySession($query['token'])){
            $this->data = $data;
            $conn->data = $data;
            $this->clients->attach($conn);
            $this->userObj->updateConnection($conn->resourceId, $data->usr_id);
            echo "New connection! ({$data->usr_username})\n";
            }
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $numRecv = count($this->clients) - 1;
           // echo sprintf('Connection %d sending message "%s" to %d other connection%s' . "\n" , $from->resourceId, $msg, $numRecv, $numRecv == 1 ? '' : 's');
        
            $data = json_decode($msg, true);
            $sendTo = $this->userObj->userData($data['sendTo']);

            $send['sendTo'] = $sendTo->usr_id;
            $send['by'] = $from->data->usr_id;
            $send['profileImage'] = $from->data->usr_profile_image;
            $send['username'] = $from->data->usr_username;
            $send['type'] = $data['type'];
            $send['data'] = $data['data'];
            $send['ts'] = (int) $data['ts'];

            if($send['type'] === 'text'){
                $this->messageObj->create_message($send['type'] , $send['by'], $send['sendTo'], $send['data']);
            }

        foreach ($this->clients as $client) {
            if ($from !== $client) {
                // The sender is not the receiver, send to each client connected
                if($client->resourceId == $sendTo->usr_connection_id || $from == $client){
                    $client->send(json_encode($send));
                }
               
            }
        }
    }

    public function onClose(ConnectionInterface $conn) {
        // The connection is closed, remove it, as we can no longer send it messages
        $this->clients->detach($conn);

        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }
}