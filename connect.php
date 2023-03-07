<?php
// echo $_GET['username'];
include 'core/init.php';
if (!$userObj->isLoggedIn()) {
    $userObj->redirect('index.php');
}
$userObj->updateSession();

if (isset($_GET['username']) && !empty($_GET['username'])) {
    $profileData = $userObj->getUserByUsername($_GET['username']);
    $user = $userObj->UserData();
    $messages = $messageObjt->getMessages($profileData->usr_id);

    if (!$profileData) {
        $userObj->redirect('home.php');
    } else if ($profileData->usr_username === $user->usr_username) {
        $userObj->redirect('home.php');
    }
} else {
    $userObj->redirect('home.php');
}

?>

<!DOCTYPE html>
<html>

<head>
    <title>Chat PHP</title>
    <link rel="apple-touch-icon" sizes="57x57" href="assets/images/apple-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="assets/images/apple-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="assets/images/apple-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="assets/images/apple-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="assets/images/apple-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="assets/images/apple-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="assets/images/apple-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="assets/images/apple-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="assets/images/apple-icon-180x180.png">
    <link rel="icon" type="image/png" sizes="192x192" href="assets/images/android-icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="assets/images/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/images/favicon-16x16.png">
    <link rel="manifest" href="assets/images/manifest.json">
    <meta name="msapplication-TileColor" content="#00a884">
    <meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
    <meta name="theme-color" content="#00a884">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- Tailwind -->
    <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
    <!-- Font-awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" integrity="sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <!-- CSS -->
    <link rel="stylesheet" type="text/css" href="<?php echo BASE_URL; ?>assets/css/style.css?v=<?= date("YmdHis") ?>"">
    <!-- Fonts -->
    <link rel=" preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700&display=swap" rel="stylesheet">
    <!-- Jquery -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.3/jquery.min.js" integrity="sha512-STof4xm1wgkfm7heWqFJVn58Hm3EtS31XFaagaa8VMReCXAkQnJZ+jEy8PCC/iT18dFy95WcExNHFTqLyp72eQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <Script type="text/javascript">
        const conn = new WebSocket('<?= WS_HOST ?>/?token=<?= $userObj->usr_session_id ?>')
    </Script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/simplebar@latest/dist/simplebar.css" />
    <script src="https://cdn.jsdelivr.net/npm/simplebar@latest/dist/simplebar.min.js"></script>
    <!-- Jquery timer -->
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/timer.jquery/0.7.0/timer.jquery.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js"></script>

</head>

