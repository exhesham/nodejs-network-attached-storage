var show_uploads_data_section_already_called=false;

function show_uploads_data_section(){
	console.log("show_uploads_data_section called");
	$("#hc_notifications").addClass("hc_spinning_modal");
	if(show_uploads_data_section_already_called == true){
		return;
	}

	
	setInterval(update_uploads_table_timer, 1000); // update the table every second
	show_uploads_data_section_already_called = true;
}

/*****************************************************************************************************************/
// function hide_uploads_data_section(){
	// show_uploads_data_section_already_called = false;
	// var interval_id = window.setInterval("", 9999); // Get a reference to the last
                                                // // interval +1
	// for (var i = 1; i <= interval_id+1; i++)
			// window.clearInterval(i);
// }

/*****************************************************************************************************************/
function update_uploads_table_timer(){
	show_table_uploads(queueued_notifications);
}

/*****************************************************************************************************************/
function clear_notifications_table(){
	$("#hc_notifications .hc_upload_record").empty();
}
/*****************************************************************************************************************/
/*****************************************************************************************************************/
var queueued_notifications = [];// the upload activity the user is doing

function is_record_in_queue(file_record){
	if(queueued_notifications[file_record.upload_identifier] != undefined && queueued_notifications[file_record.upload_identifier] != null){
		return true;
	}
	
	return false;
}
/*****************************************************************************************************************/
function show_table_uploads(data){
	//clear_notifications_table();
	hc_notification_icon.style.color = "red";
	var found_relevant_record = false;
	for(var key in data){
		file_rec = data[key];
		$("#hc_notifications").removeClass("hc_spinning_modal");
		// here we need to update the percentage only
		var cercular_cls = "#hc_uploadcircular_progress"+file_rec.upload_identifier;
		var cercular_val = "#percentagestr_"+file_rec.upload_identifier;
		if(/*file_rec.file_status=="Pending" &&*/ is_record_in_queue(file_rec)){// lets see if we have this notification already queued
			
			var op_percentage = Math.round(file_rec.op_percentage);
			$(cercular_val).text(op_percentage+"%");
			$(cercular_cls).addClass("p"+op_percentage);
			queueued_notifications[file_rec.upload_identifier].op_percentage = op_percentage;
			if(op_percentage <100){
				hc_notification_icon.style.color = "red";
				found_relevant_record = true;
			}
		}
		
	}
	if(!found_relevant_record){
		hc_notification_icon.style.color = "";
	}
	//hc_mycloudcontent_updateUploadsTable(dataset);
}
/*****************************************************************************************************************/
var files_to_send_queue = [];
var can_send_file = true;
 function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
console.log("handleFileSelect called");
    // files is a FileList of Filconsole.log(escape(f.name));e objects. List some properties.
	
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
		files_to_send_queue.push(f);
		
    }
	if(can_send_file && files_to_send_queue.length > 0){
		sendFileToServer(files_to_send_queue.pop()) ;
	}
	$("#hc_pending_for_upload").text(files_to_send_queue.length);
    document.getElementById('homecloud_uploadfileslist').innerHTML = '<ul>' + output.join('') + '</ul>';
  }
/*****************************************************************************************************************/
 function add_new_upload_record(manipulated_record){
	 manipulated_record.op_percentage = Math.round(manipulated_record.file_size ==0 ?0: manipulated_record.op_percentage * 100 / manipulated_record.file_size);
	 if(manipulated_record.op_percentage == undefined){
		 manipulated_record.op_percentage = 0;
	 }

								
								//<!-- start of record div -->
							var new_record =	'<li class="hc_upload_record" id="'+manipulated_record.upload_identifier+'">'+
							'<div   style="display: flex">'+
							//<!-- this is the file name -->
								'<div id="hc_upload_filename"  style = "float: left;width: 78%;-webkit-line-clamp: 2;overflow: hidden;margin: 10px;height: 35px;text-overflow: ellipsis;"><a style="    white-space: nowrap;    text-overflow: ellipsis;" filepath='+manipulated_record.file_path+'>'+manipulated_record.file_name+'</a></div> '+
								
								'<div>'+// <!-- Start of loader div -->
									'<div id="hc_uploadcircular_progress'+manipulated_record.upload_identifier+'" class="c100 p'+manipulated_record.op_percentage+' small orange" style="margin-left: auto;float: right;">'+
									'<span id = "percentagestr_'+manipulated_record.upload_identifier+'">'+ manipulated_record.op_percentage +'%</span>'+
									'	<div class="slice">'+
											'<div class="bar"></div>'+
											'<div class="fill"></div>'+
										'</div>'+
									'</div>'+
								'</div>' +//<!-- this is the loader div-->
							'</div>'+
						'</li>';
						
	$("#hc_notifications").prepend(new_record);
	// show only 10 elements in the list and the rest add a scrollbar
	var record_height = $("#hc_notifications li").height();
	record_height = record_height == 0? 55:record_height; // make sure it is not zero
	
	if($("#hc_notifications li").length  > 7){
		$("#hc_notifications").height(5 * record_height +45);
		$("#hc_notifications").css("overflow-y","scroll");
	}else{
		$("#hc_notifications").height(($("#hc_notifications li").length-3) * record_height+45);
		$("#hc_notifications").css("overflow-y","hidden")
	}
	// // dont make list length less than 45
	// if($("#hc_notifications").height() < 45){
		// $("#hc_notifications").height(45);
	// }
 }
