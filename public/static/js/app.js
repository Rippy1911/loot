$(function() {
    var mp3_roll1 = new Audio('/static/sounds/spin1.wav');
    mp3_roll1.volume = 0.1;
    var mp3_roll2 = new Audio('/static/sounds/spin2.mp3');
    mp3_roll2.volume = 0.1;
    var mp3_done = new Audio('/static/sounds/done.wav');
    mp3_done.volume = 0.1;
    var app = new Vue({
        el: '#app',
        data: {
            website: {
                socket: null,
                websocket: $('meta[name="websocket"]').attr('content'),
                online: 0,
                chat: null,
                chat_messages: [],
                users_registered: 0,
                cases_opened: 0,
                amount_won: 0,
                top_unbox: {
                    name: null,
                    image: null,
                    value: null,
                    case: null,
                    opener: null
                }
            },
            user: {
                token: $('meta[name="csrf_token"]').attr('content'),
                keys: $('meta[name="keys"]').attr('content'),
                rank: null,
                inv_amount: 0,
                case: {
                    id: null,
                    cases: null,
                    img: null,
                    curr: 0,
                    items: [],
                    clicked: false
                },
                sounds: true,
                cases_1: [],
                cases_2: [],
                cases_3: [],
                tcases_1: [],
                tcases_2: [],
                tcases_3: [],
                can_click_unbox: true,
                winnings: {
                    image: null,
                    name: null,
                    price: null
                }
            }
        },
        methods: {
            connect: function() {
                if(app.website.socket == null) {
                    app.website.socket = io(app.website.websocket, {
                        secure: true,
                        reconnectionDelay: 8000
                    });

                    app.website.socket.on('connect', function() {
                        //toastr.info('Connected to websocket server!', 'Info');

                        app.website.socket.emit('login', app.user.token);

                        $('.inputter').val('');

                        app.socket_functions();
                        app.user_functions();

                        $('.loader').addClass('fadeOut');
                        setTimeout(function() {
                            $('.loader').addClass('hidden');
                            $('#app').removeClass('hidden');
                        }, 2100);
                    });

                    app.website.socket.on('connect_error', function() {
                        toastr.error('There is an error connecting to websocket!', 'Error');
                    });

                    app.website.socket.on('disconnect', function() {
                        //toastr.error('Connection to websocket has been lost!', 'Error');
                    });
                }
            },
            format_number: function(x) {
                var parts = x.toString().split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return parts.join(".");
            },
            socket_functions: function() {
                app.website.socket.on('user eroare', function(msg) {
                    toastr.error(msg, 'Error');
                });
                app.website.socket.on('user alerta', function(msg) {
                    toastr.success(msg, 'Alert');
                });
                app.website.socket.on('user modal', function(modal, type) {
                    if(type == 'open') $(modal).modal();
                    else {
                        $(modal + ' .close').click();
                        $('.modal-backdrop').remove();
                    }
                });
                app.website.socket.on('website users online', function(t) {
                    app.website.online = t;
                });
                app.website.socket.on('user refresh', function() {
                    document.location.href = document.location.origin; 
                });
                app.website.socket.on('user chat message add', function(msg) {
                    msg.now_added = 1;
                    app.website.chat_messages.push(msg);
                    setTimeout(function() { $('.chat-messages').scrollTop($('.chat-messages')[0].scrollHeight); }, 100);
                });
                app.website.socket.on('website chat history', function(msgs) {
                    app.website.chat_messages = [];

                    for(var z in msgs) {
                        app.website.chat_messages.push(msgs[z]);
                    }
                    setTimeout(function() { $('.chat-messages').scrollTop($('.chat-messages')[0].scrollHeight); }, 1000);
                });
                app.website.socket.on('website chat clear', function() {
                    app.website.chat_messages = [];
                });

                // profile
                app.website.socket.on('user info', function(user) {
                    app.user.rank = user.rank;
                    app.user.keys = user.keys;
                });

                app.website.socket.on('user keys', function(keys) {
                    app.user.keys = keys;
                });
                // 

                // website
                app.website.socket.on('website info', function(web) {
                    app.website.users_registered = web.users;
                    app.website.cases_opened = web.cases;
                    app.website.amount_won = web.preturile;
                });
                // 

                // user trade
                app.website.socket.on('user trade', function(id, tradeurl) {
                    app.user.case.tradeid = id;
                    app.user.case.tradeurl = tradeurl;

                    $('.tradeid').text(id);
                    $('.tradeurl').html(`
                        Click <a target="_blank" href="` + tradeurl + `">here</a> to open the trade!
                    `);

                    $('#tradeModal').modal('toggle');
                });

                app.website.socket.on('website live cases', function(ss) {
                    var $type;
                    switch(ss.type) {
                        case 'Factory New': $type = 'FN'; break;
                        case 'Minimal Wear': $type = 'MW'; break;
                        case 'Field-Tested': $type = 'FT'; break;
                        case 'Well-Worn': $type = 'WW'; break;
                        case 'Battle-Scarred': $type = 'BS'; break;
                    }
                    $('.drops').prepend(`
                        <div class="drop animated bounceInDown">
                            <div style="background-color: ` + ss.color + ` class="color"></div>
                            <header class="header"><span class="caseid">#` + ss.id + `</span><span class="name">` + ss.user + `</span></header>
                            <div class="footer">
                                <div class="image"><img src="` + ss.image + `"></div>
                                <div class="info"><div class="info1"><h2 class="weapon">` + ss.name.replace(/ *\([^)]*\) */g, "") + ` (` + $type + `)</h2></div><p class="info2">$` + app.format_number(ss.price) + `</p></div>
                            </div>
                        </div>
                    `);
                });

                app.website.socket.on('website live cases history', function(history) {
                    var $html = '';
                    for(var z in history) {
                        var ss = history[z];

                        var $type;
                        switch(ss.type) {
                            case 'Factory New': $type = 'FN'; break;
                            case 'Minimal Wear': $type = 'MW'; break;
                            case 'Field-Tested': $type = 'FT'; break;
                            case 'Well-Worn': $type = 'WW'; break;
                            case 'Battle-Scarred': $type = 'BS'; break;
                        }
                        $html += `
                        <div class="drop">
                            <div style="background-color: ` + ss.color + ` class="color"></div>
                            <header class="header"><span class="caseid">#` + ss.id + `</span><span class="name">` + ss.user + `</span></header>
                            <div class="footer">
                                <div class="image"><img src="` + ss.image + `"></div>
                                <div class="info"><div class="info1"><h2 class="weapon">` + ss.name.replace(/ *\([^)]*\) */g, "") + ` (` + $type + `)</h2></div><p class="info2">$` + app.format_number(ss.price) + `</p></div>
                            </div>
                        </div>
                    `;
                    }
                    $('.drops').html($html);
                });

                // cases
                app.website.socket.on('user to open cases', function(cases) {
                    app.user.case.cases = cases;
                    var $html_cases = "";
                    var $html_items = {};
                    $html_items['1'] = "";
                    $html_items['2'] = "";
                    $html_items['3'] = "";
                    var $html_casess = {};
                    $html_casess['1'] = "";
                    $html_casess['2'] = "";
                    $html_casess['3'] = "";

                    for(var i in cases) {
                        var itm = cases[i][0];

                        var itemele = itm.items;
                        itemele.sort(function (a,b) { return b.price*100-a.price*100 });

                        $html_casess[i] = `
                        <div class="sectionul">
                            <div class="sect">
                                <a class="go_back">
                                <div class="icon"><i class="fas fa-3x fa-arrow-left"></i></div>
                                    <span>View all cases</span>
                                </a>
                                <div class="case_image">
                                    <img src="` + itm.img + `"> 
                                </div>
                                <div class="info">
                                    <h4>Prices between:</h4>
                                    <p><i class="fas fa-dollar-sign"></i>` + app.format_number(itemele[itemele.length-1].price) + ` - <i class="fas fa-dollar-sign"></i>` + app.format_number(itemele[0].price) + `</p>
                                </div>
                            </div>
                            <div class="sect2">
                                <div class="open_cases">
                                    <form class="formul">
                                        <label>
                                        <input class="inputul" value="1" >
                                        <div class="butoane">
                                            <button type="button">+</button>
                                            <button type="button">-</button>
                                        </div>
                                        </label>
                                        <button id="open_case" type="button"><i class="fas fa-key"></i>&nbsp;Purchase case</button>
                                        <button id="test_case" type="button"><i class="fas fa-key"></i>&nbsp;Purchase case<sup style="color: lightgreen">TEST</sup></button>
                                    </form>
                                </div>
                            </div>
                        </div>`;

                        $html_cases += `
                            <div class="case">
                                <header class="name"><h3>` + itm.name + `</h3></header>
                                <div class="contentul">
                                    <div class="image"><img src="` + itm.img + `"></div>
                                    <div class="prices"><h4>Prices between:</h4><p><i class="fas fa-dollar-sign"></i>` + app.format_number(itemele[itemele.length-1].price) + ` - <i class="fas fa-dollar-sign"></i>` + app.format_number(itemele[0].price) + `</p></div>
                                    <div class="button" id="openCase" data-id="` + i + `"><a class="butonul"><span><i class="fas fa-key"></i>&nbsp;Purchase case</span></a></div>
                                </div>
                            </div>
                        `;

                        $html_items[i] = "";

                        for(var z in itm.items) {
                            var item = itm.items[z];

                            var $type;
                            switch(item.type) {
                                case 'Factory New': $type = 'FN'; break;
                                case 'Minimal Wear': $type = 'MW'; break;
                                case 'Field-Tested': $type = 'FT'; break;
                                case 'Well-Worn': $type = 'WW'; break;
                                case 'Battle-Scarred': $type = 'BS'; break;
                            }

                            $html_items[i] += `
                                <div class="case_item">
                                    <div class="color" style="background-color :` + item.color + `"></div>
                                    <div class="type">` + $type + `</div>
                                    <div class="price">$` + app.format_number(item.price) + `</div>
                                    <div class="img">
                                        <img src="` + item.image + `">
                                    </div>
                                    <div class="name">` + item.name.replace(/ *\([^)]*\) */g, "").split(' | ')[0] + `</div>
                                    <div class="name2">` + item.name.replace(/ *\([^)]*\) */g, "").split(' | ')[1] + `</div>
                                </div>
                            `;
                        }
                    }

                    $('#cases').html($html_cases);
                    $('#caseul1').html($html_casess['1'] + '' + $html_items['1']);
                    $('#caseul2').html($html_casess['2'] + '' + $html_items['2']);
                    $('#caseul3').html($html_casess['3'] + '' + $html_items['3']);

                    $('body .case').bind('mouseenter', function() {
                        $(this).find('.image img').css('width', '80%');
                          $(this).find('.button .butonul').css('background-color', 'rgb(107, 99, 255)');
                       $(this).find('.button .butonul').css('color', 'white');
                      });
                    $('body .case').bind('mouseleave', function() {
                      $(this).find('.image img').css('width', '70%');
                      $(this).find('.button .butonul').css('background-color', 'rgb(255, 255, 255)');
                       $(this).find('.button .butonul').css('color', 'rgb(107, 99, 255)');
                    });

                    $('body #open_case').bind('mouseenter', function() {
                          $(this).css('background-color', 'rgb(107, 99, 255)');
                       $(this).css('color', 'white');
                      });
                    $('body #open_case').bind('mouseleave', function() {
                      $(this).css('background-color', 'rgb(255, 255, 255)');
                       $(this).css('color', 'rgb(107, 99, 255)');
                    });

                    $('body #test_case').bind('mouseenter', function() {
                        $(this).css('background-color', 'rgb(107, 99, 255)');
                     $(this).css('color', 'white');
                    });
                  $('body #test_case').bind('mouseleave', function() {
                    $(this).css('background-color', 'rgb(255, 255, 255)');
                     $(this).css('color', 'rgb(107, 99, 255)');
                  });
                });

                app.website.socket.on('user inventory amount', function(cases) {
                    app.user.inv_amount = cases.length;
                    app.user.cases_1 = [];
                    app.user.cases_2 = [];
                    app.user.cases_3 = [];
                    app.user.tcases_1 = [];
                    app.user.tcases_2 = [];
                    app.user.tcases_3 = [];
                    for(var z in cases) {
                        var itm = cases[z];
                        if(itm.type == 'fake') {
                            if(itm.caseid == 1) app.user.tcases_1.push(itm);
                            else if(itm.caseid == 2) app.user.tcases_2.push(itm);
                            else app.user.tcases_3.push(itm);
                        } else {
                            if(itm.caseid == 1) app.user.cases_1.push(itm);
                            else if(itm.caseid == 2) app.user.cases_2.push(itm);
                            else app.user.cases_3.push(itm);
                        }
                    }
                });

                app.website.socket.on('user successfull open cases', function(cases, now, lightning) {
                    $('#inventory .case').addClass('hidden');
                    console.log('Opening ');
                    console.log(cases);
                    generateCases(cases, now, lightning);
                });

                app.website.socket.on('user successfull test open cases', function(cases, now, lightning) {
                    $('#inventory .case').addClass('hidden');
                    console.log('Test Opening ');
                    console.log(cases);
                    generateTestCases(cases, now, lightning);
                });

                app.website.socket.on('user waiting cases', function() {
                    $('#tradeModal').modal('hide');
                });

                app.website.socket.on('website top unbox', function(top) {
                    app.website.top_unbox.name = top.name;
                    app.website.top_unbox.image = top.image;
                    app.website.top_unbox.value = top.value;
                    app.website.top_unbox.case = top.case;
                    app.website.top_unbox.opener = top.opener;
                });
                //
            },
            user_functions: function() {
                // cases

                $('.sounds').click(function() {
                    if(app.user.sounds == true) {
                        $(this).html('<i class="fas fa-volume-off"></i>');
                        app.user.sounds = false;
                        mp3_roll1.volume = 0;
                        mp3_roll2.volume = 0;
                        mp3_done.volume = 0;
                    } else {
                        $(this).html('<i class="fas fa-volume-up"></i>');
                        app.user.sounds = true;
                        mp3_roll1.volume = 0.1;
                        mp3_roll2.volume = 0.1;
                        mp3_done.volume = 0.1;
                    }
                });

                $('#cases').on('click', '#openCase', function() {
                    $('#cases').addClass('hidden');
                    $('#caseul1').addClass('hidden');
                    $('#caseul2').addClass('hidden');
                    $('#caseul3').addClass('hidden');
                    $('#caseul' + $(this).attr('data-id')).removeClass('hidden');

                    $('body .formul label .inputul').val(1);

                    app.user.case.id = $(this).attr('data-id');
                });

                $('body').on('click', '#unboxTestCase', function() {
                    if(app.user.can_click_unbox == false) return;
                    var $id = $(this).attr('data-case');
                    app.website.socket.emit('user inventory test open case run', $id, app.user.token, 0);
                });

                $('body').on('click', '#unboxTestLCase', function() {
                    if(app.user.can_click_unbox == false) return;
                    var $id = $(this).attr('data-case');
                    app.website.socket.emit('user inventory test open case run', $id, app.user.token, 1);
                });

                $('body').on('click', '#unboxRealCase', function() {
                    if(app.user.can_click_unbox == false) return;
                    var $id = $(this).attr('data-case');
                    app.website.socket.emit('user inventory open case run', $id, app.user.token, 0);
                });

                $('body').on('click', '#unboxRealLCase', function() {
                    if(app.user.can_click_unbox == false) return;
                    var $id = $(this).attr('data-case');
                    app.website.socket.emit('user inventory open case run', $id, app.user.token, 1);
                });

                $('body').on('click', '#unbox_back_btn', function() {
                    $('#inventory .Case-rollers').empty();
                    $('#inventory .case').removeClass('hidden');
                });

                $('body').on('click', '.butoane button:nth-child(1)', function() {
                    var $val = parseInt($('body .formul label .inputul').val());
                    var $new = $val + 1;

                    if(parseInt($val) == NaN) $new = 1;
                    if(parseInt($val) == 'NaN') $new = 1;
                    if($new == '') $new = 1;
                    if($new >= 101) $new = 100;

                    $('body .formul label .inputul').val($new);
                });

                $('body').on('click', '.butoane button:nth-child(2)', function() {
                    var $val = parseInt($('body .formul label .inputul').val());
                    var $new = $val - 1;

                    if(parseInt($val) == NaN) $new = 1;
                    if(parseInt($val) == 'NaN') $new = 1;
                    if($new == '') $new = 1;
                    if($new <= 0) $new = 1;

                    $('body .formul label .inputul').val($new);
                });

                $('body').on('click', '.go_back', function() {
                    $('#cases').removeClass('hidden');
                    $('#caseul1').addClass('hidden');
                    $('#caseul2').addClass('hidden');
                    $('#caseul3').addClass('hidden');
                });

                $('body').on('click', '#go_to', function() {
                    var $to = $(this).attr('data-go');
                    $('#cases').addClass('hidden');
                    $('#caseul1').addClass('hidden');
                    $('#caseul2').addClass('hidden');
                    $('#caseul3').addClass('hidden');
                    $('#inventory').addClass('hidden');
                    $('#faq').addClass('hidden');
                    $('#contact').addClass('hidden');
                    $('#' + $to).removeClass('hidden');
                    $('.title_section').text($to.toUpperCase());
                });

                $('body').on('click', '#open_case', function() {
                    if(app.user.case.clicked) return;
                    var $amount = parseInt($('body .formul label .inputul').val());
                    app.website.socket.emit('user open casess', app.user.case.id, $amount, app.user.token);
                    app.user.case.clicked = true;
                    setTimeout(function() {
                        app.user.case.clicked = false;
                    }, 1500);
                });

                $('body').on('click', '#test_case', function() {
                    var $amount = parseInt($('body .formul label .inputul').val());
                    app.website.socket.emit('user open test casess', app.user.case.id, $amount, app.user.token);
                    $('#inventory .Case-rollers').empty();
                });

                $('body').on('click', '#openTestCase', function() {
                    var $id = $(this).attr('data-case');
                    app.website.socket.emit('user inventory test open case', $id, app.user.token);
                });

                $('body').on('click', '#openRealCase', function() {
                    var $id = $(this).attr('data-case');
                    app.website.socket.emit('user inventory open case', $id, app.user.token);
                });
                // 

                // chat
                    $(document).on('click', '#app', function() {
                        var $menu = $('.profile-menu');
                        if($menu.hasClass('toggled')) {
                            $menu.hide(100);
                            $menu.removeClass('toggled');
                        }
                    });
                    $(document).on('contextmenu', '.chat-msg', function(e) {
                        if(e.ctrlKey) return;
                        $('.profile-menu [data-action=2]').hide();
                        $('.profile-menu [data-action=3]').hide();
                        $('.profile-menu [data-action=4]').hide();
                        if(app.user.rank == 100) {
                            $('.profile-menu [data-action=2]').show();
                            $('.profile-menu [data-action=3]').show();
                            $('.profile-menu [data-action=4]').show();  
                        }
                        e.preventDefault();
                        var steamid = $(this).attr('data-steamid');
                        var name = $(this).attr('data-name');
                        var $chat = $('.inputter');
                        $('.profile-menu [data-action=1]').html(name);
                        var $menu = $('.profile-menu');

                        $menu.addClass('toggled');
                        $menu.finish().toggle(100).
                        css({
                            position: "absolute",
                            left: '250px',
                            top: getMenuPosition(e.clientY, 'height', 'scrollTop')
                        }).off('click').on('click', 'li', function(e) {
                            var $action = $(this).attr('data-action');
                            e.preventDefault();
                            $menu.hide();
                            switch($action) {
                                case '1':
                                    $chat.val($chat.val() + steamid);
                                break;
                                case '2':
                                    $chat.val('/mute ' + steamid + ' 1');
                                break;
                                case '3':
                                    $chat.val('/ban ' + steamid);
                                break;
                                case '4':
                                    $chat.val('/unban ' + steamid);
                                break;
                            }

                            $('.inputter').focus();
                        });
                    });
                // 

                // support
                    $("#supportGo").click(function() {
                        window.open('https://twitter.com/marrrio244');
                    });
                    $("#inventoryGo").click(function() {
                        window.open('https://trade.opskins.com/inventory');
                    });
                    $("#logoutGo").click(function() {
                        document.location.href = '/auth/logout';
                    });
                    $('#buyVKeysGo').click(function() {
                        document.location.href = 'https://opskins.com/?loc=shop_search&app=1912_1&search_item=Skeleton+Key&sort=lh';
                    });
                //

                app.website.chat = false;

                if(app.website.chat == true) {
                    $('#tabbb').html('<i class="fas fa-align-left"></i>');
                    $('#statsss').addClass('stats_goned');
                    $('#chattt').removeClass('chat_goned');
                    app.website.chat = false;
                } else {
                    $('#tabbb').html('<i class="fas fa-comments"></i>');
                    $('#statsss').removeClass('stats_goned');
                    $('#chattt').addClass('chat_goned');
                    app.website.chat = true;
                }

                $('.toggletab').click(function() {
                    if(app.website.chat == true) {
                        $('#tabbb').html('<i class="fas fa-align-left"></i>');
                        $('#statsss').addClass('stats_goned');
                        $('#chattt').removeClass('chat_goned');
                        app.website.chat = false;
                    } else {
                        $('#tabbb').html('<i class="fas fa-comments"></i>');
                        $('#statsss').removeClass('stats_goned');
                        $('#chattt').addClass('chat_goned');
                        app.website.chat = true;
                    }
                });

                $('.inputter').keyup(function(e) {
                    if(e.keyCode == 13) {
                        app.website.socket.emit('user chat message', $('.inputter').val(), app.user.token); $('.inputter').val('');
                    }
                });
            }
        }
    });

    app.connect();

    function getMenuPosition(mouse, direction, scrollDir) {
        var win = $(window)[direction](),
            scroll = $(window)[scrollDir](),
            menu = $(".profile-menu")[direction](),
            position = mouse + scroll;
        if (mouse + menu > win && menu < mouse)
            position -= menu;
        return position;
    }

    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };

    function generateTestCases(cases, now, lightning) {
        var $html = `
            <div class="case-roller animated fadeIn"><div class="case-roller-holder"><div class="case-roller-container" style="margin-left: 0px;"></div></div></div><br>
            <button type="button" id="unbox_back_btn"><i class="fas fa-arrow-left"></i>&nbsp;Back</button>
            <button type="button" data-case="` + cases.caseid + `" id="unboxTestCase"><i class="fas fa-key"></i>&nbsp;Unbox</button>
            <button type="button" data-case="` + cases.caseid + `" id="unboxTestLCase"><i class="fas fa-bolt"></i></button>
        `;

        $('.Case-rollers').html($html);

        app.user.case.item_unbox = cases.item;

        setTimeout(function() {
            var caseid = cases.caseid;
            addTestItems(caseid);
            if(now == 1) caseTestRoll(lightning);
        }, 50);
    }

    function addTestItems(caseid) {
        var items = app.user.case.cases[caseid][0].items;
        setTimeout(function() {
            var s;
            if(caseid == 1) {s = 135;}
            else if(caseid == 2) {s = 143;}
            else {s = 244;}
            for(var i = 0; i < 101; i++) {
                var randIt = Math.floor(Math.random()*(100-1+1)+1);
                if(randIt == 69) var randomItem = Math.floor(Math.random()*(items.length-1-0+1)+0);
                else var randomItem = Math.floor(Math.random()*(items.length-1-s+1)+s);
                
                var itemul = items[randomItem];
                var element = '<div id="CardNumber' + i + '" class="item" style="background-image:url(' + itemul.image + '); border-bottom: 4px solid ' + itemul.color + ';"></div>';
                $(element).appendTo('.Case-rollers .case-roller .case-roller-container');
            }
        }, 50);
    }

    function caseTestRoll(lightning) {
        var times;
        if(lightning == 1) times = 2500;
        else times = 9000;
        app.user.can_click_unbox = false;
        var randItem = app.user.case.item_unbox;
        app.user.winnings.image = app.user.case.item_unbox.image;
        app.user.winnings.name = app.user.case.item_unbox.name;
        app.user.winnings.price = '$' + app.format_number(app.user.case.item_unbox.price);
        $('.Case-rollers .case-roller .case-roller-container').css('margin-left', '0px');
        $('.Case-rollers .case-roller .case-roller-container #CardNumber49').css('background-image', '');
        $('.Case-rollers .case-roller .case-roller-container #CardNumber49').css('border-bottom', '');
        setTimeout(function() {
            var min = 6615;
            var max = 6740;
            var pos = Math.floor(Math.random()*(max-min+1)+min);

            var secs = parseInt(times/1000)
        
            $('.Case-rollers .case-roller .case-roller-container').css({
                transition: "all " + secs + "s cubic-bezier(.08,.6,0,1)"
            });
            $('.Case-rollers .case-roller .case-roller-container #CardNumber49').css('background-image', 'url("' + randItem.image + '")');
            $('.Case-rollers .case-roller .case-roller-container #CardNumber49').css('border-bottom', '4px solid ' + randItem.color);
            $('.Case-rollers .case-roller .case-roller-container').css('margin-left', '-' + pos + 'px');

            if(lightning == 1) mp3_roll2.play();
            else mp3_roll1.play();

            setTimeout(function() {
                app.user.can_click_unbox = true;
                $('#winner_modal').modal('toggle');
                mp3_done.play();
            }, times-200);
        }, 300);
    }


    function generateCases(cases, now, lightning) {
        console.log('generate Cases ');
        console.log(cases);
        console.log(now);
        console.log(lightning);


        var $html = `
            <div class="case-roller animated fadeIn"><div class="case-roller-holder"><div class="case-roller-container" style="margin-left: 0px;"></div></div></div><br>
            <button type="button" id="unbox_back_btn"><i class="fas fa-arrow-left"></i>&nbsp;Back</button>
            <button type="button" data-case="` + cases.id + `" id="unboxRealCase"><i class="fas fa-key"></i>&nbsp;Unbox</button>
            <button type="button" data-case="` + cases.id + `" id="unboxRealLCase"><i class="fas fa-bolt"></i></button>
        `;

        $('.Case-rollers').html($html);

        app.user.case.item_unbox = cases.item;

        setTimeout(function() {
            var caseid = cases.id;
            addItems(caseid);
            if(now == 1) caseRoll(lightning);
        }, 50);
    }

    function addItems(caseid) {
        var items = app.user.case.cases[caseid][0].items;
        setTimeout(function() {
            var s;
            if(caseid == 1) {s = 135;}
            else if(caseid == 2) {s = 143;}
            else {s = 244;}
            for(var i = 0; i < 101; i++) {
                var randIt = Math.floor(Math.random()*(100-1+1)+1);
                if(randIt == 69) var randomItem = Math.floor(Math.random()*(items.length-1-0+1)+0);
                else var randomItem = Math.floor(Math.random()*(items.length-1-s+1)+s);
                
                var itemul = items[randomItem];
                var element = '<div id="CardNumber' + i + '" class="item" style="background-image:url(' + itemul.image + '); border-bottom: 4px solid ' + itemul.color + ';"></div>';
                $(element).appendTo('.Case-rollers .case-roller .case-roller-container');
            }
        }, 50);
    }

    function caseRoll(lightning) {
        var times;
        if(lightning == 1) times = 2500;
        else times = 9000;
        app.user.can_click_unbox = false;
        var randItem = app.user.case.item_unbox;
        app.user.winnings.image = app.user.case.item_unbox.image["600px"];
        app.user.winnings.name = app.user.case.item_unbox.name;
        app.user.winnings.price = '$' + app.format_number(app.user.case.item_unbox.suggested_price/100);
        $('.Case-rollers .case-roller .case-roller-container').css('margin-left', '0px');
        $('.Case-rollers .case-roller .case-roller-container #CardNumber49').css('background-image', '');
        $('.Case-rollers .case-roller .case-roller-container #CardNumber49').css('border-bottom', '');
        setTimeout(function() {
            var min = 6615;
            var max = 6740;
            var pos = Math.floor(Math.random()*(max-min+1)+min);

            var secs = parseInt(times/1000)
        
            $('.Case-rollers .case-roller .case-roller-container').css({
                transition: "all " + secs + "s cubic-bezier(.08,.6,0,1)"
            });
            $('.Case-rollers .case-roller .case-roller-container #CardNumber49').css('background-image', 'url("' + randItem.image["600px"] + '")');
            $('.Case-rollers .case-roller .case-roller-container #CardNumber49').css('border-bottom', '4px solid ' + randItem.color);
            $('.Case-rollers .case-roller .case-roller-container').css('margin-left', '-' + pos + 'px');

            if(lightning == 1) mp3_roll2.play();
            else mp3_roll1.play();

            setTimeout(function() {
                app.user.can_click_unbox = true;
                $('#winner_modal').modal('toggle');
                mp3_done.play();
            }, times-200);
        }, 300);
    }

});