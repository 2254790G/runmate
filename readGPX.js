$(document).ready(function() {
	
	//$('#fileinput').change(function () {
		$.ajax({
			type: "GET",
			//url: "gpx/" + $('input[type=file]').val().split('\\').pop(),
			url: "gpx/Lugano.gpx",
			dataType: "xml",
			success: parseXml 
		});
	//});
});

function parseXml(xml) {
	
		mapid.panTo(new L.LatLng(parseFloat($(xml).find("trkpt").first().attr("lat")),parseFloat($(xml).find("trkpt").first().attr("lon"))));

		var distance = 0;
		
		//for graph 
		heartrates = [];

		//for times
		var start = $(xml).find("time").first().text();
		let startDT = new Date(start);
		var end = $(xml).find("time").last().text();
		let endDT = new Date(end);
		let difference = endDT.getTime()-startDT.getTime();
		var hours = Math.floor(difference / 1000 / 60 / 60);
		difference -= hours * 1000 * 60 * 60;
		var minutes = Math.floor(difference / 1000 / 60)


		var avgHeartRate = 0;
		var avgCadence = 0;

		var size = parseInt($(xml).find("trkpt").length);
		
		var lineArray = new Array();

		$(xml).find("trkpt").each(function()
		{
			mapPoint = L.marker([$(this).attr("lat"), $(this).attr("lon")]).addTo(mapid);	

			var array = new Array(parseFloat($(this).attr("lat")),parseFloat($(this).attr("lon")));
			
			lineArray.push(array);

			let dateTime = new Date($(this).find("time").text());

			//for average heart rate
			var heartRate = parseInt($(this).find("ns3\\:hr").text());
			heartrates.push(heartRate);
			avgHeartRate += heartRate;

			//for average cadence
			var cadence = parseInt($(this).find("ns3\\:cad").text());
			avgCadence += cadence; 

			//for distance
			
			var lat1 = parseFloat($(this).attr("lat"));
			var lon1 = parseFloat($(this).attr("lon"));
			var lat2 = parseFloat($(this).next().attr("lat"));
			var lon2 = parseFloat($(this).next().attr("lon"));
			var d = getDistance(lat1,lat2,lon1,lon2);
			
			if (!isNaN(d)) {
				distance += d;
			}

			//for current time on map point
			var hour = dateTime.getHours();
			var mins = dateTime.getMinutes();
			var seconds = dateTime.getSeconds();

			if(mins<10) 
				minuteString = "0"+mins+"";
			else
				minuteString = mins;
			
			if (seconds<10)
				secondString = "0"+seconds+"";
			else
				secondString = seconds;
			
			var time = hour + ":" + minuteString + ":" + secondString;
			
			mapPoint.bindPopup("Time: " + time + "</br> Distance ran from start point: " + distance.toFixed(2) + " miles </br> </br> Heart Rate: " + heartRate + " beats per min </br> Cadence: " + cadence + " steps per min </br> Elevation: " + parseFloat($(this).find("ele").text()).toFixed(1) + "ft");
		
		});

		//for graph
		var label = [];
		for (i = 0; i < size; i++) {
			label.push("track point: " + i);
		}
		
		plotHeartRate(heartrates, label);
		document.getElementById("heartrate").innerHTML = '<canvas id="heartrateChart" width="1050" height="600"></canvas>';

		var averageHR = avgHeartRate / size;
		var averageC = avgCadence / size; 
		
		var pace = minutes / distance; 
		
		$("#distanceRan").append("Distance ran: " + parseFloat(distance).toFixed(2) + " miles");
		$("#duration").append("Duration of run: " + minutes + " minutes");
		$("#averageHeartRate").append("Average heartrate: " + averageHR.toFixed(0) + " beats per minute");
		$("#averageCadence").append("Average cadence: " + averageC.toFixed(0) + " steps per minute");
		$("#averagePace").append("Average pace: " + pace.toFixed(2) + " minutes per mile");
				
		var multiPolyLineOptions = {color:'orange'};
		var polyline = L.polyline(lineArray, multiPolyLineOptions);
		polyline.addTo(mapid);
	}, 
	
};

function plotHeartRate(hr, labels) {
	var heartRateGraph = document.getElementById("heartrategraph");
	
	var plot = new Chart(heartRateGraph, {
		type: 'line',
		data: {
			labels: label,
			datasets: [{
				label: "Heart Rate",
				data: hr,
				borderColor: "#FFC46A",
				borderWidth: 1,
				fill: false,
			}],
		},
		options: {
			elements: {
				point: {
					radius: 0
				}
			},
			scales: {
				xAxes: [{
					display: false
				}],
				yAxes: [{
					scaleLabel: {
						display: true;
						labelString: 'Heart Rate'
					}
				}]
			}
		}
	});
}

function getDistance(lat1, lat2, lon1, lon2) {
	var lat1 = toRadian(lat1);
	var lat2 = toRadian(lat2);
	var lon1 = toRadian(lon1);
	var lon2 = toRadian(lon2);
	
	var deltaLat = lat2 - lat1;
	var deltaLon = lon2 - lon1;
	
	var a = Math.pow(Math.sin(deltaLat/2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon/2), 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var EARTH_RADIUS = 6371;
	return c * EARTH_RADIUS;

};

function toRadian(degree) {
		return degree*Math.PI/180;
};