/*****************************************************************************************************************/
function  add_to_pending_notifications(file_name,file_path,file_size,upload_identifier){
	
	var manipulated_record={};		
	manipulated_record.file_name = file_name;
	manipulated_record.file_path = file_path;
	manipulated_record.op_percentage = 0;
	manipulated_record.file_size = file_size;
	manipulated_record.upload_identifier = upload_identifier;
	queueued_notifications[upload_identifier] = manipulated_record;
	add_new_upload_record(manipulated_record);
}
/*****************************************************************************************************************/
/*Handle the progress of the files upload.*/
function hc_handle_progress(e,identifier){

    if(e.lengthComputable){
        var max = e.total;
        var current = e.loaded;

        var Percentage = (current * 100)/max;
        console.log("identifier:"+identifier+ " prcntg:"+Percentage +" total:"+ max +" curr:"+ current);
		queueued_notifications[identifier].op_percentage =Percentage;

        if(Percentage >= 100)
        {
           console.log("Finished upload...");
		   queueued_notifications[identifier].op_percentage =100;
        }
    }  
 }
/*****************************************************************************************************************/
function sendFileToServer(file) {
	hc_notification_icon.style.color = "red";
	var formData = new FormData();
	var identifier = "brwser" + new Date().valueOf();
	
	formData.append('data', file, file.name);
	formData.append('file_name', file.name);
	formData.append('file_size', file.size);
	formData.append('file_path', file_sys_view.curr_dir);
	
	add_to_pending_notifications(file.name,file_sys_view.curr_dir,file.size,identifier);
	 $.ajax({
        url: 'UploadFile',
        type: 'POST',
        data: formData,
		headers : {"x-upload_identifier":identifier, "x-file_name":escape(file.name), "x-file_size":file.size,"x-operation_type":"Upload","x-file_path":file_sys_view.curr_dir},	
        cache: false,
        dataType: 'json',
        processData: false, // Don't process the files
        contentType: false, // Set content type to false as jQuery will tell the server its a query string request
		xhr: function() {
                var myXhr = $.ajaxSettings.xhr();
                if(myXhr.upload){
                    myXhr.upload.addEventListener('progress',function(ev){hc_handle_progress(ev,identifier);}, false);
                }
                return myXhr;
        },
        success: function(data, textStatus, jqXHR)
        {
			can_send_file = true;
            if(typeof data.error === 'undefined')
            {
				var should_add_file = true;
                // Success so call function to process the form
               if(data._id != null && data._id != undefined){
				   for(i=0;i<file_sys_view.file_sys_repo.length;i++){
					   var currf = file_sys_view.file_sys_repo[i];
						if(currf.file_name == file_sys_view.curr_dir + file.name){
							if(file_sys_view.file_sys_repo[i].file_size != file.size){
								file_sys_view.file_sys_repo[i].file_size = file.size;
								hc_mycloudcontent_go_to_dir(file_sys_view.curr_dir);
							}
							should_add_file = false;
							break;
							
						}
				   }
				   if(should_add_file){
						file_sys_view.file_sys_repo.push({"file_name": file_sys_view.curr_dir + file.name, "file_size": file.size, "file_modified_date": file.lastModifiedDate,  "file_type": "-"});
					   // redraw the table
					   hc_mycloudcontent_go_to_dir(file_sys_view.curr_dir);
				   }
				   
			   }
            }
            else
            {
                // Handle errors here
                console.log('ERRORS: ' + data.error);
            }
			push_to_server_from_queued_files();
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
			can_send_file = true;
            // Handle errors here
            console.log('ERRORS: ' + textStatus);
			push_to_server_from_queued_files();
		}
		
    });
	show_uploads_data_section();
 }
 
 /*when called, it sends files for upload to server from the waiting files q	queue*/
function push_to_server_from_queued_files(){
	// upload 4 files eachtime
	var units_already_sent = 0;
	while(files_to_send_queue.length > 0 && units_already_sent < 5){
		sendFileToServer(files_to_send_queue.pop()) ;
		$("#hc_pending_for_upload").text(files_to_send_queue.length);
		units_already_sent++;
	} 
} // push_to_server_from_queued_files


$(document).ready(function() {
$(function(){
    $("#homecloud_filesupload_link").on('click', function(e){
        e.preventDefault();
        $("#homecloud_filesupload:hidden").trigger('click');
    });
});
document.getElementById('homecloud_filesupload').addEventListener('change', handleFileSelect, false);		
} );
