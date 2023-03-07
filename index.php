<?php

include 'core/init.php';

if ($userObj->isLoggedIn()) {
    $userObj->redirect('home.php');
}

if ($_SERVER['REQUEST_METHOD'] === "POST") {
    $email = trim(stripcslashes(htmlentities($_POST['email'])));
    $password = $_POST['password'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = "Invalid Email format";
    } else if (empty($password)) {
        $error = "Please enter your password";
    } else {
        if ($user = $userObj->emailExist($email)) {
            if (password_verify($password, $user->usr_password)) {
                //login user
                session_regenerate_id();
                $_SESSION['usr_id'] = $user->usr_id;
                
                //redirect user
                $userObj->redirect('home.php');
            } else {
                $error = "Incorrect email or password";
            }
        }
    }

    if (empty($error)) {
        //display error
        $error = "Please enter your email and password to login";
    }
}
?>
<html>

<head>
    <title>Live Video Chat Using PHP</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" type="text/css" href="assets/css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700&display=swap" rel="stylesheet">

</head>

<body>
    <!--WRAPPER-->
    <div class="flex items-center justify-center h-screen">
        <div class="w-full max-w-screen-md flex flex-col md:flex-row bg-dark rounded border shadow-lg">
            <div class="w-full md:w-2/5 px-8 py-12 border-r">
                <div class="h-full flex items-center justify-center">
                    <img class="w-3/4 md:w-full" src="assets/images/login-left-bg.png" alt="Login Image">
                </div>
            </div>
            <div class="w-full md:w-3/5 px-8 py-12">
                <div class="w-full max-w-md mx-auto">
                    <div class="text-center">
                        <h2 class="text-3xl font-bold mb-4">Welcome!</h2>
                        <p class="mb-6">Sign in to your account.</p>
                    </div>
                    <form method="post" class="w-full">
                        <div class="flex flex-col">
                            <div class="mb-4">
                                <input class="border border-gray-300 rounded-lg py-2 px-3 w-full" type="email" name="email" placeholder="Email" required>
                            </div>
                            <div class="mb-6">
                                <input class="border border-gray-300 rounded-lg py-2 px-3 w-full" type="password" name="password" placeholder="Password" required>
                            </div>
                            <div class="mb-6">
                                <?php
                                if (isset($error)) {
                                    echo '<p class="text-red-500 text-xs italic">' . $error . '</p>';
                                }
                                ?>
                            </div>
                            <div class="flex items-center justify-center">
                                <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full transition duration-200">
                                    Login
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</body>

</html>