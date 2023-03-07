<?php

namespace MyApp;

use PDO;

class DB
{
    function connect()
    {
        $db = new PDO("mysql:host=127.0.0.1; dbname=admin_vchat", "admin_vchat", "rEL77eNbMNyU2Zbx");
        return $db;
    }
}
