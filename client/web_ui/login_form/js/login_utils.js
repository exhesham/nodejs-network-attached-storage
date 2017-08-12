function send_login_request(){
	var data = {"username":"","password":""};
	data.username=$("#Username").val();
	data.password=$("#Password").val();
	console.log("send_login_request - data = " + JSON.stringify(data));
	login_getRequestFromServer("login_password","POST",data,function(res){
		console.log("received answer:" + JSON.stringify(res));
	});
}

var is_sending_lock = false;
function login_getRequestFromServer(reqUrl,req_method,userdata,callback){
	if(is_sending_lock){
		
		hc_util_show_error_msg("Busy...Please wait...");
		return;
	}
	is_sending_lock = true;
	$.ajax({
		type: req_method,
		url: reqUrl,
		data: userdata,
		dataType: "application/json",
		complete: function(result) {
			is_sending_lock = false;
			if(result.status == 200 && reqUrl == "login_password"){
				window.location.href = "main_page.html";
				return;
			}
			if(result.status == 401 && reqUrl == "login_password"){
				hc_util_show_error_msg("Error" , "Failed to login. Account is not available.");
				return;
			}
			if(result.status == 200 && reqUrl == "create_new_account"){
				hc_util_show_error_msg("Success" , "The user was added successfully.");
				return;
			}
			
			
			if(result.status == 500 && reqUrl == "create_new_account"){
				hc_util_show_error_msg("Error" , "Error processing your request. "+result.responseText + "... Error Code:" + result.status);
				$('#create_new_account_Username').val("");
				$('#create_new_account_Password').val("");
				$('#create_new_account_RepeatPassword').val("");
				$('#create_new_account_adminusername').val("");
				$('#create_new_account_adminpassword').val("");
				$('#create_new_account_cloudkey').val("");
				return;
			}
			if(result.status != 200 && reqUrl == "create_new_account"){
				hc_util_show_error_msg("Failed" , "Failed to add user. "+result.responseText );
			}
		}
	});
}
/*****************************************************************************************************************/
function hc_util_show_error_msg(msgtitle,msg){

	
	$.bs.popup.toast({
    title: msgtitle,
	info: msg
}, function(dialogE) {
    // todos here
});
}

function register_enable_step2(){
	var username = $('#create_new_account_Username').val();
	var password = $('#create_new_account_Password').val();
	var repassword = $('#create_new_account_RepeatPassword').val();
	if(username == ""){
		hc_util_show_error_msg("Error","Username is empty, please fill it with English letters.");
		return;
	}
	if(password == "" || repassword == ""){
		hc_util_show_error_msg("Error","Please fill the passwords fields");
		return;
	}
	if(password.length < 10){
		hc_util_show_error_msg("Error","Please select at least 10 character password");
		return;
	}	
	if(password != repassword ){
		hc_util_show_error_msg("Error","You didn't confirm the password correctly make sure they are identical.");
		return;
	}
	
	$("#register_step1").hide();
	$("#register_step2").show();
}

function close_step2(){
	$("#register_step2").hide();
	$("#register_step1").show();
}

function create_new_account(){
	var new_account_data = {};
	new_account_data.username = $('#create_new_account_Username').val();
	new_account_data.password = $('#create_new_account_Password').val();
	new_account_data.repassword = $('#create_new_account_RepeatPassword').val();
	                
	new_account_data.adminusername = $('#create_new_account_adminusername').val();
	new_account_data.adminpassword = $('#create_new_account_adminpassword').val();
	new_account_data.cloudkey = $('#create_new_account_cloudkey').val();
	
	if(new_account_data.adminusername == "" || new_account_data.adminpassword == "" || new_account_data.cloudkey == ""){
		hc_util_show_error_msg("Error","Please fill all empty fields");
		return;
	}
	
	
	login_getRequestFromServer("create_new_account","POST",new_account_data,function(res){
		if(res == undefined || res.status != 200){
			hc_util_show_error_msg("Error","Failed to create new account. "+res.body);
		}else{
			hc_util_show_error_msg("Success","Account was created successfully.");
		}
	})
}

// enable the spinning modal
$body = $("body");

$(document).on({
    ajaxStart: function() { $body.addClass("loading");    },
     ajaxStop: function() { $body.removeClass("loading"); }    
});