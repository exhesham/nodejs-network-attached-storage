
function hc_create_new_folder() {
	$.bs.popup.prompt({
		title: 'Create new folder',
		info: 'Input a folder name, please.'
	}, function(dialogE) {
		var foldername = dialogE.find('.modal-body input').val();
		console.log('foldername'+foldername);
		var is_foldername_ok = hc_utils_validate_name_valid_chars(foldername);
		var title_notify = "Validating...";
		var msg = 'proccessing creation of the folder: ' + foldername;
		if(!is_foldername_ok){
			
			title_notify = "Wrong folder name."
			msg = "Please select a legal folder name with legal characters. don't use the characters !,#,$,%,^,&,*,|,\\,/,<,>,{,},[,]";
		}
		
		$.bs.popup.toast({
			title: title_notify,
			info: msg
		}, function() {		
			if(is_foldername_ok){
				//Send the request
				hc_utils_send_request_to_server("create_folder?"+$.param({"foldername":file_sys_view.curr_dir + "/" + foldername},true),"GET","",null,function(res){
					console.log("received response....refreshing contents");
					hc_mycloudcontent_servercall_getCloudContentAndUpdateTable();
					dialogE.modal('hide');
					//this.modal('hide');
				});
				dialogE.modal('hide');
			}
		});			
	});
}