<body>
    <!-- AlertPopup -->
    <div id="alertBox" class="hidden z-10 transition absolute w-full h-full flex items-center justify-center">
        <div class="pop-up flex justify-between w-96 bg-white rounded overflow-hidden">
            <div class="pl-6 border-green-600 px-2 py-2 flex items-center">
                <div class="w-16 h-16 mx-1 rounded-full border overflow-hidden">
                    <img id="alertImage" class="w-full h-auto" src="">
                </div>
                <div class="flex flex-col">
                    <div id="alertName" class="mx-2 font-500">
                    </div>
                    <div class="animate-pulse mx-2 text-xs font-200 relative flex">
                        <span id="alertMessage" class="flex"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- CallPopup -->
    <div id="callBox" class="hidden z-10 transition absolute w-full h-full flex items-center justify-center">
        <div class="pop-up flex justify-between w-96 bg-white rounded overflow-hidden">
            <div class="pl-6 border-green-600 px-2 py-2 flex items-center">
                <div class="w-16 h-16 mx-1 rounded-full border overflow-hidden">
                    <img id="profileImage" class="w-full h-auto" src="">
                </div>
                <div class="flex flex-col">

                    <div id="username" class="mx-2 font-500">
                        username
                    </div>
                    <div class="animate-pulse mx-2 text-xs font-200 relative flex">
                        <span class="flex">Video calling</span>
                        <span class="ml-2 text-lg text-green-600 top-0 flex">
                            <i class=" fas fa-video"></i>
                        </span>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-center mx-4">
                <ul class="flex pr-2">
                    <li>
                        <button id="declineBtn" class="hover:text-red-700 transition text-red-600 px-4 py-1 text-xl "><i class="fas fa-times"></i></button>
                    </li>
                    <li>
                        <button id="answerBtn" class="hover:text-green-700 transition text-green-600 px-4 py-1 text-xl "><i class="fas fa-phone"></i></button>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    <!--WRAPPER-->
    <div class="wrapper h-screen items-center justify-center flex">
        <div class="flex bg-white lg:w-4/5 md:w-screen reponsive-chat w-screen w-auto">
            <!--NEWCHAT_SIDE-->
            <div id="new-chat-side" class="flex-auto lg:w-2/5 md:w-5/5 h-full hidden">
                <div class="h-full overflow-hidden">
                    <div class="flex justify-between items-center bg-green-600">
                        <div class="mx-2 flex items-center justify-center h-6 my-4 mx-2">
                            <button id="toggleBtnReturnChat" class="p-2 mr-2 active:text-gray-50 hover:text-gray-50 focus:text-gray-50">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <div class="flex items-center overflow-hidden cursor-pointer  ">
                                <img class="w-8 h-8 rounded-full mr-2" src="<?php echo BASE_URL . $user->usr_profile_image; ?>">
                            </div>
                            <div>
                                <span class="font-medium select-none text-white"><?php echo $user->usr_name; ?></span>
                            </div>
                        </div>
                        <div class="flex items-center mx-4">
                        </div>
                    </div>
                    <div class="px-6 py-2 select-none border-b">
                        <div class="relative w-full">
                            <input class="p-2 pl-8 w-full rounded border" type="text" name="usersearch" placeholder="Search chat">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-2">
                                <i class="fas fa-search"></i>
                            </div>
                        </div>
                    </div>
                    <div class="select-none overflow-hidden overflow-y-auto h-3/4">
                        <ul class="select-none">
                            <!-- CHATS-LIST -->
                            <?php $userObj->getUsers(); ?>
                        </ul>
                    </div>
                </div>
                <div class="border-b-4 border-green-600"></div>
            </div>
            <!--NEWCHAT_SIDE-->
            <!--LEFT_SIDE-->
            <div id="left-side" class="flex-auto lg:w-2/5 md:w-5/5 border-r hidden md:block h-full">
                <div class="flex justify-between  justify-between border-b">
                    <div class="mx-2 flex items-center justify-center h-6 my-4  mx-2">
                        <div class="flex items-center overflow-hidden cursor-pointer  ">
                            <img class="w-8 h-8 rounded-full mr-2" src="<?php echo BASE_URL . $user->usr_profile_image; ?>">
                        </div>
                        <div>
                            <span class="font-medium select-none"><?php echo $user->usr_name; ?></span>
                        </div>
                    </div>
                    <div class="flex items-center mx-4">
                        <span class="select-none transition mx-3 text-green-400 cursor-pointer"><i class="fas fa-circle"></i></span>
                        <span class="select-none transition hover:text-gray-500 mx-3 text-gray-600 cursor-pointer"><button id="toggleBtnNewChat"><i class="fas fa-comment-alt"></i></button></span>
                        <span class="menu-logout relative select-none transition hover:text-gray-500 mx-3 text-gray-600 cursor-pointer"><i class="fas fa-ellipsis-v"></i>
                            <div class="logout flex items-center justify-center rounded absolute right-0 top-2 bg-slate-300 border hover:bg-gray-200" style="width: 100px;height: 60px;">
                                <a href="logout.php" class="px-2 text-lg text-gray-600">
                                    Logout
                                </a>
                            </div>
                        </span>
                    </div>
                </div>
                <div class="px-6 py-2 select-none border-b">
                    <div class="relative w-full">
                        <input class="p-2 pl-8 w-full rounded border" type="text" name="usersearch" placeholder="Search chat">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-2">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                </div>
                <div class="select-none overflow-hidden overflow-y-auto h-3/4">
                    <ul class="select-none" id="chats-content">
                        <!-- CHATS-LIST -->
                        <?php $messageObjt->getChats(); ?>
                    </ul>
                </div>
            </div>
            <!--LEFT_SIDE_END-->
            <!--RIGHT_SIDE-->
            <div id="right-side" class="flex-auto rounded-xl md:w-screen lg:w-full" style="background: #efeae2;">
                <!-- PROFILE -->
                <!--PROFILE_SECTION-->
                <div id="profile" class="flex flex-col  h-full lg:w-full md:w-screen relative" style="background: url('assets/images/bg-chat.png') !important; background-repeat: repeat;">
                    <!-- HEADER -->
                    <div class="flex items-center justify-between py-2 px-4 border-b bg-white">
                        <div class="flex items-center lg:hidden md:block">
                            <button id="toggleBtn" class="p-2 mr-2 active:bg-blue-600 hover:bg-gray-200 focus:bg-gray-200">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                        </div>
                        <div class="flex items-center">
                            <img class="w-8 h-8 rounded-full mr-2" src="<?php echo BASE_URL . $profileData->usr_profile_image; ?>" alt="User Avatar">
                            <h1 class="text-lg font-bold"><?php echo $profileData->usr_name; ?></h1>
                        </div>
                        <div class="flex items-center">
                            <button id="callBtn" data-user="<?php echo $profileData->usr_id; ?>" class="p-2 mr-2 active:bg-blue-600 hover:bg-gray-200 focus:bg-gray-200">
                                <i class="fas fa-video"></i>
                            </button>
                            <button class="p-2 hover:bg-gray-200 focus:bg-gray-200">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                    <!-- MESSAGES -->
                    <div class="flex-1 overflow-y-auto overflow-hidden py-4 px-6  messages-content">
                    </div>
                    <!-- MESSAGE INPUT -->
                    <div id="emoji_mart" class="absolute bottom-14 left-0 mb-1 ml-0 hidden"></div>
                    <div class="border-t px-4 py-2 bg-white mb-0">
                        <div class="flex">
                            <button id="emoji-button" class="p-2 mr-2 hover:bg-gray-200 focus:bg-gray-200 rounded-full">
                                <i class="far fa-smile"></i>
                            </button>
                            <textarea id="message" class="resize-none h-10 max-h-36 overflow-hidden flex-1 border rounded-xl py-2 px-4 focus:outline-none" placeholder="Type a message..."></textarea>
                            <button id="button_send_message" class="p-2 ml-2 hover:bg-gray-200 focus:bg-gray-200 rounded-full">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="modal" class="fixed z-10 inset-0 overflow-y-auto">
                    <div class="flex items-center justify-center min-h-screen">
                        <div class="bg-white rounded-lg shadow-lg">
                            <div class="flex relative flex-col h-80">
                                <div class="order-2 h-full">
                                    <video id="remoteVideo" class="vid-1 h-80" autoplay playinline>
                                    </video>
                                    <video id="localVideo" class="vid-2 z-1 right-0 bottom-1 absolute" autoplay playinline muted>
                                    </video>
                                </div>
                                <div class="order-1 mt-4 absolute self-center">
                                    <div class="time rounded-xl text-white font-bold py-1 px-4"><span id="callTimer">0:00</span></div>
                                </div>
                                <div class="order-3 shadow-md flex justify-center btn-call-end items-end w-full h-full absolute ">
                                    <button id="hangupBtn" class="relative -top-8 shadow-lg drop-shadow bg-red-600  rounded-full hover:bg-red-700 text-white text-2xl px-4 py-4 text-2xl">
                                        <i class="fas fa-video-slash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <!--VIDEO_CALL_ENDS-->
        </div>
        <!--RIGHT_SIDE_END-->
    </div><!--INNER_ENDS-->
    </div><!--WRAPPER ENDS-->
    <!-- JavaScript Files -->
    <script>
        var messages = <?= json_encode($messages ?? []) ?>;
        var user_info = <?= json_encode($profileData ?? []) ?>;

        document.addEventListener("DOMContentLoaded", function(event) {
            init();
        });
    </script>
    <script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
    <script type="text/javascript" src="<?php echo BASE_URL; ?>assets/js/main.js?v=<?= date("YmdHis") ?>"></script>
</body>

</html>