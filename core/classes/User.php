<?php
    namespace MyApp;
    use PDO;
    class User{
        public $db, $usr_id, $usr_session_id;

        public function __construct(){
            $db = new \MyApp\DB;
            $this->db = $db->connect();
            $this->usr_id = $this->ID();
            $this->usr_session_id = $this->getSessionID();
        }

        public function ID(){
            if($this->isLoggedIn()){
                return $_SESSION['usr_id'];
            }
        }

        public function getSessionID(){
            return session_id();
        }

        public function emailExist($email){
            $stmp = $this->db->prepare("SELECT * FROM `usr_users` WHERE `usr_email` = :email");
            $stmp->bindParam(":email", $email, PDO::PARAM_STR);
            $stmp->execute();
            $user = $stmp->fetch(PDO::FETCH_OBJ);

            if(!empty($user)){
                return $user;
            }else{
                return false;
            }
        }

        public function hash($password){
            return password_hash($password, PASSWORD_DEFAULT);
        }

        public function redirect($location){
            header("Location: ".BASE_URL.$location);
        }

        public function userData($usr_id = ''){
            $usr_id = ((!empty($usr_id)) ? $usr_id : $this->usr_id);
            $stmp = $this->db->prepare("SELECT * FROM `usr_users` WHERE `usr_id` = :usr_id");
            $stmp->bindParam(":usr_id", $usr_id, PDO::PARAM_STR);
            $stmp->execute();
            return $stmp->fetch(PDO::FETCH_OBJ);
  
        }

        public function isLoggedIn(){
            return ((isset($_SESSION['usr_id'])) ? true : false);
        }

        public function logout(){
            $_SESSION = array();
            session_destroy();
            session_regenerate_id();
            $this->redirect('index.php');
        }

        public function getUsers(){
            $stmt = $this->db->prepare("SELECT * FROM `usr_users` WHERE `usr_id` != :usr_id");
            $stmt->bindParam(":usr_id", $this->usr_id, PDO::PARAM_INT);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_OBJ);

            foreach($users as $user){
                echo '<li class="select-none transition hover:bg-green-50 p-2 cursor-pointer select-none">
                        <a href="'.BASE_URL.$user->usr_username.'">
                            <div class="user-box flex items-center flex-wrap">
                            <div class="flex-shrink-0 user-img w-12 h-12 rounded-full border overflow-hidden">
                                <img class="w-full h-full" src="'.BASE_URL.$user->usr_profile_image.'">
                            </div>
                            <div class="user-name ml-2">
                                <div><span class="flex font-medium">'.$user->usr_name.'</span></div>
                                <div></div>
                            </div>
                            </div>
                        </a>
                    </li>
                ';
            }
        }        

        public function getUserByUsername($username){
            $stmp = $this->db->prepare("SELECT * FROM `usr_users` WHERE `usr_username` = :username");
            $stmp->bindParam(":username", $username, PDO::PARAM_STR);
            $stmp->execute();
            return $stmp->fetch(PDO::FETCH_OBJ);
  
        }

        public function updateSession(){
            $stmt = $this->db->prepare("UPDATE `usr_users` SET `usr_session_id` = :sessionID WHERE `usr_id` = :usr_id");
            $stmt->bindParam(":sessionID", $this->usr_session_id, PDO::PARAM_STR);
            $stmt->bindParam(":usr_id", $this->usr_id, PDO::PARAM_INT);
            $stmt->execute();
        }

        public function getUserBySession($sessionID){
            $stmp = $this->db->prepare("SELECT * FROM `usr_users` WHERE `usr_session_id` = :sessionID");
            $stmp->bindParam(":sessionID", $sessionID, PDO::PARAM_STR);
            $stmp->execute();
            return $stmp->fetch(PDO::FETCH_OBJ);
        }

        public function updateConnection($connectionID, $usr_id){
            $stmt = $this->db->prepare("UPDATE `usr_users` SET `usr_connection_id` = :connectionID WHERE `usr_id` = :usr_id");
            $stmt->bindParam(":connectionID", $connectionID, PDO::PARAM_STR);
            $stmt->bindParam(":usr_id", $usr_id, PDO::PARAM_INT);
            $stmt->execute();
        }

    }