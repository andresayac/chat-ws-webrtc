<?php

namespace MyApp;

use PDO;

class Message
{
    public $db;

    public function __construct()
    {
        $db = new \MyApp\DB;
        $this->db = $db->connect();
    }

    public function create_message($msg_type, $msg_from, $msg_to, $msg_content)
    {
        $stmt = $this->db->prepare("INSERT INTO `msg_messages` (`msg_type`,`msg_from`, `msg_to`, `msg_content`, `msg_created`) VALUES (:msg_type, :msg_from, :msg_to, :msg_content, CURRENT_TIMESTAMP)");
        $stmt->bindParam(":msg_type", $msg_type, PDO::PARAM_STR);
        $stmt->bindParam(":msg_from", $msg_from, PDO::PARAM_INT);
        $stmt->bindParam(":msg_to", $msg_to, PDO::PARAM_INT);
        $stmt->bindParam(":msg_content", $msg_content, PDO::PARAM_STR);
        $stmt->execute();
    }

    public function getMessages($user)
    {
        $stmp = $this->db->prepare("SELECT msg_id as id, if(msg_from={$_SESSION['usr_id']},true,false) as me, msg_content as content, UNIX_TIMESTAMP(msg_created) as ts, user_from.usr_profile_image as avatar_url  FROM `msg_messages`  
        JOIN `usr_users` as user_from on  user_from.usr_id = msg_from
        JOIN `usr_users` as user_to on  user_to.usr_id = msg_to
        WHERE 1
        AND (`msg_to` = :msg_to or msg_to = :msg_from)
        AND (`msg_from` = :msg_from or `msg_from` = :msg_to )
        ORDER BY `msg_created` DESC LIMIT 50
        ");
        $stmp->bindParam(":msg_to", $user, PDO::PARAM_INT);
        $stmp->bindParam(":msg_from", $_SESSION['usr_id'], PDO::PARAM_INT);
        $stmp->execute();
        $messages = $stmp->fetchAll(PDO::FETCH_OBJ);

        $messages_user = [];
        foreach ($messages as $message) {
            $message->me = (bool) $message->me;
            $messages_user[] = $message;
        }
        return array_reverse($messages_user);
    }

    public function getChats()
    {
        $stmp = $this->db->prepare("SELECT IF(msg_from={$_SESSION['usr_id']}, msg_to, msg_from) AS users FROM msg_messages 
        WHERE 1
        AND (msg_to = :msg_to or msg_from = :msg_from)
        AND (msg_from = :msg_from OR msg_to= :msg_to)
        GROUP BY users");
        $stmp->bindParam(":msg_to", $_SESSION['usr_id'], PDO::PARAM_INT);
        $stmp->bindParam(":msg_from", $_SESSION['usr_id'], PDO::PARAM_INT);
        $stmp->execute();
        $messages = $stmp->fetchAll(PDO::FETCH_OBJ);

        $user_chat = [];

        foreach ($messages as $message) {
            $user = $this->getLastChat($message->users);
            $user_chat[] = $user;
        }

        usort($user_chat, function ($a, $b) {
            $a_date = $a->ts;
            $b_date = $b->ts;
            return $b_date - $a_date;
        });


        foreach ($user_chat as $user) {
            echo '<li class="select-none transition hover:bg-green-50 p-2 cursor-pointer select-none">
                    <a href="' . BASE_URL . $user->usr_username . '">
                        <div class="user-box flex items-center flex-wrap">
                            <div class="flex-shrink-0 user-img w-12 h-12 rounded-full border overflow-hidden">
                                <img class="w-full h-full" src="' . BASE_URL . $user->usr_profile_image . '">
                            </div>
                            <div class="user-name ml-2">
                                <div><span class="flex font-medium">' . $user->usr_name . '</span></div>
                                <div><span class="flex font-medium text-gray-500" id="chat-user-' . $user->usr_id . '">' . substr($user->msg_content, 0, 15) . '...</span></div>
                                <div></div>
                            </div>
                            <div class="ml-auto">
                            <p class="text-xs text-gray-500 ml-10 mr-10 text-right" id="chat-user-ts-' . $message->users . '">' . $this->epochToTimeChat($user->ts) . '</p>
                            </div>
                        </div>
                    </a>
                </li>
            ';
        }
    }

    private function epochToTimeChat($timestamp)
    {
        $date = new \DateTime();
        $date->setTimestamp($timestamp);
        return $date->format('g:i A');
    }

    public function getLastChat($user)
    {
        $stmp = $this->db->prepare("SELECT 
            msg_id as id,
            UNIX_TIMESTAMP(msg_created) as ts,
            msg_content,
            if(user_from.usr_id  = {$_SESSION['usr_id']}, user_to.usr_id, user_from.usr_id) as usr_id,
            if(user_from.usr_id  = {$_SESSION['usr_id']}, user_to.usr_name, user_from.usr_name) as usr_name,
            if(user_from.usr_id  = {$_SESSION['usr_id']}, user_to.usr_username, user_from.usr_username) as usr_username,
            if(user_from.usr_id  = {$_SESSION['usr_id']}, user_to.usr_profile_image , user_from.usr_profile_image) as usr_profile_image
        FROM msg_messages 
        JOIN `usr_users` as user_from on  user_from.usr_id = msg_from
        JOIN `usr_users` as user_to on  user_to.usr_id = msg_to
        WHERE 1
        AND msg_to =:msg_to or msg_from = :msg_to
        ORDER BY msg_created DESC
        LIMIT 1
        ");
        $stmp->bindParam(":msg_to", $user, PDO::PARAM_INT);
        $stmp->execute();
        return $stmp->fetch(PDO::FETCH_OBJ);
    }
}
