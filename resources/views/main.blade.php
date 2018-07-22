<!DOCTYPE html>
<html lang="en">
   <head>
      <!-- Required meta tags -->
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>VGOChest.com - Open vCases!!</title>
      <meta name="description" content="VGOChest.com - Win VGO skins by opening vCases!">
      <meta name="keywords" content="Gambling website, case opener, vgo case opener, vgo case opening, VGO gambling, gambling, win vgo skins, gambling skins, vgo skins, new vgo gambling website, new vgo website, new vgo, vgo.gg, vgo_gg, vgo">
      <!-- Fonts and icons -->
      <link rel="stylesheet prefetch" href="https://fonts.googleapis.com/css?family=Roboto">
      <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.0.6/css/all.css">
      <link rel="stylesheet" href="/static/css/pe-icon-7-stroke.css">
      <link rel="shortcut icon" href="/vendor/images/favicon.ico">
      <meta name="csrf_token" content="{{ csrf_token() }}">
      <meta name="websocket" content="wss://vgochest.com:2053">
      <meta name="keys" content="{{ $user['keys']|0 }}">
      <!-- App Core CSS -->
      <link rel="stylesheet" href="/static/css/toastr.css">
      <link rel="stylesheet" href="/static/css/bootstrap.css?v=1">
      <link rel="stylesheet" href="/static/css/animate.css">
      <link rel="stylesheet" href="/static/css/app.css?v=<?=time()?>">
   </head>
   <body>

    <div class="loader">
        <div class="leftEye"></div>
        <div class="rightEye"></div>
        <div class="mouth"></div>
    </div>

    <div id="app" class="hidden">
        <header class="navbar">
            <div class="logo">
                <div>
                    <div class="img">
                        <a href="/"><img src="https://www.vgochest.com/vendor/images/vgologo2.png"></a>
                    </div>
                </div>
            </div>
            <div class="bar">
                <div class="novbar">
                    <div>
                        <a id="go_to" data-go="cases" class="active">
                            <p>
                                <span>Home</span>
                            </p>
                        </a>
                        @if ($user != 0)
                        <a id="go_to" data-go="inventory">
                            <p>
                                <span>Open cases <span class="cases_left" v-html="user.inv_amount"></span></span>
                            </p>
                        </a>
                        @endif
                        <a id="go_to" data-go="contact">
                            <p>
                                <span>Contact</span>
                            </p>
                        </a>
                    </div>
                </div>
            </div>
            <div class="profile">
                <div>
                    @if ($user != 0)
                    <div class="sounds" style="margin-right: 20px; cursor: pointer;"><i class="fas fa-volume-up"></i></div>
                    <div class="keys">
                        <div class="keyss">
                            <i class="fas fa-key"></i>
                            <span v-html="user.keys">{{ $user['keys']|0 }}</span>
                        </div>
                        <div class="more_keys">
                            <a href="https://opskins.com/?loc=shop_search&amp;app=1912_1&amp;search_item=skeleton+key&amp;sort=lh" target="_blank">Buy more v-keys</a>
                        </div>
                    </div>
                    <div class="avatar">
                        <div class="prof">
                            <div class="img">
                                <img style="width: 30px; margin-top: -5px;" src="{{ $user['avatar'] }}">
                            </div>
                            <p style="margin-top: 10px; margin-left: 5px; font-weight: bold;">{{ $user['name'] }}</p>
                        </div>
                        <div class="caret"></div>
                    </div>
                    @else
                    <a href="/auth/steam"><img style="width: 150px;" src="https://vgochest.com//vendor/images/steam.png"></a>
                    @endif
                </div>
            </div>
        </header>


      
      <div class="content">
         <div class="live-drop">
            <h2>Live drops:</h2>
            <div class="drops animated bounceInLeft"></div>
         </div>
      </div>
      <section class="main_section">
         <section class="big_section">
            <h1 class="title_section">
                CASES
            </h1>
            <section class="section">
               <div class="cases animated bounceInDown" id="cases"></div>
               <div id="caseul1" class="hidden animated bounceInDown"></div>
               <div id="caseul2" class="hidden animated bounceInDown"></div>
               <div id="caseul3" class="hidden animated bounceInDown"></div>
               <div id="inventory" class="hidden">
                    <div v-if="user.cases_2.length == 0 && user.cases_1.length == 0 && user.cases_3.length == 0 && user.tcases_2.length == 0 && user.tcases_1.length == 0 && user.tcases_3.length == 0 && user.can_click_unbox == true"><h5 style="margin: auto; color: black;">Your inventory seems to be empty. Refill your website inventory by purchasing cases from <a style="color:red;" id="go_to" data-go="cases">here</a></h5></div>

                    <div class="Case-rollers"></div>

                    <div v-if="user.cases_1.length > 0" class="case">
                        <header class="name"><h3><span style="color: red" v-html="user.cases_1.length + 'x'"></span>&nbsp;Weapon Case 1</h3></header>
                        <div class="contentul">
                            <div class="image"><img :src="user.cases_1[0].image" style="width: 70%;"></div>
                            <div class="prices"><h4>Prices between:</h4><p><i class="fas fa-dollar-sign"></i>0.03 - <i class="fas fa-dollar-sign"></i>714.36</p></div>
                            <div class="button" id="openRealCase" data-case="1"><a class="butonul"><span><i class="fas fa-key"></i>&nbsp;Open case</span></a></div>
                        </div>
                    </div>

                    <div v-if="user.cases_2.length > 0" class="case">
                        <header class="name"><h3><span style="color: red" v-html="user.cases_2.length + 'x'"></span>&nbsp;Weapon Case 2</h3></header>
                        <div class="contentul">
                            <div class="image"><img :src="user.cases_2[0].image" style="width: 70%;"></div>
                            <div class="prices"><h4>Prices between:</h4><p><i class="fas fa-dollar-sign"></i>0.02 - <i class="fas fa-dollar-sign"></i>10,092.29</p></div>
                            <div class="button" id="openRealCase" data-case="2"><a class="butonul"><span><i class="fas fa-key"></i>&nbsp;Open case</span></a></div>
                        </div>
                    </div>


                    <div v-if="user.cases_3.length > 0" class="case">
                        <header class="name"><h3><span style="color: red" v-html="user.cases_3.length + 'x'"></span>&nbsp;Weapon Case 3</h3></header>
                        <div class="contentul">
                            <div class="image"><img :src="user.cases_3[0].image" style="width: 70%;"></div>
                            <div class="prices"><h4>Prices between:</h4><p><i class="fas fa-dollar-sign"></i>0.03 - <i class="fas fa-dollar-sign"></i>20,038.92</p></div>
                            <div class="button" id="openRealCase" data-case="3"><a class="butonul"><span><i class="fas fa-key"></i>&nbsp;Open case</span></a></div>
                        </div>
                    </div>

                    <div v-if="user.tcases_1.length > 0" class="case">
                        <header class="name"><h3><span style="color: red" v-html="user.tcases_1.length + 'x'"></span>&nbsp;Weapon TestCase 1</h3></header>
                        <div class="contentul">
                            <div class="image"><img :src="user.tcases_1[0].image" style="width: 70%;"></div>
                            <div class="prices"><h4>TEST</h4></div>
                            <div class="button" id="openTestCase" data-case="1"><a class="butonul"><span><i class="fas fa-key"></i>&nbsp;Open case</span></a></div>
                        </div>
                    </div>

                    <div v-if="user.tcases_2.length > 0" class="case">
                        <header class="name"><h3><span style="color: red" v-html="user.tcases_2.length + 'x'"></span>&nbsp;Weapon TestCase 2</h3></header>
                        <div class="contentul">
                            <div class="image"><img :src="user.tcases_2[0].image" style="width: 70%;"></div>
                            <div class="prices"><h4>TEST</h4></div>
                            <div class="button" id="openTestCase" data-case="2"><a class="butonul"><span><i class="fas fa-key"></i>&nbsp;Open case</span></a></div>
                        </div>
                    </div>


                    <div v-if="user.tcases_3.length > 0" class="case">
                        <header class="name"><h3><span style="color: red" v-html="user.tcases_3.length + 'x'"></span>&nbsp;Weapon TestCase 3</h3></header>
                        <div class="contentul">
                            <div class="image"><img :src="user.tcases_3[0].image" style="width: 70%;"></div>
                            <div class="prices"><h4>TEST</h4></div>
                            <div class="button" id="openTestCase" data-case="3"><a class="butonul"><span><i class="fas fa-key"></i>&nbsp;Open case</span></a></div>
                        </div>
                    </div>
               </div>
               <div id="contact" class="hidden">
                    <h4>Twitter: <a href="https://twitter.com/Marrrio244" target="_blank">@Marrrio244</a></h4>
               </div>
            </section>
         </section>
      </section>
      <footer class="footerul">
         <div class="footer">
            <div class="info">
               <div class="top">
                  <div>
                     <div class="logo">
                        <img src="https://www.vgochest.com/vendor/images/vgologo.png">
                     </div>
                  </div>
                  <p>
                     Open VGO cases and have fun!
                  </p>
               </div>
               <div class="bottom">
                  <div class="left">
                     <ul>
                        <li>
                           <a href="https://vgo.gg">VGO.gg</a>
                        </li>
                        <li>
                           <a href="/">VGOChest</a>
                        </li>
                     </ul>
                     <ul>
                        <li>
                           <a id="go_to" data-go="cases">Home</a>
                        </li>
                        <li>
                           <a  id="go_to" data-go="contact">Contact</a>
                        </li>
                     </ul>
                  </div>
                  <div class="right">
                     <h3>Statistics for today:</h3>
                     <div class="down">
                        <p>Cases opened: <span v-html="website.cases_opened"></span></p>
                        <p>Worth amount opened: <span v-html="'$' + website.amount_won"></span></p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <footer class="footer2">
            <div class="text">
               <p>2018 © VGOChest.com</p>
            </div>
         </footer>
      </footer>

        <div class="modal" tabindex="-1" id="winner_modal" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" style="color: black; font-weight: bold;">Your winning!</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center; display: block; color: black; font-weight: bold;">
                    <h2>Congratulations!</h2>
                    <img style="width: 180px;" :src="user.winnings.image"><br>
                    <span v-html="user.winnings.name"></span><br>
                    <span v-html="user.winnings.price"></span>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
                </div>
            </div>
        </div>

        <div class="modal" tabindex="-1" id="tradeModal" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" style="color: black; font-weight: bold;">Your trade #<span class="tradeid"></span></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center; display: block; color: black; font-weight: bold;">
                    Trade #<span class="tradeid"></span> is pending!<br>
                    <span class="tradeurl"></span>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
                </div>
            </div>
        </div>

    </div>
   </body>
</html>

<!-- Optional JavaScript -->
<!-- jQuery first, then Popper.js, then Bootstrap JS -->
<script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
<!-- App Core JS -->
<script src="static/js/jquery.js"></script>
<script src="static/js/jquery.kf.js"></script>
<script src="static/js/socket.io.js"></script>
<script src="static/js/popper.js"></script>
<script src="static/js/bootstrap.js"></script>
<script src="static/js/vue.js"></script>
<script src="static/js/toastr.js"></script>
<script src="static/js/app.js?v=<?=time()?>"></script>