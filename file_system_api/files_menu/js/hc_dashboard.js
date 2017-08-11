google.charts.load('current', {'packages':['gauge','corechart']});

//the monitor gauge
google.charts.setOnLoadCallback(hc_draw_gauge_cpu_mem_net);
var cpu_mem_graph = [['Seconds', 'CPU', 'Memory']];
var cpu_mem_graph_seconds_axis = 1;
initialize_graphes();

function hc_draw_gauge_cpu_mem_net() {

	var data = google.visualization.arrayToDataTable([
	  ['Label', 'Value'],
	  ['Memory', 80],
	  ['CPU', 55],
	  ['Network', 68]
	]);

	var options = {
	  width: 400, height: 120,
	  redFrom: 90, redTo: 100,
	  yellowFrom:75, yellowTo: 90,
	  minorTicks: 5
	};

	var chart = new google.visualization.Gauge(document.getElementById('hc_dashboard_mem_cpu'));

	chart.draw(data, options);

	setInterval(function() {
		if(!$("#hc_dashboard_menu_item").hasClass("active")){
			return;
		}
		
		hc_utils_send_request_to_server("getperformance","GET","",{},function(response_text,response){
			var used_memory = parseInt(response_text.used_memory, 10);
			var total_ram =parseInt(response_text.total_ram, 10);
			var cpu_prcntg =parseFloat(response_text.cpu_prcntg, 10);
			data.setValue(0, 1, used_memory*100/total_ram);
			data.setValue(1, 1,cpu_prcntg );
			
			
			add_data_to_cpu_mem_graph(response_text);
			
		});	
		chart.draw(data, options);
	}, 3000);
	setInterval(function() {
		chart.draw(data, options);
	}, 5000);
	setInterval(function() {
		data.setValue(2, 1, 60 + Math.round(20 * Math.random()));
		chart.draw(data, options);
	}, 26000);
}

/****************************************************************************************************/

//The cpu graph
google.charts.setOnLoadCallback(hc_draw_graph_mem_cpu_net);
function initialize_graphes(){
	cpu_mem_graph = [['Seconds', 'CPU', 'Memory']];
	cpu_mem_graph_seconds_axis = 1;
	var sec = 0;
	for(i=0;i<30;i++){
		cpu_mem_graph.push([sec.toString(),0,0]);
		sec+=2;
	}
}
function hc_draw_graph_mem_cpu_net() {
	var data = google.visualization.arrayToDataTable(cpu_mem_graph);

	var options = {
		title: 'Cloud Performance',
		hAxis: {minValue: 0,maxValue:30,title: 'Seconds',  titleTextStyle: {color: '#333'}},
		vAxis: {minValue: 0}
	};

	var chart = new google.visualization.SteppedAreaChart(document.getElementById('hc_dashboard_mem_cpu_graph'));
	chart.draw(data, options);
}
/****************************************************************************************************/
function add_data_to_cpu_mem_graph(unit_to_add){
	
	if(cpu_mem_graph_seconds_axis > 30){
		//circulate arr - pop first element
		cpu_mem_graph.shift();
		cpu_mem_graph.shift();
		cpu_mem_graph_seconds_axis--;
		var curr_second = (cpu_mem_graph_seconds_axis-1)*2;

		cpu_mem_graph.push( [curr_second.toString(),parseFloat(unit_to_add.cpu_prcntg),unit_to_add.used_memory*100/unit_to_add.total_ram]);
		cpu_mem_graph_seconds_axis++;
		for(i=0;i<cpu_mem_graph.length;i++){
			(cpu_mem_graph[i])[0]=i*2;
		}
		cpu_mem_graph.unshift(['Seconds', 'CPU', 'Memory']);
		
	}else{
		var curr_second = (cpu_mem_graph_seconds_axis-1)*2;
		cpu_mem_graph[cpu_mem_graph_seconds_axis] = [curr_second.toString(),parseFloat(unit_to_add.cpu_prcntg),unit_to_add.used_memory*100/unit_to_add.total_ram];
		cpu_mem_graph_seconds_axis++;
	}
	hc_draw_graph_mem_cpu_net(); // update the graph
}
/****************************************************************************************************/

//The disk usage graph
google.charts.setOnLoadCallback(hc_draw_graph_disk_usage);

function hc_draw_graph_disk_usage() {
	if(file_sys_view.mounted_drives.length == 0){
		return;
	}
	var disks_data = [['Disk', 'Free', 'Total']];
	// [
        // ['Disk', 'Free space', 'Total Space'],
        // ['Transcend1, 1TB', 50, 70],
        // ['Sandisk, 128MB', 32, 90],
        // ['Samsung 500GB', 12, 30],
        // ['WD, 512MB', 70, 71]
      // ]
	// read drives details
	for(i=0;i<file_sys_view.mounted_drives.length;i++){
		var disk_info = [file_sys_view.mounted_drives[i].mounted_dir+" " +file_sys_view.mounted_drives[i].size
						,get_disk_size_in_bytes(file_sys_view.mounted_drives[i].free)
						,get_disk_size_in_bytes(file_sys_view.mounted_drives[i].size)
						];
		disks_data.push(disk_info);
	}
      var data = google.visualization.arrayToDataTable(disks_data);

      var options = {
        title: 'Cloud space usage',
        chartArea: {width: '50%'},
        hAxis: {
          title: 'Total Usage(GB)',
          minValue: 0
        },
        vAxis: {
          title: 'Disk'
        }
      };

      var chart = new google.visualization.BarChart(document.getElementById('hc_disk_usage_graph'));
      chart.draw(data, options);
    }
/****************************************************************************************************/
function get_disk_size_in_bytes(data){
	if(data == undefined || data == null){
		return 0;
	}
	if(data.toLowerCase().indexOf("g")>0){
		return parseFloat(data);
	}
	if(data.toLowerCase().indexOf("m")>0){
		return parseFloat(data)/1024;
	}
	return 0;
}
/****************************************************************************************************/