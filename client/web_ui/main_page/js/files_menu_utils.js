var CHUNK_SIZE = 2000;
/*****************************************************************************************************************/
function hc_utils_validate_name_valid_chars(name){
	if(name == undefined || name == null || name.length > 200 || name.length == 0 ){
		return false;
	}
	var rg1=/^[^\\/:\*\?"<>\|]+$/; // forbidden characters \ / : * ? " < > |
	var rg2=/^\./; // cannot start with dot (.)
	var rg3=/^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
	return rg1.test(name)&&!rg2.test(name)&&!rg3.test(name);

}
/*****************************************************************************************************************/
/*****************************************************************************************************************/
function hc_util_show_error_msg(msgtitle,msg){

	
	$.bs.popup.toast({
		title: msgtitle,
		info: msg
}, function(dialogE) {
    // todos here
});
}
/*****************************************************************************************************************/
	function manipulate_file_size(file_size){
		if(file_size < 1000){
			return file_size + "b"
		}
		if(file_size > 1000 &&file_size < 1000000 ){
			return file_size/1000 + "Kb"
		}
		if(file_size > 1000000 &&file_size < 1000000000 ){
			return file_size/1000000 + "Mb"
		}
		return file_size/1000000000  + "Gb"
	}
	/*****************************************************************************************************************/
	var cookies = null;
    function homecloud_utils_readCookie(name){
        
        var c = document.cookie.split('; ');
        cookies = {};

        for(i=c.length-1; i>=0; i--){
           var C = c[i].split('=');
           cookies[C[0]] = C[1];
        }
		console.log("cookie for " + name + " = " +cookies[name]);
        return cookies[name];
    }

	
	/*****************************************************************************************************************/
	// function hc_util_show_error_msg(msgtitle,msg){		
		// $.bs.popup.toast({
				// title: msgtitle,
				// info: msg
			// }, function(dialogE) {
			// // todos here
		// });
	// }
	/*****************************************************************************************************************/
	function hc_utils_send_request_to_server(reqUrl,req_method,data_to_send,headers_to_add,callback){
		$.ajax({
			type: req_method,
			url: reqUrl,
			data: data_to_send,
			dataType: "json",
			headers: headers_to_add,
			contentType: "application/json; charset=utf-8",
			xhrFields: {withCredentials: true},
			complete: function(data, textStatus) {
				
				if (data.redirect) {
					// data.redirect contains the string URL to redirect to
					console.log("received a redirect");
					window.location.href = data.redirect;
					callback(data.responseJSON,data);
				}
				else {
					// data.form contains the HTML for the replacement form
					//console.log("NO  redirect");
					callback(data.responseJSON,data);
				}
			}
		});
		/*$.get(url, function(data, status){
			if (data.redirect) {
				// data.redirect contains the string URL to redirect to
				console.log("received a redirect");
				window.location.href = data.redirect;
			}
			else {
				// data.form contains the HTML for the replacement form
				console.log("received no redirect");
				callback(data);
				
			}
		});*/
	}
	/*****************************************************************************************************************/
	function map_extension_to_awesome_icon(ext){
		switch(ext){
			case "doc":
			case "docx":
				return "file-word-o";
			break;
			case "pdf":
				return "file-pdf-o";
			break;
			case "jpg":
			case "bmp":
			case "jpg":
			case "jpeg":
			case "tiff":
			case "gif":
			case "png":
				return "file-picture-o";
			break;
			case "xls":
			case "xlsx":
				return "file-excel-o";
			break;
			case "amw":
			case "mp3":
			case "wav":
				return "file-sound-o";
			break;
			case "avi":
			case "mov":
			case "wmv":
			case "mp4":
			case "divx":
			case "mpeg":
				return "file-movie-o";
			break;
			case "txt":
				return "file-text-o";
			break;
			case "c":
			case "cpp":
			case "py":
			case "php":
			case "cc":
			case "h":
			case "js":
			case "java":
			case "cs":
				return "file-code-o";
			break;
			case "ppt":
			case "pptx":
				return "file-powerpoint-o";
			break;
			case "conf":
			case "bin":
			case "exe":
				return "gear";
			break;
			case "zip":
			case "rar":
			case "7z":
			case "iso":
			case "tgz":
			case "tar":
			case "tar.gz":
				return "file-zip-o";
			break;
			case "lib":
			case "so":
			case "dll":
				return "archive";
			break;
			default:
				return "file-o"
			/*	return "";
			break;
				return "";
			break;
			case "":
				return "";
			break;
			case "":
				return "";
			break;
			case "":
				return "";
			break;
			case "":
				return "";
			break;
			case "":
				return "";
			break;
			case "":
				return "";
			break;
			case "":
				return "";
			break;
			case "":
				return "";
			break;
			case "":
				return "";
			break;*/
			
			
		}
	}