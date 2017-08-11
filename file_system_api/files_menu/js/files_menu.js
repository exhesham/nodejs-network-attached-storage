
	var file_sys_view = {"mounted_drives":[],"curr_dir":"", "file_sys_repo":{},"file_sys_badge":{},"shared_links":[]} /*contains the current directory shown in the table and contains all the original data*/
	
	
	/*****************************************************************************************************************/
	/*if the user clicks on a folder that is shown to the directory then this function will be called with the wanted dir*/
	function hc_mycloudcontent_go_to_dir(dest_dir){
		file_sys_view.curr_dir = dest_dir;
		var manipulated_data = hc_mycloudcontent_manipulate_filesystem_view(dest_dir);
		hc_mycloudcontent_updateFilesTable(manipulated_data);
		hc_mycloudcontent_set_inactive_directory(file_sys_view.curr_dir);
	}
	/*****************************************************************************************************************/
	/*when a user double click a folder, this function will be called with the new directory and will update the directory html shown in the page aboce the table*/
	function hc_mycloudcontent_set_inactive_directory(inactive_dir){
		/*parse the input inactive directory and place it in the directory row*/
		inactive_dir = "Home Cloud/" + inactive_dir;
		var folders_arr = inactive_dir.split('/');
		folders_arr = folders_arr.filter(function(n){ return n != undefined && n !="" });  // remove empty elements from the array
		var final_html = "";
		var is_first_dir = true;
		var curr_directory = ""; // need this value so if the user click on a folder on a path, he can go to this path
		if(folders_arr == undefined || folders_arr.size == 0){
			console.log("no data received");
			return;
		}
		folders_arr.forEach(function(folder,index){
			console.log("[hc_mycloudcontent_set_inactive_directory] - folder="+folder+", Element index="+index+"/"+folders_arr.length);
			if(index == folders_arr.length-1){
				$('#homecloud_curr_folder_name').html(" "+folder+" ");
			}else{
				var path_to_redirect_to = curr_directory+"/"+folder;
				if(curr_directory == ""){
					path_to_redirect_to = ""; 
				}
					final_html +='<a href="#" class="dropdown-toggle" data-toggle="dropdown" onclick="hc_mycloudcontent_go_to_dir(\''+path_to_redirect_to+'\')"> '+folder +' <b class="fa fa-angle-right"></b></a>';
				if(!is_first_dir && folder != ''){
					curr_directory = curr_directory +"/"+folder;
				}else{
					is_first_dir = false;
				}
			}
		});
		
		$("#homecloud_inactive_directory").html(final_html);;
		
		<!-- <a href="#" class="dropdown-toggle" data-toggle="dropdown"><i class="fa fa-cloud"></i> Home Cloud <b class="fa fa-angle-right"></b></a> -->
	}
	/*****************************************************************************************************************/
	function read_cookie(k,r){return(r=RegExp('(^|; )'+encodeURIComponent(k)+'=([^;]*)').exec(document.cookie))?r[2]:null;}
	
	/*****************************************************************************************************************/
	function get_badges_of_file(filename,filepath){
		var res = {"is_favorite":false,"is_encrypted":false,"is_public":false,"is_shared":false};
		
		for(var i=0;i<file_sys_view.file_sys_badge.length;i++){
			var element = file_sys_view.file_sys_badge[i];
			var element_clean_fn = get_clean_path(element.file_path.trim()  + "/" + element.file_name.trim() );
			if(element_clean_fn == get_clean_path(filename)){
				res.is_favorite = element.is_favorite;
				res.is_shared = element.is_shared;
				//res.has_share_link = hc_does_file_has_share_link(filename);
				res.is_encrypted = element.is_encrypted;
				res.is_public = element.is_public;
				return res;
				
			}
		}
		
		return res;
	}
	/*****************************************************************************************************************/
	function hc_does_file_has_share_link(filename){
		for(var i=0;i<file_sys_view.shared_links.length;i++){
			var element = file_sys_view.shared_links[i];
			if(element.shared_filepath == undefined || element.shared_filepath == null){
				continue;
			}
			var element_clean_fn = get_clean_path(element.shared_filepath.trim()  + "/" + element.shared_filename.trim() );
			if(element_clean_fn == get_clean_path(filename)){
				return true;
			}
		}
		return false;
	}
	/*****************************************************************************************************************/
	
	function hc_delete_shared_link_from_list(filename){
		for(var i=0;i<file_sys_view.shared_links.length;i++){
			var element = file_sys_view.shared_links[i];
			if(element.shared_filepath == undefined || element.shared_filepath == null){
				continue;
			}
			var element_clean_fn = get_clean_path(element.shared_filepath.trim()  + "/" + element.shared_filename.trim() );
			if(element_clean_fn == get_clean_path(filename)){
				 file_sys_view.shared_links.splice(i,1);
				return;
			}
		}
		
	}
	/*****************************************************************************************************************/
	String.prototype.replaceAll = function(search, replacement) {
		var target = this;
		return target.replace(new RegExp(search, 'g'), replacement);
	};

	function get_clean_path(path){
		if(path == undefined || path == null){
			return path;
		}
		path = path.trim();
		return path.replaceAll(/\/\/+/g,"/");
		
	}
	/*****************************************************************************************************************/
	function is_storage(path){
		if(file_sys_view == undefined || file_sys_view.mounted_drives == undefined || path == undefined || path == null) return false;
		
		path = get_clean_path(path);
		
		for(i = 0 ;i<file_sys_view.mounted_drives.length ;i++){
			if(get_clean_path(file_sys_view.mounted_drives[i].mounted_dir) ==path ){
				return true;
			}
		}
		return false;
	}
	/*****************************************************************************************************************/
	/*filters from the dataset json all the relevant files and folders*/
	function hc_mycloudcontent_manipulate_filesystem_view(wanted_dir){
		file_sys_view.curr_dir = wanted_dir;
		var res = {"data":[]};
		if( JSON.stringify(file_sys_view.file_sys_repo) === JSON.stringify({})){
			return res;
		}
		
		file_sys_view.file_sys_repo.forEach(function(curr,index,element){
			curr.file_name = get_clean_path(curr.file_name);//.replace('//','/');
			wanted_dir = get_clean_path(wanted_dir);
			if(curr.file_name == undefined ){
				
				return;
			}
			if(curr.file_name.indexOf(wanted_dir) == 0){
				// this file name starts with the wanted path
				var manipulated_curr = {"file_type":"-","file_size":""}; // contains the detail of the row that will be added to the table
				
				var wanted_file_name = curr.file_name.replace(/^.*[\\\/]/, '');
				if(wanted_file_name != "" &&get_clean_path( wanted_dir+"/"+wanted_file_name) == get_clean_path(curr.file_name)){
					// we want this file
					manipulated_curr.file_name = wanted_file_name;
					manipulated_curr.deluxe_badges = get_badges_of_file(curr.file_name,wanted_dir);
					manipulated_curr.file_size = manipulate_file_size(curr.file_size); // dir has file size also
					manipulated_curr.file_ext = curr.file_type == 'd'?'d': manipulated_curr.file_name.split('.').pop();
					manipulated_curr.file_type = curr.file_type == 'd'?is_storage(manipulated_curr.file_name)?'hdd-o':'folder-o':map_extension_to_awesome_icon(manipulated_curr.file_ext);
					manipulated_curr.file_modified_date = curr.file_modified_date;
					res.data.push(manipulated_curr);
				}
			}
			
		});
		
		return res;
	}
	/*****************************************************************************************************************/
	function hc_mycloudcontent_servercall_getCloudContentAndUpdateTable(){
		
		// first bring the badges then the files
		hc_utils_send_request_to_server("getdeluxecontent","POST","",{},function(data){
			file_sys_view.file_sys_badge = data;
			
			
			
			// now bring the shares
			hc_utils_send_request_to_server("getsharedlinks","GET","",{},function(data){
				if(data != undefined){
					file_sys_view.shared_links = data;
					console.log("file_sys_view.shared_links="+file_sys_view.shared_links);
				}
		
				// now bring the files after all in order to set the badges accordingly
				hc_utils_send_request_to_server("GetFolderContents?folderpath=","GET","",{},function(data){
					file_sys_view.file_sys_repo = data.data;
					file_sys_view.mounted_drives = data.mounted_drives;
					console.log("file_sys_view.curr_dir="+file_sys_view.curr_dir);
					var manipulated_data = hc_mycloudcontent_manipulate_filesystem_view(file_sys_view.curr_dir );
					hc_mycloudcontent_updateFilesTable(manipulated_data);
					hc_draw_graph_disk_usage();
				});
			});
			
			
		});
		
		
	}
	/*****************************************************************************************************************/
	function eraseCookie(name) {
	//	createCookie(name,"",-1);
	}
	function servercall_logout(){
		hc_utils_send_request_to_server("logout","GET","",{},function(){
			window.location.href = "login.html";
		});
	}
	/*****************************************************************************************************************/
	/*Check if a file or folder was clicked and then if a folder show it or if a file then download it*/
	function hc_mycloudcontent_handle_doubleclick(file_name){
		//file_sys_view = {"curr_dir":"", "file_sys_repo":{}}
		file_sys_view.file_sys_repo.forEach(function(item){
			var looking_for_full_path = "/" + file_sys_view.curr_dir+ "/"+file_name.trim();
			if(get_clean_path(item.file_name) == get_clean_path(looking_for_full_path)){
				if(item.file_type == 'd'){
					console.log("it is equal and the clicked item is a folder");
					file_sys_view.curr_dir = looking_for_full_path + '/';
					var manipulated_data = hc_mycloudcontent_manipulate_filesystem_view(file_sys_view.curr_dir);
					hc_mycloudcontent_set_inactive_directory(file_sys_view.curr_dir);
					hc_mycloudcontent_updateFilesTable(manipulated_data);
					return;
				}else{
					console.log(file_name.trim());
					$("#hc_rightclicked_item_filename").text(file_name.trim());
					
					/*this is a file, it should be downloaded*/
					hc_download_file();
				}
			}
		});
	}
	/*****************************************************************************************************************/
	// find drive by name
	function get_drive_hdd_json(drive_name){
		for(i=0;i<file_sys_view.mounted_drives.length;i++){
			if(file_sys_view.mounted_drives[i].mounted_dir == drive_name.trim().replace(/\//g,"")){
				return file_sys_view.mounted_drives[i];
			}
		}
		return {};
	}
	/*****************************************************************************************************************/
	function get_current_hdd_danger_level(prcntg){
		if(prcntg < 50)
			return "success";
		if(prcntg > 70)
			return "danger";
		return "warning";
	}
	/*****************************************************************************************************************/
	var tableGetFolderContents = null;
	
	function hc_mycloudcontent_updateFilesTable(dataset){
		if(tableGetFolderContents != null){
			tableGetFolderContents.destroy();
			$('#GetFolderContents').empty();
		}
		tableGetFolderContents = $('#GetFolderContents').DataTable( {
			"fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
			// Bold the grade for all 'A' grade browsers
					console.log("Right click");
			},
			"bLengthChange" : false,
			"bPaginate" : false,
			"bScrollInfinite" : true,
			"data" : dataset.data,
			"columns": [
				{	"data": "file_name",
					"title": "Name",
					"render": function ( data, type, full, meta ) {
						return '<span class="fa fa-'+full['file_type']+'"></span><span> '+unescape(data)+'</span>';
					}
				},
				{	"data": "deluxe_badges",
					"render": function ( data, type, full, meta ) {
						var badges = "";
						if(data.is_favorite == true){
							badges+= '<span class="fa fa-star"></span><span></span>';	
						}
						if(hc_does_file_has_share_link(file_sys_view.curr_dir + "/" + full.file_name) ){
							badges+= '<span class="fa fa-link"></span><span></span>';	
						}
						
						if(data.is_encrypted == true){
							badges+= '<span class="fa fa-lock"></span><span></span>';	
						}
						return badges;
					}
				},				
				{ "data": "file_size",
				  "title": "Size",
				  "render" : function ( data, type, full, meta ) {
						if(full['file_type'] == 'hdd-o'){
							var hdd_json = get_drive_hdd_json(full['file_name']);
							var html_progress = '<div class="progress" >'+
								'<div class="progress-bar progress-bar-' +get_current_hdd_danger_level(parseFloat(hdd_json.used_prcntg)) +'" role="progressbar" aria-valuenow="'+hdd_json.used_prcntg.replace("%","")+'" aria-valuemin="0" aria-valuemax="100" style="width:'+hdd_json.used_prcntg+'">'+
								  ( parseFloat(hdd_json.used_prcntg)>=30?(hdd_json.used_prcntg+" " + hdd_json.used +" / " + hdd_json.size):"") + 
								'</div>'+
								(parseFloat(hdd_json.used_prcntg)<30?(hdd_json.used_prcntg+" " + hdd_json.used +" / " + hdd_json.size):"") + 
							  '</div>'
							return html_progress;
						}
						if(full['file_type'] == 'folder-o')
							return '';
						return data;
					}
				},
				{ "data": "file_modified_date",
				  "title": "Last Modified"
				}
			]
		} ).on( 'dblclick', 'tr', function (d) {
			var $this = $(this);
			var row = $this.closest("tr");
			row.find('td:eq(1)');
			
			
			hc_mycloudcontent_handle_doubleclick(row.find('td:first').text());

		} )
		.on( 'contextmenu', 'tr', function (d) {
			var $this = $(this);
			var row = $this.closest("tr");
			row.find('td:eq(1)');
			console.log(row.find('td:first').text());
			var deluxe_badges = row.find('td:nth-child(2)').html() ;
			if(row.find('span:nth-child(1)').hasClass("fa-hdd-o") || row.find('span:nth-child(1)').hasClass("fa-folder-o")){
				// this is a folder, show only appropriate options
				// hid share 
				$("#hc_share").hide();
				$("#hc_download").hide();
			}else{
				$("#hc_share").show();
				$("#hc_download").show();
			}
			// change the add to favorite in the context menu accordingly.
			if(deluxe_badges != undefined && deluxe_badges.indexOf("star") > 0){
				$("#hc_add_to_favorites_a").html($("#hc_add_to_favorites_a").html().replace("Add to Favorites","Remove from Favorites"));
			}else{
				$("#hc_add_to_favorites_a").html($("#hc_add_to_favorites_a").html().replace("Remove from Favorites","Add to Favorites"));
			}
			
			// change the share in the context menu accordingly
			if(hc_does_file_has_share_link(file_sys_view.curr_dir + "/" + row.find('td:first').text().trim())){
				$("#hc_share").html('<i class="fa fa-fw fa-share-alt"></i> Remove Share');
			}else{
				$("#hc_share").html('<i class="fa fa-fw fa-share-alt"></i> Share');
			}
			
			$("#hc_rightclicked_item_filename").text(row.find('td:first').text());
			
			//calculate positions
			var posx = 0;
			var posy = 0;

		  if (!event) var event = window.event;
		  var e = event;
		  // if (e.pageX || e.pageY) {
			// posx = e.pageX;
			// posy = e.pageY;
		  // }
		  
		  // if (e.clientX || e.clientY) {
			// posx = e.clientX + document.body.scrollLeft + 
							   // document.documentElement.scrollLeft;
			// posy = e.clientY + document.body.scrollTop + 
							   // document.documentElement.scrollTop;
		  // }
		posx = e.clientX ;
		posy = e.clientY;
  
			$("#hc_datatable_contectmenu").addClass("open").css({
					// In the right position (the mouse)
					top: posy + "px",
					left: posx + "px"
			});

		} );
	}
	
	/*****************************************************************************************************************/
	function show_menu_item(menu_item_id,main_title,sub_title,wanted_page){

		// Update Title
		$("#hc_main_title").html(main_title + ' <small id="hc_sub_title">' + sub_title + '</small>')

		//Mark relevant menu item
		$("#hc_mycloud_menu_item").removeClass("active");
		$("#hc_settings_menu_item").removeClass("active");
		$("#hc_photos_menu_item").removeClass("active");
		$("#hc_settings_menu_item").removeClass("active");
		$("#hc_dashboard_menu_item").removeClass("active");
		$("#trash_menu_item").removeClass("active");
		$("#hc_music_menu_item").removeClass("active");
		$("#hc_photos_menu_item").removeClass("active");
		$("#hc_recent_menu_item").removeClass("active");
		$("#hc_favorites_menu_item").removeClass("active");
		$("#hc_sharedwithothers_menu_item").removeClass("active");
		$("#hc_sharedwithme_menu_item").removeClass("active");
		$("#").removeClass("active");
		$(menu_item_id).addClass("active");
			
			
		//Show Relevant Page
		$("#hc_mycloud_content_page").hide();
		$("#hc_dashboard_page").hide();
		$(wanted_page).show();
		
		//activate functionalties
		if(wanted_page == "hc_dashboard_page"){
			//queue listener
			//setInterval(hc_get_performance_summary, 3000); 
		}
			
	}
	/*****************************************************************************************************************/
	function hc_share_file_or_folder (){
		var reqbody = {};
		var filename = $("#hc_rightclicked_item_filename").text();
		var filepath = file_sys_view.curr_dir;
		reqbody.file_name = filename;
		reqbody.file_path = filepath;
		if(!hc_does_file_has_share_link(filepath+"/"+filename.trim())){
			reqbody.operation_type = "generate_share_link";
		}else{
			reqbody.operation_type = "remove_share_link";
		}
		
		send_deluxe_operation(reqbody,function(res){
			console.log("received a response" + JSON.stringify(res));
			if(reqbody.operation_type == "remove_share_link" && res.status == 200 ){
				hc_delete_shared_link_from_list(filepath+"/"+filename.trim());
				hc_mycloudcontent_go_to_dir(file_sys_view.curr_dir );
				return;
			}
			if(reqbody.operation_type == "remove_share_link" && res.status != 200 ){
				hc_util_show_error_msg("Share file","Failed to remove share link!");
				return;
			}
			if(reqbody.operation_type == "generate_share_link" && res.status == 200 && res.responseText != null && res.responseText != undefined && res.responseText != ""){
				var home_url = window.location.href;
				home_url = home_url.substring(0,home_url.lastIndexOf("/"));
				bootbox.dialog({
					  message: "The created link is:\n"+
					  '<input id="hc_hash_key" name="name" type="text" value="'+home_url+"/download_shared?"+res.responseText+'" class="form-control input-md"> '
					  ,
					  title: "Share file",
					  buttons: {
						copy: {
						  label: "Copy to clipboard!",
						  className: "btn-success",
						  callback: function() {
								var copyTextarea = document.querySelector('#hc_hash_key');
								copyTextarea.select();
								try {
									var successful = document.execCommand('copy');
									var msg = successful ? 'successful' : 'unsuccessful';
									console.log('Copying text command was ' + msg);
								} catch (err) {
									console.log('Oops, unable to copy');
								}
							//Example.show("great success");
						  }
						}
						
					  }
					});
					file_sys_view.shared_links.push({"shared_filename":filename,"shared_filepath":filepath,"token_key":res.responseText.split("=")[1]});
					hc_mycloudcontent_go_to_dir(file_sys_view.curr_dir );
			}else{
				hc_util_show_error_msg("Share file","Failed to create share link!");
			}
		});	
	}
	/*****************************************************************************************************************/
	function hc_get_performance_summary(){
		hc_utils_send_request_to_server("getperformance","GET","",{},function(response_text,response){
			hc_dashboard_update_data(response.body);
			
		});	
	}
	/*****************************************************************************************************************/
	function hc_delete_file_or_folder(){
		var reqbody = {};
		reqbody.operation_type = "delete_file_or_folder";
		
		send_deluxe_operation(reqbody,function(res){
			console.log("received a response" + JSON.stringify(res));
		});
	}
	/*****************************************************************************************************************/
	function hc_move_file(destination_directory){
		var reqbody = {};
		reqbody.destination_directory = destination_directory;
		reqbody.operation_type = "move_file";
		
		send_deluxe_operation(reqbody,function(res){
			console.log("received a response" + JSON.stringify(res));
		});
	}
	/*****************************************************************************************************************/
	function change_is_favorite(filename,filepath){
		for(var i=0;i<file_sys_view.file_sys_badge.length;i++){
			var element = file_sys_view.file_sys_badge[i];
			if(element.file_name.trim() == filename.trim() && element.file_path == filepath){
				file_sys_view.file_sys_badge[i].is_favorite=file_sys_view.file_sys_badge[i].is_favorite==true?false:true;
				return;
			}
			
		}
		file_sys_view.file_sys_badge.push({"file_name":filename,"file_path":filepath,"is_favorite":true});
	}
	/*****************************************************************************************************************/
	/*
	immidiatly_encrypt = true or false: if true, the file will immidiatly be queued and encrypted. otherwise, it will be encrypted only when there is low load on memory and cpu
	*/
	function hc_encrypt_file(immidiatly_encrypt){
		var reqbody = {};
		reqbody.set_immidiatly_encrypt = immidiatly_encrypt;
		reqbody.operation_type = "encrypt_file";
		
		send_deluxe_operation(reqbody,function(res){
			console.log("received a response" + JSON.stringify(res));
		});
	}
	/*****************************************************************************************************************/
	function hc_add_note_to_file_or_folder(note_to_add){
		var reqbody = {};
		reqbody.operation_type = "add_note_to_file_or_folder";
		reqbody.note = note_to_add;
		
		send_deluxe_operation(reqbody,function(res){
			console.log("received a response" + JSON.stringify(res));
		});
	}
	/*****************************************************************************************************************/
	function hc_add_to_favorites_file_or_folder(){
		console.log("hc_add_to_favorites_file_or_folder");
		var reqbody = {};
		var filename = $("#hc_rightclicked_item_filename").text();
		var filepath = file_sys_view.curr_dir;
		reqbody.file_name = filename;
		reqbody.file_path = filepath;
		reqbody.operation_type = "add_to_favorites";
		send_deluxe_operation(reqbody,function(res){
			console.log("received a response" + JSON.stringify(res));
			if(res.status == 200){
				//hc_util_show_error_msg("Success" , "File was added successfully to favorites ");
				//update the star
				change_is_favorite(filename,filepath);
				hc_mycloudcontent_go_to_dir(file_sys_view.curr_dir);
				
			}else{
				hc_util_show_error_msg("Error" , "Failed to add file to favorites ");
			}
		});
		
	}
	/*****************************************************************************************************************/
	function hc_download_file(){
		var file_name = $("#hc_rightclicked_item_filename").text();
		var filepath = file_sys_view.curr_dir;
		/*this is a file, it should be downloaded*/
		console.log("it is equal and the clicked item is a file");
		//create download req and send it
		var download_req = {};
		download_req.file_name = file_name;
		download_req.file_path = file_sys_view.curr_dir;
		download_req.operation_type = "Download";
		var download_url = "download_file?"+$.param({ "file_name": file_name.trim(),"file_path": filepath }, true);
		console.log("clicked on:"+download_url);
		window.location.href = download_url;
		// hc_utils_send_request_to_server("UploadFile","POST",JSON.stringify(download_req),{"x-file_name":file_name,"x-file_path":file_sys_view.curr_dir,"x-operation_type":"Download"},function(response_text){
			// console.log("received a response" + JSON.stringify(response_text));
		// });		
	}
	/*****************************************************************************************************************/
	/*send deluxe request to the cloud 
	*/
	function send_deluxe_operation(reqbody_json,callback){
		var filename = $("#hc_rightclicked_item_filename").text();
		var filepath = file_sys_view.curr_dir;
		if(filename == "" || filename == null || filename == undefined || filepath == null || filepath == undefined){
			callback("No file is selected.");
			return;
		}
		
		
		hc_utils_send_request_to_server("deluxerequest","POST",JSON.stringify(reqbody_json),{"Content-Type":"application/json"},function(response_text,response){
			callback(response);
		});		
	}
	/*****************************************************************************************************************/
	/*****************************************************************************************************************/
	/*****************************************************************************************************************/
	 
	$(document).ready(function() {
		hc_mycloudcontent_servercall_getCloudContentAndUpdateTable();
		$(".homecloud_username").html(" "+read_cookie('username')+" ");
		
		// enable tooltip on info icons
		$(".hc_info_tooltip").tooltip();
	} );

	/*****************************************************************************************************************/
	  $(document).bind("contextmenu", function (event) {
        // Avoid the real one
        event.preventDefault();
    });
	$(window).blur(function (e) {
        
        // If the clicked element is not the menu
        if ($("#hc_datatable_contectmenu").hasClass("open")) {
            
            // Hide it
			$("#hc_datatable_contectmenu").removeClass("open"); 
            //$(".custom-menu").hide(100);
        }
    });

$(document).click(function (e) {
        
        // If the clicked element is not the menu
        if ($("#hc_datatable_contectmenu").hasClass("open")) {
            
            // Hide it
			$("#hc_datatable_contectmenu").removeClass("open"); 
            //$(".custom-menu").hide(100);
        }
    });
	 // // If the document is clicked somewhere
    // $(document).bind("mousedown", function (e) {
        
        // // If the clicked element is not the menu
        // if ($("#hc_datatable_contectmenu").hasClass("open")) {
            
            // // Hide it
			// $("#hc_datatable_contectmenu").removeClass("open"); 
            // //$(".custom-menu").hide(100);
        // }
    // });
