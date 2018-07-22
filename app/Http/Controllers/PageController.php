<?php namespace App\Http\Controllers;

use App\User;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class PageController extends Controller
{
    public function main()
    {
        return $this->validation((string) 'main');
    }

    function validation($page)
    {
        $user = DB::table('users')->where('token', csrf_token())->first();

        if(!is_null($user))
        {
            $user_details = DB::table('users')->select(DB::raw('*'))->where('token', csrf_token())->get();

            // if banned
            $banned = $this->r($user_details)[0]['ban'];
            if($banned == 1) return view('banned');         
            // 

            // if maintenance
            $settings = DB::table('settings')->select(DB::raw('*'))->where('id', 1)->get();
            if($this->r($user_details)[0]['rank'] == 0 && $this->r($settings)[0]['maintenance'] == 1) return view('maintenance')->with(array('user' => 0));
            //

            return view($page)->with(array(
                'user' => $this->r($user_details)[0]
            ));
        }
        else
        {

            
            // if maintenance
            $settings = DB::table('settings')->select(DB::raw('*'))->where('id', 1)->get();
            if($this->r($settings)[0]['maintenance'] == 1) return view('maintenance')->with(array('user' => 0));
            //

            if($page == 'profile' || $page == 'transactions') {
                return view('coinflip')->with(array(
                    'user' => 0
                ));
            } else {
                return view($page)->with(array(
                    'user' => 0
                ));
            }
        }
    }

    function r($array)
    {
        return json_decode(json_encode($array), true);
    }
}