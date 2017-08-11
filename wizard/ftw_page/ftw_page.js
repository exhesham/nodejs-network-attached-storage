//jQuery time
var current_fs, next_fs, previous_fs; //fieldsets
var left, opacity, scale; //fieldset properties which we will animate
var animating; //flag to prevent quick multi-click glitches

 $(document).ready(function() {
$(".next").click(function(){
	if(animating) return false;
	animating = true;
	
	current_fs = $(this).parent();
	next_fs = $(this).parent().next();
	
	//activate next step on progressbar using the index of next_fs
	$("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");
	
	//show the next fieldset
	next_fs.show(); 
	//hide the current fieldset with style
	current_fs.animate({opacity: 0}, {
		step: function(now, mx) {
			//as the opacity of current_fs reduces to 0 - stored in "now"
			//1. scale current_fs down to 80%
			scale = 1 - (1 - now) * 0.2;
			//2. bring next_fs from the right(50%)
			left = (now * 50)+"%";
			//3. increase opacity of next_fs to 1 as it moves in
			opacity = 1 - now;
			current_fs.css({
        'transform': 'scale('+scale+')',
        'position': 'absolute'
      });
			next_fs.css({'left': left, 'opacity': opacity});
		}, 
		duration: 800, 
		complete: function(){
			current_fs.hide();
			animating = false;
		}, 
		//this comes from the custom easing plugin
		easing: 'easeInOutBack'
	});
});

$(".previous").click(function(){
	if(animating) return false;
	animating = true;
	
	current_fs = $(this).parent();
	previous_fs = $(this).parent().prev();
	
	//de-activate current step on progressbar
	$("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");
	
	//show the previous fieldset
	previous_fs.show(); 
	//hide the current fieldset with style
	current_fs.animate({opacity: 0}, {
		step: function(now, mx) {
			//as the opacity of current_fs reduces to 0 - stored in "now"
			//1. scale previous_fs from 80% to 100%
			scale = 0.8 + (1 - now) * 0.2;
			//2. take current_fs to the right(50%) - from 0%
			left = ((1-now) * 50)+"%";
			//3. increase opacity of previous_fs to 1 as it moves in
			opacity = 1 - now;
			current_fs.css({'left': left});
			previous_fs.css({'transform': 'scale('+scale+')', 'opacity': opacity});
		}, 
		duration: 800, 
		complete: function(){
			current_fs.hide();
			animating = false;
		}, 
		//this comes from the custom easing plugin
		easing: 'easeInOutBack'
	});
});

$(".submit").click(function(){
if($("#cloud_key").val() == ""){ alert("Please fill the cloud key"); return;}
if($("#pass").val() == ""){ alert("Please fill the password"); return;}
if($("#cpass").val() == ""){ alert("Please fill the password confirmation"); return;}
if($("#cpass").val() != $("#pass").val() ){ alert("Password and confirmation of password are not equal..."); return;}
if($("#noip_username").val() == ""){ alert("Please fill your username at noip.com"); return;}
if($("#noip_password").val() == ""){ alert("Please fill your password at noip.com"); return;}
if($("#noip_url").val() == ""){ alert("Please fill your url at noip.com"); return;}
if($("#fname").val() == ""){ alert("Please fill your name"); return;}
if($("#lname").val() == ""){ alert("Please fill your last name"); return;}
if($("#phone").val() == ""){ alert("Please fill your phone"); return;}
	
$.ajax({
      url: '/install',
      type: "post",
      data : $('#msform').serialize(),
      success: function(data){
        get_installation_status();
      }
    });
    
	return true;
});
window.setInterval(function(){
	if(!$("body").hasClass("loading"))
		 return;
  get_installation_status();
}, 1000);

$(document).on({
    ajaxStart: function() { $("body").addClass("loading");    },
     ajaxStop: function() { $("body").removeClass("loading"); }    
});

$('form').on('submit', function(e){
    // validation code here
    
      e.preventDefault();
    
  });
  
  

 });
 
 function get_installation_status(){
	 
	 $.ajax({
      url: '/get_log',
      type: "get",
      
      success: function(data){
        console.log('form submitted. data='+data);
		$("#messages").html(data.replace(/(?:\r\n|\r|\n)/g, '<br />'));
      }
    });
    
 }
 
